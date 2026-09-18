"""
Re-run the champion hyperparameter search (regression + hazard classifier).

Usage:
    python scripts/tune_champion.py [--n-iter 40] [--task regression|classification|both]

Prints the best parameter sets by expanding-window CV on the TRAINING split only. Copy the winners
into CHAMPION_XGB_REGRESSOR_PARAMS / CHAMPION_XGB_CLASSIFIER_PARAMS if they improve on the current ones.
The held-out test split is never touched by the search.
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pandas as pd

from src.feature_engineering import prepare_time_series_splits
from src.tuning import random_search_xgb


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", default="data/processed_data.csv")
    parser.add_argument("--n-iter", type=int, default=40)
    parser.add_argument("--task", choices=["regression", "classification", "both"], default="both")
    args = parser.parse_args()

    df = pd.read_csv(args.data, parse_dates=["datetime"])
    X_train, _, y_train_reg, _, y_train_clf, _, _, _ = prepare_time_series_splits(df)

    tasks = ["regression", "classification"] if args.task == "both" else [args.task]
    for task in tasks:
        y = y_train_reg if task == "regression" else y_train_clf
        metric = "RMSE" if task == "regression" else "log-loss"
        print(f"\n=== {task} search ({args.n_iter} configs, expanding-window CV {metric}) ===")
        for score, params in random_search_xgb(X_train, y, task=task, n_iter=args.n_iter)[:5]:
            print(f"{score:.4f}  {params}")


if __name__ == "__main__":
    main()
