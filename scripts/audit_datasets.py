"""
AeroPure Dataset Audit Script
Inspects archive 1, archive 2, archive 3, and archive.zip
"""

import os
import zipfile
import pandas as pd
import numpy as np


def audit():
    print("=" * 70)
    print("AEROPURE REAL DATASET AUDIT (ARCHIVE 1, 2, 3)")
    print("=" * 70)

    # 1. Archive 1: AirQuality.csv
    if os.path.exists("archive (1).zip"):
        with zipfile.ZipFile("archive (1).zip", "r") as z:
            info = z.getinfo("AirQuality.csv")
            with z.open("AirQuality.csv") as f:
                df1 = pd.read_csv(f, sep=";", decimal=",", low_memory=False)
                df1 = df1.dropna(how="all", axis=1).dropna(how="all", axis=0)

                print("\n[1] ARCHIVE 1: AirQuality.csv (in archive (1).zip)")
                print(f"  • File Size (Compressed): {os.path.getsize('archive (1).zip'):,} bytes")
                print(f"  • File Size (Uncompressed): {info.file_size:,} bytes")
                print(f"  • Dimensions: {df1.shape[0]:,} rows, {df1.shape[1]} columns")
                print(f"  • Columns: {list(df1.columns)}")
                print(f"  • Data Types:\n{df1.dtypes}")
                print(f"  • Missing Values Total: {df1.isnull().sum().to_dict()}")
                print(f"  • Note on Sentinel Values: In UCI AirQuality, '-200' represents missing sensor values.")
                sentinel_counts = {c: int((df1[c] == -200).sum()) for c in df1.select_dtypes(include=[np.number]).columns}
                print(f"  • Sentinel (-200) Missing Counts: {sentinel_counts}")
                print(f"  • Duplicate Records: {int(df1.duplicated().sum())}")
                if "Date" in df1.columns and "Time" in df1.columns:
                    dt1 = pd.to_datetime(df1["Date"] + " " + df1["Time"], format="%d/%m/%Y %H.%M.%S", errors="coerce")
                    print(f"  • Temporal Coverage: Hourly, from {dt1.min()} to {dt1.max()}")

    # 2. Archive 2: data.csv
    if os.path.exists("archive (2).zip"):
        with zipfile.ZipFile("archive (2).zip", "r") as z:
            info = z.getinfo("data.csv")
            with z.open("data.csv") as f:
                df2 = pd.read_csv(f, encoding="latin-1", low_memory=False)

                print("\n[2] ARCHIVE 2: data.csv (in archive (2).zip)")
                print(f"  • File Size (Compressed): {os.path.getsize('archive (2).zip'):,} bytes")
                print(f"  • File Size (Uncompressed): {info.file_size:,} bytes")
                print(f"  • Dimensions: {df2.shape[0]:,} rows, {df2.shape[1]} columns")
                print(f"  • Columns: {list(df2.columns)}")
                print(f"  • Data Types:\n{df2.dtypes}")
                print(f"  • Missing Values:\n{df2.isnull().sum().to_dict()}")
                print(f"  • Duplicate Records: {int(df2.duplicated().sum())}")
                if "date" in df2.columns:
                    dt2 = pd.to_datetime(df2["date"], errors="coerce")
                    print(f"  • Temporal Coverage: Daily/Periodic, from {dt2.min()} to {dt2.max()}")
                    print(f"  • Locations / Stations: {df2['location'].nunique()} cities across {df2['state'].nunique()} states")

    # 3. Archive 3: Epidemiological datasets
    if os.path.exists("archive (3).zip"):
        with zipfile.ZipFile("archive (3).zip", "r") as z:
            print("\n[3] ARCHIVE 3 (archive (3).zip)")
            print(f"  • File Size (Compressed): {os.path.getsize('archive (3).zip'):,} bytes")
            for fname in z.namelist():
                info = z.getinfo(fname)
                with z.open(fname) as f:
                    df3 = pd.read_csv(f)
                    print(f"\n  File: {fname} ({info.file_size:,} bytes)")
                    print(f"    - Dimensions: {df3.shape[0]:,} rows, {df3.shape[1]} columns")
                    print(f"    - Columns: {list(df3.columns)}")
                    print(f"    - Missing Values: {df3.isnull().sum().to_dict()}")
                    if "Year" in df3.columns:
                        print(f"    - Temporal Coverage: Annual country-level statistics ({df3['Year'].min()} to {df3['Year'].max()})")

    # 4. archive.zip: data_date.csv
    if os.path.exists("archive.zip"):
        with zipfile.ZipFile("archive.zip", "r") as z:
            info = z.getinfo("data_date.csv")
            with z.open("data_date.csv") as f:
                df0 = pd.read_csv(f)
                print("\n[4] ARCHIVE: data_date.csv (in archive.zip)")
                print(f"  • File Size (Compressed): {os.path.getsize('archive.zip'):,} bytes")
                print(f"  • Dimensions: {df0.shape[0]:,} rows, {df0.shape[1]} columns")
                print(f"  • Columns: {list(df0.columns)}")
                print(f"  • Missing Values: {df0.isnull().sum().to_dict()}")
                if "Date" in df0.columns:
                    print(f"  • Temporal Coverage: Daily country-level AQI ({df0['Date'].min()} to {df0['Date'].max()})")


if __name__ == "__main__":
    audit()
