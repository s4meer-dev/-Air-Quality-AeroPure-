"use client";

/* eslint-disable */
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";

export interface StampItem {
  image?: {
    src?: string;
    srcSet?: string;
    alt?: string;
  };
  title?: string;
  code?: string;
  caption?: string;
  description?: string;
  continentId?: string;
}

const FALLBACK_STAMPS: StampItem[] = [
  {
    image: { src: "https://framerusercontent.com/images/rah9krKNzgJYwNBPXKg3l4nYpOQ.webp", alt: "Asia Continent Stamp" },
    title: "Asia",
    caption: "AS-01 · 48 Countries",
    description: "Eastern Atmospheric Shield & Monsoon Belt. Expansive landmass featuring high-density industrial basins and Himalayan barriers.",
    continentId: "asia",
  },
  {
    image: { src: "https://framerusercontent.com/images/q1J777u9lVCmKnqrK3bmGjP6QI.webp", alt: "Europe Continent Stamp" },
    title: "Europe",
    caption: "EU-02 · 44 Countries",
    description: "North Atlantic & Mediterranean Air Corridors. Temperate marine and continental air regimes shaped by Westerlies.",
    continentId: "europe",
  },
  {
    image: { src: "https://framerusercontent.com/images/mTf6zMaRl92NQ8wk2t0BN9Ov004.webp", alt: "North America Stamp" },
    title: "North America",
    caption: "NA-03 · 23 Countries",
    description: "Boreal & Coastal Jet-Stream Systems. Dynamic polar air mass interactions spanning Pacific coastal basins.",
    continentId: "north-america",
  },
  {
    image: { src: "https://framerusercontent.com/images/DvuBw3HnxEVQe2pZOBUR3FucNhg.webp", alt: "South America Stamp" },
    title: "South America",
    caption: "SA-04 · 12 Countries",
    description: "Amazonian Basin & Andean Topographic Shield. Vast rainforest oxygen sinks and high-altitude Andean boundaries.",
    continentId: "south-america",
  },
  {
    image: { src: "https://framerusercontent.com/images/riU79NitRfVzCflkw1yWoiP2zww.webp", alt: "Africa Stamp" },
    title: "Africa",
    caption: "AF-05 · 54 Countries",
    description: "Saharan Mineral Dust & Equatorial Boundary Zone. Dominant dust plume transports and ITCZ shifts.",
    continentId: "africa",
  },
  {
    image: { src: "https://framerusercontent.com/images/FvbllamB85csQxoenDGhwOg0Y.webp", alt: "Oceania Stamp" },
    title: "Oceania",
    caption: "OC-06 · 14 Countries",
    description: "Pacific Marine Boundary Layer & Maritime Air. Clean maritime air masses dominated by Southern Ocean wind patterns.",
    continentId: "oceania",
  },
  {
    image: { src: "https://framerusercontent.com/images/7m7du4CGgAaVGS6HPiDavHcoo.webp", alt: "Antarctica Stamp" },
    title: "Antarctica",
    caption: "AN-07 · 1 Reserve",
    description: "Polar Cryospheric Reserve & Clean Air Baseline. Global baseline pristine atmospheric monitoring zone under polar vortex isolation.",
    continentId: "antarctica",
  },
];

const STAMP_ASPECT = 2 / 3;

const POSTCARD_VARIANTS = {
  enter: (dir: number) =>
    dir === 0
      ? { rotateY: 180, scale: 0.5, opacity: 0, x: 0, rotate: 0 }
      : { x: dir > 0 ? 460 : -460, opacity: 0, rotate: dir > 0 ? 4 : -4, rotateY: 0, scale: 1 },
  center: { x: 0, rotateY: 0, scale: 1, opacity: 1, rotate: 0 },
  exit: (dir: number) =>
    dir === 0
      ? { rotateY: 180, scale: 0.5, opacity: 0, x: 0, rotate: 0 }
      : { x: dir > 0 ? -460 : 460, opacity: 0, rotate: dir > 0 ? -4 : 4, rotateY: 0, scale: 1 },
};

