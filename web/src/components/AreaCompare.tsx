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

function getRiskColor(riskCategory: string): string {
  if (riskCategory.toLowerCase().includes("hazard")) return "var(--red-bright)";
  if (riskCategory.toLowerCase().includes("elevated")) return "#E8A020";
  if (riskCategory.toLowerCase().includes("moderate")) return "var(--gold)";
  return "var(--gold-bright)";
}

export default function AreaCompare({ city, cards }: Props) {
  if (!cards.length) return null;

  const sorted = [...cards].sort((a, b) => b.aqi - a.aqi);
  const maxAqi = sorted[0].aqi;
  const minAqi = sorted[sorted.length - 1].aqi;

  return (
    <div>
      <p className="section-label" style={{ marginBottom: "1rem" }}>
        AREA COMPARISON — {city.name.toUpperCase()}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.85rem",
        }}
      >
        {sorted.map((card) => {
          const color = getRiskColor(card.riskCategory);
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
                  background: "var(--bg-card)",
                  border: `1px solid ${isWorst ? "var(--red)30" : "var(--border)"}`,
                  borderRadius: 12,
                  padding: "1.1rem 1.3rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--gold-dim)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = isWorst ? "var(--red)30" : "var(--border)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                {/* Gold left stripe */}
                <div style={{
                  position: "absolute", top: 0, left: 0, width: 3, height: "100%",
                  background: color, borderRadius: "12px 0 0 12px",
                }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-body)", letterSpacing: "0.02em" }}>
                    {card.areaName.toUpperCase()}
                  </p>
                  <TrendIcon size={15} color={color} />
                </div>

                <p style={{
                  fontFamily: "Orbitron, sans-serif",
                  fontSize: "2.2rem", fontWeight: 900,
                  color, lineHeight: 1, margin: "0.5rem 0 0.3rem",
                  textShadow: `0 0 20px ${color}80`,
                }}>
                  {card.aqi.toFixed(0)}
                </p>

                <p style={{ fontSize: "0.72rem", fontWeight: 700, color, letterSpacing: "0.06em" }}>
                  {card.riskCategory}
                </p>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  Hazard: {(card.hazardProb * 100).toFixed(0)}%
                </p>
              </div>
            </Link>
          );
        })}
      </div>
      <p style={{ fontSize: "0.7rem", color: "var(--text-faint)", marginTop: "0.75rem", textAlign: "center" }}>
        Demo Mode — Values from AeroPure ML inference using regime-representative baselines. Click any area for full intelligence.
      </p>
    </div>
  );
}
