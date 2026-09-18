"""
Tests for Production Models Loading and Inference
"""

import pytest
import pandas as pd
import numpy as np

from src.model_registry import load_production_artifacts, MODEL_VERSION
from src.hazard_model import HazardProbabilityModel, regression_probability, select_alert_threshold
from src.clustering import REGIME_NAMES_BY_AQI_RANK


def test_production_artifacts_loading():
    """Verify that all production models load from models/."""
    bundle = load_production_artifacts("models")
    assert bundle["regressor"] is not None
    assert bundle["classifier"] is not None
    assert bundle["preprocessing"] is not None
    assert bundle["clustering"] is not None
    assert bundle["registry"] is not None

    assert bundle["registry"]["model_version"] == MODEL_VERSION
    assert bundle["registry"]["regression_model"]["champion"] is True
    assert bundle["registry"]["classification_model"]["champion"] is True


def test_models_inference():
    """Verify that champion regressor and classifier predict valid outputs."""
    bundle = load_production_artifacts("models")
    prep = bundle["preprocessing"]
    reg = bundle["regressor"]
    clf = bundle["classifier"]

    feat_names = prep["feature_names"]
    medians = prep["feature_medians"]

    # Construct single sample input using medians
    sample_df = pd.DataFrame([medians], columns=feat_names)
    scaled_sample = pd.DataFrame(prep["scaler"].transform(sample_df), columns=feat_names)

    pred_aqi = reg.predict(scaled_sample)[0]
    prob_hazard = clf.predict_proba(scaled_sample)[0, 1]

    assert isinstance(float(pred_aqi), float)
    assert pred_aqi > 0.0, f"Predicted AQI {pred_aqi} must be positive"
    assert 0.0 <= prob_hazard <= 1.0, f"Probability {prob_hazard} must be between 0 and 1"


def test_preprocessing_bundle_matches_model_inputs():
    """The stored feature list must be exactly what the deployed regressor expects, in order."""
    bundle = load_production_artifacts("models")
    prep, reg = bundle["preprocessing"], bundle["regressor"]

    assert list(reg.feature_names_in_) == list(prep["feature_names"])
    assert prep["scaler"].n_features_in_ == len(prep["feature_names"])
    assert prep["required_history_hours"] >= 169  # 168h rolling window + the current row


def test_registry_metrics_come_from_real_leaderboards():
    """Registry metrics must equal the leaderboard rows (they were once hardcoded and drifted)."""
    registry = load_production_artifacts("models")["registry"]

    reg_board = pd.read_csv("outputs/metrics/regression_leaderboard.csv")
    row = reg_board[reg_board["Model"] == "XGBoost"].iloc[0]
    reg_metrics = registry["regression_model"]["test_metrics"]
    assert reg_metrics["RMSE"] == pytest.approx(row["RMSE"])
    assert reg_metrics["MAE"] == pytest.approx(row["MAE"])
    assert reg_metrics["R2"] == pytest.approx(row["R2"])

    clf_board = pd.read_csv("outputs/metrics/classification_leaderboard.csv")
    clf_row = clf_board[clf_board["Model"] == "AeroPure Hybrid Hazard Model"].iloc[0]
    assert registry["classification_model"]["test_metrics"]["ROC_AUC"] == pytest.approx(clf_row["ROC_AUC"])


def test_registry_sample_counts_match_processed_data():
    registry = load_production_artifacts("models")["registry"]
    df = pd.read_csv("data/processed_data.csv")
    ds = registry["dataset"]

    assert ds["total_samples"] == len(df)
    assert ds["train_samples"] + ds["test_samples"] <= len(df)
    assert registry["features"]["total_features"] == len(registry["features"]["names"])


def test_champion_beats_naive_baselines_on_holdout():
    """A learned model that cannot beat persistence/climatology is not worth deploying."""
    board = pd.read_csv("outputs/metrics/regression_leaderboard.csv").set_index("Model")
    champion_rmse = board.loc["XGBoost", "RMSE"]
    for baseline in [m for m in board.index if m.startswith("Baseline:")]:
        assert champion_rmse < board.loc[baseline, "RMSE"], f"XGBoost does not beat {baseline}"


def test_hazard_model_interface_and_consistency():
    """Hybrid hazard model exposes a sklearn-style interface and is consistent with the regression."""
    bundle = load_production_artifacts("models")
    prep, hazard = bundle["preprocessing"], bundle["classifier"]
    assert isinstance(hazard, HazardProbabilityModel)

    X = pd.DataFrame(
        prep["scaler"].transform(pd.DataFrame([prep["feature_medians"]] * 4, columns=prep["feature_names"])),
        columns=prep["feature_names"],
    )
    proba = hazard.predict_proba(X)
    assert proba.shape == (4, 2)
    assert np.allclose(proba.sum(axis=1), 1.0)
    assert set(np.unique(hazard.predict(X))) <= {0, 1}
    assert 0.0 < hazard.alert_threshold < 1.0
    assert hazard.residual_sigma > 1.0


def test_regression_probability_is_half_at_threshold_and_monotonic():
    assert regression_probability(np.array([180.0]), 40.0, 180.0)[0] == pytest.approx(0.5)
    probs = regression_probability(np.array([100.0, 150.0, 180.0, 220.0, 300.0]), 40.0, 180.0)
    assert np.all(np.diff(probs) > 0)


def test_select_alert_threshold_prefers_recall_when_positives_are_rare():
    rng = np.random.default_rng(0)
    y = (rng.random(2000) < 0.25).astype(int)
    prob = np.clip(0.25 + 0.35 * (y - 0.25) + rng.normal(0, 0.15, 2000), 0.01, 0.99)
    thr = select_alert_threshold(y, prob)
    assert 0.05 <= thr <= 0.6


def test_clustering_inference():
    """Verify clustering pipeline inference and regime mapping."""
    bundle = load_production_artifacts("models")
    clust = bundle["clustering"]

    assert clust["kmeans"].n_clusters == 3
    assert len(clust["regime_mapping"]) == 3

    # Predict regime on a test vector
    sample_df = pd.DataFrame(np.zeros((1, len(clust["feature_cols"]))), columns=clust["feature_cols"])
    scaled_vec = clust["scaler"].transform(sample_df)
    cluster_id = clust["kmeans"].predict(scaled_vec)[0]

    assert cluster_id in [0, 1, 2]
    assert cluster_id in clust["regime_mapping"]


def test_regime_names_are_assigned_by_aqi_rank_not_by_cluster_id():
    """K-Means ids are arbitrary; the cleanest cluster must carry the 'Low' name, the dirtiest 'Severe'."""
    clust = load_production_artifacts("models")["clustering"]
    aqi_idx = clust["feature_cols"].index("current_air_quality_index")
    centre_aqi = clust["kmeans"].cluster_centers_[:, aqi_idx] * clust["scaler"].scale_[aqi_idx] + clust["scaler"].mean_[aqi_idx]

    ranked_ids = list(np.argsort(centre_aqi))
    names_in_rank_order = [clust["regime_mapping"][int(c)] for c in ranked_ids]
    assert names_in_rank_order == REGIME_NAMES_BY_AQI_RANK
