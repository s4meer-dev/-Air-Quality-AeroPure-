"""
AeroPure Notebook Generator (Notebooks 08, 09, 10)
=================================================
Generates standard Jupyter Notebooks for Weeks 9, 10, and 11.
"""

import json
import os


def make_notebook(cells):
    return {
        "cells": cells,
        "metadata": {
            "language_info": {"name": "python"},
            "orig_nbformat": 4
        },
        "nbformat": 4,
        "nbformat_minor": 2
    }


def make_markdown_cell(source):
    return {
        "cell_type": "markdown",
        "metadata": {},
        "source": [s + "\n" for s in source.split("\n")]
    }


def make_code_cell(source):
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [s + "\n" for s in source.split("\n")]
    }


def generate_all_notebooks():
    os.makedirs("notebooks", exist_ok=True)

    # ----------------------------------------------------
    # Notebook 08: Clustering & Regime Discovery (Week 9)
    # ----------------------------------------------------
    nb08_cells = [
        make_markdown_cell(
            "# AeroPure — Notebook 08: Unsupervised Pollution Regime Discovery (Week 9)\n"
            "**Tagline:** *Tell a city when tomorrow's air turns dangerous.*\n\n"
            "### Objectives:\n"
            "1. Standardize 13 physical criteria pollutants and sensor measurements at time $t$.\n"
            "2. Perform **Principal Component Analysis (PCA)** to assess underlying variance structures.\n"
            "3. Evaluate **K-Means** clustering across $k \\in [2, 6]$ via Inertia Elbow Curve and Silhouette Scores.\n"
            "4. Fit **DBSCAN** density clustering to identify core manifolds and sensor anomalies/noise.\n"
            "5. Statistically profile discovered clusters to assign data-driven **operational regime labels**.\n"
            "6. Conduct a **leakage-safe forecasting experiment** testing whether regime information at time $t$ improves next-day forecasting."
        ),
        make_code_cell(
            "import os\n"
            "import sys\n"
            "import numpy as np\n"
            "import pandas as pd\n"
            "import matplotlib.pyplot as plt\n"
            "import seaborn as sns\n\n"
            "# Add project root\n"
            "sys.path.insert(0, os.path.abspath('..'))\n"
            "from src.clustering import run_week9_clustering, CLUSTER_FEATURE_COLS, REGIME_NAMES_BY_AQI_RANK\n\n"
            "sns.set_theme(style='whitegrid')"
        ),
        make_markdown_cell(
            "## 1. Execute Week 9 Unsupervised Pipeline\n"
            "We run the full unsupervised discovery pipeline on `data/processed_data.csv`."
        ),
        make_code_cell(
            "summary = run_week9_clustering(\n"
            "    data_path='../data/processed_data.csv',\n"
            "    models_dir='../models',\n"
            "    outputs_dir='../outputs'\n"
            ")\n"
            "print('Clustering Execution Summary:')\n"
            "print(json.dumps(summary, indent=2))"
        ),
        make_markdown_cell(
            "## 2. Inspect Discovered Operational Regimes\n"
            "Let's review the statistical profiles of the discovered clusters."
        ),
        make_code_cell(
            "profiles_df = pd.read_csv('../outputs/metrics/cluster_regime_profiles.csv')\n"
            "display(profiles_df)"
        ),
        make_markdown_cell(
            "## 3. Visualize PCA Projections & Density Manifolds"
        ),
        make_code_cell(
            "from IPython.display import Image, display\n"
            "display(Image(filename='../outputs/figures/pca_kmeans_clusters.png'))\n"
            "display(Image(filename='../outputs/figures/dbscan_clusters.png'))\n"
            "display(Image(filename='../outputs/figures/cluster_pollutant_profiles.png'))"
        ),
        make_markdown_cell(
            "## 4. Forecasting Integration Experiment Results\n"
            "Compare the Base XGBoost model against XGBoost augmented with the unsupervised regime feature at time $t$."
        ),
        make_code_cell(
            "comp_df = pd.read_csv('../outputs/metrics/regime_forecast_comparison.csv')\n"
            "display(comp_df)"
        )
    ]
    with open("notebooks/08_Clustering.ipynb", "w", encoding="utf-8") as f:
        json.dump(make_notebook(nb08_cells), f, indent=2)
    print("  [OK] Created notebooks/08_Clustering.ipynb")

    # ----------------------------------------------------
    # Notebook 09: Rigorous Evaluation (Week 10)
    # ----------------------------------------------------
    nb09_cells = [
        make_markdown_cell(
            "# AeroPure — Notebook 09: Rigorous Model Evaluation (Week 10)\n"
            "**Tagline:** *Tell a city when tomorrow's air turns dangerous.*\n\n"
            "### Objectives:\n"
            "1. **Nested Time-Series Cross-Validation:** 5 outer folds (evaluating generalizability) and 3 inner folds (tuning hyperparameters strictly on past windows).\n"
            "2. **Comprehensive Metrics:** MAE, MSE, RMSE, R² for regression; Accuracy, Precision, Recall, F1, ROC-AUC, PR-AUC, Balanced Accuracy, and Brier Score for classification.\n"
            "3. **Probability Calibration:** Reliability diagrams and Brier score loss to ensure risk probabilities reflect true empirical odds.\n"
            "4. **Statistical Significance Testing:** Paired Wilcoxon signed-rank and paired t-tests on out-of-sample prediction residuals to establish statistical superiority."
        ),
        make_code_cell(
            "import os\n"
            "import sys\n"
            "import json\n"
            "import numpy as np\n"
            "import pandas as pd\n"
            "import matplotlib.pyplot as plt\n"
            "import seaborn as sns\n"
            "from IPython.display import Image, display\n\n"
            "sys.path.insert(0, os.path.abspath('..'))\n"
            "from src.feature_engineering import prepare_time_series_splits\n"
            "from src.cross_validation import run_nested_timeseries_cv\n"
            "from src.evaluation import calculate_all_regression_metrics, calculate_all_classification_metrics\n\n"
            "sns.set_theme(style='whitegrid')"
        ),
        make_markdown_cell(
            "## 1. Nested Time-Series Cross-Validation Results"
        ),
        make_code_cell(
            "nested_df = pd.read_csv('../outputs/metrics/nested_cv_results.csv')\n"
            "display(nested_df)\n"
            "print(f'Nested CV Mean RMSE: {nested_df[\"rmse\"].mean():.3f} +/- {nested_df[\"rmse\"].std():.3f}')\n"
            "print(f'Nested CV Mean R2:   {nested_df[\"r2\"].mean():.4f} +/- {nested_df[\"r2\"].std():.4f}')"
        ),
        make_markdown_cell(
            "## 2. Statistical Significance Testing against Baselines\n"
            "Testing null hypothesis: $H_0: \\text{Median residual difference} = 0$."
        ),
        make_code_cell(
            "sig_df = pd.read_csv('../outputs/metrics/statistical_significance_tests.csv')\n"
            "display(sig_df)"
        ),
        make_markdown_cell(
            "## 3. Probability Calibration Curve & Brier Score"
        ),
        make_code_cell(
            "display(Image(filename='../outputs/figures/calibration_curve.png'))\n"
            "display(Image(filename='../outputs/figures/pr_curve_comparison.png'))"
        ),
        make_markdown_cell(
            "## 4. Comprehensive Multi-Metric Benchmark Table"
        ),
        make_code_cell(
            "eval_df = pd.read_csv('../outputs/metrics/comprehensive_evaluation_table.csv')\n"
            "display(eval_df)"
        )
    ]
    with open("notebooks/09_Rigorous_Evaluation.ipynb", "w", encoding="utf-8") as f:
        json.dump(make_notebook(nb09_cells), f, indent=2)
    print("  [OK] Created notebooks/09_Rigorous_Evaluation.ipynb")

    # ----------------------------------------------------
    # Notebook 10: Drift Analysis (Week 11)
    # ----------------------------------------------------
    nb10_cells = [
        make_markdown_cell(
            "# AeroPure — Notebook 10: Production Drift Monitoring & PSI (Week 11)\n"
            "**Tagline:** *Tell a city when tomorrow's air turns dangerous.*\n\n"
            "### Objectives:\n"
            "1. Implement the **Population Stability Index (PSI)** for covariate shift detection.\n"
            "2. Compare baseline training distribution (Spring/Summer/Autumn 2004) against incoming telemetry (Winter/Spring 2005).\n"
            "3. Identify features undergoing seasonal and atmospheric drift.\n"
            "4. Establish production monitoring alerts and safe retraining triggers."
        ),
        make_code_cell(
            "import os\n"
            "import sys\n"
            "import json\n"
            "import numpy as np\n"
            "import pandas as pd\n"
            "import matplotlib.pyplot as plt\n"
            "import seaborn as sns\n"
            "from IPython.display import Image, display\n\n"
            "sys.path.insert(0, os.path.abspath('..'))\n"
            "from src.drift import run_drift_analysis, calculate_feature_psi, classify_psi\n\n"
            "sns.set_theme(style='whitegrid')"
        ),
        make_markdown_cell(
            "## 1. Run Drift Analysis on Chronological Splits"
        ),
        make_code_cell(
            "drift_results = run_drift_analysis(\n"
            "    train_path='../data/processed_data.csv',\n"
            "    output_dir='../outputs'\n"
            ")\n"
            "print('Overall Drift Status:', drift_results['overall_drift_status'])\n"
            "print('Mean PSI:', drift_results['mean_psi'])\n"
            "print('Retraining Flagged:', drift_results['retraining_flagged'])\n"
            "print('Recommendation:', drift_results['recommendation'])"
        ),
        make_markdown_cell(
            "## 2. Feature-by-Feature PSI Table"
        ),
        make_code_cell(
            "psi_df = pd.read_csv('../outputs/metrics/drift_psi_metrics.csv')\n"
            "display(psi_df)"
        ),
        make_markdown_cell(
            "## 3. Drifted Feature Distributions"
        ),
        make_code_cell(
            "display(Image(filename='../outputs/figures/drift_feature_distributions.png'))"
        )
    ]
    with open("notebooks/10_Drift_Analysis.ipynb", "w", encoding="utf-8") as f:
        json.dump(make_notebook(nb10_cells), f, indent=2)
    print("  [OK] Created notebooks/10_Drift_Analysis.ipynb")


if __name__ == "__main__":
    generate_all_notebooks()
