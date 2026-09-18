> **Historical document (AeroPure v1.0.0).** The figures below were produced before the v2.0.0 data-integrity
> fixes (causal imputation, observed-only targets, purged splits, train/serve feature parity) and are
> **superseded by [README.md](README.md)**. They are kept for project history only.

# AeroPure — Comprehensive Machine Learning Project Results (Weeks 1–12)

**Project Name:** AeroPure  
**Tagline:** *“Tell a city when tomorrow's air turns dangerous.”*  
**Scope:** Complete Machine Learning Engineering Lifecycle (Weeks 1 to 12)  
**Dataset:** Real Archive 1 (`AirQuality.csv`, 9,357 hourly observations)  
**Primary Language & Frameworks:** Python 3.12, scikit-learn, XGBoost, SHAP, FastAPI, Streamlit, Pytest  

---

## 1. Executive Summary & Problem Formulation
Air pollution in urban centers triggers acute respiratory distress and elevated cardiovascular mortality. Conventional municipal reporting is retrospective: sensors measure current pollutant levels and issue alerts only after citizens have already been exposed. 

**AeroPure** transforms urban environmental monitoring into a **proactive 24-hour early warning system**. It formulates two core predictive tasks:
1. **Continuous Regression Task (`next_day_air_quality_index`):** Forecasts tomorrow's (+24h) continuous composite index proxy.
2. **Binary Classification Task (`hazardous_air_day`):** Detects whether tomorrow will exceed the project-defined elevated pollution threshold ($\ge 180.0$).
3. **Explainability & Governance:** Quantifies physical and meteorological drivers using SHAP, discovers latent atmospheric regimes with unsupervised clustering, evaluates generalizability with nested time-series cross-validation, and monitors covariate shift using the Population Stability Index (PSI).

---

## 2. Dataset Selection & Audit
Three candidate archives were audited on disk:
- **Archive 1 (`AirQuality.csv`):** 9,357 hourly observations spanning March 10, 2004 to April 4, 2005 (13 consecutive months). Contains ground-truth criteria gases (`CO(GT)`, `NO2(GT)`, `C6H6(GT)`, `NOx(GT)`), five metal-oxide chemical sensors (`PT08.S1` to `PT08.S5`), and meteorology (`Temperature`, `Relative Humidity`, `Absolute Humidity`). **Selected as the primary project dataset.**
- **Archive 2 (`data.csv`):** 435,742 rows across 304 Indian cities. Rejected because measurements are bi-weekly with 3–5 day gaps (destroying next-day contiguous forecasting), $PM_{2.5}$ is 97.8% missing (426,428 missing values), and no meteorological data exists.
- **Archive 3 (4 CSVs):** Annual national epidemiological health metrics (1990–2017). Rejected because annual global mortality data cannot predict hourly urban air quality.

**No-Merge Policy:** Merging continuous high-frequency Italian sensor arrays with Indian periodic manual filter readings or annual global health statistics is scientifically invalid due to differing geographical microclimates, sensor calibration physics, and sampling intervals. Original archive files remain intact.

---

## 3. Pollutant-Based AQI Proxy Methodology
Because Archive 1 lacks direct $PM_{2.5}$ and $PM_{10}$ readings, AeroPure strictly avoids falsely claiming official CPCB or US EPA AQI compliance. Instead, it defines a **Pollutant-Based Air Quality Index Proxy** using standard piecewise linear interpolation:

$$I_{pollutant} = \frac{I_{hi} - I_{lo}}{BP_{hi} - BP_{lo}} \times (C - BP_{lo}) + I_{lo}$$

$$current\_air\_quality\_index = \max\left(I_{CO}, I_{NO2}, I_{C6H6}\right)$$

- **No PM2.5 or PM10 values were fabricated or estimated.**
- **Target Alignment:** Constructed using explicit timestamp lookup: $\text{target}(t) = AQI_{proxy}(t + 24\text{ hours})$. Continuous 1-hour timestamp steps (9,356 intervals of 3,600s) guarantee exact 24-hour forward prediction with zero lookahead bias.
- **Hazardous Threshold:** $180.0$ represents the **75th percentile** of the real observational dataset (upper quartile capturing acute pollution episodes: 24.3% positive class prevalence).

---

## 4. Supervised Model Benchmark (Held-Out Test Set: 1,867 Samples)

### Regression Leaderboard (`next_day_air_quality_index`)
| Model | MAE | MSE | RMSE | $R^2$ | Architectural Role |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Linear Regression (OLS Baseline)** | 33.605 | 1882.371 | 43.386 | 0.3950 | Unregularized Week 3 baseline |
| **Ridge Regression ($\alpha=10.0$)** | 33.526 | 1852.828 | 43.044 | 0.4045 | $L_2$ shrinkage |
| **Lasso Regression ($\alpha=0.5$)** | 32.156 | 1725.420 | 41.538 | 0.4454 | $L_1$ feature selection |
| **Decision Tree Regressor ($depth=6$)** | 36.721 | 2391.627 | 48.904 | 0.2313 | Single non-linear tree |
| **Random Forest Regressor (150 trees)** | 32.405 | 1755.180 | 41.895 | 0.4358 | Bagged ensemble (OOB $R^2 = 0.671$) |
| **XGBoost Regressor (Champion)** | **30.855** | **1542.367** | **39.273** | **0.5042** | **Gradient boosted shallow trees (Lowest Error)** |

