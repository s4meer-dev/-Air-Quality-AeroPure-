"""
AeroPure Week 9: Unsupervised Pollution Regime Discovery & Integration
======================================================================
Implements PCA, K-Means clustering, DBSCAN outlier/noise detection,
cluster profiling with data-driven regime naming, and leakage-safe
integration into the forecasting pipeline.
"""

import os
import sys
import json

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from typing import Dict, List, Tuple, Any, Optional
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans, DBSCAN
from sklearn.metrics import silhouette_score, mean_squared_error, mean_absolute_error, r2_score
import xgboost as xgb

from src.feature_engineering import get_feature_columns
from src.regression import CHAMPION_XGB_REGRESSOR_PARAMS


# Selected physical/sensor criteria features measured at time t
CLUSTER_FEATURE_COLS = [
    "CO(GT)", "C6H6(GT)", "NOx(GT)", "NO2(GT)",
    "PT08.S1(CO)", "PT08.S2(NMHC)", "PT08.S3(NOx)", "PT08.S4(NO2)", "PT08.S5(O3)",
    "T", "RH", "AH", "current_air_quality_index"
]

# Regime names, ordered from cleanest to most polluted. K-Means cluster ids are arbitrary (they depend
# on initialisation and data order), so names are assigned by ranking each cluster's mean AQI proxy
# rather than by a hardcoded id -> name table. The downstream UI keys off these exact strings.
REGIME_NAMES_BY_AQI_RANK = [
    "Low Pollution / Clean Dispersion Regime",
    "Moderate / Warm Photochemical Regime",
    "Severe Stagnant Inversion / High Emission Regime",
]
REGIME_COLORS = {
    "Low Pollution / Clean Dispersion Regime": "#2ca02c",
    "Moderate / Warm Photochemical Regime": "#1f77b4",
    "Severe Stagnant Inversion / High Emission Regime": "#d62728",
}
STALENESS_COLUMNS = ["co_stale_hours", "no2_stale_hours", "sensor_stale_hours"]


def derive_regime_mapping(
    df: pd.DataFrame,
    labels: np.ndarray,
    aqi_col: str = "current_air_quality_index"
) -> Dict[int, str]:
    """Names each cluster by the rank of its mean AQI proxy (lowest = clean, highest = severe)."""
    ranked = df.groupby(np.asarray(labels))[aqi_col].mean().sort_values()
    if len(ranked) != len(REGIME_NAMES_BY_AQI_RANK):
        return {int(c): f"Regime {int(c)}" for c in ranked.index}
    return {int(c): REGIME_NAMES_BY_AQI_RANK[rank] for rank, c in enumerate(ranked.index)}


def select_fresh_rows(df: pd.DataFrame) -> pd.DataFrame:
    """Rows where every sensor group reported this hour (no carried-forward imputed values)."""
    present = [c for c in STALENESS_COLUMNS if c in df.columns]
    if not present:
        return df
    return df[(df[present] == 0).all(axis=1)]


def prepare_clustering_features(
    df: pd.DataFrame,
    features: Optional[List[str]] = None
) -> Tuple[np.ndarray, StandardScaler, List[str]]:
    """Extracts and standardizes physical environmental features at time t."""
    if features is None:
        features = [c for c in CLUSTER_FEATURE_COLS if c in df.columns]
    
    X_raw = df[features].copy()
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_raw)
    return X_scaled, scaler, features


def perform_pca(
    X_scaled: np.ndarray,
    n_components: Optional[int] = None
) -> Tuple[PCA, np.ndarray, np.ndarray, np.ndarray]:
    """Computes Principal Component Analysis and variance distributions."""
    pca = PCA(n_components=n_components, random_state=42)
    X_pca = pca.fit_transform(X_scaled)
    var_ratio = pca.explained_variance_ratio_
    cum_var = np.cumsum(var_ratio)
    return pca, X_pca, var_ratio, cum_var


