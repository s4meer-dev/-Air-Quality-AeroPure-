"use client";

/**
 * StampScrapbook — Exact Framer port.
 * Source: https://framer.com/m/StampScrapbook-eEEr79.js@jDvcRGMMShsLg00dZ1ku
 *
 * All physics, geometry and layout are a direct translation of the Framer
 * source (minified above).  The proprietary Framer runtime is replaced with:
 *   - useAnimationFrame, useInView, useMotionValue, useTransform  (framer-motion)
 *   - createPortal                                                 (react-dom)
 *
 * The original stamp photographs are replaced with AeroPure continent stamps
 * rendered via CSS + grayscale filter, matching the AeroPure monochrome palette.
 *
 * @framerIntrinsicWidth  1200
 * @framerIntrinsicHeight 640
 */

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  startTransition,
} from "react";
import { createPortal } from "react-dom";
import {
  motion,
  AnimatePresence,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";

// ─── Stamp data ───────────────────────────────────────────────────────────────
// Each stamp image lives in /public/stamps/<id>.jpg
// They are rendered with filter:grayscale(1) for the AeroPure monochrome palette.
const FALLBACK_STAMPS = [
  {
    id: "north-america",
    title: "North America",
    caption: "WESTERN AIR CORRIDOR · 30¢",
    description:
      "From the Pacific Coast to the Gulf of Mexico — the jet stream shapes tomorrow's air for 600 million people.",
    src: "/stamps/north-america.jpg",
  },
  {
    id: "south-america",
    title: "South America",
    caption: "EQUATORIAL ZONE · 20¢",
    description:
      "The Amazon Basin breathes for the planet. Deforestation pressure makes its air quality a global indicator.",
    src: "/stamps/south-america.jpg",
  },
  {
    id: "europe",
    title: "Europe",
    caption: "NORTHERN MARITIME · 40¢",
    description:
      "Dense industry meets Atlantic westerlies. Europe's air corridors carry pollutants across borders daily.",
    src: "/stamps/europe.jpg",
  },
  {
    id: "africa",
    title: "Africa",
    caption: "SAHARAN CORRIDOR · 25¢",
    description:
      "Saharan dust travels thousands of kilometres, seeding oceans and degrading air quality across continents.",
    src: "/stamps/africa.jpg",
  },
  {
    id: "asia",
    title: "Asia",
    caption: "EASTERN MONSOON ZONE · 60¢",
    description:
      "Home to the world's most polluted cities and its largest clean-air reserves. The monsoon resets the slate each year.",
    src: "/stamps/asia.jpg",
  },
  {
    id: "oceania",
    title: "Oceania",
    caption: "SOUTHERN CLEAN AIR · 15¢",
    description:
      "The Southern Ocean delivers some of the cleanest air on Earth — a baseline against which all other regions are measured.",
    src: "/stamps/oceania.jpg",
  },
  {
    id: "antarctica",
    title: "Antarctica",
    caption: "POLAR VORTEX BASELINE · 10¢",
    description:
      "The polar vortex is the atmospheric reference point for the planet's pristine pre-industrial air.",
    src: "/stamps/antarctica.jpg",
  },
];

// ─── Geometry (exact Framer) ──────────────────────────────────────────────────
const STAMP_ASPECT = 2 / 3; // portrait

function ringRadius(count: number, stampWidth: number, spread: number) {
  if (count < 3) return stampWidth * 0.75 * spread;
  return (stampWidth / (2 * Math.tan(Math.PI / count))) * 1.18 * spread;
}

// ─── postcard slide variants (exact Framer) ───────────────────────────────────
const POSTCARD_VARIANTS = {
  enter: (dir: number) => ({
    x: dir === 0 ? 0 : dir > 0 ? 320 : -320,
    rotateY: dir === 0 ? -90 : 0,
    rotate: dir === 0 ? 0 : dir > 0 ? 8 : -8,
    scale: dir === 0 ? 0.75 : 1,
    opacity: 0,
  }),
  center: {
    x: 0,
    rotateY: 0,
    rotate: -1.5,
    scale: 1,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir === 0 ? 0 : dir > 0 ? -320 : 320,
    rotateY: dir === 0 ? 90 : 0,
    rotate: dir === 0 ? 0 : dir > 0 ? -8 : 8,
    scale: dir === 0 ? 0.75 : 1,
    opacity: 0,
  }),
};

