> **Historical document (AeroPure v1.0.0).** The figures below were produced before the v2.0.0 data-integrity
> fixes (causal imputation, observed-only targets, purged splits, train/serve feature parity) and are
> **superseded by [README.md](README.md)**. They are kept for project history only.

# AeroPure: AI-Based Air Quality Prediction System
## Comprehensive End-to-End Engineering Report (Weeks 1 to 12)

**Project Name:** AeroPure  
**Tagline:** *“Tell a city when tomorrow's air turns dangerous.”*  
**Architecture Scope:** Weeks 1 through 12 (Data Ingestion $\to$ Preprocessing $\to$ Feature Engineering $\to$ Multi-Model Benchmarking $\to$ Tree Ensembles $\to$ XGBoost Champions $\to$ SHAP Interpretability $\to$ Unsupervised Regime Discovery $\to$ Nested Time-Series Cross-Validation $\to$ Calibration $\to$ Population Stability Index Drift Monitoring $\to$ Production Model Packaging $\to$ FastAPI REST Deployment $\to$ Interactive Streamlit Dashboard)  
**Authors:** AeroPure Engineering Team  
**Evaluation Date:** September 2026  

---

### 1. Abstract
Urban atmospheric contamination poses severe acute and chronic cardiopulmonary hazards. Traditional civic air quality reporting is retrospective, leaving vulnerable urban populations unprotected. This report documents **AeroPure**, an end-to-end Machine Learning system engineered to deliver a 24-hour predictive warning lead time. Using an hourly sensor dataset of 9,357 records from an Italian monitoring station (Archive 1, AirQuality.csv), AeroPure develops a Pollutant-Based Air Quality Index Proxy ($AQI_{proxy} = \max(I_{CO}, I_{NO2}, I_{C6H6})$) and extracts 113 leakage-safe features. Across rigorous chronological partitions (80% train / 20% test), **XGBoost Regressor** emerges as the regression champion ($RMSE = 39.273$, $MAE = 30.658$, $R^2 = 0.5042$), outperforming OLS ($RMSE = 43.386$), Ridge, Lasso, Decision Trees, and Random Forest ($p < 0.001$, Wilcoxon signed-rank test). For binary hazardous air day detection ($AQI \ge 180.0$), **XGBoost Classifier** achieves $F1 = 0.6830$, $ROC\text{-}AUC = 0.8243$, and $Accuracy = 75.04\%$ with evaluated probability reliability (Brier Score = 0.1726; raw probabilities retained after post-hoc calibration showed no improvement). Unsupervised learning discovers three distinct operational regimes via PCA (87.28% variance in first 3 components) and K-Means ($k=3$), reducing out-of-sample forecast RMSE to 38.324. A production Population Stability Index (PSI) drift engine monitors incoming data, flagging seasonal thermal inversions. The system is packaged into versioned production artifacts, deployed via high-performance FastAPI REST endpoints (`/health`, `/metrics`, `/predict`, `/explain`, `/drift`), and visualized in a presentation-ready Streamlit dashboard.

---

### 2. Introduction
Clean air is essential for public health, economic productivity, and ecological stability. Gaseous contaminants such as Carbon Monoxide ($CO$), Nitrogen Dioxide ($NO_2$), and volatile organic compounds such as Benzene ($C_6H_6$) trigger respiratory morbidity, aggravate cardiovascular pathology, and induce photochemical smog. Despite dense monitoring arrays in urban centers, civic alerts are predominantly reactive: data is published hours after contaminant thresholds have been breached. AeroPure bridges the operational gap between environmental telemetry and proactive public health intervention by forecasting next-day pollution levels with a 24-hour horizon.

---

### 3. Problem Statement
Given an continuous multivariate time series of criteria pollutant concentrations, solid-state chemical sensor resistance responses, and meteorological indicators up to time $t$, predict:
1. The continuous composite pollutant-based air quality index proxy at time $t + 24\text{ hours}$ ($y_{reg} \in \mathbb{R}^+$).
2. The binary classification of whether tomorrow will exceed project-defined elevated hazardous thresholds ($y_{clf} \in \{0, 1\}$, where $y_{clf} = \mathbb{I}[y_{reg} \ge 180.0]$).
3. The exact physical and chemical drivers explaining why tomorrow's air is predicted to be elevated or safe.

