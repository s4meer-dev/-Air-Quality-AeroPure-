"use client";

interface Props {
  regime: string;
  description?: string;
}

const REGIME_META: Record<string, { icon: string; color: string; description: string }> = {
  "Moderate / Warm Photochemical Regime": {
    icon: "🌤",
    color: "var(--gold)",
    description:
      "Warm conditions drive photochemical reactions between NOx and VOCs, producing elevated ozone and moderate particulate levels. Dispersion is partial — daytime mixing limits accumulation.",
  },
  "Low Pollution / Clean Dispersion Regime": {
    icon: "🌬",
    color: "var(--gold-bright)",
    description:
      "Favorable atmospheric dispersion conditions with lower emission rates. Boundary layer mixing is active, preventing pollutant concentration buildup. Outdoor activity is generally safe.",
  },
  "Severe Stagnant Inversion / High Emission Regime": {
    icon: "🔴",
    color: "var(--red-bright)",
    description:
      "Temperature inversion traps pollutants near the surface. High NOx, CO, and benzene levels with limited atmospheric dispersion. Hazardous conditions likely for vulnerable populations.",
  },
};

function getRegimeMeta(regime: string) {
  // Try exact match first, then partial match
  if (REGIME_META[regime]) return REGIME_META[regime];
  const key = Object.keys(REGIME_META).find((k) =>
    regime.toLowerCase().includes(k.split(" / ")[0].toLowerCase().split(" ")[0])
  );
  return key
    ? REGIME_META[key]
    : { icon: "📊", color: "var(--gold)", description: "Atmospheric regime as identified by the K-Means clustering model." };
}

export default function RegimeCard({ regime }: Props) {
  const meta = getRegimeMeta(regime);
  const isSevere = meta.color === "var(--red-bright)";

  return (
    <div
      style={{
        background: isSevere ? "linear-gradient(135deg,#120000,#1a0000)" : "var(--bg-card)",
        border: `1px solid ${meta.color}40`,
        borderRadius: 12,
        padding: "1.4rem 1.6rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Gold/Red left stripe */}
      <div style={{
        position: "absolute", top: 0, left: 0, width: 3, height: "100%",
        background: meta.color, borderRadius: "12px 0 0 12px",
      }} />

      <p className="section-label" style={{ marginBottom: "0.8rem" }}>POLLUTION REGIME</p>

      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
        <span style={{ fontSize: "2rem", lineHeight: 1 }}>{meta.icon}</span>
        <div>
          <p
            style={{
              fontFamily: "Orbitron, sans-serif",
              fontSize: "0.88rem",
              fontWeight: 700,
              color: meta.color,
              letterSpacing: "0.04em",
              marginBottom: "0.5rem",
            }}
          >
            {regime}
          </p>
          <p style={{ fontSize: "0.83rem", color: "var(--text-muted)", lineHeight: 1.65 }}>
            {meta.description}
          </p>
        </div>
      </div>

      <p style={{ fontSize: "0.7rem", color: "var(--text-faint)", marginTop: "0.9rem" }}>
        Regime identified by K-Means clustering (Week 9) on historical sensor data.
        Unsupervised assignment — not a real-time measurement.
      </p>
    </div>
  );
}
