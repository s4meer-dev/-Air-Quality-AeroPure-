"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import { Info } from "lucide-react";

interface FeatureContribution {
  feature: string;
  feature_value: number;
  contribution: number;
}

interface Props {
  positiveContributors: FeatureContribution[];
  negativeContributors: FeatureContribution[];
  summary: string;
  baseValue?: number | null;
}

function formatFeatureName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace("co ", "CO ")
    .replace("no2 ", "NO₂ ")
    .replace("c6h6 ", "C₆H₆ ")
    .replace("nox ", "NOx ")
    .replace("pt08", "PT08")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .slice(0, 24);
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: FeatureContribution & { displayName: string } }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div
      style={{
        background: "#111111",
        border: "1px solid var(--border-strong)",
        borderRadius: 2,
        padding: "0.75rem 1rem",
        fontSize: "0.76rem",
        fontFamily: "JetBrains Mono, monospace",
        boxShadow: "0 8px 24px rgba(0,0,0,0.85)",
      }}
    >
      <p style={{ color: "var(--air-white)", fontWeight: 700, marginBottom: "0.3rem" }}>{d.displayName}</p>
      <p style={{ color: "var(--silver)" }}>OBSERVED VALUE: <span style={{ color: "var(--air-white)" }}>{d.feature_value.toFixed(3)}</span></p>
      <p style={{ color: d.contribution > 0 ? "var(--air-white)" : "var(--mist)", fontWeight: 700 }}>
        SHAP ATTRIBUTION: {d.contribution > 0 ? "+" : ""}{d.contribution.toFixed(3)}
      </p>
    </div>
  );
}

export default function ShapExplainer({ positiveContributors, negativeContributors, summary, baseValue }: Props) {
  const allContribs = [
    ...positiveContributors.map((c) => ({ ...c, type: "pos" })),
    ...negativeContributors.map((c) => ({ ...c, type: "neg" })),
  ].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  const chartData = allContribs.map((c) => ({
    ...c,
    displayName: formatFeatureName(c.feature),
  }));

  return (
    <div id="explainability">
      <p className="section-label" style={{ marginBottom: "0.8rem" }}>FEATURE ATTRIBUTION & EXPLAINABILITY (SHAP)</p>

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-default)",
          borderRadius: 4,
          padding: "1.2rem 1.5rem",
          marginBottom: "1rem",
        }}
      >
        <p style={{ fontSize: "0.84rem", fontFamily: "JetBrains Mono, monospace", color: "var(--cloud)", lineHeight: 1.65, marginBottom: "0.75rem" }}>
          {summary}
        </p>
        {baseValue != null && (
          <p style={{ fontSize: "0.74rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)" }}>
            SHAP BASE VALUE (MODEL EXPECTED OUTPUT): <strong style={{ color: "var(--air-white)" }}>{baseValue.toFixed(2)}</strong>
          </p>
        )}
      </div>

      {chartData.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 32)}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <XAxis
                type="number"
                tick={{ fill: "#929292", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                axisLine={{ stroke: "#242423" }}
                tickLine={false}
                tickFormatter={(v) => v.toFixed(1)}
              />
              <YAxis
                dataKey="displayName"
                type="category"
                tick={{ fill: "#D9D9D6", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                axisLine={false}
                tickLine={false}
                width={130}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={0} stroke="#41413F" />
              <Bar dataKey="contribution" radius={[0, 2, 2, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.contribution > 0 ? "#D9D9D6" : "#41413F"}
                    opacity={entry.contribution > 0 ? 0.95 : 0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Attribution Legend */}
      <div style={{ display: "flex", gap: "1.5rem", marginBottom: "0.8rem", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <div style={{ width: 12, height: 8, background: "#D9D9D6", borderRadius: 1 }} />
          <span style={{ fontSize: "0.7rem", fontFamily: "JetBrains Mono, monospace", color: "var(--cloud)" }}>POSITIVE ATTRIBUTION (LIGHT GREY)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <div style={{ width: 12, height: 8, background: "#41413F", borderRadius: 1 }} />
          <span style={{ fontSize: "0.7rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)" }}>NEGATIVE ATTRIBUTION (DARK GREY)</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.5rem",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 3,
          padding: "0.75rem 1rem",
        }}
      >
        <Info size={14} color="var(--silver)" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: "0.72rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)", lineHeight: 1.6 }}>
          SHAP values represent <strong>model feature contribution</strong>, not physical causality.
          Positive (light grey) contributions push the forecast higher; negative (dark grey) contributions lower it.
          Computed via XGBoost TreeExplainer — mathematically exact for tree models.
        </p>
      </div>
    </div>
  );
}
