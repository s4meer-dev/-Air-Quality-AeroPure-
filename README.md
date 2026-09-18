# AeroPure: AI-Based Air Quality Prediction System
## Complete Engineering Roadmap (Weeks 1 to 12) — v2.0.0

> **Tagline:** *“Tell a city when tomorrow's air turns dangerous.”*  
> **Course:** Machine Learning Major / Mini-Project  
> **Architecture Scope:** **Weeks 1 to 12 (Complete End-to-End System)**  
> **Tech Stack:** Python 3.12, scikit-learn, XGBoost, SHAP, FastAPI, Streamlit, Next.js, Pytest  

---

## 1. Project Objective & Public Health Context
Urban air pollution is among the world's most acute environmental health threats. Traditional municipal reporting is retrospective: sensors measure current pollutant levels and issue public health warnings only after citizens have already been exposed. 

**AeroPure** is an intelligent next-day air quality forecasting and early warning system designed to give cities a **24-hour actionable lead time**. It delivers:
1. **Continuous Regression Forecast (`next_day_air_quality_index`):** Tomorrow's (+24h) continuous composite index proxy, with an ~80% forecast interval.
2. **Probabilistic Hazard Classification (`hazardous_air_day`):** Probability of tomorrow crossing the project-defined elevated pollution threshold ($\ge 180.0$), from a hybrid model with an alert threshold tuned on out-of-fold data.
3. **SHAP AI Explainability:** Directional attributions explaining exactly which physical and meteorological factors drive every prediction.
4. **Unsupervised Pollution Regimes (Week 9):** Data-driven atmospheric regimes discovered via PCA, K-Means ($k=3$), and DBSCAN.
5. **Rigorous Validation (Week 10):** 5-outer $\times$ 3-inner nested time-series cross-validation with a 24h purge gap, probability-quality comparison, and Wilcoxon signed-rank tests against naive baselines.
6. **Production Drift Monitoring (Week 11):** Population Stability Index (PSI) tracking covariate shift and triggering seasonal retraining alerts.
7. **Deployment Architecture (Week 12):** High-performance FastAPI microservice (`/health`, `/metrics`, `/predict`, `/explain`, `/drift`), an interactive Streamlit UI, and a Next.js web app.

---

## 2. Dataset Audit & Selection

Three candidate datasets were audited on disk:

| Dataset | Dimensions | Temporal Nature | Key Variables | Suitability & Decision |
| :--- | :--- | :--- | :--- | :--- |
| **Archive 1 (`AirQuality.csv`)** | **9,357 rows, 15 cols** | Continuous hourly (March 2004 – April 2005) | `CO(GT)`, `NO2(GT)`, `C6H6(GT)`, `NOx(GT)`, sensors `PT08.S1-S5`, `T`, `RH`, `AH` | **SELECTED PRIMARY DATASET:** High-resolution continuous hourly time series enabling genuine 24h lag features, rolling statistics, and time-aware evaluation. |
| **Archive 2 (`data.csv`)** | 435,742 rows, 13 cols | Irregular periodic (~2 days/week over 28 years) | `so2`, `no2`, `rspm`, `spm`, `pm2_5` across 304 cities | **NOT SUITABLE / NOT MERGED:** PM2.5 is **97.8% missing** (missing in 426,428 rows), no weather variables, and 3-5 day gaps break next-day contiguous forecasting. |
| **Archive 3 (4 CSVs)** | ~6,468 rows each | Annual national aggregates (1990–2017) | Global mortality and epidemiological rates | **NOT SUITABLE / NOT MERGED:** Annual global health statistics cannot predict urban next-day hourly air quality. |

### Data honesty: missing sensor data (new in v2.0.0)
In Archive 1 the reference analyzers go offline in long stretches (CO ≈ 18% of hours, NO2/NOx ≈ 17.5%, the sensor array ≈ 3.9%, with outages up to 173 consecutive hours). Only **74.2%** of hours have CO, NO2 **and** C6H6 all genuinely measured.

