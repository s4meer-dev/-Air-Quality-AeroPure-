"""
AeroPure Hyperparameter Search (time-series safe)
=================================================
Random search for the XGBoost champions, scored by expanding-window cross-validation with a
`gap` equal to the forecast horizon so no training label overlaps a validation label.

The winning parameters are frozen in `src.regression.CHAMPION_XGB_REGRESSOR_PARAMS` and
`src.classification.CHAMPION_XGB_CLASSIFIER_PARAMS`. Re-run the search with
`python scripts/tune_champion.py` when the data or features change; the full pipeline does not
re-tune on every run.
"""

from typing import Any, Dict, List, Tuple
import numpy as np
import pandas as pd
from sklearn.metrics import log_loss, mean_squared_error
from sklearn.model_selection import TimeSeriesSplit
from xgboost import XGBClassifier, XGBRegressor

CV_SPLITS = 5
CV_GAP_HOURS = 24

REGRESSOR_SPACE: Dict[str, List[Any]] = {
    "n_estimators": [150, 250, 400],
    "learning_rate": [0.02, 0.03, 0.05],
    "max_depth": [2, 3, 4, 5, 6],
    "min_child_weight": [1, 3, 5, 10, 20],
    "subsample": [0.6, 0.7, 0.8, 0.9],
    "colsample_bytree": [0.3, 0.5, 0.7, 0.9],
    "reg_alpha": [0.0, 0.1, 1.0, 5.0],
    "reg_lambda": [1.0, 5.0, 10.0, 30.0],
    "gamma": [0.0, 0.5, 2.0],
}
CLASSIFIER_SPACE = REGRESSOR_SPACE


def time_series_cv_splits(n_rows: int) -> List[Tuple[np.ndarray, np.ndarray]]:
    """Expanding-window splits with a purge gap between the training and validation windows."""
    return list(TimeSeriesSplit(n_splits=CV_SPLITS, gap=CV_GAP_HOURS).split(np.arange(n_rows)))


def cv_score(model_factory, X: pd.DataFrame, y: pd.Series, task: str) -> float:
    """Mean validation RMSE (regression) or log-loss (classification) across the CV folds."""
    scores = []
    for tr, va in time_series_cv_splits(len(X)):
        model = model_factory().fit(X.iloc[tr], y.iloc[tr])
        if task == "regression":
            scores.append(float(np.sqrt(mean_squared_error(y.iloc[va], model.predict(X.iloc[va])))))
        else:
            prob = np.clip(model.predict_proba(X.iloc[va])[:, 1], 1e-6, 1 - 1e-6)
            scores.append(float(log_loss(y.iloc[va], prob, labels=[0, 1])))
    return float(np.mean(scores))


def random_search_xgb(
    X: pd.DataFrame,
    y: pd.Series,
    task: str = "regression",
    n_iter: int = 40,
    seed: int = 0
) -> List[Tuple[float, Dict[str, Any]]]:
    """Returns `(cv_score, params)` pairs sorted best-first. `task` is "regression" or "classification"."""
    if task not in ("regression", "classification"):
        raise ValueError("task must be 'regression' or 'classification'")
    space = REGRESSOR_SPACE if task == "regression" else CLASSIFIER_SPACE
    rng = np.random.default_rng(seed)
    results = []
    for _ in range(n_iter):
        params = {k: v[int(rng.integers(len(v)))] for k, v in space.items()}
        params = {k: (float(x) if isinstance(x, (float, np.floating)) else int(x)) for k, x in params.items()}
        if task == "regression":
            factory = lambda p=params: XGBRegressor(**p, random_state=42, n_jobs=-1)
        else:
            factory = lambda p=params: XGBClassifier(**p, random_state=42, n_jobs=-1, eval_metric="logloss")
        results.append((cv_score(factory, X, y, task), params))
    results.sort(key=lambda r: r[0])
    return results
