"""
Tests for AeroPure Preprocessing and Sentinel Cleaning
"""

import os
import pytest
import pandas as pd
import numpy as np

from src.preprocessing import load_raw_archive1, clean_dataset, inspect_dataset


def test_load_raw_dataset():
    """Verify raw dataset loading from data/AirQuality.csv."""
    data_path = "data/AirQuality.csv"
    assert os.path.exists(data_path), "AirQuality.csv not found in data/."
    raw = load_raw_archive1(data_path)
    assert len(raw) > 9000, f"Expected >9000 rows, got {len(raw)}"
    assert "CO(GT)" in raw.columns
    assert "NO2(GT)" in raw.columns


def test_clean_dataset():
    """Verify sentinel -200 replacement and datetime parsing."""
    raw = load_raw_archive1("data/AirQuality.csv")
    cleaned, log = clean_dataset(raw)

    assert "datetime" in cleaned.columns
    assert pd.api.types.is_datetime64_any_dtype(cleaned["datetime"])
    # Sentinel -200 should be completely eliminated
    for col in log["retained_sensor_columns"]:
        assert (cleaned[col] == -200).sum() == 0, f"Found sentinel -200 in {col}"
    # NMHC(GT) should be dropped due to >90% missingness
    assert "NMHC(GT)" not in cleaned.columns
    assert len(cleaned) > 9000


def _raw_frame(co_values, extra_rows=0):
    """Minimal raw-format frame (Date/Time strings + sensors) with the given CO(GT) series."""
    n = len(co_values)
    stamps = pd.date_range("2004-03-10 18:00:00", periods=n, freq="h")
    return pd.DataFrame({
        "Date": stamps.strftime("%d/%m/%Y"),
        "Time": stamps.strftime("%H.%M.%S"),
        "CO(GT)": co_values,
        "NO2(GT)": [100.0] * n,
        "C6H6(GT)": [5.0] * n,
        "T": [15.0] * n,
    })


def test_clean_dataset_never_backfills_from_the_future():
    """Leading gaps must stay NaN: back-filling would copy a FUTURE measurement into the past."""
    raw = _raw_frame([-200.0, -200.0, 2.0, 2.5, -200.0, 3.0])
    cleaned, _ = clean_dataset(raw)

    assert cleaned["CO(GT)"].iloc[:2].isna().all()                        # no bfill from row 2
    assert cleaned["CO(GT)"].iloc[4] == cleaned["CO(GT)"].iloc[3]         # ffill from the past is fine
    assert cleaned["CO(GT)"].iloc[3] == pytest.approx(2.5, abs=0.01)      # (winsorised at most marginally)


def test_clean_dataset_flags_imputed_hours_and_staleness():
    raw = _raw_frame([1.0, -200.0, -200.0, 2.0])
    cleaned, log = clean_dataset(raw)

    assert list(cleaned["criteria_observed"]) == [1, 0, 0, 1]
    assert list(cleaned["co_stale_hours"]) == [0, 1, 2, 0]
    assert log["imputation"].startswith("causal")


def test_clean_dataset_clip_uses_reference_window_only():
    """Winsorisation limits must come from the leading 80%, not from the held-out tail."""
    values = [1.0 + (i % 2) * 0.5 for i in range(80)] + [40.0] * 20   # tail spike
    cleaned, log = clean_dataset(_raw_frame(values))

    assert log["upper_clip_thresholds"]["CO(GT)"] <= 1.5
    assert cleaned["CO(GT)"].max() <= 1.5                              # spike clipped to the training-window limit


def test_clean_dataset_gap_free_hourly_grid():
    """Missing timestamps become explicit rows so positional lags always mean 'k hours ago'."""
    raw = _raw_frame([1.0, 1.0, 1.0, 1.0])
    raw = raw.drop(index=2).reset_index(drop=True)                     # drop one hour
    cleaned, _ = clean_dataset(raw)

    assert len(cleaned) == 4
    assert (cleaned["datetime"].diff().dropna() == pd.Timedelta(hours=1)).all()