Earlier versions forward-*and-backward*-filled every gap and then computed targets from the filled values. That (a) copied future readings into the past (`bfill`), and (b) scored models against fabricated flat-line "ground truth", inflating apparent skill. v2.0.0 fixes this:

- **Causal imputation only** — forward-fill; nothing is ever back-filled.
- **Observed-only targets** — a target exists only when the AQI hour it points at was truly measured (6,919 labelled hours; 6,788 after removing rows whose 144h history is undefined).
- **Staleness features** (`co_stale_hours`, `no2_stale_hours`, `sensor_stale_hours`) let the model learn how much to trust carried-forward inputs.
- **Winsorisation limits** are estimated on the first 80% of the series only.
- **24h purged split** — training rows whose label falls next to the test period are dropped.

---

## 3. Pollutant-Based AQI Proxy Methodology

### Important Regulatory & Methodological Disclosure
AeroPure produces a pollutant-based AQI proxy because the primary training dataset does not contain direct PM2.5 / PM10 measurements required to claim an official composite AQI.
Therefore, the project's calculated value is strictly designated as:
**AEROPURE AQI PROXY** or **POLLUTANT-BASED AIR QUALITY INDEX PROXY**.

It must **never** be described as "Official AQI", "Government AQI", "CPCB AQI", or "EPA AQI".
No PM2.5 or PM10 values were fabricated or estimated.

The proxy is based on available gaseous criteria pollutants using piecewise linear subindex interpolation:
- **Carbon Monoxide (`CO(GT)`):** measured in $\text{mg/m}^3$
- **Nitrogen Dioxide (`NO2(GT)`):** measured in $\mu\text{g/m}^3$
- **Benzene (`C6H6(GT)`):** measured in $\mu\text{g/m}^3$

$$I_p = \frac{I_{hi} - I_{lo}}{BP_{hi} - BP_{lo}} \times (C_p - BP_{lo}) + I_{lo}$$

$$current\_air\_quality\_index = \max\left(I_{CO}, I_{NO2}, I_{C6H6}\right)$$

### Project Elevated-Pollution Threshold (180.0)
- The **180.0** threshold is **project-defined** (~75th percentile of observational distributions capturing upper-quartile acute episodes) and must **not** be described as a universal regulatory AQI threshold.
- **Classification Target (`hazardous_air_day`):** Binary indicator ($1$ if $next\_day\_air\_quality\_index \ge 180.0$, else $0$). Base rate: 21.8% in the training split, 37.8% in the (winter) test split — the series is strongly non-stationary.
- **Regression Target (`next_day_air_quality_index`):** Target at observation time $t$ is strictly $AQI_{proxy}(t + 24\text{ hours})$ constructed via explicit timestamp mapping, using observed hours only.

### Separation of External Telemetry
- External live air-quality telemetry (e.g., OpenWeather API) is strictly separated from AeroPure's model output.
- External telemetry is never averaged, numerically merged, or used to substitute AeroPure machine learning predictions.

---

## 4. Model Results (Held-Out Test Set: 1,358 Samples)

All numbers below are produced by `python run_project.py` on the honest protocol above (train = 5,409 rows, 24h purge, test = last 20% chronologically). The champions were selected by expanding-window cross-validation **on the training split**, not by ranking on the test set.

### Regression Benchmark (`next_day_air_quality_index`)
| Model | MAE | RMSE | $R^2$ | Notes |
| :--- | :---: | :---: | :---: | :--- |
| Baseline: Training Mean | 47.133 | 59.432 | −0.3204 | Constant forecast |
| Baseline: Hour-of-day Climatology | 41.552 | 52.087 | −0.0142 | Train-only hourly means |
| Baseline: Persistence (AQI now) | 33.730 | 44.425 | 0.2622 | "Tomorrow = same hour today" |
| Linear Regression (OLS) | 30.647 | 39.747 | 0.4094 | Week 3 linear baseline |
| Ridge Regression ($\alpha=10$) | 30.514 | 39.658 | 0.4121 | Week 4 |
| Lasso Regression ($\alpha=0.5$) | 29.045 | 37.649 | 0.4701 | Week 4 |
| Decision Tree ($depth=6$) | 34.970 | 44.940 | 0.2450 | Week 6 |
| Random Forest (150 trees) | 28.995 | 37.024 | 0.4876 | Week 7 (see OOB caveat below) |
| **XGBoost Regressor (Champion)** | **27.918** | **35.850** | **0.5195** | Week 8, tuned by time-series CV |

