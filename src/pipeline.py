"""
AeroPure Master Pipeline Orchestrator (Weeks 1–8)
=================================================
Executes the end-to-end Machine Learning pipeline on real Archive 1 AirQuality data:
- Week 1: Ingestion, Schema Inspection, Summary Stats & EDA Visualizations
- Week 2: Cleaning, AQI Proxy Computation, Leakage-Safe Feature Engineering & Splits
- Week 3: Linear Regression (OLS Baseline)
- Week 4: Ridge, Lasso & Logistic Regression
- Week 5: TimeSeriesSplit Cross-Validation & Baseline Tuning
- Week 6: Decision Tree Regressor & Classifier
- Week 7: Random Forest Ensemble with OOB & Permutation Importance
- Week 8: Tuned XGBoost Champion + Hybrid Hazard Model + SHAP Explainability Engine
- Model Persistence & Leaderboard Export

Data honesty: imputation is causal (forward-fill only) and targets are built exclusively from hours
where CO, NO2 and C6H6 were genuinely measured; naive baselines (persistence, climatology) are scored
alongside the learned models; the champion is designated from cross-validation on the training split,
never by ranking models on the test set.
"""

import os
import sys
import json

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
from typing import Dict, Any, Tuple
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

from src.aqi import calculate_pollutant_index_proxy, create_targets, PROJECT_HAZARD_THRESHOLD
from src.preprocessing import load_raw_archive1, inspect_dataset, clean_dataset
from src.feature_engineering import build_feature_pipeline, prepare_time_series_splits
from src.regression import (
    train_ols_regression, train_ridge_regression, train_lasso_regression,
    train_decision_tree_regressor, train_random_forest_regressor, train_xgboost_regressor,
    regression_baselines
)
from src.classification import (
    train_logistic_regression, train_decision_tree_classifier,
    train_random_forest_classifier, train_xgboost_classifier, evaluate_classification
)
from src.hazard_model import fit_hazard_model
from src.cross_validation import run_week5_benchmark
from src.evaluation import (
    plot_actual_vs_predicted, plot_residuals, plot_confusion_matrix_heatmap,
    plot_roc_curve_comparison, plot_feature_importances, compute_and_plot_permutation_importance
)
from src.explainability import (
    compute_shap_explanations, explain_individual_prediction,
    generate_natural_language_explanation
)
from src.clustering import run_week9_clustering
from src.drift import run_drift_analysis
from src.model_registry import (
    package_production_artifacts, CHAMPION_REGRESSOR_NAME, CHAMPION_CLASSIFIER_NAME
)
from scripts.run_week10_evaluation import run_week10_evaluation


