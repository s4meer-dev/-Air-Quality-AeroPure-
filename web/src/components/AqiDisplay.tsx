"use client";

interface AqiDisplayProps {
  value: number;
  label?: string;
  size?: "xl" | "lg" | "md";
}

function getRiskInfo(aqi: number): { tier: string; color: string; bgColor: string } {
  if (aqi >= 180) return { tier: "ELEVATED HAZARDOUS", color: "var(--red-bright)", bgColor: "rgba(177,18,38,0.12)" };
  if (aqi >= 120) return { tier: "ELEVATED", color: "#E8A020", bgColor: "rgba(232,160,32,0.1)" };
  if (aqi >= 80)  return { tier: "MODERATE", color: "var(--gold)", bgColor: "rgba(212,175,55,0.1)" };
  return              { tier: "LOW", color: "var(--gold-bright)", bgColor: "rgba(224,193,90,0.08)" };
}

export default function AqiDisplay({ value, label = "AQI Proxy", size = "xl" }: AqiDisplayProps) {
  const { tier, color, bgColor } = getRiskInfo(value);

  const fontSize = size === "xl" ? "clamp(5rem,14vw,8rem)" : size === "lg" ? "4rem" : "2.4rem";

  return (
    <div style={{ textAlign: "center" }}>
      <p className="section-label" style={{ marginBottom: "0.5rem" }}>{label}</p>
      <div
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.75rem",
          background: bgColor,
          border: `1px solid ${color}30`,
          borderRadius: 16,
          padding: "1.5rem 2.5rem",
        }}
      >
        <span
          style={{
            fontFamily: "Orbitron, sans-serif",
            fontSize,
            fontWeight: 900,
            color,
            lineHeight: 1,
            textShadow: `0 0 40px ${color}`,
          }}
        >
          {value.toFixed(1)}
        </span>
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.16em",
            color,
            background: `${color}18`,
            border: `1px solid ${color}40`,
            borderRadius: 20,
            padding: "0.3rem 1rem",
          }}
        >
          {tier}
        </span>
      </div>
    </div>
  );
}

export { getRiskInfo };
