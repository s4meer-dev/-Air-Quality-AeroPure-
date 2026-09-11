"use client";

import { useState } from "react";
import { CONTINENTS } from "@/lib/locations";
import { Globe, ArrowRight, Compass } from "lucide-react";

interface Props {
  onSelectContinent: (continentId: string) => void;
}

export default function StampScrapbookContinent({ onSelectContinent }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div
      style={{
        background: "radial-gradient(ellipse at center, #0d0d0d 0%, #050505 100%)",
        border: "1px solid var(--border-gold)",
        borderRadius: 20,
        padding: "2.5rem 2rem",
        marginBottom: "2.5rem",
        boxShadow: "0 25px 80px rgba(0,0,0,0.9)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Vintage Grid / Coordinates Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(201, 162, 39, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(201, 162, 39, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      {/* Header Banner */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem", position: "relative", zIndex: 5 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(201,162,39,0.08)",
            border: "1px solid var(--gold-dim)",
            padding: "0.35rem 1.1rem",
            borderRadius: 30,
            marginBottom: "1rem",
          }}
        >
          <Globe size={14} color="var(--gold)" />
          <span
            style={{
              fontFamily: "Orbitron, sans-serif",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: "var(--gold)",
            }}
          >
            LEVEL 1 — CONTINENTAL EXPLORER
          </span>
        </div>

        <h2
          style={{
            fontFamily: "Orbitron, sans-serif",
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            fontWeight: 900,
            color: "var(--gold-bright)",
            letterSpacing: "0.06em",
            margin: "0 0 0.5rem 0",
            textShadow: "0 0 40px rgba(201,162,39,0.25)",
          }}
        >
          GLOBAL AIR INTELLIGENCE
        </h2>
        <p
          style={{
            fontSize: "1rem",
            color: "var(--text-muted)",
            letterSpacing: "0.04em",
            maxWidth: 580,
            margin: "0 auto",
            textTransform: "uppercase",
          }}
        >
          EXPLORE AIR QUALITY BY REGION
        </p>
      </div>

      {/* 7-Continent Stamp Scrapbook Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.8rem 1.5rem",
          position: "relative",
          zIndex: 5,
        }}
      >
        {CONTINENTS.map((cont, idx) => {
          const isHovered = hoveredId === cont.id;
          const stampRotation = (idx % 2 === 0 ? 1 : -1) * (idx * 0.8 + 0.5);

          return (
            <div
              key={cont.id}
              onClick={() => onSelectContinent(cont.id)}
              onMouseEnter={() => setHoveredId(cont.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                position: "relative",
                background: "#0c0c0c",
                border: "1px solid var(--border-gold)",
                borderRadius: 4,
                padding: "1.6rem 1.4rem",
                cursor: "pointer",
                transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                transform: isHovered
                  ? "translateY(-6px) scale(1.03) rotate(0deg)"
                  : `rotate(${stampRotation}deg)`,
                boxShadow: isHovered
                  ? "0 15px 35px rgba(201,162,39,0.3), 0 0 15px rgba(0,0,0,0.8)"
                  : "0 8px 20px rgba(0,0,0,0.6)",
              }}
              className="stamp-card"
            >
              {/* Simulated Stamp Perforated Edge Accent */}
              <div
                style={{
                  position: "absolute",
                  inset: -4,
                  border: "2px dashed rgba(201,162,39,0.3)",
                  borderRadius: 6,
                  pointerEvents: "none",
                }}
              />

              {/* Stamp Top Postmark Ribbon */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid rgba(201,162,39,0.25)",
                  paddingBottom: "0.6rem",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span
                    style={{
                      fontFamily: "Orbitron, sans-serif",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      color: "var(--gold-bright)",
                      background: "rgba(201,162,39,0.15)",
                      padding: "0.15rem 0.5rem",
                      borderRadius: 3,
                      border: "1px solid var(--gold-dim)",
                    }}
                  >
                    {cont.code}-0{idx + 1}
                  </span>
                  <span
                    style={{
                      fontSize: "0.62rem",
                      fontFamily: "monospace",
                      color: "var(--text-muted)",
                    }}
                  >
                    {cont.lat.toFixed(1)}°N / {cont.lon.toFixed(1)}°E
                  </span>
                </div>

                {/* Circular Postmark Watermark */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "1px dashed var(--gold-dim)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0.6,
                  }}
                >
                  <Compass size={16} color="var(--gold)" />
                </div>
              </div>

              {/* Continent Title */}
              <h3
                style={{
                  fontFamily: "Orbitron, sans-serif",
                  fontSize: "1.4rem",
                  fontWeight: 900,
                  color: isHovered ? "var(--gold-bright)" : "var(--text-primary)",
                  margin: "0 0 0.3rem 0",
                  letterSpacing: "0.04em",
                }}
              >
                {cont.name}
              </h3>

              {/* Subtitle */}
              <p
                style={{
                  fontSize: "0.74rem",
                  color: "var(--gold)",
                  fontWeight: 600,
                  margin: "0 0 0.8rem 0",
                  lineHeight: 1.25,
                }}
              >
                {cont.subtitle}
              </p>

              {/* Description */}
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  margin: "0 0 1.2rem 0",
                  lineHeight: 1.45,
                }}
              >
                {cont.description}
              </p>

              {/* Card Footer: Metadata & Action CTA */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px dashed rgba(255,255,255,0.08)",
                  paddingTop: "0.75rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontFamily: "Orbitron, sans-serif",
                    color: "var(--text-muted)",
                  }}
                >
                  {cont.countryCount} COUNTRIES INDEXED
                </span>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    color: "var(--gold)",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    fontFamily: "Orbitron, sans-serif",
                  }}
                >
                  EXPLORE <ArrowRight size={14} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2rem", textAlign: "center" }}>
        * AeroPure StampScrapbook Index: Select a continent to expand country Honeycomb geospatial nodes.
      </p>
    </div>
  );
}
