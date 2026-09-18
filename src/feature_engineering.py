"""
AeroPure Feature Engineering Module (Week 2 — Archive 1)
=========================================================
Constructs leakage-safe temporal, lag, rolling, trend and sensor interaction features.
Guarantees that no future information enters historical inputs.

`build_feature_matrix` is the single source of truth for feature construction. Training
(`build_feature_pipeline`) and online inference (`api.services`) both call it, so the model is
always served exactly the features it was trained on.
"""

from typing import Tuple, List, Optional
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

from src.aqi import calculate_pollutant_index_proxy, create_targets


# Columns that must never be used as model inputs: identifiers, targets, and target-derived flags.
NON_FEATURE_COLUMNS = [
    "Date", "Time", "datetime",
    "next_day_air_quality_index", "hazardous_air_day",
    "dominant_pollutant", "i_co", "i_no2", "i_c6h6",
    "criteria_observed",
]

LEAD_TIME_HOURS = 24

# Lags (hours). For a 24h-ahead target, lag 0 is "same hour yesterday", lag 24 is "two days before the
# target day" and lag 144 is "same hour one week before the target day".
AQI_LAGS = [1, 2, 3, 6, 12, 24, 48, 72, 144]
POLLUTANT_LAGS = [1, 2, 3, 24, 48]
ROLLING_WINDOWS = [6, 12, 24]
LONG_ROLLING_WINDOWS = [72, 168]


def get_feature_columns(df: pd.DataFrame) -> List[str]:
    """Numeric model-input columns of a feature frame (everything except identifiers/targets)."""
    return [c for c in df.columns if c not in NON_FEATURE_COLUMNS and pd.api.types.is_numeric_dtype(df[c])]


def extract_temporal_features(df: pd.DataFrame, lead_time_hours: int = LEAD_TIME_HOURS) -> pd.DataFrame:
    """Extracts calendar and cyclical temporal representations (of now and of the target day)."""
    data = df.copy()
    dt = data["datetime"].dt

    # Deliberately no day-of-month / day-of-year: with only ~13 months of history they act as
    # calendar-date identifiers that let a tree memorise specific past episodes instead of learning
    # patterns that generalise to a new year. Month/season already carry the seasonal signal.
    data["hour"] = dt.hour
    data["day_of_week"] = dt.dayofweek
    data["is_weekend"] = (dt.dayofweek >= 5).astype(int)
    data["month"] = dt.month

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

    # Calendar of the day being forecast. Traffic-driven pollutants follow the weekly cycle, and the
    # target day is a different weekday than "now" (e.g. Friday evening -> Saturday evening). The
    # calendar is public knowledge at forecast time, so this is not leakage.
    target_dt = (data["datetime"] + pd.Timedelta(hours=lead_time_hours)).dt
    data["target_day_of_week"] = target_dt.dayofweek
    data["target_is_weekend"] = (target_dt.dayofweek >= 5).astype(int)

    return data


def extract_lag_features(df: pd.DataFrame, lag_cols: List[str], lags: List[int]) -> pd.DataFrame:
    """Constructs past lag features strictly from historical observations up to t - k."""
    data = df.copy()
    new_cols = {}
    for col in lag_cols:
        if col in data.columns:
            for k in lags:
                new_cols[f"{col}_lag_{k}"] = data[col].shift(k)
    if new_cols:
        data = pd.concat([data, pd.DataFrame(new_cols, index=data.index)], axis=1)
    return data


