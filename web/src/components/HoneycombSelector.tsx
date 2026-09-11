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
        background: "#080808",
        border: "1px solid var(--border-gold)",
        borderRadius: 16,
        padding: "1.8rem",
        marginBottom: "2.5rem",
        boxShadow: "0 20px 60px rgba(0,0,0,0.85)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Hex Pattern Subtle Overlay */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.08,
          pointerEvents: "none",
        }}
      >
        <defs>
          <pattern id="hex-bg" width="56" height="97" patternUnits="userSpaceOnUse">
            <path
              d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z M28 48 L56 64 L56 96 L28 112 L0 96 L0 64 Z"
              fill="none"
              stroke="var(--gold)"
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
          borderBottom: "1px solid var(--border)",
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
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginBottom: "0.4rem",
              fontFamily: "Orbitron, sans-serif",
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
                color: level === "cities" ? "var(--gold)" : "var(--text-muted)",
                cursor: "pointer",
                padding: 0,
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <Globe size={14} color="var(--gold)" />
              INDIA GEOSPATIAL INDEX
            </button>

            {level === "areas" && (
              <>
                <ChevronRight size={12} color="var(--text-muted)" />
                <span style={{ color: "var(--gold)", fontWeight: 700 }}>
                  {activeCity.name.toUpperCase()}
                </span>
              </>
            )}
          </div>

          <h2
            style={{
              fontFamily: "Orbitron, sans-serif",
              fontSize: "1.4rem",
              fontWeight: 800,
              color: "var(--gold-bright)",
              letterSpacing: "0.04em",
              margin: 0,
            }}
          >
            {level === "cities" ? "SELECT A LOCATION" : `SELECT LOCALITY ZONE — ${activeCity.name.toUpperCase()}`}
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            {level === "cities"
              ? "Interactive Honeycomb index of State Capitals and Major Indian Metropolitan Hubs."
              : `Curated locality zones in ${activeCity.name}, ${activeCity.state}.`}
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          {level === "areas" && (
            <button
              onClick={() => setLevel("cities")}
              style={{
                background: "rgba(201,162,39,0.1)",
                border: "1px solid var(--gold-dim)",
                color: "var(--gold)",
                padding: "0.45rem 0.9rem",
                borderRadius: 8,
                fontSize: "0.78rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={14} /> BACK TO CITIES
            </button>
          )}

          {level === "cities" && (
            <div style={{ display: "flex", background: "rgba(15,15,15,0.8)", border: "1px solid var(--border)", borderRadius: 8, padding: "2px" }}>
              <button
                onClick={() => setCategoryFilter("all")}
                style={{
                  background: categoryFilter === "all" ? "var(--gold-dim)" : "transparent",
                  color: categoryFilter === "all" ? "var(--gold-bright)" : "var(--text-muted)",
                  border: "none",
                  padding: "0.35rem 0.75rem",
                  borderRadius: 6,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ALL (32)
              </button>
              <button
                onClick={() => setCategoryFilter("capitals")}
                style={{
                  background: categoryFilter === "capitals" ? "var(--gold-dim)" : "transparent",
                  color: categoryFilter === "capitals" ? "var(--gold-bright)" : "var(--text-muted)",
                  border: "none",
                  padding: "0.35rem 0.75rem",
                  borderRadius: 6,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                CAPITALS
              </button>
              <button
                onClick={() => setCategoryFilter("major")}
                style={{
                  background: categoryFilter === "major" ? "var(--gold-dim)" : "transparent",
                  color: categoryFilter === "major" ? "var(--gold-bright)" : "var(--text-muted)",
                  border: "none",
                  padding: "0.35rem 0.75rem",
                  borderRadius: 6,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                MAJOR METROS
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
                background: "rgba(10,10,10,0.9)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "0.45rem 0.75rem 0.45rem 2rem",
                color: "var(--text-primary)",
                fontSize: "0.78rem",
                outline: "none",
                width: "160px",
              }}
            />
            <Filter size={12} color="var(--gold)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          </div>
        </div>
      </div>

      {/* ── LEVEL 1: HONEYCOMB CITY GRID ───────────────────────────────────── */}
      {level === "cities" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "1.2rem 0.8rem",
            padding: "1rem 0",
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
                    ? "radial-gradient(circle, rgba(201,162,39,0.3) 0%, rgba(20,20,20,0.9) 100%)"
                    : isCapital
                    ? "radial-gradient(circle, rgba(30,30,30,0.95) 0%, rgba(14,14,14,0.95) 100%)"
                    : "rgba(16,16,16,0.9)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "1rem 0.6rem",
                  textAlign: "center",
                  transition: "all 0.25s ease-in-out",
                  boxShadow: isSelected ? "0 0 20px rgba(201,162,39,0.4)" : "none",
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
                      ? "2px solid var(--gold-bright)"
                      : isCapital
                      ? "1px solid rgba(201,162,39,0.4)"
                      : "1px solid #282828",
                    pointerEvents: "none",
                  }}
                />

                {/* Badge Tag */}
                <span
                  style={{
                    fontSize: "0.58rem",
                    fontFamily: "Orbitron, sans-serif",
                    fontWeight: 700,
                    color: isCapital ? "var(--gold)" : "var(--text-muted)",
                    letterSpacing: "0.08em",
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
                    fontSize: "0.85rem",
                    fontWeight: 800,
                    color: isSelected ? "var(--gold-bright)" : "var(--text-primary)",
                    margin: "0 0 0.15rem 0",
                    lineHeight: 1.1,
                  }}
                >
                  {city.name}
                </h4>

                {/* State Name */}
                <span
                  style={{
                    fontSize: "0.64rem",
                    color: "var(--text-muted)",
                    maxWidth: "90%",
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
                    fontSize: "0.58rem",
                    color: "var(--gold-dim)",
                    marginTop: "0.3rem",
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
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "1.2rem 0.8rem",
              padding: "1rem 0",
              position: "relative",
              zIndex: 5,
            }}
          >
            {filteredAreas.map((area) => {
              const isSelectedArea = area.slug === selectedAreaSlug;
              const isHazardousHint = area.defaultRegimeHint === 2;

              return (
                <div
                  key={area.slug}
                  onClick={() => handleAreaClick(area)}
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "1 / 1.15",
                    clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                    background: isSelectedArea
                      ? "radial-gradient(circle, rgba(201,162,39,0.35) 0%, rgba(20,20,20,0.95) 100%)"
                      : isHazardousHint
                      ? "radial-gradient(circle, rgba(214,40,40,0.2) 0%, rgba(18,18,18,0.95) 100%)"
                      : "rgba(18,18,18,0.9)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1rem 0.6rem",
                    textAlign: "center",
                    transition: "all 0.25s ease-in-out",
                  }}
                  className="honeycomb-hex"
                >
                  {/* Hex Inner Border */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 2,
                      clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                      border: isSelectedArea
                        ? "2px solid var(--gold-bright)"
                        : isHazardousHint
                        ? "1px solid var(--red)"
                        : "1px solid #333333",
                      pointerEvents: "none",
                    }}
                  />

                  <MapPin size={16} color={isSelectedArea ? "var(--gold-bright)" : isHazardousHint ? "var(--red-bright)" : "var(--gold)"} style={{ marginBottom: "0.2rem" }} />

                  {/* Locality Name */}
                  <h4
                    style={{
                      fontFamily: "Orbitron, sans-serif",
                      fontSize: "0.85rem",
                      fontWeight: 800,
                      color: isSelectedArea ? "var(--gold-bright)" : "var(--text-primary)",
                      margin: "0 0 0.2rem 0",
                      lineHeight: 1.15,
                    }}
                  >
                    {area.name}
                  </h4>

                  {/* Coordinates */}
                  <span style={{ fontSize: "0.62rem", fontFamily: "monospace", color: "var(--text-muted)" }}>
                    {area.lat.toFixed(2)}°N, {area.lon.toFixed(2)}°E
                  </span>

                  {/* Regime / Hazard Status Hint */}
                  <span
                    style={{
                      fontSize: "0.58rem",
                      fontFamily: "Orbitron, sans-serif",
                      fontWeight: 700,
                      marginTop: "0.3rem",
                      color: isHazardousHint ? "var(--red-bright)" : "var(--gold-dim)",
                    }}
                  >
                    {isHazardousHint ? "ELEVATED RISK" : "VALIDATED ZONE"}
                  </span>
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "1rem", textAlign: "right" }}>
            * Note: Honeycomb nodes represent geospatial location indexing. Predictions are generated in real-time by AeroPure&apos;s XGBoost ML engine.
          </p>
        </div>
      )}

      {/* Embedded Custom CSS for Hexagon Hover Animations */}
      <style jsx>{`
        .honeycomb-hex:hover {
          transform: scale(1.06);
          filter: drop-shadow(0 0 12px rgba(201, 162, 39, 0.4));
          z-index: 10;
        }
      `}</style>
    </div>
  );
}
