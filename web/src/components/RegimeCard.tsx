"use client";

interface Props {
  regime: string;
  description?: string;
}

interface RegimeStyle {
  glyph: string;
  densityLabel: string;
  bg: string;
  border: string;
  stripe: string;
  textColor: string;
  description: string;
}

function getRegimeStyle(regime: string): RegimeStyle {
  const r = regime.toLowerCase();

  if (r.includes("low") || r.includes("clean")) {
    // LOW POLLUTION — Lighter / open composition
    return {
      glyph: "◇",
      densityLabel: "OPEN TONAL COMPOSITION · LOW PARTICULATE DENSITY",
      bg: "var(--bg-elevated)",
      border: "1px solid var(--border-strong)",
      stripe: "var(--silver)",
      textColor: "var(--air-white)",
      description:
        "Favorable atmospheric dispersion conditions with lower emission rates. Boundary layer mixing is active, preventing pollutant concentration buildup.",
    };
  }

  if (r.includes("severe") || r.includes("stagnant") || r.includes("inversion")) {
    // SEVERE STAGNANT — Dense / darker high-contrast composition
    return {
      glyph: "◆",
      densityLabel: "DENSE TONAL COMPOSITION · CRITICAL STAGNATION",
      bg: "#0B0B0B",
      border: "2px solid var(--air-white)",
      stripe: "var(--air-white)",
      textColor: "var(--air-white)",
      description:
        "Thermal inversion ceiling traps ground emissions. Extreme atmospheric stagnation with high NOx, CO, and volatile aromatic hydrocarbons.",
    };
  }

  // MODERATE / WARM — Balanced composition
  return {
    glyph: "◈",
    densityLabel: "BALANCED TONAL COMPOSITION · EQUILIBRIUM REGIME",
    bg: "var(--bg-card)",
    border: "1px solid var(--border-default)",
    stripe: "var(--steel)",
    textColor: "var(--cloud)",
    description:
      "Warm atmospheric conditions drive photochemical reactions. Moderate ozone and particulate levels with partial daytime boundary mixing.",
  };
}

export default function RegimeCard({ regime }: Props) {
  const style = getRegimeStyle(regime);

  return (
    <div
      style={{
        background: style.bg,
        border: style.border,
        borderRadius: 4,
        padding: "1.4rem 1.6rem",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
      }}
    >
      {/* Monochrome left density stripe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 3,
          height: "100%",
          background: style.stripe,
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
        <p className="section-label" style={{ margin: 0 }}>ATMOSPHERIC REGIME CLASSIFICATION</p>
        <span style={{ fontSize: "0.62rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)", letterSpacing: "0.08em" }}>
          {style.densityLabel}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
        <span style={{ fontSize: "1.8rem", lineHeight: 1, color: style.textColor, fontFamily: "monospace" }}>
          {style.glyph}
        </span>
        <div>
          <h3
            style={{
              fontFamily: "Orbitron, sans-serif",
              fontSize: "0.95rem",
              fontWeight: 800,
              color: style.textColor,
              letterSpacing: "0.04em",
              marginBottom: "0.4rem",
            }}
          >
            {regime.toUpperCase()}
          </h3>
          <p style={{ fontSize: "0.8rem", fontFamily: "JetBrains Mono, monospace", color: "var(--cloud)", lineHeight: 1.65 }}>
            {style.description}
          </p>
        </div>
      </div>

      <p style={{ fontSize: "0.68rem", fontFamily: "JetBrains Mono, monospace", color: "var(--steel)", marginTop: "0.9rem" }}>
        Regime identified by K-Means unsupervised clustering on historical atmospheric observations.
      </p>
    </div>
  );
}
