"""
Tests for Leakage-Safe Feature Engineering and Splits
"""

import pytest
import pandas as pd
import numpy as np

from src.aqi import calculate_pollutant_index_proxy
from src.feature_engineering import (
    extract_temporal_features, extract_lag_features,
    extract_rolling_features, prepare_time_series_splits,
    build_feature_matrix, get_feature_columns, NON_FEATURE_COLUMNS
)
from src.preprocessing import load_raw_archive1, clean_dataset


def test_temporal_features():
    """Verify calendar and cyclical features."""
    dates = pd.date_range("2004-06-01 00:00:00", periods=24, freq="h")
    df = pd.DataFrame({"datetime": dates})
    df = extract_temporal_features(df)

    assert "hour" in df.columns
    assert "sin_hour" in df.columns
    assert "cos_hour" in df.columns
    assert "sin_month" in df.columns
    assert "is_weekend" in df.columns
    # Check bounds
    assert df["sin_hour"].min() >= -1.0
    assert df["sin_hour"].max() <= 1.0



def test_lag_features():
    """Verify historical lags do not introduce future leakage."""
    df = pd.DataFrame({
        "current_air_quality_index": np.arange(10, dtype=float)
    })
    df = extract_lag_features(df, ["current_air_quality_index"], [1, 2])

    assert "current_air_quality_index_lag_1" in df.columns
    assert "current_air_quality_index_lag_2" in df.columns
    # Lag 1 at index 3 should be value at index 2
    assert df.loc[3, "current_air_quality_index_lag_1"] == 2.0
    assert df.loc[3, "current_air_quality_index_lag_2"] == 1.0


def test_chronological_splits():
    """Verify train/test splits maintain strict chronological ordering with a purge gap."""
    df = pd.read_csv("data/processed_data.csv", parse_dates=["datetime"])
    X_tr, X_te, y_tr_reg, y_te_reg, y_tr_clf, y_te_clf, scaler, feature_cols = prepare_time_series_splits(df, train_ratio=0.80)

    split_idx = int(len(df) * 0.80)
    assert len(X_te) == len(df) - split_idx
    # Rows whose 24h label would sit next to the test period are purged from training (<= ~24 rows)
    assert 0 <= split_idx - len(X_tr) <= 30
    # Test indices come strictly after train indices
    assert X_te.index[0] > X_tr.index[-1]

    # Purge guarantee: every training label time (t + 24h) precedes the first test observation
    last_train_time = df.loc[X_tr.index[-1], "datetime"]
    first_test_time = df.loc[X_te.index[0], "datetime"]
    assert last_train_time + pd.Timedelta(hours=24) <= first_test_time

    assert len(feature_cols) == len(get_feature_columns(df))
    assert len(feature_cols) > 100


def test_feature_columns_exclude_targets_and_identifiers():
    """No target, target-derived flag or identifier may ever be a model input."""
    df = pd.read_csv("data/processed_data.csv", parse_dates=["datetime"])
    feature_cols = get_feature_columns(df)

    for banned in NON_FEATURE_COLUMNS:
        assert banned not in feature_cols
    # Calendar-date identifiers let trees memorise specific episodes of a 13-month dataset
    assert "day" not in feature_cols
    assert "day_of_year" not in feature_cols


def test_processed_features_are_clean():
    """No NaN, no -200 sentinel, and every label is a real observed value."""
    df = pd.read_csv("data/processed_data.csv", parse_dates=["datetime"])
    feature_cols = get_feature_columns(df)

    assert df[feature_cols].isna().sum().sum() == 0
    assert (df[feature_cols] == -200).sum().sum() == 0
    assert df["next_day_air_quality_index"].notna().all()
    assert set(df["hazardous_air_day"].unique()) <= {0, 1}
    assert "co_stale_hours" in feature_cols


def test_features_never_depend_on_future_observations():
    """Corrupting every reading AFTER time t must leave every feature at or before t unchanged."""
    raw = load_raw_archive1("data/AirQuality.csv")
    cleaned, _ = clean_dataset(raw)
    frame = calculate_pollutant_index_proxy(cleaned)

    cut = 4000
    corrupted = frame.copy()
    for col in ["CO(GT)", "NO2(GT)", "C6H6(GT)", "NOx(GT)", "T", "RH", "AH", "current_air_quality_index"]:
        corrupted.loc[cut + 1:, col] = corrupted.loc[cut + 1:, col] * 3.0 + 99.0

    clean_feats = build_feature_matrix(frame).iloc[: cut + 1]
    dirty_feats = build_feature_matrix(corrupted).iloc[: cut + 1]

    numeric = [c for c in clean_feats.columns if pd.api.types.is_numeric_dtype(clean_feats[c])]
    changed = [c for c in numeric if not np.allclose(clean_feats[c].fillna(-1), dirty_feats[c].fillna(-1))]
    assert changed == [], f"features leaked future information: {changed}"
