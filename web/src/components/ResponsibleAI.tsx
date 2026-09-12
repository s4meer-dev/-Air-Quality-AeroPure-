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
          It is <strong>not</strong> an official CPCB, EPA, or WHO AQI calculation. The ML model is trained on historical
          atmospheric observations (UCI Air Quality Dataset Archive). Location-level operational deployment
          requires calibrated real-world sensor streams.
        </p>
        <p style={{ marginTop: "0.6rem" }}>
          All location forecasts in Demo Mode utilize <strong style={{ color: "var(--air-white)" }}>representative atmospheric baselines</strong>{" "}
          derived from validated K-Means cluster centroid statistics. These serve as <strong>model inputs</strong>, not direct
          in-situ measurements for any specific municipality. Predictions are model outputs and do not constitute
          medical or regulatory directives.
        </p>
        <p style={{ marginTop: "0.6rem" }}>
          <strong style={{ color: "var(--air-white)" }}>SHAP attributions</strong> reflect tree feature attribution rather than
          physical atmospheric causality. The hazard ceiling of 180.0 is an academic project-defined elevated-pollution marker.
        </p>
        <p style={{ marginTop: "0.6rem", color: "var(--steel)" }}>
          AeroPure v1.0.0 — Atmospheric Research Architecture · XGBoost Regressor (RMSE 39.27) + Classifier (F1 0.683)
          · 113 leakage-safe features · Evaluated on 9,333 hourly observations.
        </p>
      </div>
    </div>
  );
}
