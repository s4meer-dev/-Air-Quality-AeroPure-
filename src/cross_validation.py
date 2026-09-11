"""
AeroPure Cross-Validation & Tuning Module (Week 5)
==================================================
Implements time-aware cross-validation using TimeSeriesSplit.
Strictly prevents temporal lookahead leakage.
"""

from typing import Dict, List, Any, Tuple
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import TimeSeriesSplit
from sklearn.linear_model import LinearRegression, Ridge, Lasso, LogisticRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, f1_score, roc_auc_score



def evaluate_regression_timeseries_cv(
    model,
    X: pd.DataFrame,
    y: pd.Series,
    n_splits: int = 5
) -> Dict[str, float]:
    """Runs TimeSeriesSplit cross validation for a regression model."""
    tscv = TimeSeriesSplit(n_splits=n_splits)
    maes, rmses, r2s = [], [], []

    for train_idx, test_idx in tscv.split(X):
        X_tr, X_te = X.iloc[train_idx], X.iloc[test_idx]
        y_tr, y_te = y.iloc[train_idx], y.iloc[test_idx]

        model.fit(X_tr, y_tr)
        preds = model.predict(X_te)

        maes.append(mean_absolute_error(y_te, preds))
        rmses.append(np.sqrt(mean_squared_error(y_te, preds)))
        r2s.append(r2_score(y_te, preds))

    return {
        "MAE_mean": round(float(np.mean(maes)), 3),
        "MAE_std": round(float(np.std(maes)), 3),
        "RMSE_mean": round(float(np.mean(rmses)), 3),
        "RMSE_std": round(float(np.std(rmses)), 3),
        "R2_mean": round(float(np.mean(r2s)), 4),
        "R2_std": round(float(np.std(r2s)), 4),
    }


def run_nested_timeseries_cv(
    X_train: pd.DataFrame,
    y_train_reg: pd.Series,
    n_outer_splits: int = 5,
    n_inner_splits: int = 3
) -> Tuple[pd.DataFrame, Dict[str, float]]:
    """
    Week 10 Nested Time-Series Cross Validation:
    Outer TimeSeriesSplit evaluates generalizability across expanding historical windows.
    Inner TimeSeriesSplit tunes hyperparameters strictly on the training folds.
    The outer fold remains completely unseen during inner hyperparameter selection.
    """
    import xgboost as xgb
    outer_tscv = TimeSeriesSplit(n_splits=n_outer_splits)
    fold_records = []
    
    # Grid for inner tuning
    param_grid = [
        {"max_depth": 3, "learning_rate": 0.08},
        {"max_depth": 5, "learning_rate": 0.08}
    ]

    for fold, (out_tr_idx, out_val_idx) in enumerate(outer_tscv.split(X_train)):
        X_outer_tr, X_outer_val = X_train.iloc[out_tr_idx], X_train.iloc[out_val_idx]
        y_outer_tr, y_outer_val = y_train_reg.iloc[out_tr_idx], y_train_reg.iloc[out_val_idx]

        inner_tscv = TimeSeriesSplit(n_splits=n_inner_splits)
        best_params = None
        best_inner_rmse = float("inf")

        for params in param_grid:
            inner_rmses = []
            for in_tr_idx, in_val_idx in inner_tscv.split(X_outer_tr):
                X_in_tr, X_in_val = X_outer_tr.iloc[in_tr_idx], X_outer_tr.iloc[in_val_idx]
                y_in_tr, y_in_val = y_outer_tr.iloc[in_tr_idx], y_outer_tr.iloc[in_val_idx]
                m = xgb.XGBRegressor(n_estimators=60, random_state=42, n_jobs=-1, **params)
                m.fit(X_in_tr, y_in_tr)
                p = m.predict(X_in_val)
                inner_rmses.append(np.sqrt(mean_squared_error(y_in_val, p)))
            avg_inner = float(np.mean(inner_rmses))
            if avg_inner < best_inner_rmse:
                best_inner_rmse = avg_inner
                best_params = params

        # Fit best model on entire outer train fold
        champ = xgb.XGBRegressor(n_estimators=100, random_state=42, n_jobs=-1, **best_params)
        champ.fit(X_outer_tr, y_outer_tr)
        val_preds = champ.predict(X_outer_val)

        f_rmse = float(np.sqrt(mean_squared_error(y_outer_val, val_preds)))
        f_mae = float(mean_absolute_error(y_outer_val, val_preds))
        f_r2 = float(r2_score(y_outer_val, val_preds))

        fold_records.append({
            "fold": fold + 1,
            "train_samples": len(X_outer_tr),
            "val_samples": len(X_outer_val),
            "best_params": json.dumps(best_params),
            "rmse": round(f_rmse, 3),
            "mae": round(f_mae, 3),
            "r2": round(f_r2, 4)
        })

    nested_df = pd.DataFrame(fold_records)
    summary = {
        "nested_rmse_mean": round(float(nested_df["rmse"].mean()), 3),
        "nested_rmse_std": round(float(nested_df["rmse"].std()), 3),
        "nested_mae_mean": round(float(nested_df["mae"].mean()), 3),
        "nested_mae_std": round(float(nested_df["mae"].std()), 3),
        "nested_r2_mean": round(float(nested_df["r2"].mean()), 4),
        "nested_r2_std": round(float(nested_df["r2"].std()), 4),
    }
    return nested_df, summary



