"use client";

import StampScrapbook, { StampItem } from "@/components/framer/StampScrapbook";
import { Globe, MapPin, Sparkles } from "lucide-react";

interface Props {
  onSelectContinent: (continentId: string) => void;
}

const CONTINENT_STAMPS: StampItem[] = [
  {
    image: { src: "https://framerusercontent.com/images/rah9krKNzgJYwNBPXKg3l4nYpOQ.webp", alt: "Asia Continent Stamp" },
    title: "Asia",
    code: "AS-01",
    caption: "48 Countries • Monsoon Belt",
    description: "Eastern Atmospheric Shield & Monsoon Belt. Expansive landmass featuring high-density industrial basins, Himalayan weather barriers, and seasonal monsoon cycles.",
    continentId: "asia",
  },
  {
    image: { src: "https://framerusercontent.com/images/q1J777u9lVCmKnqrK3bmGjP6QI.webp", alt: "Europe Continent Stamp" },
    title: "Europe",
    code: "EU-02",
    caption: "44 Countries • Atlantic Westerlies",
    description: "North Atlantic & Mediterranean Air Corridors. Temperate marine and continental air regimes shaped by Westerlies, Alps topography, and stringent EU emissions standards.",
    continentId: "europe",
  },
  {
    image: { src: "https://framerusercontent.com/images/mTf6zMaRl92NQ8wk2t0BN9Ov004.webp", alt: "North America Stamp" },
    title: "North America",
    code: "NA-03",
    caption: "23 Countries • Jet-Stream Systems",
    description: "Boreal & Coastal Jet-Stream Systems. Dynamic polar air mass interactions spanning Pacific coastal basins, Great Plains, and Appalachian corridors.",
    continentId: "north-america",
  },
  {
    image: { src: "https://framerusercontent.com/images/DvuBw3HnxEVQe2pZOBUR3FucNhg.webp", alt: "South America Stamp" },
    title: "South America",
    code: "SA-04",
    caption: "12 Countries • Amazonian Basin",
    description: "Amazonian Basin & Andean Topographic Shield. Vast rainforest oxygen sinks and high-altitude Andean dispersion boundaries.",
    continentId: "south-america",
  },
  {
    image: { src: "https://framerusercontent.com/images/riU79NitRfVzCflkw1yWoiP2zww.webp", alt: "Africa Stamp" },
    title: "Africa",
    code: "AF-05",
    caption: "54 Countries • Saharan Plumes",
    description: "Saharan Mineral Dust & Equatorial Boundary Zone. Dominant dust plume transports, ITCZ shifts, and rapidly expanding urban industrial nodes.",
    continentId: "africa",
  },
  {
    image: { src: "https://framerusercontent.com/images/FvbllamB85csQxoenDGhwOg0Y.webp", alt: "Oceania Stamp" },
    title: "Oceania",
    code: "OC-06",
    caption: "14 Countries • Pacific Marine Layer",
    description: "Pacific Marine Boundary Layer & Maritime Air. Clean maritime air masses dominated by Southern Ocean wind patterns and coastal urban clusters.",
    continentId: "oceania",
  },
  {
    image: { src: "https://framerusercontent.com/images/7m7du4CGgAaVGS6HPiDavHcoo.webp", alt: "Antarctica Stamp" },
    title: "Antarctica",
    code: "AN-07",
    caption: "Polar Reserve • Clean Air Baseline",
    description: "Polar Cryospheric Reserve & Clean Air Baseline. Global baseline pristine atmospheric monitoring zone under polar vortex isolation.",
    continentId: "antarctica",
  },
];

export default function StampScrapbookContinent({ onSelectContinent }: Props) {
  return (
    <div
      style={{
        background: "radial-gradient(ellipse at center, #0e0e0e 0%, #040404 100%)",
        border: "1px solid var(--border-gold)",
        borderRadius: 24,
        padding: "3.5rem 1.5rem 3.5rem",
        marginBottom: "3rem",
        boxShadow: "0 30px 100px rgba(0,0,0,0.95)",
        position: "relative",
        overflow: "visible",
        width: "100%",
      }}
    >
      {/* Subtle Background Radial Gold Flare */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 800,
          height: 350,
          background: "radial-gradient(circle, rgba(201,162,39,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Header Banner */}
      <div style={{ textAlign: "center", marginBottom: "2rem", position: "relative", zIndex: 5 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(201,162,39,0.08)",
            border: "1px solid var(--gold-dim)",
            padding: "0.4rem 1.2rem",
            borderRadius: 30,
            marginBottom: "1.2rem",
          }}
        >
          <Globe size={14} color="var(--gold)" />
          <span
            style={{
              fontFamily: "Orbitron, sans-serif",
              fontSize: "0.74rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: "var(--gold)",
            }}
          >
            LEVEL 1 — GLOBAL STAMP SCRAPBOOK CONTINENTS
          </span>
        </div>

        <h2
          style={{
            fontFamily: "Orbitron, sans-serif",
            fontSize: "clamp(2rem, 5vw, 3.2rem)",
            fontWeight: 900,
            color: "var(--gold-bright)",
            letterSpacing: "0.06em",
            margin: "0 0 0.6rem 0",
            textShadow: "0 0 50px rgba(201,162,39,0.3)",
            lineHeight: 1.1,
          }}
        >
          GLOBAL AIR INTELLIGENCE
        </h2>
        <p
          style={{
            fontSize: "1.05rem",
            color: "var(--text-muted)",
            letterSpacing: "0.06em",
            maxWidth: 640,
            margin: "0 auto",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          EXPLORE AIR QUALITY BY REGION • DRAG OR CLICK ANY CONTINENT STAMP
        </p>
      </div>

      {/* Broad Panoramic Framer StampScrapbook 3D Carousel with zero cut-off */}
      <div style={{ minHeight: 700, height: 700, width: "100%", position: "relative", zIndex: 5, overflow: "visible" }}>
        <StampScrapbook
          stamps={CONTINENT_STAMPS}
          stampHeight={350}
          spread={1.3}
          tilt={-4}
          scrollTilt={false}
          autoRotate={true}
          speed={6}
          cursorSteer={true}
          hoverSpeed={20}
          onSelectContinent={onSelectContinent}
        />
      </div>

      {/* Quick Select Buttons Grid below Carousel */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
          marginTop: "2rem",
          position: "relative",
          zIndex: 5,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.72rem",
            fontFamily: "Orbitron, sans-serif",
            color: "var(--text-muted)",
            marginRight: "0.5rem",
            alignSelf: "center",
          }}
        >
          <Sparkles size={13} color="var(--gold)" /> QUICK SELECT:
        </span>
        {CONTINENT_STAMPS.map((stamp) => (
          <button
            key={stamp.continentId}
            onClick={() => stamp.continentId && onSelectContinent(stamp.continentId)}
            style={{
              background: "rgba(18,18,18,0.92)",
              border: "1px solid var(--border-gold)",
              color: "var(--gold-bright)",
              padding: "0.5rem 1rem",
              borderRadius: 8,
              fontSize: "0.78rem",
              fontWeight: 800,
              fontFamily: "Orbitron, sans-serif",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              transition: "all 0.25s ease",
            }}
            className="quick-continent-btn"
          >
            <MapPin size={12} color="var(--gold)" />
            {stamp.title?.toUpperCase()}
          </button>
        ))}
      </div>

      <style jsx>{`
        .quick-continent-btn:hover {
          background: rgba(201, 162, 39, 0.2) !important;
          border-color: var(--gold-bright) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(201, 162, 39, 0.35);
        }
      `}</style>
    </div>
  );
}
