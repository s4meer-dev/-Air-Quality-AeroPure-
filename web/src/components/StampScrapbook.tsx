"use client";

/**
 * StampScrapbook — Physical stamp collection on dark surface.
 *
 * Design: Seven postage stamps arranged in a scrapbook composition.
 * Each stamp is a self-contained SVG with:
 *   - Perforated edges (SVG mask, holes cut through to dark page background)
 *   - Recognizable continent geographic silhouette
 *   - Continent name, denomination, series details
 *
 * Palette: AeroPure monochrome only (#F2F2F0 → #070707).
 * No 3D ring. No carousel. All stamps visible simultaneously.
 * Hover lifts the stamp. Click triggers geographic navigation.
 */

import React from "react";
import { motion } from "framer-motion";

// ─── Continent definitions ────────────────────────────────────────────────────
// SVG paths are in a 100×100 coordinate space.
// They are scaled to fit the stamp content area via preserveAspectRatio.
// Shapes are simplified but immediately recognizable geographic silhouettes.
const CONTINENTS = [
  {
    id: "north-america",
    name: "NORTH AMERICA",
    sub: "WESTERN HEMISPHERE",
    denom: "30",
    rotate: -3.5,
    // Classic triangular landmass, wide at top (Canada), narrows to Central America
    path: "M28,6 L74,6 L84,16 L80,27 L74,37 L63,46 L54,55 L43,55 L34,48 L26,38 L18,26 L16,14 Z",
  },
  {
    id: "south-america",
    name: "SOUTH AMERICA",
    sub: "EQUATORIAL ZONE",
    denom: "20",
    rotate: 2.5,
    // Pear-shaped, wide at top, tapers to Cape Horn at bottom
    path: "M36,6 L66,8 L76,22 L74,37 L68,53 L58,70 L48,82 L40,71 L33,55 L29,38 L31,22 Z",
  },
  {
    id: "europe",
    name: "EUROPE",
    sub: "NORTHERN MARITIME",
    denom: "40",
    rotate: -1.5,
    // Compact irregular blob — Scandinavian peninsula top-right, Iberia bottom-left
    path: "M30,10 L56,8 L70,15 L74,27 L69,39 L57,46 L43,45 L30,38 L22,28 L25,16 Z",
  },
  {
    id: "africa",
    name: "AFRICA",
    sub: "SAHARAN CORRIDOR",
    denom: "25",
    rotate: 4,
    // Large rounded diamond — widest in middle, pointed Cape of Good Hope at base
    path: "M36,5 L64,5 L82,22 L83,44 L75,63 L64,79 L50,88 L36,79 L25,63 L17,44 L18,22 Z",
  },
  {
    id: "asia",
    name: "ASIA",
    sub: "EASTERN MONSOON",
    denom: "60",
    // Extremely wide — from Arabian Peninsula (left) to Russian Far East (right)
    // Indian subcontinent protrudes south; Southeast Asia protrudes lower-right
    rotate: -2.5,
    path: "M5,13 L35,7 L68,4 L88,11 L95,27 L91,44 L76,58 L60,67 L42,67 L28,59 L16,48 L5,33 L2,19 Z",
  },
  {
    id: "oceania",
    name: "OCEANIA",
    sub: "SOUTHERN PACIFIC",
    denom: "15",
    // Australia: broad kidney shape, slightly indented north coast
    rotate: 1.5,
    path: "M24,18 L58,12 L78,22 L84,40 L78,58 L58,70 L33,66 L15,55 L12,38 L20,25 Z",
  },
  {
    id: "antarctica",
    name: "ANTARCTICA",
    sub: "POLAR VORTEX",
    denom: "10",
    // Top-down view: roughly circular with indentations (Ross Sea, Weddell Sea)
    rotate: -4,
    path: "M50,10 L70,17 L85,30 L88,50 L81,68 L64,79 L50,83 L36,79 L19,68 L12,50 L15,30 L30,17 Z",
  },
];

// ─── Stamp SVG geometry ───────────────────────────────────────────────────────
const SW = 200; // SVG coordinate width
const SH = 300; // SVG coordinate height (2:3 portrait)
const PR = 7;   // perforation hole radius
const PP = 16;  // perforation pitch (center-to-center)

