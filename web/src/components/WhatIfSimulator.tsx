"use client";

import { useState } from "react";
import { Loader2, Sliders, ChevronDown, ChevronUp, Wind } from "lucide-react";

interface SimResult {
  predicted_aqi_proxy: number;
  hazard_probability: number;
  hazardous: boolean;
  risk_category: string;
  pollution_regime: string;
  current_aqi_proxy: number;
}

// 5 Core User-Facing Inputs
const DEFAULT_VALUES = {
  co: 2.0,
  no2: 100.0,
  c6h6: 8.0,
  temperature: 20.0,
  relative_humidity: 50.0,
};

// We hide the other required inputs for the API as constants
const HIDDEN_CONTEXT = {
  nox: 200.0,
  hour: 14,
  month: 6,
  day_of_week: 2,
};

const PRESETS = {
  CLEAN: { co: 0.5, no2: 20.0, c6h6: 1.0, temperature: 18.0, relative_humidity: 45.0 },
  NORMAL: { co: 1.5, no2: 80.0, c6h6: 5.0, temperature: 22.0, relative_humidity: 50.0 },
  ELEVATED: { co: 4.0, no2: 150.0, c6h6: 15.0, temperature: 28.0, relative_humidity: 65.0 },
  SEVERE: { co: 8.0, no2: 300.0, c6h6: 40.0, temperature: 35.0, relative_humidity: 80.0 },
};

function Slider({ label, unit, min, max, step, value, onChange }: {
  label: string; unit: string; name?: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: "1.1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
        <label style={{ fontSize: "0.74rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)" }}>{label}</label>
        <span style={{ fontSize: "0.76rem", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "var(--air-white)" }}>
          {value.toFixed(step < 1 ? 1 : 0)} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          accentColor: "var(--air-white)",
          background: "#242423",
          height: 3,
          borderRadius: 1,
          cursor: "pointer",
        }}
      />
    </div>
  );
}

