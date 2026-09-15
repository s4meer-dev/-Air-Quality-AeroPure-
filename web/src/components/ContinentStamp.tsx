"use client";

import React from "react";
import { motion } from "framer-motion";

export interface ContinentStampProps {
  continent:
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
  isHovered: boolean;
  isDimmed: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Mathematically generates an authentic postage stamp SVG path
 * with semi-circular perforation notches evenly spaced on all four sides.
 */
function generateStampPath(w: number, h: number, r = 4.5, targetSpacing = 13.5): string {
  const nx = Math.max(2, Math.round((w - 2 * r) / targetSpacing));
  const stepX = (w - 2 * r) / (nx + 1);

  const ny = Math.max(2, Math.round((h - 2 * r) / targetSpacing));
  const stepY = (h - 2 * r) / (ny + 1);

  const d: string[] = ["M 0 0"];

  // Top edge (left to right with downward notches)
  for (let i = 1; i <= nx; i++) {
    const cx = r + i * stepX;
    d.push(`L ${(cx - r).toFixed(2)} 0 A ${r} ${r} 0 0 0 ${(cx + r).toFixed(2)} 0`);
  }
  d.push(`L ${w} 0`);

  // Right edge (top to bottom with leftward notches)
  for (let i = 1; i <= ny; i++) {
    const cy = r + i * stepY;
    d.push(`L ${w} ${(cy - r).toFixed(2)} A ${r} ${r} 0 0 0 ${w} ${(cy + r).toFixed(2)}`);
  }
  d.push(`L ${w} ${h}`);

  // Bottom edge (right to left with upward notches)
  for (let i = nx; i >= 1; i--) {
    const cx = r + i * stepX;
    d.push(`L ${(cx + r).toFixed(2)} ${h} A ${r} ${r} 0 0 0 ${(cx - r).toFixed(2)} ${h}`);
  }
  d.push(`L 0 ${h}`);

  // Left edge (bottom to top with rightward notches)
  for (let i = ny; i >= 1; i--) {
    const cy = r + i * stepY;
    d.push(`L 0 ${(cy + r).toFixed(2)} A ${r} ${r} 0 0 0 0 ${(cy - r).toFixed(2)}`);
  }
  d.push("Z");

  return d.join(" ");
}

export default function ContinentStamp({
  continent,
  name,
  number,
  coords,
  tags,
  imageSrc,
  width,
  height,
  rotation,
  isHovered,
  isDimmed,
  onHover,
  onSelect,
  className = "",
  style = {},
}: ContinentStampProps) {
  const clipId = `stamp-clip-${continent}`;
  const noiseId = `stamp-noise-${continent}`;
  const stampPath = generateStampPath(width, height);

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`Explore ${name} (${number})`}
      className={`aeropure-continent-stamp ${className}`}
      onClick={() => onSelect(continent)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(continent);
        }
      }}
      onMouseEnter={() => onHover(continent)}
      onMouseLeave={() => onHover(null)}
      initial={false}
      animate={{
        scale: isHovered ? 1.045 : 1,
        y: isHovered ? -8 : 0,
        opacity: isDimmed ? 0.68 : 1,
        zIndex: isHovered ? 35 : 10,
      }}
      transition={{
        type: "spring",
        stiffness: 360,
        damping: 24,
      }}
      style={{
        position: "relative",
        width,
        height,
        cursor: "pointer",
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center center",
        userSelect: "none",
        filter: isHovered
          ? "drop-shadow(0 24px 34px rgba(0, 0, 0, 0.95)) drop-shadow(0 6px 12px rgba(0, 0, 0, 0.8))"
          : "drop-shadow(0 14px 22px rgba(0, 0, 0, 0.75)) drop-shadow(0 3px 6px rgba(0, 0, 0, 0.55))",
        transition: "filter 0.25s ease",
        ...style,
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          {/* Authentic Perforated Edge Clip Path */}
          <clipPath id={clipId}>
            <path d={stampPath} />
          </clipPath>

          {/* Archival Paper Texture Noise */}
          <filter id={noiseId} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>

        {/* ── STAMP BODY CLIPPED TO PERFORATION ── */}
        <g clipPath={`url(#${clipId})`}>
          {/* Base archival stamp paper (off-white / silver) */}
          <rect width={width} height={height} fill="#D9D9D6" />

          {/* Subtle paper grain texture overlay */}
          <rect
            width={width}
            height={height}
            fill="#000000"
            opacity="0.04"
            filter={`url(#${noiseId})`}
          />

          {/* Outer hairline border */}
          <rect
            x="9"
            y="9"
            width={width - 18}
            height={height - 18}
            fill="none"
            stroke="#242423"
            strokeWidth="0.8"
          />

          {/* Inner hairline border */}
          <rect
            x="11"
            y="11"
            width={width - 22}
            height={height - 22}
            fill="none"
            stroke="#6D6D6A"
            strokeWidth="0.5"
            strokeDasharray="2 1"
          />

          {/* ── TOP BAR: NAME & SERIAL NUMBER ── */}
          <text
            x="15"
            y="26"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontWeight="700"
            fontSize="10.5"
            fill="#111111"
            letterSpacing="1.2"
          >
            {name.toUpperCase()}
          </text>
          <text
            x={width - 15}
            y="26"
            textAnchor="end"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontWeight="700"
            fontSize="11.5"
            fill="#111111"
          >
            {number}
          </text>

          {/* ── CENTER: GEOGRAPHIC PHOTOGRAPHIC ENGRAVING ── */}
          {/* Inner Photo Frame */}
          <rect
            x="13"
            y="32"
            width={width - 26}
            height={height - 56}
            fill="#070707"
          />
          {/* High-res Grayscale Landscape Photograph */}
          <image
            href={imageSrc}
            x="13"
            y="32"
            width={width - 26}
            height={height - 56}
            preserveAspectRatio="xMidYMid slice"
            style={{ filter: "grayscale(100%) contrast(1.15)" }}
          />
          {/* Photo frame stroke */}
          <rect
            x="13"
            y="32"
            width={width - 26}
            height={height - 56}
            fill="none"
            stroke="#111111"
            strokeWidth="0.9"
          />

          {/* ── BOTTOM BAR: COORDINATES & METADATA ── */}
          <text
            x="15"
            y={height - 13}
            fontFamily="'JetBrains Mono', monospace"
            fontSize="7"
            fill="#41413F"
            letterSpacing="0.4"
          >
            {coords}
          </text>
          <text
            x={width - 15}
            y={height - 13}
            textAnchor="end"
            fontFamily="'JetBrains Mono', monospace"
            fontSize="6.5"
            fontWeight="600"
            fill="#242423"
            letterSpacing="0.6"
          >
            {tags}
          </text>

          {/* ── POSTAL CANCELLATION RUBBER STAMP OVERLAY ── */}
          <g opacity="0.22" transform={`translate(${width - 48}, 14) rotate(-15)`}>
            <circle cx="0" cy="0" r="22" fill="none" stroke="#111111" strokeWidth="1" strokeDasharray="4 2" />
            <circle cx="0" cy="0" r="17" fill="none" stroke="#111111" strokeWidth="0.6" />
            <path
              d="M -30 -6 Q -15 -14 0 -6 Q 15 2 30 -6 M -30 2 Q -15 -6 0 2 Q 15 10 30 2"
              fill="none"
              stroke="#111111"
              strokeWidth="0.8"
            />
          </g>
        </g>
      </svg>

      {/* ── HOVER EXPLORE BADGE ── */}
      <motion.div
        initial={false}
        animate={{
          opacity: isHovered ? 1 : 0,
          y: isHovered ? 0 : 6,
        }}
        transition={{ duration: 0.18 }}
        style={{
          position: "absolute",
          bottom: "-22px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#111111",
          border: "1px solid #41413F",
          padding: "3px 10px",
          borderRadius: "2px",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          zIndex: 50,
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.85)",
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
          Explore {name} →
        </span>
      </motion.div>
    </motion.div>
  );
}
