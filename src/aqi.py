"""
AeroPure Pollutant-Based Air Quality Index Proxy Engine
======================================================
Authoritative implementation of the AeroPure multi-pollutant index proxy.

CRITICAL METHODOLOGICAL & REGULATORY SPECIFICATION:
Archive 1 (AirQuality.csv) contains true hourly observational measurements
of gaseous criteria pollutants:
  • Carbon Monoxide (CO(GT)): measured in mg/m³
  • Nitrogen Dioxide (NO2(GT)): measured in µg/m³
  • Benzene (C6H6(GT)): measured in µg/m³
along with metal-oxide sensor proxies (PT08.S1-PT08.S5), NOx(GT) in ppb,
and meteorological variables (Temperature in °C, Relative Humidity in %).

Archive 1 does NOT contain direct PM2.5 or PM10 particulate measurements.
Therefore, this index is strictly designated as:
    "AEROPURE AQI PROXY"
    or "POLLUTANT-BASED AIR QUALITY INDEX PROXY"

It must NEVER be represented as "Official AQI", "Government AQI", "CPCB AQI",
"EPA AQI", or any official regulatory composite AQI.
No PM2.5 or PM10 values are fabricated, synthesized, or simulated.

PROJECT HAZARD THRESHOLD:
The project-defined elevated-pollution / hazardous threshold is 180.0
(~75th percentile of observational distributions). It is a project-specific
research threshold, not a universal or regulatory standard.
"""

from typing import Dict, List, Tuple, Optional
import numpy as np
import pandas as pd


# Project-defined elevated-pollution / hazard threshold
PROJECT_HAZARD_THRESHOLD: float = 180.0

# Pollutant input measurement units:
POLLUTANT_UNITS: Dict[str, str] = {
    "CO(GT)": "mg/m³",
    "NO2(GT)": "µg/m³",
    "C6H6(GT)": "µg/m³",
}

# Sentinel value representing missing hardware measurements in UCI AirQuality
SENTINEL_MISSING_VALUE: float = -200.0

# Breakpoint tables: (BP_Lo, BP_Hi, I_Lo, I_Hi)
# CO: 8-hour reference concentrations in mg/m³
BREAKPOINTS_CO: List[Tuple[float, float, float, float]] = [
    (0.0, 1.0, 0.0, 50.0),
    (1.01, 2.0, 51.0, 100.0),
    (2.01, 10.0, 101.0, 200.0),
    (10.01, 17.0, 201.0, 300.0),
    (17.01, 34.0, 301.0, 400.0),
    (34.01, 50.0, 401.0, 500.0),
]

# NO2: 1-hour / 24-hour reference concentrations in µg/m³
BREAKPOINTS_NO2: List[Tuple[float, float, float, float]] = [
    (0.0, 40.0, 0.0, 50.0),
    (40.1, 80.0, 51.0, 100.0),
    (80.1, 180.0, 101.0, 200.0),
    (180.1, 280.0, 201.0, 300.0),
    (280.1, 400.0, 301.0, 400.0),
    (400.1, 800.0, 401.0, 500.0),
]

# Benzene (C6H6): reference safety thresholds in µg/m³ (WHO / CPCB reference standard 5 µg/m³)
BREAKPOINTS_C6H6: List[Tuple[float, float, float, float]] = [
    (0.0, 5.0, 0.0, 50.0),
    (5.01, 10.0, 51.0, 100.0),
    (10.01, 20.0, 101.0, 200.0),
    (20.01, 35.0, 201.0, 300.0),
    (35.01, 50.0, 301.0, 400.0),
    (50.01, 100.0, 401.0, 500.0),
]


