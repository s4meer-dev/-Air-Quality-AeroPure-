"""
AeroPure Data Preprocessing Module (Week 2 — Archive 1)
=======================================================
Handles raw AirQuality.csv ingestion, sentinel replacement (-200 -> NaN),
datetime parsing, chronological sorting, CAUSAL missing-value imputation, and outlier capping.

Leakage & honesty guarantees
----------------------------
* Imputation is forward-fill only. Nothing is ever back-filled, so a value at time t can never
  be derived from an observation made after t.
* Winsorisation thresholds are estimated from the chronologically first `clip_reference_fraction`
  of the series only, so the held-out period does not influence the cleaning of the training period.
* Imputed values are flagged. `criteria_observed` marks hours where CO, NO2 and C6H6 were all
  really measured; `*_stale_hours` count hours since each sensor group last reported. Targets are
  built from observed hours only (see `src.aqi.create_targets`), and the staleness counters let a
  model learn how much to trust carried-forward inputs.
"""

from typing import Tuple, Dict, Any, List
import numpy as np
import pandas as pd


RAW_SENSOR_COLS = [
    "CO(GT)", "PT08.S1(CO)", "NMHC(GT)", "C6H6(GT)", "PT08.S2(NMHC)",
    "NOx(GT)", "PT08.S3(NOx)", "NO2(GT)", "PT08.S4(NO2)", "PT08.S5(O3)",
    "T", "RH", "AH"
]

# The three pollutants that define the AQI proxy.
CRITERIA_COLS = ["CO(GT)", "NO2(GT)", "C6H6(GT)"]

# Instruments fail together, so staleness is tracked per outage group (verified against the raw
# missingness patterns: CO alone, NO2+NOx together, and the whole sensor array together).
STALENESS_GROUPS: Dict[str, List[str]] = {
    "co_stale_hours": ["CO(GT)"],
    "no2_stale_hours": ["NO2(GT)", "NOx(GT)"],
    "sensor_stale_hours": [
        "C6H6(GT)", "PT08.S1(CO)", "PT08.S2(NMHC)", "PT08.S3(NOx)", "PT08.S4(NO2)",
        "PT08.S5(O3)", "T", "RH", "AH"
    ],
}


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


def _hours_since_last_observation(observed: pd.Series) -> pd.Series:
    """Hours elapsed since `observed` was last True (0 when observed now; NaN before the first)."""
    positions = pd.Series(np.arange(len(observed), dtype=float), index=observed.index)
    last_seen = positions.where(observed).ffill()
    return positions - last_seen


def clean_dataset(
    df: pd.DataFrame,
    outlier_clip_quantile: float = 0.999,
    clip_reference_fraction: float = 0.80
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Cleans Archive 1 dataset:
    1. Parses Date (DD/MM/YYYY) and Time (HH.MM.SS) into unified datetime column.
    2. Sorts chronologically, removes duplicate timestamps and re-indexes onto a gap-free hourly grid
       (so positional lags/shifts are guaranteed to mean "k hours ago").
    3. Replaces -200 sentinel with NaN across all sensor variables.
    4. Drops NMHC(GT) when it is mostly missing (90.2% in this dataset).
    5. Records which values were really measured (`criteria_observed`, `*_stale_hours`).
    6. Clips physical extremes at the `outlier_clip_quantile` of the first `clip_reference_fraction`
       of the series (no look-ahead into the held-out period).
    7. Imputes remaining gaps by CAUSAL forward-fill only. Rows before a sensor's first reading stay NaN
       and are removed downstream instead of being back-filled from the future.
    """
    data = df.copy()
    initial_rows = len(data)

    # 1. Datetime parsing & chronological ordering
    if "Date" in data.columns and "Time" in data.columns:
        # Some Time entries use '.' instead of ':'
        time_str = data["Time"].astype(str).str.replace(".", ":", regex=False)
        data["datetime"] = pd.to_datetime(
            data["Date"].astype(str) + " " + time_str, format="%d/%m/%Y %H:%M:%S", errors="coerce"
        )
    elif "datetime" not in data.columns:
        raise ValueError("Dataset missing 'Date' and 'Time' or 'datetime' column.")

    data = (
        data.dropna(subset=["datetime"])
        .sort_values("datetime")
        .drop_duplicates(subset="datetime", keep="first")
        .reset_index(drop=True)
    )

    # Re-index onto a complete hourly grid so gaps become explicit NaN rows rather than silently
    # misaligned lags.
    full_index = pd.date_range(data["datetime"].min(), data["datetime"].max(), freq="h")
    if len(full_index) != len(data):
        data = data.set_index("datetime").reindex(full_index).rename_axis("datetime").reset_index()

    # 2. Convert all sensor columns to numeric and map sentinel -200 to NaN
    active_cols = [c for c in RAW_SENSOR_COLS if c in data.columns]
    for col in active_cols:
        data[col] = pd.to_numeric(data[col], errors="coerce")
        data[col] = data[col].mask(data[col] == -200)

    # 3. Handle NMHC(GT) which is over 90% missing in this dataset
    dropped_columns: List[str] = []
    if "NMHC(GT)" in data.columns and data["NMHC(GT)"].isnull().mean() > 0.80:
        pct = data["NMHC(GT)"].isnull().mean() * 100
        data = data.drop(columns=["NMHC(GT)"])
        active_cols.remove("NMHC(GT)")
        dropped_columns.append(f"NMHC(GT) ({pct:.1f}% missing)")

    # 4. Record what was genuinely measured BEFORE any imputation
    missing_before = data[active_cols].isnull().sum().to_dict()
    observed = data[active_cols].notna()
    if all(c in observed.columns for c in CRITERIA_COLS):
        data["criteria_observed"] = observed[CRITERIA_COLS].all(axis=1).astype(int)
    for stale_col, members in STALENESS_GROUPS.items():
        members = [m for m in members if m in observed.columns]
        if members:
            data[stale_col] = _hours_since_last_observation(observed[members].all(axis=1))

    # 5. Outlier clipping. Negative concentrations are physically impossible; upper bounds are
    #    estimated on the leading reference window only.
    ref_end = max(1, int(len(data) * clip_reference_fraction))
    clip_thresholds = {}
    for col in active_cols:
        if col == "T":  # Temperature can be low/negative
            continue
        data[col] = data[col].clip(lower=0.0)
        upper_bound = float(data[col].iloc[:ref_end].quantile(outlier_clip_quantile))
        data[col] = data[col].clip(upper=upper_bound)
        clip_thresholds[col] = upper_bound

    # 6. Causal imputation: forward-fill only (never back-fill from the future)
    data[active_cols] = data[active_cols].ffill()

    # Staleness counters are undefined before a sensor's first reading; treat those rows as unusable
    # history (they are dropped downstream) rather than inventing a value.
    leading_nan_rows = int(data[active_cols].isnull().any(axis=1).sum())

    audit_log = {
        "initial_rows": initial_rows,
        "final_rows": len(data),
        "date_range": (str(data["datetime"].min()), str(data["datetime"].max())),
        "missing_sentinels_imputed": missing_before,
        "dropped_columns": dropped_columns,
        "retained_sensor_columns": active_cols,
        "upper_clip_thresholds": clip_thresholds,
        "imputation": "causal forward-fill only (no backward fill)",
        "criteria_observed_fraction": (
            round(float(data["criteria_observed"].mean()), 4) if "criteria_observed" in data.columns else None
        ),
        "rows_before_first_reading": leading_nan_rows,
    }

    return data, audit_log
