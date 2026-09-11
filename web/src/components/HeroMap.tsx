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
        height: "540px",
        background: "#080808",
        border: "1px solid var(--border)",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
      }}
    >
      {/* Topographic & Atmospheric Grid SVG Background */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.25, pointerEvents: "none" }}
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#292929" strokeWidth="0.8" />
          </pattern>
          <pattern id="grid-sub" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1c1c1c" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-sub)" />
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Topographic Contour Lines */}
        <path d="M -50 150 Q 200 80, 450 200 T 950 120 T 1400 300" fill="none" stroke="var(--gold-dim)" strokeWidth="1" opacity="0.4" />
        <path d="M -50 280 Q 250 220, 550 320 T 1050 240 T 1400 420" fill="none" stroke="var(--gold-dim)" strokeWidth="1" opacity="0.3" />
        <path d="M -50 400 Q 300 350, 650 420 T 1150 380 T 1400 500" fill="none" stroke="var(--gold-dim)" strokeWidth="1" opacity="0.25" />
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
            border: "1px stroke var(--gold)",
            background: "radial-gradient(circle, rgba(201,162,39,0.08) 0%, transparent 70%)",
            animation: "pulse 3s infinite ease-in-out",
          }}
        />
        <MapPin size={36} color="var(--gold-bright)" style={{ filter: "drop-shadow(0 0 10px rgba(201,162,39,0.8))" }} />
        <div
          style={{
            fontFamily: "Orbitron, sans-serif",
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "var(--gold-bright)",
            background: "rgba(10,10,10,0.9)",
            border: "1px solid var(--gold-dim)",
            padding: "0.3rem 0.75rem",
            borderRadius: 6,
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
          top: 16,
          left: 16,
          right: 16,
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
            gap: "0.6rem",
            background: "rgba(10,10,10,0.85)",
            border: "1px solid var(--border)",
            padding: "0.5rem 1rem",
            borderRadius: 8,
            backdropFilter: "blur(10px)",
          }}
        >
          <Compass size={18} color="var(--gold)" />
          <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em" }}>
            ATMOSPHERIC MISSION CONTROL
          </span>
        </div>

        {/* Location Search Bar */}
        <div style={{ position: "relative", width: "320px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(10,10,10,0.9)",
              border: "1px solid var(--border-gold)",
              borderRadius: 8,
              padding: "0.45rem 0.85rem",
            }}
          >
            <Search size={16} color="var(--gold)" />
            <input
              type="text"
              placeholder="Search City or Area..."
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
                color: "var(--text-primary)",
                fontSize: "0.82rem",
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
                border: "1px solid var(--border-gold)",
                borderRadius: 8,
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
                    padding: "0.6rem 0.85rem",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{loc.areaName}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{loc.cityName}</span>
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
          bottom: 16,
          left: 16,
          background: "rgba(10,10,10,0.85)",
          border: "1px solid var(--border)",
          padding: "0.6rem 1rem",
          borderRadius: 8,
          backdropFilter: "blur(10px)",
          fontSize: "0.75rem",
          fontFamily: "monospace",
          color: "var(--text-muted)",
        }}
      >
        <span style={{ color: "var(--gold)" }}>LAT:</span> {lat.toFixed(4)}° N |{" "}
        <span style={{ color: "var(--gold)" }}>LON:</span> {lon.toFixed(4)}° E
      </div>

      {/* Bottom Right OpenWeather Live Status Panel */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          background: "rgba(10,10,10,0.9)",
          border: weatherState.available ? "1px solid var(--gold-dim)" : "1px solid var(--border)",
          padding: "0.75rem 1.1rem",
          borderRadius: 10,
          backdropFilter: "blur(12px)",
          minWidth: "260px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
          <span style={{ fontSize: "0.68rem", fontFamily: "Orbitron, sans-serif", fontWeight: 700, color: "var(--gold)" }}>
            OPENWEATHER CONTEXT
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>LIVE FEED</span>
        </div>

        {weatherState.available ? (
          <div style={{ display: "flex", gap: "1.2rem", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Thermometer size={14} color="var(--gold)" />
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {weatherState.temp}°C
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              <Droplets size={12} color="#4A90E2" />
              <span>{weatherState.humidity}% RH</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              <Wind size={12} color="var(--gold-bright)" />
              <span>{weatherState.windSpeed} m/s</span>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.78rem" }}>
              <AlertCircle size={14} color="var(--gold)" />
              <span>WEATHER DATA UNAVAILABLE</span>
            </div>
            <button
              onClick={onRetryWeather}
              style={{
                marginTop: "0.5rem",
                background: "rgba(201,162,39,0.12)",
                border: "1px solid var(--gold-dim)",
                color: "var(--gold)",
                padding: "0.25rem 0.6rem",
                borderRadius: 4,
                fontSize: "0.7rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <RefreshCw size={10} /> RETRY WEATHER FETCH
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