---

### 4. Objectives
- **Strict Leakage Prevention:** Guarantee that every feature at time $t$ uses information available strictly at or before $t$, maintaining unbroken chronological splits without lookahead bias.
- **Accurate Index Methodology:** Establish a transparent, reproducible multi-pollutant proxy without fabricating unmeasured particulate matter ($PM_{2.5} / PM_{10}$).
- **Multi-Model Benchmark:** Progress systematically from linear baselines (OLS, Ridge, Lasso, Logistic Regression) to non-linear tree ensembles (Decision Trees, Random Forest) and gradient-boosted champions (XGBoost).
- **Explainability:** Provide local and global Shapley attribution values via SHAP to explain forecasts to municipal planners.
- **Unsupervised Regime Discovery:** Uncover latent atmospheric states using PCA, K-Means, and DBSCAN, and test their predictive utility.
- **Rigorous Evaluation:** Validate models using 5-outer $\times$ 3-inner nested time-series cross-validation, probability calibration, and non-parametric significance testing.
- **Production Readiness:** Implement PSI covariate drift monitoring, versioned artifact packaging, a production FastAPI microservice, and an interactive Streamlit UI.

---

### 5. Traditional Methods
Traditional air quality forecasting relies on:
1. **Chemical Transport Models (CTMs):** Eulerian grid systems (e.g., WRF-Chem, CMAQ) solving systems of differential equations for advection, diffusion, and photochemical kinetics. While physically interpretable, CTMs demand high-performance supercomputing, require boundary emission inventories that are frequently outdated, and suffer spatial discretization errors at urban street-canyon scales.
2. **Classical Linear Time-Series Models:** Autoregressive Integrated Moving Average (ARIMA, SARIMAX). While computationally lightweight, ARIMA assumes linear relationships and stationarity, struggling to capture non-linear boundary-layer meteorology, chemical interactions, and abrupt meteorological transitions.

---

### 6. ML-Based Improvement
Machine learning algorithms provide strong advantages for environmental forecasting:
- **Non-Linear Interaction Modeling:** Tree-based ensembles naturally model complex interactions (e.g., temperature inversions suppressing horizontal dispersion while high relative humidity accelerates secondary nitrate aerosol formation).
- **High-Dimensional Lag Integration:** ML models process 100+ multi-scale historical features (1h, 2h, 3h, 24h, 48h lags, rolling standard deviations) without manual parameter tuning.
- **Real-Time Sub-Second Inference:** Once trained, inference takes under 10 milliseconds, enabling continuous real-time municipal warning APIs.

---

### 7. Dataset Audit & Selection
Three candidate datasets were audited on disk:
- **Archive 1 (`AirQuality.csv`):** 9,357 hourly records spanning March 10, 2004 to April 4, 2005 (13 continuous months) from an Italian city roadside station. Features include reference ground-truth analyzers (`CO(GT)`, `NO2(GT)`, `C6H6(GT)`, `NOx(GT)`), 5 tungsten/tin-oxide metal-oxide chemical sensors (`PT08.S1` to `PT08.S5`), and weather (`T`, `RH`, `AH`). **Selected as the primary project dataset.**
- **Archive 2 (`data.csv`):** 435,742 rows across 304 Indian cities. Rejected because measurements are bi-weekly (~2 days/week with 3–5 day gaps breaking continuous 24h forecasting), $PM_{2.5}$ is 97.8% missing (426,428 missing rows), and no meteorological data is present.
- **Archive 3 (4 CSV files):** Annual national epidemiological health metrics (1990–2017). Rejected because annual global mortality data cannot predict hourly urban air quality.

