# AeroPure: AI-Based Air Quality Prediction System
## Complete Engineering Roadmap (Weeks 1 to 12)

> **Tagline:** *“Tell a city when tomorrow's air turns dangerous.”*  
> **Course:** Machine Learning Major / Mini-Project  
> **Architecture Scope:** **Weeks 1 to 12 (Complete End-to-End System)**  
> **Tech Stack:** Python 3.12, scikit-learn, XGBoost, SHAP, FastAPI, Streamlit, Pytest  

---

## 1. Project Objective & Public Health Context
Urban air pollution is among the world's most acute environmental health threats. Traditional municipal reporting is retrospective: sensors measure current pollutant levels and issue public health warnings only after citizens have already been exposed. 

**AeroPure** is an intelligent next-day air quality forecasting and early warning system designed to give cities a **24-hour actionable lead time**. It delivers:
1. **Continuous Regression Forecast (`next_day_air_quality_index`):** Tomorrow's (+24h) continuous composite index proxy.
2. **Probabilistic Hazard Classification (`hazardous_air_day`):** Probability of tomorrow crossing the project-defined elevated pollution threshold ($\ge 180.0$).
3. **SHAP AI Explainability:** Directional attributions explaining exactly which physical and meteorological factors drive every prediction.
4. **Unsupervised Pollution Regimes (Week 9):** Data-driven atmospheric regimes discovered via PCA, K-Means ($k=3$), and DBSCAN.
5. **Rigorous Validation (Week 10):** 5-outer $\times$ 3-inner nested time-series cross-validation, probability calibration, and Wilcoxon signed-rank tests.
6. **Production Drift Monitoring (Week 11):** Population Stability Index (PSI) tracking covariate shift and triggering seasonal retraining alerts.
7. **Deployment Architecture (Week 12):** High-performance FastAPI microservice (`/health`, `/metrics`, `/predict`, `/explain`, `/drift`) and an interactive Streamlit UI.

---

## 2. Dataset Audit & Selection

Three candidate datasets were audited on disk:

| Dataset | Dimensions | Temporal Nature | Key Variables | Suitability & Decision |
| :--- | :--- | :--- | :--- | :--- |
| **Archive 1 (`AirQuality.csv`)** | **9,357 rows, 15 cols** | Continuous hourly (March 2004 – April 2005) | `CO(GT)`, `NO2(GT)`, `C6H6(GT)`, `NOx(GT)`, sensors `PT08.S1-S5`, `T`, `RH`, `AH` | **SELECTED PRIMARY DATASET:** High-resolution continuous hourly time series enabling genuine 24h lag features, rolling statistics, and time-aware evaluation. |
| **Archive 2 (`data.csv`)** | 435,742 rows, 13 cols | Irregular periodic (~2 days/week over 28 years) | `so2`, `no2`, `rspm`, `spm`, `pm2_5` across 304 cities | **NOT SUITABLE / NOT MERGED:** PM2.5 is **97.8% missing** (missing in 426,428 rows), no weather variables, and 3-5 day gaps break next-day contiguous forecasting. |
| **Archive 3 (4 CSVs)** | ~6,468 rows each | Annual national aggregates (1990–2017) | Global mortality and epidemiological rates | **NOT SUITABLE / NOT MERGED:** Annual global health statistics cannot predict urban next-day hourly air quality. |

---

## 3. Pollutant-Based AQI Proxy Methodology

### Important Regulatory Disclosure
Archive 1 (`AirQuality.csv`) contains continuous concentrations of gaseous criteria contaminants (`CO`, `NO2`, `C6H6`, `NOx`) and metal-oxide sensors, but does not contain direct PM2.5 or PM10 particulate readings.
Therefore, our calculated index is strictly designated as a **"Pollutant-Based Air Quality Index Proxy"** (AQI Proxy) using standard piecewise linear interpolation:

$$I_p = \frac{I_{hi} - I_{lo}}{BP_{hi} - BP_{lo}} \times (C_p - BP_{lo}) + I_{lo}$$

$$current\_air\_quality\_index = \max\left(I_{CO}, I_{NO2}, I_{C6H6}\right)$$

- **No PM2.5 or PM10 values were fabricated or estimated.**
- **Supervised Targets:**
  - **Regression Target (`next_day_air_quality_index`):** Target at time $t$ is strictly $AQI_{proxy}(t + 24\text{ hours})$ constructed via explicit timestamp mapping.
  - **Classification Target (`hazardous_air_day`):** Binary indicator ($1$ if $next\_day\_air\_quality\_index \ge 180.0$, else $0$). Threshold $180.0$ represents the **75th percentile** of the real observational distribution (upper quartile capturing acute pollution episodes: 24.3% positive class balance).

