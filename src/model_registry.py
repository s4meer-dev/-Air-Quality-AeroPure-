"""
AeroPure Week 11: Production Model Registry & Packaging
======================================================
Manages versioned model artifacts, end-to-end preprocessing pipelines,
clustering artifacts, and comprehensive governance metadata.

Deployment protocol
-------------------
Held-out metrics in the registry come from models fit on the chronological TRAINING split only and
scored once on the untouched test split. The deployed artifacts are then refit on ALL observed data
with identical hyperparameters (the standard "refit on full data" step). This matters here: the
training split ends in autumn, so the test-period winter regime is otherwise never seen by the
model that serves live forecasts.
"""

import os
import sys
import json
import datetime
from typing import Dict, Any, Optional
import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from xgboost import XGBRegressor

from src.aqi import PROJECT_HAZARD_THRESHOLD
from src.feature_engineering import (
    get_feature_columns, prepare_time_series_splits,
    AQI_LAGS, POLLUTANT_LAGS, ROLLING_WINDOWS, LONG_ROLLING_WINDOWS, LEAD_TIME_HOURS
)
from src.hazard_model import fit_hazard_model
from src.regression import CHAMPION_XGB_REGRESSOR_PARAMS
from src.classification import CHAMPION_XGB_CLASSIFIER_PARAMS

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


MODEL_VERSION = "2.0.0"
DATASET_NAME = "Archive 1 (AirQuality.csv)"
CHAMPION_REGRESSOR_NAME = "XGBoost"
CHAMPION_CLASSIFIER_NAME = "AeroPure Hybrid Hazard Model"

# Longest look-back any feature needs (in hourly rows) before the newest observation.
REQUIRED_HISTORY_HOURS = max(max(AQI_LAGS), max(LONG_ROLLING_WINDOWS)) + 1


def _leaderboard_row(csv_path: str, model_name: str) -> Optional[Dict[str, float]]:
    """Reads one model's held-out metrics from a leaderboard CSV; None if unavailable."""
    if not os.path.exists(csv_path):
        return None
    table = pd.read_csv(csv_path)
    row = table[table["Model"] == model_name]
    if row.empty:
        return None
    return {
        k: float(v) for k, v in row.iloc[0].items()
        if k != "Model" and isinstance(v, (int, float, np.number)) and not pd.isna(v)
    }