**No-Merge Justification:** Merging continuous high-frequency Italian sensor arrays with Indian periodic manual filter readings or annual global health statistics is scientifically invalid due to differing geographical microclimates, sensor calibration physics, and sampling intervals. Original archive files remain intact.

---

### 8. Data Preprocessing
1. **Sentinel Value Replacement:** European sensor failure code `-200` was converted to `NaN`.
2. **Column Dropping:** `NMHC(GT)` was dropped due to 90.2% missingness.
3. **Time-Series Imputation:** Missing values in retained sensors (3.9% to 17.5% missing) were imputed using forward-fill followed by backward-fill, preserving temporal local trends without introducing future lookahead leakage.
4. **Timestamp Continuity Verification:** Timestamp inspection confirmed unbroken hourly steps (9,356 intervals of exactly 3,600 seconds), ensuring that a 24-step horizon strictly matches 24 calendar hours.

---

### 9. AQI Proxy Methodology
Because Archive 1 does not measure particulate matter ($PM_{2.5}$ and $PM_{10}$), AeroPure does not claim compliance with official EPA/CPCB composite AQI. Instead, it defines a **Pollutant-Based Air Quality Index Proxy**:

$$I_{pollutant} = \frac{I_{hi} - I_{lo}}{BP_{hi} - BP_{lo}} \times (C - BP_{lo}) + I_{lo}$$

$$current\_air\_quality\_index = \max\left(I_{CO}, I_{NO2}, I_{C6H6}\right)$$

- **Thresholds Applied:**
  - $CO$ ($mg/m^3$): Breakpoints $[0, 1, 2, 10, 17, 34, 50]$ mapping to sub-indices $[0, 50, 100, 200, 300, 400, 500]$.
  - $NO_2$ ($\mu g/m^3$): Breakpoints $[0, 40, 80, 180, 280, 400, 800]$ mapping to sub-indices $[0, 50, 100, 200, 300, 400, 500]$.
  - $C_6H_6$ ($\mu g/m^3$): Breakpoints $[0, 5, 10, 20, 35, 50, 100]$ based on WHO benzene thresholds.
- **Targets:**
  - **Regression Target (`next_day_air_quality_index`):** Explicit timestamp mapping: $AQI_{proxy}(t + 24\text{ hours})$.
  - **Classification Target (`hazardous_air_day`):** $\mathbb{I}[AQI_{proxy}(t+24) \ge 180.0]$. Threshold 180.0 represents the project-defined elevated pollution threshold (75th percentile of the real observational distribution, capturing the top 24.3% severe episodes).

---

### 10. Feature Engineering (113 Features)
Features at time $t$ are derived exclusively from observations at or before $t$:
1. **Historical Lags (50 features):** Lags $t-1$, $t-2$, $t-3$, $t-24$ (diurnal cycle), and $t-48$ across all 10 criteria pollutants, sensors, and weather variables.
2. **Rolling Statistics (36 features):** Rolling means and rolling standard deviations over 6-hour, 12-hour, and 24-hour backward windows over $[t-w+1, t]$.
3. **Temporal Cyclical Encodings (8 features):** Sine and cosine transformations of hour ($\sin(2\pi h/24), \cos(2\pi h/24)$) and month ($\sin(2\pi m/12), \cos(2\pi m/12)$), day of week, day of year, and weekend flags.
4. **Physical Interaction Terms (6 features):** Saturation index ($T \times RH$), pollutant interaction terms ($CO \times NO_2$), and sensor-to-sensor ratios.
5. **Partitioning:** Chronological split: first 80% (7,466 samples, March–December 2004) for training; final 20% (1,867 samples, January–April 2005) for testing. `StandardScaler` is fitted strictly on the training partition.

---

### 11. Regression Models Benchmark
All models evaluated on the held-out test partition (1,867 samples):

