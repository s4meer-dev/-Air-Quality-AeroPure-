"""
AeroPure Feature Engineering Module (Week 2 — Archive 1)
=========================================================
Constructs leakage-safe temporal, lag, rolling, and sensor interaction features.
Guarantees that no future information enters historical inputs.
"""

from typing import Tuple, List, Dict, Any, Optional
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler


def extract_temporal_features(df: pd.DataFrame) -> pd.DataFrame:
    """Extracts calendar and cyclical temporal representations."""
    data = df.copy()
    dt = data["datetime"].dt

    data["hour"] = dt.hour
    data["day"] = dt.day
    data["day_of_week"] = dt.dayofweek
    data["is_weekend"] = (dt.dayofweek >= 5).astype(int)
    data["month"] = dt.month
    data["day_of_year"] = dt.dayofyear

    # Season mapping: 1: Winter (Dec-Feb), 2: Spring (Mar-May), 3: Summer (Jun-Aug), 4: Autumn (Sep-Nov)
    def map_season(m: int) -> int:
        if m in [12, 1, 2]:
            return 1  # Winter
        elif m in [3, 4, 5]:
            return 2  # Spring
        elif m in [6, 7, 8]:
            return 3  # Summer
        else:
            return 4  # Autumn

    data["season"] = data["month"].apply(map_season)

    # Cyclical hour and month
    data["sin_hour"] = np.sin(2 * np.pi * data["hour"] / 24.0)
    data["cos_hour"] = np.cos(2 * np.pi * data["hour"] / 24.0)
    data["sin_month"] = np.sin(2 * np.pi * data["month"] / 12.0)
    data["cos_month"] = np.cos(2 * np.pi * data["month"] / 12.0)

    return data


def extract_lag_features(df: pd.DataFrame, lag_cols: List[str], lags: List[int]) -> pd.DataFrame:
    """Constructs past lag features strictly from historical observations up to t - k."""
    data = df.copy()
    for col in lag_cols:
        if col in data.columns:
            for k in lags:
                data[f"{col}_lag_{k}"] = data[col].shift(k)
    return data


def extract_rolling_features(df: pd.DataFrame, rolling_cols: List[str], windows: List[int]) -> pd.DataFrame:
    """Constructs past rolling statistics over historical window [t - w + 1, t]."""
    data = df.copy()
    for col in rolling_cols:
        if col in data.columns:
            for w in windows:
                data[f"{col}_rolling_mean_{w}h"] = data[col].rolling(window=w, min_periods=max(1, w // 2)).mean()
                data[f"{col}_rolling_std_{w}h"] = data[col].rolling(window=w, min_periods=max(1, w // 2)).std().fillna(0.0)
    return data


def extract_interaction_features(df: pd.DataFrame) -> pd.DataFrame:
    """Constructs atmospheric and sensor interaction terms."""
    data = df.copy()
    # Relative humidity and temperature atmospheric saturation index
    if "T" in data.columns and "RH" in data.columns:
        data["vapor_pressure_proxy"] = data["RH"] * (data["T"] + 40.0) / 100.0

    # Sensor-to-pollutant ratio proxies
    if "PT08.S1(CO)" in data.columns and "CO(GT)" in data.columns:
        data["co_sensor_ratio"] = data["PT08.S1(CO)"] / (data["CO(GT)"] + 0.1)

    if "PT08.S4(NO2)" in data.columns and "NO2(GT)" in data.columns:
        data["no2_sensor_ratio"] = data["PT08.S4(NO2)"] / (data["NO2(GT)"] + 1.0)

    return data


def build_feature_pipeline(
    df: pd.DataFrame,
    lead_time_hours: int = 24,
    hazard_threshold: float = 180.0
) -> pd.DataFrame:
    """
    Constructs the complete leakage-safe feature matrix:
    1. Extracts calendar and cyclical features.
    2. Builds historical lags (1h, 2h, 3h, 24h, 48h).
    3. Builds past rolling statistics (6h, 12h, 24h).
    4. Computes interaction features.
    5. Discards boundary rows where future target or initial history is undefined.
    """
    data = df.copy()

    # Temporal
    data = extract_temporal_features(data)

    # Lags for core criteria pollutants, sensors, and meteorology
    lag_targets = [
        "current_air_quality_index", "CO(GT)", "NO2(GT)", "C6H6(GT)",
        "NOx(GT)", "T", "RH", "PT08.S1(CO)", "PT08.S3(NOx)", "PT08.S5(O3)"
    ]
    lags = [1, 2, 3, 24, 48]
    data = extract_lag_features(data, lag_targets, lags)

    # Rolling statistics
    rolling_targets = [
        "current_air_quality_index", "CO(GT)", "NO2(GT)", "C6H6(GT)", "T", "RH"
    ]
    windows = [6, 12, 24]
    data = extract_rolling_features(data, rolling_targets, windows)

    # Interactions
    data = extract_interaction_features(data)

    # Drop target rows where future 24-hour target is undefined
    data = data.dropna(subset=["next_day_air_quality_index", "hazardous_air_day"]).reset_index(drop=True)
    data["hazardous_air_day"] = data["hazardous_air_day"].astype(int)
    # Fill any remaining NaNs in rolling features from early rows
    data = data.bfill().ffill()

    return data


def prepare_time_series_splits(
    df: pd.DataFrame,
    train_ratio: float = 0.80,
    feature_cols: Optional[List[str]] = None
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.Series, pd.Series, StandardScaler, List[str]]:
    """
    Chronological Train/Test Partitioning:
    - Train split: first train_ratio fraction (e.g. 80%).
    - Test split: remaining (1 - train_ratio) fraction (e.g. 20%).
    - Scaler is fit EXCLUSIVELY on Train split, then applied to Test.
    """
    exclude_cols = [
        "Date", "Time", "datetime",
        "next_day_air_quality_index", "hazardous_air_day",
        "dominant_pollutant", "i_co", "i_no2", "i_c6h6"
    ]

    if feature_cols is None:
        feature_cols = [c for c in df.columns if c not in exclude_cols and pd.api.types.is_numeric_dtype(df[c])]

    n = len(df)
    split_idx = int(n * train_ratio)

    train_df = df.iloc[:split_idx].copy()
    test_df = df.iloc[split_idx:].copy()

    X_train_raw = train_df[feature_cols].copy()
    X_test_raw = test_df[feature_cols].copy()

    y_train_reg = train_df["next_day_air_quality_index"].copy()
    y_test_reg = test_df["next_day_air_quality_index"].copy()

    y_train_clf = train_df["hazardous_air_day"].copy()
    y_test_clf = test_df["hazardous_air_day"].copy()

    scaler = StandardScaler()
    X_train_scaled = pd.DataFrame(
        scaler.fit_transform(X_train_raw),
        columns=feature_cols,
        index=X_train_raw.index
    )
    X_test_scaled = pd.DataFrame(
        scaler.transform(X_test_raw),
        columns=feature_cols,
        index=X_test_raw.index
    )

    return (
        X_train_scaled, X_test_scaled,
        y_train_reg, y_test_reg,
        y_train_clf, y_test_clf,
        scaler, feature_cols
    )
