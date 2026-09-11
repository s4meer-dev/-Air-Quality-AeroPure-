import sys
import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans, DBSCAN
from sklearn.metrics import silhouette_score
import xgboost as xgb
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Load processed data
df = pd.read_csv('data/processed_data.csv')
print(f"Loaded processed data: {df.shape}")

cluster_features = [
    'CO(GT)', 'C6H6(GT)', 'NOx(GT)', 'NO2(GT)',
    'PT08.S1(CO)', 'PT08.S2(NMHC)', 'PT08.S3(NOx)', 'PT08.S4(NO2)', 'PT08.S5(O3)',
    'T', 'RH', 'AH', 'current_air_quality_index'
]

X_clust = df[cluster_features].copy()
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_clust)

# PCA
pca = PCA()
X_pca = pca.fit_transform(X_scaled)
var_ratio = pca.explained_variance_ratio_
cum_var = np.cumsum(var_ratio)
print("PCA Explained variance ratio (first 5):", var_ratio[:5])
print("Cumulative variance (first 5):", cum_var[:5])

# K-Means evaluation
inertias = {}
silhouettes = {}
for k in range(2, 7):
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = km.fit_predict(X_scaled)
    inertias[k] = float(km.inertia_)
    sil = float(silhouette_score(X_scaled, labels, sample_size=2500, random_state=42))
    silhouettes[k] = sil
    print(f"k={k}: Inertia={km.inertia_:.1f}, Silhouette={sil:.4f}", flush=True)

# Fit best k=3
kmeans_3 = KMeans(n_clusters=3, random_state=42, n_init=10)
kmeans_labels = kmeans_3.fit_predict(X_scaled)

# DBSCAN
print("Fitting DBSCAN...", flush=True)
dbscan = DBSCAN(eps=2.5, min_samples=25, n_jobs=-1)
dbscan_labels = dbscan.fit_predict(X_scaled)
n_dbscan_clusters = len(set(dbscan_labels)) - (1 if -1 in dbscan_labels else 0)
n_noise = (dbscan_labels == -1).sum()
print(f"DBSCAN clusters: {n_dbscan_clusters}, Noise points: {n_noise} ({n_noise/len(df)*100:.2f}%)", flush=True)

# Profiles
clust_df = X_clust.copy()
clust_df['cluster'] = kmeans_labels
print("\nCluster Means:")
print(clust_df.groupby('cluster')[['current_air_quality_index', 'CO(GT)', 'NOx(GT)', 'NO2(GT)', 'T', 'RH']].mean())
print("\nCluster Counts:")
print(clust_df['cluster'].value_counts().sort_index())