def evaluate_classification_timeseries_cv(
    model,
    X: pd.DataFrame,
    y: pd.Series,
    n_splits: int = 5
) -> Dict[str, float]:
    """Runs TimeSeriesSplit cross validation for a classification model."""
    tscv = TimeSeriesSplit(n_splits=n_splits)
    f1s, aucs = [], []

    for train_idx, test_idx in tscv.split(X):
        X_tr, X_te = X.iloc[train_idx], X.iloc[test_idx]
        y_tr, y_te = y.iloc[train_idx], y.iloc[test_idx]

        # Ensure both classes exist in this fold's training slice
        if len(np.unique(y_tr)) < 2:
            continue

        model.fit(X_tr, y_tr)
        preds = model.predict(X_te)
        f1s.append(f1_score(y_te, preds, zero_division=0))

        if hasattr(model, "predict_proba") and len(np.unique(y_te)) > 1:
            probs = model.predict_proba(X_te)[:, 1]
            try:
                aucs.append(roc_auc_score(y_te, probs))
            except Exception:
                pass

    return {
        "F1_mean": round(float(np.mean(f1s)), 4) if f1s else 0.0,
        "F1_std": round(float(np.std(f1s)), 4) if f1s else 0.0,
        "ROC_AUC_mean": round(float(np.mean(aucs)), 4) if aucs else 0.5,
        "ROC_AUC_std": round(float(np.std(aucs)), 4) if aucs else 0.0,
    }


def tune_ridge_alpha(
    X: pd.DataFrame,
    y: pd.Series,
    alphas: List[float] = [0.01, 0.1, 1.0, 5.0, 10.0, 50.0, 100.0, 500.0],
    n_splits: int = 5
) -> Tuple[float, Dict[str, float]]:
    """Finds best alpha for Ridge Regression via TimeSeriesSplit."""
    best_alpha = alphas[0]
    best_rmse = float("inf")
    best_metrics = {}

    for a in alphas:
        model = Ridge(alpha=a, random_state=42)
        res = evaluate_regression_timeseries_cv(model, X, y, n_splits=n_splits)
        if res["RMSE_mean"] < best_rmse:
            best_rmse = res["RMSE_mean"]
            best_alpha = a
            best_metrics = res

    return best_alpha, best_metrics


def tune_lasso_alpha(
    X: pd.DataFrame,
    y: pd.Series,
    alphas: List[float] = [0.01, 0.05, 0.1, 0.5, 1.0, 5.0, 10.0],
    n_splits: int = 5
) -> Tuple[float, Dict[str, float]]:
    """Finds best alpha for Lasso Regression via TimeSeriesSplit."""
    best_alpha = alphas[0]
    best_rmse = float("inf")
    best_metrics = {}

    for a in alphas:
        model = Lasso(alpha=a, random_state=42, max_iter=2000)
        res = evaluate_regression_timeseries_cv(model, X, y, n_splits=n_splits)
        if res["RMSE_mean"] < best_rmse:
            best_rmse = res["RMSE_mean"]
            best_alpha = a
            best_metrics = res

    return best_alpha, best_metrics


