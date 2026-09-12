"use client";

import { AlertTriangle, CheckCircle } from "lucide-react";

interface Props {
  hazardous: boolean;
  hazardProbability: number;
  predictedAqi: number;
  areaName: string;
}

export default function HazardBanner({ hazardous, hazardProbability, predictedAqi, areaName }: Props) {
  if (hazardous) {
    return (
      <div
        className="hazard-pulse"
        style={{
          background: "#111111",
          border: "2px solid var(--air-white)",
          borderRadius: 4,
          padding: "1.4rem 1.8rem",
          marginBottom: "1.5rem",
          boxShadow: "0 0 35px rgba(255, 255, 255, 0.18)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
          <div
            style={{
              padding: "0.4rem",
              borderRadius: 2,
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid var(--air-white)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={24} color="var(--air-white)" />
          </div>
          <div>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "0.72rem",
                fontWeight: 800,
                color: "var(--air-white)",
                letterSpacing: "0.14em",
                display: "inline-block",
                marginBottom: "0.3rem",
              }}
            >
              CRITICAL ATMOSPHERIC ALERT — ELEVATED DISPERSION CONSTRAINT
            </span>
            <p
              style={{
                fontSize: "1.25rem",
                fontWeight: 900,
                fontFamily: "Orbitron, sans-serif",
                color: "var(--air-white)",
                marginBottom: "0.3rem",
                letterSpacing: "0.04em",
              }}
            >
              {areaName.toUpperCase()} · AQI PROXY {predictedAqi.toFixed(1)} · {(hazardProbability * 100).toFixed(0)}% HAZARD RISK
            </p>
            <p style={{ fontSize: "0.82rem", fontFamily: "JetBrains Mono, monospace", color: "var(--cloud)", lineHeight: 1.6 }}>
              Actionable Advisory: Project-defined elevated-pollution threshold (AQI Proxy ≥ 180.0) exceeded.
              Atmospheric stagnation trapped particulate matter. Reduced outdoor exposure and HVAC recirculation advised.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
        borderRadius: 4,
        padding: "1.2rem 1.8rem",
        marginBottom: "1.5rem",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <CheckCircle size={20} color="var(--silver)" style={{ flexShrink: 0 }} />
        <div>
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "0.68rem",
              fontWeight: 700,
              color: "var(--silver)",
              letterSpacing: "0.12em",
              display: "inline-block",
              marginBottom: "0.15rem",
            }}
          >
            ATMOSPHERIC REGIME STABLE
          </span>
          <p style={{ fontSize: "0.92rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--air-white)" }}>
            {areaName.toUpperCase()} · AQI PROXY {predictedAqi.toFixed(1)} · {(hazardProbability * 100).toFixed(0)}% HAZARD RISK
          </p>
          <p style={{ fontSize: "0.78rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)", marginTop: "0.2rem" }}>
            Atmospheric mixing active. Pollutant concentration safely within nominal dispersion limits.
          </p>
        </div>
      </div>
    </div>
  );
}