// ─── Ruled lines (exact Framer helper) ───────────────────────────────────────
function ruledLines(pitch: number): React.CSSProperties {
  const lineAt = Math.round(pitch * 0.92);
  return {
    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${lineAt - 1}px, rgba(187,187,187,0.55) ${lineAt - 1}px, rgba(187,187,187,0.55) ${lineAt}px, transparent ${lineAt}px, transparent ${pitch}px)`,
  };
}

// ─── Single StampCard (exact Framer) ─────────────────────────────────────────
interface StampCardProps {
  stamp: (typeof FALLBACK_STAMPS)[number];
  index: number;
  count: number;
  radius: number;
  width: number;
  height: number;
  angle: MotionValue<number>;
  shadow: boolean;
  onOpen: (index: number) => void;
  wasDragged: () => boolean;
}

function StampCard({
  stamp,
  index,
  count,
  radius,
  width,
  height,
  angle,
  shadow,
  onOpen,
  wasDragged,
}: StampCardProps) {
  const step   = 360 / count;
  const facing = index * step;

  // Exact Framer brightness formula
  const imageFilter = useTransform(angle, (value: number) => {
    const relative = (((facing + value) % 360) + 540) % 360 - 180;
    const t        = Math.abs(relative) / 180;
    const brightness = 1 - 0.5 * Math.pow(t, 1.6);
    const shadow_str = shadow
      ? " drop-shadow(0 16px 24px rgba(4,9,22,0.4))"
      : "";
    // Add grayscale for AeroPure monochrome on top of Framer brightness
    return `grayscale(1) brightness(${brightness.toFixed(3)})${shadow_str}`;
  });

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width,
        height,
        marginLeft: -width / 2,
        marginTop: -height / 2,
        transform: `rotateY(${facing}deg) translateZ(${radius}px)`,
        transformStyle: "preserve-3d",
      }}
    >
      <motion.button
        type="button"
        aria-label={`Open stamp: ${stamp.title}`}
        onClick={() => { if (!wasDragged()) onOpen(index); }}
        whileHover={{ scale: 1.05, y: -6 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        style={{
          width: "100%",
          height: "100%",
          padding: 0,
          margin: 0,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          display: "block",
        }}
      >
        {/* Exact Framer: motion.img with objectFit:contain — perforations transparent */}
        <motion.img
          src={stamp.src}
          alt={stamp.title}
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
            filter: imageFilter,
          }}
        />
      </motion.button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function StampScrapbook({
  onSelectContinent,
}: {
  onSelectContinent?: (id: string) => void;
}) {
  // — Props matching Framer defaults —
  const stampHeight      = 300;
  const spread           = 1;
  const tilt             = -6;
  const autoRotate       = true;
  const speed            = 10;
  const cursorSteer      = true;
  const hoverSpeed       = 24;
  const scrollTilt       = true;
  const scrollTiltStrength = 16;
  const stampShadow      = true;

  // AeroPure monochrome panel colours (replacing Framer's warm cream)
  const panelColor    = "#D9D9D6";
  const backdropColor = "rgba(7,7,7,0.92)";
  const titleColor    = "#111111";
  const textColor     = "#41413F";

  const items = useMemo(() => FALLBACK_STAMPS, []);
  const count = items.length;

  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView  = useInView(rootRef);
  const angle   = useMotionValue(0);
  const tiltMV  = useMotionValue(0);

  const yawTransform  = useTransform(angle, (a: number) => `rotateY(${a}deg)`);
  const tiltTransform = useTransform(tiltMV, (t: number) => `rotateX(${tilt + t}deg)`);

  const [mounted,        setMounted]        = useState(false);
  const [openIndex,      setOpenIndex]      = useState<number | null>(null);
  const [direction,      setDirection]      = useState(1);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [viewportNarrow, setViewportNarrow] = useState(false);

  // Exact Framer geometry: clamp stamp to containerWidth * 0.6
  const cardHeight = Math.round(Math.min(stampHeight, Math.max(140, containerWidth * 0.55)));
  const cardWidth  = Math.round(cardHeight * STAMP_ASPECT);
  const radius     = Math.round(ringRadius(count, cardWidth, spread));

  // — Drag / fling refs —
  const draggingRef     = useRef(false);
  const dragDistanceRef = useRef(0);
  const lastXRef        = useRef(0);
  const lastTimeRef     = useRef(0);
  const flingRef        = useRef(0);
  const steerVelRef     = useRef(speed);
  const pointerNormXRef = useRef(0);
  const tiltTargetRef   = useRef(0);
  const hoverRef        = useRef(false);

  // SSR-safe mount (exact Framer)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Container resize (exact Framer)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const node = rootRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) startTransition(() => setContainerWidth(w));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Viewport narrow (modal layout)
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq     = window.matchMedia("(max-width: 640px)");
    const update = () => setViewportNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Scroll-driven tilt (exact Framer)
  useEffect(() => {
    if (typeof window === "undefined") return;
    let lastY = window.scrollY;
    let lastT = Date.now();
    const onScroll = () => {
      const now = Date.now();
      const y   = window.scrollY;
      const dt  = Math.max(now - lastT, 1);
      const v   = ((y - lastY) / dt) * 1000;
      lastY = y; lastT = now;
      const range = scrollTilt ? scrollTiltStrength : 0;
      tiltTargetRef.current = Math.max(-range, Math.min(range, -(v / 2500) * range));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollTilt, scrollTiltStrength]);

  // Declare close/step before keyboard effect
  const wasDragged = useCallback(() => dragDistanceRef.current > 6, []);

  const openStamp = useCallback((index: number) => {
    setDirection(0);
    startTransition(() => setOpenIndex(index));
  }, []);

  const closeStamp = useCallback(() => {
    setDirection(0);
    startTransition(() => setOpenIndex(null));
  }, []);

  const stepStamp = useCallback(
    (dir: number) => {
      setDirection(dir);
      startTransition(() =>
        setOpenIndex((cur) =>
          cur === null ? cur : (cur + dir + count) % count
        )
      );
    },
    [count]
  );

  // Keyboard controls (exact Framer)
  useEffect(() => {
    if (openIndex === null || typeof window === "undefined") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape")     closeStamp();
      if (e.key === "ArrowRight") stepStamp(1);
      if (e.key === "ArrowLeft")  stepStamp(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [openIndex, closeStamp, stepStamp]);

  // Animation loop (exact Framer)
  const STEER_RESPONSE = 3;
  useAnimationFrame((_, delta) => {
    if (openIndex !== null || draggingRef.current || !inView) return;
    const dt   = Math.min(delta, 48) / 1000;
    const idle = autoRotate && !reducedMotion ? speed : 0;
    const target = cursorSteer && hoverRef.current
      ? pointerNormXRef.current * hoverSpeed
      : idle;
    const ease = 1 - Math.exp(-dt * STEER_RESPONSE);
    steerVelRef.current += (target - steerVelRef.current) * ease;
    flingRef.current *= Math.exp(-dt * 2.2);
    if (Math.abs(flingRef.current) < 1) flingRef.current = 0;
    angle.set(angle.get() + (steerVelRef.current + flingRef.current) * dt);
    tiltTargetRef.current *= Math.exp(-dt * 3);
    tiltMV.set(
      tiltMV.get() +
        (tiltTargetRef.current - tiltMV.get()) * (1 - Math.exp(-dt * 8))
    );
  });

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (openIndex !== null) return;
      draggingRef.current     = true;
      dragDistanceRef.current = 0;
      flingRef.current        = 0;
      lastXRef.current        = e.clientX;
      lastTimeRef.current     = e.timeStamp;
    },
    [openIndex]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const nx   = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      pointerNormXRef.current = Math.max(-1, Math.min(1, nx));
      if (!draggingRef.current) return;
      const dx    = e.clientX - lastXRef.current;
      const dtime = Math.max(e.timeStamp - lastTimeRef.current, 1);
      lastXRef.current    = e.clientX;
      lastTimeRef.current = e.timeStamp;
      dragDistanceRef.current += Math.abs(dx);
      const deg = dx * 0.28;
      angle.set(angle.get() + deg);
      flingRef.current = (deg / dtime) * 1000;
    },
    [angle]
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current  = false;
    flingRef.current = Math.max(-260, Math.min(260, flingRef.current));
  }, []);

  const openStampData = openIndex === null ? null : items[openIndex];

  // When a stamp is clicked from the ring, route to geographic navigation
  const handleOpen = useCallback(
    (index: number) => {
      const stamp = items[index];
      if (onSelectContinent) {
        // Navigate directly without modal
        onSelectContinent(stamp.id);
      } else {
        openStamp(index);
      }
    },
    [items, onSelectContinent, openStamp]
  );

  const chevBtn: React.CSSProperties = {
    border: "none",
    background: "transparent",
    color: panelColor,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    padding: 6,
  };

  return (
    <>
      {/* ── Page wrapper ── */}
      <div
        style={{
          background: "#070707",
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── Minimal header ── */}
        <header
          style={{
            textAlign: "center",
            padding: "clamp(1.2rem,3vh,2.5rem) 2rem clamp(0.8rem,2vh,1.5rem)",
            flexShrink: 0,
          }}
        >
          <h1
            style={{
              fontFamily: "'Orbitron', sans-serif",
              color: "#F2F2F0",
              fontSize: "clamp(1.6rem,4vw,3.2rem)",
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
              fontSize: "clamp(0.7rem,1.4vw,0.9rem)",
              margin: "0.5rem 0 0",
              letterSpacing: "0.05em",
            }}
          >
            Know Tomorrow&apos;s Air. Today.
          </p>
          <p
            style={{
              fontFamily: "'Orbitron', sans-serif",
              color: "#41413F",
              fontSize: "clamp(0.5rem,0.9vw,0.65rem)",
              margin: "0.7rem 0 0",
              letterSpacing: "0.28em",
            }}
          >
            GLOBAL AIR INTELLIGENCE
          </p>
        </header>

        {/* ── 3-D ring carousel (exact Framer layout) ── */}
        <div
          ref={rootRef}
          role="group"
          aria-roledescription="3D stamp carousel"
          aria-label="Select a continent to explore air quality data"
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            userSelect: "none",
            touchAction: "pan-y",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onMouseEnter={() => { hoverRef.current = true; }}
          onMouseLeave={() => { hoverRef.current = false; }}
        >
          {/* Perspective outer shell (exact Framer) */}
          <div
            aria-hidden={openIndex !== null}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              perspective: 1400,
            }}
          >
            {/* Tilt (scroll-driven) */}
            <motion.div
              style={{
                position: "relative",
                transformStyle: "preserve-3d",
                transform: tiltTransform,
              }}
            >
              {/* Yaw / spin wrapper (exact Framer) */}
              <motion.div
                style={{
                  position: "relative",
                  width: cardWidth,
                  height: cardHeight,
                  transformStyle: "preserve-3d",
                  transform: yawTransform,
                }}
              >
                {items.map((stamp, index) => (
                  <StampCard
                    key={stamp.id}
                    stamp={stamp}
                    index={index}
                    count={count}
                    radius={radius}
                    width={cardWidth}
                    height={cardHeight}
                    angle={angle}
                    shadow={stampShadow}
                    onOpen={handleOpen}
                    wasDragged={wasDragged}
                  />
                ))}
              </motion.div>
            </motion.div>
          </div>

          {/* Hint */}
          <p
            style={{
              position: "absolute",
              bottom: "1rem",
              left: "50%",
              transform: "translateX(-50%)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.6rem",
              color: "#41413F",
              letterSpacing: "0.22em",
              pointerEvents: "none",
              margin: 0,
              whiteSpace: "nowrap",
            }}
          >
            DRAG TO SPIN · CLICK TO EXPLORE
          </p>
        </div>
      </div>

      {/* ── Postcard modal portal (exact Framer) ── */}
      {mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {openStampData && (
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label={openStampData.title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 2147483000,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: viewportNarrow ? 16 : 20,
                  padding: viewportNarrow ? 16 : 40,
                  background: backdropColor,
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  perspective: 1600,
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { if (e.target === e.currentTarget) closeStamp(); }}
              >
                <AnimatePresence initial custom={direction} mode="popLayout">
                  <motion.div
                    key={openIndex}
                    custom={direction}
                    variants={POSTCARD_VARIANTS}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x:       { type: "spring", stiffness: 300, damping: 32 },
                      rotate:  { type: "spring", stiffness: 300, damping: 32 },
                      rotateY: { type: "spring", stiffness: 70,  damping: 14 },
                      scale:   { type: "spring", stiffness: 120, damping: 15 },
                      opacity: { duration: 0.28 },
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.7}
                    onDragEnd={(_, info) => {
                      const power = info.offset.x + info.velocity.x * 0.2;
                      if (power < -90) stepStamp(1);
                      else if (power > 90) stepStamp(-1);
                    }}
                    style={{
                      position: "relative",
                      width: viewportNarrow ? "100%" : 380,
                      maxWidth: "100%",
                      maxHeight: "calc(100% - 60px)",
                      cursor: "grab",
                      pointerEvents: "auto",
                      transformStyle: "preserve-3d",
                      filter: "drop-shadow(0 24px 44px rgba(2,6,18,0.55))",
                    }}
                  >
                    {/* Postcard panel */}
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        background: panelColor,
                        boxSizing: "border-box",
                        borderRadius: 6,
                        transform: "rotate(-1.5deg)",
                        padding: viewportNarrow ? "30px 26px 26px" : "46px 44px 36px",
                        width: "100%",
                        minHeight: viewportNarrow ? undefined : 480,
                        maxHeight: "100%",
                        overflow: "hidden",
                      }}
                    >
                      {/* Top row: title + stamp image */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                          <h3
                            style={{
                              margin: 0,
                              fontSize: viewportNarrow ? 26 : 32,
                              lineHeight: 1.08,
                              fontFamily: "'Orbitron', sans-serif",
                              color: titleColor,
                              letterSpacing: "0.05em",
                            }}
                          >
                            {openStampData.title}
                          </h3>
                          <p
                            style={{
                              margin: "0.5rem 0 0",
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 10,
                              letterSpacing: "0.18em",
                              color: "#6D6D6A",
                            }}
                          >
                            {openStampData.caption}
                          </p>
                        </div>

                        {/* Stamp thumbnail (greyscale) */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={openStampData.src}
                          alt={openStampData.title}
                          draggable={false}
                          style={{
                            height: viewportNarrow ? 132 : 180,
                            width: "auto",
                            objectFit: "contain",
                            flexShrink: 0,
                            marginTop: -18,
                            marginRight: -14,
                            transform: "rotate(-4deg)",
                            filter: "grayscale(1) drop-shadow(0 1px 1.5px rgba(2,6,18,0.28))",
                          }}
                        />
                      </div>

                      {/* Story text */}
                      {openStampData.description && (
                        <p
                          style={{
                            marginTop: "auto",
                            marginBottom: 0,
                            fontFamily: "Georgia, serif",
                            fontSize: viewportNarrow ? 18 : 20,
                            color: textColor,
                            lineHeight: viewportNarrow ? "44px" : "52px",
                            ...ruledLines(viewportNarrow ? 44 : 52),
                          }}
                        >
                          {openStampData.description}
                        </p>
                      )}

                      {/* Navigate to continent button */}
                      {onSelectContinent && (
                        <button
                          type="button"
                          onClick={() => {
                            closeStamp();
                            onSelectContinent(openStampData.id);
                          }}
                          style={{
                            marginTop: "1.5rem",
                            padding: "0.6rem 1.4rem",
                            background: "#242423",
                            color: "#F2F2F0",
                            border: "none",
                            borderRadius: 3,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 10,
                            letterSpacing: "0.2em",
                            cursor: "pointer",
                            textTransform: "uppercase",
                          }}
                        >
                          Explore {openStampData.title} →
                        </button>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Chevron nav (exact Framer) */}
                <div
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 22,
                    pointerEvents: "auto",
                  }}
                >
                  <button type="button" aria-label="Previous stamp" onClick={() => stepStamp(-1)} style={chevBtn}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span style={{ color: panelColor, opacity: 0.75, fontSize: 14, letterSpacing: "0.08em", fontFamily: "'JetBrains Mono', monospace" }}>
                    {(openIndex ?? 0) + 1} / {count}
                  </span>
                  <button type="button" aria-label="Next stamp" onClick={() => stepStamp(1)} style={chevBtn}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                {/* Close button (exact Framer) */}
                <button
                  type="button"
                  aria-label="Close stamp detail"
                  onClick={closeStamp}
                  style={{
                    position: "absolute",
                    top: viewportNarrow ? 16 : 28,
                    right: viewportNarrow ? 16 : 32,
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "none",
                    background: "transparent",
                    color: panelColor,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    pointerEvents: "auto",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