---

## 4. Real Model Leaderboard Results (Held-Out Test Set: 1,867 Samples)

### Regression Benchmark (`next_day_air_quality_index`)
| Model | MAE | MSE | RMSE | $R^2$ | Architectural Status |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Linear Regression (OLS)** | 33.605 | 1882.371 | 43.386 | 0.3950 | Week 3 Linear Baseline |
| **Ridge Regression ($\alpha=10.0$)** | 33.526 | 1852.828 | 43.044 | 0.4045 | Week 4 Regularized |
| **Lasso Regression ($\alpha=0.5$)** | 32.156 | 1725.420 | 41.538 | 0.4454 | Week 4 Sparse Feature Selection |
| **Decision Tree ($depth=6$)** | 36.721 | 2391.627 | 48.904 | 0.2313 | Week 6 Non-Linear Tree |
| **Random Forest (150 trees)** | 32.405 | 1755.180 | 41.895 | 0.4358 | Week 7 Bagged Ensemble (OOB $R^2$: 0.671) |
| **XGBoost Regressor (Champion)** | **30.855** | **1542.367** | **39.273** | **0.5042** | **Week 8 Champion (Lowest Error, Highest $R^2$)** |

### Classification Benchmark (`hazardous_air_day`)
| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC | PR-AUC | Balanced Acc | Brier Score |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** | 67.81% | 54.70% | 72.16% | 0.6223 | 0.7684 | 0.6802 | 68.72% | 0.2192 |
| **Decision Tree** | 67.27% | 54.09% | 72.30% | 0.6188 | 0.7682 | 0.6267 | 68.33% | 0.2324 |
| **Random Forest** | 74.29% | 62.50% | **75.07%** | 0.6821 | 0.8065 | 0.6789 | 74.45% | 0.1784 |
| **XGBoost Classifier (Champion)** | **75.04%** | **64.03%** | 73.18% | **0.6830** | **0.8243** | **0.7315** | **74.65%** | **0.1726** |

---

## 5. Unsupervised Pollution Regime Discovery (Week 9)
- **PCA:** First 3 principal components capture **87.28%** of cumulative variance across 13 criteria pollutant and meteorological variables.
- **K-Means ($k=3$):** Discovered three statistically distinct operational atmospheric regimes:
  1. **Moderate / Warm Photochemical Regime (36.0%):** Mean AQI Proxy = 122.47, Mean CO = 1.81 mg/m³, Mean T = 25.25°C.
  2. **Low Pollution / Clean Dispersion Regime (39.1%):** Mean AQI Proxy = 108.36, Mean CO = 1.17 mg/m³, Mean T = 12.91°C.
  3. **Severe Stagnant Inversion / High Emission Regime (24.9%):** Mean AQI Proxy = 215.61, Mean CO = 3.92 mg/m³, Mean T = 16.79°C.
- **DBSCAN:** Identified 1 dense continuous manifold and 69 anomalous noise/sensor spikes (0.74%).
- **Supervised Integration:** Adding cluster regime indicators at observation time $t$ reduced out-of-sample test RMSE from **39.068 to 38.324** (an improvement of **-0.744 points**, boosting $R^2$ to **0.5279**).

---

## 6. Rigorous Evaluation & Statistical Validation (Week 10)
- **Nested Time-Series Cross-Validation:** 5 outer folds (generalizability) $\times$ 3 inner folds (hyperparameter tuning strictly on past windows):
  - Overall Nested CV Mean: $\text{RMSE} = 43.008 \pm 10.08$, $\text{MAE} = 32.747 \pm 8.72$, $R^2 = 0.4337 \pm 0.102$.
- **Probability Calibration & Reliability:** Raw XGBoost achieves a Brier Score of **0.1726** and $ROC\text{-}AUC = 0.8243$. Probability calibration was evaluated using Brier score and reliability analysis. Post-hoc Platt scaling did not improve the held-out Brier score (0.1726 raw vs 0.2076 calibrated), so raw XGBoost probability estimates were retained.
- **Statistical Significance (Wilcoxon Signed-Rank Tests on Absolute Residuals):**
  - XGBoost vs OLS: $p = 9.89 \times 10^{-6}$ ($p < 0.001$, statistically significant difference in error distributions).
  - XGBoost vs Ridge: $p = 3.33 \times 10^{-6}$ ($p < 0.001$, statistically significant difference in error distributions).
  - XGBoost vs Random Forest: $p = 1.11 \times 10^{-3}$ ($p < 0.01$, statistically significant difference in error distributions).

---

