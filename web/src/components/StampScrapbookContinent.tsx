"use client";

import StampScrapbook, { StampItem } from "@/components/framer/StampScrapbook";
import { Globe, MapPin, Compass } from "lucide-react";

interface Props {
  onSelectContinent: (continentId: string) => void;
}

const CONTINENT_STAMPS: StampItem[] = [
  {
    image: { src: "https://framerusercontent.com/images/rah9krKNzgJYwNBPXKg3l4nYpOQ.webp", alt: "Asia Continent Stamp" },
    title: "Asia",
    code: "AS-01",
    caption: "LAT 34.04°N • LON 100.55°E",
    description: "Eastern Atmospheric Shield & Monsoon Belt. Expansive landmass featuring high-density industrial basins, Himalayan weather barriers, and seasonal monsoon cycles.",
    continentId: "asia",
  },
  {
    image: { src: "https://framerusercontent.com/images/q1J777u9lVCmKnqrK3bmGjP6QI.webp", alt: "Europe Continent Stamp" },
    title: "Europe",
    code: "EU-02",
    caption: "LAT 54.52°N • LON 15.25°E",
    description: "North Atlantic & Mediterranean Air Corridors. Temperate marine and continental air regimes shaped by Westerlies, Alps topography, and stringent EU emissions standards.",
    continentId: "europe",
  },
  {
    image: { src: "https://framerusercontent.com/images/mTf6zMaRl92NQ8wk2t0BN9Ov004.webp", alt: "North America Stamp" },
    title: "North America",
    code: "NA-03",
    caption: "LAT 54.52°N • LON 105.25°W",
    description: "Boreal & Coastal Jet-Stream Systems. Dynamic polar air mass interactions spanning Pacific coastal basins, Great Plains, and Appalachian corridors.",
    continentId: "north-america",
  },
  {
    image: { src: "https://framerusercontent.com/images/DvuBw3HnxEVQe2pZOBUR3FucNhg.webp", alt: "South America Stamp" },
    title: "South America",
    code: "SA-04",
    caption: "LAT 8.78°S • LON 55.49°W",
    description: "Amazonian Basin & Andean Topographic Shield. Vast rainforest oxygen sinks and high-altitude Andean dispersion boundaries.",
    continentId: "south-america",
  },
  {
    image: { src: "https://framerusercontent.com/images/riU79NitRfVzCflkw1yWoiP2zww.webp", alt: "Africa Stamp" },
    title: "Africa",
    code: "AF-05",
    caption: "LAT 8.78°N • LON 34.50°E",
    description: "Saharan Mineral Dust & Equatorial Boundary Zone. Dominant dust plume transports, ITCZ shifts, and rapidly expanding urban industrial nodes.",
    continentId: "africa",
  },
  {
    image: { src: "https://framerusercontent.com/images/FvbllamB85csQxoenDGhwOg0Y.webp", alt: "Oceania Stamp" },
    title: "Oceania",
    code: "OC-06",
    caption: "LAT 25.27°S • LON 133.77°E",
    description: "Pacific Marine Boundary Layer & Maritime Air. Clean maritime air masses dominated by Southern Ocean wind patterns and coastal urban clusters.",
    continentId: "oceania",
  },
  {
    image: { src: "https://framerusercontent.com/images/7m7du4CGgAaVGS6HPiDavHcoo.webp", alt: "Antarctica Stamp" },
    title: "Antarctica",
    code: "AN-07",
    caption: "LAT 82.86°S • LON 135.00°E",
    description: "Polar Cryospheric Reserve & Clean Air Baseline. Global baseline pristine atmospheric monitoring zone under polar vortex isolation.",
    continentId: "antarctica",
  },
];

export default function StampScrapbookContinent({ onSelectContinent }: Props) {
  return (
    <div
      style={{
        background: "radial-gradient(ellipse at center, #111111 0%, #070707 100%)",
        border: "1px solid var(--border-default)",
        borderRadius: 4,
        padding: "3rem 1.5rem 2.5rem",
        marginBottom: "2.5rem",
        boxShadow: "0 25px 80px rgba(0,0,0,0.95)",
        position: "relative",
        overflow: "visible",
        width: "100%",
      }}
    >
      {/* Subtle Atmospheric Mist Glow */}
      <div
        style={{
          position: "absolute",
          top: "25%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 700,
          height: 300,
          background: "radial-gradient(circle, rgba(255, 255, 255, 0.035) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Header Banner */}
      <div style={{ textAlign: "center", marginBottom: "1.8rem", position: "relative", zIndex: 5 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid var(--border-strong)",
            padding: "0.35rem 1rem",
            borderRadius: 2,
            marginBottom: "1rem",
          }}
        >
          <Globe size={13} color="var(--air-white)" />
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.16em",
              color: "var(--cloud)",
            }}
          >
            LEVEL 1 — GEOGRAPHIC ARCHIVE STAMPS
          </span>
        </div>

        <h2
          style={{
            fontFamily: "Orbitron, sans-serif",
            fontSize: "clamp(1.8rem, 4.5vw, 2.8rem)",
            fontWeight: 900,
            color: "var(--air-white)",
            letterSpacing: "0.08em",
            margin: "0 0 0.5rem 0",
            textShadow: "0 0 40px rgba(255,255,255,0.2)",
            lineHeight: 1.1,
          }}
        >
          CONTINENTAL ATMOSPHERIC REGIMES
        </h2>
        <p
          style={{
            fontSize: "0.82rem",
            fontFamily: "JetBrains Mono, monospace",
            color: "var(--silver)",
            letterSpacing: "0.1em",
            maxWidth: 680,
            margin: "0 auto",
            textTransform: "uppercase",
          }}
        >
          SCIENTIFIC ARCHIVE INDEX • DRAG CAROUSEL OR CLICK A CONTINENT TO NAVIGATE
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
          gap: "0.5rem",
          marginTop: "1.5rem",
          position: "relative",
          zIndex: 5,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.68rem",
            fontFamily: "JetBrains Mono, monospace",
            color: "var(--silver)",
            marginRight: "0.5rem",
            alignSelf: "center",
            letterSpacing: "0.1em",
          }}
        >
          <Compass size={13} color="var(--air-white)" /> ARCHIVE INDEX:
        </span>
        {CONTINENT_STAMPS.map((stamp) => (
          <button
            key={stamp.continentId}
            onClick={() => stamp.continentId && onSelectContinent(stamp.continentId)}
            style={{
              background: "rgba(18, 18, 18, 0.9)",
              border: "1px solid var(--border-default)",
              color: "var(--cloud)",
              padding: "0.45rem 0.85rem",
              borderRadius: 2,
              fontSize: "0.72rem",
              fontWeight: 700,
              fontFamily: "JetBrains Mono, monospace",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              letterSpacing: "0.06em",
              transition: "all 0.2s ease",
            }}
            className="quick-continent-btn"
          >
            <MapPin size={11} color="var(--silver)" />
            {stamp.title?.toUpperCase()}
          </button>
        ))}
      </div>

      <style jsx>{`
        .quick-continent-btn:hover {
          background: rgba(45, 45, 45, 0.9) !important;
          border-color: rgba(255, 255, 255, 0.4) !important;
          color: var(--air-white) !important;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
