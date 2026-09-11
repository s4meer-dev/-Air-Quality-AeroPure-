"use client";

import StampScrapbook, { StampItem } from "@/components/framer/StampScrapbook";
import { Globe, MapPin } from "lucide-react";

interface Props {
  onSelectContinent: (continentId: string) => void;
}

const CONTINENT_STAMPS: StampItem[] = [
  {
    image: { src: "https://framerusercontent.com/images/rah9krKNzgJYwNBPXKg3l4nYpOQ.webp", alt: "Asia Continent Stamp" },
    title: "Asia",
    caption: "AS-01 · 48 Countries",
    description: "Eastern Atmospheric Shield & Monsoon Belt. Expansive landmass featuring high-density industrial basins, Himalayan weather barriers, and seasonal monsoon cycles.",
    continentId: "asia",
  },
  {
    image: { src: "https://framerusercontent.com/images/q1J777u9lVCmKnqrK3bmGjP6QI.webp", alt: "Europe Continent Stamp" },
    title: "Europe",
    caption: "EU-02 · 44 Countries",
    description: "North Atlantic & Mediterranean Air Corridors. Temperate marine and continental air regimes shaped by Westerlies, Alps topography, and stringent EU emissions standards.",
    continentId: "europe",
  },
  {
    image: { src: "https://framerusercontent.com/images/mTf6zMaRl92NQ8wk2t0BN9Ov004.webp", alt: "North America Stamp" },
    title: "North America",
    caption: "NA-03 · 23 Countries",
    description: "Boreal & Coastal Jet-Stream Systems. Dynamic polar air mass interactions spanning Pacific coastal basins, Great Plains, and Appalachian corridors.",
    continentId: "north-america",
  },
  {
    image: { src: "https://framerusercontent.com/images/DvuBw3HnxEVQe2pZOBUR3FucNhg.webp", alt: "South America Stamp" },
    title: "South America",
    caption: "SA-04 · 12 Countries",
    description: "Amazonian Basin & Andean Topographic Shield. Vast rainforest oxygen sinks and high-altitude Andean dispersion boundaries.",
    continentId: "south-america",
  },
  {
    image: { src: "https://framerusercontent.com/images/riU79NitRfVzCflkw1yWoiP2zww.webp", alt: "Africa Stamp" },
    title: "Africa",
    caption: "AF-05 · 54 Countries",
    description: "Saharan Mineral Dust & Equatorial Boundary Zone. Dominant dust plume transports, ITCZ shifts, and rapidly expanding urban industrial nodes.",
    continentId: "africa",
  },
  {
    image: { src: "https://framerusercontent.com/images/FvbllamB85csQxoenDGhwOg0Y.webp", alt: "Oceania Stamp" },
    title: "Oceania",
    caption: "OC-06 · 14 Countries",
    description: "Pacific Marine Boundary Layer & Maritime Air. Clean maritime air masses dominated by Southern Ocean wind patterns and coastal urban clusters.",
    continentId: "oceania",
  },
  {
    image: { src: "https://framerusercontent.com/images/7m7du4CGgAaVGS6HPiDavHcoo.webp", alt: "Antarctica Stamp" },
    title: "Antarctica",
    caption: "AN-07 · 1 Reserve",
    description: "Polar Cryospheric Reserve & Clean Air Baseline. Global baseline pristine atmospheric monitoring zone under polar vortex isolation.",
    continentId: "antarctica",
  },
];

export default function StampScrapbookContinent({ onSelectContinent }: Props) {
  return (
    <div
      style={{
        background: "radial-gradient(ellipse at center, #0d0d0d 0%, #050505 100%)",
        border: "1px solid var(--border-gold)",
        borderRadius: 20,
        padding: "2.5rem 1.5rem 1.5rem",
        marginBottom: "2.5rem",
        boxShadow: "0 25px 80px rgba(0,0,0,0.9)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header Banner */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem", position: "relative", zIndex: 5 }}>
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
            LEVEL 1 — FRAMER STAMP SCRAPBOOK CONTINENTS
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

      {/* Exact Framer StampScrapbook 3D Carousel Component */}
      <div style={{ minHeight: 480, width: "100%", position: "relative", zIndex: 5 }}>
        <StampScrapbook
          stamps={CONTINENT_STAMPS}
          stampHeight={280}
          autoRotate={true}
          speed={8}
          cursorSteer={true}
          onSelectContinent={onSelectContinent}
        />
      </div>

      {/* Quick Select Buttons Grid below Carousel */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "0.6rem",
          marginTop: "1.5rem",
          position: "relative",
          zIndex: 5,
        }}
      >
        {CONTINENT_STAMPS.map((stamp) => (
          <button
            key={stamp.continentId}
            onClick={() => stamp.continentId && onSelectContinent(stamp.continentId)}
            style={{
              background: "rgba(18,18,18,0.9)",
              border: "1px solid var(--border-gold)",
              color: "var(--gold-bright)",
              padding: "0.45rem 0.9rem",
              borderRadius: 8,
              fontSize: "0.75rem",
              fontWeight: 700,
              fontFamily: "Orbitron, sans-serif",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              transition: "all 0.2s ease-in-out",
            }}
          >
            <MapPin size={12} color="var(--gold)" />
            {stamp.title?.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