The champion cuts persistence RMSE by **19%** (44.4 → 35.9) and is significantly better than every other model (Wilcoxon on absolute errors: vs OLS $p=8.7\times10^{-8}$, Ridge $3.2\times10^{-7}$, Lasso $3.7\times10^{-3}$, Random Forest $5.8\times10^{-7}$, Persistence $1.6\times10^{-14}$).

> **Random-Forest OOB caveat.** RF reports an OOB $R^2$ of ~0.72 versus 0.49 on the test set. OOB scoring assumes i.i.d. rows; consecutive hours are strongly autocorrelated, so OOB rows leak through their neighbours. OOB is *not* comparable to the chronological test score.

**Champion hyperparameters** (found by random search over 48 configs scored with 5-fold expanding-window CV and a 24h gap; the same procedure is implemented in `src/tuning.py` / `scripts/tune_champion.py`, whose grid contains the winning config, so you can re-run it as new data arrives): `max_depth=4, learning_rate=0.02, n_estimators=250, min_child_weight=20, subsample=0.8, colsample_bytree=0.3, reg_alpha=1, reg_lambda=5`. Shallow, slow, heavily regularised trees beat the earlier hand-set config (depth 5, lr 0.05).

### Hazard Classification Benchmark (`hazardous_air_day`)
| Model | Accuracy | Precision | Recall | F1 | ROC-AUC | PR-AUC | Brier | Threshold |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Logistic Regression | 67.97% | 55.21% | 80.51% | 0.6550 | 0.7770 | 0.6958 | 0.2368 | 0.50 |
| Decision Tree | 67.30% | 54.50% | 81.48% | 0.6531 | 0.7432 | 0.6348 | 0.2419 | 0.50 |
| Random Forest | 72.68% | 61.23% | 75.44% | 0.6760 | 0.8145 | 0.7219 | 0.1756 | 0.50 |
| XGBoost Classifier (un-weighted) | 75.33% | 76.97% | 49.51% | 0.6026 | 0.8390 | 0.7594 | 0.1628 | 0.50 |
| **AeroPure Hybrid Hazard Model (Champion)** | 72.83% | 59.84% | **85.38%** | **0.7036** | **0.8497** | **0.7708** | **0.1558** | 0.30 |

**Hybrid Hazard Model** = average of (1) an un-weighted XGBoost classifier and (2) a regression-derived probability $P(y\ge180)=1-\Phi\big((180-\hat y)/\sigma\big)$ with $\sigma=40.2$ estimated from out-of-fold residuals. It has the best ROC-AUC, PR-AUC and Brier score, is consistent with the regression by construction, and its alert threshold (0.31 for the deployed model) is the F1-optimal cut on out-of-fold predictions — recall-leaning, appropriate for an early-warning system.

Two design findings behind it:
- **Class re-weighting hurt.** The earlier `scale_pos_weight` classifier inflated probabilities: Brier 0.1817 vs 0.1628 un-weighted (test). Thresholds, not weights, should carry the recall/precision trade-off.
- Threshold-free metrics (ROC-AUC / PR-AUC / Brier) are the fair way to compare rows; the F1/precision/recall columns use each model's own decision threshold.

