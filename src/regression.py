"""
AeroPure Regression Suite (Weeks 3–8)
=====================================
Implements regression models for predicting tomorrow's AQI:
- Linear Regression (OLS Baseline) [Week 3]
- Ridge Regression (L2 Regularized) [Week 4]
- Lasso Regression (L1 Regularized) [Week 4]
- DecisionTreeRegressor [Week 6]
- RandomForestRegressor [Week 7]
- XGBRegressor (Champion Model) [Week 8]
"""

from typing import Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# Champion XGBoost regressor hyperparameters, chosen by random search scored with expanding-window
# time-series CV (24h purge gap) on the training split only (see src/tuning.py, scripts/tune_champion.py).
# Shallow trees, a low learning rate, aggressive column subsampling and strong child-weight/L1/L2
# regularisation beat the earlier hand-set config (depth 5, lr 0.05) on CV RMSE and held-out RMSE.
CHAMPION_XGB_REGRESSOR_PARAMS: Dict[str, Any] = {
    "n_estimators": 250,
    "learning_rate": 0.02,
    "max_depth": 4,
    "min_child_weight": 20,
    "subsample": 0.8,
    "colsample_bytree": 0.3,
    "reg_alpha": 1.0,
    "reg_lambda": 5.0,
    "gamma": 0.0,
}


def evaluate_regression(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """Computes standard regression evaluation metrics: MAE, MSE, RMSE, R²."""
    mae = mean_absolute_error(y_true, y_pred)
    mse = mean_squared_error(y_true, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_true, y_pred)
    return {
        "MAE": round(float(mae), 3),
        "MSE": round(float(mse), 3),
        "RMSE": round(float(rmse), 3),
        "R2": round(float(r2), 4),
    }


def train_ols_regression(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series
) -> Tuple[LinearRegression, Dict[str, float], np.ndarray, pd.Series]:
    """Trains Ordinary Least Squares (OLS) Linear Regression baseline."""
    model = LinearRegression()
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    metrics = evaluate_regression(y_test, preds)

    coef_series = pd.Series(model.coef_, index=X_train.columns).sort_values(ascending=False)
    return model, metrics, preds, coef_series


def train_ridge_regression(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    alpha: float = 10.0
) -> Tuple[Ridge, Dict[str, float], np.ndarray, pd.Series]:
    """Trains Ridge Regression (L2 penalty) to stabilize collinearity."""
    model = Ridge(alpha=alpha, random_state=42)
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    metrics = evaluate_regression(y_test, preds)

    coef_series = pd.Series(model.coef_, index=X_train.columns).sort_values(ascending=False)
    return model, metrics, preds, coef_series


def train_lasso_regression(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    alpha: float = 0.5
) -> Tuple[Lasso, Dict[str, float], np.ndarray, pd.Series]:
    """Trains Lasso Regression (L1 penalty) for feature selection and sparsity."""
    model = Lasso(alpha=alpha, random_state=42, max_iter=20000)
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    metrics = evaluate_regression(y_test, preds)

    coef_series = pd.Series(model.coef_, index=X_train.columns).sort_values(ascending=False)
    return model, metrics, preds, coef_series


def train_decision_tree_regressor(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    max_depth: int = 6,
    min_samples_split: int = 10,
    min_samples_leaf: int = 5
) -> Tuple[DecisionTreeRegressor, Dict[str, float], np.ndarray, pd.Series]:
    """Trains a single interpretable DecisionTreeRegressor."""
    model = DecisionTreeRegressor(
        max_depth=max_depth,
        min_samples_split=min_samples_split,
        min_samples_leaf=min_samples_leaf,
        random_state=42
    )
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    metrics = evaluate_regression(y_test, preds)

    importances = pd.Series(model.feature_importances_, index=X_train.columns).sort_values(ascending=False)
    return model, metrics, preds, importances


def train_random_forest_regressor(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    n_estimators: int = 150,
    max_depth: int = 12,
    min_samples_split: int = 6,
    min_samples_leaf: int = 3,
    max_features: str = "sqrt"
) -> Tuple[RandomForestRegressor, Dict[str, float], np.ndarray, pd.Series, float]:
    """Trains RandomForestRegressor with Out-of-Bag (OOB) scoring."""
    model = RandomForestRegressor(
        n_estimators=n_estimators,
        max_depth=max_depth,
        min_samples_split=min_samples_split,
        min_samples_leaf=min_samples_leaf,
        max_features=max_features,
        oob_score=True,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    metrics = evaluate_regression(y_test, preds)
    oob_score = round(float(model.oob_score_), 4)

    importances = pd.Series(model.feature_importances_, index=X_train.columns).sort_values(ascending=False)
    return model, metrics, preds, importances, oob_score


def train_xgboost_regressor(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    **overrides: Any
) -> Tuple[XGBRegressor, Dict[str, float], np.ndarray, pd.Series]:
    """
    Trains XGBRegressor as the champion regression model.

    Defaults to CHAMPION_XGB_REGRESSOR_PARAMS; any keyword overrides them. The test split is used
    only to score the fitted model: it is never passed to `fit`, so it cannot influence training,
    early stopping or model selection.
    """
    params = {**CHAMPION_XGB_REGRESSOR_PARAMS, **overrides}
    model = XGBRegressor(**params, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train, verbose=False)
    preds = model.predict(X_test)
    metrics = evaluate_regression(y_test, preds)

    importances = pd.Series(model.feature_importances_, index=X_train.columns).sort_values(ascending=False)
    return model, metrics, preds, importances


def regression_baselines(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
    target_col: str = "next_day_air_quality_index",
    current_col: str = "current_air_quality_index"
) -> Dict[str, Tuple[Dict[str, float], np.ndarray]]:
    """
    Naive reference forecasts every learned model must beat to justify its complexity.
    All are computed from training data or current observations only (no test leakage).
      - Persistence: tomorrow's AQI = the AQI right now (same hour, one day earlier than the target).
      - Hour-of-day climatology: mean target for that hour of day, estimated on the training split.
      - Training mean: constant prediction.
    """
    y_test = test_df[target_col].values
    out: Dict[str, Tuple[Dict[str, float], np.ndarray]] = {}

    persistence = test_df[current_col].values
    out["Baseline: Persistence (AQI now)"] = (evaluate_regression(y_test, persistence), persistence)

    hourly_mean = train_df.groupby("hour")[target_col].mean()
    climatology = test_df["hour"].map(hourly_mean).fillna(train_df[target_col].mean()).values
    out["Baseline: Hour-of-day Climatology"] = (evaluate_regression(y_test, climatology), climatology)

    constant = np.full(len(test_df), float(train_df[target_col].mean()))
    out["Baseline: Training Mean"] = (evaluate_regression(y_test, constant), constant)
    return out
