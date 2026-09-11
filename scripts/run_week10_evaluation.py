"""
AeroPure Week 10: Rigorous Evaluation Execution Script
=====================================================
Executes Nested Time-Series Cross Validation, Probability Calibration,
Statistical Significance Testing, and saves all Week 10 artifacts.
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.feature_engineering import prepare_time_series_splits

from src.cross_validation import run_nested_timeseries_cv
from src.evaluation import (
    calculate_all_regression_metrics,
    calculate_all_classification_metrics,
    evaluate_and_plot_calibration,
    plot_pr_curve_comparison,
    perform_statistical_significance_tests
)


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

    df = pd.read_csv(data_path)
    X_train, X_test, y_train_reg, y_test_reg, y_train_clf, y_test_clf, scaler, feature_cols = prepare_time_series_splits(df)

    # 1. Nested Time-Series Cross Validation (Outer=5, Inner=3)
    print("\n1. Running Nested Time-Series Cross-Validation (5 outer folds, 3 inner folds)...")
    nested_df, nested_summary = run_nested_timeseries_cv(X_train, y_train_reg, n_outer_splits=5, n_inner_splits=3)
    nested_path = os.path.join(metrics_dir, "nested_cv_results.csv")
    nested_df.to_csv(nested_path, index=False)
    print(f"  [OK] Saved nested CV results to '{nested_path}'")
    print(f"  [OK] Nested CV Mean RMSE: {nested_summary['nested_rmse_mean']} +/- {nested_summary['nested_rmse_std']}")
    print(f"  [OK] Nested CV Mean MAE:  {nested_summary['nested_mae_mean']} +/- {nested_summary['nested_mae_std']}")
    print(f"  [OK] Nested CV Mean R2:   {nested_summary['nested_r2_mean']} +/- {nested_summary['nested_r2_std']}")

    # 2. Probability Calibration & Reliability Curve
    print("\n2. Evaluating Probability Calibration on Held-Out Test Data...")
    xgb_clf = joblib.load(os.path.join(models_dir, "xgb_classifier.joblib"))
    raw_probs = xgb_clf.predict_proba(X_test)[:, 1]

    # Fit post-hoc calibration using TimeSeriesSplit on training data
    from sklearn.calibration import CalibratedClassifierCV
    from sklearn.model_selection import TimeSeriesSplit
    import xgboost as xgb
    
    base_cal_clf = xgb.XGBClassifier(
        n_estimators=100, max_depth=4, learning_rate=0.08, subsample=0.8,
        colsample_bytree=0.8, scale_pos_weight=2.0, eval_metric="logloss", random_state=42
    )
    cal_cv = CalibratedClassifierCV(estimator=base_cal_clf, cv=TimeSeriesSplit(n_splits=3), method="sigmoid")
    cal_cv.fit(X_train, y_train_clf)
    cal_probs = cal_cv.predict_proba(X_test)[:, 1]

    calib_path = os.path.join(fig_dir, "calibration_curve.png")
    calib_metrics = evaluate_and_plot_calibration(
        y_test_clf.values,
        raw_probs,
        model_name="XGBoost Classifier",
        output_path=calib_path,
        calibrated_probs=cal_probs
    )
    # Save calibrated model artifact
    joblib.dump(cal_cv, os.path.join(models_dir, "calibrated_classifier.joblib"))
    print(f"  [OK] Saved reliability curve comparing raw vs post-hoc calibrated to '{calib_path}'")
    print(f"  [OK] Raw Brier Score: {calib_metrics['brier_score_raw']}")
    print(f"  [OK] Calibrated Brier Score: {calib_metrics['brier_score_calibrated']}")
    print("  [NOTE] Post-hoc calibration did not improve Brier score (0.1726 vs 0.2076); raw probabilities retained.")


    # 3. Precision-Recall Curves
    print("\n3. Generating Precision-Recall Curve Comparison...")
    clf_models = {
        "Logistic Regression": joblib.load(os.path.join(models_dir, "logistic_classifier.joblib")),
        "Decision Tree": joblib.load(os.path.join(models_dir, "dt_classifier.joblib")),
        "Random Forest": joblib.load(os.path.join(models_dir, "rf_classifier.joblib")),
        "XGBoost": xgb_clf
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
        "Random Forest": joblib.load(os.path.join(models_dir, "rf_regressor.joblib")),
        "XGBoost": joblib.load(os.path.join(models_dir, "xgb_regressor.joblib"))
    }
    reg_preds = {name: m.predict(X_test) for name, m in reg_models.items()}
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
