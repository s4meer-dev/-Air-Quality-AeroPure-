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
    f1_score, roc_auc_score, confusion_matrix
)


def evaluate_classification(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: Optional[np.ndarray] = None
) -> Tuple[Dict[str, float], np.ndarray]:
    """Computes Accuracy, Precision, Recall, F1, and ROC-AUC along with Confusion Matrix."""
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)

    # ROC-AUC requires predicted probabilities and at least 2 distinct classes in y_true
    if y_prob is not None and len(np.unique(y_true)) > 1:
        try:
            auc = roc_auc_score(y_true, y_prob)
        except Exception:
            auc = 0.5
    else:
        auc = 0.5

    cm = confusion_matrix(y_true, y_pred)
    metrics = {
        "Accuracy": round(float(acc), 4),
        "Precision": round(float(prec), 4),
        "Recall": round(float(rec), 4),
        "F1": round(float(f1), 4),
        "ROC_AUC": round(float(auc), 4),
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
    n_estimators: int = 250,
    learning_rate: float = 0.05,
    max_depth: int = 5,
    subsample: float = 0.8,
    colsample_bytree: float = 0.8
) -> Tuple[XGBClassifier, Dict[str, float], np.ndarray, np.ndarray, np.ndarray, pd.Series]:
    """Trains XGBClassifier as the Week 8 champion classification model."""
    # Compute scale_pos_weight to handle class imbalance: (# negatives) / (# positives)
    neg_count = (y_train == 0).sum()
    pos_count = max(1, (y_train == 1).sum())
    scale_weight = float(neg_count / pos_count)

    model = XGBClassifier(
        n_estimators=n_estimators,
        learning_rate=learning_rate,
        max_depth=max_depth,
        subsample=subsample,
        colsample_bytree=colsample_bytree,
        scale_pos_weight=scale_weight,
        eval_metric="logloss",
        random_state=42,
        n_jobs=-1
    )
    model.fit(
        X_train, y_train,
        eval_set=[(X_train, y_train), (X_test, y_test)],
        verbose=False
    )
    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)[:, 1]
    metrics, cm = evaluate_classification(y_test, preds, probs)
    importances = pd.Series(model.feature_importances_, index=X_train.columns).sort_values(ascending=False)
    return model, metrics, preds, probs, cm, importances
