"""
AeroPure Pollutant-Based Air Quality Index Proxy Engine
======================================================
Implements a transparent, modular multi-pollutant index proxy.

IMPORTANT METHODOLOGICAL & REGULATORY NOTE:
Archive 1 (AirQuality.csv) contains true hourly measurements of gaseous pollutants:
Carbon Monoxide (CO), Nitrogen Dioxide (NO2), Nitrogen Oxides (NOx), Benzene (C6H6),
and metal-oxide sensor proxies (O3, NMHC), as well as temperature and humidity.
It does NOT contain direct PM2.5 and PM10 particulate measurements.

Therefore, this index is strictly designated as a:
    "Pollutant-Based Air Quality Index Proxy" (AQI Proxy)
It is calculated from available criteria pollutants using national piecewise linear
breakpoint interpolation principles (CPCB / US EPA standards).
No PM2.5 or PM10 values are fabricated or estimated.
"""

from typing import Dict, List, Tuple, Optional
import numpy as np
import pandas as pd


# Breakpoint tables: (BP_Lo, BP_Hi, I_Lo, I_Hi)
BREAKPOINTS_CO = [
    (0.0, 1.0, 0.0, 50.0),
    (1.01, 2.0, 51.0, 100.0),
    (2.01, 10.0, 101.0, 200.0),
    (10.01, 17.0, 201.0, 300.0),
    (17.01, 34.0, 301.0, 400.0),
    (34.01, 50.0, 401.0, 500.0),
]

BREAKPOINTS_NO2 = [
    (0.0, 40.0, 0.0, 50.0),
    (40.1, 80.0, 51.0, 100.0),
    (80.1, 180.0, 101.0, 200.0),
    (180.1, 280.0, 201.0, 300.0),
    (280.1, 400.0, 301.0, 400.0),
    (400.1, 800.0, 401.0, 500.0),
]

# Benzene (C6H6) safety thresholds (WHO / CPCB reference standard 5 µg/m³)
BREAKPOINTS_C6H6 = [
    (0.0, 5.0, 0.0, 50.0),
    (5.01, 10.0, 51.0, 100.0),
    (10.01, 20.0, 101.0, 200.0),
    (20.01, 35.0, 201.0, 300.0),
    (35.01, 50.0, 301.0, 400.0),
    (50.01, 100.0, 401.0, 500.0),
]


def calculate_sub_index(conc: float, breakpoints: List[Tuple[float, float, float, float]]) -> float:
    """Computes piecewise linear sub-index for a concentration value."""
    if np.isnan(conc) or conc < 0:
        return 0.0
    for bp_lo, bp_hi, i_lo, i_hi in breakpoints:
        if bp_lo <= conc <= bp_hi:
            return round(((i_hi - i_lo) / (bp_hi - bp_lo)) * (conc - bp_lo) + i_lo, 2)
    # Extrapolate beyond highest breakpoint
    last_bp_lo, last_bp_hi, last_i_lo, last_i_hi = breakpoints[-1]
    if conc > last_bp_hi:
        extrapolated = ((last_i_hi - last_i_lo) / (last_bp_hi - last_bp_lo)) * (conc - last_bp_lo) + last_i_lo
        return round(min(extrapolated, 500.0), 2)
    return 0.0


def calculate_pollutant_index_proxy(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes sub-indices for available criteria pollutants and the composite AQI proxy:
    - i_co: sub-index from CO(GT)
    - i_no2: sub-index from NO2(GT)
    - i_c6h6: sub-index from C6H6(GT)
    Composite current_air_quality_index = max(i_co, i_no2, i_c6h6)
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
    data["current_air_quality_index"] = data[sub_cols].max(axis=1)

    # Identify dominant pollutant driver
    sub_map = {"i_co": "CO", "i_no2": "NO2", "i_c6h6": "C6H6"}
    data["dominant_pollutant"] = data[sub_cols].idxmax(axis=1).map(sub_map)

    return data


def create_targets(
    df: pd.DataFrame,
    lead_time_hours: int = 24,
    hazard_threshold: float = 180.0
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
    """
    data = df.copy()

    if "current_air_quality_index" not in data.columns:
        data = calculate_pollutant_index_proxy(data)

    if "datetime" in data.columns:
        # Explicit timestamp-indexed lookup:
        # Guarantees that target(t) is strictly AQI_proxy at t + 24 hours
        target_lookup = data.set_index("datetime")["current_air_quality_index"].to_dict()
        target_times = data["datetime"] + pd.Timedelta(hours=lead_time_hours)
        data["next_day_air_quality_index"] = target_times.map(target_lookup)
    else:
        data["next_day_air_quality_index"] = data["current_air_quality_index"].shift(-lead_time_hours)

    # Classification flag (NaN targets preserve NaN before dropping)
    data["hazardous_air_day"] = np.where(
        data["next_day_air_quality_index"].isna(),
        np.nan,
        (data["next_day_air_quality_index"] >= hazard_threshold).astype(float)
    )

    return data
