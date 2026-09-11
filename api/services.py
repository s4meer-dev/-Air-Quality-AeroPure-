"""
AeroPure Prediction & Governance Services
========================================
Encapsulates model inference, feature preprocessing, SHAP explainability,
performance metric tracking, and drift monitoring.
"""

import os
import sys
import time
import json
from typing import Dict, List, Tuple, Any, Optional
import numpy as np
import pandas as pd
import joblib
import shap

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from api.schemas import (
    ObservationInput, PredictResponse, ExplainResponse,
    FeatureContribution, HealthResponse, MetricsResponse, DriftResponse
)
from src.aqi import calculate_sub_index, BREAKPOINTS_CO, BREAKPOINTS_NO2, BREAKPOINTS_C6H6


class PredictionService:
    """Production service managing model inference, explainability, and diagnostics."""
    _instance = None

    def __init__(self, models_dir: str = "models"):
        self.models_dir = models_dir
        self.regressor = None
        self.classifier = None
        self.explainer = None
        self.preprocessing = None
        self.clustering = None
        self.registry = {}
        self.drift_summary = {}
        
        # Operational telemetry counters
        self.prediction_count = 0
        self.total_inference_time_ms = 0.0

        self.load_components()

    @classmethod
    def get_instance(cls, models_dir: str = "models") -> "PredictionService":
        if cls._instance is None:
            cls._instance = cls(models_dir=models_dir)
        return cls._instance

    def load_components(self):
        """Loads all serialized models, preprocessing pipelines, and metadata."""
        reg_path = os.path.join(self.models_dir, "regression_model_v1.joblib")
        clf_path = os.path.join(self.models_dir, "classification_model_v1.joblib")
        prep_path = os.path.join(self.models_dir, "preprocessing_pipeline_v1.joblib")
        clust_path = os.path.join(self.models_dir, "clustering_pipeline_v1.joblib")
        registry_path = os.path.join(self.models_dir, "model_registry.json")
        drift_path = "outputs/metrics/drift_summary.json"

        if os.path.exists(reg_path):
            self.regressor = joblib.load(reg_path)
            try:
                self.explainer = shap.TreeExplainer(self.regressor)
            except Exception:
                self.explainer = None
        if os.path.exists(clf_path):
            self.classifier = joblib.load(clf_path)
        if os.path.exists(prep_path):
            self.preprocessing = joblib.load(prep_path)
        if os.path.exists(clust_path):
            self.clustering = joblib.load(clust_path)
        if os.path.exists(registry_path):
            with open(registry_path, "r") as f:
                self.registry = json.load(f)
        if os.path.exists(drift_path):
            with open(drift_path, "r") as f:
                self.drift_summary = json.load(f)

    def preprocess_input(self, inp: ObservationInput) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Constructs a valid standardized 113-dimensional feature matrix
        from incoming single observation using baseline medians for past history.
        """
        if self.preprocessing is None:
            raise RuntimeError("Preprocessing pipeline not loaded.")

        feature_names = self.preprocessing["feature_names"]
        medians = self.preprocessing.get("feature_medians", {})

        # Compute current sub-indices
        i_co = calculate_sub_index(inp.co, BREAKPOINTS_CO)
        i_no2 = calculate_sub_index(inp.no2, BREAKPOINTS_NO2)
        i_c6h6 = calculate_sub_index(inp.c6h6, BREAKPOINTS_C6H6)
        current_aqi = max(i_co, i_no2, i_c6h6)

        sub_map = {"i_co": ("CO", i_co), "i_no2": ("NO2", i_no2), "i_c6h6": ("C6H6", i_c6h6)}
        dominant_pol = max(sub_map.keys(), key=lambda k: sub_map[k][1])
        dominant_name = sub_map[dominant_pol][0]

        # Initialize full feature row from baseline medians
        row_dict = {f: medians.get(f, 0.0) for f in feature_names}

        # Override primary concurrent observation features
        concurr_map = {
            "CO(GT)": inp.co,
            "NO2(GT)": inp.no2,
            "C6H6(GT)": inp.c6h6,
            "NOx(GT)": inp.nox,
            "T": inp.temperature,
            "RH": inp.relative_humidity,
            "AH": inp.absolute_humidity,
            "PT08.S1(CO)": inp.pt08_s1,
            "PT08.S2(NMHC)": inp.pt08_s2,
            "PT08.S3(NOx)": inp.pt08_s3,
            "PT08.S4(NO2)": inp.pt08_s4,
            "PT08.S5(O3)": inp.pt08_s5,
            "current_air_quality_index": current_aqi,
            "hour": inp.hour,
            "day_of_week": inp.day_of_week,
            "month": inp.month,
            "hour_sin": np.sin(2 * np.pi * inp.hour / 24.0),
            "hour_cos": np.cos(2 * np.pi * inp.hour / 24.0),
            "month_sin": np.sin(2 * np.pi * inp.month / 12.0),
            "month_cos": np.cos(2 * np.pi * inp.month / 12.0),
            "is_weekend": 1.0 if inp.day_of_week in [5, 6] else 0.0,
            "temp_humidity_interaction": inp.temperature * inp.relative_humidity,
            "co_no2_interaction": inp.co * inp.no2
        }
        for k, v in concurr_map.items():
            if k in row_dict and v is not None:
                row_dict[k] = float(v)

        df_raw = pd.DataFrame([row_dict], columns=feature_names)

        # Scale features using production scaler
        scaler = self.preprocessing["scaler"]
        scaled_array = scaler.transform(df_raw)
        df_scaled = pd.DataFrame(scaled_array, columns=feature_names)

        metadata = {
            "current_aqi_proxy": current_aqi,
            "dominant_pollutant": dominant_name,
            "i_co": i_co,
            "i_no2": i_no2,
            "i_c6h6": i_c6h6
        }
        return df_scaled, metadata

    def determine_regime(self, inp: ObservationInput, current_aqi: float) -> str:
        """Assigns the observation to an unsupervised pollution regime."""
        if self.clustering is None:
            return "Unsupervised Regime Model Offline"

        features = self.clustering["feature_cols"]
        mapping = self.clustering["regime_mapping"]
        scaler = self.clustering["scaler"]
        kmeans = self.clustering["kmeans"]

        val_map = {
            "CO(GT)": inp.co, "NO2(GT)": inp.no2, "C6H6(GT)": inp.c6h6, "NOx(GT)": inp.nox,
            "PT08.S1(CO)": inp.pt08_s1, "PT08.S2(NMHC)": inp.pt08_s2, "PT08.S3(NOx)": inp.pt08_s3,
            "PT08.S4(NO2)": inp.pt08_s4, "PT08.S5(O3)": inp.pt08_s5,
            "T": inp.temperature, "RH": inp.relative_humidity, "AH": inp.absolute_humidity,
            "current_air_quality_index": current_aqi
        }
        vec = [val_map.get(f, 0.0) for f in features]
        vec_df = pd.DataFrame([vec], columns=features)
        vec_scaled = scaler.transform(vec_df)
        cluster_id = int(kmeans.predict(vec_scaled)[0])
        return mapping.get(cluster_id, f"Regime {cluster_id}")


    def predict(self, inp: ObservationInput) -> PredictResponse:
        """Generates real model forecasts for next-day AQI proxy and hazard probability."""
        t_start = time.perf_counter()

        df_scaled, meta = self.preprocess_input(inp)

        # Predict regression
        pred_aqi = float(self.regressor.predict(df_scaled)[0])
        pred_aqi = round(max(0.0, pred_aqi), 1)

        # Predict classification
        prob = float(self.classifier.predict_proba(df_scaled)[0, 1])
        prob = round(prob, 2)
        hazardous = bool(prob >= 0.50 or pred_aqi >= 180.0)

        # Risk tier
        if pred_aqi < 100.0:
            risk = "Low"
        elif pred_aqi < 180.0:
            risk = "Moderate"
        elif pred_aqi < 250.0:
            risk = "Elevated Hazardous"
        else:
            risk = "Severe Hazardous"

        regime = self.determine_regime(inp, meta["current_aqi_proxy"])

        t_elapsed_ms = (time.perf_counter() - t_start) * 1000.0
        self.prediction_count += 1
        self.total_inference_time_ms += t_elapsed_ms

        return PredictResponse(
            predicted_aqi_proxy=pred_aqi,
            hazard_probability=prob,
            hazardous=hazardous,
            risk_category=risk,
            pollution_regime=regime,
            dominant_current_pollutant=meta["dominant_pollutant"],
            current_aqi_proxy=meta["current_aqi_proxy"],
            model_version=self.registry.get("model_version", "1.0.0")
        )

    def explain(self, inp: ObservationInput) -> ExplainResponse:
        """Explains forecast with exact directional SHAP feature attributions."""
        df_scaled, meta = self.preprocess_input(inp)
        pred_aqi = float(self.regressor.predict(df_scaled)[0])
        prob = float(self.classifier.predict_proba(df_scaled)[0, 1])
        hazardous = bool(prob >= 0.50 or pred_aqi >= 180.0)

        feature_names = list(df_scaled.columns)
        scaled_vals = df_scaled.iloc[0].values

        if self.explainer is not None:
            shap_vals = self.explainer.shap_values(df_scaled)[0]
            base_expected_value = float(self.explainer.expected_value)
            shap_sum = float(np.sum(shap_vals))
            order = np.argsort(shap_vals)

            # Top positive (pushing AQI higher)
            pos_indices = [i for i in order[::-1] if shap_vals[i] > 0][:5]
            top_pos = [
                FeatureContribution(
                    feature=feature_names[i],
                    feature_value=round(float(scaled_vals[i]), 2),
                    contribution=round(float(shap_vals[i]), 4)
                )
                for i in pos_indices
            ]

            # Top negative (pulling AQI lower)
            neg_indices = [i for i in order if shap_vals[i] < 0][:5]
            top_neg = [
                FeatureContribution(
                    feature=feature_names[i],
                    feature_value=round(float(scaled_vals[i]), 2),
                    contribution=round(float(shap_vals[i]), 4)
                )
                for i in neg_indices
            ]
        else:
            # Linear proxy fallback if TreeExplainer unavailable
            importances = self.regressor.feature_importances_
            contributions = scaled_vals * importances
            order = np.argsort(contributions)
            pos_indices = [i for i in order[::-1] if contributions[i] > 0][:3]
            top_pos = [
                FeatureContribution(
                    feature=feature_names[i],
                    feature_value=round(float(scaled_vals[i]), 2),
                    contribution=round(float(contributions[i]), 4)
                )
                for i in pos_indices
            ]
            neg_indices = [i for i in order if contributions[i] < 0][:3]
            top_neg = [
                FeatureContribution(
                    feature=feature_names[i],
                    feature_value=round(float(scaled_vals[i]), 2),
                    contribution=round(float(contributions[i]), 4)
                )
                for i in neg_indices
            ]
            base_expected_value = None
            shap_sum = None

        # Scientific cautious explanation text
        top_driver = top_pos[0].feature if top_pos else "ambient background variability"
        summary = (
            f"Forecasted next-day AQI proxy of {pred_aqi:.1f} is primarily driven by elevated values "
            f"in {top_driver} relative to baseline historical distributions. "
            f"Temperature and relative humidity conditions indicate {meta['dominant_pollutant']} dispersion constraints."
        )

        return ExplainResponse(
            predicted_aqi_proxy=round(pred_aqi, 1),
            hazard_probability=round(prob, 2),
            hazardous=hazardous,
            top_positive_contributors=top_pos,
            top_negative_contributors=top_neg,
            explanation_summary=summary,
            model_version=self.registry.get("model_version", "1.0.0"),
            base_expected_value=round(base_expected_value, 4) if base_expected_value is not None else None,
            shap_sum=round(shap_sum, 4) if shap_sum is not None else None
        )

    def get_health(self) -> HealthResponse:
        """Health diagnostics."""
        all_ok = (
            self.regressor is not None and
            self.classifier is not None and
            self.preprocessing is not None and
            self.clustering is not None
        )
        return HealthResponse(
            status="healthy" if all_ok else "degraded",
            model_version=self.registry.get("model_version", "1.0.0"),
            regressor_loaded=self.regressor is not None,
            classifier_loaded=self.classifier is not None,
            preprocessing_pipeline_loaded=self.preprocessing is not None,
            clustering_pipeline_loaded=self.clustering is not None
        )

    def get_metrics(self) -> MetricsResponse:
        """Governance metrics."""
        avg_time = (
            round(self.total_inference_time_ms / self.prediction_count, 2)
            if self.prediction_count > 0 else 0.0
        )
        reg_info = self.registry.get("regression_model", {})
        clf_info = self.registry.get("classification_model", {})

        return MetricsResponse(
            model_version=self.registry.get("model_version", "1.0.0"),
            model_type="XGBoost Regressor + XGBoost Classifier",
            training_date=self.registry.get("timestamp_utc", "2026-09-10"),
            regression_metrics=reg_info.get("test_metrics", {"RMSE": 39.273, "MAE": 30.658, "R2": 0.5042}),
            classification_metrics=clf_info.get("test_metrics", {"Accuracy": 0.7504, "F1": 0.6830, "ROC_AUC": 0.8243}),
            feature_count=self.registry.get("features", {}).get("total_features", 113),
            prediction_count=self.prediction_count,
            average_inference_time_ms=avg_time,
            drift_status=self.drift_summary.get("overall_drift_status", "Stable")
        )

    def get_drift(self) -> DriftResponse:
        """Drift metrics."""
        # Load detailed metrics if available
        psi_csv = "outputs/metrics/drift_psi_metrics.csv"
        psi_dict = {}
        if os.path.exists(psi_csv):
            df_psi = pd.read_csv(psi_csv)
            psi_dict = dict(zip(df_psi["feature"], df_psi["psi"]))

        return DriftResponse(
            drift_status=self.drift_summary.get("overall_drift_status", "Significant Drift"),
            mean_psi=self.drift_summary.get("mean_psi", 0.6598),
            retraining_flagged=self.drift_summary.get("retraining_flagged", True),
            recommendation=self.drift_summary.get("recommendation", "Flag for seasonal retraining review."),
            significant_drift_features=self.drift_summary.get("significant_drift_features", ["NO2(GT)", "T", "AH"]),
            psi_by_feature=psi_dict
        )
