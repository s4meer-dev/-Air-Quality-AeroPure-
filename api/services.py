"""
AeroPure Prediction & Governance Services
========================================
Encapsulates model inference, feature preprocessing, SHAP explainability,
performance metric tracking, and drift monitoring.

Feature parity
--------------
Online features are produced by `src.feature_engineering.build_feature_matrix`, the same function
used to build the training matrix. A request is expanded into an hourly history frame (real
`history` readings when supplied, otherwise a steady-state assumption at the current reading) and the
newest row of the resulting feature matrix is scored. This guarantees the served feature names,
order and definitions always match what the model was trained on.
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
from src.aqi import (
    calculate_observation_aqi_proxy, calculate_pollutant_index_proxy,
    get_aqi_risk_category, PROJECT_HAZARD_THRESHOLD
)
from src.feature_engineering import build_feature_matrix, LEAD_TIME_HOURS
from src.preprocessing import STALENESS_GROUPS


PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

Z_80 = 1.2816  # two-sided 80% normal interval half-width in sigmas
DEFAULT_HISTORY_HOURS = 169

# Request field -> training-data column
SENSOR_COLUMNS: Dict[str, str] = {
    "co": "CO(GT)", "no2": "NO2(GT)", "c6h6": "C6H6(GT)", "nox": "NOx(GT)",
    "temperature": "T", "relative_humidity": "RH", "absolute_humidity": "AH",
    "pt08_s1": "PT08.S1(CO)", "pt08_s2": "PT08.S2(NMHC)", "pt08_s3": "PT08.S3(NOx)",
    "pt08_s4": "PT08.S4(NO2)", "pt08_s5": "PT08.S5(O3)",
}


def reference_timestamp(hour: int, day_of_week: int, month: int) -> pd.Timestamp:
    """A real calendar timestamp with the requested month, weekday and hour (year is arbitrary)."""
    first = pd.Timestamp(year=2025, month=month, day=1)
    days_to_weekday = (day_of_week - first.dayofweek) % 7
    return first + pd.Timedelta(days=days_to_weekday + 7, hours=hour)


class PredictionService:
    """Production service managing model inference, explainability, and diagnostics."""
    _instance = None

    def __init__(self, models_dir: Optional[str] = None):
        if models_dir is None:
            models_dir = "models" if os.path.exists("models") else os.path.join(PROJECT_ROOT, "models")
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
    def get_instance(cls, models_dir: Optional[str] = None) -> "PredictionService":
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

        drift_candidates = [
            "outputs/metrics/drift_summary.json",
            os.path.join(PROJECT_ROOT, "outputs", "metrics", "drift_summary.json")
        ]
        drift_path = next((p for p in drift_candidates if os.path.exists(p)), drift_candidates[0])

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

    # ------------------------------------------------------------------ feature construction
    def _reading_row(self, reading: Any, medians: Dict[str, float]) -> Dict[str, float]:
        """One request/history reading as a training-schema row; explicit nulls fall back to training medians."""
        row = {}
        for field, column in SENSOR_COLUMNS.items():
            value = getattr(reading, field, None)
            row[column] = float(value) if value is not None else float(medians.get(column, 0.0))
        return row

    def _history_frame(self, inp: ObservationInput) -> pd.DataFrame:
        """Hourly frame ending at the request time: real history where supplied, steady-state elsewhere."""
        medians = self.preprocessing.get("feature_medians", {})
        n_rows = int(self.preprocessing.get("required_history_hours", DEFAULT_HISTORY_HOURS))

        supplied = list(inp.history or [])[-(n_rows - 1):]
        readings = supplied + [inp]
        # Hours older than the supplied history are assumed to match the oldest known reading.
        readings = [readings[0]] * (n_rows - len(readings)) + readings

        end = reference_timestamp(inp.hour, inp.day_of_week, inp.month)
        frame = pd.DataFrame([self._reading_row(r, medians) for r in readings])
        frame["datetime"] = pd.date_range(end=end, periods=n_rows, freq="h")

        # Every supplied reading is a live measurement, so nothing is stale or carried forward.
        frame["criteria_observed"] = 1
        for stale_col in STALENESS_GROUPS:
            frame[stale_col] = 0.0
        return calculate_pollutant_index_proxy(frame)

    def preprocess_input(self, inp: ObservationInput) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Builds the model's standardized feature row for the newest observation using the training
        feature pipeline. Returns (scaled_features, metadata); the unscaled row is in metadata["raw_features"].
        """
        if self.preprocessing is None:
            raise RuntimeError("Preprocessing pipeline not loaded.")

        feature_names = self.preprocessing["feature_names"]
        medians = self.preprocessing.get("feature_medians", {})

        current_aqi, dominant_name, sub_indices = calculate_observation_aqi_proxy(inp.co, inp.no2, inp.c6h6)

        features = build_feature_matrix(self._history_frame(inp), LEAD_TIME_HOURS)
        df_raw = features.iloc[[-1]].reindex(columns=feature_names)
        # Any feature undefined at this point falls back to its training median.
        df_raw = df_raw.fillna(pd.Series(medians)).astype(float).reset_index(drop=True)

        scaler = self.preprocessing["scaler"]
        df_scaled = pd.DataFrame(scaler.transform(df_raw), columns=feature_names)

        metadata = {
            "current_aqi_proxy": current_aqi,
            "dominant_pollutant": dominant_name,
            "i_co": sub_indices["i_co"],
            "i_no2": sub_indices["i_no2"],
            "i_c6h6": sub_indices["i_c6h6"],
            "raw_features": df_raw.iloc[0],
            "history_hours_used": len(inp.history or []),
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
        # A missing optional input falls back to the clustering training mean (i.e. no evidence either way).
        vec = [
            val_map[f] if val_map.get(f) is not None else float(scaler.mean_[i])
            for i, f in enumerate(features)
        ]
        vec_df = pd.DataFrame([vec], columns=features)
        vec_scaled = scaler.transform(vec_df)
        cluster_id = int(kmeans.predict(vec_scaled)[0])
        return mapping.get(cluster_id, f"Regime {cluster_id}")

    def _score(self, df_scaled: pd.DataFrame) -> Tuple[float, float, bool]:
        """(forecast AQI, hazard probability, hazard alert) for one standardized feature row."""
        pred_aqi = round(max(0.0, float(self.regressor.predict(df_scaled)[0])), 1)
        prob = float(self.classifier.predict_proba(df_scaled)[0, 1])
        alert_threshold = float(getattr(self.classifier, "alert_threshold", 0.5))
        return pred_aqi, prob, bool(prob >= alert_threshold)

    def predict(self, inp: ObservationInput) -> PredictResponse:
        """Generates real model forecasts for next-day AQI proxy and hazard probability."""
        t_start = time.perf_counter()

        df_scaled, meta = self.preprocess_input(inp)
        pred_aqi, prob, hazardous = self._score(df_scaled)

        # Authoritative project risk tier classification
        risk = get_aqi_risk_category(pred_aqi)
        hazard_status = "ELEVATED HAZARD" if hazardous else "NOMINAL"

        regime = self.determine_regime(inp, meta["current_aqi_proxy"])

        sigma = getattr(self.classifier, "residual_sigma", None)
        low = round(max(0.0, pred_aqi - Z_80 * sigma), 1) if sigma else None
        high = round(pred_aqi + Z_80 * sigma, 1) if sigma else None

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
            model_version=self.registry.get("model_version", "unknown"),
            aqi_proxy=pred_aqi,
            aqi_proxy_category=risk,
            hazard_threshold=PROJECT_HAZARD_THRESHOLD,
            hazard_status=hazard_status,
            hazard_alert_threshold=getattr(self.classifier, "alert_threshold", None),
            predicted_aqi_low=low,
            predicted_aqi_high=high,
            history_hours_used=meta["history_hours_used"],
        )

    def _contribution(self, feature_names: List[str], raw_values: pd.Series, values: np.ndarray, i: int) -> FeatureContribution:
        return FeatureContribution(
            feature=feature_names[i],
            feature_value=round(float(raw_values.iloc[i]), 3),
            contribution=round(float(values[i]), 4)
        )

    def explain(self, inp: ObservationInput) -> ExplainResponse:
        """Explains forecast with exact directional SHAP feature attributions."""
        df_scaled, meta = self.preprocess_input(inp)
        pred_aqi, prob, hazardous = self._score(df_scaled)

        feature_names = list(df_scaled.columns)
        raw_values = meta["raw_features"]

        if self.explainer is not None:
            shap_vals = np.asarray(self.explainer.shap_values(df_scaled))[0]
            base_expected_value = float(np.ravel(self.explainer.expected_value)[0])
            shap_sum = float(np.sum(shap_vals))
            contributions = shap_vals
            n_top = 5
        else:
            # Importance-weighted fallback if TreeExplainer is unavailable
            contributions = df_scaled.iloc[0].values * self.regressor.feature_importances_
            base_expected_value = None
            shap_sum = None
            n_top = 3

        order = np.argsort(contributions)
        top_pos = [self._contribution(feature_names, raw_values, contributions, i)
                   for i in [i for i in order[::-1] if contributions[i] > 0][:n_top]]
        top_neg = [self._contribution(feature_names, raw_values, contributions, i)
                   for i in [i for i in order if contributions[i] < 0][:n_top]]

        # Scientific cautious explanation text
        top_driver = top_pos[0].feature if top_pos else "ambient background variability"
        summary = (
            f"Forecasted next-day AQI proxy of {pred_aqi:.1f} reflects top positive model contributions "
            f"from {top_driver} relative to baseline historical distributions. "
            f"SHAP values quantify directional model feature contributions, not physical atmospheric causality."
        )

        return ExplainResponse(
            predicted_aqi_proxy=round(pred_aqi, 1),
            hazard_probability=round(prob, 2),
            hazardous=hazardous,
            top_positive_contributors=top_pos,
            top_negative_contributors=top_neg,
            explanation_summary=summary,
            model_version=self.registry.get("model_version", "unknown"),
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
            model_version=self.registry.get("model_version", "unknown"),
            regressor_loaded=self.regressor is not None,
            classifier_loaded=self.classifier is not None,
            preprocessing_pipeline_loaded=self.preprocessing is not None,
            clustering_pipeline_loaded=self.clustering is not None
        )

    def get_metrics(self) -> MetricsResponse:
        """Governance metrics, all read from the registry written by the training pipeline."""
        avg_time = (
            round(self.total_inference_time_ms / self.prediction_count, 2)
            if self.prediction_count > 0 else 0.0
        )
        reg_info = self.registry.get("regression_model", {})
        clf_info = self.registry.get("classification_model", {})
        n_features = self.registry.get("features", {}).get("total_features")
        if n_features is None and self.preprocessing is not None:
            n_features = len(self.preprocessing["feature_names"])

        return MetricsResponse(
            model_version=self.registry.get("model_version", "unknown"),
            model_type=f"{reg_info.get('model_type', 'XGBoost Regressor')} + "
                       f"{clf_info.get('model_type', 'Hazard Classifier')}",
            training_date=self.registry.get("timestamp_utc", "unknown"),
            regression_metrics=reg_info.get("test_metrics", {}),
            classification_metrics=clf_info.get("test_metrics", {}),
            feature_count=int(n_features or 0),
            prediction_count=self.prediction_count,
            average_inference_time_ms=avg_time,
            drift_status=self.drift_summary.get("overall_drift_status", "Unknown")
        )

    def get_drift(self) -> DriftResponse:
        """Drift metrics."""
        # Load detailed metrics if available
        psi_candidates = [
            "outputs/metrics/drift_psi_metrics.csv",
            os.path.join(PROJECT_ROOT, "outputs", "metrics", "drift_psi_metrics.csv")
        ]
        psi_csv = next((p for p in psi_candidates if os.path.exists(p)), psi_candidates[0])
        psi_dict = {}
        if os.path.exists(psi_csv):
            df_psi = pd.read_csv(psi_csv)
            psi_dict = dict(zip(df_psi["feature"], df_psi["psi"]))

        has_report = bool(self.drift_summary)
        return DriftResponse(
            drift_status=self.drift_summary.get("overall_drift_status", "Unknown"),
            mean_psi=self.drift_summary.get("mean_psi", 0.0),
            retraining_flagged=self.drift_summary.get("retraining_flagged", False),
            recommendation=self.drift_summary.get(
                "recommendation",
                "Drift report unavailable; run the training pipeline to generate it." if not has_report
                else "No recommendation recorded."
            ),
            significant_drift_features=self.drift_summary.get("significant_drift_features", []),
            psi_by_feature=psi_dict
        )
