"use client";

import { useState } from "react";
import { Loader2, FlaskConical } from "lucide-react";

interface SimResult {
  predicted_aqi_proxy: number;
  hazard_probability: number;
  hazardous: boolean;
  risk_category: string;
  pollution_regime: string;
}

const DEFAULT_VALUES = {
  co: 2.0,
  no2: 100.0,
  c6h6: 8.0,
  nox: 200.0,
  temperature: 20.0,
  relative_humidity: 50.0,
  hour: 14,
  month: 6,
  day_of_week: 2,
};

function Slider({ label, unit, min, max, step, value, onChange }: {
  label: string; unit: string; name?: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
        <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{label}</label>
        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--gold)" }}>
          {value.toFixed(step < 1 ? 1 : 0)} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          accentColor: "var(--gold)",
          background: "var(--bg-elevated)",
          height: 4,
          borderRadius: 2,
          cursor: "pointer",
        }}
      />
    </div>
  );
}

export default function WhatIfSimulator() {
  const [values, setValues] = useState(DEFAULT_VALUES);
  const [result, setResult] = useState<SimResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(key: keyof typeof DEFAULT_VALUES) {
    return (v: number) => setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function runSimulation() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          co: values.co,
          no2: values.no2,
          c6h6: values.c6h6,
          nox: values.nox,
          temperature: values.temperature,
          relative_humidity: values.relative_humidity,
          hour: values.hour,
          month: values.month,
          day_of_week: values.day_of_week,
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
        <FlaskConical size={18} color="var(--gold)" />
        <p className="section-label" style={{ margin: 0 }}>ADVANCED SIMULATION — WHAT-IF SCENARIO</p>
      </div>
      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.2rem" }}>
        Adjust atmospheric inputs to explore model sensitivity. Results are live AeroPure ML inference.{" "}
        <strong style={{ color: "var(--gold)" }}>Not a real-world causal intervention.</strong>
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0 2rem" }}>
        <div>
          <Slider label="CO(GT)" unit="mg/m³" name="co" min={0.2} max={12} step={0.1} value={values.co} onChange={set("co")} />
          <Slider label="NO₂(GT)" unit="µg/m³" name="no2" min={10} max={350} step={5} value={values.no2} onChange={set("no2")} />
          <Slider label="C₆H₆(GT)" unit="µg/m³" name="c6h6" min={0.2} max={50} step={0.5} value={values.c6h6} onChange={set("c6h6")} />
        </div>
        <div>
          <Slider label="NOx(GT)" unit="ppb" name="nox" min={10} max={1000} step={10} value={values.nox} onChange={set("nox")} />
          <Slider label="Temperature" unit="°C" name="temperature" min={-5} max={45} step={1} value={values.temperature} onChange={set("temperature")} />
          <Slider label="Relative Humidity" unit="%" name="relative_humidity" min={10} max={95} step={5} value={values.relative_humidity} onChange={set("relative_humidity")} />
        </div>
        <div>
          <Slider label="Hour of Day" unit="h" name="hour" min={0} max={23} step={1} value={values.hour} onChange={set("hour")} />
          <Slider label="Month" unit="" name="month" min={1} max={12} step={1} value={values.month} onChange={set("month")} />
          <Slider label="Day of Week (0=Mon)" unit="" name="day_of_week" min={0} max={6} step={1} value={values.day_of_week} onChange={set("day_of_week")} />
        </div>
      </div>

      <button
        className="btn-gold"
        onClick={runSimulation}
        disabled={loading}
        style={{ marginTop: "0.75rem" }}
      >
        {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Running Inference...</> : "🚀 Run Live Forecast"}
      </button>

      {error && (
        <p style={{ color: "var(--red-bright)", fontSize: "0.82rem", marginTop: "0.75rem" }}>⚠ {error}</p>
      )}

      {result && (
        <div style={{
          marginTop: "1.5rem", background: "var(--bg-elevated)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "1.2rem 1.5rem",
        }}>
          <p style={{
            fontFamily: "Orbitron, sans-serif",
            fontSize: "0.7rem", fontWeight: 700, color: "var(--gold)",
            letterSpacing: "0.14em", marginBottom: "1rem",
          }}>
            — SIMULATION RESULT —
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
            <div>
              <p className="section-label">FORECAST AQI PROXY</p>
              <p style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: "2.6rem", fontWeight: 900,
                color: result.hazardous ? "var(--red-bright)" : "var(--gold)",
                textShadow: "0 0 20px currentColor",
              }}>{result.predicted_aqi_proxy.toFixed(1)}</p>
            </div>
            <div>
              <p className="section-label">HAZARD PROBABILITY</p>
              <p style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: "2.6rem", fontWeight: 900,
                color: result.hazard_probability > 0.5 ? "var(--red-bright)" : "var(--gold)",
              }}>{(result.hazard_probability * 100).toFixed(0)}%</p>
            </div>
            <div>
              <p className="section-label">RISK CATEGORY</p>
              <p style={{ fontWeight: 700, color: result.hazardous ? "var(--red-bright)" : "var(--gold)", marginTop: "0.4rem" }}>
                {result.risk_category}
              </p>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                {result.pollution_regime}
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
