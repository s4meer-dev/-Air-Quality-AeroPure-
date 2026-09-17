"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { 
  Search, 
  Layers, 
  BarChart3, 
  Activity, 
  Leaf, 
  Globe, 
  Target, 
  X,
  ArrowUpRight
} from "lucide-react";
import { Country, Continent, StateRegion, COUNTRIES, CITIES } from "@/lib/locations";
import { GeoLocation } from "@/lib/openweather";

interface RegionArchiveConfig {
  index: string;
  headline?: string;
  subhead: string;
  tagline: string;
  quote: string;
  editorialTags: string[];
  reliefMap: string;
  ambientVisual?: string;
  polaroidPhoto?: string;
  polaroidCaption?: string[];
  lateralRightTags: string[];
  bottomMotto: string[];
  regionVisuals: Record<string, string>;
}

// ── PROGRAMMATIC COUNTRY CONFIG REGISTRY ─────────────────────────────────────────
const COUNTRY_ARCHIVE_CONFIGS: Record<string, RegionArchiveConfig> = {
  "united-states": {
    index: "02",
    headline: "UNITED STATES",
    subhead: "REGIONAL AIR INTELLIGENCE",
    tagline: "Explore regional atmospheric conditions and continue toward city-level air intelligence.",
    quote: '"Healthier air\ndeeper insights\nstronger communities."',
    editorialTags: ["REGIONAL INDEX", "GEOGRAPHY •", "ATMOSPHERE", "URBAN AIR", "LANDSCAPES"],
    reliefMap: "/regions/usa_map_relief.jpg",
    ambientVisual: "/regions/golden_gate_fog.jpg",
    polaroidPhoto: "/regions/usa_polaroid_stamp.jpg",
    polaroidCaption: ["USA", "LAND OF POSSIBILITIES"],
    lateralRightTags: ["REGIONAL TELEMETRY", "LIVE DATA", "LOCAL CONDITIONS"],
    bottomMotto: ["CLEANER AIR", "STRONGER CITIES", "BRIGHTER TOMORROWS"],
    regionVisuals: {
      "california": "/regions/region_california.jpg",
      "new-york-state": "/regions/region_newyork.jpg",
      "texas": "/regions/region_texas.jpg",
      "washington-state": "/regions/region_washington.jpg",
    },
  },
  "india": {
    index: "01",
    headline: "INDIA",
    subhead: "SUB-CONTINENTAL AIR MONITORING",
    tagline: "Monsoon corridors, Gangetic basin dynamics, and state-level atmospheric tracking.",
    quote: '"Preserving atmospheric integrity from Himalayas to Cape Comorin."',
    editorialTags: ["PENINSULAR AIR", "MONSOON BELT", "INDO-GANGETIC", "INDUSTRY", "ARCHIVE"],
    reliefMap: "/stamps/geo_asia.jpg",
    ambientVisual: "/continents/morocco_casablanca.jpg",
    lateralRightTags: ["REGIONAL TELEMETRY", "REAL-TIME SENSORS", "STATE MATRICES"],
    bottomMotto: ["MONSOON DYNAMICS", "AIR RETENTION", "CLEAN HORIZONS"],
    regionVisuals: {},
  },
  "germany": {
    index: "03",
    headline: "GERMANY",
    subhead: "CENTRAL EUROPEAN CORRIDOR",
    tagline: "Federal atmospheric monitoring across alpine basins and northern lowlands.",
    quote: '"Pioneering continental standards for atmospheric clarity."',
    editorialTags: ["ALPINE WINDS", "LOWLANDS", "INDUSTRIAL CAPS", "CLEAN AIR", "ARCHIVE"],
    reliefMap: "/stamps/geo_europe.jpg",
    lateralRightTags: ["REGIONAL TELEMETRY", "LIVE SENSORS", "FEDERAL NETWORK"],
    bottomMotto: ["EMISSIONS CAPS", "CLEAN BASINS", "BRIGHTER CITIES"],
    regionVisuals: {},
  },
};

interface RegionArchiveViewProps {
  country: Country;
  continent?: Continent | null;
  regions: StateRegion[];
  onSelectRegion: (regionId: string) => void;
  onBackToContinent?: () => void;
  onBackToEarth?: () => void;
  onSelectLiveLocation: (loc: GeoLocation) => void;
}

