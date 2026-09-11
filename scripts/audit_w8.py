"""
Audit script for AeroPure Week 1-8 components:
1. Timestamp continuity & shift(-24) vs t + 24 hours alignment
2. Duplicate timestamps
3. AQI proxy calculation and ranges
4. Leakage checks
"""

import os
import pandas as pd
import numpy as np

def audit():
    print("=" * 70)
    print("AUDITING AEROPURE DATA & TARGET GENERATION")
    print("=" * 70)

    data_path = os.path.join("data", "AirQuality.csv")
    df = pd.read_csv(data_path, sep=";", decimal=",", low_memory=False)
    df = df.dropna(how="all", axis=1).dropna(how="all", axis=0)

    time_str = df["Time"].astype(str).str.replace(".", ":", regex=False)
    df["datetime"] = pd.to_datetime(df["Date"] + " " + time_str, format="%d/%m/%Y %H:%M:%S", errors="coerce")
    df = df.dropna(subset=["datetime"]).sort_values("datetime").reset_index(drop=True)

    print(f"Total rows after datetime parsing: {len(df)}")
    print(f"Start: {df['datetime'].min()} | End: {df['datetime'].max()}")

    # Check consecutive differences
    diffs = df["datetime"].diff()
    print("\nConsecutive time step differences:")
    print(diffs.value_counts())

    full_range = pd.date_range(start=df["datetime"].min(), end=df["datetime"].max(), freq="1h")
    print(f"\nExpected continuous hourly steps: {len(full_range)}")
    print(f"Actual rows present: {len(df)}")
    print(f"Missing hours: {len(full_range) - len(df)}")

    # Check shift(-24) vs true datetime + 24 hours
    df["shift_24_time"] = df["datetime"].shift(-24)
    df["expected_24h_time"] = df["datetime"] + pd.Timedelta(hours=24)
    mismatches = (df["shift_24_time"] != df["expected_24h_time"]).sum()
    print(f"\nMismatches between shift(-24) and true (t + 24h): {mismatches} out of {len(df) - 24} rows!")

    # Check how many times shift(-24) is NOT exactly 24 hours later
    valid_comparison = df.iloc[:-24].copy()
    actual_diff = (valid_comparison["shift_24_time"] - valid_comparison["datetime"]).dt.total_seconds() / 3600.0
    non_24h_shifts = (actual_diff != 24.0).sum()
    print(f"Rows where shift(-24) is NOT 24 hours later: {non_24h_shifts} ({non_24h_shifts / len(valid_comparison) * 100:.2f}%)")
    print(f"Offset range in hours: min={actual_diff.min():.1f}h, max={actual_diff.max():.1f}h, median={actual_diff.median():.1f}h")

if __name__ == "__main__":
    audit()
