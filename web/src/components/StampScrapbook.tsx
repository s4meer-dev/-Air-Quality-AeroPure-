"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

interface StampScrapbookProps {
  onSelectContinent?: (id: string) => void;
}

interface StampData {
  id: string;
  name: string;
  num: string;
  src: string;
  desktop: {
    left: string;
    top: string;
    width: string;
    aspectRatio: string;
  };
  coords: string;
  tags: string;
  rotation: number;
}

const SEVEN_STAMPS: StampData[] = [
  {
    id: "north-america",
    name: "North America",
    num: "01",
    src: "/stamps/stamp_north_america_2x.png",
    desktop: { left: "7.32%", top: "17.59%", width: "26.85%", aspectRatio: "275 / 235" },
    coords: "15.0000° N, -100.0000° W",
    tags: "PEOPLE · PLACES · CLEANER AIR",
    rotation: -3.5,
  },
  {
    id: "europe",
    name: "Europe",
    num: "02",
    src: "/stamps/stamp_europe_2x.png",
    desktop: { left: "34.67%", top: "26.39%", width: "22.95%", aspectRatio: "235 / 195" },
    coords: "54.0000° N, 15.0000° E",
    tags: "HISTORY · CITIES · CLEANER AIR",
    rotation: 2.5,
  },
  {
    id: "asia",
    name: "Asia",
    num: "03",
    src: "/stamps/stamp_asia_2x.png",
    desktop: { left: "63.96%", top: "18.33%", width: "29.30%", aspectRatio: "300 / 250" },
    coords: "34.0000° N, 100.0000° E",
    tags: "BILLIONS · DIVERSE LANDS · CLEANER AIR",
    rotation: -2.0,
  },
  {
    id: "south-america",
    name: "South America",
    num: "04",
    src: "/stamps/stamp_south_america_2x.png",
    desktop: { left: "5.37%", top: "51.32%", width: "22.95%", aspectRatio: "235 / 215" },
    coords: "15.0000° S, -60.0000° W",
    tags: "FORESTS · RIVERS · CLEANER AIR",
    rotation: 3.0,
  },
  {
    id: "africa",
    name: "Africa",
    num: "05",
    src: "/stamps/stamp_africa_2x.png",
    desktop: { left: "29.79%", top: "54.25%", width: "20.51%", aspectRatio: "210 / 185" },
    coords: "1.0000° S, 20.0000° E",
    tags: "PEOPLE · NATURE · CLEANER AIR",
    rotation: -1.5,
  },
  {
    id: "oceania",
    name: "Oceania",
    num: "06",
    src: "/stamps/stamp_oceania_2x.png",
    desktop: { left: "50.29%", top: "54.25%", width: "21.00%", aspectRatio: "215 / 200" },
    coords: "25.0000° S, 135.0000° E",
    tags: "OCEANS · ISLANDS · CLEANER AIR",
    rotation: 2.0,
  },
  {
    id: "antarctica",
    name: "Antarctica",
    num: "07",
    src: "/stamps/stamp_antarctica_2x.png",
    desktop: { left: "73.24%", top: "54.25%", width: "20.51%", aspectRatio: "210 / 198" },
    coords: "70.0000° S, 0.0000° E",
    tags: "PURE LANDS · VITAL DATA · CLEANER AIR",
    rotation: -3.0,
  },
];