def evaluate_kmeans_elbow_silhouette(
    X_scaled: np.ndarray,
    k_range: range = range(2, 7)
) -> Tuple[Dict[int, float], Dict[int, float]]:
    """Evaluates K-Means across k values using inertia and silhouette score."""
    inertias = {}
    silhouettes = {}
    for k in k_range:
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = km.fit_predict(X_scaled)
        inertias[k] = float(km.inertia_)
        sil = float(silhouette_score(X_scaled, labels, sample_size=2500, random_state=42))
        silhouettes[k] = round(sil, 4)
    return inertias, silhouettes


def fit_kmeans(
    X_scaled: np.ndarray,
    n_clusters: int = 3,
    random_state: int = 42
) -> Tuple[KMeans, np.ndarray]:
    """Fits final K-Means model."""
    km = KMeans(n_clusters=n_clusters, random_state=random_state, n_init=10)
    labels = km.fit_predict(X_scaled)
    return km, labels


def fit_dbscan(
    X_scaled: np.ndarray,
    eps: float = 2.0,
    min_samples: int = 20
) -> Tuple[DBSCAN, np.ndarray, int, int]:
    """Fits DBSCAN density clustering to identify dense manifolds vs sparse outliers/noise."""
    dbscan = DBSCAN(eps=eps, min_samples=min_samples, n_jobs=-1)
    labels = dbscan.fit_predict(X_scaled)
    n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
    n_noise = int((labels == -1).sum())
    return dbscan, labels, n_clusters, n_noise


def profile_clusters(
    df: pd.DataFrame,
    labels: np.ndarray,
    features: List[str],
    regime_mapping: Dict[int, str]
) -> pd.DataFrame:
    """
    Computes statistical profiles (mean, median, count, percentage)
    for each discovered cluster regime.
    """
    data = df[features].copy()
    data["cluster"] = labels
    
    means = data.groupby("cluster")[features].mean()
    medians = data.groupby("cluster")[features].median()
    counts = data["cluster"].value_counts().sort_index()
    
    records = []
    total_samples = len(data)
    for c in counts.index:
        rec = {
            "cluster": c,
            "regime_name": regime_mapping.get(int(c), f"Regime_{c}"),
            "count": int(counts[c]),
            "percentage": round(counts[c] / total_samples * 100, 2)
        }
        for feat in features:
            rec[f"{feat}_mean"] = round(float(means.loc[c, feat]), 2)
            rec[f"{feat}_median"] = round(float(medians.loc[c, feat]), 2)
        records.append(rec)
        
    profile_df = pd.DataFrame(records)
    return profile_df


