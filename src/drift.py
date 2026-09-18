"""
AeroPure Week 11: Production Drift Detection & Population Stability Index (PSI)
================================================================================
Monitors feature distribution shifts between baseline training data and incoming
production data to detect covariate shift and trigger informed model retraining alerts.
"""

import os
import sys
import json
from typing import Dict, List, Tuple, Any, Optional
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from src.feature_engineering import NON_FEATURE_COLUMNS

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


# Monitoring thresholds established for the AeroPure operational environment
# (Not claimed as universal laws, but industry-standard empirical guidelines)
PSI_STABLE_THRESHOLD = 0.10
PSI_MONITOR_THRESHOLD = 0.25


def calculate_feature_psi(
    expected: np.ndarray,
    actual: np.ndarray,
    num_buckets: int = 10,
    epsilon: float = 1e-4
) -> float:
    """
    Computes Population Stability Index (PSI) for a single continuous feature:
    PSI = sum((Actual% - Expected%) * ln(Actual% / Expected%))
    """
    expected = np.asarray(expected)
    actual = np.asarray(actual)
    
    # Drop any NaNs
    expected = expected[~np.isnan(expected)]
    actual = actual[~np.isnan(actual)]
    
    if len(expected) == 0 or len(actual) == 0:
        return 0.0
        
    quantiles = np.linspace(0, 100, num_buckets + 1)
    bins = np.percentile(expected, quantiles)
    bins[0] = -np.inf
    bins[-1] = np.inf
    bins = np.unique(bins)
    
    if len(bins) <= 2:
        return 0.0
        
    exp_counts, _ = np.histogram(expected, bins=bins)
    act_counts, _ = np.histogram(actual, bins=bins)
    
    exp_pct = exp_counts / len(expected)
    act_pct = act_counts / len(actual)
    
    exp_pct = np.clip(exp_pct, epsilon, None)
    act_pct = np.clip(act_pct, epsilon, None)
    
    psi = np.sum((act_pct - exp_pct) * np.log(act_pct / exp_pct))
    return float(round(psi, 4))


def classify_psi(psi_value: float) -> str:
    """Classifies PSI value into project monitoring categories."""
    if psi_value < PSI_STABLE_THRESHOLD:
        return "Stable"
    elif psi_value <= PSI_MONITOR_THRESHOLD:
        return "Monitor"
    else:
        return "Significant Drift"


