"use client";

import { FlaskConical } from "lucide-react";

export default function DemoModeBanner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid var(--border-default)",
        borderRadius: 3,
        padding: "0.8rem 1.1rem",
        marginBottom: "1.5rem",
      }}
    >
      <FlaskConical size={16} color="var(--silver)" style={{ flexShrink: 0 }} />
      <div>
        <span
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "0.68rem",
            fontWeight: 800,
            letterSpacing: "0.14em",
            color: "var(--air-white)",
          }}
        >
          MODEL DEMONSTRATION MODE ACTIVE
        </span>
        <p style={{ fontSize: "0.74rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)", marginTop: "0.15rem" }}>
          All forecasts utilize the audited AeroPure XGBoost ML pipeline with representative atmospheric
          baselines derived from historical cluster means. This represents <strong style={{ color: "var(--air-white)" }}>simulated baseline inputs</strong> —
          live telemetry requires configured in-situ sensor networks.
        </p>
      </div>
    </div>
  );
}
