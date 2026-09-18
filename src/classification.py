"""
AeroPure Classification Suite (Weeks 4–8)
=========================================
Implements binary classification models for hazardous air day detection:
- Logistic Regression (Baseline Classifier) [Week 4]
- DecisionTreeClassifier [Week 6]
- RandomForestClassifier [Week 7]
- XGBClassifier (Champion Model) [Week 8]
"""

from typing import Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix,
    average_precision_score, brier_score_loss
)


# Champion XGBoost hazard-classifier hyperparameters (search: src/tuning.py, scripts/tune_champion.py).
# The classifier is trained WITHOUT class re-weighting: re-weighting inflates predicted probabilities
# (base rate ~24%) and worsened held-out Brier score; the alert threshold is tuned separately instead.
CHAMPION_XGB_CLASSIFIER_PARAMS: Dict[str, Any] = {
    "n_estimators": 150,
    "learning_rate": 0.02,
    "max_depth": 4,
    "min_child_weight": 5,
    "subsample": 0.7,
    "colsample_bytree": 0.3,
    "reg_alpha": 0.0,
    "reg_lambda": 1.0,
    "gamma": 0.0,
}


def evaluate_classification(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: Optional[np.ndarray] = None
) -> Tuple[Dict[str, float], np.ndarray]:
    """Computes Accuracy, Precision, Recall, F1, ROC-AUC, PR-AUC and Brier score with the Confusion Matrix."""
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)

    # ROC/PR-AUC need predicted probabilities and at least 2 distinct classes in y_true
    has_both_classes = y_prob is not None and len(np.unique(y_true)) > 1
    auc = float(roc_auc_score(y_true, y_prob)) if has_both_classes else 0.5
    pr_auc = float(average_precision_score(y_true, y_prob)) if has_both_classes else float(np.mean(y_true))
    brier = float(brier_score_loss(y_true, y_prob)) if y_prob is not None else float("nan")

    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    metrics = {
        "Accuracy": round(float(acc), 4),
        "Precision": round(float(prec), 4),
        "Recall": round(float(rec), 4),
        "F1": round(float(f1), 4),
        "ROC_AUC": round(float(auc), 4),
        "PR_AUC": round(float(pr_auc), 4),
        "Brier": round(float(brier), 4),
    }
    return metrics, cm


def train_logistic_regression(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    C: float = 1.0
) -> Tuple[LogisticRegression, Dict[str, float], np.ndarray, np.ndarray, np.ndarray]:
    """Trains Logistic Regression classifier with balanced class weighting."""
    model = LogisticRegression(
        C=C,
        class_weight="balanced",
        max_iter=1500,
        random_state=42
    )
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else None
    metrics, cm = evaluate_classification(y_test, preds, probs)
    return model, metrics, preds, probs, cm


def train_decision_tree_classifier(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    max_depth: int = 5,
    min_samples_split: int = 10,
    min_samples_leaf: int = 5
) -> Tuple[DecisionTreeClassifier, Dict[str, float], np.ndarray, np.ndarray, np.ndarray, pd.Series]:
    """Trains interpretable DecisionTreeClassifier with balanced weights."""
    model = DecisionTreeClassifier(
        max_depth=max_depth,
        min_samples_split=min_samples_split,
        min_samples_leaf=min_samples_leaf,
        class_weight="balanced",
        random_state=42
    )
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)[:, 1]
    metrics, cm = evaluate_classification(y_test, preds, probs)
    importances = pd.Series(model.feature_importances_, index=X_train.columns).sort_values(ascending=False)
    return model, metrics, preds, probs, cm, importances


def train_random_forest_classifier(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    n_estimators: int = 150,
    max_depth: int = 10,
    min_samples_split: int = 6,
    min_samples_leaf: int = 3
) -> Tuple[RandomForestClassifier, Dict[str, float], np.ndarray, np.ndarray, np.ndarray, pd.Series]:
    """Trains RandomForestClassifier ensemble."""
    model = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        min_samples_split=min_samples_split,
        min_samples_leaf=min_samples_leaf,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)[:, 1]
    metrics, cm = evaluate_classification(y_test, preds, probs)
    importances = pd.Series(model.feature_importances_, index=X_train.columns).sort_values(ascending=False)
    return model, metrics, preds, probs, cm, importances


def train_xgboost_classifier(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    balance_classes: bool = False,
    **overrides: Any
) -> Tuple[XGBClassifier, Dict[str, float], np.ndarray, np.ndarray, np.ndarray, pd.Series]:
    """
    Trains XGBClassifier as the champion hazard classifier.

    Defaults to CHAMPION_XGB_CLASSIFIER_PARAMS with un-weighted classes so `predict_proba` is a
    usable probability. Set `balance_classes=True` to reproduce the older scale_pos_weight behaviour.
    The test split is only used for scoring, never for fitting.
    """
    params = {**CHAMPION_XGB_CLASSIFIER_PARAMS, **overrides}
    if balance_classes:
        neg_count = int((y_train == 0).sum())
        pos_count = max(1, int((y_train == 1).sum()))
        params["scale_pos_weight"] = float(neg_count / pos_count)

    model = XGBClassifier(**params, eval_metric="logloss", random_state=42, n_jobs=-1)
    model.fit(X_train, y_train, verbose=False)
    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)[:, 1]
    metrics, cm = evaluate_classification(y_test, preds, probs)
    importances = pd.Series(model.feature_importances_, index=X_train.columns).sort_values(ascending=False)
    return model, metrics, preds, probs, cm, importances
