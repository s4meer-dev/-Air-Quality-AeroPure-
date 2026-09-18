"""
AeroPure Week 10: Rigorous Evaluation Execution Script
=====================================================
Executes Nested Time-Series Cross Validation, probability-quality comparison,
Statistical Significance Testing, and saves all Week 10 artifacts.

Every number printed or saved here is computed by this run; nothing is hardcoded.
"""

import os
import sys
import joblib
import pandas as pd

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.feature_engineering import prepare_time_series_splits
from src.classification import train_xgboost_classifier
from src.cross_validation import run_nested_timeseries_cv
from src.evaluation import (
    calculate_all_classification_metrics,
    evaluate_and_plot_calibration,
    plot_pr_curve_comparison,
    perform_statistical_significance_tests
)

HYBRID_NAME = "AeroPure Hybrid Hazard Model"


def run_week10_evaluation(
    data_path: str = "data/processed_data.csv",
    models_dir: str = "models",
    outputs_dir: str = "outputs"
):
    fig_dir = os.path.join(outputs_dir, "figures")
    metrics_dir = os.path.join(outputs_dir, "metrics")
    os.makedirs(fig_dir, exist_ok=True)
    os.makedirs(metrics_dir, exist_ok=True)

    print("=" * 75)
    print("WEEK 10: RIGOROUS MODEL EVALUATION")
    print("=" * 75)

    df = pd.read_csv(data_path, parse_dates=["datetime"])
    X_train, X_test, y_train_reg, y_test_reg, y_train_clf, y_test_clf, scaler, feature_cols = prepare_time_series_splits(df)

    # 1. Nested Time-Series Cross Validation (Outer=5, Inner=3), champion configuration, purged folds
    print("\n1. Running Nested Time-Series Cross-Validation (5 outer folds, 3 inner folds)...")
    nested_df, nested_summary = run_nested_timeseries_cv(X_train, y_train_reg, n_outer_splits=5, n_inner_splits=3)
    nested_path = os.path.join(metrics_dir, "nested_cv_results.csv")
    nested_df.to_csv(nested_path, index=False)
    print(f"  [OK] Saved nested CV results to '{nested_path}'")
    print(f"  [OK] Nested CV Mean RMSE: {nested_summary['nested_rmse_mean']} +/- {nested_summary['nested_rmse_std']}")
    print(f"  [OK] Nested CV Mean MAE:  {nested_summary['nested_mae_mean']} +/- {nested_summary['nested_mae_std']}")
    print(f"  [OK] Nested CV Mean R2:   {nested_summary['nested_r2_mean']} +/- {nested_summary['nested_r2_std']}")

    # 2. Probability quality: how trustworthy is each model's predicted probability?
    print("\n2. Comparing Probability Quality on Held-Out Test Data...")
    xgb_clf = joblib.load(os.path.join(models_dir, "xgb_classifier.joblib"))
    hybrid = joblib.load(os.path.join(models_dir, "hybrid_hazard_classifier.joblib"))
    unweighted_probs = xgb_clf.predict_proba(X_test)[:, 1]
    hybrid_probs = hybrid.predict_proba(X_test)[:, 1]

    # Legacy configuration (class re-weighting) retrained for an explicit before/after comparison.
    _, _, _, weighted_probs, _, _ = train_xgboost_classifier(
        X_train, y_train_clf, X_test, y_test_clf, balance_classes=True
    )

    calib_path = os.path.join(fig_dir, "calibration_curve.png")
    calib_metrics = evaluate_and_plot_calibration(
        y_test_clf.values,
        unweighted_probs,
        model_name="XGBoost Classifier (un-weighted)",
        output_path=calib_path,
        calibrated_probs=hybrid_probs,
        comparison_label="Hybrid hazard model"
    )
    from sklearn.metrics import brier_score_loss
    brier_weighted = float(brier_score_loss(y_test_clf.values, weighted_probs))
    print(f"  [OK] Saved reliability curves to '{calib_path}'")
    print(f"  [OK] Brier score  class-weighted XGBoost (legacy): {brier_weighted:.4f}")
    print(f"  [OK] Brier score  un-weighted XGBoost:             {calib_metrics['brier_score_raw']}")
    print(f"  [OK] Brier score  hybrid hazard model:             {calib_metrics['brier_score_calibrated']}")
    print(f"  [OK] Hybrid alert threshold (F1-optimal on out-of-fold data): {hybrid.alert_threshold}")

    # 3. Precision-Recall Curves
    print("\n3. Generating Precision-Recall Curve Comparison...")
    clf_models = {
        "Logistic Regression": joblib.load(os.path.join(models_dir, "logistic_classifier.joblib")),
        "Decision Tree": joblib.load(os.path.join(models_dir, "dt_classifier.joblib")),
        "Random Forest": joblib.load(os.path.join(models_dir, "rf_classifier.joblib")),
        "XGBoost": xgb_clf,
        HYBRID_NAME: hybrid,
    }
    pr_dict = {name: (y_test_clf.values, m.predict_proba(X_test)[:, 1]) for name, m in clf_models.items()}
    pr_path = os.path.join(fig_dir, "pr_curve_comparison.png")
    plot_pr_curve_comparison(pr_dict, pr_path)
    print(f"  [OK] Saved PR curves to '{pr_path}'")

    # 4. Statistical Significance Tests
    print("\n4. Running Statistical Significance Tests against Baselines...")
    reg_models = {
        "OLS": joblib.load(os.path.join(models_dir, "ols_regressor.joblib")),
        "Ridge": joblib.load(os.path.join(models_dir, "ridge_regressor.joblib")),
        "Lasso": joblib.load(os.path.join(models_dir, "lasso_regressor.joblib")),
        "Random Forest": joblib.load(os.path.join(models_dir, "rf_regressor.joblib")),
        "XGBoost": joblib.load(os.path.join(models_dir, "xgb_regressor.joblib"))
    }
    reg_preds = {name: m.predict(X_test) for name, m in reg_models.items()}
    reg_preds["Persistence"] = df.loc[X_test.index, "current_air_quality_index"].values
    sig_df = perform_statistical_significance_tests(y_test_reg.values, reg_preds, champion_name="XGBoost")
    sig_path = os.path.join(metrics_dir, "statistical_significance_tests.csv")
    sig_df.to_csv(sig_path, index=False)
    print(f"  [OK] Saved statistical significance results to '{sig_path}'")
    print(sig_df.to_string(index=False))

    # 5. Final Comprehensive Evaluation Table
    print("\n5. Generating Comprehensive Model Benchmark Table...")
    final_clf_records = []
    for name, m in clf_models.items():
        preds = m.predict(X_test)
        probs = m.predict_proba(X_test)[:, 1]
        c_mets = calculate_all_classification_metrics(y_test_clf.values, preds, probs)
        c_mets["Model"] = name
        c_mets["Decision_Threshold"] = float(getattr(m, "alert_threshold", 0.5))
        final_clf_records.append(c_mets)

    eval_table = pd.DataFrame(final_clf_records)
    eval_table_path = os.path.join(metrics_dir, "comprehensive_evaluation_table.csv")
    eval_table.to_csv(eval_table_path, index=False)
    print(f"  [OK] Saved comprehensive evaluation table to '{eval_table_path}'")
    print(eval_table.to_string(index=False))

    print("\n" + "=" * 75)
    print("WEEK 10 EVALUATION COMPLETED SUCCESSFULLY")
    print("=" * 75)


if __name__ == "__main__":
    run_week10_evaluation()
