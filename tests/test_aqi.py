"""
Tests for Pollutant-Based AQI Proxy and Target Generation
"""

import pytest
import pandas as pd
import numpy as np

from src.aqi import (
    calculate_sub_index, calculate_pollutant_index_proxy, create_targets,
    BREAKPOINTS_CO, BREAKPOINTS_NO2, BREAKPOINTS_C6H6
)


def test_calculate_sub_index():
    """Verify piecewise linear breakpoint calculations."""
    # Test CO sub-index
    assert calculate_sub_index(0.5, BREAKPOINTS_CO) == 25.0
    assert calculate_sub_index(1.0, BREAKPOINTS_CO) == 50.0
    assert calculate_sub_index(2.0, BREAKPOINTS_CO) == 100.0

    # Test negative or invalid concentration
    assert calculate_sub_index(-1.0, BREAKPOINTS_CO) == 0.0
    assert calculate_sub_index(np.nan, BREAKPOINTS_CO) == 0.0


def test_calculate_pollutant_index_proxy():
    """Verify composite index proxy is the max of available criteria sub-indices."""
    df = pd.DataFrame({
        "CO(GT)": [0.5, 5.0, 1.0],      # Sub-indices: ~25.0, ~140.0, 50.0
        "NO2(GT)": [30.0, 60.0, 200.0],  # Sub-indices: ~37.5, ~75.0, ~220.0
        "C6H6(GT)": [2.0, 8.0, 15.0]     # Sub-indices: ~20.0, ~80.0, ~150.0
    })
    res = calculate_pollutant_index_proxy(df)

    assert "current_air_quality_index" in res.columns
    assert "dominant_pollutant" in res.columns
    assert res.loc[0, "current_air_quality_index"] == pytest.approx(37.5, abs=1.0)
    assert res.loc[0, "dominant_pollutant"] == "NO2"
    assert res.loc[1, "dominant_pollutant"] == "CO"
    assert res.loc[2, "dominant_pollutant"] == "NO2"


def test_create_targets_timestamp_alignment():
    """Verify targets use timestamp mapping and do not leak future information."""
    dates = pd.date_range("2004-03-10 00:00:00", periods=50, freq="h")
    df = pd.DataFrame({
        "datetime": dates,
        "current_air_quality_index": np.arange(50, dtype=float)
    })
    targets_df = create_targets(df, lead_time_hours=24, hazard_threshold=40.0)

    assert "next_day_air_quality_index" in targets_df.columns
    assert "hazardous_air_day" in targets_df.columns

    # Target at index 0 should equal current index at index 24 (24 hours later)
    assert targets_df.loc[0, "next_day_air_quality_index"] == 24.0
    assert targets_df.loc[10, "next_day_air_quality_index"] == 34.0
    assert targets_df.loc[20, "next_day_air_quality_index"] == 44.0

    # Binary hazard threshold test: index 20 has target 44.0 >= 40.0 -> 1.0
    assert targets_df.loc[20, "hazardous_air_day"] == 1.0
    assert targets_df.loc[0, "hazardous_air_day"] == 0.0

    # Tail rows (last 24 hours) have no ground-truth future target
    assert np.isnan(targets_df.loc[49, "next_day_air_quality_index"])