def run_week5_benchmark(
    X_train: pd.DataFrame,
    y_train_reg: pd.Series,
    y_train_clf: pd.Series,
    n_splits: int = 5
) -> pd.DataFrame:
    """
    Executes Week 5 TimeSeriesSplit validation across all baseline models:
    - Linear Regression
    - Ridge (tuned)
    - Lasso (tuned)
    - Logistic Regression (tuned C)
    """
    results = []

    # 1. Linear Regression
    ols = LinearRegression()
    ols_res = evaluate_regression_timeseries_cv(ols, X_train, y_train_reg, n_splits=n_splits)
    results.append({
        "Model": "Linear Regression (OLS)",
        "Type": "Regression",
        "MAE": f"{ols_res['MAE_mean']} ± {ols_res['MAE_std']}",
        "RMSE": f"{ols_res['RMSE_mean']} ± {ols_res['RMSE_std']}",
        "R2": f"{ols_res['R2_mean']} ± {ols_res['R2_std']}",
        "F1": "-",
        "ROC_AUC": "-",
        "RMSE_val": ols_res["RMSE_mean"]
    })

    # 2. Ridge
    best_r_alpha, ridge_res = tune_ridge_alpha(X_train, y_train_reg, n_splits=n_splits)
    results.append({
        "Model": f"Ridge (alpha={best_r_alpha})",
        "Type": "Regression",
        "MAE": f"{ridge_res['MAE_mean']} ± {ridge_res['MAE_std']}",
        "RMSE": f"{ridge_res['RMSE_mean']} ± {ridge_res['RMSE_std']}",
        "R2": f"{ridge_res['R2_mean']} ± {ridge_res['R2_std']}",
        "F1": "-",
        "ROC_AUC": "-",
        "RMSE_val": ridge_res["RMSE_mean"]
    })

    # 3. Lasso
    best_l_alpha, lasso_res = tune_lasso_alpha(X_train, y_train_reg, n_splits=n_splits)
    results.append({
        "Model": f"Lasso (alpha={best_l_alpha})",
        "Type": "Regression",
        "MAE": f"{lasso_res['MAE_mean']} ± {lasso_res['MAE_std']}",
        "RMSE": f"{lasso_res['RMSE_mean']} ± {lasso_res['RMSE_std']}",
        "R2": f"{lasso_res['R2_mean']} ± {lasso_res['R2_std']}",
        "F1": "-",
        "ROC_AUC": "-",
        "RMSE_val": lasso_res["RMSE_mean"]
    })

    # 4. Logistic Regression
    best_c = 1.0
    best_f1 = -1.0
    best_log_res = {}
    for c_val in [0.01, 0.1, 1.0, 10.0]:
        log_clf = LogisticRegression(C=c_val, class_weight="balanced", max_iter=1000, random_state=42)
        res = evaluate_classification_timeseries_cv(log_clf, X_train, y_train_clf, n_splits=n_splits)
        if res["F1_mean"] > best_f1:
            best_f1 = res["F1_mean"]
            best_c = c_val
            best_log_res = res

    results.append({
        "Model": f"Logistic Regression (C={best_c})",
        "Type": "Classification",
        "MAE": "-",
        "RMSE": "-",
        "R2": "-",
        "F1": f"{best_log_res.get('F1_mean', 0.0)} ± {best_log_res.get('F1_std', 0.0)}",
        "ROC_AUC": f"{best_log_res.get('ROC_AUC_mean', 0.5)} ± {best_log_res.get('ROC_AUC_std', 0.0)}",
        "RMSE_val": 9999.0
    })

    df_cv = pd.DataFrame(results).drop(columns=["RMSE_val"])
    return df_cv