def package_production_artifacts(
    models_dir: str = "models",
    metrics_dir: str = "outputs/metrics",
    processed_path: str = "data/processed_data.csv"
) -> Dict[str, Any]:
    """
    Refits the champions on all observed data and packages canonical production artifacts:
    - models/regression_model_v1.joblib      (XGBoost regressor)
    - models/classification_model_v1.joblib  (HazardProbabilityModel, sklearn-style predict_proba)
    - models/preprocessing_pipeline_v1.joblib
    - models/clustering_pipeline_v1.joblib   (written earlier by Week 9)
    - models/model_registry.json
    (File names keep the `_v1` suffix so existing loaders continue to work; the release version
    lives in `model_registry.json`.)
    """
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(metrics_dir, exist_ok=True)

    if not os.path.exists(processed_path):
        raise FileNotFoundError(f"Processed feature matrix '{processed_path}' not found. Run the pipeline first.")

    df = pd.read_csv(processed_path, parse_dates=["datetime"])
    feature_cols = get_feature_columns(df)
    y_reg = df["next_day_air_quality_index"]
    y_clf = df["hazardous_air_day"]

    # Split sizes reflect the protocol used for the held-out evaluation.
    X_tr, X_te, *_ = prepare_time_series_splits(df, feature_cols=feature_cols)

    # ---- Deployment refit on all observed data --------------------------------------------------
    scaler = StandardScaler().fit(df[feature_cols])
    X_all = pd.DataFrame(scaler.transform(df[feature_cols]), columns=feature_cols, index=df.index)

    xgb_reg = XGBRegressor(**CHAMPION_XGB_REGRESSOR_PARAMS, random_state=42, n_jobs=-1).fit(X_all, y_reg)
    hazard_model, hazard_diag = fit_hazard_model(
        X_all, y_reg, y_clf, hazard_threshold=PROJECT_HAZARD_THRESHOLD, regressor=xgb_reg
    )

    reg_v1_path = os.path.join(models_dir, "regression_model_v1.joblib")
    clf_v1_path = os.path.join(models_dir, "classification_model_v1.joblib")
    joblib.dump(xgb_reg, reg_v1_path)
    joblib.dump(hazard_model, clf_v1_path)

    preprocessing_pipeline = {
        "version": MODEL_VERSION,
        "scaler": scaler,
        "feature_names": feature_cols,
        "feature_count": len(feature_cols),
        "feature_medians": df[feature_cols].median().to_dict(),
        "lead_time_hours": LEAD_TIME_HOURS,
        "hazard_threshold": PROJECT_HAZARD_THRESHOLD,
        "hazard_alert_threshold": hazard_model.alert_threshold,
        "residual_sigma": hazard_model.residual_sigma,
        "criteria_pollutants": ["CO(GT)", "NO2(GT)", "C6H6(GT)"],
        "sensor_features": ["PT08.S1(CO)", "PT08.S2(NMHC)", "PT08.S3(NOx)", "PT08.S4(NO2)", "PT08.S5(O3)"],
        "weather_features": ["T", "RH", "AH"],
        "aqi_lag_hours": AQI_LAGS,
        "pollutant_lag_hours": POLLUTANT_LAGS,
        "rolling_windows": ROLLING_WINDOWS + LONG_ROLLING_WINDOWS,
        "required_history_hours": REQUIRED_HISTORY_HOURS,
    }
    prep_v1_path = os.path.join(models_dir, "preprocessing_pipeline_v1.joblib")
    joblib.dump(preprocessing_pipeline, prep_v1_path)

    # ---- Held-out metrics: read from the real leaderboards, never hardcoded ---------------------
    reg_metrics = _leaderboard_row(os.path.join(metrics_dir, "regression_leaderboard.csv"), CHAMPION_REGRESSOR_NAME)
    clf_metrics = _leaderboard_row(os.path.join(metrics_dir, "classification_leaderboard.csv"), CHAMPION_CLASSIFIER_NAME)

    clust_path = os.path.join(models_dir, "clustering_pipeline_v1.joblib")
    regimes = {}
    clustering_method = "K-Means (k=3) + PCA + DBSCAN"
    if os.path.exists(clust_path):
        regimes = {str(k): v for k, v in joblib.load(clust_path)["regime_mapping"].items()}

    registry = {
        "model_version": MODEL_VERSION,
        "release_tag": f"AeroPure-v{MODEL_VERSION}-Production",
        "timestamp_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "dataset": {
            "name": DATASET_NAME,
            "provenance": "Hourly field sensor recordings from an Italian city monitoring station (CNR-IIA)",
            "total_samples": int(len(df)),
            "train_samples": int(len(X_tr)),
            "test_samples": int(len(X_te)),
            "temporal_split_ratio": 0.80,
            "purge_hours": LEAD_TIME_HOURS,
            "lead_time": "24 hours forward",
            "index_definition": "Pollutant-Based Air Quality Index Proxy = max(i_co, i_no2, i_c6h6)",
            "target_policy": "Targets use only hours where CO, NO2 and C6H6 were all genuinely measured; "
                             "imputed hours are never used as ground truth.",
            "hazard_threshold": PROJECT_HAZARD_THRESHOLD,
        },
        "deployment": {
            "protocol": "Held-out metrics are from models fit on the training split only; "
                        "deployed artifacts are refit on all observed data with identical hyperparameters.",
            "refit_samples": int(len(df)),
        },
        "regression_model": {
            "model_type": "XGBoost Regressor",
            "champion": True,
            "file": "regression_model_v1.joblib",
            "hyperparameters": xgb_reg.get_params(),
            "test_metrics": reg_metrics or {},
        },
        "classification_model": {
            "model_type": "Hybrid Hazard Model (XGBoost classifier + regression-derived probability)",
            "champion": True,
            "file": "classification_model_v1.joblib",
            "classifier_hyperparameters": CHAMPION_XGB_CLASSIFIER_PARAMS,
            "hazard_alert_threshold": hazard_model.alert_threshold,
            "residual_sigma": hazard_model.residual_sigma,
            "out_of_fold_diagnostics": hazard_diag,
            "test_metrics": clf_metrics or {},
        },
        "clustering_pipeline": {
            "file": "clustering_pipeline_v1.joblib",
            "method": clustering_method,
            "regimes": regimes,
        },
        "features": {
            "total_features": len(feature_cols),
            "names": feature_cols,
            "required_history_hours": REQUIRED_HISTORY_HOURS,
        },
        "monitoring": {
            "drift_metric": "Population Stability Index (PSI)",
            "thresholds": {"stable": "<0.10", "monitor": "0.10-0.25", "significant_drift": ">0.25"},
            "action_on_drift": "Flag human-in-the-loop review for seasonal retraining"
        },
        "api": {
            "framework": "FastAPI",
            "endpoints": ["/health", "/metrics", "/predict", "/explain", "/drift"]
        }
    }

    registry_path = os.path.join(models_dir, "model_registry.json")
    with open(registry_path, "w") as f:
        json.dump(registry, f, indent=2, default=str)

    print(f"  [OK] Refit regression champion on {len(df)} samples -> '{reg_v1_path}'")
    print(f"  [OK] Refit hybrid hazard model (alert threshold {hazard_model.alert_threshold}, "
          f"sigma {hazard_model.residual_sigma}) -> '{clf_v1_path}'")
    print(f"  [OK] Packaged preprocessing pipeline -> '{prep_v1_path}'")
    print(f"  [OK] Model registry metadata written -> '{registry_path}'")
    return registry


def load_production_artifacts(models_dir: str = "models") -> Dict[str, Any]:
    """Loads all production model artifacts into a consolidated operational bundle."""
    reg_path = os.path.join(models_dir, "regression_model_v1.joblib")
    clf_path = os.path.join(models_dir, "classification_model_v1.joblib")
    prep_path = os.path.join(models_dir, "preprocessing_pipeline_v1.joblib")
    clust_path = os.path.join(models_dir, "clustering_pipeline_v1.joblib")
    registry_path = os.path.join(models_dir, "model_registry.json")

    bundle = {
        "regressor": joblib.load(reg_path),
        "classifier": joblib.load(clf_path),
        "preprocessing": joblib.load(prep_path),
        "clustering": joblib.load(clust_path) if os.path.exists(clust_path) else None,
        "registry": {}
    }
    if os.path.exists(registry_path):
        with open(registry_path, "r") as f:
            bundle["registry"] = json.load(f)

    return bundle


if __name__ == "__main__":
    package_production_artifacts()
