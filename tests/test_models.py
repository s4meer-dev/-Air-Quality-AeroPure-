"""
Tests for Production Models Loading and Inference
"""

import os
import pytest
import joblib
import pandas as pd
import numpy as np

from src.model_registry import load_production_artifacts


def test_production_artifacts_loading():
    """Verify that all production models load from models/."""
    bundle = load_production_artifacts("models")
    assert bundle["regressor"] is not None
    assert bundle["classifier"] is not None
    assert bundle["preprocessing"] is not None
    assert bundle["clustering"] is not None
    assert bundle["registry"] is not None

    assert bundle["registry"]["model_version"] == "1.0.0"
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
    scaled_sample = prep["scaler"].transform(sample_df)

    pred_aqi = reg.predict(scaled_sample)[0]
    prob_hazard = clf.predict_proba(scaled_sample)[0, 1]

    assert isinstance(float(pred_aqi), float)
    assert pred_aqi > 0.0, f"Predicted AQI {pred_aqi} must be positive"
    assert 0.0 <= prob_hazard <= 1.0, f"Probability {prob_hazard} must be between 0 and 1"


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

