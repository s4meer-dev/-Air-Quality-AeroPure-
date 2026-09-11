"use client";

import { Droplets, Wind, Gauge, CloudSun, Activity, AlertCircle, RefreshCw } from "lucide-react";
import { PredictResponse } from "@/lib/aeropure-client";

interface WeatherData {
  city: string;
  country: string;
  temp: number;
  temp_feels_like: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  condition: string;
  description: string;
}

interface ExternalPollutionData {
  aqi: number;
  co: number;
  no2: number;
  o3: number;
  so2: number;
  pm2_5: number;
  pm10: number;
}

interface Props {
  weatherState: { available: boolean; weather?: WeatherData; error?: string };
  prediction: PredictResponse | null;
  externalPollution?: ExternalPollutionData | null;
  onRetryWeather: () => void;
}

export default function DualSourcePanel({
  weatherState,
  prediction,
  externalPollution,
  onRetryWeather,
}: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2.5rem" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* Card 1: OpenWeather Context */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.12em" }}>
                WEATHER CONTEXT
              </span>
              <span style={{ fontSize: "0.7rem", background: "rgba(255,255,255,0.06)", padding: "0.2rem 0.6rem", borderRadius: 4, color: "var(--text-muted)" }}>
                Source: OpenWeather API
              </span>
            </div>

            {weatherState.available && weatherState.weather ? (
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "2.8rem", fontWeight: 800, color: "var(--text-primary)" }}>
                    {weatherState.weather.temp}°C
                  </span>
                  <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                    Feels like {weatherState.weather.temp_feels_like}°C · {weatherState.weather.condition}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", fontSize: "0.82rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)" }}>
                    <Droplets size={14} color="#4A90E2" />
                    <span>Humidity: <strong style={{ color: "var(--text-primary)" }}>{weatherState.weather.humidity}%</strong></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)" }}>
                    <Wind size={14} color="var(--gold-bright)" />
                    <span>Wind: <strong style={{ color: "var(--text-primary)" }}>{weatherState.weather.wind_speed} m/s</strong></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)" }}>
                    <Gauge size={14} color="var(--gold)" />
                    <span>Pressure: <strong style={{ color: "var(--text-primary)" }}>{weatherState.weather.pressure} hPa</strong></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)" }}>
                    <CloudSun size={14} color="var(--gold)" />
                    <span>Sky: <strong style={{ color: "var(--text-primary)" }}>{weatherState.weather.description}</strong></span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "1.5rem 0", textAlign: "center" }}>
                <AlertCircle size={28} color="var(--gold)" style={{ margin: "0 auto 0.5rem" }} />
                <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>WEATHER DATA UNAVAILABLE</p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                  {weatherState.error ?? "API Key pending activation or service network timeout."}
                </p>
                <button
                  onClick={onRetryWeather}
                  style={{
                    marginTop: "1rem",
                    background: "rgba(201,162,39,0.12)",
                    border: "1px solid var(--gold-dim)",
                    color: "var(--gold)",
                    padding: "0.4rem 0.9rem",
                    borderRadius: 6,
                    fontSize: "0.78rem",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <RefreshCw size={12} /> RETRY WEATHER FETCH
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: AeroPure ML Prediction */}
        <div
          style={{
            background: "var(--bg-card)",
            border: prediction?.hazardous ? "1px solid var(--red)" : "1px solid var(--gold-dim)",
            borderRadius: 14,
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "0.72rem", fontWeight: 700, color: "var(--gold)", letterSpacing: "0.12em" }}>
                AIR QUALITY PREDICTION
              </span>
              <span style={{ fontSize: "0.7rem", background: "rgba(201,162,39,0.12)", padding: "0.2rem 0.6rem", borderRadius: 4, color: "var(--gold)" }}>
                Source: AeroPure XGBoost Model
              </span>
            </div>

            {prediction ? (
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.8rem", marginBottom: "0.8rem" }}>
                  <span
                    style={{
                      fontSize: "3.2rem",
                      fontWeight: 900,
                      fontFamily: "Orbitron, sans-serif",
                      color: prediction.hazardous ? "var(--red-bright)" : "var(--gold-bright)",
                      lineHeight: 1,
                    }}
                  >
                    {prediction.predicted_aqi_proxy.toFixed(1)}
                  </span>
                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "0.2rem 0.6rem",
                        borderRadius: 4,
                        background: prediction.hazardous ? "rgba(139,0,0,0.3)" : "rgba(201,162,39,0.15)",
                        color: prediction.hazardous ? "var(--red-bright)" : "var(--gold)",
                        border: prediction.hazardous ? "1px solid var(--red)" : "1px solid var(--gold-dim)",
                      }}
                    >
                      {prediction.risk_category.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <p>Hazard Probability: <strong style={{ color: prediction.hazardous ? "var(--red-bright)" : "var(--text-primary)" }}>{(prediction.hazard_probability * 100).toFixed(0)}%</strong></p>
                  <p>Pollution Regime: <strong style={{ color: "var(--text-primary)" }}>{prediction.pollution_regime}</strong></p>
                  <p>Dominant Driver: <strong style={{ color: "var(--gold)" }}>{prediction.dominant_current_pollutant}</strong></p>
                </div>
              </div>
            ) : (
              <div style={{ padding: "1.5rem 0", textAlign: "center", color: "var(--text-muted)" }}>
                <Activity size={24} color="var(--gold-dim)" style={{ margin: "0 auto 0.5rem" }} />
                <p>Loading Model Prediction...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* External Air Pollution Reference Panel (Phase 8) */}
      {externalPollution && (
        <div
          style={{
            background: "rgba(10,10,10,0.5)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "1rem 1.2rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
            <span style={{ fontSize: "0.72rem", fontFamily: "Orbitron, sans-serif", fontWeight: 700, color: "var(--text-muted)" }}>
              EXTERNAL AIR POLLUTION DATA (REFERENCE ONLY)
            </span>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Source: OpenWeather Air Pollution API</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "0.8rem", textAlign: "center" }}>
            <div style={{ background: "rgba(0,0,0,0.4)", padding: "0.5rem", borderRadius: 6 }}>
              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>PM2.5</span>
              <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>{externalPollution.pm2_5} µg/m³</p>
            </div>
            <div style={{ background: "rgba(0,0,0,0.4)", padding: "0.5rem", borderRadius: 6 }}>
              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>PM10</span>
              <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>{externalPollution.pm10} µg/m³</p>
            </div>
            <div style={{ background: "rgba(0,0,0,0.4)", padding: "0.5rem", borderRadius: 6 }}>
              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>NO₂</span>
              <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>{externalPollution.no2} µg/m³</p>
            </div>
            <div style={{ background: "rgba(0,0,0,0.4)", padding: "0.5rem", borderRadius: 6 }}>
              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>O₃</span>
              <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>{externalPollution.o3} µg/m³</p>
            </div>
            <div style={{ background: "rgba(0,0,0,0.4)", padding: "0.5rem", borderRadius: 6 }}>
              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>CO</span>
              <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>{externalPollution.co} µg/m³</p>
            </div>
          </div>

          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.6rem" }}>
            * Contextual reference data provided by OpenWeather. Not used as raw input for the trained AeroPure model.
          </p>
        </div>
      )}
    </div>
  );
}
