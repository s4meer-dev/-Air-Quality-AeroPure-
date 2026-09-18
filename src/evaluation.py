"""
AeroPure Evaluation & Plotting Utilities
========================================
Generates publication-quality figures, residual diagnostics,
confusion matrices, ROC curves, and benchmark summary tables.
"""

from typing import Dict, List, Any, Optional, Tuple
import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for headless execution
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    roc_curve, auc, precision_recall_curve, average_precision_score,
    mean_squared_error, mean_absolute_error, r2_score,
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, balanced_accuracy_score, confusion_matrix, brier_score_loss
)
from sklearn.calibration import calibration_curve, CalibratedClassifierCV
from sklearn.inspection import permutation_importance
from scipy import stats


sns.set_theme(style="whitegrid", palette="muted")
plt.rcParams.update({
    "font.size": 11,
    "axes.labelsize": 12,
    "axes.titlesize": 14,
    "xtick.labelsize": 10,
    "ytick.labelsize": 10,
    "figure.titlesize": 16
})


def plot_actual_vs_predicted(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    model_name: str,
    output_path: str
) -> None:
    """Generates scatter plot of Actual vs Predicted AQI with ideal diagonal."""
    fig, ax = plt.subplots(figsize=(8, 6), dpi=150)
    ax.scatter(y_true, y_pred, alpha=0.4, color="#2b5c8f", edgecolors="none", s=25, label="Predictions")

    # Ideal 1:1 reference line
    min_val = min(np.min(y_true), np.min(y_pred))
    max_val = max(np.max(y_true), np.max(y_pred))
    ax.plot([min_val, max_val], [min_val, max_val], color="#e63946", linestyle="--", linewidth=2, label="Ideal (1:1)")

    ax.set_xlabel("Actual Next-Day AQI")
    ax.set_ylabel("Predicted Next-Day AQI")
    ax.set_title(f"Actual vs Predicted AQI — {model_name}")
    ax.legend(loc="upper left")
    plt.tight_layout()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path)
    plt.close(fig)


def plot_residuals(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    model_name: str,
    output_path: str
) -> None:
    """Generates 2-panel residual diagnostic plot: Residuals vs Predicted and Residual Distribution."""
    residuals = y_true - y_pred
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5), dpi=150)

    # 1. Residuals vs Predicted
    ax1.scatter(y_pred, residuals, alpha=0.4, color="#457b9d", edgecolors="none", s=25)
    ax1.axhline(0, color="#e63946", linestyle="--", linewidth=1.5)
    ax1.set_xlabel("Predicted Next-Day AQI")
    ax1.set_ylabel("Residual (Actual - Predicted)")
    ax1.set_title(f"Residuals vs Predicted — {model_name}")

    # 2. Residual Distribution Histogram
    sns.histplot(residuals, kde=True, ax=ax2, color="#1d3557", bins=30)
    ax2.axvline(0, color="#e63946", linestyle="--", linewidth=1.5)
    ax2.set_xlabel("Residual Error")
    ax2.set_ylabel("Frequency")
    ax2.set_title(f"Residual Error Distribution (Mean={residuals.mean():.2f})")

    plt.tight_layout()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path)
    plt.close(fig)


def plot_confusion_matrix_heatmap(
    cm: np.ndarray,
    model_name: str,
    output_path: str
) -> None:
    """Plots confusion matrix heatmap for hazardous air day classification."""
    fig, ax = plt.subplots(figsize=(6, 5), dpi=150)
    labels = ["Safe / Mod", "Hazardous"]
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Blues", cbar=False,
        xticklabels=labels, yticklabels=labels, ax=ax,
        annot_kws={"size": 14, "weight": "bold"}
    )
    ax.set_xlabel("Predicted Label")
    ax.set_ylabel("Actual Label")
    ax.set_title(f"Confusion Matrix — {model_name}")
    plt.tight_layout()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path)
    plt.close(fig)


