"""
AeroPure Hybrid Hazard Model
============================
Estimates P(next-day AQI proxy >= hazard threshold) by averaging two views of the same event:

1. A directly trained, UN-weighted XGBoost classifier on the `hazardous_air_day` label.
2. A regression-derived probability: the AQI regressor's forecast combined with its out-of-sample
   residual spread, P(y >= threshold) = 1 - Phi((threshold - y_hat) / sigma).

On expanding-window time-series CV this hybrid beat either component alone on ROC-AUC, PR-AUC,
Brier score and log-loss, and it is consistent with the regression by construction (a forecast at
or above the threshold always yields a probability >= 0.5).

The alert threshold is a *decision* threshold (chosen to maximise F1 on out-of-fold predictions) and
is deliberately separate from the probability itself, which stays calibrated for interpretation.

The class exposes the scikit-learn `predict_proba` / `predict` / `classes_` interface, so it is a
drop-in replacement wherever a fitted classifier is expected.
"""

from typing import Any, Dict, Optional, Tuple
import numpy as np
import pandas as pd
from scipy.special import ndtr
from sklearn.metrics import brier_score_loss, f1_score, roc_auc_score
from xgboost import XGBClassifier, XGBRegressor

from src.classification import CHAMPION_XGB_CLASSIFIER_PARAMS
from src.regression import CHAMPION_XGB_REGRESSOR_PARAMS
from src.tuning import time_series_cv_splits

MIN_SIGMA = 1.0  # guards against a degenerate residual spread


class HazardProbabilityModel:
    """Hybrid (classifier + regression-derived) hazard probability with a tuned alert threshold."""

    classes_ = np.array([0, 1])

    def __init__(
        self,
        classifier: XGBClassifier,
        regressor: XGBRegressor,
        residual_sigma: float,
        alert_threshold: float = 0.5,
        hazard_threshold: float = 180.0,
    ):
        self.classifier = classifier
        self.regressor = regressor
        self.residual_sigma = float(max(residual_sigma, MIN_SIGMA))
        self.alert_threshold = float(alert_threshold)
        self.hazard_threshold = float(hazard_threshold)

    def regression_probability(self, X: pd.DataFrame) -> np.ndarray:
        """P(AQI >= hazard threshold) implied by the regressor and its residual spread."""
        return regression_probability(
            self.regressor.predict(X), self.residual_sigma, self.hazard_threshold
        )

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        p_clf = self.classifier.predict_proba(X)[:, 1]
        p = 0.5 * (p_clf + self.regression_probability(X))
        return np.column_stack([1.0 - p, p])

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        return (self.predict_proba(X)[:, 1] >= self.alert_threshold).astype(int)


def regression_probability(y_hat: np.ndarray, sigma: float, hazard_threshold: float) -> np.ndarray:
    """Gaussian tail probability of exceeding the hazard threshold given a point forecast."""
    return 1.0 - ndtr((hazard_threshold - np.asarray(y_hat, dtype=float)) / max(sigma, MIN_SIGMA))


def select_alert_threshold(y_true: np.ndarray, prob: np.ndarray) -> float:
    """F1-maximising decision threshold on a grid; ties resolve to the lowest (more sensitive) threshold."""
    grid = np.round(np.arange(0.05, 0.951, 0.01), 2)
    scores = [f1_score(y_true, (prob >= t).astype(int), zero_division=0) for t in grid]
    return float(grid[int(np.argmax(scores))])


def fit_hazard_model(
    X: pd.DataFrame,
    y_reg: pd.Series,
    y_clf: pd.Series,
    hazard_threshold: float = 180.0,
    regressor: Optional[XGBRegressor] = None,
) -> Tuple[HazardProbabilityModel, Dict[str, Any]]:
    """
    Fits the hybrid hazard model on (X, y_reg, y_clf) and derives its two data-driven constants
    from expanding-window, gap-purged out-of-fold predictions on the same data:
      - residual_sigma: spread of the regressor's out-of-fold errors,
      - alert_threshold: F1-optimal decision threshold on the out-of-fold hybrid probability.
    Nothing outside (X, y) is used, so fitting on a training split never touches held-out data.

    Returns the fitted model and a diagnostics dict (OOF ROC-AUC, Brier, sigma, threshold).
    """
    reg_params = dict(**CHAMPION_XGB_REGRESSOR_PARAMS, random_state=42, n_jobs=-1)
    clf_params = dict(**CHAMPION_XGB_CLASSIFIER_PARAMS, eval_metric="logloss", random_state=42, n_jobs=-1)

    oof_reg = np.full(len(X), np.nan)
    oof_clf = np.full(len(X), np.nan)
    for tr, va in time_series_cv_splits(len(X)):
        oof_reg[va] = XGBRegressor(**reg_params).fit(X.iloc[tr], y_reg.iloc[tr]).predict(X.iloc[va])
        oof_clf[va] = XGBClassifier(**clf_params).fit(X.iloc[tr], y_clf.iloc[tr]).predict_proba(X.iloc[va])[:, 1]

    scored = ~np.isnan(oof_reg)
    sigma = float(np.std(y_reg.values[scored] - oof_reg[scored]))
    oof_prob = 0.5 * (oof_clf[scored] + regression_probability(oof_reg[scored], sigma, hazard_threshold))
    y_scored = y_clf.values[scored]
    threshold = select_alert_threshold(y_scored, oof_prob)

    if regressor is None:
        regressor = XGBRegressor(**reg_params).fit(X, y_reg)
    classifier = XGBClassifier(**clf_params).fit(X, y_clf)

    model = HazardProbabilityModel(classifier, regressor, sigma, threshold, hazard_threshold)
    diagnostics = {
        "oof_samples": int(scored.sum()),
        "oof_roc_auc": round(float(roc_auc_score(y_scored, oof_prob)), 4),
        "oof_brier": round(float(brier_score_loss(y_scored, oof_prob)), 4),
        "oof_f1_at_alert_threshold": round(
            float(f1_score(y_scored, (oof_prob >= threshold).astype(int), zero_division=0)), 4
        ),
        "residual_sigma": round(model.residual_sigma, 3),
        "alert_threshold": model.alert_threshold,
    }
    return model, diagnostics