export default function StampScrapbook({ onSelectContinent }: StampScrapbookProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    if (onSelectContinent) {
      onSelectContinent(id);
    }
  };

  return (
    <section
      aria-label="AeroPure Global Air Intelligence — Seven Continent Stamps"
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100svh",
        background: "#070707",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* ── DESKTOP & TABLET VIEWPORT CANVAS (>= 768px) ── */}
      <div
        className="aeropure-desktop-canvas"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "calc(100svh * 1.5015)",
          aspectRatio: "2048 / 1364",
          maxHeight: "100svh",
          margin: "0 auto",
          backgroundImage: "url('/aeropure_desk_2x.jpg')",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
        }}
      >
        {/* Subtle Archival Vignette */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            boxShadow: "inset 0 0 120px 40px rgba(7, 7, 7, 0.75)",
          }}
        />

        {/* ── INTERACTIVE TOP NAVIGATION OVERLAY ── */}
        <nav
          aria-label="AeroPure Navigation"
          style={{
            position: "absolute",
            top: "2.4%",
            left: "28%",
            width: "44%",
            display: "flex",
            justifyContent: "center",
            gap: "clamp(1rem, 2.5vw, 2.8rem)",
            zIndex: 15,
          }}
        >
          {["ABOUT", "RESEARCH", "METHODOLOGY", "IMPACT"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {}}
              style={{
                background: "transparent",
                border: "none",
                color: "#929292",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "clamp(8px, 0.8vw, 11px)",
                letterSpacing: "0.22em",
                cursor: "pointer",
                padding: "4px 6px",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#F2F2F0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#929292";
              }}
            >
              {item}
            </button>
          ))}
        </nav>

        {/* ── THE SEVEN INTERACTIVE STAMPS ── */}
        {SEVEN_STAMPS.map((stamp) => {
          const isHovered = hoveredId === stamp.id;
          const isOtherHovered = hoveredId !== null && !isHovered;

          return (
            <motion.div
              key={stamp.id}
              role="button"
              tabIndex={0}
              aria-label={`Explore ${stamp.name} Air Intelligence (${stamp.num})`}
              onClick={() => handleSelect(stamp.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelect(stamp.id);
                }
              }}
              onMouseEnter={() => setHoveredId(stamp.id)}
              onMouseLeave={() => setHoveredId(null)}
              initial={false}
              animate={{
                scale: isHovered ? 1.05 : 1,
                y: isHovered ? -8 : 0,
                opacity: isOtherHovered ? 0.72 : 1,
                zIndex: isHovered ? 40 : 10,
              }}
              transition={{
                type: "spring",
                stiffness: 340,
                damping: 26,
              }}
              style={{
                position: "absolute",
                left: stamp.desktop.left,
                top: stamp.desktop.top,
                width: stamp.desktop.width,
                aspectRatio: stamp.desktop.aspectRatio,
                cursor: "pointer",
                transformOrigin: "center center",
                filter: isHovered
                  ? "drop-shadow(0 24px 34px rgba(0, 0, 0, 0.95)) drop-shadow(0 6px 14px rgba(0, 0, 0, 0.85))"
                  : "drop-shadow(0 14px 22px rgba(0, 0, 0, 0.7)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.5))",
                transition: "filter 0.25s ease",
              }}
            >
              {/* Stamp Image (Perforated Teeth with Transparent Alpha) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stamp.src}
                alt={`${stamp.name} Postage Stamp (${stamp.num})`}
                draggable={false}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              />

              {/* Hover Indicator Badge */}
              <motion.div
                initial={false}
                animate={{
                  opacity: isHovered ? 1 : 0,
                  y: isHovered ? 0 : 6,
                }}
                transition={{ duration: 0.18 }}
                style={{
                  position: "absolute",
                  bottom: "-16px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#111111",
                  border: "1px solid #41413F",
                  padding: "4px 10px",
                  borderRadius: "2px",
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                  zIndex: 50,
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.8)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "9px",
                    color: "#F2F2F0",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  Explore {stamp.name} →
                </span>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* ── MOBILE VIEWPORT SCRAPBOOK (< 768px) ── */}
      <div className="aeropure-mobile-scrapbook">
        {/* Mobile Header */}
        <header style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "1.8rem",
              fontWeight: 900,
              color: "#F2F2F0",
              letterSpacing: "0.18em",
            }}
          >
            AEROPURE™
          </div>
          <div
            style={{
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              fontSize: "0.95rem",
              color: "#B8B8B5",
              marginTop: "0.35rem",
            }}
          >
            Know Tomorrow&apos;s Air. Today.
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.65rem",
              color: "#6D6D6A",
              letterSpacing: "0.24em",
              marginTop: "0.45rem",
              textTransform: "uppercase",
            }}
          >
            GLOBAL AIR INTELLIGENCE
          </div>
        </header>

        {/* 2-Column Mobile Scrapbook Grid with Authentic Postage Stamps */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1.2rem",
            width: "100%",
            maxWidth: "500px",
            margin: "0 auto",
          }}
        >
          {SEVEN_STAMPS.map((stamp, idx) => (
            <motion.div
              key={stamp.id}
              role="button"
              tabIndex={0}
              aria-label={`Explore ${stamp.name} Air Intelligence (${stamp.num})`}
              onClick={() => handleSelect(stamp.id)}
              whileTap={{ scale: 0.97 }}
              style={{
                position: "relative",
                gridColumn: idx === 6 ? "1 / -1" : "auto",
                maxWidth: idx === 6 ? "240px" : "100%",
                margin: idx === 6 ? "0 auto" : "0",
                transform: `rotate(${stamp.rotation}deg)`,
                cursor: "pointer",
                filter:
                  "drop-shadow(0 10px 16px rgba(0, 0, 0, 0.75)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stamp.src}
                alt={`${stamp.name} Postage Stamp (${stamp.num})`}
                draggable={false}
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Mobile Footer */}
        <footer style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.8rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ height: "1px", width: "40px", background: "#41413F" }} />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.7rem",
                color: "#929292",
                letterSpacing: "0.2em",
              }}
            >
              EXPLORE A CONTINENT
            </span>
            <div style={{ height: "1px", width: "40px", background: "#41413F" }} />
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.65rem",
              color: "#41413F",
              letterSpacing: "0.15em",
            }}
          >
            7 CONTINENTS · 1 CLEANER TOMORROW
          </div>
        </footer>
      </div>

      {/* ── CSS FOR RESPONSIVE DISPLAY MODES ── */}
      <style jsx global>{`
        .aeropure-desktop-canvas {
          display: block;
        }
        .aeropure-mobile-scrapbook {
          display: none;
        }
        @media (max-width: 767px) {
          .aeropure-desktop-canvas {
            display: none;
          }
          .aeropure-mobile-scrapbook {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            padding: 2rem 1.2rem 3rem;
            background: #070707;
          }
        }
      `}</style>
    </section>
  );
}