def plot_roc_curve_comparison(
    models_dict: Dict[str, Tuple[np.ndarray, np.ndarray]],
    output_path: str
) -> None:
    """Plots ROC curves comparing multiple classification models on test data."""
    fig, ax = plt.subplots(figsize=(8, 6), dpi=150)

    for name, (y_true, y_prob) in models_dict.items():
        if len(np.unique(y_true)) > 1 and y_prob is not None:
            fpr, tpr, _ = roc_curve(y_true, y_prob)
            roc_auc = auc(fpr, tpr)
            ax.plot(fpr, tpr, linewidth=2, label=f"{name} (AUC = {roc_auc:.3f})")

    ax.plot([0, 1], [0, 1], color="grey", linestyle="--", linewidth=1.5, label="Chance Level (AUC = 0.500)")
    ax.set_xlim([0.0, 1.0])
    ax.set_ylim([0.0, 1.05])
    ax.set_xlabel("False Positive Rate (1 - Specificity)")
    ax.set_ylabel("True Positive Rate (Sensitivity / Recall)")
    ax.set_title("ROC Curves — Hazardous Air Day Classification")
    ax.legend(loc="lower right")
    plt.tight_layout()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path)
    plt.close(fig)


def plot_feature_importances(
    importance_series: pd.Series,
    title: str,
    output_path: str,
    top_n: int = 15
) -> None:
    """Plots horizontal bar chart of top N features."""
    top = importance_series.head(top_n).sort_values(ascending=True)
    fig, ax = plt.subplots(figsize=(10, 6), dpi=150)
    bars = ax.barh(top.index, top.values, color="#2a9d8f", edgecolor="none")
    ax.set_xlabel("Relative Importance Score")
    ax.set_title(f"{title} (Top {top_n})")
    plt.tight_layout()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path)
    plt.close(fig)


def compute_and_plot_permutation_importance(
    model,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    title: str,
    output_path: str,
    top_n: int = 15
) -> pd.Series:
    """Calculates scikit-learn permutation importance on held-out test data."""
    result = permutation_importance(model, X_test, y_test, n_repeats=5, random_state=42, n_jobs=-1)
    perm_sorted_idx = result.importances_mean.argsort()[::-1]
    top_features = X_test.columns[perm_sorted_idx][:top_n]
    top_importances = result.importances_mean[perm_sorted_idx][:top_n]

    perm_series = pd.Series(top_importances, index=top_features).sort_values(ascending=True)

    fig, ax = plt.subplots(figsize=(10, 6), dpi=150)
    ax.barh(perm_series.index, perm_series.values, color="#e76f51", edgecolor="none")
    ax.set_xlabel("Mean Decrease in Score (Permutation)")
    ax.set_title(f"{title} (Top {top_n})")
    plt.tight_layout()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path)
    plt.close(fig)

    return pd.Series(result.importances_mean, index=X_test.columns).sort_values(ascending=False)


def calculate_all_regression_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray
) -> Dict[str, float]:
    """Calculates MAE, MSE, RMSE, and R2 regression metrics."""
    mse = float(mean_squared_error(y_true, y_pred))
    rmse = float(np.sqrt(mse))
    mae = float(mean_absolute_error(y_true, y_pred))
    r2 = float(r2_score(y_true, y_pred))
    return {
        "MAE": round(mae, 3),
        "MSE": round(mse, 3),
        "RMSE": round(rmse, 3),
        "R2": round(r2, 4)
    }


def calculate_all_classification_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: Optional[np.ndarray] = None
) -> Dict[str, Any]:
    """
    Calculates Accuracy, Precision, Recall, F1, ROC-AUC, PR-AUC,
    Balanced Accuracy, Brier Score, and Confusion Matrix.
    """
    cm = confusion_matrix(y_true, y_pred)
    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    bal_acc = float(balanced_accuracy_score(y_true, y_pred))
    
    auc_roc = float(roc_auc_score(y_true, y_prob)) if y_prob is not None and len(np.unique(y_true)) > 1 else 0.5
    auc_pr = float(average_precision_score(y_true, y_prob)) if y_prob is not None and len(np.unique(y_true)) > 1 else 0.0
    brier = float(brier_score_loss(y_true, y_prob)) if y_prob is not None else 1.0
    
    return {
        "Accuracy": round(acc, 4),
        "Precision": round(prec, 4),
        "Recall": round(rec, 4),
        "F1": round(f1, 4),
        "ROC_AUC": round(auc_roc, 4),
        "PR_AUC": round(auc_pr, 4),
        "Balanced_Accuracy": round(bal_acc, 4),
        "Brier_Score": round(brier, 4),
        "TN": int(cm[0, 0]),
        "FP": int(cm[0, 1]),
        "FN": int(cm[1, 0]),
        "TP": int(cm[1, 1])
    }