def calculate_sub_index(conc: float, breakpoints: List[Tuple[float, float, float, float]]) -> float:
    """
    Computes piecewise linear sub-index for a criteria pollutant concentration.
    
    Guarantees:
      • -200 sentinel, negative numbers, and NaN return 0.0 without crash.
      • Continuous interpolation across discretization gaps between (BP_Hi[k-1], BP_Lo[k]).
      • Extrapolation above highest breakpoint capped at 500.0.
    """
    if conc is None or pd.isna(conc) or conc < 0.0 or conc == SENTINEL_MISSING_VALUE:
        return 0.0

    for i, (bp_lo, bp_hi, i_lo, i_hi) in enumerate(breakpoints):
        if bp_lo <= conc <= bp_hi:
            return round(((i_hi - i_lo) / (bp_hi - bp_lo)) * (conc - bp_lo) + i_lo, 2)
        # Handle small discretization boundary gap between previous bp_hi and current bp_lo
        if i > 0:
            prev_bp_lo, prev_bp_hi, prev_i_lo, prev_i_hi = breakpoints[i - 1]
            if prev_bp_hi < conc < bp_lo:
                # Monotonic linear bridge across discretization boundary gap
                return round(((i_lo - prev_i_hi) / (bp_lo - prev_bp_hi)) * (conc - prev_bp_hi) + prev_i_hi, 2)

    # Extrapolate beyond highest breakpoint
    last_bp_lo, last_bp_hi, last_i_lo, last_i_hi = breakpoints[-1]
    if conc > last_bp_hi:
        extrapolated = ((last_i_hi - last_i_lo) / (last_bp_hi - last_bp_lo)) * (conc - last_bp_lo) + last_i_lo
        return round(min(extrapolated, 500.0), 2)

    return 0.0


def calculate_observation_aqi_proxy(
    co: Optional[float],
    no2: Optional[float],
    c6h6: Optional[float]
) -> Tuple[float, str, Dict[str, float]]:
    """
    Authoritative single-observation AQI proxy calculation:
      current_air_quality_index = max(i_co, i_no2, i_c6h6)
    
    Returns:
      (composite_aqi_proxy, dominant_pollutant, sub_indices_dict)
    """
    i_co = calculate_sub_index(co, BREAKPOINTS_CO) if co is not None else 0.0
    i_no2 = calculate_sub_index(no2, BREAKPOINTS_NO2) if no2 is not None else 0.0
    i_c6h6 = calculate_sub_index(c6h6, BREAKPOINTS_C6H6) if c6h6 is not None else 0.0
    sub_indices = {"i_co": i_co, "i_no2": i_no2, "i_c6h6": i_c6h6}

    # If no pollutant carries a valid reading, do not fabricate a 0.0 index or an arbitrary "CO" driver.
    if not any(_is_valid_concentration(c) for c in (co, no2, c6h6)):
        return float("nan"), "None", sub_indices

    sub_map = {"CO": i_co, "NO2": i_no2, "C6H6": i_c6h6}
    dominant = max(sub_map.keys(), key=lambda k: sub_map[k])
    composite = max(i_co, i_no2, i_c6h6)

    return composite, dominant, sub_indices


def _is_valid_concentration(conc: Optional[float]) -> bool:
    """True when a concentration is a finite, non-negative, non-sentinel measurement."""
    return conc is not None and bool(np.isfinite(conc)) and conc >= 0.0


def get_aqi_risk_category(aqi_val: float) -> str:
    """
    Authoritative AeroPure AQI Proxy Risk Tier Classification:
      • Low:      aqi < 50.0
      • Moderate: 50.0 <= aqi < 100.0
      • Elevated: 100.0 <= aqi < 180.0
      • High:     180.0 <= aqi < 250.0 (Exceeds project elevated-pollution threshold 180.0)
      • Severe:   aqi >= 250.0        (Severe multi-pollutant accumulation)
      • Unknown:  aqi is NaN (no valid measurement)
    """
    if aqi_val is None or pd.isna(aqi_val):
        return "Unknown"
    if aqi_val < 50.0:
        return "Low"
    elif aqi_val < 100.0:
        return "Moderate"
    elif aqi_val < 180.0:
        return "Elevated"
    elif aqi_val < 250.0:
        return "High"
    else:
        return "Severe"