## 7. Production Packaging & Drift Monitoring (Week 11)
- **Population Stability Index (PSI):**
  - `CO(GT)`: $PSI = 0.0468$ (Stable)
  - `RH`: $PSI = 0.0413$ (Stable)
  - `C6H6(GT)`: $PSI = 0.2374$ (Monitor)
  - `current_air_quality_index`: $PSI = 0.3760$ (Significant Drift)
  - `NO2(GT)`: $PSI = 0.6939$ (Significant Drift)
  - `T`: $PSI = 2.2805$ (Significant Drift)
  - **Overall Status:** `Significant Drift` (Mean PSI = 0.6598, seasonal thermal shift flagged for retraining review).
- **Model Registry (`models/model_registry.json`):** Catalogs version `1.0.0`, training date, 113 feature names, hyperparameters, and test benchmarks.

---

## 8. Deployment Architecture (Week 12)

### FastAPI Microservice (`api/main.py`)
```bash
# Start FastAPI production server
uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```
Endpoints:
- `GET /health`: Operational health check.
- `GET /metrics`: Model version, test metrics, and inference latency.
- `POST /predict`: Real-time next-day AQI proxy, hazard probability, and regime.
- `POST /explain`: Directional top positive and negative feature contributors.
- `GET /drift`: PSI drift metrics and retraining alert status.
- Interactive Swagger docs at `http://127.0.0.1:8000/docs`.
- **Feature Construction Contract:** For isolated single-point API calls, concurrent physical measurements are overridden, while unobserved historical 1h–48h lags and rolling metrics utilize baseline training medians as an empirical imputation anchor.

### Interactive Streamlit Dashboard (`app/app.py`)
```bash
# Launch Streamlit dashboard
streamlit run app/app.py
```
Includes:
- Tomorrow's Forecast & Hazard Alert Banner
- Discovered Pollution Regimes & PCA Projections
- Model Leaderboards & ROC/PR Curves
- SHAP Summary Beeswarm & Local Waterfall Attributions
- Live What-If Simulator passing through production pipeline
- PSI Drift Telemetry & Retraining Governance
- Diurnal Rush-Hour Patterns & Historical Sensor EDA

---

## 9. How to Run the Project

### 1. Environment Setup
```bash
python -m venv .venv
.venv\Scripts\activate       # Windows
# source .venv/bin/activate  # Linux/macOS
pip install -r requirements.txt
```

### 2. Execute Full Master Pipeline (Weeks 1 to 12)
```bash
python run_project.py
```

### 3. Run Automated Unit Test Suite
```bash
pytest tests/ -v
```

### 4. Launch Web Dashboard & REST API
```bash
# Terminal 1: Launch FastAPI
uvicorn api.main:app --host 127.0.0.1 --port 8000

# Terminal 2: Launch Streamlit Dashboard
streamlit run app/app.py
```

---

## 10. Project Directory Layout
```
AeroPure/
├── data/
│   └── AirQuality.csv
├── src/
│   ├── aqi.py
│   ├── preprocessing.py
│   ├── feature_engineering.py
│   ├── regression.py
│   ├── classification.py
│   ├── cross_validation.py
│   ├── evaluation.py
│   ├── explainability.py
│   ├── clustering.py
│   ├── drift.py
│   ├── model_registry.py
│   └── pipeline.py
├── notebooks/
│   ├── 01_EDA.ipynb
│   ├── 02_Preprocessing_AQI.ipynb
│   ├── 03_Linear_Ridge_Lasso.ipynb
│   ├── 04_Logistic_Regression.ipynb
│   ├── 05_Decision_Trees.ipynb
│   ├── 06_Random_Forest.ipynb
│   ├── 07_XGBoost_SHAP.ipynb
│   ├── 08_Clustering.ipynb
│   ├── 09_Rigorous_Evaluation.ipynb
│   └── 10_Drift_Analysis.ipynb
├── models/
│   ├── regression_model_v1.joblib
│   ├── classification_model_v1.joblib
│   ├── preprocessing_pipeline_v1.joblib
│   ├── clustering_pipeline_v1.joblib
│   └── model_registry.json
├── outputs/
│   ├── figures/
│   ├── metrics/
│   └── predictions/
├── api/
│   ├── main.py
│   ├── schemas.py
│   └── services.py
├── app/
│   └── app.py
├── tests/
│   ├── test_preprocessing.py
│   ├── test_aqi.py
│   ├── test_features.py
│   ├── test_models.py
│   ├── test_drift.py
│   └── test_api.py
├── requirements.txt
├── README.md
├── PROJECT_RESULTS.md
├── FINAL_PROJECT_REPORT.md
└── run_project.py
```
