"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { City } from "@/lib/locations";

interface AreaCard {
  areaSlug: string;
  areaName: string;
  aqi: number;
  hazardProb: number;
  regime: string;
  riskCategory: string;
}

interface Props {
  city: City;
  cards: AreaCard[];
}

export default function AreaCompare({ city, cards }: Props) {
  if (!cards.length) return null;

  const sorted = [...cards].sort((a, b) => b.aqi - a.aqi);
  const maxAqi = sorted[0].aqi;
  const minAqi = sorted[sorted.length - 1].aqi;

  return (
    <div>
      <p className="section-label" style={{ marginBottom: "1rem" }}>
        GEOSPATIAL COMPARISON — AEROPURE PREDICTED AQI PROXY — {city.name.toUpperCase()}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.85rem",
        }}
      >
        {sorted.map((card) => {
          const isWorst = card.aqi === maxAqi;
          const isBest = card.aqi === minAqi && cards.length > 1;
          const TrendIcon = isWorst ? TrendingUp : isBest ? TrendingDown : Minus;

          return (
            <Link
              key={card.areaSlug}
              href={`/city/${city.slug}/${card.areaSlug}`}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  background: isWorst ? "#161616" : "var(--bg-card)",
                  border: isWorst ? "1px solid var(--border-strong)" : "1px solid var(--border-default)",
                  borderRadius: 4,
                  padding: "1.1rem 1.3rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--air-white)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = isWorst ? "var(--border-strong)" : "var(--border-default)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                {/* Monochrome left stripe */}
                <div style={{
                  position: "absolute", top: 0, left: 0, width: 2, height: "100%",
                  background: isWorst ? "var(--air-white)" : "var(--steel)",
                }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <p style={{ fontSize: "0.76rem", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "var(--cloud)", letterSpacing: "0.06em" }}>
                    {card.areaName.toUpperCase()}
                  </p>
                  <TrendIcon size={14} color={isWorst ? "var(--air-white)" : "var(--silver)"} />
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", margin: "0.5rem 0 0.3rem" }}>
                  <p style={{
                    fontFamily: "Orbitron, sans-serif",
                    fontSize: "2.2rem", fontWeight: 900,
                    color: "var(--air-white)", lineHeight: 1,
                    textShadow: "0 0 20px rgba(255,255,255,0.2)",
                  }}>
                    {card.aqi.toFixed(0)}
                  </p>
                  <span style={{ fontSize: "0.68rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)" }}>
                    AQI PROXY
                  </span>
                </div>

                <p style={{ fontSize: "0.68rem", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: isWorst ? "var(--air-white)" : "var(--silver)", letterSpacing: "0.08em" }}>
                  {card.riskCategory.toUpperCase()}
                </p>
                <p style={{ fontSize: "0.68rem", fontFamily: "JetBrains Mono, monospace", color: "var(--steel)", marginTop: "0.25rem" }}>
                  HAZARD: {(card.hazardProb * 100).toFixed(0)}%
                </p>
              </div>
            </Link>
          );
        })}
      </div>
      <p style={{ fontSize: "0.68rem", fontFamily: "JetBrains Mono, monospace", color: "var(--steel)", marginTop: "0.75rem", textAlign: "center" }}>
        Demo Mode — Values derived from validated model inference across regional clusters.
      </p>
    </div>
  );
}
