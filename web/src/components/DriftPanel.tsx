"use client";

import { AlertTriangle, Activity, CheckCircle } from "lucide-react";

interface Props {
  driftStatus: string;
  meanPsi: number;
  retrainingFlagged: boolean;
  recommendation: string;
  significantDriftFeatures: string[];
  psiByFeature: Record<string, number>;
}

function PsiBar({ name, value }: { name: string; value: number }) {
  const color = value > 0.25 ? "var(--red-bright)" : value > 0.1 ? "#E8A020" : "var(--gold)";
  const label = value > 0.25 ? "Significant" : value > 0.1 ? "Monitor" : "Stable";
  const barWidth = Math.min(100, (value / 1.0) * 100);

  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
        <span style={{ fontSize: "0.8rem", color: "var(--text-body)" }}>
          {name.replace("(GT)", "").replace("_", " ")}
        </span>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.78rem", color }}>
            {label}
          </span>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color }}>
            {value.toFixed(4)}
          </span>
        </div>
      </div>
      <div style={{ height: 4, background: "var(--bg-elevated)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${barWidth}%`, background: color, borderRadius: 2, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

export default function DriftPanel({ driftStatus, meanPsi, retrainingFlagged, recommendation, psiByFeature }: Props) {
  const isAlert = retrainingFlagged;
  const statusColor = isAlert ? "var(--red-bright)" : "var(--gold)";
  const Icon = isAlert ? AlertTriangle : CheckCircle;

  return (
    <div id="model-health">
      <p className="section-label" style={{ marginBottom: "1rem" }}>MODEL HEALTH & DRIFT MONITORING</p>

      {/* Status header */}
      <div
        style={{
          background: isAlert ? "linear-gradient(135deg,#120000,#1a0000)" : "var(--bg-card)",
          border: `1px solid ${statusColor}40`,
          borderRadius: 12,
          padding: "1.3rem 1.5rem",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "flex-start",
          gap: "1rem",
        }}
      >
        <Icon size={22} color={statusColor} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{
            fontFamily: "Orbitron, sans-serif",
            fontSize: "0.95rem",
            fontWeight: 700,
            color: statusColor,
            letterSpacing: "0.06em",
            marginBottom: "0.3rem",
          }}>
            {driftStatus.toUpperCase()}
          </p>
          <p style={{ fontSize: "0.84rem", color: "var(--text-body)" }}>
            Mean PSI: <strong style={{ color: statusColor }}>{meanPsi.toFixed(4)}</strong> ·{" "}
            Retraining: <strong style={{ color: statusColor }}>{retrainingFlagged ? "FLAGGED" : "STABLE"}</strong>
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>{recommendation}</p>
        </div>
      </div>

      {/* Per-feature PSI bars */}
      {Object.keys(psiByFeature).length > 0 && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Activity size={16} color="var(--gold)" />
            <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-body)" }}>
              Feature Population Stability Index (PSI)
            </p>
          </div>
          {Object.entries(psiByFeature).map(([feat, psi]) => (
            <PsiBar key={feat} name={feat} value={psi} />
          ))}
        </div>
      )}

      <div style={{
        background: "var(--bg-elevated)", borderRadius: 8,
        padding: "0.9rem 1.1rem", fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.7,
      }}>
        <strong style={{ color: "var(--gold)" }}>PSI Interpretation:</strong>{" "}
        PSI &lt; 0.10 = Stable · 0.10–0.25 = Monitor · &gt; 0.25 = Significant Drift<br />
        Drift monitoring identifies distribution changes between training data and incoming inputs
        that may warrant human review and seasonal model retraining.
      </div>
    </div>
  );
}
