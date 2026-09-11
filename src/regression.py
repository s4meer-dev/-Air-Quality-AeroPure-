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
    model = Lasso(alpha=alpha, random_state=42, max_iter=2000)
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
    n_estimators: int = 250,
    learning_rate: float = 0.05,
    max_depth: int = 5,
    subsample: float = 0.8,
    colsample_bytree: float = 0.8,
    reg_alpha: float = 0.1,
    reg_lambda: float = 1.0
) -> Tuple[XGBRegressor, Dict[str, float], np.ndarray, pd.Series]:
    """Trains XGBRegressor as the Week 8 champion regression model."""
    model = XGBRegressor(
        n_estimators=n_estimators,
        learning_rate=learning_rate,
        max_depth=max_depth,
        subsample=subsample,
        colsample_bytree=colsample_bytree,
        reg_alpha=reg_alpha,
        reg_lambda=reg_lambda,
        random_state=42,
        n_jobs=-1
    )
    # Fit with validation evaluation
    model.fit(
        X_train, y_train,
        eval_set=[(X_train, y_train), (X_test, y_test)],
        verbose=False
    )
    preds = model.predict(X_test)
    metrics = evaluate_regression(y_test, preds)

    importances = pd.Series(model.feature_importances_, index=X_train.columns).sort_values(ascending=False)
    return model, metrics, preds, importances