function ringRadius(count: number, stampWidth: number, spread: number) {
  if (count < 3) return stampWidth * 0.75 * spread;
  return (stampWidth / (2 * Math.tan(Math.PI / count))) * 1.18 * spread;
}

function ruledLines(pitch: number) {
  const lineAt = Math.round(pitch * 0.92);
  return {
    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${
      lineAt - 1
    }px, rgba(187, 187, 187, 0.55) ${lineAt - 1}px, rgba(187, 187, 187, 0.55) ${lineAt}px, transparent ${lineAt}px, transparent ${pitch}px)`,
  };
}

function StampCard(props: any) {
  const { stamp, index, count, radius, width, height, angle, shadow, isStatic, onOpen, wasDragged } = props;
  const step = 360 / count;
  const facing = index * step;

  const imageFilter = useTransform(angle, (value: number) => {
    const relative = ((((facing + value) % 360) + 540) % 360) - 180;
    const t = Math.abs(relative) / 180;
    const brightness = 1 - 0.5 * Math.pow(t, 1.6);
    return `brightness(${brightness.toFixed(3)})${
      shadow ? " drop-shadow(0 16px 24px rgba(4, 9, 22, 0.4))" : ""
    }`;
  });

  return _jsx("div", {
    style: {
      position: "absolute",
      left: "50%",
      top: "50%",
      width,
      height,
      marginLeft: -width / 2,
      marginTop: -height / 2,
      transform: `rotateY(${facing}deg) translateZ(${radius}px)`,
      transformStyle: "preserve-3d",
    },
    children: _jsxs(motion.button, {
      type: "button",
      "aria-label": `Open stamp: ${stamp.title ?? `Stamp ${index + 1}`}`,
      onClick: () => {
        if (!wasDragged()) onOpen(index);
      },
      whileHover: isStatic ? undefined : { scale: 1.05, y: -6 },
      transition: { type: "spring", stiffness: 320, damping: 24 },
      style: {
        width: "100%",
        height: "100%",
        padding: 0,
        margin: 0,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        display: "block",
        position: "relative",
      },
      children: [
        stamp.image?.src
          ? _jsx(motion.img, {
              src: stamp.image.src,
              srcSet: stamp.image.srcSet,
              alt: stamp.image.alt ?? stamp.title ?? "",
              draggable: false,
              style: {
                width: "100%",
                height: "100%",
                objectFit: "contain",
                pointerEvents: "none",
                filter: isStatic ? (shadow ? "drop-shadow(0 16px 24px rgba(4, 9, 22, 0.4))" : undefined) : imageFilter,
              },
            })
          : _jsx("div", {
              style: {
                width: "100%",
                height: "100%",
                borderRadius: 6,
                border: "2px dashed rgba(120, 100, 80, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                color: "rgba(120, 100, 80, 0.8)",
              },
              children: "Add image",
            }),

        // Prominent Continent Plaque on the Face of the Stamp
        _jsxs("div", {
          style: {
            position: "absolute",
            bottom: "8%",
            left: "8%",
            right: "8%",
            background: "rgba(247, 240, 225, 0.95)",
            border: "1.5px solid #2B2119",
            borderRadius: 3,
            padding: "8px 6px 6px",
            textAlign: "center",
            boxShadow: "0 4px 14px rgba(0,0,0,0.6)",
            pointerEvents: "none",
            transform: "translateZ(10px)",
          },
          children: [
            _jsx("div", {
              style: {
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "clamp(13px, 2.2vw, 17px)",
                fontWeight: 900,
                letterSpacing: "0.1em",
                color: "#2B2119",
                textTransform: "uppercase",
                lineHeight: 1.1,
              },
              children: stamp.title ?? "CONTINENT",
            }),
            _jsx("div", {
              style: {
                fontSize: "9px",
                fontFamily: "monospace",
                letterSpacing: "0.12em",
                color: "#6B5842",
                fontWeight: 700,
                marginTop: 3,
                textTransform: "uppercase",
              },
              children: stamp.caption ?? "AEROPURE GLOBAL",
            }),
          ],
        }),

        // Top Stamp Header Badges (Denomination & Air Post)
        _jsxs("div", {
          style: {
            position: "absolute",
            top: "8%",
            left: "8%",
            right: "8%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pointerEvents: "none",
            transform: "translateZ(10px)",
          },
          children: [
            _jsx("span", {
              style: {
                fontFamily: "monospace",
                fontWeight: 900,
                fontSize: "10px",
                background: "rgba(20, 18, 16, 0.9)",
                color: "#D4AF37",
                padding: "2px 6px",
                borderRadius: 2,
                border: "1px solid rgba(212, 175, 55, 0.4)",
                letterSpacing: "0.08em",
              },
              children: stamp.code ?? `0${index + 1}`,
            }),
            _jsx("span", {
              style: {
                fontFamily: "Georgia, serif",
                fontWeight: 800,
                fontSize: "10px",
                color: "#2B2119",
                background: "rgba(247, 240, 225, 0.9)",
                padding: "2px 6px",
                border: "1px solid #7A6A53",
                borderRadius: 2,
                letterSpacing: "0.05em",
              },
              children: "AIR POST",
            }),
          ],
        }),

        // Circular Postmark Cancellation Watermark
        _jsxs("div", {
          style: {
            position: "absolute",
            top: "20%",
            right: "10%",
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "1.5px dashed rgba(43, 33, 25, 0.5)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transform: "rotate(-14deg)",
            pointerEvents: "none",
            color: "rgba(43, 33, 25, 0.65)",
            fontSize: "7px",
            fontFamily: "monospace",
            lineHeight: 1.1,
            background: "rgba(247, 240, 225, 0.15)",
          },
          children: [
            _jsx("span", { children: "AEROPURE" }),
            _jsx("span", { style: { fontWeight: "bold" }, children: "2026" }),
            _jsx("span", { children: "GLOBAL" }),
          ],
        }),
      ],
    }),
  });
}

export interface StampScrapbookProps {
  stamps?: StampItem[];
  stampHeight?: number;
  spread?: number;
  tilt?: number;
  autoRotate?: boolean;
  speed?: number;
  cursorSteer?: boolean;
  hoverSpeed?: number;
  scrollTilt?: boolean;
  scrollTiltStrength?: number;
  stampShadow?: boolean;
  panelColor?: string;
  backdropColor?: string;
  titleColor?: string;
  textColor?: string;
  accentColor?: string;
  sealUrl?: string;
  sealMonogram?: string;
  onSelectContinent?: (continentId: string) => void;
  style?: React.CSSProperties;
}

export default function StampScrapbook(props: StampScrapbookProps) {
  const {
    stamps,
    stampHeight = 300,
    spread = 1,
    tilt = -6,
    autoRotate = true,
    speed = 10,
    cursorSteer = true,
    hoverSpeed = 24,
    scrollTilt = true,
    scrollTiltStrength = 16,
    stampShadow = true,
    panelColor = "#F7F0E1",
    backdropColor = "rgba(7, 15, 35, 0.86)",
    titleColor = "#2B2119",
    textColor = "#2550D8",
    accentColor = "#B5843B",
    sealUrl,
    sealMonogram = "A",
    onSelectContinent,
    style,
  } = props;

  const items = useMemo(() => {
    const source = stamps && stamps.length > 0 ? stamps : FALLBACK_STAMPS;
    return source.map((stamp, index) => ({
      ...stamp,
      image: stamp.image?.src ? stamp.image : FALLBACK_STAMPS[index % FALLBACK_STAMPS.length].image,
    }));
  }, [stamps]);

  const count = items.length;
  const isStatic = false;
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef);
  const angle = useMotionValue(0);
  const tiltMV = useMotionValue(0);

  const yawTransform = useTransform(angle, (a) => `rotateY(${a}deg)`);
  const tiltTransform = useTransform(tiltMV, (t) => `rotateX(${tilt + t}deg)`);

  const [mounted, setMounted] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState(1);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [viewportNarrow, setViewportNarrow] = useState(false);

  const cardHeight = Math.round(Math.min(stampHeight, Math.max(140, containerWidth * 0.6)));
  const cardWidth = Math.round(cardHeight * STAMP_ASPECT);
  const radius = Math.round(ringRadius(count, cardWidth, spread));

  const draggingRef = useRef(false);
  const dragDistanceRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const flingRef = useRef(0);
  const steerVelRef = useRef(speed);
  const pointerNormXRef = useRef(0);
  const tiltTargetRef = useRef(0);
  const hoverRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const node = rootRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (width > 0) startTransition(() => setContainerWidth(width));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const STEER_RESPONSE = 3;
  useAnimationFrame((_, delta) => {
    if (isStatic || openIndex !== null || draggingRef.current || !inView) return;
    const dt = Math.min(delta, 48) / 1e3;
    const idle = autoRotate && !reducedMotion ? speed : 0;
    const target = cursorSteer && hoverRef.current ? pointerNormXRef.current * hoverSpeed : idle;
    const ease = 1 - Math.exp(-dt * STEER_RESPONSE);
    steerVelRef.current += (target - steerVelRef.current) * ease;
    flingRef.current *= Math.exp(-dt * 2.2);
    if (Math.abs(flingRef.current) < 1) flingRef.current = 0;
    angle.set(angle.get() + (steerVelRef.current + flingRef.current) * dt);

    tiltTargetRef.current *= Math.exp(-dt * 3);
    tiltMV.set(tiltMV.get() + (tiltTargetRef.current - tiltMV.get()) * (1 - Math.exp(-dt * 8)));
  });

  const handlePointerDown = useCallback(
    (event: any) => {
      if (isStatic || openIndex !== null) return;
      draggingRef.current = true;
      dragDistanceRef.current = 0;
      flingRef.current = 0;
      lastXRef.current = event.clientX;
      lastTimeRef.current = event.timeStamp;
    },
    [isStatic, openIndex]
  );

  const handlePointerMove = useCallback(
    (event: any) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      pointerNormXRef.current = Math.max(-1, Math.min(1, nx));
      if (!draggingRef.current) return;
      const deltaX = event.clientX - lastXRef.current;
      const deltaTime = Math.max(event.timeStamp - lastTimeRef.current, 1);
      lastXRef.current = event.clientX;
      lastTimeRef.current = event.timeStamp;
      dragDistanceRef.current += Math.abs(deltaX);
      const degrees = deltaX * 0.28;
      angle.set(angle.get() + degrees);
      flingRef.current = (degrees / deltaTime) * 1e3;
    },
    [angle]
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false;
    flingRef.current = Math.max(-260, Math.min(260, flingRef.current));
  }, []);

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
        setOpenIndex((current) => (current === null ? current : (current + dir + count) % count))
      );
    },
    [count]
  );

  useEffect(() => {
    if (openIndex === null || typeof window === "undefined") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeStamp();
      if (event.key === "ArrowRight") stepStamp(1);
      if (event.key === "ArrowLeft") stepStamp(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex, closeStamp, stepStamp]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setViewportNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let lastY = window.scrollY;
    let lastT = Date.now();
    const onScroll = () => {
      const now = Date.now();
      const y = window.scrollY;
      const dt = Math.max(now - lastT, 1);
      const v = ((y - lastY) / dt) * 1e3;
      lastY = y;
      lastT = now;
      const range = scrollTilt ? scrollTiltStrength : 0;
      tiltTargetRef.current = Math.max(-range, Math.min(range, -(v / 2500) * range));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollTilt, scrollTiltStrength]);

  const openStampData = openIndex === null ? null : items[openIndex];

  const chevButtonStyle = {
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

  const sunburstPoints = Array.from({ length: 24 })
    .map((_, i) => {
      const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
      const rad = i % 2 === 0 ? 13.5 : 9;
      return `${(22 + Math.cos(a) * rad).toFixed(2)},${(22 + Math.sin(a) * rad).toFixed(2)}`;
    })
    .join(" ");

  const sealSvg = _jsxs("svg", {
    width: "46",
    height: "46",
    viewBox: "0 0 44 44",
    "aria-hidden": true,
    style: { display: "block", transform: "rotate(-4deg)" },
    children: [
      _jsx("defs", {
        children: _jsxs("filter", {
          id: "sealTexture",
          x: "-20%",
          y: "-20%",
          width: "140%",
          height: "140%",
          children: [
            _jsx("feTurbulence", {
              type: "fractalNoise",
              baseFrequency: "0.72",
              numOctaves: "1",
              seed: "4",
              result: "n",
            }),
            _jsx("feDisplacementMap", {
              in: "SourceGraphic",
              in2: "n",
              scale: "1.2",
              xChannelSelector: "R",
              yChannelSelector: "G",
            }),
          ],
        }),
      }),
      _jsxs("g", {
        filter: "url(#sealTexture)",
        children: [
          _jsx("circle", { cx: "22", cy: "22", r: "21", fill: "none", stroke: accentColor, strokeWidth: "1.1" }),
          _jsx("circle", { cx: "22", cy: "22", r: "18", fill: "none", stroke: accentColor, strokeWidth: "1.1" }),
          _jsx("polygon", { points: sunburstPoints, fill: accentColor }),
          sealMonogram
            ? _jsx("text", {
                x: "22",
                y: "22.5",
                textAnchor: "middle",
                dominantBaseline: "central",
                fill: panelColor,
                fontSize: "14",
                fontWeight: 700,
                fontFamily: "Georgia, 'Times New Roman', serif",
                children: sealMonogram,
              })
            : null,
        ],
      }),
    ],
  });

  const sealNode = sealUrl
    ? _jsx("a", {
        href: sealUrl,
        target: "_blank",
        rel: "noopener noreferrer",
        "aria-label": "Visit website",
        onPointerDown: (event: any) => event.stopPropagation(),
        style: { display: "inline-block", marginBottom: 16, lineHeight: 0, cursor: "pointer" },
        children: sealSvg,
      })
    : _jsx("span", {
        style: { display: "inline-block", marginBottom: 16, lineHeight: 0 },
        "aria-hidden": true,
        children: sealSvg,
      });

  const inkNoiseFine = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='210'><filter id='pf'><feTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#pf)'/></svg>`;
  const inkNoiseCoarse = `<svg xmlns='http://www.w3.org/2000/svg' width='440' height='320'><filter id='pc'><feTurbulence type='fractalNoise' baseFrequency='0.05' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#pc)'/></svg>`;
  const inkFineUrl = `url("data:image/svg+xml,${encodeURIComponent(inkNoiseFine)}")`;
  const inkCoarseUrl = `url("data:image/svg+xml,${encodeURIComponent(inkNoiseCoarse)}")`;
  const texturedInk = (color: string, op = 0.9, subtle = false) => ({
    opacity: op,
    color: "transparent",
    WebkitTextFillColor: "transparent",
    backgroundColor: color,
    backgroundImage: subtle ? inkFineUrl : `${inkCoarseUrl}, ${inkFineUrl}`,
    backgroundBlendMode: subtle ? "soft-light" : "soft-light, soft-light",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
  });

  return _jsxs("div", {
    ref: rootRef,
    role: "group",
    "aria-roledescription": "3D stamp carousel",
    style: {
      ...style,
      position: "relative",
      overflow: "hidden",
      userSelect: "none",
      touchAction: "pan-y",
      minHeight: 480,
    },
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerUp,
    onPointerLeave: handlePointerUp,
    onMouseEnter: () => {
      hoverRef.current = true;
    },
    onMouseLeave: () => {
      hoverRef.current = false;
    },
    children: [
      _jsx("div", {
        "aria-hidden": openIndex !== null,
        style: {
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          perspective: 1400,
        },
        children: _jsx(motion.div, {
          style: {
            position: "relative",
            transformStyle: "preserve-3d",
            transform: isStatic ? `rotateX(${tilt}deg)` : tiltTransform,
          },
          children: _jsx(motion.div, {
            style: {
              position: "relative",
              width: cardWidth,
              height: cardHeight,
              transformStyle: "preserve-3d",
              transform: isStatic ? "rotateY(12deg)" : yawTransform,
            },
            children: items.map((stamp: any, index: number) =>
              _jsx(
                StampCard,
                {
                  stamp,
                  index,
                  count,
                  radius,
                  width: cardWidth,
                  height: cardHeight,
                  angle,
                  shadow: stampShadow,
                  isStatic,
                  onOpen: openStamp,
                  wasDragged,
                },
                index
              )
            ),
          }),
        }),
      }),
      mounted &&
        !isStatic &&
        typeof document !== "undefined" &&
        createPortal(
          _jsx(AnimatePresence, {
            children:
              openStampData &&
              _jsxs(motion.div, {
                role: "dialog",
                "aria-modal": "true",
                "aria-label": openStampData.title ?? "Stamp detail",
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 },
                transition: { duration: 0.25 },
                style: {
                  position: "fixed",
                  inset: 0,
                  zIndex: 2147483647,
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
                },
                onPointerDown: (event: any) => event.stopPropagation(),
                onClick: (event: any) => {
                  if (event.target === event.currentTarget) closeStamp();
                },
                children: [
                  _jsx(AnimatePresence, {
                    initial: true,
                    custom: direction,
                    mode: "popLayout",
                    children: _jsx(
                      motion.div,
                      {
                        custom: direction,
                        variants: POSTCARD_VARIANTS,
                        initial: "enter",
                        animate: "center",
                        exit: "exit",
                        transition: {
                          x: { type: "spring", stiffness: 300, damping: 32 },
                          rotate: { type: "spring", stiffness: 300, damping: 32 },
                          rotateY: { type: "spring", stiffness: 70, damping: 14 },
                          scale: { type: "spring", stiffness: 120, damping: 15 },
                          opacity: { duration: 0.28 },
                        },
                        drag: "x",
                        dragConstraints: { left: 0, right: 0 },
                        dragElastic: 0.7,
                        onDragEnd: (_: any, info: any) => {
                          const power = info.offset.x + info.velocity.x * 0.2;
                          if (power < -90) stepStamp(1);
                          else if (power > 90) stepStamp(-1);
                        },
                        style: {
                          position: "relative",
                          width: viewportNarrow ? "100%" : 380,
                          maxWidth: "100%",
                          maxHeight: "calc(100% - 60px)",
                          cursor: "grab",
                          pointerEvents: "auto",
                          transformStyle: "preserve-3d",
                          filter: "drop-shadow(0 24px 44px rgba(2, 6, 18, 0.55))",
                        },
                        children: _jsxs("div", {
                          style: {
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                            background: panelColor,
                            boxSizing: "border-box",
                            borderRadius: 6,
                            transform: "rotate(-1.5deg)",
                            padding: viewportNarrow ? "30px 26px 26px" : "46px 44px 36px",
                            width: "100%",
                            minHeight: viewportNarrow ? undefined : 540,
                            maxHeight: "100%",
                            overflow: "hidden",
                          },
                          children: [
                            _jsxs("div", {
                              style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 },
                              children: [
                                _jsxs("div", {
                                  style: { flex: 1, minWidth: 0, paddingRight: 12 },
                                  children: [
                                    sealNode,
                                    _jsx("h3", {
                                      style: {
                                        margin: 0,
                                        fontSize: viewportNarrow ? 26 : 32,
                                        lineHeight: 1.08,
                                        ...texturedInk(titleColor, 1, true),
                                      },
                                      children: openStampData.title ?? "Untitled",
                                    }),
                                  ],
                                }),
                                _jsx("img", {
                                  src: openStampData.image?.src,
                                  srcSet: openStampData.image?.srcSet,
                                  alt: openStampData.image?.alt ?? openStampData.title ?? "",
                                  draggable: false,
                                  style: {
                                    height: viewportNarrow ? 132 : 180,
                                    width: "auto",
                                    objectFit: "contain",
                                    flexShrink: 0,
                                    marginTop: -18,
                                    marginRight: -14,
                                    transform: "rotate(-4deg)",
                                    filter: "drop-shadow(0 1px 1.5px rgba(2, 6, 18, 0.28))",
                                  },
                                }),
                              ],
                            }),
                            openStampData.description &&
                              _jsx("p", {
                                style: {
                                  marginTop: "auto",
                                  marginBottom: 0,
                                  color: textColor,
                                  fontFamily: "'Caveat', 'Segoe Script', 'Bradley Hand', cursive",
                                  fontSize: viewportNarrow ? 21 : 24,
                                  lineHeight: viewportNarrow ? "46px" : "54px",
                                  ...ruledLines(viewportNarrow ? 46 : 54),
                                },
                                children: _jsx("span", {
                                  style: texturedInk(textColor, 0.9),
                                  children: openStampData.description,
                                }),
                              }),
                            onSelectContinent && openStampData.continentId && (
                              <button
                                onClick={() => openStampData.continentId && onSelectContinent(openStampData.continentId)}
                                style={{
                                  marginTop: "1.2rem",
                                  background: "var(--gold)",
                                  color: "#050505",
                                  border: "none",
                                  borderRadius: 8,
                                  padding: "0.75rem 1.2rem",
                                  fontSize: "0.88rem",
                                  fontWeight: 800,
                                  fontFamily: "Orbitron, sans-serif",
                                  cursor: "pointer",
                                  width: "100%",
                                  textAlign: "center",
                                  boxShadow: "0 4px 15px rgba(201,162,39,0.4)",
                                }}
                              >
                                SELECT CONTINENT ({openStampData.title?.toUpperCase()}) →
                              </button>
                            ),
                          ],
                        }),
                      },
                      openIndex ?? undefined
                    ),
                  }),
                  _jsxs("div", {
                    style: { flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 22, pointerEvents: "auto" },
                    children: [
                      _jsx("button", {
                        type: "button",
                        "aria-label": "Previous stamp",
                        onClick: () => stepStamp(-1),
                        style: chevButtonStyle,
                        children: _jsx("svg", {
                          width: "16",
                          height: "16",
                          viewBox: "0 0 16 16",
                          fill: "none",
                          "aria-hidden": true,
                          children: _jsx("path", {
                            d: "M10 3L5 8L10 13",
                            stroke: "currentColor",
                            strokeWidth: "1.6",
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                          }),
                        }),
                      }),
                      _jsxs("span", {
                        style: { color: panelColor, opacity: 0.75, fontSize: 15, letterSpacing: "0.08em" },
                        children: [(openIndex ?? 0) + 1, " / ", count],
                      }),
                      _jsx("button", {
                        type: "button",
                        "aria-label": "Next stamp",
                        onClick: () => stepStamp(1),
                        style: chevButtonStyle,
                        children: _jsx("svg", {
                          width: "16",
                          height: "16",
                          viewBox: "0 0 16 16",
                          fill: "none",
                          "aria-hidden": true,
                          children: _jsx("path", {
                            d: "M6 3L11 8L6 13",
                            stroke: "currentColor",
                            strokeWidth: "1.6",
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                          }),
                        }),
                      }),
                    ],
                  }),
                  _jsx("button", {
                    type: "button",
                    "aria-label": "Close stamp detail",
                    onClick: closeStamp,
                    style: {
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
                    },
                    children: _jsx("svg", {
                      width: "18",
                      height: "18",
                      viewBox: "0 0 16 16",
                      fill: "none",
                      "aria-hidden": true,
                      children: _jsx("path", {
                        d: "M4 4L12 12M12 4L4 12",
                        stroke: "currentColor",
                        strokeWidth: "1.6",
                        strokeLinecap: "round",
                      }),
                    }),
                  }),
                ],
              }),
          }),
          document.body
        ),
    ],
  });
}
