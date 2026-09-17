"use client";

import { Shield } from "lucide-react";

export default function ResponsibleAI() {
  return (
    <div
      id="methodology"
      style={{
        marginTop: "3rem",
        borderTop: "1px solid var(--border-default)",
        paddingTop: "2rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        <Shield size={16} color="var(--silver)" />
        <p style={{ fontSize: "0.72rem", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, letterSpacing: "0.14em", color: "var(--silver)" }}>
          RESPONSIBLE AI & METHODOLOGICAL SPECIFICATION
        </p>
      </div>
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-default)",
          borderRadius: 4,
          padding: "1.4rem 1.6rem",
          fontSize: "0.78rem",
          fontFamily: "JetBrains Mono, monospace",
          color: "var(--silver)",
          lineHeight: 1.85,
        }}
      >
        <p>
          <strong style={{ color: "var(--air-white)" }}>AeroPure provides a Pollutant-Based Air Quality Index Proxy.</strong>{" "}
          AeroPure produces a pollutant-based AQI proxy because the primary training dataset does not contain direct PM2.5 / PM10
          particulate measurements required to claim an official composite AQI. The proxy is calculated from criteria pollutants:
          CO(GT) in mg/m³, NO2(GT) in µg/m³, and C6H6(GT) in µg/m³, with composite defined as the maximum pollutant subindex:{" "}
          <code>max(i_co, i_no2, i_c6h6)</code>. It is <strong>not</strong> an official CPCB, EPA, or WHO regulatory AQI.
        </p>
        <p style={{ marginTop: "0.6rem" }}>
          All location forecasts in Demo Mode utilize <strong style={{ color: "var(--air-white)" }}>representative atmospheric baselines</strong>{" "}
          derived from validated K-Means cluster centroid statistics. These serve as <strong>model inputs</strong>, not direct
          in-situ measurements for any specific municipality. Predictions are model outputs and do not constitute
          medical or regulatory directives. External live air-quality telemetry (e.g. OpenWeather) is completely separate
          from AeroPure model outputs and is never merged or averaged.
        </p>
        <p style={{ marginTop: "0.6rem" }}>
          <strong style={{ color: "var(--air-white)" }}>SHAP attributions</strong> reflect tree feature attribution within the XGBoost ensemble rather than
          physical atmospheric causality. The hazard threshold of <strong style={{ color: "var(--air-white)" }}>180.0</strong> is an academic project-defined elevated-pollution marker
          (~75th percentile of observational data), not a universal regulatory AQI threshold.
        </p>
        <p style={{ marginTop: "0.6rem", color: "var(--steel)" }}>
          AeroPure v1.0.0 — Atmospheric Research Architecture · XGBoost Regressor (RMSE 39.27) + Classifier (F1 0.683)
          · 113 leakage-safe features · Evaluated on 9,333 hourly observations.
        </p>
      </div>
    </div>
  );
}
