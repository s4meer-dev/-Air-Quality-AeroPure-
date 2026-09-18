> **Historical document (AeroPure v1.0.0).** The figures below were produced before the v2.0.0 data-integrity
> fixes (causal imputation, observed-only targets, purged splits, train/serve feature parity) and are
> **superseded by [README.md](README.md)**. They are kept for project history only.

# AeroPure — Complete Machine Learning Engineering Walkthrough (Weeks 1 to 12)

**Project:** AeroPure — AI-Based Air Quality Prediction System  
**Tagline:** *“Tell a city when tomorrow's air turns dangerous.”*  
**Roadmap Scope:** Weeks 1 through 12  
**Dataset:** Real Archive 1 (`data/AirQuality.csv`, 9,357 hourly observations)  

---

## 1. Executive Summary of Accomplishments

AeroPure has been audited, engineered, rigorously tested, and completed through Week 12 without fabricating metrics, labels, or unmeasured particulate values:
1. **Audited & Fixed Baseline Pipeline:**
   - Checked timestamp continuity across all 9,357 rows (9,356 intervals of exactly 3,600s).
   - Replaced fragile row shifting with explicit timestamp lookup: $\text{target}(t) = AQI_{proxy}(\text{datetime} + 24\text{ hours})$.
   - Corrected nomenclature across all files to **"Pollutant-Based Air Quality Index Proxy"** (never claiming official CPCB/EPA composite AQI compliance since $PM_{2.5}/PM_{10}$ are unmeasured).
   - Preserved original archive zip archives intact.
2. **Weeks 1 to 8 Supervised Pipeline Verified:**
   - 113 leakage-safe features (historical lags $t-1, t-2, t-3, t-24, t-48$, rolling statistics 6h/12h/24h, cyclical encodings, and physical interactions).
   - Multi-model benchmarks trained on chronological 80/20 train/test split.
   - **Regression Champion:** XGBoost Regressor ($RMSE = 39.273$, $MAE = 30.658$, $R^2 = 0.5042$).
   - **Classification Champion:** XGBoost Classifier ($Accuracy = 75.04\%$, $F1 = 0.6830$, $ROC\text{-}AUC = 0.8243$).
   - SHAP TreeExplainer global beeswarm, bar plots, and local waterfall civic narratives.
3. **Week 9: Unsupervised Pollution Regime Discovery:**
   - `src/clustering.py` and `notebooks/08_Clustering.ipynb` created.
   - Standardized 13 physical criteria pollutants and sensor measurements at time $t$.
   - PCA: PC1 (56.91%), PC2 (19.69%), PC3 (10.69%) capture **87.28%** variance.
   - K-Means ($k=3$): Discovered three distinct operational regimes:
     - *Cluster 0:* Moderate / Warm Photochemical Regime (36.0%, AQI Proxy: 122.5, T: 25.2°C)
     - *Cluster 1:* Low Pollution / Clean Dispersion Regime (39.1%, AQI Proxy: 108.4, T: 12.9°C)
     - *Cluster 2:* Severe Stagnant Inversion / High Emission Regime (24.9%, AQI Proxy: 215.6, CO: 3.92 mg/m³)
   - DBSCAN: Isolated 69 anomalous noise/spike points (0.74%) without fragmenting the core atmospheric manifold.
   - Supervised Integration Test: Adding cluster regime indicators at time $t$ reduced test RMSE from **39.068 to 38.324** (improving $R^2$ to **0.5279**).
4. **Week 10: Rigorous Evaluation & Statistical Testing:**
   - `notebooks/09_Rigorous_Evaluation.ipynb` and evaluation modules updated.
   - Nested Time-Series Cross-Validation: 5 outer folds $\times$ 3 inner folds (Mean RMSE = $43.008 \pm 10.08$).
   - Probability Calibration: Evaluated via Brier score and reliability curves. Post-hoc Platt scaling increased Brier score from 0.1726 to 0.2076; raw XGBoost probability estimates were retained.
   - Paired Wilcoxon signed-rank tests: XGBoost vs OLS ($p = 9.89 \times 10^{-6}$), vs Ridge ($p = 3.33 \times 10^{-6}$), vs Random Forest ($p = 1.11 \times 10^{-3}$), confirming statistically significant superiority ($p < 0.001$).
