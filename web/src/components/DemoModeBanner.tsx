"use client";

import { FlaskConical } from "lucide-react";

export default function DemoModeBanner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        background: "rgba(201,162,39,0.06)",
        border: "1px solid var(--gold-dim)",
        borderRadius: 10,
        padding: "0.85rem 1.2rem",
        marginBottom: "1.5rem",
      }}
    >
      <FlaskConical size={18} color="var(--gold)" style={{ flexShrink: 0 }} />
      <div>
        <span
          style={{
            fontFamily: "Orbitron, sans-serif",
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "var(--gold)",
          }}
        >
          MODEL DEMONSTRATION MODE
        </span>
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
          All forecasts use the validated AeroPure XGBoost ML pipeline with representative atmospheric
          baselines derived from historical training cluster means. This is <strong style={{ color: "var(--gold-bright)" }}>not live location data</strong> —
          live sensor integration requires a configured real-time pollutant data provider.
        </p>
      </div>
    </div>
  );
}