def calculate_pollutant_index_proxy(
    df: pd.DataFrame,
    require_all_pollutants: bool = False
) -> pd.DataFrame:
    """
    Computes sub-indices for available criteria pollutants and the composite AQI proxy:
    - i_co: sub-index from CO(GT) (mg/m³)
    - i_no2: sub-index from NO2(GT) (µg/m³)
    - i_c6h6: sub-index from C6H6(GT) (µg/m³)
    Composite current_air_quality_index = max(i_co, i_no2, i_c6h6)

    Preserves NaN when all criteria pollutant observations are missing or sentinel -200.
    With require_all_pollutants=True, the composite is NaN unless CO, NO2 and C6H6 are all
    valid measurements: a max over a subset systematically understates the index (NO2 alone
    drives ~76% of observed hours), so partial rows must not be treated as ground truth.
    """
    data = df.copy()

    if "CO(GT)" in data.columns:
        data["i_co"] = data["CO(GT)"].apply(lambda c: calculate_sub_index(c, BREAKPOINTS_CO))
    else:
        data["i_co"] = 0.0

    if "NO2(GT)" in data.columns:
        data["i_no2"] = data["NO2(GT)"].apply(lambda c: calculate_sub_index(c, BREAKPOINTS_NO2))
    else:
        data["i_no2"] = 0.0

    if "C6H6(GT)" in data.columns:
        data["i_c6h6"] = data["C6H6(GT)"].apply(lambda c: calculate_sub_index(c, BREAKPOINTS_C6H6))
    else:
        data["i_c6h6"] = 0.0

    sub_cols = ["i_co", "i_no2", "i_c6h6"]
    
    # Identify rows where all available criteria pollutants are missing, negative, or sentinel -200
    criteria_cols = [c for c in ["CO(GT)", "NO2(GT)", "C6H6(GT)"] if c in data.columns]
    if criteria_cols:
        valid_flags = pd.DataFrame({
            c: data[c].notna() & (data[c] != SENTINEL_MISSING_VALUE) & (data[c] >= 0.0)
            for c in criteria_cols
        })
        if require_all_pollutants:
            # Every criteria pollutant must be present (a missing column counts as missing)
            all_missing_mask = ~valid_flags.all(axis=1) if len(criteria_cols) == 3 else pd.Series(True, index=data.index)
        else:
            all_missing_mask = ~valid_flags.any(axis=1)
    else:
        all_missing_mask = pd.Series(True, index=data.index)

    data["current_air_quality_index"] = data[sub_cols].max(axis=1)

    # Identify dominant pollutant driver
    sub_map = {"i_co": "CO", "i_no2": "NO2", "i_c6h6": "C6H6"}
    data["dominant_pollutant"] = data[sub_cols].idxmax(axis=1).map(sub_map)

    # If all criteria pollutants were completely missing, do not fabricate a 0.0 AQI reading
    if all_missing_mask.any():
        data.loc[all_missing_mask, "current_air_quality_index"] = np.nan
        data.loc[all_missing_mask, "dominant_pollutant"] = "None"

    return data


def create_targets(
    df: pd.DataFrame,
    lead_time_hours: int = 24,
    hazard_threshold: float = PROJECT_HAZARD_THRESHOLD,
    observed_col: str = "criteria_observed"
) -> pd.DataFrame:
    """
    Constructs leakage-safe targets using explicit timestamp alignment:
    1. next_day_air_quality_index: AQI proxy exactly lead_time_hours ahead:
       target(t) = AQI_proxy(datetime + 24 hours).
       -> REGRESSION TARGET.
    2. hazardous_air_day: Binary flag (1 if next_day_air_quality_index >= hazard_threshold, else 0).
       -> CLASSIFICATION TARGET.
       Threshold 180.0 corresponds to the project-defined elevated-pollution / hazardous threshold
       (~75th percentile of the real observational dataset).

    If `observed_col` is present (1 where CO, NO2 and C6H6 were all actually measured that hour),
    targets are built ONLY from genuinely observed hours. Hours whose pollutant values were carried
    forward by imputation yield NaN targets, so models are never trained or scored on fabricated
    ground truth.
    """
    data = df.copy()

    if "current_air_quality_index" not in data.columns:
        data = calculate_pollutant_index_proxy(data)

    truth = data["current_air_quality_index"]
    if observed_col in data.columns:
        truth = truth.where(data[observed_col] == 1)

    if "datetime" in data.columns:
        # Explicit timestamp-indexed lookup:
        # Guarantees that target(t) is strictly AQI_proxy at t + 24 hours
        target_lookup = truth.set_axis(data["datetime"]).to_dict()
        target_times = data["datetime"] + pd.Timedelta(hours=lead_time_hours)
        data["next_day_air_quality_index"] = target_times.map(target_lookup)
    else:
        data["next_day_air_quality_index"] = truth.shift(-lead_time_hours)

    # Classification flag (NaN targets preserve NaN before dropping)
    data["hazardous_air_day"] = np.where(
        data["next_day_air_quality_index"].isna(),
        np.nan,
        (data["next_day_air_quality_index"] >= hazard_threshold).astype(float)
    )

    return data
