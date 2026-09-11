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
  payload?: Array<{ payload: FeatureContribution }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 8, padding: "0.75rem 1rem", fontSize: "0.8rem",
      boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
    }}>
      <p style={{ color: "var(--gold)", fontWeight: 700, marginBottom: "0.3rem" }}>{d.feature}</p>
      <p style={{ color: "var(--text-muted)" }}>Value: <span style={{ color: "var(--text-primary)" }}>{d.feature_value.toFixed(3)}</span></p>
      <p style={{ color: d.contribution > 0 ? "var(--red-bright)" : "var(--gold-bright)" }}>
        SHAP: {d.contribution > 0 ? "+" : ""}{d.contribution.toFixed(3)}
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
      <p className="section-label" style={{ marginBottom: "0.8rem" }}>WHY THIS FORECAST?</p>

      <div className="card-gold" style={{ marginBottom: "1rem" }}>
        <p style={{ fontSize: "0.88rem", color: "var(--text-body)", lineHeight: 1.65, marginBottom: "0.75rem" }}>
          {summary}
        </p>
        {baseValue != null && (
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            SHAP Base Value (model expected output): <strong style={{ color: "var(--gold)" }}>{baseValue.toFixed(2)}</strong>
          </p>
        )}
      </div>

      {chartData.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 32)}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <XAxis
                type="number"
                tick={{ fill: "#9A9A9A", fontSize: 11 }}
                axisLine={{ stroke: "#292929" }}
                tickLine={false}
                tickFormatter={(v) => v.toFixed(1)}
              />
              <YAxis
                dataKey="displayName"
                type="category"
                tick={{ fill: "#DEDEDE", fontSize: 11, fontFamily: "Inter, sans-serif" }}
                axisLine={false}
                tickLine={false}
                width={130}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={0} stroke="#292929" />
              <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.contribution > 0 ? "var(--red-bright)" : "var(--gold)"}
                    opacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{
        display: "flex", alignItems: "flex-start", gap: "0.5rem",
        background: "var(--bg-elevated)", borderRadius: 8,
        padding: "0.75rem 1rem", marginTop: "0.5rem",
      }}>
        <Info size={14} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
          SHAP values represent <strong>model feature contribution</strong>, not physical causality.
          Positive (red) contributions push the forecast higher; negative (gold) contributions lower it.
          Computed via XGBoost TreeExplainer — mathematically exact for tree models.
        </p>
      </div>
    </div>
  );
}
