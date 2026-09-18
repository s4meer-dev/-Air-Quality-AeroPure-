"""
Tests for FastAPI Endpoints and Pydantic Schemas
"""

import numpy as np
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from api.main import app
from api.schemas import ObservationInput
from api.services import PredictionService, SENSOR_COLUMNS, reference_timestamp
from src.aqi import calculate_pollutant_index_proxy
from src.feature_engineering import build_feature_matrix
from src.model_registry import MODEL_VERSION
from src.preprocessing import load_raw_archive1, clean_dataset


@pytest.fixture
def client():
    return TestClient(app)


def test_schema_validation():
    """Verify Pydantic input validation."""
    # Valid input
    valid = ObservationInput(
        co=2.5, no2=120.0, c6h6=10.5, temperature=18.5, relative_humidity=55.0
    )
    assert valid.co == 2.5
    assert valid.no2 == 120.0
    assert valid.history is None

    # Invalid input (CO negative)
    with pytest.raises(ValueError):
        ObservationInput(co=-5.0, no2=100.0, c6h6=5.0)


def test_api_health(client):
    """Verify GET /health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_version"] == MODEL_VERSION
    assert data["regressor_loaded"] is True
    assert data["classifier_loaded"] is True


def test_api_metrics(client):
    """Verify GET /metrics endpoint."""
    response = client.get("/metrics")
    assert response.status_code == 200
    data = response.json()
    assert data["model_version"] == MODEL_VERSION
    assert "RMSE" in data["regression_metrics"]
    assert "F1" in data["classification_metrics"]
    assert data["feature_count"] > 100


def test_api_predict(client):
    """Verify POST /predict endpoint returns real forecasts and regime."""
    payload = {
        "co": 2.8,
        "no2": 115.0,
        "c6h6": 9.5,
        "temperature": 18.0,
        "relative_humidity": 52.0,
        "nox": 220.0,
        "hour": 14,
        "day_of_week": 2,
        "month": 6
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "predicted_aqi_proxy" in data
    assert "hazard_probability" in data
    assert "hazardous" in data
    assert "pollution_regime" in data
    assert "dominant_current_pollutant" in data
    assert data["predicted_aqi_proxy"] > 0
    assert 0.0 <= data["hazard_probability"] <= 1.0
    # Standardized fields
    assert "aqi_proxy" in data
    assert "aqi_proxy_category" in data
    assert data["hazard_threshold"] == 180.0
    assert data["hazard_status"] in ["ELEVATED HAZARD", "NOMINAL"]
    assert data["history_hours_used"] == 0


def test_api_predict_uncertainty_and_alert_are_consistent(client):
    """The alert must be exactly `probability >= alert threshold`, and the interval must bracket the forecast."""
    payload = {"co": 4.0, "no2": 160.0, "c6h6": 14.0}
    data = client.post("/predict", json=payload).json()

    assert data["hazardous"] == (data["hazard_probability"] >= data["hazard_alert_threshold"])
    assert data["hazard_status"] == ("ELEVATED HAZARD" if data["hazardous"] else "NOMINAL")
    assert data["predicted_aqi_low"] <= data["predicted_aqi_proxy"] <= data["predicted_aqi_high"]
    # A forecast at/above the project threshold can never be reported as nominal
    if data["predicted_aqi_proxy"] >= data["hazard_threshold"]:
        assert data["hazardous"] is True


def test_api_forecast_responds_to_pollution_level(client):
    """The forecast must move with the inputs (it once ignored them: 86 of 113 features stayed at medians)."""
    clean = client.post("/predict", json={"co": 0.6, "no2": 35.0, "c6h6": 2.5}).json()
    dirty = client.post("/predict", json={"co": 6.0, "no2": 250.0, "c6h6": 28.0}).json()

    assert dirty["predicted_aqi_proxy"] > clean["predicted_aqi_proxy"] + 15.0
    assert dirty["hazard_probability"] > clean["hazard_probability"]


def test_api_predict_accepts_real_history(client):
    """Supplying real preceding hours changes the forecast versus the steady-state assumption."""
    base = {"co": 1.0, "no2": 60.0, "c6h6": 4.0}
    steady = client.post("/predict", json=base).json()

    smoggy_past = [{"co": 6.0, "no2": 260.0, "c6h6": 26.0}] * 48
    with_history = client.post("/predict", json={**base, "history": smoggy_past}).json()

    assert with_history["history_hours_used"] == 48
    assert with_history["predicted_aqi_proxy"] != steady["predicted_aqi_proxy"]
    assert with_history["predicted_aqi_proxy"] > steady["predicted_aqi_proxy"]


def test_api_rejects_invalid_payloads(client):
    assert client.post("/predict", json={"co": -1.0, "no2": 50.0, "c6h6": 2.0}).status_code == 422
    too_long = [{"co": 1.0, "no2": 50.0, "c6h6": 2.0}] * 169
    assert client.post("/predict", json={"co": 1.0, "no2": 50.0, "c6h6": 2.0, "history": too_long}).status_code == 422


def test_api_explain(client):
    """Verify POST /explain endpoint returns directional attributions."""
    payload = {
        "co": 3.5,
        "no2": 140.0,
        "c6h6": 12.0,
        "temperature": 15.0,
        "relative_humidity": 65.0
    }
    response = client.post("/explain", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "top_positive_contributors" in data
    assert "explanation_summary" in data
    assert len(data["explanation_summary"]) > 20


def test_api_explain_is_additive_and_reports_raw_values(client):
    """SHAP base + sum must reproduce the forecast, and feature_value must be the raw (unscaled) value."""
    payload = {"co": 3.5, "no2": 140.0, "c6h6": 12.0, "temperature": 15.0, "relative_humidity": 65.0}
    data = client.post("/explain", json=payload).json()

    assert data["base_expected_value"] is not None
    assert data["base_expected_value"] + data["shap_sum"] == pytest.approx(data["predicted_aqi_proxy"], abs=0.2)

    contributions = data["top_positive_contributors"] + data["top_negative_contributors"]
    by_feature = {c["feature"]: c["feature_value"] for c in contributions}
    # Concurrent readings, if they appear among the drivers, must show the raw value that was submitted.
    for name, expected in {"CO(GT)": 3.5, "NO2(GT)": 140.0, "C6H6(GT)": 12.0, "T": 15.0, "RH": 65.0}.items():
        if name in by_feature:
            assert by_feature[name] == pytest.approx(expected, abs=1e-6)


def test_api_drift(client):
    """Verify GET /drift endpoint."""
    response = client.get("/drift")
    assert response.status_code == 200
    data = response.json()
    assert "drift_status" in data
    assert "mean_psi" in data
    assert "retraining_flagged" in data


def test_serving_features_match_training_features():
    """
    Train/serve parity: replaying real hourly history through the API's feature construction must
    reproduce what the training feature builder computes for the same hour. (Six overridden feature
    names once did not exist in the model, and 86 lag/rolling features were left at dataset medians.)
    """
    service = PredictionService.get_instance()
    required = service.preprocessing["required_history_hours"]
    feature_names = service.preprocessing["feature_names"]

    # The full gap-free hourly frame (processed_data.csv drops hours with unobserved targets).
    frame = calculate_pollutant_index_proxy(clean_dataset(load_raw_archive1("data/AirQuality.csv"))[0])
    training_features = build_feature_matrix(frame)

    stale_cols = ["co_stale_hours", "no2_stale_hours", "sensor_stale_hours"]
    fresh_rows = frame.index[(frame[stale_cols] == 0).all(axis=1) & (frame.index >= required)]
    pos = int(fresh_rows[len(fresh_rows) // 2])

    window = frame.iloc[pos - required + 1: pos + 1]
    now = window.iloc[-1]

    def to_reading(row):
        return {field: float(row[column]) for field, column in SENSOR_COLUMNS.items()}

    payload = ObservationInput(
        **to_reading(now),
        hour=int(now["datetime"].hour),
        day_of_week=int(now["datetime"].dayofweek),
        month=int(now["datetime"].month),
        history=[to_reading(r) for _, r in window.iloc[:-1].iterrows()],
    )
    _, meta = service.preprocess_input(payload)
    served = meta["raw_features"]

    expected = training_features.loc[pos, feature_names].astype(float)
    mismatched = {
        f: (float(served[f]), float(expected[f]))
        for f in feature_names if not np.isclose(served[f], expected[f], rtol=1e-4, atol=1e-4)
    }
    assert mismatched == {}, f"serving features differ from training features: {mismatched}"


def test_reference_timestamp_matches_requested_calendar():
    ts = reference_timestamp(hour=14, day_of_week=4, month=11)
    assert (ts.hour, ts.dayofweek, ts.month) == (14, 4, 11)
