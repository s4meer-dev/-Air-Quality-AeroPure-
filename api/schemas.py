"""
AeroPure API Schemas (Pydantic models)
=====================================
Strict validation models for prediction, explanation, health, and monitoring endpoints.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class SensorReading(BaseModel):
    """One hourly set of pollutant, sensor and weather readings."""
    co: float = Field(..., ge=0.0, le=50.0, description="Carbon Monoxide CO(GT) in mg/m³", examples=[2.5])
    no2: float = Field(..., ge=0.0, le=800.0, description="Nitrogen Dioxide NO2(GT) in µg/m³", examples=[120.0])
    c6h6: float = Field(..., ge=0.0, le=100.0, description="Benzene C6H6(GT) in µg/m³", examples=[10.5])
    nox: Optional[float] = Field(250.0, ge=0.0, le=2000.0, description="Nitrogen Oxides NOx(GT) in ppb", examples=[250.0])
    temperature: float = Field(18.0, ge=-20.0, le=60.0, description="Temperature T in °C", examples=[18.5])
    relative_humidity: float = Field(50.0, ge=0.0, le=100.0, description="Relative Humidity RH in %", examples=[55.0])
    absolute_humidity: Optional[float] = Field(0.95, ge=0.0, le=5.0, description="Absolute Humidity AH", examples=[0.95])
    pt08_s1: Optional[float] = Field(1000.0, ge=0.0, description="PT08.S1 CO sensor response", examples=[1050.0])
    pt08_s2: Optional[float] = Field(900.0, ge=0.0, description="PT08.S2 NMHC sensor response", examples=[920.0])
    pt08_s3: Optional[float] = Field(800.0, ge=0.0, description="PT08.S3 NOx sensor response", examples=[810.0])
    pt08_s4: Optional[float] = Field(1400.0, ge=0.0, description="PT08.S4 NO2 sensor response", examples=[1420.0])
    pt08_s5: Optional[float] = Field(1000.0, ge=0.0, description="PT08.S5 O3 sensor response", examples=[980.0])


class ObservationInput(SensorReading):
    """
    Input payload representing atmospheric & sensor observations at time t.

    The model's lag/rolling features need recent history. If `history` is omitted the service assumes
    conditions have been steady at the current reading (a persistence assumption). Supplying the
    preceding hourly readings, oldest first, lets the model use the real recent trajectory; up to
    168 hours are used.
    """
    hour: Optional[int] = Field(12, ge=0, le=23, description="Hour of observation (0–23)", examples=[14])
    day_of_week: Optional[int] = Field(2, ge=0, le=6, description="Day of week (0=Mon, 6=Sun)", examples=[2])
    month: Optional[int] = Field(6, ge=1, le=12, description="Month of year (1–12)", examples=[6])
    history: Optional[List[SensorReading]] = Field(
        None, max_length=168,
        description="Optional preceding hourly readings, oldest first, ending one hour before this observation."
    )


class PredictResponse(BaseModel):
    """Forecast output for next-day air quality proxy and hazardous air day alert."""
    predicted_aqi_proxy: float = Field(..., description="Forecasted next-day (+24h) AQI proxy")
    hazard_probability: float = Field(..., description="Probability of exceeding the hazard threshold (>=180)")
    hazardous: bool = Field(..., description="Binary hazardous warning flag")
    risk_category: str = Field(..., description="Qualitative risk tier: Low, Moderate, Elevated, High, Severe")
    pollution_regime: str = Field(..., description="Discovered operational pollution regime at observation time")
    dominant_current_pollutant: str = Field(..., description="Primary pollutant driving the current index")
    current_aqi_proxy: float = Field(..., description="Current index proxy at observation time t")
    model_version: str = Field(..., description="Production model release version")
    # Standardized explicit fields for API consistency (Point 15)
    aqi_proxy: float = Field(..., description="Standardized predicted AQI proxy value")
    aqi_proxy_category: str = Field(..., description="Standardized AQI proxy qualitative category")
    hazard_threshold: float = Field(180.0, description="Project-defined elevated-pollution threshold (180.0)")
    hazard_status: str = Field(..., description="Elevated pollution status (ELEVATED HAZARD or NOMINAL)")
    hazard_alert_threshold: Optional[float] = Field(
        None, description="Probability at or above which the hazard alert fires (tuned on out-of-fold data)"
    )
    predicted_aqi_low: Optional[float] = Field(None, description="Lower bound of the ~80% forecast interval")
    predicted_aqi_high: Optional[float] = Field(None, description="Upper bound of the ~80% forecast interval")
    history_hours_used: Optional[int] = Field(
        None, description="Number of real preceding hourly readings supplied (0 = steady-state assumption)"
    )


class FeatureContribution(BaseModel):
    """Individual feature contribution toward the forecasted output."""
    feature: str
    feature_value: float
    contribution: float


class ExplainResponse(BaseModel):
    """Interpretable prediction explanation with directional feature attributions."""
    predicted_aqi_proxy: float
    hazard_probability: float
    hazardous: bool
    top_positive_contributors: List[FeatureContribution]
    top_negative_contributors: List[FeatureContribution]
    explanation_summary: str
    model_version: str
    base_expected_value: Optional[float] = Field(None, description="SHAP model expected base value")
    shap_sum: Optional[float] = Field(None, description="Sum of all SHAP feature attributions")


class HealthResponse(BaseModel):
    """Operational health diagnostic of all loaded models and components."""
    status: str
    model_version: str
    regressor_loaded: bool
    classifier_loaded: bool
    preprocessing_pipeline_loaded: bool
    clustering_pipeline_loaded: bool


class MetricsResponse(BaseModel):
    """Production governance metadata and performance metrics."""
    model_version: str
    model_type: str
    training_date: str
    regression_metrics: Dict[str, float]
    classification_metrics: Dict[str, float]
    feature_count: int
    prediction_count: int
    average_inference_time_ms: float
    drift_status: str


class DriftResponse(BaseModel):
    """Population Stability Index (PSI) drift monitoring report."""
    drift_status: str
    mean_psi: float
    retraining_flagged: bool
    recommendation: str
    significant_drift_features: List[str]
    psi_by_feature: Dict[str, float]
