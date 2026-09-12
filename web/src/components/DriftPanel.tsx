"use client";

import { Activity } from "lucide-react";

interface Props {
  driftStatus: string;
  meanPsi: number;
  retrainingFlagged: boolean;
  recommendation: string;
  significantDriftFeatures: string[];
  psiByFeature: Record<string, number>;
}

function getPsiTonalStyle(value: number): { label: string; color: string; barColor: string } {
  if (value > 0.25) {
    // SIGNIFICANT DRIFT — High-contrast white
    return { label: "SIGNIFICANT DRIFT", color: "var(--air-white)", barColor: "#FFFFFF" };
  }
  if (value > 0.1) {
    // MONITOR — Brighter grey
    return { label: "MONITOR", color: "var(--cloud)", barColor: "var(--mist)" };
  }
  // STABLE — Muted grey
  return { label: "STABLE", color: "var(--silver)", barColor: "var(--steel)" };
}

function PsiBar({ name, value }: { name: string; value: number }) {
  const { label, color, barColor } = getPsiTonalStyle(value);
  const barWidth = Math.min(100, (value / 1.0) * 100);

  return (
    <div style={{ marginBottom: "0.85rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
        <span style={{ fontSize: "0.76rem", fontFamily: "JetBrains Mono, monospace", color: "var(--cloud)" }}>
          {name.replace("(GT)", "").replace("_", " ").toUpperCase()}
        </span>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.7rem", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color }}>
            {label}
          </span>
          <span style={{ fontSize: "0.76rem", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "var(--air-white)" }}>
            {value.toFixed(4)}
          </span>
        </div>
      </div>
      <div style={{ height: 3, background: "#242423", borderRadius: 1, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${barWidth}%`, background: barColor, borderRadius: 1, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

export default function DriftPanel({ driftStatus, meanPsi, retrainingFlagged, recommendation, psiByFeature }: Props) {
  const isSignificant = retrainingFlagged;

  return (
    <div id="model-health">
      <p className="section-label" style={{ marginBottom: "1rem" }}>MODEL INTEGRITY & DISTRIBUTION DRIFT SURVEILLANCE</p>

      {/* Status header */}
      <div
        style={{
          background: isSignificant ? "#111111" : "var(--bg-card)",
          border: isSignificant ? "2px solid var(--air-white)" : "1px solid var(--border-default)",
          borderRadius: 4,
          padding: "1.4rem 1.6rem",
          marginBottom: "1rem",
          boxShadow: isSignificant ? "0 0 30px rgba(255,255,255,0.15)" : "0 10px 30px rgba(0,0,0,0.6)",
        }}
        className={isSignificant ? "hazard-pulse" : ""}
      >
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <p style={{
              fontFamily: "Orbitron, sans-serif",
              fontSize: "0.95rem",
              fontWeight: 900,
              color: "var(--air-white)",
              letterSpacing: "0.08em",
            }}>
              GOVERNANCE STATUS: {driftStatus.toUpperCase()}
            </p>
            <span
              style={{
                fontSize: "0.65rem",
                fontFamily: "JetBrains Mono, monospace",
                fontWeight: 800,
                padding: "0.2rem 0.6rem",
                borderRadius: 2,
                background: isSignificant ? "#FFFFFF" : "rgba(255,255,255,0.06)",
                color: isSignificant ? "#000000" : "var(--cloud)",
                border: isSignificant ? "1px solid #FFFFFF" : "1px solid var(--border-default)",
                letterSpacing: "0.1em",
              }}
            >
              {isSignificant ? "RETRAINING FLAGGED" : "NOMINAL REGIME"}
            </span>
          </div>

          <p style={{ fontSize: "0.8rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)" }}>
            MEAN PSI METRIC: <strong style={{ color: "var(--air-white)" }}>{meanPsi.toFixed(4)}</strong> ·{" "}
            DISTRIBUTION STABILITY: <strong style={{ color: "var(--air-white)" }}>{retrainingFlagged ? "ANOMALOUS DRIFT" : "STABLE COMPLIANCE"}</strong>
          </p>
          <p style={{ fontSize: "0.76rem", fontFamily: "JetBrains Mono, monospace", color: "var(--cloud)", marginTop: "0.3rem" }}>{recommendation}</p>
        </div>
      </div>

      {/* Per-feature PSI bars */}
      {Object.keys(psiByFeature).length > 0 && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 4, padding: "1.4rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.2rem" }}>
            <Activity size={15} color="var(--air-white)" />
            <p style={{ fontSize: "0.76rem", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "var(--air-white)", letterSpacing: "0.08em" }}>
              FEATURE POPULATION STABILITY INDEX (PSI)
            </p>
          </div>
          {Object.entries(psiByFeature).map(([feat, psi]) => (
            <PsiBar key={feat} name={feat} value={psi} />
          ))}
        </div>
      )}

      <div style={{
        background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: 3,
        padding: "0.9rem 1.1rem", fontSize: "0.72rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)", lineHeight: 1.7,
      }}>
        <strong style={{ color: "var(--air-white)" }}>TONAL HIERARCHY INTERPRETATION:</strong>{" "}
        PSI &lt; 0.10 (STABLE · MUTED GREY) · 0.10–0.25 (MONITOR · BRIGHTER GREY) · &gt; 0.25 (SIGNIFICANT DRIFT · HIGH-CONTRAST WHITE)<br />
        Surveillance checks statistical divergence between training distributions and live inputs.
      </div>
    </div>
  );
}