### Classification Leaderboard (`hazardous_air_day`)
| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC | PR-AUC | Balanced Acc | Brier Score |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** | 67.81% | 54.70% | 72.16% | 0.6223 | 0.7684 | 0.6802 | 68.72% | 0.2192 |
| **Decision Tree** | 67.27% | 54.09% | 72.30% | 0.6188 | 0.7682 | 0.6267 | 68.33% | 0.2324 |
| **Random Forest** | 74.29% | 62.50% | **75.07%** | 0.6821 | 0.8065 | 0.6789 | 74.45% | 0.1784 |
| **XGBoost Classifier (Champion)** | **75.04%** | **64.03%** | 73.18% | **0.6830** | **0.8243** | **0.7315** | **74.65%** | **0.1726** |

---

## 5. Unsupervised Pollution Regime Discovery (Week 9)
- **PCA Decomposition:** PC1 (56.91%), PC2 (19.69%), PC3 (10.69%) capture **87.28%** of total dataset variance across 13 criteria pollutant and meteorological variables.
- **K-Means Clustering ($k=3$):** Discovered three real, data-driven atmospheric regimes:
  1. **Cluster 0 — Moderate / Warm Photochemical Regime (36.0%, 3,360 hours):** Mean AQI Proxy = 122.47, Mean CO = 1.81 mg/m³, Mean T = 25.25°C, Mean RH = 41.95%.
  2. **Cluster 1 — Low Pollution / Clean Dispersion Regime (39.1%, 3,650 hours):** Mean AQI Proxy = 108.36, Mean CO = 1.17 mg/m³, Mean T = 12.91°C, Mean RH = 52.88%.
  3. **Cluster 2 — Severe Stagnant Inversion / High Emission Regime (24.9%, 2,323 hours):** Mean AQI Proxy = 215.61, Mean CO = 3.92 mg/m³, Mean NOx = 499.7 ppb, Mean T = 16.79°C, Mean RH = 52.47%.
- **DBSCAN Density Clustering:** Identified 1 dense continuous manifold and 69 anomalous noise/spike points (0.74%).
- **Supervised Integration Impact:** Adding cluster regime indicators at observation time $t$ reduced out-of-sample test RMSE from **39.068 to 38.324** (an improvement of **-0.744 points**, boosting $R^2$ to **0.5279**), proving empirical value.

---

## 6. Rigorous Evaluation & Statistical Validation (Week 10)
- **Nested Time-Series Cross-Validation:** 5 outer folds (evaluating generalizability) and 3 inner folds (hyperparameter tuning strictly on past windows):
  - Overall Nested CV Mean: $\text{RMSE} = 43.008 \pm 10.08$, $\text{MAE} = 32.747 \pm 8.72$, $R^2 = 0.4337 \pm 0.102$.
- **Probability Calibration & Reliability:**
  - Raw XGBoost achieves a Brier Score of **0.1726** and $ROC\text{-}AUC = 0.8243$.
  - Probability calibration was evaluated using Brier score and reliability analysis. Post-hoc Platt scaling did not improve the held-out Brier score (0.1726 raw vs 0.2076 calibrated), so raw XGBoost probability estimates were retained.
- **Statistical Significance Tests (Wilcoxon Signed-Rank on Test Absolute Residuals):**
  - **XGBoost vs OLS:** Stat = 768,927.0, $p = 9.89 \times 10^{-6}$ ($p < 0.001$, Statistically Significant difference in error distributions).
  - **XGBoost vs Ridge:** Stat = 763,578.0, $p = 3.33 \times 10^{-6}$ ($p < 0.001$, Statistically Significant difference in error distributions).
  - **XGBoost vs Random Forest:** Stat = 795,941.0, $p = 1.11 \times 10^{-3}$ ($p < 0.01$, Statistically Significant difference in error distributions).

---

## 7. Production Drift Monitoring & Governance (Week 11)
- **Population Stability Index (PSI):** Evaluated between baseline training distributions (Spring/Summer 2004) and incoming test telemetry (Winter 2005):
  - `CO(GT)`: $PSI = 0.0468$ (Stable)
  - `RH`: $PSI = 0.0413$ (Stable)
  - `C6H6(GT)`: $PSI = 0.2374$ (Monitor)
  - `current_air_quality_index`: $PSI = 0.3760$ (Significant Drift)
  - `NO2(GT)`: $PSI = 0.6939$ (Significant Drift)
  - `T`: $PSI = 2.2805$ (Significant Drift)
  - **Overall Drift Status:** `Significant Drift` (Mean PSI = 0.6598).
- **Retraining Safeguard:** Significant winter thermal shifts trigger an automated human-in-the-loop review alert rather than unsupervised model overwrite.

---

## 8. Deployment & Delivery (Week 12)
- **FastAPI Microservice (`api/main.py`):**
  - `GET /health`: Component operational check (status: 'healthy').
  - `GET /metrics`: Model version (`1.0.0`), test metrics, and inference latency.
  - `POST /predict`: Real-time next-day AQI proxy forecast, hazard probability, and regime.
  - `POST /explain`: Directional top positive and negative feature contributors.
  - `GET /drift`: PSI drift metrics and retraining alert status.
  - **Feature Construction Contract:** For isolated single-point requests, concurrent pollutants and sensors are overridden directly, while unobserved historical 1h–48h lags and rolling features use empirical baseline training medians as an imputation anchor.
- **Streamlit Web Dashboard (`app/app.py`):**
  - 7 interactive tabs: Tomorrow's Forecast, Pollution Regimes, Leaderboard Benchmark, AI Explainability (SHAP), Live What-If Simulator (sensitivity scenario exploration, non-causal), Drift Governance, and Historical EDA.
- **Unit Test Suite (`tests/`):** 20 comprehensive unit tests passing cleanly across preprocessing, AQI proxy logic, features, model inference, drift detection, and API endpoints.