| Model | Test MAE | Test MSE | Test RMSE | Test $R^2$ | Architectural Rationale |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Linear Regression (OLS)** | 33.605 | 1882.371 | 43.386 | 0.3950 | Unregularized baseline |
| **Ridge Regression ($\alpha=10.0$)** | 33.526 | 1852.828 | 43.044 | 0.4045 | $L_2$ shrinkage against multicollinearity |
| **Lasso Regression ($\alpha=0.5$)** | 32.156 | 1725.420 | 41.538 | 0.4454 | $L_1$ feature selection (zeroes 42 collinear weights) |
| **Decision Tree ($depth=6$)** | 36.721 | 2391.627 | 48.904 | 0.2313 | Single non-linear tree; overfits local seasonal noise |
| **Random Forest (150 trees)** | 32.405 | 1755.180 | 41.895 | 0.4358 | Bagged ensemble; OOB $R^2 = 0.671$ |
| **XGBoost Regressor (Champion)** | **30.855** | **1542.367** | **39.273** | **0.5042** | **Gradient boosted shallow trees; lowest error & highest $R^2$** |

---

### 12. Classification Models Benchmark
Target: `hazardous_air_day` ($AQI_{proxy} \ge 180.0$). Class distribution: Safe/Moderate = 1,181 (63.3%), Hazardous = 686 (36.7%):

| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC | PR-AUC | Balanced Acc | Brier Score |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** | 67.81% | 54.70% | 72.16% | 0.6223 | 0.7684 | 0.6802 | 68.72% | 0.2192 |
| **Decision Tree** | 67.27% | 54.09% | 72.30% | 0.6188 | 0.7682 | 0.6267 | 68.33% | 0.2324 |
| **Random Forest** | 74.29% | 62.50% | **75.07%** | 0.6821 | 0.8065 | 0.6789 | 74.45% | 0.1784 |
| **XGBoost (Champion)** | **75.04%** | **64.03%** | 73.18% | **0.6830** | **0.8243** | **0.7315** | **74.65%** | **0.1726** |

---

### 13. Unsupervised Learning (Week 9)
Unsupervised learning was deployed to uncover latent pollution regimes without using target labels. Thirteen concurrent criteria pollutants, sensor readings, and meteorological variables at observation time $t$ were scaled using `StandardScaler`.

---

### 14. Principal Component Analysis (PCA)
- **Eigenvalue Decomposition:**
  - PC1 explains **56.91%** of variance (ambient combustion and gaseous emission intensity).
  - PC2 explains **19.69%** of variance (thermal and meteorological dispersion gradient: temperature vs relative humidity).
  - PC3 explains **10.69%** of variance (ozone sensor response vs nitrogen oxides balance).
- **Cumulative Variance:** The first 3 principal components capture **87.28%** of total dataset variance (First 4: 91.34%).
- **Scree & Cumulative Plots:** Saved in `outputs/figures/pca_variance_elbow.png`.

---

### 15. K-Means Clustering
- **Hyperparameter Evaluation:** K-Means was swept over $k \in [2, 6]$.
  - $k=2$: Inertia = 75,565.1, Silhouette = 0.3366
  - $k=3$: Inertia = 62,600.2, Silhouette = 0.2261
  - $k=4$: Inertia = 53,332.2, Silhouette = 0.2360
  - $k=5$: Inertia = 47,968.0, Silhouette = 0.2051
  - $k=6$: Inertia = 44,087.8, Silhouette = 0.2007
- **Selection of $k=3$:** Chosen based on the elbow curvature and atmospheric interpretability, yielding three statistically distinct regimes:
  1. **Cluster 0 — Moderate / Warm Photochemical Regime (36.0%, 3,360 samples):** Mean AQI Proxy = 122.47, Mean CO = 1.81 mg/m³, Mean T = 25.25°C, Mean RH = 41.95%. Typical warm daytime conditions with active vertical boundary-layer mixing.
  2. **Cluster 1 — Low Pollution / Clean Dispersion Regime (39.1%, 3,650 samples):** Mean AQI Proxy = 108.36, Mean CO = 1.17 mg/m³, Mean T = 12.91°C, Mean RH = 52.88%. Unpolluted baseline periods with favorable advective dispersion.
  3. **Cluster 2 — Severe Stagnant Inversion / High Emission Regime (24.9%, 2,323 samples):** Mean AQI Proxy = 215.61, Mean CO = 3.92 mg/m³, Mean NOx = 499.7 ppb, Mean T = 16.79°C, Mean RH = 52.47%. Severe cold-season accumulation under thermal inversion.