// Build perforation circles once (reused per stamp via different mask IDs)
function makePerforations() {
  const nodes: React.ReactNode[] = [];
  const hCount = Math.floor((SW - PR) / PP) + 1;
  const hStart = (SW - (hCount - 1) * PP) / 2;
  for (let i = 0; i < hCount; i++) {
    const cx = hStart + i * PP;
    nodes.push(<circle key={`t${i}`} cx={cx} cy={0} r={PR} />);
    nodes.push(<circle key={`b${i}`} cx={cx} cy={SH} r={PR} />);
  }
  const vCount = Math.floor((SH - PR) / PP) + 1;
  const vStart = (SH - (vCount - 1) * PP) / 2;
  for (let i = 0; i < vCount; i++) {
    const cy = vStart + i * PP;
    nodes.push(<circle key={`l${i}`} cx={0} cy={cy} r={PR} />);
    nodes.push(<circle key={`r${i}`} cx={SW} cy={cy} r={PR} />);
  }
  return nodes;
}
const PERF_NODES = makePerforations();

// ─── Single stamp component ───────────────────────────────────────────────────
function Stamp({
  continent,
  onClick,
}: {
  continent: (typeof CONTINENTS)[number];
  onClick: () => void;
}) {
  const maskId = `ap-mask-${continent.id}`;
  const dotId  = `ap-dot-${continent.id}`;
  const fontSize = continent.name.length > 11 ? 9 : 11;

  return (
    <motion.button
      type="button"
      aria-label={`Select ${continent.name}`}
      onClick={onClick}
      animate={{ rotate: continent.rotate }}
      whileHover={{
        rotate: continent.rotate * 0.25,
        y: -12,
        scale: 1.07,
        zIndex: 30,
        transition: { type: "spring", stiffness: 280, damping: 22 },
      }}
      whileTap={{ scale: 0.97 }}
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        display: "block",
        width: "100%",
        position: "relative",
        transformOrigin: "center center",
        filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.65))",
      }}
    >
      <svg
        viewBox={`0 0 ${SW} ${SH}`}
        width="100%"
        height="100%"
        style={{ display: "block" }}
        aria-hidden="true"
      >
        <defs>
          {/* Perforation mask: white = show stamp; black circles = holes to dark bg */}
          <mask id={maskId}>
            <rect width={SW} height={SH} fill="white" />
            <g fill="black">{PERF_NODES}</g>
          </mask>

          {/* Security dot grid (subtle, like intaglio printing) */}
          <pattern
            id={dotId}
            width="6" height="6"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="3" cy="3" r="0.5" fill="#929292" />
          </pattern>
        </defs>

        {/* Everything masked by perforations — dark bg shows through holes */}
        <g mask={`url(#${maskId})`}>

          {/* ── Stamp face (cool grey paper, not cream/beige) ── */}
          <rect width={SW} height={SH} fill="#D9D9D6" />
          <rect width={SW} height={SH} fill={`url(#${dotId})`} opacity="0.5" />

          {/* ── Outer stamp border ── */}
          <rect
            x={9} y={9}
            width={SW - 18} height={SH - 18}
            fill="none"
            stroke="#6D6D6A"
            strokeWidth={1.5}
          />
          {/* Inner thin rule */}
          <rect
            x={13} y={13}
            width={SW - 26} height={SH - 26}
            fill="none"
            stroke="#B8B8B5"
            strokeWidth={0.5}
          />

          {/* ── Name band (top) ── */}
          <rect x={9} y={9} width={SW - 18} height={33} fill="#242423" />
          <text
            x={SW / 2}
            y={30}
            textAnchor="middle"
            fill="#F2F2F0"
            fontSize={fontSize}
            fontWeight="700"
            fontFamily="'Orbitron', 'Arial Black', sans-serif"
            letterSpacing="2.5"
          >
            {continent.name}
          </text>

          {/* ── Geographic silhouette area ── */}
          {/* Subtle background wash for the map area */}
          <rect x={9} y={42} width={SW - 18} height={SH - 74} fill="#C8C8C5" />

          {/* Fine map grid lines (lat/lon grid feel) */}
          {[25, 50, 75].map((v) => (
            <React.Fragment key={`grid${v}`}>
              {/* Horizontal lines mapped into map area */}
              <line
                x1={9}  y1={42 + (SH - 74) * v / 100}
                x2={SW - 9} y2={42 + (SH - 74) * v / 100}
                stroke="#B8B8B5" strokeWidth={0.4} strokeDasharray="2 3"
              />
              {/* Vertical lines */}
              <line
                x1={9 + (SW - 18) * v / 100} y1={42}
                x2={9 + (SW - 18) * v / 100} y2={SH - 32}
                stroke="#B8B8B5" strokeWidth={0.4} strokeDasharray="2 3"
              />
            </React.Fragment>
          ))}

          {/* Continent silhouette — nested SVG auto-scales path to content area */}
          <svg
            x={16}
            y={50}
            width={SW - 32}
            height={SH - 90}
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Shadow/depth of silhouette */}
            <path
              d={continent.path}
              fill="#41413F"
              transform="translate(1,1)"
              opacity="0.35"
            />
            {/* Main silhouette */}
            <path
              d={continent.path}
              fill="#41413F"
              stroke="#6D6D6A"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>

          {/* ── Bottom strip ── */}
          <rect x={9} y={SH - 32} width={SW - 18} height={23} fill="#1A1A1A" />

          {/* Sub-caption (left) */}
          <text
            x={16}
            y={SH - 17}
            fill="#6D6D6A"
            fontSize={6}
            fontFamily="'JetBrains Mono', monospace"
            letterSpacing="1"
          >
            AEROPURE · MMXXVI
          </text>

          {/* Denomination (right) */}
          <text
            x={SW - 15}
            y={SH - 16}
            textAnchor="end"
            fill="#929292"
            fontSize={9.5}
            fontWeight="700"
            fontFamily="'JetBrains Mono', monospace"
          >
            {continent.denom}¢
          </text>

        </g>
      </svg>
    </motion.button>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function StampScrapbook({
  onSelectContinent,
}: {
  onSelectContinent?: (id: string) => void;
}) {
  const row1 = CONTINENTS.slice(0, 4); // NA, SA, EU, AF
  const row2 = CONTINENTS.slice(4);    // AS, OC, AN

  return (
    <>
      {/* Responsive grid styles */}
      <style>{`
        .ap-row1 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: clamp(10px, 1.8vw, 22px);
          width: 100%;
          max-width: min(900px, 96vw);
        }
        .ap-row2 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(10px, 1.8vw, 22px);
          width: 100%;
          max-width: min(678px, 72vw);
        }
        @media (max-width: 700px) {
          .ap-row1 {
            grid-template-columns: repeat(2, 1fr);
            max-width: 100%;
          }
          .ap-row2 {
            grid-template-columns: repeat(2, 1fr);
            max-width: 100%;
          }
        }
        @media (max-width: 400px) {
          .ap-row1, .ap-row2 {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
        }
      `}</style>

      <div
        style={{
          background: "#070707",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* ── Header ── */}
        <header
          style={{
            textAlign: "center",
            padding: "clamp(1.5rem, 4vh, 3rem) 2rem clamp(1rem, 2.5vh, 2rem)",
            width: "100%",
            flexShrink: 0,
          }}
        >
          <h1
            style={{
              fontFamily: "'Orbitron', sans-serif",
              color: "#F2F2F0",
              fontSize: "clamp(1.8rem, 4.5vw, 3.5rem)",
              fontWeight: 900,
              margin: 0,
              letterSpacing: "0.15em",
            }}
          >
            AEROPURE
          </h1>
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: "#929292",
              fontSize: "clamp(0.75rem, 1.5vw, 0.95rem)",
              letterSpacing: "0.05em",
              margin: "0.6rem 0 0",
            }}
          >
            Know Tomorrow&apos;s Air. Today.
          </p>
          <p
            style={{
              fontFamily: "'Orbitron', sans-serif",
              color: "#41413F",
              fontSize: "clamp(0.55rem, 1vw, 0.7rem)",
              letterSpacing: "0.3em",
              margin: "0.9rem 0 0",
              textTransform: "uppercase",
            }}
          >
            Global Air Intelligence
          </p>
        </header>

        {/* ── Scrapbook ── */}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 clamp(1rem, 3vw, 2.5rem) clamp(1.5rem, 4vh, 3rem)",
            gap: "clamp(10px, 2vh, 24px)",
            width: "100%",
          }}
        >
          {/* Row 1: North America, South America, Europe, Africa */}
          <div className="ap-row1">
            {row1.map((c) => (
              <Stamp
                key={c.id}
                continent={c}
                onClick={() => onSelectContinent?.(c.id)}
              />
            ))}
          </div>

          {/* Row 2: Asia, Oceania, Antarctica (centered under row 1) */}
          <div className="ap-row2">
            {row2.map((c) => (
              <Stamp
                key={c.id}
                continent={c}
                onClick={() => onSelectContinent?.(c.id)}
              />
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
