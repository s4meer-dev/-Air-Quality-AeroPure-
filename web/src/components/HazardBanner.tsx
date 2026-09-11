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
          background: "linear-gradient(135deg, var(--red-deep) 0%, var(--red) 50%, var(--red-bright) 100%)",
          border: "1px solid var(--red-bright)",
          borderRadius: 12,
          padding: "1.5rem 2rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
          <AlertTriangle size={28} color="#FFD6D6" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{
              fontFamily: "Orbitron, sans-serif",
              fontSize: "1rem",
              fontWeight: 700,
              color: "#FFD6D6",
              letterSpacing: "0.06em",
              marginBottom: "0.4rem",
            }}>
              HAZARDOUS AIR DAY ALERT — TOMORROW
            </p>
            <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.3rem" }}>
              {areaName} · AQI Proxy {predictedAqi.toFixed(1)} · {(hazardProbability * 100).toFixed(0)}% Probability
            </p>
            <p style={{ fontSize: "0.85rem", color: "#FFBBBB", lineHeight: 1.6 }}>
              Actionable Advisory: Project-defined elevated-pollution threshold (AQI Proxy ≥ 180.0) exceeded.
              Atmospheric dispersion is constrained. Vulnerable populations should reduce outdoor exertion;
              ventilation adjustments advised.
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
        border: "1px solid var(--gold-dim)",
        borderRadius: 12,
        padding: "1.3rem 2rem",
        marginBottom: "1.5rem",
        boxShadow: "0 0 20px rgba(201,162,39,0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <CheckCircle size={24} color="var(--gold)" style={{ flexShrink: 0 }} />
        <div>
          <p style={{
            fontFamily: "Orbitron, sans-serif",
            fontSize: "0.9rem",
            fontWeight: 700,
            color: "var(--gold)",
            letterSpacing: "0.06em",
            marginBottom: "0.2rem",
          }}>
            ACCEPTABLE / MODERATE AIR PROJECTED — TOMORROW
          </p>
          <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {areaName} · AQI Proxy {predictedAqi.toFixed(1)} · {(hazardProbability * 100).toFixed(0)}% Hazard Probability
          </p>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            Atmospheric dispersion favorable. Outdoor civic activity permissible under standard guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}
