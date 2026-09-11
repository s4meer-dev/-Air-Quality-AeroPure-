"""
AeroPure Data Preprocessing Module (Week 2 — Archive 1)
=======================================================
Handles raw AirQuality.csv ingestion, sentinel replacement (-200 -> NaN),
datetime parsing, chronological sorting, missing value imputation, and outlier capping.
"""

from typing import Tuple, Dict, Any, List
import numpy as np
import pandas as pd


RAW_SENSOR_COLS = [
    "CO(GT)", "PT08.S1(CO)", "NMHC(GT)", "C6H6(GT)", "PT08.S2(NMHC)",
    "NOx(GT)", "PT08.S3(NOx)", "NO2(GT)", "PT08.S4(NO2)", "PT08.S5(O3)",
    "T", "RH", "AH"
]


def load_raw_archive1(file_path: str) -> pd.DataFrame:
    """Loads raw AirQuality.csv with semicolon separator and European decimal notation."""
    df = pd.read_csv(file_path, sep=";", decimal=",", low_memory=False)
    # Drop empty trailing columns often created by Excel exports
    df = df.dropna(how="all", axis=1).dropna(how="all", axis=0)
    return df


def inspect_dataset(df: pd.DataFrame) -> Dict[str, Any]:
    """Inspects dimensions, column types, sentinel -200 counts, and missingness."""
    data = df.copy()
    sentinel_counts = {}
    for col in data.columns:
        if pd.api.types.is_numeric_dtype(data[col]):
            sentinel_counts[col] = int((data[col] == -200).sum())

    summary = {
        "shape": data.shape,
        "columns": list(data.columns),
        "dtypes": {col: str(dtype) for col, dtype in data.dtypes.items()},
        "sentinel_minus_200_counts": sentinel_counts,
        "duplicate_rows": int(data.duplicated().sum()),
    }
    return summary


def clean_dataset(
    df: pd.DataFrame,
    outlier_clip_quantile: float = 0.999
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Cleans Archive 1 dataset:
    1. Parses Date (DD/MM/YYYY) and Time (HH.MM.SS) into unified datetime column.
    2. Sorts chronologically.
    3. Replaces -200 sentinel with NaN across all sensor variables.
    4. Drops NMHC(GT) due to 90.2% missingness (preserving all other 12 sensors/weather variables).
    5. Imputes missing values via time-series forward fill then backward fill.
    6. Clips physical extremes at 99.9th percentile to prevent sensor glitch artifacts.
    """
    data = df.copy()
    initial_rows = len(data)

    # 1. Datetime parsing & chronological ordering
    if "Date" in data.columns and "Time" in data.columns:
        # Some Time entries use '.' instead of ':'
        time_str = data["Time"].astype(str).str.replace(".", ":", regex=False)
        data["datetime"] = pd.to_datetime(data["Date"] + " " + time_str, format="%d/%m/%Y %H:%M:%S", errors="coerce")
    elif "datetime" not in data.columns:
        raise ValueError("Dataset missing 'Date' and 'Time' or 'datetime' column.")

    data = data.dropna(subset=["datetime"]).sort_values("datetime").reset_index(drop=True)

    # 2. Convert all sensor columns to numeric and map sentinel -200 to NaN
    active_cols = [c for c in RAW_SENSOR_COLS if c in data.columns]
    for col in active_cols:
        data[col] = pd.to_numeric(data[col], errors="coerce")
        data[col] = data[col].apply(lambda x: np.nan if x == -200 else x)

    # 3. Handle NMHC(GT) which is over 90% missing in this dataset
    if "NMHC(GT)" in data.columns and data["NMHC(GT)"].isnull().mean() > 0.80:
        data = data.drop(columns=["NMHC(GT)"])
        active_cols.remove("NMHC(GT)")

    # 4. Impute missing sensor observations
    missing_before = data[active_cols].isnull().sum().to_dict()
    data[active_cols] = data[active_cols].ffill().bfill()
    # In case of remaining NaNs, fill with median
    data[active_cols] = data[active_cols].fillna(data[active_cols].median())

    # 5. Outlier clipping (at 99.9th quantile for positive concentrations)
    clip_thresholds = {}
    for col in active_cols:
        if col not in ["T"]:  # Temperature can be low/negative
            data[col] = data[col].apply(lambda x: 0.0 if x < 0 else x)
            upper_bound = float(data[col].quantile(outlier_clip_quantile))
            data[col] = data[col].clip(upper=upper_bound)
            clip_thresholds[col] = upper_bound

    audit_log = {
        "initial_rows": initial_rows,
        "final_rows": len(data),
        "date_range": (str(data["datetime"].min()), str(data["datetime"].max())),
        "missing_sentinels_imputed": missing_before,
        "dropped_columns": ["NMHC(GT) (90.2% missing)"],
        "retained_sensor_columns": active_cols,
        "upper_clip_thresholds": clip_thresholds
    }

    return data, audit_log
