#!/usr/bin/env python3
"""
AeroPure: Machine Learning Air Quality Forecasting System
=========================================================
Tagline: "Tell a city when tomorrow's air turns dangerous."
Scope: Weeks 1 to 8 (EDA -> Cleaning -> AQI Proxy -> OLS -> Ridge/Lasso -> Logistic -> CV -> Trees -> Random Forest -> XGBoost -> SHAP)

Usage:
    python run_project.py
"""

import sys
import os

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from src.pipeline import run_full_pipeline


def main():
    data_path = os.path.join(PROJECT_ROOT, "data", "AirQuality.csv")

    if not os.path.exists(data_path):
        # Fallback to air_quality.csv if placed under that name
        alt_path = os.path.join(PROJECT_ROOT, "data", "air_quality.csv")
        if os.path.exists(alt_path):
            data_path = alt_path
        else:
            print("\n" + "!" * 75)
            print("Real dataset not found. Please place AirQuality.csv inside data/.")
            print("!" * 75 + "\n")
            sys.exit(1)

    result = run_full_pipeline(
        data_path=data_path,
        models_dir=os.path.join(PROJECT_ROOT, "models"),
        outputs_dir=os.path.join(PROJECT_ROOT, "outputs")
    )

    if result.get("status") == "SUCCESS":
        print("\n[SUCCESS] Pipeline executed successfully.")
        sys.exit(0)
    else:
        print(f"\n[FAILURE] {result.get('error')}")
        sys.exit(1)


if __name__ == "__main__":
    main()
