"""
AeroPure Explainability Engine (Week 8 — SHAP)
==============================================
Provides model interpretability for the XGBoost champion model using
TreeExplainer and Shapley Additive exPlanations.
"""

from typing import Dict, List, Any, Tuple, Optional
import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import shap


def compute_shap_explanations(
    model,
    X_test: pd.DataFrame,
    max_display: int = 15,
    figures_dir: str = "outputs/figures"
) -> Tuple[shap.Explanation, np.ndarray, pd.Series]:
    """
    Computes TreeExplainer SHAP values for the champion XGBoost model on the test partition.
    Generates:
    1. SHAP summary beeswarm plot (`outputs/figures/shap_summary_beeswarm.png`)
    2. SHAP bar plot (`outputs/figures/shap_bar_importance.png`)
    """
    os.makedirs(figures_dir, exist_ok=True)
    explainer = shap.TreeExplainer(model)
    shap_values = explainer(X_test)

    # Calculate global mean absolute SHAP values per feature
    if len(shap_values.values.shape) == 2:
        vals = np.abs(shap_values.values).mean(axis=0)
    else:  # Multi-class or 3D output
        vals = np.abs(shap_values.values[:, :, 1]).mean(axis=0)

    global_importance = pd.Series(vals, index=X_test.columns).sort_values(ascending=False)

    # 1. Beeswarm plot
    fig, ax = plt.subplots(figsize=(10, 7), dpi=150)
    shap.plots.beeswarm(shap_values, max_display=max_display, show=False)
    plt.title("SHAP Feature Impact on Next-Day AQI (Beeswarm)", fontsize=14, pad=15)
    plt.tight_layout()
    beeswarm_path = os.path.join(figures_dir, "shap_summary_beeswarm.png")
    plt.savefig(beeswarm_path, bbox_inches="tight")
    plt.close()

    # 2. Bar plot
    fig, ax = plt.subplots(figsize=(10, 6), dpi=150)
    shap.plots.bar(shap_values, max_display=max_display, show=False)
    plt.title("SHAP Global Feature Importance", fontsize=14, pad=15)
    plt.tight_layout()
    bar_path = os.path.join(figures_dir, "shap_bar_importance.png")
    plt.savefig(bar_path, bbox_inches="tight")
    plt.close()

    return shap_values, explainer.expected_value, global_importance


def explain_individual_prediction(
    shap_values: shap.Explanation,
    sample_index: int,
    output_path: str,
    title: str = "Individual Prediction SHAP Waterfall"
) -> Dict[str, Any]:
    """
    Generates a SHAP waterfall plot for a single observation and returns its feature attributions.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    sample_shap = shap_values[sample_index]

    fig, ax = plt.subplots(figsize=(10, 6), dpi=150)
    shap.plots.waterfall(sample_shap, max_display=10, show=False)
    plt.title(title, fontsize=13, pad=15)
    plt.tight_layout()
    plt.savefig(output_path, bbox_inches="tight")
    plt.close()

    # Extract top driving features for this specific prediction
    feature_names = sample_shap.feature_names
    contributions = sample_shap.values
    base_val = float(sample_shap.base_values)
    pred_val = base_val + float(np.sum(contributions))

    attrib_df = pd.DataFrame({
        "feature": feature_names,
        "shap_value": contributions,
        "feature_value": sample_shap.data
    }).sort_values(by="shap_value", key=abs, ascending=False)

    return {
        "sample_index": sample_index,
        "base_value": round(base_val, 2),
        "predicted_value": round(pred_val, 2),
        "top_drivers": attrib_df.head(10).to_dict(orient="records")
    }


def generate_natural_language_explanation(
    attrib_dict: Dict[str, Any],
    hazard_threshold: float = 250.0
) -> str:
    """
    Synthesizes real mathematical SHAP contributions into an interpretable civic warning narrative.
    Strictly grounds every claim in actual SHAP attribution values.
    """
    pred_val = attrib_dict["predicted_value"]
    base_val = attrib_dict["base_value"]
    top_drivers = attrib_dict["top_drivers"]

    status = "HAZARDOUS" if pred_val >= hazard_threshold else "NON-HAZARDOUS"
    narrative = [
        f"Forecast AQI is predicted at {pred_val:.1f} (Status: {status}).",
        f"The regional baseline historical mean is {base_val:.1f} AQI points.",
        "Key atmospheric and pollutant drivers impacting tomorrow's air quality:"
    ]

    for item in top_drivers[:5]:
        feat = item["feature"]
        shap_val = item["shap_value"]
        feat_val = item["feature_value"]

        impact = "elevates" if shap_val > 0 else "suppresses"
        sign = "+" if shap_val > 0 else ""
        narrative.append(
            f"• {feat} (observed value: {feat_val:.2f}) {impact} AQI by {sign}{shap_val:.2f} points."
        )

    if status == "HAZARDOUS":
        narrative.append(
            "CIVIC HEALTH ADVISORY: Stagnant conditions and elevated particulate persistence pose severe health hazards tomorrow. Vulnerable groups, elderly, and children should limit outdoor exposure."
        )
    else:
        narrative.append(
            "CIVIC HEALTH ADVISORY: Atmospheric dispersion and pollutant levels are projected within manageable thresholds."
        )

    return "\n".join(narrative)
