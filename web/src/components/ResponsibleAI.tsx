"use client";

import { Shield } from "lucide-react";

export default function ResponsibleAI() {
  return (
    <div
      id="methodology"
      style={{
        marginTop: "3rem",
        borderTop: "1px solid var(--border)",
        paddingTop: "2rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        <Shield size={16} color="var(--gold-dim)" />
        <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-muted)" }}>
          RESPONSIBLE AI — TRANSPARENCY STATEMENT
        </p>
      </div>
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-dim)",
          borderRadius: 10,
          padding: "1.2rem 1.5rem",
          fontSize: "0.78rem",
          color: "var(--text-muted)",
          lineHeight: 1.85,
        }}
      >
        <p>
          <strong style={{ color: "var(--gold-bright)" }}>AeroPure provides a Pollutant-Based Air Quality Index Proxy.</strong>{" "}
          It is <strong>not</strong> an official CPCB, EPA, or WHO AQI calculation. The current ML model is trained on historical
          single-station atmospheric observations (Archive 1 — UCI Air Quality Dataset). Location-level deployment
          requires compatible real-world pollutant and meteorological sensor inputs.
        </p>
        <p style={{ marginTop: "0.6rem" }}>
          All location forecasts in Demo Mode use <strong style={{ color: "var(--gold)" }}>representative atmospheric baselines</strong>{" "}
          derived from validated K-Means cluster mean statistics. These are <strong>model inputs</strong>, not claimed real-time
          measurements for any city or area. Predictions are XGBoost model outputs and should not be interpreted as
          medical or regulatory advice.
        </p>
        <p style={{ marginTop: "0.6rem" }}>
          <strong style={{ color: "var(--gold-bright)" }}>SHAP explanations</strong> represent model feature contribution,
          not physical causality. The index threshold of 180.0 is a project-defined elevated-pollution marker,
          not an official regulatory standard.
        </p>
        <p style={{ marginTop: "0.6rem", color: "var(--text-faint)" }}>
          AeroPure v1.0.0 — Academic ML Project · XGBoost Regressor (RMSE 39.27) + Classifier (F1 0.683)
          · 113 leakage-safe features · Trained on 9,333 hourly observations.
        </p>
      </div>
    </div>
  );
}
