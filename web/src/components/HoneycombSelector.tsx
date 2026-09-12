"use client";

import { useState, useMemo } from "react";
import { CITIES, City, Area } from "@/lib/locations";
import { MapPin, ChevronRight, ArrowLeft, Globe, Filter } from "lucide-react";

interface Props {
  selectedCitySlug: string;
  selectedAreaSlug: string;
  onSelectLocation: (citySlug: string, areaSlug: string) => void;
}

export default function HoneycombSelector({
  selectedCitySlug,
  selectedAreaSlug,
  onSelectLocation,
}: Props) {
  // Navigation State: 'cities' (Level 1) or 'areas' (Level 2)
  const [level, setLevel] = useState<"cities" | "areas">("cities");
  const [activeCitySlug, setActiveCitySlug] = useState<string>(selectedCitySlug);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "capitals" | "major">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const activeCity = useMemo(() => {
    return CITIES.find((c) => c.slug === activeCitySlug) ?? CITIES[0];
  }, [activeCitySlug]);

  // Filter Level 1 Cities
  const filteredCities = useMemo(() => {
    return CITIES.filter((c) => {
      const matchCat =
        categoryFilter === "all"
          ? true
          : categoryFilter === "capitals"
          ? c.isCapital
          : !c.isCapital;
      const matchSearch =
        !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.state.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [categoryFilter, searchQuery]);

  // Filter Level 2 Areas
  const filteredAreas = useMemo(() => {
    if (!activeCity) return [];
    return activeCity.areas.filter(
      (a) =>
        !searchQuery.trim() ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeCity, searchQuery]);

  const handleCityClick = (city: City) => {
    setActiveCitySlug(city.slug);
    setLevel("areas");
    setSearchQuery("");
  };

  const handleAreaClick = (area: Area) => {
    onSelectLocation(activeCitySlug, area.slug);
  };

  return (
    <div
      style={{
        background: "#090909",
        border: "1px solid var(--border-default)",
        borderRadius: 4,
        padding: "1.8rem",
        marginBottom: "2.5rem",
        boxShadow: "0 20px 60px rgba(0,0,0,0.85)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Hex Pattern Subtle Monochrome Overlay */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.04,
          pointerEvents: "none",
        }}
      >
        <defs>
          <pattern id="hex-bg" width="56" height="97" patternUnits="userSpaceOnUse">
            <path
              d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z M28 48 L56 64 L56 96 L28 112 L0 96 L0 64 Z"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="0.8"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-bg)" />
      </svg>

      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
          borderBottom: "1px solid var(--border-default)",
          paddingBottom: "1rem",
          position: "relative",
          zIndex: 5,
        }}
      >
        <div>
          {/* Breadcrumb Navigation */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.72rem",
              color: "var(--silver)",
              marginBottom: "0.3rem",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            <button
              onClick={() => {
                setLevel("cities");
                setSearchQuery("");
              }}
              style={{
                background: "transparent",
                border: "none",
                color: level === "cities" ? "var(--air-white)" : "var(--silver)",
                cursor: "pointer",
                padding: 0,
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <Globe size={13} color="var(--air-white)" />
              GEOSPATIAL INDEX
            </button>

            {level === "areas" && (
              <>
                <ChevronRight size={11} color="var(--steel)" />
                <span style={{ color: "var(--air-white)", fontWeight: 700 }}>
                  {activeCity.name.toUpperCase()}
                </span>
              </>
            )}
          </div>

          <h3
            style={{
              fontFamily: "Orbitron, sans-serif",
              fontSize: "1.25rem",
              fontWeight: 900,
              color: "var(--air-white)",
              margin: 0,
              letterSpacing: "0.06em",
            }}
          >
            {level === "cities"
              ? "INDIAN GEOSPATIAL AIR INDEX"
              : `${activeCity.name.toUpperCase()} LOCALITY NODES`}
          </h3>
        </div>

        {/* Controls Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          {level === "areas" && (
            <button
              onClick={() => {
                setLevel("cities");
                setSearchQuery("");
              }}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-default)",
                color: "var(--air-white)",
                padding: "0.4rem 0.8rem",
                borderRadius: 2,
                fontSize: "0.72rem",
                fontFamily: "JetBrains Mono, monospace",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                letterSpacing: "0.06em",
              }}
            >
              <ArrowLeft size={12} /> BACK TO CITIES
            </button>
          )}

          {level === "cities" && (
            <div
              style={{
                display: "flex",
                background: "rgba(20, 20, 20, 0.9)",
                border: "1px solid var(--border-default)",
                borderRadius: 2,
                padding: "2px",
              }}
            >
              <button
                onClick={() => setCategoryFilter("all")}
                style={{
                  background: categoryFilter === "all" ? "var(--air-white)" : "transparent",
                  color: categoryFilter === "all" ? "var(--void)" : "var(--silver)",
                  border: "none",
                  padding: "0.35rem 0.75rem",
                  borderRadius: 2,
                  fontSize: "0.68rem",
                  fontFamily: "JetBrains Mono, monospace",
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.08em",
                }}
              >
                ALL ({CITIES.length})
              </button>
              <button
                onClick={() => setCategoryFilter("capitals")}
                style={{
                  background: categoryFilter === "capitals" ? "var(--air-white)" : "transparent",
                  color: categoryFilter === "capitals" ? "var(--void)" : "var(--silver)",
                  border: "none",
                  padding: "0.35rem 0.75rem",
                  borderRadius: 2,
                  fontSize: "0.68rem",
                  fontFamily: "JetBrains Mono, monospace",
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.08em",
                }}
              >
                CAPITALS
              </button>
              <button
                onClick={() => setCategoryFilter("major")}
                style={{
                  background: categoryFilter === "major" ? "var(--air-white)" : "transparent",
                  color: categoryFilter === "major" ? "var(--void)" : "var(--silver)",
                  border: "none",
                  padding: "0.35rem 0.75rem",
                  borderRadius: 2,
                  fontSize: "0.68rem",
                  fontFamily: "JetBrains Mono, monospace",
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.08em",
                }}
              >
                METROS
              </button>
            </div>
          )}

          {/* Quick Filter Input */}
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder={level === "cities" ? "Filter City..." : "Filter Locality..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "rgba(15, 15, 15, 0.95)",
                border: "1px solid var(--border-default)",
                borderRadius: 2,
                padding: "0.4rem 0.75rem 0.4rem 1.8rem",
                color: "var(--air-white)",
                fontSize: "0.72rem",
                fontFamily: "JetBrains Mono, monospace",
                outline: "none",
                width: "150px",
              }}
            />
            <Filter size={11} color="var(--silver)" style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)" }} />
          </div>
        </div>
      </div>

      {/* ── LEVEL 1: HONEYCOMB CITY GRID ───────────────────────────────────── */}
      {level === "cities" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(136px, 1fr))",
            gap: "1.1rem 0.75rem",
            padding: "0.8rem 0",
            position: "relative",
            zIndex: 5,
          }}
        >
          {filteredCities.map((city) => {
            const isSelected = city.slug === activeCitySlug;
            const isCapital = city.isCapital;

            return (
              <div
                key={city.slug}
                onClick={() => handleCityClick(city)}
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "1 / 1.15",
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  background: isSelected
                    ? "var(--air-white)"
                    : isCapital
                    ? "var(--graphite)"
                    : "var(--charcoal)",
                  color: isSelected ? "var(--void)" : "var(--air-white)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.9rem 0.5rem",
                  textAlign: "center",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: isSelected ? "0 0 20px rgba(255, 255, 255, 0.28)" : "none",
                }}
                className="honeycomb-hex"
              >
                {/* Hex Border Simulation */}
                <div
                  style={{
                    position: "absolute",
                    inset: 2,
                    clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                    border: isSelected
                      ? "2px solid #070707"
                      : "1px solid rgba(255, 255, 255, 0.14)",
                    pointerEvents: "none",
                  }}
                />

                {/* Badge Tag */}
                <span
                  style={{
                    fontSize: "0.55rem",
                    fontFamily: "JetBrains Mono, monospace",
                    fontWeight: 700,
                    color: isSelected ? "#070707" : "var(--silver)",
                    letterSpacing: "0.1em",
                    marginBottom: "0.2rem",
                    opacity: 0.9,
                  }}
                >
                  {isCapital ? "CAPITAL" : "METRO"}
                </span>

                {/* City Name */}
                <h4
                  style={{
                    fontFamily: "Orbitron, sans-serif",
                    fontSize: "0.82rem",
                    fontWeight: 900,
                    color: isSelected ? "#070707" : "var(--air-white)",
                    margin: "0 0 0.15rem 0",
                    lineHeight: 1.1,
                  }}
                >
                  {city.name}
                </h4>

                {/* State Name */}
                <span
                  style={{
                    fontSize: "0.6rem",
                    fontFamily: "JetBrains Mono, monospace",
                    color: isSelected ? "#242423" : "var(--silver)",
                    maxWidth: "88%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {city.state}
                </span>

                {/* Locality Count Indicator */}
                <span
                  style={{
                    fontSize: "0.55rem",
                    fontFamily: "JetBrains Mono, monospace",
                    color: isSelected ? "#41413F" : "var(--steel)",
                    marginTop: "0.25rem",
                    letterSpacing: "0.06em",
                  }}
                >
                  {city.areas.length} ZONES
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── LEVEL 2: HONEYCOMB AREA GRID ───────────────────────────────────── */}
      {level === "areas" && (
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "1.1rem 0.75rem",
              padding: "0.8rem 0",
              position: "relative",
              zIndex: 5,
            }}
          >
            {filteredAreas.map((area) => {
              const isSelected =
                activeCitySlug === selectedCitySlug && area.slug === selectedAreaSlug;

              return (
                <div
                  key={area.slug}
                  onClick={() => handleAreaClick(area)}
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "1 / 1.15",
                    clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                    background: isSelected
                      ? "var(--air-white)"
                      : "var(--charcoal)",
                    color: isSelected ? "var(--void)" : "var(--air-white)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.9rem 0.5rem",
                    textAlign: "center",
                    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: isSelected ? "0 0 20px rgba(255, 255, 255, 0.28)" : "none",
                  }}
                  className="honeycomb-hex"
                >
                  {/* Hex Border Simulation */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 2,
                      clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                      border: isSelected
                        ? "2px solid #070707"
                        : "1px solid rgba(255, 255, 255, 0.14)",
                      pointerEvents: "none",
                    }}
                  />

                  <MapPin
                    size={13}
                    color={isSelected ? "#070707" : "var(--silver)"}
                    style={{ marginBottom: "0.2rem" }}
                  />

                  {/* Locality Name */}
                  <h4
                    style={{
                      fontFamily: "Orbitron, sans-serif",
                      fontSize: "0.8rem",
                      fontWeight: 800,
                      color: isSelected ? "#070707" : "var(--air-white)",
                      margin: "0 0 0.15rem 0",
                      lineHeight: 1.1,
                      maxWidth: "90%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {area.name}
                  </h4>

                  {/* Coordinates */}
                  <span
                    style={{
                      fontSize: "0.58rem",
                      fontFamily: "JetBrains Mono, monospace",
                      color: isSelected ? "#333333" : "var(--silver)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {area.lat.toFixed(2)}°N, {area.lon.toFixed(2)}°E
                  </span>

                  {/* Indexing Status */}
                  <span
                    style={{
                      fontSize: "0.55rem",
                      fontFamily: "JetBrains Mono, monospace",
                      fontWeight: 700,
                      marginTop: "0.25rem",
                      color: isSelected ? "#070707" : "var(--steel)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    MONITORED
                  </span>
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: "0.7rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)", marginTop: "1rem", textAlign: "right" }}>
            * Hexagonal nodes represent geospatial location indexing. Real-time inference driven by AeroPure XGBoost ML engine.
          </p>
        </div>
      )}

      {/* Embedded Custom CSS for Hexagon Hover Animations */}
      <style jsx>{`
        .honeycomb-hex:hover {
          transform: scale(1.05);
          background: var(--silver) !important;
          color: #070707 !important;
          z-index: 10;
        }
        .honeycomb-hex:hover h4,
        .honeycomb-hex:hover span {
          color: #070707 !important;
        }
      `}</style>
    </div>
  );
}