### Things that were tried and rejected (so you don't have to)
| Idea | Result |
| :--- | :--- |
| Equal-weight and NNLS ensembles (XGB + ExtraTrees + RF + HistGB) | No combination beat tuned XGBoost on **both** CV and test (each traded ~0.6 CV RMSE for ~0.2 test RMSE — noise). NNLS weights overfit CV folds. Kept single XGBoost, which also keeps SHAP exact for the served prediction. |
| Forecast each sub-index separately, take the max | Worse on CV and test (test RMSE 37.7 vs 36.0): the max of predictions is a biased estimator of the expected max. |
| Pseudo-Huber loss | Marginally better on test, clearly worse on CV. |
| Isotonic re-calibration of the hybrid | Did not improve Brier / F1. |
| Anchoring the target on a recent level | Mixed / within noise. |
| Regime (cluster) indicators as features | No gain: RMSE 35.850 → 35.898. (Earlier reports claimed an improvement; that was measured on imputed targets.) |

---

## 5. Unsupervised Pollution Regime Discovery (Week 9)
Fit on the 6,068 hours where every sensor group actually reported (imputed rows excluded).
- **PCA:** First 3 principal components capture **90.09%** of cumulative variance across 13 criteria-pollutant and meteorological variables.
- **K-Means ($k=3$):** Regime names are assigned by ranking each cluster's mean AQI proxy (K-Means cluster ids are arbitrary; earlier versions hardcoded an id→name table):
  1. **Low Pollution / Clean Dispersion Regime (37.5%):** Mean AQI Proxy = 115.2, Mean CO = 1.18 mg/m³, Mean T = 11.95 °C.
  2. **Moderate / Warm Photochemical Regime (36.2%):** Mean AQI Proxy = 122.97, Mean CO = 1.91 mg/m³, Mean T = 24.48 °C.
  3. **Severe Stagnant Inversion / High Emission Regime (26.4%):** Mean AQI Proxy = 215.44, Mean CO = 4.07 mg/m³, Mean T = 16.32 °C.
- **DBSCAN:** 1 dense continuous manifold and 34 anomalous noise/sensor spikes (0.56%).
- **Supervised integration:** adding regime indicators did **not** improve the forecast (see §4).

---

## 6. Rigorous Evaluation & Statistical Validation (Week 10)
- **Nested Time-Series Cross-Validation** (5 outer × 3 inner folds, 24h purge gap, champion configuration with depth/learning-rate re-tuned per fold): $\text{RMSE} = 39.69 \pm 8.03$, $\text{MAE} = 30.20 \pm 5.73$, $R^2 = 0.505 \pm 0.107$. Fold-to-fold spread is large because the pollution regime shifts across seasons — differences below ~1 RMSE between models should be treated as noise.
- **Probability quality (held-out Brier):** class-weighted XGBoost 0.1817 → un-weighted 0.1628 → hybrid 0.1558.
- **Statistical significance:** see §4 (Wilcoxon signed-rank on absolute residuals).

---

## 7. Production Packaging & Drift Monitoring (Week 11)
- **Population Stability Index (train split vs. test split):**
  - `AH` 2.2652, `T` 1.6558, `NO2(GT)` 0.6699, `NOx(GT)` 0.4058, `current_air_quality_index` 0.3806 → Significant Drift
  - `C6H6(GT)` 0.1975, `PT08.S3(NOx)` 0.1353 → Monitor
  - `PT08.S1(CO)` 0.0598, `RH` 0.0368, `PT08.S5(O3)` 0.0365, `CO(GT)` 0.0273 → Stable
  - **Overall:** `Significant Drift` (mean PSI 0.5337). This is a *seasonal* shift (train ends in autumn, test is winter), which is exactly why the deployed artifact is refit on all observed data.
- **Deployment refit.** Held-out metrics come from models fit on the training split. The artifacts in `models/*_v1.joblib` are then refit on **all** 6,788 observed samples with identical hyperparameters, so the live model has seen winter. The `_v1` file names are kept for loader compatibility; the release version (`2.0.0`) lives in `models/model_registry.json`.
- **Model Registry (`models/model_registry.json`):** version, dataset counts, features (129), hyperparameters, OOF diagnostics, alert threshold, and held-out metrics — all read from the real leaderboards, nothing hardcoded.

---