def plot_clustering_figures(
    X_pca: np.ndarray,
    kmeans_labels: np.ndarray,
    dbscan_labels: np.ndarray,
    var_ratio: np.ndarray,
    cum_var: np.ndarray,
    inertias: Dict[int, float],
    silhouettes: Dict[int, float],
    profile_df: pd.DataFrame,
    regime_mapping: Dict[int, str],
    output_dir: str = "outputs/figures"
):
    """Generates all Week 9 visualizations for PCA, K-Means, DBSCAN, and Regime Profiles."""
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. PCA Scree & Cumulative Variance Plot
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5), dpi=150)
    comps = np.arange(1, len(var_ratio) + 1)
    ax1.bar(comps, var_ratio * 100, color="#1f77b4", alpha=0.8, edgecolor="black")
    ax1.plot(comps, var_ratio * 100, color="#d62728", marker="o")
    ax1.set_xlabel("Principal Component")
    ax1.set_ylabel("Individual Explained Variance (%)")
    ax1.set_title("PCA Scree Plot (Eigenvalue Distribution)")
    ax1.grid(True, linestyle="--", alpha=0.5)
    
    ax2.plot(comps, cum_var * 100, color="#2ca02c", marker="s", linewidth=2)
    ax2.axhline(85, color="gray", linestyle="--", label="85% Threshold")
    ax2.axhline(90, color="orange", linestyle="--", label="90% Threshold")
    ax2.set_xlabel("Principal Component")
    ax2.set_ylabel("Cumulative Explained Variance (%)")
    ax2.set_title("PCA Cumulative Explained Variance")
    ax2.legend()
    ax2.grid(True, linestyle="--", alpha=0.5)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "pca_variance_elbow.png"))
    plt.close(fig)
    
    # 2. K-Means Elbow & Silhouette Score Plot
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5), dpi=150)
    k_vals = list(inertias.keys())
    ax1.plot(k_vals, list(inertias.values()), color="#1f77b4", marker="o", linewidth=2)
    ax1.axvline(3, color="#d62728", linestyle="--", label="Selected k=3")
    ax1.set_xlabel("Number of Clusters (k)")
    ax1.set_ylabel("Inertia (Within-Cluster Sum of Squares)")
    ax1.set_title("K-Means Elbow Curve")
    ax1.legend()
    ax1.grid(True, linestyle="--", alpha=0.5)
    
    ax2.bar(k_vals, list(silhouettes.values()), color="#9467bd", alpha=0.8, edgecolor="black")
    ax2.axvline(3, color="#d62728", linestyle="--", label="Selected k=3")
    ax2.set_xlabel("Number of Clusters (k)")
    ax2.set_ylabel("Silhouette Score")
    ax2.set_title("Silhouette Coefficient Across k")
    ax2.legend()
    ax2.grid(True, linestyle="--", alpha=0.5)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "kmeans_silhouette_elbow.png"))
    plt.close(fig)
    
    # 3. PCA 2D K-Means Cluster Projection
    fig, ax = plt.subplots(figsize=(9, 7), dpi=150)
    for c in sorted(regime_mapping):
        idx = kmeans_labels == c
        name = regime_mapping[c]
        ax.scatter(X_pca[idx, 0], X_pca[idx, 1], s=12, alpha=0.5, label=f"Cluster {c}: {name}",
                   color=REGIME_COLORS.get(name, "#7f7f7f"))
    ax.set_xlabel(f"PC1 ({var_ratio[0]*100:.1f}% Variance)")
    ax.set_ylabel(f"PC2 ({var_ratio[1]*100:.1f}% Variance)")
    ax.set_title("AeroPure Discovered Pollution Regimes (PCA Projection)")
    ax.legend(loc="upper right", framealpha=0.9)
    ax.grid(True, linestyle="--", alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "pca_kmeans_clusters.png"))
    plt.close(fig)
    
    # 4. DBSCAN Anomaly / Noise Plot
    fig, ax = plt.subplots(figsize=(9, 7), dpi=150)
    noise_mask = dbscan_labels == -1
    ax.scatter(X_pca[~noise_mask, 0], X_pca[~noise_mask, 1], s=10, alpha=0.4, color="#1f77b4", label="Dense Core Manifold")
    ax.scatter(X_pca[noise_mask, 0], X_pca[noise_mask, 1], s=25, alpha=0.8, color="#d62728", marker="x", label=f"Outliers / Noise ({noise_mask.sum()} points)")
    ax.set_xlabel(f"PC1 ({var_ratio[0]*100:.1f}% Variance)")
    ax.set_ylabel(f"PC2 ({var_ratio[1]*100:.1f}% Variance)")
    ax.set_title("DBSCAN Density-Based Structure & Sensor Anomaly Detection")
    ax.legend(loc="upper right", framealpha=0.9)
    ax.grid(True, linestyle="--", alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "dbscan_clusters.png"))
    plt.close(fig)
    
    # 5. Cluster Profiles Bar Plot
    fig, ax = plt.subplots(figsize=(10, 5), dpi=150)
    key_pollutants = ["CO(GT)_mean", "NO2(GT)_mean", "current_air_quality_index_mean"]
    labels = [regime_mapping[int(c)] for c in profile_df["cluster"]]
    x = np.arange(len(labels))
    width = 0.25
    
    ax.bar(x - width, profile_df["CO(GT)_mean"] * 20, width, label="CO (x20 mg/m³)", color="#ff7f0e")
    ax.bar(x, profile_df["NO2(GT)_mean"], width, label="NO2 (µg/m³)", color="#1f77b4")
    ax.bar(x + width, profile_df["current_air_quality_index_mean"], width, label="AQI Proxy", color="#d62728")
    
    ax.set_xticks(x)
    ax.set_xticklabels(labels, rotation=15, ha="right", fontsize=9)
    ax.set_ylabel("Mean Magnitude / Index")
    ax.set_title("Mean Pollution Profiles Across Discovered Regimes")
    ax.legend()
    ax.grid(True, linestyle="--", alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "cluster_pollutant_profiles.png"))
    plt.close(fig)


