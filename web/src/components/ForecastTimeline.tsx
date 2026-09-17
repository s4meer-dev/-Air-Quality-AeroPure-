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
        background: "#111111",
        border: isHazard ? "1px solid var(--air-white)" : "1px solid var(--border-strong)",
        borderRadius: 3,
        padding: "0.8rem 1.1rem",
        fontSize: "0.8rem",
        fontFamily: "JetBrains Mono, monospace",
        boxShadow: "0 8px 30px rgba(0,0,0,0.85)",
      }}
    >
      <p style={{ fontWeight: 700, color: "var(--silver)", marginBottom: "0.3rem" }}>
        {d.label} — {d.time}
      </p>
      <p style={{ color: "var(--air-white)", fontWeight: 900, fontSize: "1.2rem", fontFamily: "Orbitron, sans-serif" }}>
        {d.predicted_aqi_proxy.toFixed(1)} <span style={{ fontSize: "0.75rem", fontFamily: "JetBrains Mono, monospace" }}>AQI PROXY</span>
      </p>
      <p style={{ color: "var(--silver)", marginTop: "0.2rem", fontSize: "0.72rem" }}>
        HAZARD PROB: {(d.hazard_probability * 100).toFixed(0)}% · {d.risk_category.toUpperCase()}
      </p>
    </div>
  );
}

export default function ForecastTimeline({ timeline }: Props) {
  if (!timeline.length) return null;

  const HAZARD_THRESHOLD = 180;

  return (
    <div>
      <div style={{ marginBottom: "1.2rem" }}>
        <p className="section-label">ATMOSPHERIC FORECAST TRAJECTORY</p>
        <p style={{ fontSize: "0.78rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)" }}>
          Discrete 6-point model inference timeline across candidate time steps · Hover for details
        </p>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={timeline} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="#242423" />
          <XAxis
            dataKey="label"
            tick={{ fill: "#929292", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
            axisLine={{ stroke: "#242423" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#929292", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
            axisLine={false}
            tickLine={false}
            width={45}
            tickFormatter={(v) => v.toFixed(0)}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={HAZARD_THRESHOLD}
            stroke="#6D6D6A"
            strokeDasharray="4 4"
            label={{
              value: "AEROPURE ELEVATED THRESHOLD 180.0",
              position: "right",
              fill: "#D9D9D6",
              fontSize: 10,
              fontFamily: "JetBrains Mono, monospace",
              letterSpacing: "0.08em",
            }}
          />
          <Line
            type="monotone"
            dataKey="predicted_aqi_proxy"
            stroke="#F2F2F0"
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload } = props;
              const isHazard = (payload as ForecastPoint).hazardous;
              return (
                <circle
                  key={`dot-${payload.hourOffset}`}
                  cx={cx}
                  cy={cy}
                  r={isHazard ? 6 : 4}
                  fill={isHazard ? "#FFFFFF" : "#929292"}
                  stroke={isHazard ? "#FFFFFF" : "#111111"}
                  strokeWidth={isHazard ? 2 : 1}
                  style={isHazard ? { filter: "drop-shadow(0 0 6px rgba(255,255,255,0.8))" } : undefined}
                />
              );
            }}
            activeDot={{ r: 7, fill: "#FFFFFF", stroke: "#070707", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Monochrome Legend */}
      <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.8rem", justifyContent: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
          <div style={{ width: 22, height: 2, background: "var(--air-white)" }} />
          <span style={{ fontSize: "0.72rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)" }}>AEROPURE PREDICTED AQI PROXY TRAJECTORY</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 6px rgba(255,255,255,0.8)" }} />
          <span style={{ fontSize: "0.72rem", fontFamily: "JetBrains Mono, monospace", color: "var(--air-white)" }}>ELEVATED POINT (BRIGHTNESS)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
          <div style={{ width: 16, height: 1, borderTop: "1px dashed #6D6D6A" }} />
          <span style={{ fontSize: "0.72rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)" }}>AEROPURE ELEVATED THRESHOLD (180.0)</span>
        </div>
      </div>
    </div>
  );
}