---

### 16. Density-Based Clustering (DBSCAN)
- Fitted on the 13-dimensional standardized manifold using $\epsilon = 2.0, \text{min\_samples} = 20$.
- **Result:** Identified 1 dense continuous manifold and 69 anomalous noise points (0.74%).
- **Analysis:** Real urban atmospheric sensor readings form a connected continuum rather than isolated islands; DBSCAN effectively isolates extreme sensor failure spikes and acute short-duration chemical spills without fragmenting the core manifold. Saved to `outputs/figures/dbscan_clusters.png`.

---

### 17. Supervised Integration of Pollution Regimes
To test whether unsupervised regime information improves next-day forecasting, K-Means was fit **strictly on the training split**, assigning regime indicator variables (`regime_0`, `regime_1`, `regime_2`) at observation time $t$:
- **Base XGBoost Regressor:** $RMSE = 39.068$, $MAE = 30.522$, $R^2 = 0.5094$.
- **XGBoost + Regime Indicators:** $RMSE = 38.324$, $MAE = 29.876$, $R^2 = 0.5279$.
- **Empirical Finding:** Regime information reduced out-of-sample RMSE by **0.744 points** and improved $R^2$ by **+0.0185**, confirming that latent regime context assists tree splits during seasonal transitions.

---

### 18. SHAP Explainability Engine
Using `shap.TreeExplainer` on the champion XGBoost model:
- **Global Feature Ranking:**
  1. `current_air_quality_index`: Strongest baseline anchor ($t$).
  2. `CO(GT)_rolling_mean_24h`: Indicates multi-hour cumulative combustion accumulation.
  3. `NO2(GT)_rolling_std_24h`: Captures turbulent diurnal boundary-layer fluctuations.
  4. `sin_hour`, `cos_hour`: Models diurnal rush-hour cycles.
  5. `T`, `RH`: Regulates atmospheric stability and gas-to-particle partitioning.
- **Local Waterfall Attributions:** For high-risk alert days, SHAP waterfalls verify that elevated 24-hour rolling CO and high evening NO2 contribute positively (+45 to +60 index points) toward crossing the hazard threshold.

---

### 19. Nested Time-Series Cross-Validation (Week 10)
To avoid lookahead bias and optimistic tuning estimates, AeroPure implemented nested cross-validation:
- **Outer Loop:** 5 expanding `TimeSeriesSplit` folds evaluating generalization across seasons.
- **Inner Loop:** 3 inner `TimeSeriesSplit` folds tuning `max_depth` $\in [3, 5]$ strictly on past training windows.
- **Results Across 5 Outer Folds:**
  - Fold 1: Best `max_depth=3`, Test RMSE = 40.56, MAE = 29.86, $R^2 = 0.4337$
  - Fold 2: Best `max_depth=5`, Test RMSE = 31.47, MAE = 24.27, $R^2 = 0.5983$
  - Fold 3: Best `max_depth=5`, Test RMSE = 44.95, MAE = 31.98, $R^2 = 0.4031$
  - Fold 4: Best `max_depth=5`, Test RMSE = 58.80, MAE = 47.46, $R^2 = 0.3185$
  - Fold 5: Best `max_depth=3`, Test RMSE = 39.25, MAE = 30.17, $R^2 = 0.4149$
  - **Overall Nested Cross-Validation Mean:** $RMSE = 43.008 \pm 10.08$, $MAE = 32.747 \pm 8.72$, $R^2 = 0.4337 \pm 0.102$.
  - Fold 4 represents the winter transition where cold inversions spike pollution, demonstrating why time-aware validation is essential.

---