def evaluate_dataset_drift(
    reference_df: pd.DataFrame,
    incoming_df: pd.DataFrame,
    feature_cols: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Evaluates Population Stability Index across multiple features.
    Flags features requiring monitoring or triggering retraining alerts.
    """
    if feature_cols is None:
        feature_cols = [
            c for c in reference_df.columns
            if c not in NON_FEATURE_COLUMNS and pd.api.types.is_numeric_dtype(reference_df[c]) and c in incoming_df.columns
        ]

    psi_by_feature = {}
    status_by_feature = {}
    stable_features = []
    monitor_features = []
    drifted_features = []

    for col in feature_cols:
        psi = calculate_feature_psi(reference_df[col].values, incoming_df[col].values)
        status = classify_psi(psi)
        psi_by_feature[col] = psi
        status_by_feature[col] = status

        if status == "Stable":
            stable_features.append(col)
        elif status == "Monitor":
            monitor_features.append(col)
        else:
            drifted_features.append(col)

    mean_psi = float(np.mean(list(psi_by_feature.values()))) if psi_by_feature else 0.0
    overall_status = "Significant Drift" if len(drifted_features) > 0 else ("Monitor" if len(monitor_features) > 0 else "Stable")
    retraining_flagged = bool(len(drifted_features) >= 2 or mean_psi > PSI_MONITOR_THRESHOLD)

    return {
        "overall_drift_status": overall_status,
        "mean_psi": round(mean_psi, 4),
        "retraining_flagged": retraining_flagged,
        "recommendation": "Flag for seasonal retraining review with governance safeguards." if retraining_flagged else "System stable; continue routine monitoring.",
        "counts": {
            "total_features_evaluated": len(feature_cols),
            "stable": len(stable_features),
            "monitor": len(monitor_features),
            "significant_drift": len(drifted_features)
        },
        "significant_drift_features": drifted_features,
        "monitor_features": monitor_features,
        "psi_by_feature": psi_by_feature,
        "status_by_feature": status_by_feature
    }


def plot_drift_binned_distributions(
    reference_df: pd.DataFrame,
    incoming_df: pd.DataFrame,
    features_to_plot: List[str],
    output_path: str = "outputs/figures/drift_feature_distributions.png"
):
    """Generates distribution comparison plots between training reference and incoming data."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    n = len(features_to_plot)
    if n == 0:
        return

    cols = min(3, n)
    rows = int(np.ceil(n / cols))
    fig, axes = plt.subplots(rows, cols, figsize=(5 * cols, 4 * rows), dpi=150)
    if n == 1:
        axes = np.array([axes])
    axes = axes.flatten()

    for idx, feat in enumerate(features_to_plot):
        ax = axes[idx]
        ref_vals = reference_df[feat].dropna()
        inc_vals = incoming_df[feat].dropna()

        sns.kdeplot(ref_vals, ax=ax, label="Training Ref", color="#1f77b4", linewidth=2)
        sns.kdeplot(inc_vals, ax=ax, label="Incoming Test", color="#e63946", linewidth=2, linestyle="--")

        psi_val = calculate_feature_psi(ref_vals.values, inc_vals.values)
        ax.set_title(f"{feat}\nPSI: {psi_val:.4f} ({classify_psi(psi_val)})", fontsize=10)
        ax.set_xlabel("Value")
        ax.set_ylabel("Density")
        ax.legend(loc="upper right", fontsize=8)
        ax.grid(True, linestyle="--", alpha=0.3)

    for j in range(n, len(axes)):
        fig.delaxes(axes[j])

    plt.tight_layout()
    plt.savefig(output_path)
    plt.close(fig)


def run_drift_analysis(
    train_path: str = "data/processed_data.csv",
    output_dir: str = "outputs"
) -> Dict[str, Any]:
    """Runs complete drift analysis comparing chronological training split vs test split."""
    fig_dir = os.path.join(output_dir, "figures")
    metrics_dir = os.path.join(output_dir, "metrics")
    os.makedirs(fig_dir, exist_ok=True)
    os.makedirs(metrics_dir, exist_ok=True)

    df = pd.read_csv(train_path)
    split_idx = int(len(df) * 0.8)
    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]

    key_features = [
        "CO(GT)", "NO2(GT)", "C6H6(GT)", "NOx(GT)", "T", "RH", "AH",
        "PT08.S1(CO)", "PT08.S3(NOx)", "PT08.S5(O3)", "current_air_quality_index"
    ]
    key_features = [c for c in key_features if c in df.columns]

    drift_results = evaluate_dataset_drift(train_df, test_df, feature_cols=key_features)

    # Save drift metrics
    report_df = pd.DataFrame([
        {"feature": k, "psi": drift_results["psi_by_feature"][k], "status": drift_results["status_by_feature"][k]}
        for k in key_features
    ]).sort_values("psi", ascending=False)
    
    csv_path = os.path.join(metrics_dir, "drift_psi_metrics.csv")
    report_df.to_csv(csv_path, index=False)

    json_path = os.path.join(metrics_dir, "drift_summary.json")
    with open(json_path, "w") as f:
        json.dump({
            "overall_drift_status": drift_results["overall_drift_status"],
            "mean_psi": drift_results["mean_psi"],
            "retraining_flagged": drift_results["retraining_flagged"],
            "recommendation": drift_results["recommendation"],
            "counts": drift_results["counts"],
            "significant_drift_features": drift_results["significant_drift_features"]
        }, f, indent=2)

    # Plot top features
    plot_drift_binned_distributions(
        train_df, test_df,
        features_to_plot=["T", "NO2(GT)", "current_air_quality_index", "C6H6(GT)", "CO(GT)", "RH"],
        output_path=os.path.join(fig_dir, "drift_feature_distributions.png")
    )

    return drift_results


if __name__ == "__main__":
    res = run_drift_analysis()
    print("\nAeroPure Drift Analysis Summary:")
    print(f"  Overall Status: {res['overall_drift_status']}")
    print(f"  Mean PSI: {res['mean_psi']}")
    print(f"  Retraining Flagged: {res['retraining_flagged']}")
    print(f"  Significant Drift Features: {res['significant_drift_features']}")
