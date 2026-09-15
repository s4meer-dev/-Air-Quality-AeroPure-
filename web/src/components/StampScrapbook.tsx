"use client";

import React, { useState } from "react";
import ContinentStamp from "./ContinentStamp";

interface StampScrapbookProps {
  onSelectContinent?: (id: string) => void;
}

interface ContinentConfig {
  id:
    | "north-america"
    | "europe"
    | "asia"
    | "south-america"
    | "africa"
    | "oceania"
    | "antarctica";
  name: string;
  number: string;
  coords: string;
  tags: string;
  imageSrc: string;
  width: number;
  height: number;
  rotation: number;
  desktopPos: {
    left: string;
    top: string;
  };
}

const CONTINENTS_CONFIG: ContinentConfig[] = [
  {
    id: "north-america",
    name: "North America",
    number: "01",
    coords: "15.0000° N, -100.0000° W",
    tags: "PEOPLE · PLACES · CLEANER AIR",
    imageSrc: "/stamps/geo_north-america.jpg",
    width: 255,
    height: 215,
    rotation: -3.5,
    desktopPos: { left: "7.5%", top: "20.5%" },
  },
  {
    id: "europe",
    name: "Europe",
    number: "02",
    coords: "54.0000° N, 15.0000° E",
    tags: "HISTORY · CITIES · CLEANER AIR",
    imageSrc: "/stamps/geo_europe.jpg",
    width: 235,
    height: 190,
    rotation: 2.5,
    desktopPos: { left: "35.2%", top: "27.5%" },
  },
  {
    id: "asia",
    name: "Asia",
    number: "03",
    coords: "34.0000° N, 100.0000° E",
    tags: "BILLIONS · DIVERSE LANDS · CLEANER AIR",
    imageSrc: "/stamps/geo_asia.jpg",
    width: 285,
    height: 235,
    rotation: -2.0,
    desktopPos: { left: "64.8%", top: "20.0%" },
  },
  {
    id: "south-america",
    name: "South America",
    number: "04",
    coords: "15.0000° S, -60.0000° W",
    tags: "FORESTS · RIVERS · CLEANER AIR",
    imageSrc: "/stamps/geo_south-america.jpg",
    width: 230,
    height: 210,
    rotation: 3.0,
    desktopPos: { left: "6.2%", top: "54.5%" },
  },
  {
    id: "africa",
    name: "Africa",
    number: "05",
    coords: "1.0000° S, 20.0000° E",
    tags: "PEOPLE · NATURE · CLEANER AIR",
    imageSrc: "/stamps/geo_africa.jpg",
    width: 215,
    height: 185,
    rotation: -1.5,
    desktopPos: { left: "30.5%", top: "56.5%" },
  },
  {
    id: "oceania",
    name: "Oceania",
    number: "06",
    coords: "25.0000° S, 135.0000° E",
    tags: "OCEANS · ISLANDS · CLEANER AIR",
    imageSrc: "/stamps/geo_oceania.jpg",
    width: 220,
    height: 195,
    rotation: 2.0,
    desktopPos: { left: "51.8%", top: "56.0%" },
  },
  {
    id: "antarctica",
    name: "Antarctica",
    number: "07",
    coords: "70.0000° S, 0.0000° E",
    tags: "PURE LANDS · VITAL DATA · CLEANER AIR",
    imageSrc: "/stamps/geo_antarctica.jpg",
    width: 220,
    height: 195,
    rotation: -3.0,
    desktopPos: { left: "74.5%", top: "56.0%" },
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
        backgroundImage: `
          radial-gradient(circle at 50% 35%, #181818 0%, #0d0d0d 50%, #070707 100%)
        `,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* ── DESKTOP & TABLET VIEWPORT CANVAS (>= 768px) ── */}
      <div
        className="aeropure-desktop-canvas"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "calc(100svh * 1.5)",
          aspectRatio: "1024 / 682",
          maxHeight: "100svh",
          margin: "0 auto",
        }}
      >
        {/* ── SVG DESK BACKGROUND LAYER: WORLD MAP & PROPS ── */}
        <svg
          aria-hidden="true"
          width="100%"
          height="100%"
          viewBox="0 0 1024 682"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          {/* Subtle World Map Graticules */}
          <g opacity="0.16" stroke="#41413F" strokeWidth="0.6" fill="none">
            {/* Equator & parallels */}
            <line x1="0" y1="341" x2="1024" y2="341" strokeDasharray="4 4" />
            <line x1="0" y1="200" x2="1024" y2="200" strokeDasharray="2 4" />
            <line x1="0" y1="480" x2="1024" y2="480" strokeDasharray="2 4" />
            {/* Meridians */}
            <line x1="256" y1="0" x2="256" y2="682" strokeDasharray="2 4" />
            <line x1="512" y1="0" x2="512" y2="682" strokeDasharray="4 4" />
            <line x1="768" y1="0" x2="768" y2="682" strokeDasharray="2 4" />

            {/* Faint continent outlines */}
            <path d="M 80 160 Q 140 130 220 150 Q 280 200 250 280 Q 180 300 120 250 Z" />
            <path d="M 370 170 Q 450 140 540 180 Q 520 260 440 280 Q 380 240 370 170 Z" />
            <path d="M 620 150 Q 750 120 900 180 Q 940 320 820 340 Q 680 320 620 220 Z" />
            <path d="M 120 380 Q 200 370 240 440 Q 220 540 160 560 Q 100 480 120 380 Z" />
            <path d="M 380 380 Q 480 360 480 480 Q 440 550 400 540 Q 360 460 380 380 Z" />
            <path d="M 580 440 Q 680 420 710 500 Q 680 560 600 540 Q 560 480 580 440 Z" />
            <path d="M 760 450 Q 880 440 930 520 Q 880 570 780 560 Q 740 500 760 450 Z" />
          </g>

          {/* Top Center Postal Seal */}
          <g transform="translate(512, 105)" opacity="0.22">
            <circle cx="0" cy="0" r="32" fill="none" stroke="#6D6D6A" strokeWidth="0.8" strokeDasharray="4 2" />
            <circle cx="0" cy="0" r="28" fill="none" stroke="#6D6D6A" strokeWidth="0.5" />
            <text
              x="0"
              y="-12"
              textAnchor="middle"
              fontFamily="'JetBrains Mono', monospace"
              fontSize="5"
              fill="#929292"
              letterSpacing="1.2"
            >
              ★ AEROPURE POST ★
            </text>
            <text
              x="0"
              y="18"
              textAnchor="middle"
              fontFamily="'JetBrains Mono', monospace"
              fontSize="4.5"
              fill="#929292"
              letterSpacing="1"
            >
              GLOBAL CORRIDOR
            </text>
          </g>

          {/* Vintage Compass Linework (Left Edge Prop) */}
          <g transform="translate(42, 280)" opacity="0.2">
            <circle cx="0" cy="0" r="34" fill="none" stroke="#41413F" strokeWidth="1" />
            <circle cx="0" cy="0" r="30" fill="none" stroke="#242423" strokeWidth="0.5" strokeDasharray="2 2" />
            <polygon points="0,-26 5,0 -5,0" fill="#929292" />
            <polygon points="0,26 5,0 -5,0" fill="#41413F" />
            <polygon points="-26,0 0,5 0,-5" fill="#41413F" />
            <polygon points="26,0 0,5 0,-5" fill="#41413F" />
            <text x="0" y="-30" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="5" fill="#929292">
              N
            </text>
          </g>

          {/* Vintage Navigation Grid / Air Atlas (Bottom Right Prop) */}
          <g transform="translate(920, 600) rotate(-10)" opacity="0.18">
            <rect x="-60" y="-40" width="120" height="80" fill="none" stroke="#41413F" strokeWidth="0.8" />
            <line x1="-60" y1="-20" x2="60" y2="-20" stroke="#242423" strokeWidth="0.5" />
            <line x1="-60" y1="0" x2="60" y2="0" stroke="#242423" strokeWidth="0.5" />
            <line x1="-60" y1="20" x2="60" y2="20" stroke="#242423" strokeWidth="0.5" />
            <text
              x="0"
              y="-28"
              textAnchor="middle"
              fontFamily="Georgia, serif"
              fontWeight="700"
              fontSize="7.5"
              fill="#6D6D6A"
              letterSpacing="1.5"
            >
              AIR ATLAS
            </text>
          </g>
        </svg>

        {/* ── HEADER ── */}
        <header
          style={{
            position: "absolute",
            top: "2.8%",
            left: "4%",
            right: "4%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 20,
          }}
        >
          {/* Top-Left: Brand & Subtitle */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                border: "1px solid #41413F",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#F2F2F0",
                fontSize: "11px",
              }}
            >
              ↑
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 800,
                  fontSize: "12px",
                  color: "#F2F2F0",
                  letterSpacing: "0.15em",
                }}
              >
                AEROPURE
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "7px",
                  color: "#6D6D6A",
                  letterSpacing: "0.2em",
                  marginTop: "1px",
                }}
              >
                GLOBAL AIR INTELLIGENCE
              </div>
            </div>
          </div>

          {/* Top-Center: Navigation Links */}
          <nav
            aria-label="AeroPure Navigation"
            style={{
              display: "flex",
              gap: "clamp(1.2rem, 2.8vw, 3rem)",
            }}
          >
            {["ABOUT", "RESEARCH", "METHODOLOGY", "IMPACT"].map((link) => (
              <button
                key={link}
                type="button"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#929292",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  letterSpacing: "0.22em",
                  cursor: "pointer",
                  padding: "4px 2px",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#F2F2F0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#929292";
                }}
              >
                {link}
              </button>
            ))}
          </nav>

          {/* Top-Right: Editorial Tag */}
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "7.5px",
                color: "#929292",
                letterSpacing: "0.18em",
              }}
            >
              CLEANER AIR
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "7px",
                color: "#6D6D6A",
                letterSpacing: "0.16em",
                marginTop: "1px",
              }}
            >
              BRIGHTER TOMORROWS
            </div>
          </div>
        </header>

        {/* ── HERO TITLE (CENTERED) ── */}
        <div
          style={{
            position: "absolute",
            top: "8.5%",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            zIndex: 15,
            pointerEvents: "none",
          }}
        >
          <h1
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "clamp(1.8rem, 3.8vw, 2.9rem)",
              fontWeight: 900,
              color: "#F2F2F0",
              letterSpacing: "0.22em",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            AEROPURE<span style={{ fontSize: "0.45em", verticalAlign: "super" }}>™</span>
          </h1>
          <p
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic",
              fontSize: "clamp(0.85rem, 1.25vw, 1.05rem)",
              color: "#B8B8B5",
              margin: "0.45rem 0 0",
              letterSpacing: "0.04em",
            }}
          >
            Know Tomorrow&apos;s Air. Today.
          </p>
          <p
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "clamp(0.55rem, 0.75vw, 0.65rem)",
              color: "#6D6D6A",
              letterSpacing: "0.32em",
              margin: "0.4rem 0 0",
              textTransform: "uppercase",
            }}
          >
            GLOBAL AIR INTELLIGENCE
          </p>
        </div>

        {/* ── EDITORIAL SIDE & DESK ANNOTATIONS ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 5,
          }}
        >
          {/* Left top: VAST LANDS BRIGHTER SKIES */}
          <div
            style={{
              position: "absolute",
              top: "23%",
              left: "2.4%",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "7.5px",
              lineHeight: "1.4",
              color: "#41413F",
              letterSpacing: "0.18em",
            }}
          >
            VAST<br />LANDS<br />BRIGHTER<br />SKIES
          </div>

          {/* Left bottom: WILDER PLACES HEALTHIER TOMORROWS */}
          <div
            style={{
              position: "absolute",
              top: "62%",
              left: "1.8%",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "7.5px",
              lineHeight: "1.4",
              color: "#41413F",
              letterSpacing: "0.18em",
            }}
          >
            WILDER<br />PLACES<br />HEALTHIER<br />TOMORROWS
          </div>

          {/* Center between Europe & Asia: CULTURE PEOPLE PROGRESS */}
          <div
            style={{
              position: "absolute",
              top: "31%",
              left: "58.8%",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "7.5px",
              lineHeight: "1.4",
              color: "#41413F",
              letterSpacing: "0.18em",
            }}
          >
            CULTURE<br />PEOPLE<br />PROGRESS
          </div>

          {/* Right top: ANCIENT ROOTS BRIGHTER FUTURES */}
          <div
            style={{
              position: "absolute",
              top: "36%",
              right: "2.2%",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "7.5px",
              lineHeight: "1.4",
              color: "#41413F",
              letterSpacing: "0.18em",
              textAlign: "right",
            }}
          >
            ANCIENT<br />ROOTS<br />BRIGHTER<br />FUTURES
          </div>

          {/* Right bottom: A CLEANER PLANET TOGETHER */}
          <div
            style={{
              position: "absolute",
              top: "67%",
              right: "2.4%",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "7.5px",
              lineHeight: "1.4",
              color: "#41413F",
              letterSpacing: "0.18em",
              textAlign: "right",
            }}
          >
            A<br />CLEANER<br />PLANET<br />TOGETHER
          </div>

          {/* Below Africa: RESILIENT LANDS STRONGER GENERATIONS */}
          <div
            style={{
              position: "absolute",
              top: "84%",
              left: "32%",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "7px",
              lineHeight: "1.4",
              color: "#41413F",
              letterSpacing: "0.16em",
            }}
          >
            RESILIENT<br />LANDS<br />STRONGER<br />GENERATIONS
          </div>

          {/* Below Oceania: CLEARER OCEANS BRIGHTER HORIZONS */}
          <div
            style={{
              position: "absolute",
              top: "87%",
              left: "54%",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "7px",
              lineHeight: "1.4",
              color: "#41413F",
              letterSpacing: "0.16em",
            }}
          >
            CLEARER OCEANS<br />BRIGHTER HORIZONS
          </div>
        </div>

        {/* ── THE SEVEN INDIVIDUAL STAMP COMPONENTS ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
          }}
        >
          {CONTINENTS_CONFIG.map((c) => {
            const isHovered = hoveredId === c.id;
            const isDimmed = hoveredId !== null && !isHovered;

            return (
              <div
                key={c.id}
                style={{
                  position: "absolute",
                  left: c.desktopPos.left,
                  top: c.desktopPos.top,
                }}
              >
                <ContinentStamp
                  continent={c.id}
                  name={c.name}
                  number={c.number}
                  coords={c.coords}
                  tags={c.tags}
                  imageSrc={c.imageSrc}
                  width={c.width}
                  height={c.height}
                  rotation={c.rotation}
                  isHovered={isHovered}
                  isDimmed={isDimmed}
                  onHover={setHoveredId}
                  onSelect={handleSelect}
                />
              </div>
            );
          })}
        </div>

        {/* ── BOTTOM BAR ── */}
        <footer
          style={{
            position: "absolute",
            bottom: "2.4%",
            left: "4%",
            right: "4%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 20,
          }}
        >
          {/* Bottom-Left: 7 Continents */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                border: "1px dashed #6D6D6A",
                display: "inline-block",
              }}
            />
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "7.5px",
                color: "#6D6D6A",
                letterSpacing: "0.16em",
              }}
            >
              7 CONTINENTS<br />1 CLEANER TOMORROW
            </div>
          </div>

          {/* Bottom-Center: Explore a Continent */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
            }}
          >
            <div style={{ width: "45px", height: "1px", background: "#41413F" }} />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "8.5px",
                color: "#929292",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              EXPLORE A CONTINENT
            </span>
            <div style={{ width: "45px", height: "1px", background: "#41413F" }} />
          </div>

          {/* Bottom-Right: Copyright */}
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "7.5px",
              color: "#41413F",
              letterSpacing: "0.18em",
            }}
          >
            AEROPURE &nbsp;© 2026
          </div>
        </footer>
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

        {/* 2-Column Mobile Scrapbook Grid with Individual Postage Stamps */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1.4rem 1rem",
            width: "100%",
            maxWidth: "520px",
            margin: "0 auto",
            justifyItems: "center",
          }}
        >
          {CONTINENTS_CONFIG.map((c, idx) => (
            <div
              key={c.id}
              style={{
                gridColumn: idx === 6 ? "1 / -1" : "auto",
              }}
            >
              <ContinentStamp
                continent={c.id}
                name={c.name}
                number={c.number}
                coords={c.coords}
                tags={c.tags}
                imageSrc={c.imageSrc}
                width={idx === 6 ? 240 : 180}
                height={idx === 6 ? 200 : 155}
                rotation={c.rotation}
                isHovered={hoveredId === c.id}
                isDimmed={hoveredId !== null && hoveredId !== c.id}
                onHover={setHoveredId}
                onSelect={handleSelect}
              />
            </div>
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