def extract_rolling_features(df: pd.DataFrame, rolling_cols: List[str], windows: List[int]) -> pd.DataFrame:
    """Constructs past rolling statistics over historical window [t - w + 1, t]."""
    data = df.copy()
    new_cols = {}
    for col in rolling_cols:
        if col in data.columns:
            for w in windows:
                roll = data[col].rolling(window=w, min_periods=max(1, w // 2))
                new_cols[f"{col}_rolling_mean_{w}h"] = roll.mean()
                new_cols[f"{col}_rolling_std_{w}h"] = roll.std().fillna(0.0)
    if new_cols:
        data = pd.concat([data, pd.DataFrame(new_cols, index=data.index)], axis=1)
    return data


def extract_trend_features(df: pd.DataFrame, aqi_col: str = "current_air_quality_index") -> pd.DataFrame:
    """Short/long-term AQI momentum, extremes and exponentially weighted levels (all backward-looking)."""
    data = df.copy()
    if aqi_col not in data.columns:
        return data
    aqi = data[aqi_col]
    new_cols = {
        "aqi_diff_1h": aqi.diff(1),
        "aqi_diff_3h": aqi.diff(3),
        "aqi_diff_24h": aqi.diff(24),
        "aqi_ewm_6h": aqi.ewm(span=6, adjust=False).mean(),
        "aqi_ewm_24h": aqi.ewm(span=24, adjust=False).mean(),
        "aqi_rolling_max_24h": aqi.rolling(24, min_periods=12).max(),
        "aqi_rolling_min_24h": aqi.rolling(24, min_periods=12).min(),
    }
    for w in LONG_ROLLING_WINDOWS:
        new_cols[f"aqi_rolling_mean_{w}h"] = aqi.rolling(w, min_periods=w // 2).mean()
    return pd.concat([data, pd.DataFrame(new_cols, index=data.index)], axis=1)


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


def build_feature_matrix(df: pd.DataFrame, lead_time_hours: int = LEAD_TIME_HOURS) -> pd.DataFrame:
    """
    Builds every model input feature from a chronologically ordered, gap-free hourly frame that
    already contains `datetime`, the raw sensor columns and `current_air_quality_index`.

    Row i only uses information from rows <= i, so the matrix is safe to compute on a full series.
    No rows are dropped and no targets are touched; early rows simply have undefined long lags (NaN).
    """
    data = extract_temporal_features(df, lead_time_hours)

    aqi_col = "current_air_quality_index"
    other_lag_targets = [
        "CO(GT)", "NO2(GT)", "C6H6(GT)",
        "NOx(GT)", "T", "RH", "PT08.S1(CO)", "PT08.S3(NOx)", "PT08.S5(O3)"
    ]
    data = extract_lag_features(data, [aqi_col], AQI_LAGS)
    data = extract_lag_features(data, other_lag_targets, POLLUTANT_LAGS)

    rolling_targets = [aqi_col, "CO(GT)", "NO2(GT)", "C6H6(GT)", "T", "RH"]
    data = extract_rolling_features(data, rolling_targets, ROLLING_WINDOWS)

    data = extract_trend_features(data, aqi_col)
    data = extract_interaction_features(data)
    return data


def build_feature_pipeline(
    df: pd.DataFrame,
    lead_time_hours: int = LEAD_TIME_HOURS,
    hazard_threshold: float = 180.0
) -> pd.DataFrame:
    """
    Constructs the complete leakage-safe training matrix:
    1. Builds calendar, lag (1h..144h), rolling (6h..168h), trend and interaction features.
    2. Discards rows whose 24h-ahead target was not genuinely observed.
    3. Discards the leading rows whose long-history features are undefined.

    No backward fill is used anywhere: a NaN is either an undefined lag (row dropped) or handled
    explicitly, never patched with a value from the future.
    """
    data = df.copy()

    if "next_day_air_quality_index" not in data.columns or "hazardous_air_day" not in data.columns:
        if "current_air_quality_index" not in data.columns:
            data = calculate_pollutant_index_proxy(data, require_all_pollutants=False)
        data = create_targets(data, lead_time_hours=lead_time_hours, hazard_threshold=hazard_threshold)

    data = build_feature_matrix(data, lead_time_hours)

    data = data.dropna(subset=["next_day_air_quality_index", "hazardous_air_day"])
    feature_cols = get_feature_columns(data)
    data = data.dropna(subset=feature_cols).reset_index(drop=True)
    data["hazardous_air_day"] = data["hazardous_air_day"].astype(int)

    return data


def prepare_time_series_splits(
    df: pd.DataFrame,
    train_ratio: float = 0.80,
    feature_cols: Optional[List[str]] = None,
    purge_hours: int = LEAD_TIME_HOURS
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.Series, pd.Series, StandardScaler, List[str]]:
    """
    Chronological Train/Test Partitioning:
    - Test split: the last (1 - train_ratio) fraction of rows.
    - Train split: the first train_ratio fraction, minus rows within `purge_hours` of the test start.
      A training row's label is an AQI reading `purge_hours` in the future, so the newest training
      labels would otherwise sit directly adjacent to (and be strongly autocorrelated with) the first
      test labels. Purging removes that optimistic overlap.
    - Scaler is fit EXCLUSIVELY on Train split, then applied to Test.
    """
    if feature_cols is None:
        feature_cols = get_feature_columns(df)

    n = len(df)
    split_idx = int(n * train_ratio)

    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]

    if purge_hours > 0 and "datetime" in df.columns and len(test_df) > 0:
        cutoff = pd.to_datetime(test_df["datetime"].iloc[0]) - pd.Timedelta(hours=purge_hours)
        train_df = train_df[pd.to_datetime(train_df["datetime"]) <= cutoff]

    train_df = train_df.copy()
    test_df = test_df.copy()

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
