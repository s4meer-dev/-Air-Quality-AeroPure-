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
