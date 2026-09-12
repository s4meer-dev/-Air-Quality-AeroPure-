"use client";

interface AqiDisplayProps {
  value: number;
  label?: string;
  size?: "xl" | "lg" | "md";
}

function getRiskInfo(aqi: number): { tier: string; color: string; border: string; bg: string; isHazard: boolean } {
  if (aqi >= 180) {
    return {
      tier: "HAZARDOUS",
      color: "var(--air-white)",
      border: "2px solid var(--air-white)",
      bg: "rgba(255, 255, 255, 0.08)",
      isHazard: true,
    };
  }
  if (aqi >= 120) {
    return {
      tier: "ELEVATED",
      color: "var(--air-white)",
      border: "1px solid var(--border-strong)",
      bg: "rgba(255, 255, 255, 0.04)",
      isHazard: false,
    };
  }
  if (aqi >= 80) {
    return {
      tier: "MODERATE",
      color: "var(--cloud)",
      border: "1px solid var(--border-default)",
      bg: "rgba(255, 255, 255, 0.02)",
      isHazard: false,
    };
  }
  return {
    tier: "LOW POLLUTION",
    color: "var(--mist)",
    border: "1px solid var(--border-subtle)",
    bg: "transparent",
    isHazard: false,
  };
}

export default function AqiDisplay({ value, label = "AQI Proxy", size = "xl" }: AqiDisplayProps) {
  const { tier, color, border, bg, isHazard } = getRiskInfo(value);

  const fontSize = size === "xl" ? "clamp(4.5rem, 12vw, 7rem)" : size === "lg" ? "3.5rem" : "2.2rem";

  return (
    <div style={{ textAlign: "center" }}>
      <p className="section-label" style={{ marginBottom: "0.5rem" }}>{label}</p>
      <div
        className={isHazard ? "hazard-pulse" : ""}
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.75rem",
          background: bg,
          border,
          borderRadius: 4,
          padding: "1.5rem 2.5rem",
          boxShadow: isHazard ? "0 0 30px rgba(255, 255, 255, 0.15)" : "0 10px 30px rgba(0,0,0,0.6)",
        }}
      >
        <span
          style={{
            fontFamily: "Orbitron, sans-serif",
            fontSize,
            fontWeight: 900,
            color: "var(--air-white)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
            textShadow: "0 0 35px rgba(255, 255, 255, 0.25)",
          }}
        >
          {value.toFixed(1)}
        </span>
        <span
          style={{
            fontSize: "0.68rem",
            fontFamily: "JetBrains Mono, monospace",
            fontWeight: 700,
            letterSpacing: "0.16em",
            background: isHazard ? "#FFFFFF" : "rgba(255, 255, 255, 0.06)",
            color: isHazard ? "#000000" : color,
            border: isHazard ? "1px solid #FFFFFF" : "1px solid var(--border-default)",
            borderRadius: 2,
            padding: "0.25rem 0.85rem",
            textTransform: "uppercase",
          }}
        >
          {tier}
        </span>
      </div>
    </div>
  );
}

export { getRiskInfo };