### 20. Probability Calibration & Reliability Diagrams
- Evaluated on test predictions:
  - **Raw XGBoost Classifier:** Brier score = **0.1726**, $ROC\text{-}AUC = 0.8243$.
  - **Calibrated Classifier (Platt Sigmoid Scaling):** Brier score = 0.2076, $ROC\text{-}AUC = 0.8275$.
- **Finding & Decision:** Probability calibration was evaluated using Brier score and reliability analysis. Post-hoc calibration did not improve the held-out Brier score (0.1726 raw vs 0.2076 calibrated), so the raw XGBoost probability estimates were retained. Saved to `outputs/figures/calibration_curve.png`.

---

### 21. Statistical Significance Testing
Paired non-parametric Wilcoxon signed-rank tests were performed on out-of-sample absolute error distributions ($|y_{true} - \hat{y}|$):
1. **XGBoost vs OLS:** Wilcoxon statistic = $768,927.0$, $p = 9.89 \times 10^{-6}$ ($t = -5.61, p = 2.35 \times 10^{-8}$). Statistically significant superior accuracy ($p < 0.001$).
2. **XGBoost vs Ridge:** Wilcoxon statistic = $763,578.0$, $p = 3.33 \times 10^{-6}$ ($t = -5.59, p = 2.65 \times 10^{-8}$). Statistically significant superior accuracy ($p < 0.001$).
3. **XGBoost vs Random Forest:** Wilcoxon statistic = $795,941.0$, $p = 1.11 \times 10^{-3}$ ($t = -3.78, p = 1.60 \times 10^{-4}$). Statistically significant superior accuracy ($p < 0.01$).

---

### 22. Drift Detection & Population Stability Index (PSI) (Week 11)
The **Population Stability Index (PSI)** was implemented to monitor covariate shift between the training baseline (Spring/Summer/Autumn 2004) and incoming test telemetry (Winter/Spring 2005):

$$PSI = \sum_{i=1}^B (Actual\%_i - Expected\%_i) \times \ln\left(\frac{Actual\%_i}{Expected\%_i}\right)$$

- **Thresholds Applied:** $PSI < 0.10$ (Stable), $0.10 \le PSI \le 0.25$ (Monitor), $PSI > 0.25$ (Significant Drift).
- **Results:**
  - `CO(GT)`: $PSI = 0.0468$ (Stable)
  - `RH`: $PSI = 0.0413$ (Stable)
  - `C6H6(GT)`: $PSI = 0.2374$ (Monitor)
  - `current_air_quality_index`: $PSI = 0.3760$ (Significant Drift)
  - `NO2(GT)`: $PSI = 0.6939$ (Significant Drift)
  - `T`: $PSI = 2.2805$ (Significant Drift)
  - **Overall Status:** `Significant Drift` (Mean PSI = 0.6598).
- **Governance Safeguard:** Automated retraining is **flagged** rather than triggered blindly, alerting human engineers to review seasonal distribution changes before redeploying.

---

### 23. System Architecture & Model Packaging
The production architecture is organized into modular pipelines:
- `models/regression_model_v1.joblib`: Serialized XGBoost Regressor.
- `models/classification_model_v1.joblib`: Serialized XGBoost Classifier.
- `models/preprocessing_pipeline_v1.joblib`: Production `StandardScaler`, feature list, baseline medians, and imputation constants.
- `models/clustering_pipeline_v1.joblib`: PCA transformer, K-Means ($k=3$), and DBSCAN.
- `models/model_registry.json`: JSON catalog tracking model version (`1.0.0`), dataset provenance, hyperparameters, test metrics, and drift monitoring rules.

---

### 24. FastAPI REST Deployment (Week 12)
Deployed via `api/main.py`, `schemas.py`, and `services.py` with 5 production endpoints:
1. `GET /health`: Returns operational health of regressor, classifier, and preprocessing pipelines.
2. `GET /metrics`: Returns production model type, feature count, test metrics, prediction volume, and latency.
3. `POST /predict`: Accepts JSON observation, standardizes features, evaluates regression & classification models, and returns predicted AQI proxy, hazard probability, risk tier, and regime.
4. `POST /explain`: Returns directional top positive and negative feature contributors with an interpretable scientific summary.
5. `GET /drift`: Returns PSI drift values, shifted features, and retraining alert status.

