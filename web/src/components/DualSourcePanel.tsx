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
  const isHazard = prediction?.hazardous ?? false;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2.5rem" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* Card 1: Atmospheric Meteorological Instrumentation */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            borderRadius: 4,
            padding: "1.6rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.68rem", fontWeight: 700, color: "var(--silver)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                ATMOSPHERIC CONDITIONS
              </span>
              <span style={{ fontSize: "0.65rem", fontFamily: "JetBrains Mono, monospace", background: "rgba(255,255,255,0.06)", padding: "0.2rem 0.5rem", borderRadius: 2, color: "var(--silver)" }}>
                METEOROLOGICAL SENSORS
              </span>
            </div>

            {weatherState.available && weatherState.weather ? (
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "1.2rem" }}>
                  <span style={{ fontSize: "2.8rem", fontWeight: 900, color: "var(--air-white)", fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>
                    {weatherState.weather.temp.toFixed(1)}°C
                  </span>
                  <span style={{ fontSize: "0.82rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)" }}>
                    FEELS {weatherState.weather.temp_feels_like.toFixed(1)}°C · {weatherState.weather.condition.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem", fontSize: "0.8rem", fontFamily: "JetBrains Mono, monospace" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--silver)" }}>
                    <Droplets size={14} color="var(--mist)" />
                    <span>RH: <strong style={{ color: "var(--air-white)" }}>{weatherState.weather.humidity}%</strong></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--silver)" }}>
                    <Wind size={14} color="var(--mist)" />
                    <span>WIND: <strong style={{ color: "var(--air-white)" }}>{(weatherState.weather.wind_speed * 3.6).toFixed(0)} km/h</strong></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--silver)" }}>
                    <Gauge size={14} color="var(--mist)" />
                    <span>BARO: <strong style={{ color: "var(--air-white)" }}>{weatherState.weather.pressure} hPa</strong></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--silver)" }}>
                    <CloudSun size={14} color="var(--mist)" />
                    <span>SKY: <strong style={{ color: "var(--cloud)" }}>{weatherState.weather.description.toUpperCase()}</strong></span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "1.5rem 0", textAlign: "center" }}>
                <AlertCircle size={24} color="var(--silver)" style={{ margin: "0 auto 0.5rem" }} />
                <p style={{ fontWeight: 700, fontSize: "0.85rem", fontFamily: "JetBrains Mono, monospace", color: "var(--air-white)" }}>METEOROLOGY FEED STANDBY</p>
                <p style={{ fontSize: "0.72rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)", marginTop: "0.3rem" }}>
                  {weatherState.error ?? "API key pending activation or atmospheric service timeout."}
                </p>
                <button
                  onClick={onRetryWeather}
                  style={{
                    marginTop: "1rem",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid var(--border-strong)",
                    color: "var(--air-white)",
                    padding: "0.35rem 0.8rem",
                    borderRadius: 2,
                    fontSize: "0.72rem",
                    fontFamily: "JetBrains Mono, monospace",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    letterSpacing: "0.06em",
                  }}
                >
                  <RefreshCw size={11} /> RETRY TELEMETRY
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: AeroPure Model Output (Strongest Visual Element) */}
        <div
          style={{
            background: isHazard ? "#111111" : "var(--bg-card)",
            border: isHazard ? "2px solid var(--air-white)" : "1px solid var(--border-strong)",
            borderRadius: 4,
            padding: "1.6rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: isHazard ? "0 0 30px rgba(255,255,255,0.15)" : "none",
          }}
          className={isHazard ? "hazard-pulse" : ""}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.68rem", fontWeight: 700, color: "var(--silver)", letterSpacing: "0.14em" }}>
                AEROPURE PREDICTED AQI PROXY
              </span>
              <span
                style={{
                  fontSize: "0.65rem",
                  fontFamily: "JetBrains Mono, monospace",
                  background: isHazard ? "#FFFFFF" : "rgba(255,255,255,0.08)",
                  color: isHazard ? "#000000" : "var(--air-white)",
                  padding: "0.2rem 0.6rem",
                  borderRadius: 2,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                }}
              >
                XGBOOST INFERENCE
              </span>
            </div>

            <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: "var(--silver)", letterSpacing: "0.12em", marginBottom: "0.5rem" }}>
              POLLUTANT-BASED AIR QUALITY INDEX PROXY
            </p>

            {prediction ? (
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "1rem", marginBottom: "1rem" }}>
                  <span
                    style={{
                      fontSize: "clamp(3.5rem, 8vw, 4.2rem)",
                      fontWeight: 900,
                      fontFamily: "Orbitron, sans-serif",
                      color: "var(--air-white)",
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                      textShadow: "0 0 35px rgba(255, 255, 255, 0.3)",
                    }}
                  >
                    {prediction.predicted_aqi_proxy.toFixed(1)}
                  </span>
                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: "0.75rem",
                        fontFamily: "JetBrains Mono, monospace",
                        fontWeight: 800,
                        padding: "0.3rem 0.75rem",
                        borderRadius: 2,
                        background: isHazard ? "#FFFFFF" : "rgba(255, 255, 255, 0.12)",
                        color: isHazard ? "#000000" : "var(--air-white)",
                        border: isHazard ? "1px solid #FFFFFF" : "1px solid var(--border-strong)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {prediction.risk_category.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: "0.78rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <p>HAZARD PROBABILITY: <strong style={{ color: "var(--air-white)" }}>{(prediction.hazard_probability * 100).toFixed(0)}%</strong></p>
                  <p>ATMOSPHERIC REGIME: <strong style={{ color: "var(--cloud)" }}>{prediction.pollution_regime.toUpperCase()}</strong></p>
                  <p>PRIMARY EMISSION DRIVER: <strong style={{ color: "var(--air-white)" }}>{prediction.dominant_current_pollutant}</strong></p>
                </div>
              </div>
            ) : (
              <div style={{ padding: "1.5rem 0", textAlign: "center", color: "var(--silver)" }}>
                <Activity size={24} color="var(--silver)" style={{ margin: "0 auto 0.5rem" }} />
                <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.8rem" }}>GENERATING INFERENCE...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* External Air Pollution Reference Panel */}
      {externalPollution && (
        <div
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border-default)",
            borderRadius: 4,
            padding: "1rem 1.4rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.68rem", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "var(--silver)", letterSpacing: "0.1em" }}>
              WORLD AQI INDEX (EXTERNAL REFERENCE TELEMETRY)
            </span>
            <span style={{ fontSize: "0.64rem", fontFamily: "JetBrains Mono, monospace", color: "var(--steel)" }}>SOURCE: OPENWEATHER AIR POLLUTION API</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "0.6rem", textAlign: "center" }}>
            {[
              { label: "PM2.5", val: `${externalPollution.pm2_5} µg/m³` },
              { label: "PM10", val: `${externalPollution.pm10} µg/m³` },
              { label: "NO₂", val: `${externalPollution.no2} µg/m³` },
              { label: "O₃", val: `${externalPollution.o3} µg/m³` },
              { label: "CO", val: `${externalPollution.co} µg/m³` },
            ].map((p, idx) => (
              <div key={idx} style={{ background: "rgba(0,0,0,0.5)", border: "1px solid var(--border-subtle)", padding: "0.5rem", borderRadius: 2 }}>
                <span style={{ fontSize: "0.62rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)" }}>{p.label}</span>
                <p style={{ fontWeight: 700, fontSize: "0.82rem", fontFamily: "JetBrains Mono, monospace", color: "var(--cloud)", marginTop: 2 }}>{p.val}</p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: "0.66rem", fontFamily: "JetBrains Mono, monospace", color: "var(--steel)", marginTop: "0.6rem" }}>
            * Contextual reference data. Not used as raw input for the trained AeroPure model.
          </p>
        </div>
      )}
    </div>
  );
}
