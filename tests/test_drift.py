"""
Tests for Population Stability Index (PSI) Drift Calculation
"""

import pytest
import numpy as np
import pandas as pd

from src.drift import calculate_feature_psi, classify_psi, evaluate_dataset_drift


def test_psi_identical_distributions():
    """Verify PSI is near zero for identical distributions."""
    np.random.seed(42)
    dist1 = np.random.normal(loc=20.0, scale=5.0, size=1000)
    dist2 = np.random.normal(loc=20.0, scale=5.0, size=1000)

    psi = calculate_feature_psi(dist1, dist2)
    assert psi < 0.10, f"Expected PSI < 0.10, got {psi}"
    assert classify_psi(psi) == "Stable"


def test_psi_shifted_distributions():
    """Verify PSI flags significant drift for severely shifted distributions."""
    np.random.seed(42)
    dist_baseline = np.random.normal(loc=10.0, scale=2.0, size=1000)
    dist_shifted = np.random.normal(loc=25.0, scale=2.0, size=1000)

    psi = calculate_feature_psi(dist_baseline, dist_shifted)
    assert psi > 0.25, f"Expected PSI > 0.25 for shifted distribution, got {psi}"
    assert classify_psi(psi) == "Significant Drift"


def test_evaluate_dataset_drift():
    """Verify dataset drift evaluation across multiple features."""
    ref_df = pd.DataFrame({
        "feat_a": np.random.normal(10, 2, 500),
        "feat_b": np.random.normal(50, 10, 500)
    })
    # Shift feat_b significantly
    inc_df = pd.DataFrame({
        "feat_a": np.random.normal(10, 2, 500),
        "feat_b": np.random.normal(80, 10, 500)
    })

    res = evaluate_dataset_drift(ref_df, inc_df, feature_cols=["feat_a", "feat_b"])
    assert "overall_drift_status" in res
    assert "feat_a" in res["psi_by_feature"]
    assert "feat_b" in res["psi_by_feature"]
    assert res["status_by_feature"]["feat_a"] == "Stable"
    assert res["status_by_feature"]["feat_b"] == "Significant Drift"