export default function RegionArchiveView({
  country,
  continent,
  regions,
  onSelectRegion,
  onBackToContinent,
  onBackToEarth,
  onSelectLiveLocation,
}: RegionArchiveViewProps) {
  // Config selection with dynamic programmatic fallback
  const config = useMemo<RegionArchiveConfig>(() => {
    const existing = COUNTRY_ARCHIVE_CONFIGS[country.id];
    if (existing) return existing;

    return {
      index: "01",
      headline: country.name.toUpperCase(),
      subhead: "REGIONAL AIR INTELLIGENCE",
      tagline: `Explore regional atmospheric conditions across ${country.name} and continue toward city-level intelligence.`,
      quote: `"Scientific atmospheric observation across ${country.name}."`,
      editorialTags: ["REGIONAL INDEX", "ATMOSPHERE", "GEOGRAPHY", "COMMUNITIES", "ARCHIVE"],
      reliefMap: `/stamps/geo_${country.continentId || "north-america"}.jpg`,
      lateralRightTags: ["REGIONAL TELEMETRY", "LIVE DATA", "LOCAL CONDITIONS"],
      bottomMotto: ["CLEANER AIR", "STRONGER CITIES", "BRIGHTER TOMORROWS"],
      regionVisuals: {},
    };
  }, [country]);

  // Coordinates formatting
  const formattedCoords = useMemo(() => {
    const lat = country.lat;
    const lon = country.lon;
    const latDir = lat >= 0 ? "N" : "S";
    const lonDir = lon >= 0 ? "E" : "W";
    return `${Math.abs(lat).toFixed(4)}° ${latDir}\n${Math.abs(lon).toFixed(4)}° ${lonDir}`;
  }, [country.lat, country.lon]);

  // Dynamic capabilities calculation
  const totalRegionsCount = regions.length;
  const regionsCountFormatted = String(totalRegionsCount).padStart(2, "0");

  // Hover state for contextual inspection
  const [hoveredRegion, setHoveredRegion] = useState<StateRegion | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [liveMatches, setLiveMatches] = useState<GeoLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Local matches calculation
  const localMatches = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (q.length < 2) return [];

    const matches: { type: string; title: string; subtitle: string; action: () => void }[] = [];

    // Current country regions first
    regions.forEach((r) => {
      if (r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)) {
        matches.push({
          type: "THIS REGION",
          title: r.name,
          subtitle: `Code: ${r.code} • ${r.cityCount} Monitored Cities`,
          action: () => onSelectRegion(r.id),
        });
      }
    });

    // Cities within current country
    CITIES.filter((c) => c.countryId === country.id).forEach((ci) => {
      if (ci.name.toLowerCase().includes(q)) {
        matches.push({
          type: "CITY",
          title: ci.name,
          subtitle: `${ci.state} • Lat: ${ci.lat.toFixed(2)}, Lon: ${ci.lon.toFixed(2)}`,
          action: () => onSelectRegion(ci.stateId),
        });
      }
    });

    // Other countries
    COUNTRIES.forEach((c) => {
      if (c.name.toLowerCase().includes(q) && c.id !== country.id) {
        matches.push({
          type: "COUNTRY",
          title: c.name,
          subtitle: `Code: ${c.code} • Continent: ${c.continentId.toUpperCase()}`,
          action: () => {
            if (onBackToContinent) onBackToContinent();
          },
        });
      }
    });

    return matches.slice(0, 5);
  }, [searchQuery, regions, country.id, onSelectRegion, onBackToContinent]);

  // Debounced live OpenWeather search
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (q.length < 2) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?live=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!cancelled && data.liveLocations && Array.isArray(data.liveLocations)) {
          setLiveMatches(data.liveLocations.slice(0, 5));
        }
      } catch (err) {
        console.error("Live search error:", err);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const displayedLiveMatches = searchQuery.trim().length >= 2 ? liveMatches : [];

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#070707",
        color: "#F2F2F0",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* ── RESPONSIVE COMPOSITION CSS ── */}
      <style>{`
        .region-stage {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem 2rem 2.5rem 2rem;
          min-height: 650px;
          z-index: 5;
        }

        .region-bg-cartography {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          opacity: 0.45;
          display: flex;
          align-items: center;
          justify-content: center;
          mask-image: radial-gradient(ellipse at 50% 50%, rgba(0, 0, 0, 1) 30%, rgba(0, 0, 0, 0) 78%);
          -webkit-mask-image: radial-gradient(ellipse at 50% 50%, rgba(0, 0, 0, 1) 30%, rgba(0, 0, 0, 0) 78%);
        }

        .region-ambient-left {
          position: absolute;
          left: 0;
          bottom: 0;
          width: 520px;
          height: 380px;
          z-index: 3;
          pointer-events: none;
          opacity: 0.38;
          mask-image: radial-gradient(ellipse at 20% 80%, rgba(0, 0, 0, 1) 25%, rgba(0, 0, 0, 0) 75%);
          -webkit-mask-image: radial-gradient(ellipse at 20% 80%, rgba(0, 0, 0, 1) 25%, rgba(0, 0, 0, 0) 75%);
        }

        .region-left-col {
          position: absolute;
          left: 3.5rem;
          top: 1.5rem;
          width: 360px;
          z-index: 10;
          display: flex;
          flex-direction: column;
          pointer-events: auto;
        }

        .region-title {
          font-family: 'Orbitron', -apple-system, sans-serif;
          font-size: clamp(3.2rem, 4.4vw, 4.8rem);
          font-weight: 900;
          letter-spacing: 0.08em;
          line-height: 0.95;
          margin: 0 0 0.85rem 0;
          text-shadow: 0 2px 25px rgba(0, 0, 0, 0.95);
          background: linear-gradient(180deg, #FFFFFF 20%, #B8B8B5 75%, #6D6D6A 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .region-right-col {
          position: absolute;
          right: 3.5rem;
          top: 3.5rem;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          text-align: right;
          pointer-events: auto;
        }

        /* ── HEXAGONAL NETWORK GEOMETRY ── */
        .region-network-container {
          position: relative;
          z-index: 8;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        /* 2x2 Staggered Diamond Network for 4 Regions (USA Standard) */
        .network-grid-diamond {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .network-row-top {
          display: flex;
          justify-content: center;
          gap: 22px;
        }

        .network-row-bottom {
          display: flex;
          justify-content: center;
          gap: 22px;
          margin-top: -38px;
        }

        /* General Honeycomb Grid for Arbitrary Region Counts */
        .network-grid-dynamic {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 14px;
          max-width: 800px;
        }

        /* Standard Archival Hexagon Node */
        .archival-hex-node {
          width: 195px;
          height: 220px;
          position: relative;
          cursor: pointer;
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), filter 0.28s ease;
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          background-color: #111111;
        }

        .archival-hex-node:hover {
          transform: translateY(-8px) scale(1.04);
          filter: contrast(1.15) brightness(1.12);
        }

        .archival-hex-border {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 5;
          transition: opacity 0.25s ease;
        }

        .archival-hex-content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
          padding: 0 1rem 1.65rem 1rem;
          z-index: 4;
          text-align: center;
          background: linear-gradient(180deg, rgba(7, 7, 7, 0.05) 0%, rgba(7, 7, 7, 0.45) 50%, rgba(7, 7, 7, 0.95) 100%);
        }

        /* ── RESPONSIVE MEDIA QUERIES ── */
        @media (max-width: 1480px) {
          .region-left-col {
            left: 2.2rem;
            width: 310px;
            top: 1.2rem;
          }
          .region-title {
            font-size: clamp(2.8rem, 3.8vw, 3.8rem);
          }
          .region-right-col {
            right: 2.2rem;
            top: 2.8rem;
          }
          .archival-hex-node {
            width: 175px;
            height: 200px;
          }
          .network-row-bottom {
            margin-top: -34px;
            gap: 18px;
          }
          .network-row-top {
            gap: 18px;
          }
          .region-ambient-left {
            width: 420px;
            height: 300px;
            opacity: 0.3;
          }
        }

        @media (max-width: 1220px) {
          .region-left-col {
            left: 1.5rem;
            width: 270px;
          }
          .region-right-col {
            right: 1.5rem;
          }
          .archival-hex-node {
            width: 155px;
            height: 178px;
          }
          .network-row-bottom {
            margin-top: -30px;
            gap: 14px;
          }
          .network-row-top {
            gap: 14px;
          }
          .region-ambient-left {
            display: none;
          }
        }

        /* ── MOBILE ADAPTATION (<= 860px) ── */
        @media (max-width: 860px) {
          .region-stage {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding: 1.5rem 1rem 3rem 1rem;
            min-height: auto;
          }
          .region-left-col {
            position: relative;
            left: auto;
            top: auto;
            width: 100%;
            max-width: 480px;
            text-align: center;
            align-items: center;
            margin-bottom: 2rem;
          }
          .region-right-col {
            position: relative;
            right: auto;
            top: auto;
            width: 100%;
            max-width: 480px;
            align-items: center;
            text-align: center;
            margin-top: 2rem;
          }
          .archival-hex-node {
            width: 135px;
            height: 155px;
          }
          .network-row-bottom {
            margin-top: -24px;
            gap: 10px;
          }
          .network-row-top {
            gap: 10px;
          }
          .hidden-mobile {
            display: none !important;
          }
        }
      `}</style>

      {/* ── SUBTLE FILM GRAIN NOISE OVERLAYS ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          backgroundImage:
            "radial-gradient(ellipse at 50% 50%, rgba(17, 17, 17, 0) 0%, rgba(7, 7, 7, 0.75) 85%, rgba(0, 0, 0, 0.95) 100%)",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          opacity: 0.035,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── TOP NAVIGATION BAR ── */}
      <header
        style={{
          position: "relative",
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.2rem 3.5rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          backgroundColor: "rgba(7, 7, 7, 0.92)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Brand Left */}
        <div
          onClick={onBackToEarth}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
            cursor: "pointer",
          }}
        >
          <svg width="22" height="20" viewBox="0 0 24 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0L24 22H18.5L12 9.5L5.5 22H0L12 0Z" fill="#F2F2F0" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: "1.05rem",
                fontWeight: 900,
                letterSpacing: "0.18em",
                color: "#F2F2F0",
                lineHeight: 1,
              }}
            >
              AEROPURE
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.58rem",
                letterSpacing: "0.22em",
                color: "#929292",
                marginTop: "3px",
              }}
            >
              ATMOSPHERIC RESEARCH
            </span>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.75rem",
          }}
          className="hidden-mobile"
        >
          <div
            style={{
              padding: "0.4rem 0.9rem",
              border: "1px solid #6D6D6A",
              borderRadius: "2px",
              fontSize: "0.68rem",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              letterSpacing: "0.16em",
              color: "#F2F2F0",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
            }}
          >
            GEOSPATIAL INDEX
          </div>
          {["ATMOSPHERE", "INTELLIGENCE", "INSTRUMENTATION", "ARCHIVE"].map((item) => (
            <span
              key={item}
              style={{
                fontSize: "0.68rem",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 500,
                letterSpacing: "0.14em",
                color: "#929292",
                cursor: "pointer",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#F2F2F0")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#929292")}
            >
              {item}
            </span>
          ))}
        </nav>

        {/* Right CTA / Motto */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
          }}
        >
          <Search size={15} color="#929292" style={{ cursor: "pointer" }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.68rem",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.15em",
              color: "#B8B8B5",
            }}
          >
            <span>A CLEANER TOMORROW</span>
            <span style={{ color: "#6D6D6A" }}>—</span>
          </div>
        </div>
      </header>

      {/* ── BREADCRUMB & COMPACT TOP-RIGHT SEARCH BAR ── */}
      <div
        style={{
          position: "relative",
          zIndex: 15,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 3.5rem 0.5rem 3.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        {/* Breadcrumb Left */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.72rem",
            letterSpacing: "0.18em",
            color: "#929292",
          }}
        >
          <span
            onClick={onBackToEarth}
            style={{
              cursor: "pointer",
              color: "#929292",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#F2F2F0")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#929292")}
          >
            EARTH
          </span>
          <span style={{ color: "#41413F" }}>/</span>
          {continent && (
            <>
              <span
                onClick={onBackToContinent}
                style={{
                  cursor: "pointer",
                  color: "#929292",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#F2F2F0")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#929292")}
              >
                {continent.name.toUpperCase()}
              </span>
              <span style={{ color: "#41413F" }}>/</span>
            </>
          )}
          <span style={{ color: "#F2F2F0", fontWeight: 700 }}>{country.name.toUpperCase()}</span>
        </div>

        {/* Compact Search Control Right */}
        <div
          ref={searchContainerRef}
          style={{
            position: "relative",
            width: "360px",
            maxWidth: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              backgroundColor: "rgba(17, 17, 17, 0.85)",
              border: "1px solid #333331",
              borderRadius: "2px",
              padding: "0.6rem 1rem",
              backdropFilter: "blur(10px)",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            <Search size={14} color="#6D6D6A" />
            <input
              type="text"
              placeholder="Search city or region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#F2F2F0",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.72rem",
                letterSpacing: "0.05em",
              }}
            />
            {searchQuery && (
              <X
                size={13}
                color="#6D6D6A"
                style={{ cursor: "pointer" }}
                onClick={() => setSearchQuery("")}
              />
            )}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "0.35rem",
              fontSize: "0.58rem",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.2em",
              color: "#6D6D6A",
            }}
          >
            EXPLORE · ANALYZE · ACT
          </div>

          {/* Floating Dropdown Results */}
          {(localMatches.length > 0 || displayedLiveMatches.length > 0 || isSearching) && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                width: "100%",
                marginTop: "0.4rem",
                backgroundColor: "#111111",
                border: "1px solid #41413F",
                borderRadius: "2px",
                zIndex: 100,
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.85)",
                maxHeight: "360px",
                overflowY: "auto",
              }}
            >
              {isSearching && (
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    fontSize: "0.68rem",
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "#929292",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#F2F2F0",
                      animation: "pulse 1s infinite",
                    }}
                  />
                  SEARCHING GEOSPATIAL REGISTRY...
                </div>
              )}

              {/* Local Index Matches */}
              {localMatches.map((m, idx) => (
                <div
                  key={`local-${idx}`}
                  onClick={() => {
                    m.action();
                    setSearchQuery("");
                  }}
                  style={{
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#242423")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "#F2F2F0",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {m.title}
                    </div>
                    <div
                      style={{
                        fontSize: "0.62rem",
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "#929292",
                        marginTop: "2px",
                      }}
                    >
                      {m.subtitle}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.55rem",
                      fontFamily: "'JetBrains Mono', monospace",
                      color: "#B8B8B5",
                      border: "1px solid #41413F",
                      padding: "2px 5px",
                      borderRadius: "1px",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {m.type}
                  </span>
                </div>
              ))}

              {/* Live Geocoding OpenWeather Matches */}
              {displayedLiveMatches.map((item, idx) => (
                <div
                  key={`live-${idx}`}
                  onClick={() => {
                    onSelectLiveLocation(item);
                    setSearchQuery("");
                  }}
                  style={{
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#242423")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "#F2F2F0",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.62rem",
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "#929292",
                        marginTop: "2px",
                      }}
                    >
                      {item.state ? `${item.state}, ` : ""}
                      {item.country} • Lat: {item.lat.toFixed(2)}, Lon: {item.lon.toFixed(2)}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.55rem",
                      fontFamily: "'JetBrains Mono', monospace",
                      color: "#F2F2F0",
                      border: "1px solid #6D6D6A",
                      padding: "2px 5px",
                      borderRadius: "1px",
                      letterSpacing: "0.1em",
                      backgroundColor: "rgba(255, 255, 255, 0.06)",
                    }}
                  >
                    LIVE TELEMETRY
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN STAGE COMPOSITION ── */}
      <main className="region-stage">
        {/* Background Cartography (Monochrome Relief Map) */}
        <div className="region-bg-cartography">
          <div style={{ position: "relative", width: "100%", height: "100%", maxWidth: "1280px" }}>
            <Image
              src={config.reliefMap}
              alt="Geographic Topography"
              fill
              priority
              style={{ objectFit: "contain", filter: "grayscale(100%) contrast(1.1) brightness(0.75)" }}
            />
          </div>
        </div>

        {/* Ambient Left Atmospheric Visual (Golden Gate Bridge in Fog for USA) */}
        {config.ambientVisual && (
          <div className="region-ambient-left">
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
              <Image
                src={config.ambientVisual}
                alt="Atmospheric Coastal Feature"
                fill
                priority
                style={{ objectFit: "cover", filter: "grayscale(100%) contrast(1.15) brightness(0.65)" }}
              />
            </div>
          </div>
        )}

        {/* ── LEFT EDITORIAL COLUMN ── */}
        <div className="region-left-col">
          {/* Index & Section Label */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "0.75rem",
              marginBottom: "0.6rem",
            }}
          >
            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: "1.1rem",
                fontWeight: 900,
                letterSpacing: "0.1em",
                color: "#F2F2F0",
              }}
            >
              {config.index}
            </span>
          </div>

          {/* Archival Categorical Tags */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.2rem",
              marginBottom: "1.2rem",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.64rem",
              letterSpacing: "0.18em",
              color: "#929292",
              lineHeight: 1.3,
            }}
          >
            {config.editorialTags.map((tag, i) => (
              <span key={i}>{tag}</span>
            ))}
          </div>

          {/* Large Headline: Selected Country */}
          <h1 className="region-title">{config.headline || country.name.toUpperCase()}</h1>

          {/* Subheader: REGIONAL AIR INTELLIGENCE */}
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.86rem",
              fontWeight: 700,
              letterSpacing: "0.2em",
              color: "#F2F2F0",
              marginBottom: "1rem",
            }}
          >
            {config.subhead}
          </div>

          {/* Description */}
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.78rem",
              lineHeight: 1.6,
              color: "#929292",
              maxWidth: "340px",
              marginBottom: "2rem",
            }}
          >
            {config.tagline}
          </p>

          {/* Target Crosshair Badge & Motivational Motto */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "1rem",
              padding: "0.85rem 1rem",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              backgroundColor: "rgba(17, 17, 17, 0.6)",
              backdropFilter: "blur(6px)",
              borderRadius: "2px",
              maxWidth: "320px",
            }}
          >
            <Target size={22} color="#929292" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.68rem",
                fontStyle: "italic",
                lineHeight: 1.5,
                color: "#B8B8B5",
                letterSpacing: "0.04em",
                whiteSpace: "pre-line",
              }}
            >
              {config.quote}
            </div>
          </div>
        </div>

        {/* ── CENTER REGIONAL HEXAGONAL NETWORK ── */}
        <div className="region-network-container">
          {/* If exactly 4 regions (e.g. USA: CA, NY, TX, WA), render the editorial diamond layout */}
          {regions.length === 4 ? (
            <div className="network-grid-diamond">
              {/* Top Row: California (left) & New York State (right) */}
              <div className="network-row-top">
                {regions.slice(0, 2).map((region) => {
                  const imageSrc = config.regionVisuals[region.id] || "/stamps/geo_north-america.jpg";
                  const isHovered = hoveredRegion?.id === region.id;

                  return (
                    <div
                      key={region.id}
                      className="archival-hex-node"
                      onClick={() => onSelectRegion(region.id)}
                      onMouseEnter={() => setHoveredRegion(region)}
                      onMouseLeave={() => setHoveredRegion(null)}
                    >
                      {/* Photographic Background */}
                      <Image
                        src={imageSrc}
                        alt={region.name}
                        fill
                        className="object-cover"
                        style={{
                          filter: isHovered
                            ? "grayscale(100%) contrast(1.2) brightness(0.9)"
                            : "grayscale(100%) contrast(1.1) brightness(0.7)",
                          transition: "filter 0.3s ease",
                        }}
                      />

                      {/* SVG Hexagon Border for precision */}
                      <svg
                        className="archival-hex-border"
                        viewBox="0 0 100 115"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="none"
                        style={{
                          stroke: isHovered ? "#F2F2F0" : "#41413F",
                          strokeWidth: isHovered ? "2.5px" : "1.5px",
                          filter: isHovered ? "drop-shadow(0 0 6px rgba(242, 242, 240, 0.4))" : "none",
                          transition: "all 0.25s ease",
                        }}
                      >
                        <polygon points="50,1 99,28 99,86 50,114 1,86 1,28" />
                      </svg>

                      {/* Content Overlay */}
                      <div className="archival-hex-content">
                        <div
                          style={{
                            fontFamily: "'Orbitron', sans-serif",
                            fontSize: "0.88rem",
                            fontWeight: 800,
                            letterSpacing: "0.12em",
                            color: isHovered ? "#FFFFFF" : "#F2F2F0",
                            lineHeight: 1.2,
                            textShadow: "0 2px 8px rgba(0, 0, 0, 0.9)",
                            marginBottom: "0.4rem",
                          }}
                        >
                          {region.name.toUpperCase()}
                        </div>
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "0.62rem",
                            fontWeight: 600,
                            letterSpacing: "0.18em",
                            color: isHovered ? "#FFFFFF" : "#929292",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                          }}
                        >
                          <span
                            style={{
                              width: "5px",
                              height: "5px",
                              borderRadius: "50%",
                              backgroundColor: isHovered ? "#F2F2F0" : "#6D6D6A",
                            }}
                          />
                          ACTIVE
                        </div>

                        {/* Subtle Explore indicator on hover */}
                        {isHovered && (
                          <div
                            style={{
                              marginTop: "0.35rem",
                              fontSize: "0.56rem",
                              fontFamily: "'JetBrains Mono', monospace",
                              letterSpacing: "0.15em",
                              color: "#F2F2F0",
                              display: "flex",
                              alignItems: "center",
                              gap: "2px",
                              borderTop: "1px solid rgba(255, 255, 255, 0.2)",
                              paddingTop: "0.25rem",
                              width: "80%",
                              justifyContent: "center",
                            }}
                          >
                            EXPLORE <ArrowUpRight size={10} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Row: Texas (left) & Washington State (right) */}
              <div className="network-row-bottom">
                {regions.slice(2, 4).map((region) => {
                  const imageSrc = config.regionVisuals[region.id] || "/stamps/geo_north-america.jpg";
                  const isHovered = hoveredRegion?.id === region.id;

                  return (
                    <div
                      key={region.id}
                      className="archival-hex-node"
                      onClick={() => onSelectRegion(region.id)}
                      onMouseEnter={() => setHoveredRegion(region)}
                      onMouseLeave={() => setHoveredRegion(null)}
                    >
                      {/* Photographic Background */}
                      <Image
                        src={imageSrc}
                        alt={region.name}
                        fill
                        className="object-cover"
                        style={{
                          filter: isHovered
                            ? "grayscale(100%) contrast(1.2) brightness(0.9)"
                            : "grayscale(100%) contrast(1.1) brightness(0.7)",
                          transition: "filter 0.3s ease",
                        }}
                      />

                      {/* SVG Hexagon Border for precision */}
                      <svg
                        className="archival-hex-border"
                        viewBox="0 0 100 115"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="none"
                        style={{
                          stroke: isHovered ? "#F2F2F0" : "#41413F",
                          strokeWidth: isHovered ? "2.5px" : "1.5px",
                          filter: isHovered ? "drop-shadow(0 0 6px rgba(242, 242, 240, 0.4))" : "none",
                          transition: "all 0.25s ease",
                        }}
                      >
                        <polygon points="50,1 99,28 99,86 50,114 1,86 1,28" />
                      </svg>

                      {/* Content Overlay */}
                      <div className="archival-hex-content">
                        <div
                          style={{
                            fontFamily: "'Orbitron', sans-serif",
                            fontSize: "0.88rem",
                            fontWeight: 800,
                            letterSpacing: "0.12em",
                            color: isHovered ? "#FFFFFF" : "#F2F2F0",
                            lineHeight: 1.2,
                            textShadow: "0 2px 8px rgba(0, 0, 0, 0.9)",
                            marginBottom: "0.4rem",
                          }}
                        >
                          {region.name.toUpperCase()}
                        </div>
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "0.62rem",
                            fontWeight: 600,
                            letterSpacing: "0.18em",
                            color: isHovered ? "#FFFFFF" : "#929292",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                          }}
                        >
                          <span
                            style={{
                              width: "5px",
                              height: "5px",
                              borderRadius: "50%",
                              backgroundColor: isHovered ? "#F2F2F0" : "#6D6D6A",
                            }}
                          />
                          ACTIVE
                        </div>

                        {/* Subtle Explore indicator on hover */}
                        {isHovered && (
                          <div
                            style={{
                              marginTop: "0.35rem",
                              fontSize: "0.56rem",
                              fontFamily: "'JetBrains Mono', monospace",
                              letterSpacing: "0.15em",
                              color: "#F2F2F0",
                              display: "flex",
                              alignItems: "center",
                              gap: "2px",
                              borderTop: "1px solid rgba(255, 255, 255, 0.2)",
                              paddingTop: "0.25rem",
                              width: "80%",
                              justifyContent: "center",
                            }}
                          >
                            EXPLORE <ArrowUpRight size={10} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Arbitrary count (e.g. India with 22 regions or Germany with 3) */
            <div className="network-grid-dynamic">
              {regions.map((region) => {
                const imageSrc = config.regionVisuals[region.id] || config.reliefMap;
                const isHovered = hoveredRegion?.id === region.id;

                return (
                  <div
                    key={region.id}
                    className="archival-hex-node"
                    onClick={() => onSelectRegion(region.id)}
                    onMouseEnter={() => setHoveredRegion(region)}
                    onMouseLeave={() => setHoveredRegion(null)}
                  >
                    <Image
                      src={imageSrc}
                      alt={region.name}
                      fill
                      className="object-cover"
                      style={{
                        filter: isHovered
                          ? "grayscale(100%) contrast(1.2) brightness(0.9)"
                          : "grayscale(100%) contrast(1.1) brightness(0.6)",
                        transition: "filter 0.3s ease",
                      }}
                    />

                    <svg
                      className="archival-hex-border"
                      viewBox="0 0 100 115"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      preserveAspectRatio="none"
                      style={{
                        stroke: isHovered ? "#F2F2F0" : "#41413F",
                        strokeWidth: isHovered ? "2.5px" : "1.5px",
                        filter: isHovered ? "drop-shadow(0 0 6px rgba(242, 242, 240, 0.4))" : "none",
                        transition: "all 0.25s ease",
                      }}
                    >
                      <polygon points="50,1 99,28 99,86 50,114 1,86 1,28" />
                    </svg>

                    <div className="archival-hex-content">
                      <div
                        style={{
                          fontFamily: "'Orbitron', sans-serif",
                          fontSize: "0.82rem",
                          fontWeight: 800,
                          letterSpacing: "0.1em",
                          color: isHovered ? "#FFFFFF" : "#F2F2F0",
                          lineHeight: 1.2,
                          textShadow: "0 2px 8px rgba(0, 0, 0, 0.9)",
                          marginBottom: "0.3rem",
                        }}
                      >
                        {region.name.toUpperCase()}
                      </div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "0.58rem",
                          fontWeight: 600,
                          letterSpacing: "0.15em",
                          color: isHovered ? "#FFFFFF" : "#929292",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.3rem",
                        }}
                      >
                        <span
                          style={{
                            width: "5px",
                            height: "5px",
                            borderRadius: "50%",
                            backgroundColor: isHovered ? "#F2F2F0" : "#6D6D6A",
                          }}
                        />
                        ACTIVE
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT EDITORIAL COLUMN ── */}
        <div className="region-right-col">
          {/* Lateral Telemetry Tags */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.3rem",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.64rem",
              letterSpacing: "0.18em",
              color: "#929292",
              marginBottom: "2rem",
            }}
          >
            {config.lateralRightTags.map((tag, i) => (
              <span key={i}>{tag}</span>
            ))}
          </div>

          {/* Dynamic Geographic Coordinates */}
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.72rem",
              letterSpacing: "0.12em",
              color: "#B8B8B5",
              lineHeight: 1.6,
              whiteSpace: "pre-line",
              marginBottom: "2rem",
            }}
          >
            {formattedCoords}
          </div>

          {/* Archival Polaroid Card / Vintage Stamp */}
          {config.polaroidPhoto && (
            <div
              style={{
                position: "relative",
                width: "155px",
                height: "190px",
                backgroundColor: "#F2F2F0",
                padding: "8px 8px 24px 8px",
                boxShadow: "0 12px 35px rgba(0, 0, 0, 0.9)",
                transform: "rotate(6deg)",
                transition: "transform 0.3s ease",
                marginBottom: "2rem",
                display: "flex",
                flexDirection: "column",
                borderRadius: "1px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "rotate(2deg) scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "rotate(6deg) scale(1)")}
            >
              <div style={{ position: "relative", flex: 1, overflow: "hidden", backgroundColor: "#070707" }}>
                <Image
                  src={config.polaroidPhoto}
                  alt="Archival Stamp"
                  fill
                  className="object-cover"
                  style={{ filter: "grayscale(100%) contrast(1.15)" }}
                />
              </div>
              {config.polaroidCaption && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "6px",
                    left: "8px",
                    right: "8px",
                    textAlign: "center",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.52rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: "#242423",
                  }}
                >
                  <div>{config.polaroidCaption[0]}</div>
                  <div style={{ fontSize: "0.46rem", color: "#6D6D6A", marginTop: "1px" }}>
                    {config.polaroidCaption[1]}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lower Right Archival Motto */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.6rem",
              letterSpacing: "0.2em",
              color: "#6D6D6A",
            }}
          >
            {config.bottomMotto.map((motto, i) => (
              <span key={i}>{motto}</span>
            ))}
          </div>
        </div>
      </main>

      {/* ── BOTTOM INFORMATION STRIP ── */}
      <footer
        style={{
          position: "relative",
          zIndex: 20,
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          backgroundColor: "#070707",
          padding: "1.2rem 3.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1.5rem",
        }}
      >
        {/* Leftmost Global Counter */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.9rem",
          }}
        >
          <Globe size={22} color="#929292" />
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.64rem",
              letterSpacing: "0.14em",
              color: "#929292",
              lineHeight: 1.4,
            }}
          >
            <div>{regionsCountFormatted} REGIONS</div>
            <div style={{ color: "#6D6D6A" }}>1 SHARED ATMOSPHERE</div>
          </div>
        </div>

        {/* Center 4 Archival Blocks */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "3rem",
            flexWrap: "wrap",
          }}
          className="hidden-mobile"
        >
          {/* Block 1: Regions Available */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <Layers size={18} color="#FFFFFF" />
            <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <div style={{ fontSize: "0.58rem", letterSpacing: "0.18em", color: "#929292" }}>REGIONS</div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: "#FFFFFF" }}>
                {regionsCountFormatted} AVAILABLE
              </div>
            </div>
          </div>

          {/* Block 2: Geospatial Level */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <BarChart3 size={18} color="#929292" />
            <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <div style={{ fontSize: "0.58rem", letterSpacing: "0.18em", color: "#6D6D6A" }}>GEOSPATIAL LEVEL</div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: "#B8B8B5" }}>
                NATIONAL → REGIONAL
              </div>
            </div>
          </div>

          {/* Block 3: Air Intelligence Telemetry */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <Activity size={18} color="#929292" />
            <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <div style={{ fontSize: "0.58rem", letterSpacing: "0.18em", color: "#6D6D6A" }}>AIR INTELLIGENCE</div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: "#D9D9D6" }}>
                LIVE TELEMETRY
              </div>
            </div>
          </div>

          {/* Block 4: Next Level Navigation */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <Leaf size={18} color="#929292" />
            <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <div style={{ fontSize: "0.58rem", letterSpacing: "0.18em", color: "#6D6D6A" }}>NEXT LEVEL</div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: "#F2F2F0" }}>
                SELECT A CITY →
              </div>
            </div>
          </div>
        </div>

        {/* Rightmost Copyright */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.64rem",
            letterSpacing: "0.18em",
            color: "#6D6D6A",
          }}
        >
          AEROPURE © 2026
        </div>
      </footer>
    </div>
  );
}
