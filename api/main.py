"""
AeroPure FastAPI Application
============================
High-performance REST API for next-day air quality proxy forecasting,
hazardous air day alerting, SHAP explanations, and model drift telemetry.
"""

import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from api.schemas import (
    ObservationInput, PredictResponse, ExplainResponse,
    HealthResponse, MetricsResponse, DriftResponse
)
from api.services import PredictionService


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Preloads production machine learning models and pipeline components."""
    service = PredictionService.get_instance()
    health = service.get_health()
    print(f"[AeroPure API] Started successfully. Health status: {health.status}")
    yield


app = FastAPI(
    title="AeroPure AI Air Quality Prediction System",
    description=(
        "Production ML REST API delivering next-day Pollutant-Based Air Quality Index Proxy "
        "forecasts, hazardous air day classification, interpretability, and drift monitoring."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Enable CORS for local dashboards and frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Overview"])
def root():
    """Root metadata and API status overview."""
    return {
        "system": "AeroPure – AI-Based Air Quality Prediction System",
        "tagline": "Tell a city when tomorrow's air turns dangerous.",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "explain": "/explain",
            "metrics": "/metrics",
            "drift": "/drift",
            "documentation": "/docs"
        }
    }


@app.get("/health", response_model=HealthResponse, tags=["Diagnostics"])
def health_check():
    """Verifies that models and preprocessing pipelines are online."""
    service = PredictionService.get_instance()
    return service.get_health()


@app.get("/metrics", response_model=MetricsResponse, tags=["Governance"])
def get_metrics():
    """Returns production model metadata, validation scores, and runtime latency."""
    service = PredictionService.get_instance()
    return service.get_metrics()


@app.post("/predict", response_model=PredictResponse, tags=["Forecasting"])
def predict_next_day_air_quality(input_data: ObservationInput):
    """
    Predicts next-day (+24h) Pollutant-Based AQI Proxy, hazardous air probability,
    and discovered unsupervised pollution regime from current observations.
    """
    try:
        service = PredictionService.get_instance()
        return service.predict(input_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction error: {str(e)}"
        )


@app.post("/explain", response_model=ExplainResponse, tags=["Explainability"])
def explain_prediction(input_data: ObservationInput):
    """
    Provides interpretable directional feature contributions (top positive and
    negative contributors) for the next-day forecast.
    """
    try:
        service = PredictionService.get_instance()
        return service.explain(input_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Explanation error: {str(e)}"
        )


@app.get("/drift", response_model=DriftResponse, tags=["Monitoring"])
def get_drift_report():
    """
    Returns Population Stability Index (PSI) drift monitoring metrics across key
    features comparing baseline training distributions to incoming telemetry.
    """
    try:
        service = PredictionService.get_instance()
        return service.get_drift()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Drift monitoring error: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
