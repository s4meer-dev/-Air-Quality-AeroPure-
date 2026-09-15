/**
 * AeroPure FastAPI Client
 * =======================
 * Typed fetch wrapper for all FastAPI ML engine endpoints.
 * Used by Next.js API routes (server-side only).
 */

function getApiBase(): string {
  if (process.env.AEROPURE_API_URL) {
    return process.env.AEROPURE_API_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/pyapi`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/pyapi`;
  }
  return "";
}

export interface ObservationInput {
  co: number;
  no2: number;
  c6h6: number;
  nox?: number;
  temperature?: number;
  relative_humidity?: number;
  absolute_humidity?: number;
  pt08_s1?: number;
  pt08_s2?: number;
  pt08_s3?: number;
  pt08_s4?: number;
  pt08_s5?: number;
  hour?: number;
  day_of_week?: number;
  month?: number;
}

export interface PredictResponse {
  predicted_aqi_proxy: number;
  hazard_probability: number;
  hazardous: boolean;
  risk_category: string;
  pollution_regime: string;
  dominant_current_pollutant: string;
  current_aqi_proxy: number;
  model_version: string;
}

export interface FeatureContribution {
  feature: string;
  feature_value: number;
  contribution: number;
}

export interface ExplainResponse {
  predicted_aqi_proxy: number;
  hazard_probability: number;
  hazardous: boolean;
  top_positive_contributors: FeatureContribution[];
  top_negative_contributors: FeatureContribution[];
  explanation_summary: string;
  model_version: string;
  base_expected_value: number | null;
  shap_sum: number | null;
}

export interface HealthResponse {
  status: string;
  model_version: string;
  regressor_loaded: boolean;
  classifier_loaded: boolean;
  preprocessing_pipeline_loaded: boolean;
  clustering_pipeline_loaded: boolean;
}

export interface DriftResponse {
  drift_status: string;
  mean_psi: number;
  retraining_flagged: boolean;
  recommendation: string;
  significant_drift_features: string[];
  psi_by_feature: Record<string, number>;
}

export interface MetricsResponse {
  model_version: string;
  model_type: string;
  training_date: string;
  regression_metrics: Record<string, number>;
  classification_metrics: Record<string, number>;
  feature_count: number;
  prediction_count: number;
  average_inference_time_ms: number;
  drift_status: string;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBase();
  const url = `${base}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
    next: { revalidate: 0 }, // never cache — always live inference
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Inference engine ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const aeropureClient = {
  health: () => apiFetch<HealthResponse>("/health"),

  metrics: () => apiFetch<MetricsResponse>("/metrics"),

  predict: (input: ObservationInput) =>
    apiFetch<PredictResponse>("/predict", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  explain: (input: ObservationInput) =>
    apiFetch<ExplainResponse>("/explain", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  drift: () => apiFetch<DriftResponse>("/drift"),
};