def run_regime_forecasting_experiment(
    df: pd.DataFrame,
    scaler_feature_cols: List[str],
    target_col: str = "next_day_air_quality_index",
    train_ratio: float = 0.80
) -> Dict[str, Any]:
    """
    Evaluates whether adding unsupervised pollution regime features at time t
    improves next-day (t+24) supervised forecasting performance.
    STRICT LEAKAGE SAFE: Cluster model is fit strictly on Training period features.
    """
    feat_cols = [c for c in get_feature_columns(df) if not c.startswith("regime_")]

    n = len(df)
    split_idx = int(n * train_ratio)
    train_df = df.iloc[:split_idx].copy()
    test_df = df.iloc[split_idx:].copy()
    # Purge training rows whose 24h-ahead label sits next to the test period (see prepare_time_series_splits)
    if "datetime" in df.columns and len(test_df) > 0:
        cutoff = pd.to_datetime(test_df["datetime"].iloc[0]) - pd.Timedelta(hours=24)
        train_df = train_df[pd.to_datetime(train_df["datetime"]) <= cutoff]

    cluster_features = [c for c in CLUSTER_FEATURE_COLS if c in train_df.columns]
    
    # Fit cluster pipeline ONLY on training split
    cl_scaler = StandardScaler()
    X_tr_cl = cl_scaler.fit_transform(train_df[cluster_features])
    X_te_cl = cl_scaler.transform(test_df[cluster_features])
    
    km = KMeans(n_clusters=3, random_state=42, n_init=10).fit(X_tr_cl)
    train_clusters = km.predict(X_tr_cl)
    test_clusters = km.predict(X_te_cl)
    
    # Feature scale train and test
    feat_scaler = StandardScaler()
    X_tr_scaled = pd.DataFrame(feat_scaler.fit_transform(train_df[feat_cols]), columns=feat_cols, index=train_df.index)
    X_te_scaled = pd.DataFrame(feat_scaler.transform(test_df[feat_cols]), columns=feat_cols, index=test_df.index)
    
    y_tr_reg = train_df[target_col]
    y_te_reg = test_df[target_col]
    
    # 1. Base Model (no cluster feature)
    xgb_base = xgb.XGBRegressor(**CHAMPION_XGB_REGRESSOR_PARAMS, random_state=42)
    xgb_base.fit(X_tr_scaled, y_tr_reg)
    preds_base = xgb_base.predict(X_te_scaled)
    rmse_base = float(np.sqrt(mean_squared_error(y_te_reg, preds_base)))
    mae_base = float(mean_absolute_error(y_te_reg, preds_base))
    r2_base = float(r2_score(y_te_reg, preds_base))
    
    # 2. Augmented Model (+ Cluster Regime Features at time t)
    X_tr_aug = X_tr_scaled.copy()
    X_te_aug = X_te_scaled.copy()
    for c in range(3):
        X_tr_aug[f"regime_{c}"] = (train_clusters == c).astype(float)
        X_te_aug[f"regime_{c}"] = (test_clusters == c).astype(float)
        
    xgb_aug = xgb.XGBRegressor(**CHAMPION_XGB_REGRESSOR_PARAMS, random_state=42)
    xgb_aug.fit(X_tr_aug, y_tr_reg)
    preds_aug = xgb_aug.predict(X_te_aug)
    rmse_aug = float(np.sqrt(mean_squared_error(y_te_reg, preds_aug)))
    mae_aug = float(mean_absolute_error(y_te_reg, preds_aug))
    r2_aug = float(r2_score(y_te_reg, preds_aug))
    
    comparison = {
        "base_model": {
            "rmse": round(rmse_base, 3),
            "mae": round(mae_base, 3),
            "r2": round(r2_base, 4)
        },
        "augmented_model": {
            "rmse": round(rmse_aug, 3),
            "mae": round(mae_aug, 3),
            "r2": round(r2_aug, 4)
        },
        "rmse_delta": round(rmse_aug - rmse_base, 3),
        "r2_delta": round(r2_aug - r2_base, 4),
        "improvement": bool(rmse_aug < rmse_base)
    }
    return comparison