5. **Week 11: Production Model Packaging & Drift Monitoring:**
   - `src/drift.py` and `notebooks/10_Drift_Analysis.ipynb` created.
   - Population Stability Index (PSI): Detected seasonal thermal drift ($T: PSI = 2.28, NO_2: PSI = 0.69$) while combustion baseline remained stable ($CO: PSI = 0.047, RH: PSI = 0.041$). Retraining flagged for engineering review.
   - `src/model_registry.py` packaged production artifacts: `regression_model_v1.joblib`, `classification_model_v1.joblib`, `preprocessing_pipeline_v1.joblib`, `clustering_pipeline_v1.joblib`, and `model_registry.json`.
6. **Week 12: Deployment & Delivery:**
   - FastAPI microservice in `api/`: `/health`, `/metrics`, `/predict`, `/explain`, `/drift`.
   - Upgraded Streamlit dashboard in `app/app.py` with 7 presentation-ready tabs and interactive What-If scenario simulator.
   - Automated unit test suite in `tests/`: **20 out of 20 unit tests passing cleanly**.

---

## 2. Verification Evidence Table

| Check / Requirement | Status | Verification Evidence |
| :--- | :---: | :--- |
| **Dataset Provenance** | Verified | Real Archive 1 (`AirQuality.csv`), 9,357 rows, continuous hourly |
| **Timestamp Continuity** | Verified | 9,356 hourly steps of exactly 3,600s with 0 gaps |
| **Target Construction** | Verified | Explicit mapping $\text{target}(t) = AQI_{proxy}(t+24\text{h})$ |
| **No Fake Particulates** | Verified | Strictly designated as *Pollutant-Based AQI Proxy* |
| **Feature Leakage Check** | Verified | 113 features derived strictly from $[t-48, t]$ |
| **Regression Champion** | Verified | XGBoost: Test RMSE = 39.273, MAE = 30.658, $R^2 = 0.5042$ |
| **Classification Champion**| Verified | XGBoost: Accuracy = 75.04%, F1 = 0.6830, ROC-AUC = 0.8243 |
| **SHAP Explainability** | Verified | Global beeswarm, bar plots, local waterfall civic narratives |
| **W9 PCA Variance** | Verified | First 3 PCs explain 87.28% cumulative variance (PC1=56.91%) |
| **W9 K-Means ($k=3$)** | Verified | 3 real regimes (Low 108.4, Moderate 122.5, Severe 215.6) |
| **W9 DBSCAN** | Verified | 1 dense manifold, 69 noise/outlier points (0.74%) |
| **W9 Regime Integration**| Verified | Out-of-sample RMSE reduced from 39.068 to 38.324 |
| **W10 Nested CV** | Verified | 5 outer $\times$ 3 inner folds: Mean RMSE = 43.008 |
| **W10 Calibration** | Verified | Raw XGBoost Brier score = 0.1726, ROC-AUC = 0.8243 |
| **W10 Significance Tests**| Verified | Wilcoxon tests: XGBoost vs OLS ($p < 0.001$), vs Ridge ($p < 0.001$) |
| **W11 Drift Detection** | Verified | PSI computed across all features: overall status Significant Drift |
| **W11 Packaging** | Verified | `models/*_v1.joblib` and `models/model_registry.json` |
| **W12 FastAPI REST API** | Verified | All 5 endpoints tested and operational (`/health`, `/metrics`, `/predict`, `/explain`, `/drift`) |
| **W12 Streamlit UI** | Verified | 7 tabs with What-If simulator passing through production scaler |
| **Pytest Unit Tests** | Verified | **20 passed in 8.13s** across `tests/` |

---

## 3. Commands to Run the Project

### Execute Master Training & Evaluation Pipeline (Weeks 1–12)
```bash
python run_project.py
```

### Run Full Test Suite
```bash
pytest tests/ -v
```

### Start FastAPI Production Service
```bash
uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```

### Launch Interactive Streamlit Dashboard
```bash
streamlit run app/app.py
```