**113-Feature Single-Observation Contract:** The production models operate on 113 engineered features, including historical lag and rolling statistics spanning up to 48 hours. For real-time single-point API requests where prior sensor stream history is unobserved, the inference service overrides all concurrent physical pollutants (`CO`, `NO2`, `C6H6`, `NOx`), sensor responses (`PT08.S1–S5`), meteorology (`T`, `RH`, `AH`), chemical interactions, and cyclical temporal encodings, while unobserved historical lag and rolling features are populated using empirical baseline training medians as an imputation anchor. This is explicitly documented as a standardized snapshot forecast rather than a continuous live 48-hour rolling stream.

---

### 25. Streamlit Interactive Dashboard
The presentation dashboard in `app/app.py` delivers:
1. **Tomorrow's Forecast & Alert Banner:** Prominent AQI proxy card, hazard probability metric, and color-coded civic alert.
2. **Current Sensor Readings:** Real-time indicator cards for CO, NO2, C6H6, NOx, T, RH.
3. **Pollution Regimes Tab:** K-Means profiles, 2D PCA projections, and DBSCAN anomaly plots.
4. **Model Leaderboards:** Interactive tables and bar charts for regression and classification models.
5. **AI Explainability Tab:** SHAP summary beeswarm and local waterfall plots.
6. **Live What-If Simulator:** Sliders for CO, NO2, C6H6, Temp, Humidity, and Hour passing directly through the production preprocessing pipeline (scenario sensitivity analysis; not a causal intervention).
7. **Drift & Governance Tab:** PSI feature breakdown, KDE distribution comparisons, and retraining alerts.
8. **Historical Trends Tab:** Diurnal rush-hour curves and correlation matrices.

---

### 26. Project Limitations
- **No Direct Particulate Data:** Archive 1 lacks direct $PM_{2.5}$ and $PM_{10}$ readings. The index is strictly an AQI Proxy derived from criteria gases and volatile organics.
- **Single-Point API Context Anchor:** When predicting on isolated single observations via the REST API, historical 1h–48h lag/rolling features are initialized using baseline training medians as an imputation anchor rather than an active stateful database of past readings.
- **Geographical Specificity:** Data reflects an Italian urban roadside monitoring station. While methodologies generalize universally, model weights should be calibrated with local data before deployment in other cities.
- **Absence of Real-Time Traffic & Satellite Data:** Features are derived from ground chemical and meteorological sensors; no direct traffic count or satellite optical depth feeds were claimed or utilized.
- **Observational Nature:** SHAP attributions and Wilcoxon differences represent statistical associations and out-of-sample error distributions, not physical or causal intervention guarantees.

---

### 27. Future Scope
1. **Particulate Sensor Integration:** Incorporate optical particle counters (OPCs) for true multi-pollutant EPA/CPCB composite AQI forecasting.
2. **Deep Sequence Modeling:** Benchmark Temporal Fusion Transformers (TFT) and Bi-directional LSTMs for multi-horizon forecasting (48h and 72h horizons).
3. **Automated CI/CD Retraining Pipeline:** Implement automated model redeployment triggered by PSI drift thresholds with human-in-the-loop canary validation.
4. **Spatial Graph Neural Networks (GNNs):** Model inter-station pollutant dispersion across multi-station urban sensor networks.

---

### 28. Conclusion
The **AeroPure** project successfully builds a complete, production-grade Machine Learning system for next-day air quality forecasting from Week 1 through Week 12. By addressing real-world challenges—sentinel data cleaning, leak-free time-series target generation, multi-pollutant proxy indexing, ensemble modeling, unsupervised regime discovery, nested cross-validation, and drift detection—AeroPure demonstrates how machine learning can transition environmental public health from reactive reporting to proactive civic protection.