def run_week9_clustering(
    data_path: str = "data/processed_data.csv",
    models_dir: str = "models",
    outputs_dir: str = "outputs"
) -> Dict[str, Any]:
    """Master orchestrator for Week 9 unsupervised learning and regime discovery."""
    fig_dir = os.path.join(outputs_dir, "figures")
    metrics_dir = os.path.join(outputs_dir, "metrics")
    os.makedirs(fig_dir, exist_ok=True)
    os.makedirs(metrics_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)
    
    print("\n" + "=" * 75)
    print("WEEK 9: UNSUPERVISED POLLUTION REGIME DISCOVERY")
    print("=" * 75)
    
    df_all = pd.read_csv(data_path)
    # Regimes describe real atmospheric states, so fit only on hours where every sensor group actually
    # reported (carried-forward imputed values would otherwise smear the cluster geometry).
    df = select_fresh_rows(df_all).reset_index(drop=True)
    print(f"  [OK] Loaded dataset for clustering: {df.shape[0]} freshly-measured samples "
          f"(of {df_all.shape[0]} processed rows)")
    
    # 1. Feature Preparation & Scaling
    X_scaled, scaler, features = prepare_clustering_features(df)
    print(f"  [OK] Standardized {len(features)} criteria pollutant & meteorological features")
    
    # 2. PCA
    pca, X_pca, var_ratio, cum_var = perform_pca(X_scaled)
    print(f"  [OK] PCA computed: PC1={var_ratio[0]*100:.2f}%, PC2={var_ratio[1]*100:.2f}%, PC3={var_ratio[2]*100:.2f}%")
    print(f"  [OK] First 3 PCs capture {cum_var[2]*100:.2f}% cumulative variance (First 4: {cum_var[3]*100:.2f}%)")
    
    # 3. K-Means Elbow & Silhouette
    print("  Evaluating K-Means (k=2..6) elbow curve & silhouette scores...")
    inertias, silhouettes = evaluate_kmeans_elbow_silhouette(X_scaled)
    for k, sil in silhouettes.items():
        print(f"    k={k}: Inertia={inertias[k]:.1f}, Silhouette={sil:.4f}")
    
    # 4. Final K-Means (k=3)
    k_selected = 3
    kmeans, km_labels = fit_kmeans(X_scaled, n_clusters=k_selected)
    print(f"  [OK] Trained final K-Means (k={k_selected})")
    
    # 5. DBSCAN
    print("  Fitting DBSCAN density-based clustering...")
    dbscan, db_labels, n_db_clusters, n_noise = fit_dbscan(X_scaled, eps=2.0, min_samples=20)
    print(f"  [OK] DBSCAN identified {n_db_clusters} dense manifold, {n_noise} noise/anomalies ({n_noise/len(df)*100:.2f}%)")
    
    # 6. Cluster Profiling (names assigned by AQI rank, not by arbitrary K-Means ids)
    regime_mapping = derive_regime_mapping(df, km_labels)
    profile_df = profile_clusters(df, km_labels, features, regime_mapping)
    profile_path = os.path.join(metrics_dir, "cluster_regime_profiles.csv")
    profile_df.to_csv(profile_path, index=False)
    print(f"  [OK] Saved cluster regime statistics to '{profile_path}'")
    
    print("\n  Discovered Pollution Regimes:")
    for _, row in profile_df.iterrows():
        print(f"    • Cluster {int(row['cluster'])}: {row['regime_name']}")
        print(f"      Samples: {int(row['count'])} ({row['percentage']}%) | AQI Proxy Mean: {row['current_air_quality_index_mean']} | CO Mean: {row['CO(GT)_mean']} mg/m3 | Temp Mean: {row['T_mean']} C")
        
    # 7. Visualizations
    plot_clustering_figures(
        X_pca, km_labels, db_labels, var_ratio, cum_var,
        inertias, silhouettes, profile_df, regime_mapping, fig_dir
    )
    print(f"  [OK] Saved 5 clustering visualizations to '{fig_dir}'")
    
    # 8. Leakage-Safe Forecasting Integration Experiment
    print("\n  Evaluating impact of regime information on next-day forecasting...")
    forecast_exp = run_regime_forecasting_experiment(df_all, features)
    comp_df = pd.DataFrame([
        {"model": "Base XGBoost", "rmse": forecast_exp["base_model"]["rmse"], "mae": forecast_exp["base_model"]["mae"], "r2": forecast_exp["base_model"]["r2"]},
        {"model": "XGBoost + Regime", "rmse": forecast_exp["augmented_model"]["rmse"], "mae": forecast_exp["augmented_model"]["mae"], "r2": forecast_exp["augmented_model"]["r2"]}
    ])
    comp_path = os.path.join(metrics_dir, "regime_forecast_comparison.csv")
    comp_df.to_csv(comp_path, index=False)
    print(f"    Base Model:         RMSE={forecast_exp['base_model']['rmse']}, MAE={forecast_exp['base_model']['mae']}, R2={forecast_exp['base_model']['r2']}")
    print(f"    XGBoost + Regime:   RMSE={forecast_exp['augmented_model']['rmse']}, MAE={forecast_exp['augmented_model']['mae']}, R2={forecast_exp['augmented_model']['r2']}")
    print(f"    Delta: RMSE {forecast_exp['rmse_delta']:+.3f}, R2 {forecast_exp['r2_delta']:+.4f} -> Improved: {forecast_exp['improvement']}")
    
    # 9. Packaging Clustering Pipeline
    clustering_pipeline = {
        "scaler": scaler,
        "pca": pca,
        "kmeans": kmeans,
        "dbscan": dbscan,
        "feature_cols": features,
        "regime_mapping": regime_mapping,
        "pca_variance_ratio": var_ratio[:5].tolist(),
        "pca_cumulative_variance": cum_var[:5].tolist(),
        "k_selected": k_selected,
        "silhouette_k3": silhouettes[3]
    }
    pipe_path = os.path.join(models_dir, "clustering_pipeline_v1.joblib")
    joblib.dump(clustering_pipeline, pipe_path)
    print(f"  [OK] Saved clustering pipeline artifact to '{pipe_path}'")
    
    metrics_summary = {
        "pca_explained_variance_first3": round(float(cum_var[2]), 4),
        "k_selected": k_selected,
        "silhouette_scores": silhouettes,
        "dbscan_noise_points": n_noise,
        "dbscan_noise_pct": round(n_noise / len(df) * 100, 2),
        "forecasting_experiment": forecast_exp
    }
    summary_path = os.path.join(metrics_dir, "clustering_metrics.json")
    with open(summary_path, "w") as f:
        json.dump(metrics_summary, f, indent=2)
    print(f"  [OK] Saved clustering metrics summary to '{summary_path}'")
    
    return metrics_summary


if __name__ == "__main__":
    run_week9_clustering()
