/**
 * AeroPure Demo Mode — Representative Sensor Baselines
 * =====================================================
 * Maps each location's regime hint to a realistic ObservationInput derived
 * from the ACTUAL cluster_regime_profiles.csv mean statistics.
 *
 * Regime 0 → Moderate / Warm Photochemical  (CO≈1.91, NO2≈99.2, NOx≈164, C6H6≈10.1, T≈24.5, RH≈43)
 * Regime 1 → Low Pollution / Clean          (CO≈1.18, NO2≈96.8, NOx≈163, C6H6≈4.5,  T≈12.0, RH≈51)
 * Regime 2 → Severe Stagnant Inversion      (CO≈4.07, NO2≈163,  NOx≈517, C6H6≈20.0, T≈16.3, RH≈53)
 * (Cluster means over freshly-measured hours; v2.0.0 clustering excludes carried-forward imputed rows.)
 *
 * These are model INPUTS, not claimed real-time city measurements.
 * All values sourced from validated cluster_regime_profiles.csv.
 */

import type { Area } from "./locations";

export interface ObservationInput {
  co: number;
  no2: number;
  c6h6: number;
  nox: number;
  temperature: number;
  relative_humidity: number;
  absolute_humidity: number;
  pt08_s1: number;
  pt08_s2: number;
  pt08_s3: number;
  pt08_s4: number;
  pt08_s5: number;
  hour: number;
  day_of_week: number;
  month: number;
}

// Source: cluster_regime_profiles.csv — actual training data cluster means
const REGIME_BASELINES: Record<0 | 1 | 2, Omit<ObservationInput, "hour" | "day_of_week" | "month">> = {
  0: {
    // Moderate / Warm Photochemical Regime
    co: 1.91,
    no2: 99.19,
    c6h6: 10.07,
    nox: 164.36,
    temperature: 24.48,
    relative_humidity: 43.28,
    absolute_humidity: 1.23,
    pt08_s1: 1098.99,
    pt08_s2: 970.18,
    pt08_s3: 787.09,
    pt08_s4: 1594.33,
    pt08_s5: 993.02,
  },
  1: {
    // Low Pollution / Clean Dispersion Regime
    co: 1.18,
    no2: 96.78,
    c6h6: 4.54,
    nox: 163.29,
    temperature: 11.95,
    relative_humidity: 51.34,
    absolute_humidity: 0.73,
    pt08_s1: 949.29,
    pt08_s2: 724.84,
    pt08_s3: 1007.12,
    pt08_s4: 1120.35,
    pt08_s5: 761.82,
  },
  2: {
    // Severe Stagnant Inversion / High Emission Regime
    co: 4.07,
    no2: 163.27,
    c6h6: 20.0,
    nox: 517.24,
    temperature: 16.32,
    relative_humidity: 53.05,
    absolute_humidity: 0.98,
    pt08_s1: 1388.68,
    pt08_s2: 1283.85,
    pt08_s3: 560.57,
    pt08_s4: 1708.3,
    pt08_s5: 1578.66,
  },
};

export function buildDemoInput(
  area: Area,
  nowDate: Date = new Date()
): ObservationInput {
  const base = REGIME_BASELINES[area.defaultRegimeHint];
  return {
    ...base,
    hour: nowDate.getHours(),
    day_of_week: nowDate.getDay() === 0 ? 6 : nowDate.getDay() - 1, // Mon=0
    month: nowDate.getMonth() + 1,
  };
}

export function buildForecastInput(
  area: Area,
  hourOffset: number,
  nowDate: Date = new Date()
): ObservationInput {
  const base = REGIME_BASELINES[area.defaultRegimeHint];
  const futureDate = new Date(nowDate.getTime() + hourOffset * 3600 * 1000);
  return {
    ...base,
    hour: futureDate.getHours(),
    day_of_week: futureDate.getDay() === 0 ? 6 : futureDate.getDay() - 1,
    month: futureDate.getMonth() + 1,
  };
}

export const FORECAST_OFFSETS = [0, 3, 6, 12, 18, 24];
