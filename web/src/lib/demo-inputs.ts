/**
 * AeroPure Demo Mode — Representative Sensor Baselines
 * =====================================================
 * Maps each location's regime hint to a realistic ObservationInput derived
 * from the ACTUAL cluster_regime_profiles.csv mean statistics.
 *
 * Regime 0 → Moderate / Warm Photochemical  (CO≈1.81, NO2≈96.5, NOx≈162, C6H6≈9.96, T≈25.2, RH≈42)
 * Regime 1 → Low Pollution / Clean          (CO≈1.17, NO2≈90.2, NOx≈153, C6H6≈4.21, T≈12.9, RH≈52.9)
 * Regime 2 → Severe Stagnant Inversion      (CO≈3.92, NO2≈158,  NOx≈490, C6H6≈19.9, T≈16.8, RH≈52.5)
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
    co: 1.81,
    no2: 96.51,
    c6h6: 9.96,
    nox: 162.01,
    temperature: 25.25,
    relative_humidity: 41.95,
    absolute_humidity: 1.25,
    pt08_s1: 1090.9,
    pt08_s2: 965.56,
    pt08_s3: 793.79,
    pt08_s4: 1595.2,
    pt08_s5: 974.61,
  },
  1: {
    // Low Pollution / Clean Dispersion Regime
    co: 1.17,
    no2: 90.17,
    c6h6: 4.21,
    nox: 153.79,
    temperature: 12.91,
    relative_humidity: 52.88,
    absolute_humidity: 0.81,
    pt08_s1: 933.9,
    pt08_s2: 707.24,
    pt08_s3: 1035.12,
    pt08_s4: 1156.85,
    pt08_s5: 736.99,
  },
  2: {
    // Severe Stagnant Inversion / High Emission Regime
    co: 3.92,
    no2: 158.0,
    c6h6: 19.93,
    nox: 490.64,
    temperature: 16.79,
    relative_humidity: 52.47,
    absolute_humidity: 1.0,
    pt08_s1: 1385.09,
    pt08_s2: 1279.63,
    pt08_s3: 570.9,
    pt08_s4: 1715.66,
    pt08_s5: 1573.11,
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
