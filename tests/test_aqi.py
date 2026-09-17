"""
Tests for Pollutant-Based AQI Proxy and Target Generation
=========================================================
Verifies piecewise linear sub-indices, gap interpolation, sentinel -200 handling,
risk categories, dominant pollutant assignment, and timestamp-aligned targets.
"""

import pytest
import pandas as pd
import numpy as np

from src.aqi import (
    calculate_sub_index, calculate_pollutant_index_proxy, create_targets,
    calculate_observation_aqi_proxy, get_aqi_risk_category,
    BREAKPOINTS_CO, BREAKPOINTS_NO2, BREAKPOINTS_C6H6,
    PROJECT_HAZARD_THRESHOLD, SENTINEL_MISSING_VALUE
)


def test_calculate_sub_index_breakpoints():
    """Verify piecewise linear breakpoint calculations."""
    # Test CO sub-index
    assert calculate_sub_index(0.5, BREAKPOINTS_CO) == 25.0
    assert calculate_sub_index(1.0, BREAKPOINTS_CO) == 50.0
    assert calculate_sub_index(2.0, BREAKPOINTS_CO) == 100.0

    # Test negative or invalid concentration
    assert calculate_sub_index(-1.0, BREAKPOINTS_CO) == 0.0
    assert calculate_sub_index(np.nan, BREAKPOINTS_CO) == 0.0
    assert calculate_sub_index(None, BREAKPOINTS_CO) == 0.0


def test_calculate_sub_index_sentinel_and_gaps():
    """Verify sentinel -200 and discretization boundary gap interpolation."""
    # Sentinel -200 must return 0.0 without crash
    assert calculate_sub_index(SENTINEL_MISSING_VALUE, BREAKPOINTS_CO) == 0.0
    assert calculate_sub_index(-200.0, BREAKPOINTS_NO2) == 0.0
    assert calculate_sub_index(-200.0, BREAKPOINTS_C6H6) == 0.0

    # Test continuous boundary gap interpolation:
    # Between CO 1.0 (sub-index 50.0) and 1.01 (sub-index 51.0):
    # e.g., 1.005 must return 50.5, NOT 0.0
    co_gap_val = calculate_sub_index(1.005, BREAKPOINTS_CO)
    assert 50.0 < co_gap_val < 51.0
    assert co_gap_val == pytest.approx(50.5, abs=0.1)

    # Between NO2 40.0 (sub-index 50.0) and 40.1 (sub-index 51.0):
    # e.g., 40.05 must return 50.5, NOT 0.0
    no2_gap_val = calculate_sub_index(40.05, BREAKPOINTS_NO2)
    assert 50.0 < no2_gap_val < 51.0
    assert no2_gap_val == pytest.approx(50.5, abs=0.1)

    # Extreme high concentration extrapolation capped at 500.0
    assert calculate_sub_index(200.0, BREAKPOINTS_CO) == 500.0
    assert calculate_sub_index(1500.0, BREAKPOINTS_NO2) == 500.0


def test_calculate_observation_aqi_proxy():
    """Verify authoritative single observation proxy calculation."""
    composite, dominant, sub_map = calculate_observation_aqi_proxy(
        co=0.5, no2=60.0, c6h6=8.0
    )
    # CO=0.5 -> ~25.0, NO2=60.0 -> ~75.0, C6H6=8.0 -> ~80.0
    assert dominant == "C6H6"
    assert composite == pytest.approx(80.0, abs=1.0)
    assert sub_map["i_c6h6"] == pytest.approx(80.0, abs=1.0)


def test_aqi_risk_categories():
    """Verify authoritative AeroPure project risk categories."""
    assert get_aqi_risk_category(30.0) == "Low"
    assert get_aqi_risk_category(75.0) == "Moderate"
    assert get_aqi_risk_category(140.0) == "Elevated"
    assert get_aqi_risk_category(180.0) == "High"
    assert get_aqi_risk_category(220.0) == "High"
    assert get_aqi_risk_category(280.0) == "Severe"


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


def test_calculate_pollutant_index_proxy_missing_and_sentinel():
    """Verify that completely missing or sentinel rows yield NaN rather than fabricated 0.0."""
    df = pd.DataFrame({
        "CO(GT)": [-200.0, np.nan, 2.0],
        "NO2(GT)": [-200.0, np.nan, -200.0],
        "C6H6(GT)": [-200.0, np.nan, -200.0],
    })
    res = calculate_pollutant_index_proxy(df)

    # Row 0: all sentinels (-200) -> NaN, "None"
    assert np.isnan(res.loc[0, "current_air_quality_index"])
    assert res.loc[0, "dominant_pollutant"] == "None"

    # Row 1: all NaN -> NaN, "None"
    assert np.isnan(res.loc[1, "current_air_quality_index"])
    assert res.loc[1, "dominant_pollutant"] == "None"

    # Row 2: CO present (2.0 -> 100.0), other two are sentinel -> 100.0, dominant "CO"
    assert res.loc[2, "current_air_quality_index"] == pytest.approx(100.0, abs=1.0)
    assert res.loc[2, "dominant_pollutant"] == "CO"


def test_create_targets_timestamp_alignment():
    """Verify targets use timestamp mapping and do not leak future information."""
    dates = pd.date_range("2004-03-10 00:00:00", periods=50, freq="h")
    df = pd.DataFrame({
        "datetime": dates,
        "current_air_quality_index": np.arange(50, dtype=float)
    })
    targets_df = create_targets(df, lead_time_hours=24, hazard_threshold=PROJECT_HAZARD_THRESHOLD)

    assert "next_day_air_quality_index" in targets_df.columns
    assert "hazardous_air_day" in targets_df.columns

    # Target at index 0 should equal current index at index 24 (24 hours later)
    assert targets_df.loc[0, "next_day_air_quality_index"] == 24.0
    assert targets_df.loc[10, "next_day_air_quality_index"] == 34.0
    assert targets_df.loc[20, "next_day_air_quality_index"] == 44.0

    # Binary hazard threshold test: default 180.0
    assert targets_df.loc[20, "hazardous_air_day"] == 0.0

    # Tail rows (last 24 hours) have no ground-truth future target
    assert np.isnan(targets_df.loc[49, "next_day_air_quality_index"])
