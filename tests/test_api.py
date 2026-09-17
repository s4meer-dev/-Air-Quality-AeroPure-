"""
Tests for FastAPI Endpoints and Pydantic Schemas
"""

import pytest
from fastapi.testclient import TestClient
from api.main import app
from api.schemas import ObservationInput


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

    # Invalid input (CO negative)
    with pytest.raises(ValueError):
        ObservationInput(co=-5.0, no2=100.0, c6h6=5.0)


def test_api_health(client):
    """Verify GET /health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_version"] == "1.0.0"
    assert data["regressor_loaded"] is True
    assert data["classifier_loaded"] is True


def test_api_metrics(client):
    """Verify GET /metrics endpoint."""
    response = client.get("/metrics")
    assert response.status_code == 200
    data = response.json()
    assert data["model_version"] == "1.0.0"
    assert "RMSE" in data["regression_metrics"]
    assert "F1" in data["classification_metrics"]


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


def test_api_drift(client):
    """Verify GET /drift endpoint."""
    response = client.get("/drift")
    assert response.status_code == 200
    data = response.json()
    assert "drift_status" in data
    assert "mean_psi" in data
    assert "retraining_flagged" in data
