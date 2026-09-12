"use client";

import { useState } from "react";
import { Search, MapPin, Compass, RefreshCw, AlertCircle, Wind, Droplets, Thermometer } from "lucide-react";
import { Area, CITIES } from "@/lib/locations";

interface WeatherState {
  available: boolean;
  temp?: number;
  humidity?: number;
  windSpeed?: number;
  condition?: string;
  description?: string;
  error?: string;
}

interface Props {
  selectedArea: string;
  currentAreaObj: Area | null;
  onSelectArea: (citySlug: string, areaSlug: string) => void;
  weatherState: WeatherState;
  onRetryWeather: () => void;
}

export default function HeroMap({
  selectedArea,
  currentAreaObj,
  onSelectArea,
  weatherState,
  onRetryWeather,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Flatten all areas across cities for location search
  const allLocations: { citySlug: string; areaSlug: string; cityName: string; areaName: string }[] = [];
  CITIES.forEach((c) => {
    c.areas.forEach((a) => {
      allLocations.push({
        citySlug: c.slug,
        areaSlug: a.slug,
        cityName: c.name,
        areaName: a.name,
      });
    });
  });

  const filteredLocations = searchQuery.trim()
    ? allLocations.filter(
        (l) =>
          l.cityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.areaName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const lat = currentAreaObj?.lat ?? 17.385;
  const lon = currentAreaObj?.lon ?? 78.4867;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "520px",
        background: "#070707",
        border: "1px solid var(--border-default)",
        borderRadius: 4,
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.9)",
      }}
    >
      {/* Topographic & Atmospheric Grid SVG Background (Monochrome Cartography) */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.3, pointerEvents: "none" }}
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#242423" strokeWidth="0.8" />
          </pattern>
          <pattern id="grid-sub" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#161616" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-sub)" />
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Topographic Contour Lines in Grayscale */}
        <path d="M -50 150 Q 200 80, 450 200 T 950 120 T 1400 300" fill="none" stroke="#41413F" strokeWidth="1" opacity="0.6" />
        <path d="M -50 280 Q 250 220, 550 320 T 1050 240 T 1400 420" fill="none" stroke="#6D6D6A" strokeWidth="0.8" opacity="0.4" />
        <path d="M -50 400 Q 300 350, 650 420 T 1150 380 T 1400 500" fill="none" stroke="#41413F" strokeWidth="1" opacity="0.35" />
      </svg>

      {/* Center Radar / Target Reticle */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        {/* Pulsing Radar Ring */}
        <div
          style={{
            position: "absolute",
            width: "160px",
            height: "160px",
            borderRadius: "50%",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            background: "radial-gradient(circle, rgba(255, 255, 255, 0.04) 0%, transparent 70%)",
            animation: "monochrome-hazard-pulse 4s infinite ease-in-out",
          }}
        />
        <MapPin size={34} color="var(--air-white)" style={{ filter: "drop-shadow(0 0 12px rgba(255,255,255,0.6))" }} />
        <div
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "var(--air-white)",
            background: "rgba(10,10,10,0.92)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            padding: "0.3rem 0.75rem",
            borderRadius: 2,
            marginTop: "0.5rem",
            backdropFilter: "blur(8px)",
          }}
        >
          {currentAreaObj?.name ?? selectedArea.toUpperCase()}
        </div>
      </div>

      {/* Top Bar Overlay: Search & Title */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          right: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          zIndex: 10,
        }}
      >
        {/* Mission Title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(10, 10, 10, 0.9)",
            border: "1px solid var(--border-default)",
            padding: "0.45rem 0.85rem",
            borderRadius: 2,
            backdropFilter: "blur(10px)",
          }}
        >
          <Compass size={16} color="var(--air-white)" />
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--cloud)" }}>
            CARTOGRAPHIC SATELLITE RADAR
          </span>
        </div>

        {/* Location Search Bar */}
        <div style={{ position: "relative", width: "300px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(12, 12, 12, 0.95)",
              border: "1px solid var(--border-default)",
              borderRadius: 2,
              padding: "0.4rem 0.75rem",
            }}
          >
            <Search size={14} color="var(--silver)" />
            <input
              type="text"
              placeholder="Search Coordinates or Locality..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearching(true);
              }}
              onFocus={() => setIsSearching(true)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--air-white)",
                fontSize: "0.74rem",
                fontFamily: "JetBrains Mono, monospace",
                width: "100%",
              }}
            />
          </div>

          {/* Autocomplete Dropdown */}
          {isSearching && filteredLocations.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "110%",
                left: 0,
                right: 0,
                background: "#111111",
                border: "1px solid var(--border-strong)",
                borderRadius: 2,
                maxHeight: "220px",
                overflowY: "auto",
                zIndex: 20,
                boxShadow: "0 10px 30px rgba(0,0,0,0.9)",
              }}
            >
              {filteredLocations.map((loc) => (
                <button
                  key={`${loc.citySlug}-${loc.areaSlug}`}
                  onClick={() => {
                    onSelectArea(loc.citySlug, loc.areaSlug);
                    setSearchQuery("");
                    setIsSearching(false);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "0.55rem 0.8rem",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--border-default)",
                    color: "var(--air-white)",
                    fontSize: "0.74rem",
                    fontFamily: "JetBrains Mono, monospace",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{loc.areaName}</span>
                  <span style={{ color: "var(--silver)", fontSize: "0.68rem" }}>{loc.cityName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Left Coordinate Overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 14,
          left: 14,
          background: "rgba(10, 10, 10, 0.9)",
          border: "1px solid var(--border-default)",
          padding: "0.45rem 0.85rem",
          borderRadius: 2,
          backdropFilter: "blur(10px)",
          fontSize: "0.7rem",
          fontFamily: "JetBrains Mono, monospace",
          color: "var(--silver)",
        }}
      >
        <span style={{ color: "var(--air-white)", fontWeight: 700 }}>LAT:</span> {lat.toFixed(4)}° N |{" "}
        <span style={{ color: "var(--air-white)", fontWeight: 700 }}>LON:</span> {lon.toFixed(4)}° E |{" "}
        <span style={{ color: "var(--cloud)" }}>ELEV: 542M</span>
      </div>

      {/* Bottom Right OpenWeather Live Status Panel */}
      <div
        style={{
          position: "absolute",
          bottom: 14,
          right: 14,
          background: "rgba(12, 12, 12, 0.92)",
          border: "1px solid var(--border-default)",
          padding: "0.65rem 1rem",
          borderRadius: 2,
          backdropFilter: "blur(12px)",
          minWidth: "250px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
          <span style={{ fontSize: "0.64rem", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "var(--cloud)", letterSpacing: "0.1em" }}>
            ATMOSPHERIC TELEMETRY
          </span>
          <span style={{ fontSize: "0.6rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)" }}>OPENWEATHER</span>
        </div>

        {weatherState.available ? (
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Thermometer size={13} color="var(--air-white)" />
              <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--air-white)", fontFamily: "JetBrains Mono, monospace" }}>
                {weatherState.temp}°C
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)" }}>
              <Droplets size={12} color="var(--silver)" />
              <span>{weatherState.humidity}% RH</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)" }}>
              <Wind size={12} color="var(--silver)" />
              <span>{weatherState.windSpeed} m/s</span>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--silver)", fontSize: "0.72rem", fontFamily: "JetBrains Mono, monospace" }}>
              <AlertCircle size={13} color="var(--cloud)" />
              <span>TELEMETRY FEED STANDBY</span>
            </div>
            <button
              onClick={onRetryWeather}
              style={{
                marginTop: "0.4rem",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-default)",
                color: "var(--air-white)",
                padding: "0.25rem 0.55rem",
                borderRadius: 2,
                fontSize: "0.65rem",
                fontFamily: "JetBrains Mono, monospace",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <RefreshCw size={10} /> RETRY TELEMETRY
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
