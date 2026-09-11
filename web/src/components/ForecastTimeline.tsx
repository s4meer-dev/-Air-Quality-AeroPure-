"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

export interface ForecastPoint {
  hourOffset: number;
  label: string;
  time: string;
  predicted_aqi_proxy: number;
  hazard_probability: number;
  hazardous: boolean;
  risk_category: string;
}

interface Props {
  timeline: ForecastPoint[];
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ForecastPoint }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d: ForecastPoint = payload[0]?.payload;
  if (!d) return null;

  const isHazard = d.hazardous;
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${isHazard ? "var(--red)" : "var(--gold-dim)"}`,
        borderRadius: 10,
        padding: "0.9rem 1.2rem",
        fontSize: "0.82rem",
        boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
      }}
    >
      <p style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, color: "var(--gold)", marginBottom: "0.4rem" }}>
        {d.label} — {d.time}
      </p>
      <p style={{ color: isHazard ? "var(--red-bright)" : "var(--gold-bright)", fontWeight: 700, fontSize: "1.15rem" }}>
        {d.predicted_aqi_proxy.toFixed(1)} AQI Proxy
      </p>
      <p style={{ color: "var(--text-muted)", marginTop: "0.2rem" }}>
        Hazard: {(d.hazard_probability * 100).toFixed(0)}% · {d.risk_category}
      </p>
    </div>
  );
}

export default function ForecastTimeline({ timeline }: Props) {
  if (!timeline.length) return null;

  const HAZARD_THRESHOLD = 180;

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <p className="section-label">MODEL-ESTIMATED FORECAST TIMELINE</p>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          Discrete 6-point model inference across candidate time steps · Hover for details
        </p>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={timeline} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
          <XAxis
            dataKey="label"
            tick={{ fill: "#9A9A9A", fontSize: 12, fontFamily: "Inter, sans-serif" }}
            axisLine={{ stroke: "#292929" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#9A9A9A", fontSize: 11, fontFamily: "Inter, sans-serif" }}
            axisLine={false}
            tickLine={false}
            width={45}
            tickFormatter={(v) => v.toFixed(0)}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={HAZARD_THRESHOLD}
            stroke="var(--red)"
            strokeDasharray="6 3"
            label={{
              value: "⚠ HAZARD 180",
              position: "right",
              fill: "var(--red-bright)",
              fontSize: 11,
              fontFamily: "Inter, sans-serif",
            }}
          />
          <Line
            type="monotone"
            dataKey="predicted_aqi_proxy"
            stroke="var(--gold)"
            strokeWidth={2.5}
            dot={(props) => {
              const { cx, cy, payload } = props;
              const isHazard = (payload as ForecastPoint).hazardous;
              return (
                <circle
                  key={`dot-${payload.hourOffset}`}
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill={isHazard ? "var(--red-bright)" : "var(--gold)"}
                  stroke={isHazard ? "var(--red-deep)" : "var(--bg-void)"}
                  strokeWidth={2}
                />
              );
            }}
            activeDot={{ r: 7, fill: "var(--gold-bright)", stroke: "var(--bg-void)", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.75rem", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <div style={{ width: 24, height: 2, background: "var(--gold)", borderRadius: 1 }} />
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>AQI Proxy Forecast</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--red-bright)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Hazardous Point</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <div style={{ width: 16, height: 1, background: "var(--red)", borderTop: "1px dashed var(--red)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Threshold (180)</span>
        </div>
      </div>
    </div>
  );
}