def evaluate_and_plot_calibration(
    y_true: np.ndarray,
    raw_probs: np.ndarray,
    model_name: str,
    output_path: str,
    calibrated_probs: Optional[np.ndarray] = None,
    comparison_label: str = "Calibrated"
) -> Dict[str, float]:
    """
    Generates calibration reliability curve and calculates Brier score.
    Compares raw probabilities against a second probability set (`comparison_label`) where available.
    """
    prob_true_raw, prob_pred_raw = calibration_curve(y_true, raw_probs, n_bins=10)
    brier_raw = float(brier_score_loss(y_true, raw_probs))
    
    fig, ax = plt.subplots(figsize=(7, 6), dpi=150)
    ax.plot([0, 1], [0, 1], "k:", label="Perfectly Calibrated")
    ax.plot(prob_pred_raw, prob_true_raw, "s-", color="#1f77b4", label=f"Raw {model_name} (Brier={brier_raw:.4f})")
    
    brier_cal = None
    if calibrated_probs is not None:
        prob_true_cal, prob_pred_cal = calibration_curve(y_true, calibrated_probs, n_bins=10)
        brier_cal = float(brier_score_loss(y_true, calibrated_probs))
        ax.plot(prob_pred_cal, prob_true_cal, "o-", color="#2ca02c", label=f"{comparison_label} (Brier={brier_cal:.4f})")
        
    ax.set_xlabel("Mean Predicted Probability")
    ax.set_ylabel("Empirical Fraction of Positives")
    ax.set_title(f"Reliability Curve — {model_name}")
    ax.legend(loc="lower right")
    ax.grid(True, linestyle="--", alpha=0.4)
    plt.tight_layout()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path)
    plt.close(fig)
    
    return {
        "brier_score_raw": round(brier_raw, 4),
        "brier_score_calibrated": round(brier_cal, 4) if brier_cal is not None else None
    }


def plot_pr_curve_comparison(
    models_dict: Dict[str, Tuple[np.ndarray, np.ndarray]],
    output_path: str
) -> None:
    """Plots Precision-Recall curves comparing classification models."""
    fig, ax = plt.subplots(figsize=(8, 6), dpi=150)
    
    for name, (y_true, y_prob) in models_dict.items():
        if len(np.unique(y_true)) > 1 and y_prob is not None:
            prec, rec, _ = precision_recall_curve(y_true, y_prob)
            pr_auc = average_precision_score(y_true, y_prob)
            ax.plot(rec, prec, linewidth=2, label=f"{name} (PR-AUC = {pr_auc:.3f})")
            
    # Baseline prevalence
    y_first = next(iter(models_dict.values()))[0]
    prevalence = (y_first == 1).sum() / len(y_first)
    ax.axhline(prevalence, color="gray", linestyle="--", label=f"Baseline Prevalence ({prevalence*100:.1f}%)")
    
    ax.set_xlabel("Recall (Sensitivity)")
    ax.set_ylabel("Precision (Positive Predictive Value)")
    ax.set_title("Precision-Recall Curves — Hazardous Air Day Classification")
    ax.legend(loc="upper right")
    ax.grid(True, linestyle="--", alpha=0.4)
    plt.tight_layout()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path)
    plt.close(fig)


def perform_statistical_significance_tests(
    y_test: np.ndarray,
    predictions_dict: Dict[str, np.ndarray],
    champion_name: str = "XGBoost"
) -> pd.DataFrame:
    """
    Performs Wilcoxon signed-rank and paired t-tests on out-of-sample absolute errors
    between champion model and baseline models.
    """
    y_true = np.asarray(y_test)
    champ_errors = np.abs(y_true - predictions_dict[champion_name])
    
    records = []
    for name, preds in predictions_dict.items():
        if name == champion_name:
            continue
        base_errors = np.abs(y_true - preds)
        
        # Wilcoxon signed-rank test
        stat_w, p_w = stats.wilcoxon(champ_errors, base_errors)
        # Paired t-test
        stat_t, p_t = stats.ttest_rel(champ_errors, base_errors)
        
        records.append({
            "Comparison": f"{champion_name} vs {name}",
            "Wilcoxon_Statistic": round(float(stat_w), 1),
            "Wilcoxon_p_value": f"{p_w:.4e}",
            "Paired_t_Statistic": round(float(stat_t), 3),
            "Paired_t_p_value": f"{p_t:.4e}",
            "Statistically_Significant (p<0.05)": bool(p_w < 0.05)
        })
        
    return pd.DataFrame(records)