def run_week1_eda(df_clean: pd.DataFrame, output_dir: str = "outputs/figures") -> Dict[str, Any]:
    """Generates Week 1 exploratory analysis figures from real cleaned data."""
    os.makedirs(output_dir, exist_ok=True)
    stats = inspect_dataset(df_clean)

    # 1. Pollutant & sensor distribution histograms
    plot_cols = [c for c in ["CO(GT)", "NO2(GT)", "C6H6(GT)", "NOx(GT)", "T", "RH"] if c in df_clean.columns]
    if plot_cols:
        fig, axes = plt.subplots(2, 3, figsize=(15, 8), dpi=150)
        axes = axes.flatten()
        for i, col in enumerate(plot_cols):
            sns.histplot(df_clean[col].dropna(), kde=True, ax=axes[i], color="#1f77b4")
            axes[i].set_title(f"Distribution of {col}")
            axes[i].set_xlabel(f"{col} Level")
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, "eda_pollutant_distributions.png"))
        plt.close(fig)

    # 2. Temporal trends
    df_sorted = df_clean.sort_values("datetime").reset_index(drop=True)
    fig, axes = plt.subplots(3, 1, figsize=(16, 10), sharex=True, dpi=150)
    if "CO(GT)" in df_sorted.columns and "C6H6(GT)" in df_sorted.columns:
        axes[0].plot(df_sorted["datetime"], df_sorted["CO(GT)"], label="CO(GT) (mg/m³)", color="#e76f51", alpha=0.8)
        axes[0].plot(df_sorted["datetime"], df_sorted["C6H6(GT)"], label="C6H6(GT) Benzene (µg/m³)", color="#2a9d8f", alpha=0.7)
        axes[0].set_ylabel("Combustion Contaminants")
        axes[0].set_title("Combustion Contaminant Trends Over Time")
        axes[0].legend(loc="upper right")

    if "NO2(GT)" in df_sorted.columns and "NOx(GT)" in df_sorted.columns:
        axes[1].plot(df_sorted["datetime"], df_sorted["NO2(GT)"], label="NO2(GT) (µg/m³)", color="#457b9d", alpha=0.8)
        axes[1].plot(df_sorted["datetime"], df_sorted["NOx(GT)"] / 5.0, label="NOx(GT) / 5 (ppb proxy)", color="#e9c46a", alpha=0.6)
        axes[1].set_ylabel("Nitrogen Oxides")
        axes[1].set_title("Nitrogen Oxide Species Trends Over Time")
        axes[1].legend(loc="upper right")

    weather_vars = [w for w in ["T", "RH", "AH"] if w in df_sorted.columns]
    for w in weather_vars:
        axes[2].plot(df_sorted["datetime"], df_sorted[w], label=w, alpha=0.7)
    axes[2].set_ylabel("Meteorological Readings")
    axes[2].set_xlabel("Date")
    axes[2].set_title("Meteorological Conditions Over Time (Temperature, Humidity)")
    axes[2].legend(loc="upper right")

    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "eda_temporal_trends.png"))
    plt.close(fig)

    # 3. Correlation heatmap
    num_cols = df_clean.select_dtypes(include=[np.number]).columns
    if len(num_cols) > 1:
        corr = df_clean[num_cols].corr()
        fig, ax = plt.subplots(figsize=(11, 9), dpi=150)
        sns.heatmap(corr, annot=True, fmt=".2f", cmap="coolwarm", center=0, ax=ax, square=True)
        ax.set_title("Correlation Heatmap: Gaseous Contaminants, Sensors & Weather")
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, "eda_correlation_heatmap.png"))
        plt.close(fig)

    # 4. Hourly Diurnal Patterns
    if "datetime" in df_clean.columns and "CO(GT)" in df_clean.columns:
        df_hourly = df_clean.copy()
        df_hourly["hour"] = df_hourly["datetime"].dt.hour
        hourly_means = df_hourly.groupby("hour")[plot_cols].mean()
        fig, ax = plt.subplots(figsize=(11, 5), dpi=150)
        for col in plot_cols[:4]:
            ax.plot(hourly_means.index, hourly_means[col], marker="o", label=col)
        ax.set_xlabel("Hour of Day (0–23)")
        ax.set_ylabel("Mean Level")
        ax.set_title("Diurnal (Hourly) Variation — Urban Rush Hour & Boundary Layer Dynamics")
        ax.legend()
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, "eda_diurnal_patterns.png"))
        plt.close(fig)

    return stats