export default function WhatIfSimulator() {
  const [mode, setMode] = useState<"beginner" | "advanced">("beginner");
  const [values, setValues] = useState(DEFAULT_VALUES);
  const [result, setResult] = useState<SimResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTechDetails, setShowTechDetails] = useState(false);

  function set(key: keyof typeof DEFAULT_VALUES) {
    return (v: number) => setValues((prev) => ({ ...prev, [key]: v }));
  }

  function applyPreset(presetName: keyof typeof PRESETS) {
    setValues(PRESETS[presetName]);
    setResult(null); // Clear previous result
  }

  async function runSimulation() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          ...HIDDEN_CONTEXT, // Pass the required hidden context to the API
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Inference failed");
      setResult(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="what-if">
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
        <Sliders size={16} color="var(--air-white)" />
        <p className="section-label" style={{ margin: 0 }}>SCENARIO SIMULATION</p>
      </div>
      <p style={{ fontSize: "0.78rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)", marginBottom: "1.4rem" }}>
        Explore how atmospheric conditions impact the next-day AQI proxy forecast using our production ML model.
      </p>

      {/* Mode Selector */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <button
          onClick={() => setMode("beginner")}
          style={{
            background: mode === "beginner" ? "var(--air-white)" : "transparent",
            color: mode === "beginner" ? "var(--void)" : "var(--silver)",
            border: `1px solid ${mode === "beginner" ? "var(--air-white)" : "var(--steel)"}`,
            padding: "0.4rem 1rem",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "0.75rem",
            cursor: "pointer",
            fontWeight: mode === "beginner" ? 700 : 400,
          }}
        >
          PRESETS (BEGINNER)
        </button>
        <button
          onClick={() => setMode("advanced")}
          style={{
            background: mode === "advanced" ? "var(--air-white)" : "transparent",
            color: mode === "advanced" ? "var(--void)" : "var(--silver)",
            border: `1px solid ${mode === "advanced" ? "var(--air-white)" : "var(--steel)"}`,
            padding: "0.4rem 1rem",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "0.75rem",
            cursor: "pointer",
            fontWeight: mode === "advanced" ? 700 : 400,
          }}
        >
          MANUAL (ADVANCED)
        </button>
      </div>

      {mode === "beginner" ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", marginBottom: "1.5rem" }}>
          {Object.keys(PRESETS).map((key) => (
            <button
              key={key}
              onClick={() => applyPreset(key as keyof typeof PRESETS)}
              style={{
                background: "#111111",
                color: "var(--air-white)",
                border: "1px solid var(--steel)",
                padding: "0.6rem 1.2rem",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "0.7rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <Wind size={12} /> {key.replace("_", " ")}
            </button>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0 2rem", marginBottom: "1.5rem" }}>
          <div>
            <Slider label="CO(GT)" unit="mg/m³" name="co" min={0.2} max={12} step={0.1} value={values.co} onChange={set("co")} />
            <Slider label="NO₂(GT)" unit="µg/m³" name="no2" min={10} max={350} step={5} value={values.no2} onChange={set("no2")} />
            <Slider label="C₆H₆(GT)" unit="µg/m³" name="c6h6" min={0.2} max={50} step={0.5} value={values.c6h6} onChange={set("c6h6")} />
          </div>
          <div>
            <Slider label="Temperature" unit="°C" name="temperature" min={-5} max={45} step={1} value={values.temperature} onChange={set("temperature")} />
            <Slider label="Relative Humidity" unit="%" name="relative_humidity" min={10} max={95} step={5} value={values.relative_humidity} onChange={set("relative_humidity")} />
          </div>
        </div>
      )}

      {/* Technical Details Accordion */}
      <div style={{ marginBottom: "1.5rem", borderTop: "1px solid var(--charcoal)", borderBottom: "1px solid var(--charcoal)" }}>
        <button
          onClick={() => setShowTechDetails(!showTechDetails)}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            padding: "0.8rem 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "var(--silver)",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "0.7rem",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span>TECHNICAL EXPLANATION: MODEL SENSITIVITY</span>
          {showTechDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showTechDetails && (
          <div style={{ padding: "0 0 1rem 0", color: "var(--cloud)", fontSize: "0.75rem", lineHeight: 1.5 }}>
            <p style={{ marginBottom: "0.5rem" }}>
              <strong>AeroPure Architecture (113-Feature XGBoost):</strong>
            </p>
            <p>
              AeroPure evaluates current observations together with historical temporal and rolling lag features. Changing one environmental variable demonstrates predictive model sensitivity, not causal physical intervention.
            </p>
          </div>
        )}
      </div>

      <button
        onClick={runSimulation}
        disabled={loading}
        style={{
          background: "var(--air-white)",
          color: "var(--void)",
          fontFamily: "JetBrains Mono, monospace",
          fontWeight: 800,
          fontSize: "0.8rem",
          letterSpacing: "0.1em",
          padding: "0.65rem 1.6rem",
          borderRadius: 2,
          border: "1px solid #FFFFFF",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          textTransform: "uppercase",
        }}
      >
        {loading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> COMPUTING INFERENCE...</> : "EXECUTE SCENARIO INFERENCE"}
      </button>

      {error && (
        <p style={{ color: "var(--air-white)", fontSize: "0.78rem", fontFamily: "JetBrains Mono, monospace", marginTop: "0.75rem" }}>[ALERT] {error}</p>
      )}

      {result && (
        <div
          style={{
            marginTop: "1.5rem",
            background: "#111111",
            border: result.hazardous ? "2px solid var(--air-white)" : "1px solid var(--border-default)",
            borderRadius: 4,
            padding: "1.4rem 1.6rem",
            boxShadow: result.hazardous ? "0 0 30px rgba(255,255,255,0.15)" : "0 10px 30px rgba(0,0,0,0.6)",
          }}
          className={result.hazardous ? "hazard-pulse" : ""}
        >
          <p style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "0.68rem", fontWeight: 700, color: "var(--silver)",
            letterSpacing: "0.14em", marginBottom: "1rem",
          }}>
            SIMULATION INFERENCE RESULT
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
            <div>
              <p className="section-label">SCENARIO AEROPURE AQI PROXY</p>
              <p style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: "2.6rem", fontWeight: 900,
                color: "var(--air-white)",
                textShadow: "0 0 25px rgba(255,255,255,0.3)",
                lineHeight: 1,
              }}>{result.predicted_aqi_proxy.toFixed(1)}</p>
            </div>
            {result.current_aqi_proxy !== undefined && (
              <div>
                <p className="section-label">BASELINE AEROPURE AQI PROXY</p>
                <p style={{
                  fontFamily: "Orbitron, sans-serif",
                  fontSize: "2.6rem", fontWeight: 900,
                  color: "var(--cloud)",
                  lineHeight: 1,
                }}>{result.current_aqi_proxy.toFixed(1)}</p>
              </div>
            )}
            {result.current_aqi_proxy !== undefined && (
              <div>
                <p className="section-label">CHANGE (Δ AQI PROXY)</p>
                <p style={{
                  fontFamily: "Orbitron, sans-serif",
                  fontSize: "2.6rem", fontWeight: 900,
                  color: "var(--air-white)",
                  lineHeight: 1,
                }}>
                  {result.predicted_aqi_proxy > result.current_aqi_proxy ? "+" : ""}
                  {(result.predicted_aqi_proxy - result.current_aqi_proxy).toFixed(1)}
                </p>
              </div>
            )}
            <div>
              <p className="section-label">HAZARD PROBABILITY</p>
              <p style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: "2.6rem", fontWeight: 900,
                color: result.hazard_probability > 0.5 ? "var(--air-white)" : "var(--cloud)",
                lineHeight: 1,
              }}>{(result.hazard_probability * 100).toFixed(0)}%</p>
            </div>
            <div>
              <p className="section-label">RISK CATEGORY</p>
              <p style={{ fontWeight: 800, fontFamily: "JetBrains Mono, monospace", color: "var(--air-white)", marginTop: "0.3rem" }}>
                {result.risk_category.toUpperCase()}
              </p>
              <p style={{ fontSize: "0.74rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)", marginTop: "0.2rem" }}>
                {result.pollution_regime.toUpperCase()}
              </p>
            </div>
          </div>
          <p style={{
            fontSize: "0.72rem",
            fontFamily: "JetBrains Mono, monospace",
            color: "var(--steel)",
            marginTop: "1.2rem",
            paddingTop: "0.8rem",
            borderTop: "1px solid var(--charcoal)",
            lineHeight: 1.5,
          }}>
            * Methodological Notice: The What-If result represents predictive model sensitivity, NOT physical atmospheric causal intervention.
          </p>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
