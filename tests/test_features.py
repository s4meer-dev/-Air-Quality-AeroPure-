"""
Tests for Leakage-Safe Feature Engineering and Splits
"""

import pytest
import pandas as pd
import numpy as np

from src.feature_engineering import (
    extract_temporal_features, extract_lag_features,
    extract_rolling_features, prepare_time_series_splits
)


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
    """Verify train/test splits maintain strict chronological ordering."""
    df = pd.read_csv("data/processed_data.csv")
    X_tr, X_te, y_tr_reg, y_te_reg, y_tr_clf, y_te_clf, scaler, feature_cols = prepare_time_series_splits(df, train_ratio=0.80)

    assert len(X_tr) + len(X_te) == len(df)
    assert len(X_tr) == int(len(df) * 0.80)
    # Check that test indices come strictly after train indices
    assert X_te.index[0] > X_tr.index[-1]
    assert len(feature_cols) == 113