## 8. Deployment Architecture (Week 12)

### FastAPI Microservice (`api/main.py`)
```bash
# Start FastAPI production server
uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```
Endpoints:
- `GET /health`: Operational health check.
- `GET /metrics`: Model version, real held-out metrics, and inference latency.
- `POST /predict`: Next-day AQI proxy with ~80% interval, hazard probability, alert flag, and regime.
- `POST /explain`: Directional top positive and negative SHAP contributors (raw feature values; SHAP base + sum reproduces the forecast).
- `GET /drift`: PSI drift metrics and retraining alert status.
- Interactive Swagger docs at `http://127.0.0.1:8000/docs`.

**Feature construction contract (fixed in v2.0.0).** The service builds features with the *same* `build_feature_matrix` used in training. A request is expanded into an hourly history frame:
- If you send `history` (the preceding hourly readings, oldest first, up to 168), the model uses your real recent trajectory.
- Otherwise it assumes conditions were steady at the current reading for the past week (persistence assumption) and reports `history_hours_used: 0`. Supplying real history gives more faithful forecasts.

`tests/test_api.py::test_serving_features_match_training_features` replays real hourly history through the API and asserts every served feature equals the training feature for that hour.

### Interactive Streamlit Dashboard (`app/app.py`)
```bash
streamlit run app/app.py
```
Includes tomorrow's forecast & hazard alert banner, regimes, leaderboards, SHAP, a live what-if simulator, drift telemetry, and EDA. All displayed metrics are read from the registry/leaderboards.

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

### 3. Re-run the Champion Hyperparameter Search (optional)
```bash
python scripts/tune_champion.py --n-iter 40 --task both
```
The search only ever sees the training split. Copy improved parameters into `CHAMPION_XGB_REGRESSOR_PARAMS` / `CHAMPION_XGB_CLASSIFIER_PARAMS`.

### 4. Run Automated Unit Test Suite
```bash
pytest tests/ -v
```
The suite includes regression tests for the bugs fixed in v2.0.0: no-lookahead features, causal imputation, observed-only targets, purged splits, train/serve feature parity, registry-vs-leaderboard consistency, and regime naming.

### 5. Launch Web Dashboard & REST API
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
│   ├── AirQuality.csv
│   └── processed_data.csv        # generated
├── src/
│   ├── aqi.py
│   ├── preprocessing.py          # causal cleaning, staleness flags
│   ├── feature_engineering.py    # single feature builder for train + serve
│   ├── regression.py             # champion params, baselines
│   ├── classification.py
│   ├── hazard_model.py           # hybrid hazard probability model
│   ├── tuning.py                 # time-series-safe random search
│   ├── cross_validation.py
│   ├── evaluation.py
│   ├── explainability.py
│   ├── clustering.py
│   ├── drift.py
│   ├── model_registry.py
│   └── pipeline.py
├── notebooks/                    # NOTE: stored outputs predate v2.0.0 (re-run to refresh)
├── models/
├── outputs/
├── api/ (main.py, schemas.py, services.py)
├── app/app.py
├── web/                          # Next.js front end
├── tests/
├── scripts/ (tune_champion.py, run_week10_evaluation.py, ...)
├── requirements.txt
├── README.md
└── run_project.py
```

---

## 11. Known Limitations
- **One station, ~13 months.** Only one seasonal cycle is observed; the test period (winter) is out of distribution for a training split that ends in autumn. Expect real-world error to be closer to the nested-CV figure (RMSE ≈ 39.7) than to the single-split figure.
- **Proxy, not a regulatory AQI.** No particulate data; the index is a max over CO, NO2 and benzene sub-indices.
- **Single-point API inputs** rely on a steady-state history assumption unless `history` is supplied.
- **Historical reports** (`FINAL_PROJECT_REPORT.md`, `FINAL_RELEASE.md`, `PROJECT_RESULTS.md`, `walkthrough.md`, `MODEL_INTEGRITY_AUDIT.md`) describe v1.0.0 and their numbers are superseded by this README.