def run_full_pipeline(
    data_path: str = "data/AirQuality.csv",
    models_dir: str = "models",
    outputs_dir: str = "outputs"
) -> Dict[str, Any]:
    """
    Master pipeline runner executing Weeks 1 through 8 strictly.
    Validates dataset existence, prints schema & targets, runs models, outputs plots & leaderboards.
    """
    if not os.path.exists(data_path):
        msg = f"Real dataset not found at '{data_path}'. Please place AirQuality.csv inside data/."
        print(f"\n[ERROR] {msg}")
        return {"status": "FAILED", "error": msg}

    fig_dir = os.path.join(outputs_dir, "figures")
    metrics_dir = os.path.join(outputs_dir, "metrics")
    preds_dir = os.path.join(outputs_dir, "predictions")
    os.makedirs(fig_dir, exist_ok=True)
    os.makedirs(metrics_dir, exist_ok=True)
    os.makedirs(preds_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)

    print("=" * 75)
    print("AEROPURE MACHINE LEARNING SYSTEM (WEEKS 1–8)")
    print("Tagline: 'Tell a city when tomorrow's air turns dangerous.'")
    print("=" * 75)

    # ==========================================
    # WEEK 1: INGESTION, INSPECTION & EDA
    # ==========================================
    print("\n[WEEK 1] Loading and inspecting real Archive 1 AirQuality dataset...")
    raw_data = load_raw_archive1(data_path)
    print(f"  [OK] Raw shape: {raw_data.shape[0]} rows, {raw_data.shape[1]} columns")
    print(f"  [OK] Raw columns: {list(raw_data.columns)}")

    print("\n  Cleaning sentinel -200 values and parsing datetime...")
    cleaned_data, clean_log = clean_dataset(raw_data)
    print(f"  [OK] Cleaned shape: {cleaned_data.shape[0]} rows, {cleaned_data.shape[1]} columns")
    print(f"  [OK] Time range: {clean_log['date_range'][0]} to {clean_log['date_range'][1]}")
    print(f"  [OK] Retained sensor columns: {clean_log['retained_sensor_columns']}")
    print(f"  [OK] Imputation: {clean_log['imputation']}")
    print(f"  [OK] Hours with CO, NO2 and C6H6 all genuinely measured: "
          f"{clean_log['criteria_observed_fraction']*100:.1f}% (only these become ground-truth targets)")

    print("\n  Generating Week 1 EDA visualizations...")
    eda_stats = run_week1_eda(cleaned_data, fig_dir)
    print(f"  [OK] Saved EDA figures to '{fig_dir}'")

    # ==========================================
    # WEEK 2: AQI PROXY & FEATURE ENGINEERING
    # ==========================================
    print("\n[WEEK 2] Calculating Pollutant-Based AQI Proxy & Targets...")
    print("  Note: Using standard piecewise sub-indices for CO(GT), NO2(GT), and C6H6(GT).")
    # Features see the last-known state; targets are restricted to genuinely observed hours.
    aqi_data = calculate_pollutant_index_proxy(cleaned_data)

    hazard_threshold = PROJECT_HAZARD_THRESHOLD
    target_data = create_targets(aqi_data, lead_time_hours=24, hazard_threshold=hazard_threshold)
    labelled = target_data.dropna(subset=["next_day_air_quality_index"])

    print("\n" + "-" * 75)
    print("DATASET SCHEMA & TARGET DEFINITIONS (VERIFICATION CHECK)")
    print("-" * 75)
    print(f"• Dataset Source: Real Archive 1 (AirQuality.csv)")
    print(f"• Ingestion Columns: {list(cleaned_data.columns)}")
    print(f"• Index Method: Pollutant-based AQI proxy = max(i_co, i_no2, i_c6h6)")
    print(f"• Target 1 (Regression):     'next_day_air_quality_index' (+24h forward shift)")
    print(f"• Target 2 (Classification): 'hazardous_air_day' (1 if next_day_air_quality_index >= {hazard_threshold})")
    print(f"• Current Index Summary: Mean={target_data['current_air_quality_index'].mean():.2f}, Median={target_data['current_air_quality_index'].median():.2f}, Max={target_data['current_air_quality_index'].max():.2f}")
    pos_count = int((labelled['hazardous_air_day'] == 1).sum())
    print(f"• Labelled samples (observed targets only): {len(labelled)} of {len(target_data)} hours")
    print(f"• Class Balance: Hazardous = {pos_count} ({pos_count/len(labelled)*100:.1f}%) | Safe/Mod = {len(labelled)-pos_count} ({(len(labelled)-pos_count)/len(labelled)*100:.1f}%)")
    print("-" * 75 + "\n")

    print("  Extracting leakage-safe features (calendar, lags 1h-144h, rolling 6h-168h, trend, staleness)...")
    feature_df = build_feature_pipeline(target_data, lead_time_hours=24, hazard_threshold=hazard_threshold)
    processed_path = "data/processed_data.csv"
    feature_df.to_csv(processed_path, index=False)
    print(f"  [OK] Processed feature matrix: {feature_df.shape} -> saved to '{processed_path}'")

    (
        X_train, X_test,
        y_train_reg, y_test_reg,
        y_train_clf, y_test_clf,
        scaler, feature_cols
    ) = prepare_time_series_splits(feature_df, train_ratio=0.80)

    joblib.dump(scaler, os.path.join(models_dir, "scaler.joblib"))
    print(f"  [OK] Chronological split (24h purge gap): Train={len(X_train)} | Test={len(X_test)}")
    print(f"  [OK] Total engineered features: {len(feature_cols)}")

    regression_leaderboard = []
    classification_leaderboard = []
    test_preds_df = pd.DataFrame({
        "actual_next_day_air_quality_index": y_test_reg.values,
        "actual_hazardous_day": y_test_clf.values
    }, index=X_test.index)

    # Naive reference forecasts: every learned model must beat these to justify its complexity.
    baselines = regression_baselines(feature_df.loc[X_train.index], feature_df.loc[X_test.index])
    for name, (base_metrics, base_preds) in baselines.items():
        regression_leaderboard.append({"Model": name, **base_metrics})
    test_preds_df["pred_persistence"] = baselines["Baseline: Persistence (AQI now)"][1]
    print("\n[BASELINES] " + " | ".join(f"{n.split(': ')[1]} RMSE={m['RMSE']}" for n, (m, _) in baselines.items()))

    # ==========================================
    # WEEK 3: LINEAR REGRESSION BASELINE
    # ==========================================
    print("\n[WEEK 3] Training Linear Regression (OLS Baseline)...")
    ols_model, ols_metrics, ols_preds, ols_coefs = train_ols_regression(
        X_train, y_train_reg, X_test, y_test_reg
    )
    joblib.dump(ols_model, os.path.join(models_dir, "ols_regressor.joblib"))
    test_preds_df["pred_ols_reg"] = ols_preds
    regression_leaderboard.append({"Model": "Linear Regression (OLS)", **ols_metrics})
    plot_actual_vs_predicted(y_test_reg.values, ols_preds, "OLS Baseline", os.path.join(fig_dir, "ols_actual_vs_predicted.png"))
    plot_residuals(y_test_reg.values, ols_preds, "OLS Baseline", os.path.join(fig_dir, "ols_residuals.png"))
    plot_feature_importances(ols_coefs.abs(), "OLS Feature Coefficients (Abs)", os.path.join(fig_dir, "ols_coefficients.png"))
    print(f"  [OK] OLS Baseline: MAE={ols_metrics['MAE']}, RMSE={ols_metrics['RMSE']}, R²={ols_metrics['R2']}")

    # ==========================================
    # WEEK 4: RIDGE, LASSO & LOGISTIC REGRESSION
    # ==========================================
    print("\n[WEEK 4] Training Regularized Models & Logistic Regression Classifier...")
    # Ridge
    ridge_model, ridge_metrics, ridge_preds, _ = train_ridge_regression(
        X_train, y_train_reg, X_test, y_test_reg, alpha=10.0
    )
    joblib.dump(ridge_model, os.path.join(models_dir, "ridge_regressor.joblib"))
    test_preds_df["pred_ridge_reg"] = ridge_preds
    regression_leaderboard.append({"Model": "Ridge Regression", **ridge_metrics})

    # Lasso
    lasso_model, lasso_metrics, lasso_preds, lasso_coefs = train_lasso_regression(
        X_train, y_train_reg, X_test, y_test_reg, alpha=0.5
    )
    joblib.dump(lasso_model, os.path.join(models_dir, "lasso_regressor.joblib"))
    test_preds_df["pred_lasso_reg"] = lasso_preds
    regression_leaderboard.append({"Model": "Lasso Regression", **lasso_metrics})
    plot_feature_importances(lasso_coefs.abs(), "Lasso Selected Features (Non-Zero Coefficients)", os.path.join(fig_dir, "lasso_coefficients.png"))

    # Logistic Regression Baseline
    log_model, log_metrics, log_preds, log_probs, log_cm = train_logistic_regression(
        X_train, y_train_clf, X_test, y_test_clf, C=1.0
    )
    joblib.dump(log_model, os.path.join(models_dir, "logistic_classifier.joblib"))
    test_preds_df["pred_logistic_clf"] = log_preds
    test_preds_df["prob_logistic_clf"] = log_probs
    classification_leaderboard.append({"Model": "Logistic Regression", **log_metrics})
    plot_confusion_matrix_heatmap(log_cm, "Logistic Regression", os.path.join(fig_dir, "cm_logistic_regression.png"))
    print(f"  [OK] Ridge RMSE={ridge_metrics['RMSE']} | Lasso RMSE={lasso_metrics['RMSE']}")
    print(f"  [OK] Logistic Regression: F1={log_metrics['F1']}, ROC-AUC={log_metrics['ROC_AUC']}")

    # ==========================================
    # WEEK 5: TIME-AWARE CROSS-VALIDATION
    # ==========================================
    print("\n[WEEK 5] Executing TimeSeriesSplit Cross-Validation (5 Folds)...")
    cv_table = run_week5_benchmark(X_train, y_train_reg, y_train_clf, n_splits=5)
    cv_table.to_csv(os.path.join(metrics_dir, "timeseries_cv_benchmark.csv"), index=False)
    print("  [OK] Cross-Validation Table Generated:")
    print(cv_table.to_string(index=False))

    # ==========================================
    # WEEK 6: DECISION TREES
    # ==========================================
    print("\n[WEEK 6] Training Decision Tree Regressor and Classifier...")
    dt_reg, dt_reg_metrics, dt_reg_preds, dt_reg_imp = train_decision_tree_regressor(
        X_train, y_train_reg, X_test, y_test_reg, max_depth=6
    )
    joblib.dump(dt_reg, os.path.join(models_dir, "dt_regressor.joblib"))
    test_preds_df["pred_dt_reg"] = dt_reg_preds
    regression_leaderboard.append({"Model": "Decision Tree", **dt_reg_metrics})

    dt_clf, dt_clf_metrics, dt_clf_preds, dt_clf_probs, dt_clf_cm, dt_clf_imp = train_decision_tree_classifier(
        X_train, y_train_clf, X_test, y_test_clf, max_depth=5
    )
    joblib.dump(dt_clf, os.path.join(models_dir, "dt_classifier.joblib"))
    test_preds_df["pred_dt_clf"] = dt_clf_preds
    test_preds_df["prob_dt_clf"] = dt_clf_probs
    classification_leaderboard.append({"Model": "Decision Tree", **dt_clf_metrics})
    plot_confusion_matrix_heatmap(dt_clf_cm, "Decision Tree", os.path.join(fig_dir, "cm_decision_tree.png"))
    plot_feature_importances(dt_reg_imp, "Decision Tree Regressor Feature Importance", os.path.join(fig_dir, "dt_reg_importance.png"))
    print(f"  [OK] DT Regressor RMSE={dt_reg_metrics['RMSE']} | DT Classifier F1={dt_clf_metrics['F1']}")

    # ==========================================
    # WEEK 7: RANDOM FOREST ENSEMBLE
    # ==========================================
    print("\n[WEEK 7] Training Random Forest Ensemble with OOB & Permutation Importance...")
    rf_reg, rf_reg_metrics, rf_reg_preds, rf_reg_imp, oob_score = train_random_forest_regressor(
        X_train, y_train_reg, X_test, y_test_reg, n_estimators=150, max_depth=12
    )
    joblib.dump(rf_reg, os.path.join(models_dir, "rf_regressor.joblib"))
    test_preds_df["pred_rf_reg"] = rf_reg_preds
    regression_leaderboard.append({"Model": "Random Forest", **rf_reg_metrics})
    print(f"  [OK] RF Regressor OOB R² Score: {oob_score}")

    rf_clf, rf_clf_metrics, rf_clf_preds, rf_clf_probs, rf_clf_cm, rf_clf_imp = train_random_forest_classifier(
        X_train, y_train_clf, X_test, y_test_clf, n_estimators=150, max_depth=10
    )
    joblib.dump(rf_clf, os.path.join(models_dir, "rf_classifier.joblib"))
    test_preds_df["pred_rf_clf"] = rf_clf_preds
    test_preds_df["prob_rf_clf"] = rf_clf_probs
    classification_leaderboard.append({"Model": "Random Forest", **rf_clf_metrics})
    plot_confusion_matrix_heatmap(rf_clf_cm, "Random Forest", os.path.join(fig_dir, "cm_random_forest.png"))
    plot_feature_importances(rf_reg_imp, "Random Forest Regressor Feature Importance", os.path.join(fig_dir, "rf_reg_importance.png"))
    compute_and_plot_permutation_importance(
        rf_reg, X_test, y_test_reg, "Random Forest Permutation Importance", os.path.join(fig_dir, "rf_permutation_importance.png")
    )
    print(f"  [OK] RF Regressor RMSE={rf_reg_metrics['RMSE']} | RF Classifier F1={rf_clf_metrics['F1']}")

    # ==========================================
    # WEEK 8: XGBOOST CHAMPION & SHAP
    # ==========================================
    print("\n[WEEK 8] Training Champion XGBoost Models & Computing SHAP Explanations...")
    xgb_reg, xgb_reg_metrics, xgb_reg_preds, xgb_reg_imp = train_xgboost_regressor(
        X_train, y_train_reg, X_test, y_test_reg
    )
    joblib.dump(xgb_reg, os.path.join(models_dir, "xgb_regressor.joblib"))
    test_preds_df["pred_xgb_reg"] = xgb_reg_preds
    regression_leaderboard.append({"Model": "XGBoost", **xgb_reg_metrics})

    xgb_clf, xgb_clf_metrics, xgb_clf_preds, xgb_clf_probs, xgb_clf_cm, xgb_clf_imp = train_xgboost_classifier(
        X_train, y_train_clf, X_test, y_test_clf
    )
    joblib.dump(xgb_clf, os.path.join(models_dir, "xgb_classifier.joblib"))
    test_preds_df["pred_xgb_clf"] = xgb_clf_preds
    test_preds_df["prob_xgb_clf"] = xgb_clf_probs
    classification_leaderboard.append({"Model": "XGBoost", **xgb_clf_metrics})
    plot_confusion_matrix_heatmap(xgb_clf_cm, "XGBoost", os.path.join(fig_dir, "cm_xgboost.png"))

    # Hybrid hazard model: un-weighted classifier + regression-derived probability, with an alert
    # threshold and residual spread estimated from out-of-fold predictions on the TRAINING split only.
    hybrid, hybrid_diag = fit_hazard_model(
        X_train, y_train_reg, y_train_clf, hazard_threshold=hazard_threshold, regressor=xgb_reg
    )
    joblib.dump(hybrid, os.path.join(models_dir, "hybrid_hazard_classifier.joblib"))
    hybrid_probs = hybrid.predict_proba(X_test)[:, 1]
    hybrid_preds = hybrid.predict(X_test)
    hybrid_metrics, hybrid_cm = evaluate_classification(y_test_clf, hybrid_preds, hybrid_probs)
    classification_leaderboard.append({
        "Model": CHAMPION_CLASSIFIER_NAME, **hybrid_metrics, "Decision_Threshold": hybrid.alert_threshold
    })
    test_preds_df["pred_hybrid_clf"] = hybrid_preds
    test_preds_df["prob_hybrid_clf"] = hybrid_probs
    plot_confusion_matrix_heatmap(hybrid_cm, "Hybrid Hazard Model", os.path.join(fig_dir, "cm_hybrid_hazard.png"))
    print(f"  [OK] Hybrid hazard model: alert threshold={hybrid.alert_threshold}, residual sigma={hybrid.residual_sigma:.1f}, "
          f"OOF ROC-AUC={hybrid_diag['oof_roc_auc']}")
    plot_actual_vs_predicted(y_test_reg.values, xgb_reg_preds, "XGBoost Champion", os.path.join(fig_dir, "xgb_actual_vs_predicted.png"))
    plot_residuals(y_test_reg.values, xgb_reg_preds, "XGBoost Champion", os.path.join(fig_dir, "xgb_residuals.png"))
    plot_feature_importances(xgb_reg_imp, "XGBoost Feature Importance", os.path.join(fig_dir, "xgb_importance.png"))

    # ROC Curves comparison
    roc_dict = {
        "Logistic Regression": (y_test_clf.values, log_probs),
        "Decision Tree": (y_test_clf.values, dt_clf_probs),
        "Random Forest": (y_test_clf.values, rf_clf_probs),
        "XGBoost": (y_test_clf.values, xgb_clf_probs),
        CHAMPION_CLASSIFIER_NAME: (y_test_clf.values, hybrid_probs)
    }
    plot_roc_curve_comparison(roc_dict, os.path.join(fig_dir, "roc_curve_comparison.png"))

    # SHAP Interpretability
    print("  Calculating TreeExplainer SHAP values...")
    shap_vals, expected_val, global_shap_imp = compute_shap_explanations(
        xgb_reg, X_test, max_display=15, figures_dir=fig_dir
    )

    # Local explanations: highest predicted AQI day vs lowest predicted AQI day
    max_idx = int(np.argmax(xgb_reg_preds))
    min_idx = int(np.argmin(xgb_reg_preds))

    high_risk_explanation = explain_individual_prediction(
        shap_vals, max_idx,
        os.path.join(fig_dir, "shap_waterfall_high_risk.png"),
        title="SHAP Waterfall — High-Risk Hazardous Air Day"
    )
    low_risk_explanation = explain_individual_prediction(
        shap_vals, min_idx,
        os.path.join(fig_dir, "shap_waterfall_low_risk.png"),
        title="SHAP Waterfall — Clean Air Day"
    )

    high_risk_narrative = generate_natural_language_explanation(high_risk_explanation, hazard_threshold=hazard_threshold)
    low_risk_narrative = generate_natural_language_explanation(low_risk_explanation, hazard_threshold=hazard_threshold)

    # Save leaderboards
    reg_df = pd.DataFrame(regression_leaderboard)
    clf_df = pd.DataFrame(classification_leaderboard)
    clf_df["Decision_Threshold"] = clf_df["Decision_Threshold"].fillna(0.5)
    reg_df.to_csv(os.path.join(metrics_dir, "regression_leaderboard.csv"), index=False)
    clf_df.to_csv(os.path.join(metrics_dir, "classification_leaderboard.csv"), index=False)

    # Save test predictions
    test_preds_df.to_csv(os.path.join(preds_dir, "test_predictions.csv"), index=False)

    # Champions were designated from expanding-window CV on the training split (see src/tuning.py and
    # scripts/tune_champion.py), NOT by ranking on this test split. Report the test ranking for transparency.
    best_reg_model = CHAMPION_REGRESSOR_NAME
    best_clf_model = CHAMPION_CLASSIFIER_NAME
    test_rank_reg = reg_df.sort_values(by="RMSE").iloc[0]["Model"]
    test_rank_clf = clf_df.sort_values(by="ROC_AUC", ascending=False).iloc[0]["Model"]

    metadata = {
        "dataset_name": "Archive 1 (AirQuality.csv)",
        "dataset_shape": eda_stats["shape"],
        "num_features": len(feature_cols),
        "feature_names": feature_cols,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "hazard_threshold": hazard_threshold,
        "hazard_alert_threshold": hybrid.alert_threshold,
        "hazard_model_diagnostics": hybrid_diag,
        "labelled_samples": int(len(feature_df)),
        "best_regression_model": best_reg_model,
        "best_classification_model": best_clf_model,
        "regression_leaderboard": reg_df.to_dict(orient="records"),
        "classification_leaderboard": clf_df.to_dict(orient="records"),
        "high_risk_narrative": high_risk_narrative,
        "low_risk_narrative": low_risk_narrative,
    }
    with open(os.path.join(models_dir, "model_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print("\n" + "=" * 75)
    print("FINAL MODEL BENCHMARK RESULTS (WEEKS 1–8)")
    print("=" * 75)
    print("\nREGRESSION LEADERBOARD (Target: next_day_air_quality_index):")
    print(reg_df.to_string(index=False))
    print(f"\n[*] Champion Regression Model: {best_reg_model} (lowest test RMSE: {test_rank_reg})")

    print("\nCLASSIFICATION LEADERBOARD (Target: hazardous_air_day):")
    print(clf_df.to_string(index=False))
    print(f"\n[*] Champion Classification Model: {best_clf_model} (highest test ROC-AUC: {test_rank_clf})")

    # ==========================================
    # WEEK 9: UNSUPERVISED POLLUTION REGIMES
    # ==========================================
    clustering_summary = run_week9_clustering(
        data_path=processed_path,
        models_dir=models_dir,
        outputs_dir=outputs_dir
    )

    # ==========================================
    # WEEK 10: RIGOROUS EVALUATION & SIGNIFICANCE
    # ==========================================
    run_week10_evaluation(
        data_path=processed_path,
        models_dir=models_dir,
        outputs_dir=outputs_dir
    )

    # ==========================================
    # WEEK 11: DRIFT MONITORING & PACKAGING
    # ==========================================
    drift_summary = run_drift_analysis(
        train_path=processed_path,
        output_dir=outputs_dir
    )
    registry_meta = package_production_artifacts(
        models_dir=models_dir,
        metrics_dir=metrics_dir,
        processed_path=processed_path
    )

    print("\n" + "=" * 75)
    print("AEROPURE END-TO-END PIPELINE (WEEKS 1–12) COMPLETED SUCCESSFULLY")
    print("=" * 75)
    print(f"• Regression Champion:    {best_reg_model} (Test RMSE: {reg_df.loc[reg_df['Model']==best_reg_model, 'RMSE'].values[0]:.3f})")
    print(f"• Classification Champion:{best_clf_model} (Test ROC-AUC: {clf_df.loc[clf_df['Model']==best_clf_model, 'ROC_AUC'].values[0]:.4f}, F1: {clf_df.loc[clf_df['Model']==best_clf_model, 'F1'].values[0]:.4f})")
    print(f"• Unsupervised Regimes:   K-Means (k=3), PCA ({clustering_summary['pca_explained_variance_first3']*100:.1f}% variance in 3 PCs), DBSCAN")
    print(f"• Drift Status:           {drift_summary['overall_drift_status']} (Mean PSI: {drift_summary['mean_psi']:.4f})")
    print(f"• Production Artifacts:   Saved to '{models_dir}/' and registered in 'model_registry.json'")
    print(f"• FastAPI REST Endpoints: /health, /metrics, /predict, /explain, /drift")
    print(f"• Interactive Dashboard:  Streamlit application ready in 'app/app.py'")
    print("=" * 75 + "\n")

    metadata["clustering_summary"] = clustering_summary
    metadata["drift_summary"] = drift_summary
    metadata["registry"] = registry_meta

    return {"status": "SUCCESS", "metadata": metadata}

