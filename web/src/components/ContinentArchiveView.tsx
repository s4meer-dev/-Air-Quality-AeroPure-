"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { 
  Search, 
  Layers, 
  BarChart3, 
  Activity, 
  Leaf, 
  Globe, 
  Target, 
  Plus, 
  X
} from "lucide-react";
import { Continent, COUNTRIES, STATES, CITIES } from "@/lib/locations";
import { GeoLocation } from "@/lib/openweather";

interface HexNode {
  name: string;
  id?: string;
  status: "active" | "coming-soon";
  image?: string;
  isAction?: boolean;
}

interface ContinentConfig {
  id: string;
  name: string;
  index: string;
  coordinates: string;
  totalCountries: number;
  activeCountryIds: string[];
  quote: string;
  editorialTags: string[];
  reliefMap: string;
  wildlifeVisual?: string;
  polaroidPhoto?: string;
  polaroidCaption?: string[];
  rows: HexNode[][];
}

// ── CONTINENT REGISTRY & HEXAGON NETWORK DEFINITIONS ────────────────────────────

const CONTINENT_CONFIGS: Record<string, ContinentConfig> = {
  africa: {
    id: "africa",
    name: "AFRICA",
    index: "01",
    coordinates: "8.7832° N\n34.5085° E",
    totalCountries: 54,
    activeCountryIds: ["egypt", "south-africa"],
    quote: '"A healthier Africa for a brighter world."',
    editorialTags: ["PEOPLE", "LANDSCAPES", "CULTURE", "CLEANER AIR", "BRIGHTER TOMORROWS"],
    reliefMap: "/continents/africa_map_relief.jpg",
    wildlifeVisual: "/continents/africa_wildlife_elephant.jpg",
    polaroidPhoto: "/continents/africa_savannah_card.jpg",
    polaroidCaption: ["AFRICA", "A CLEANER", "TOMORROW"],
    rows: [
      // Row 1 (5 nodes)
      [
        { name: "MOROCCO", status: "coming-soon", image: "/continents/morocco_casablanca.jpg" },
        { name: "ALGERIA", status: "coming-soon" },
        { name: "TUNISIA", status: "coming-soon" },
        { name: "LIBYA", status: "coming-soon" },
        { name: "EGYPT", id: "egypt", status: "active", image: "/continents/egypt_pyramids.jpg" },
      ],
      // Row 2 (6 nodes)
      [
        { name: "MAURITANIA", status: "coming-soon" },
        { name: "MALI", status: "coming-soon" },
        { name: "NIGER", status: "coming-soon" },
        { name: "CHAD", status: "coming-soon" },
        { name: "SUDAN", status: "coming-soon" },
        { name: "ETHIOPIA", status: "coming-soon" },
      ],
      // Row 3 (6 nodes)
      [
        { name: "NIGERIA", status: "coming-soon" },
        { name: "GHANA", status: "coming-soon" },
        { name: "CAMEROON", status: "coming-soon" },
        { name: "DRC", status: "coming-soon" },
        { name: "KENYA", status: "coming-soon" },
        { name: "TANZANIA", status: "coming-soon" },
      ],
      // Row 4 (6 nodes)
      [
        { name: "ANGOLA", status: "coming-soon" },
        { name: "ZAMBIA", status: "coming-soon" },
        { name: "ZIMBABWE", status: "coming-soon" },
        { name: "BOTSWANA", status: "coming-soon" },
        { name: "SOUTH AFRICA", id: "south-africa", status: "active", image: "/continents/table_mountain.jpg" },
        { name: "MORE COUNTRIES", isAction: true, status: "coming-soon" },
      ],
    ],
  },
  asia: {
    id: "asia",
    name: "ASIA",
    index: "02",
    coordinates: "34.0479° N\n100.6197° E",
    totalCountries: 48,
    activeCountryIds: ["india", "japan", "uae", "singapore"],
    quote: '"Atmospheric resilience across historic trade corridors."',
    editorialTags: ["MEGACITIES", "MONSOONS", "INDUSTRY", "CLEAN HORIZONS", "TOMORROW"],
    reliefMap: "/stamps/geo_asia.jpg",
    rows: [
      [
        { name: "SAUDI ARABIA", status: "coming-soon" },
        { name: "UAE", id: "uae", status: "active" },
        { name: "INDIA", id: "india", status: "active" },
        { name: "SINGAPORE", id: "singapore", status: "active" },
        { name: "JAPAN", id: "japan", status: "active" },
      ],
      [
        { name: "TURKEY", status: "coming-soon" },
        { name: "IRAN", status: "coming-soon" },
        { name: "KAZAKHSTAN", status: "coming-soon" },
        { name: "CHINA", status: "coming-soon" },
        { name: "SOUTH KOREA", status: "coming-soon" },
        { name: "VIETNAM", status: "coming-soon" },
      ],
      [
        { name: "PAKISTAN", status: "coming-soon" },
        { name: "BANGLADESH", status: "coming-soon" },
        { name: "THAILAND", status: "coming-soon" },
        { name: "MALAYSIA", status: "coming-soon" },
        { name: "INDONESIA", status: "coming-soon" },
        { name: "PHILIPPINES", status: "coming-soon" },
      ],
      [
        { name: "SRI LANKA", status: "coming-soon" },
        { name: "NEPAL", status: "coming-soon" },
        { name: "QATAR", status: "coming-soon" },
        { name: "TAIWAN", status: "coming-soon" },
        { name: "MORE COUNTRIES", isAction: true, status: "coming-soon" },
      ],
    ],
  },
  europe: {
    id: "europe",
    name: "EUROPE",
    index: "03",
    coordinates: "54.5260° N\n15.2551° E",
    totalCountries: 44,
    activeCountryIds: ["germany", "united-kingdom", "france"],
    quote: '"Pioneering continental standards for atmospheric clarity."',
    editorialTags: ["ALPINE WINDS", "MARITIME", "CORRIDORS", "EMISSION CAPS", "ARCHIVE"],
    reliefMap: "/stamps/geo_europe.jpg",
    rows: [
      [
        { name: "IRELAND", status: "coming-soon" },
        { name: "UNITED KINGDOM", id: "united-kingdom", status: "active" },
        { name: "FRANCE", id: "france", status: "active" },
        { name: "GERMANY", id: "germany", status: "active" },
        { name: "POLAND", status: "coming-soon" },
      ],
      [
        { name: "PORTUGAL", status: "coming-soon" },
        { name: "SPAIN", status: "coming-soon" },
        { name: "ITALY", status: "coming-soon" },
        { name: "SWITZERLAND", status: "coming-soon" },
        { name: "AUSTRIA", status: "coming-soon" },
        { name: "NETHERLANDS", status: "coming-soon" },
      ],
      [
        { name: "NORWAY", status: "coming-soon" },
        { name: "SWEDEN", status: "coming-soon" },
        { name: "FINLAND", status: "coming-soon" },
        { name: "DENMARK", status: "coming-soon" },
        { name: "BELGIUM", status: "coming-soon" },
        { name: "CZECHIA", status: "coming-soon" },
      ],
      [
        { name: "GREECE", status: "coming-soon" },
        { name: "ROMANIA", status: "coming-soon" },
        { name: "HUNGARY", status: "coming-soon" },
        { name: "MORE COUNTRIES", isAction: true, status: "coming-soon" },
      ],
    ],
  },
  "north-america": {
    id: "north-america",
    name: "NORTH AMERICA",
    index: "04",
    coordinates: "54.5260° N\n105.2551° W",
    totalCountries: 23,
    activeCountryIds: ["united-states", "canada"],
    quote: '"Jet-stream tracking from arctic borders to gulf shores."',
    editorialTags: ["PACIFIC BASINS", "BOREAL", "GREAT PLAINS", "JET STREAM", "RESEARCH"],
    reliefMap: "/stamps/geo_north-america.jpg",
    rows: [
      [
        { name: "CANADA", id: "canada", status: "active" },
        { name: "UNITED STATES", id: "united-states", status: "active" },
        { name: "MEXICO", status: "coming-soon" },
      ],
      [
        { name: "GUATEMALA", status: "coming-soon" },
        { name: "CUBA", status: "coming-soon" },
        { name: "PANAMA", status: "coming-soon" },
        { name: "COSTA RICA", status: "coming-soon" },
      ],
      [
        { name: "JAMAICA", status: "coming-soon" },
        { name: "HONDURAS", status: "coming-soon" },
        { name: "DOMINICAN REP", status: "coming-soon" },
        { name: "MORE COUNTRIES", isAction: true, status: "coming-soon" },
      ],
    ],
  },
  "south-america": {
    id: "south-america",
    name: "SOUTH AMERICA",
    index: "05",
    coordinates: "8.7832° S\n55.4915° W",
    totalCountries: 12,
    activeCountryIds: ["brazil"],
    quote: '"Protecting planetary respiration across the Amazon basin."',
    editorialTags: ["AMAZON BASIN", "ANDEAN HEIGHTS", "OXYGEN SINKS", "PURITY", "ARCHIVE"],
    reliefMap: "/stamps/geo_south-america.jpg",
    rows: [
      [
        { name: "COLOMBIA", status: "coming-soon" },
        { name: "BRAZIL", id: "brazil", status: "active" },
        { name: "ARGENTINA", status: "coming-soon" },
      ],
      [
        { name: "CHILE", status: "coming-soon" },
        { name: "PERU", status: "coming-soon" },
        { name: "ECUADOR", status: "coming-soon" },
        { name: "URUGUAY", status: "coming-soon" },
      ],
      [
        { name: "VENEZUELA", status: "coming-soon" },
        { name: "PARAGUAY", status: "coming-soon" },
        { name: "BOLIVIA", status: "coming-soon" },
        { name: "MORE COUNTRIES", isAction: true, status: "coming-soon" },
      ],
    ],
  },
  oceania: {
    id: "oceania",
    name: "OCEANIA",
    index: "06",
    coordinates: "22.7359° S\n140.0188° E",
    totalCountries: 14,
    activeCountryIds: ["australia"],
    quote: '"Uninterrupted maritime baseline over the Southern Ocean."',
    editorialTags: ["MARITIME", "REEF BASINS", "WESTERLIES", "CLEAN SEAS", "ISLAND NET"],
    reliefMap: "/stamps/geo_oceania.jpg",
    rows: [
      [
        { name: "AUSTRALIA", id: "australia", status: "active" },
        { name: "NEW ZEALAND", status: "coming-soon" },
        { name: "FIJI", status: "coming-soon" },
      ],
      [
        { name: "PAPUA NEW GUINEA", status: "coming-soon" },
        { name: "SOLOMON ISLANDS", status: "coming-soon" },
        { name: "SAMOA", status: "coming-soon" },
      ],
    ],
  },
  antarctica: {
    id: "antarctica",
    name: "ANTARCTICA",
    index: "07",
    coordinates: "82.8628° S\n135.0000° E",
    totalCountries: 1,
    activeCountryIds: ["antarctica-terr"],
    quote: '"The absolute global zero baseline for atmospheric chemistry."',
    editorialTags: ["CRYOSPHERE", "ZERO BASELINE", "POLAR VORTEX", "PRISTINE", "ARCHIVE"],
    reliefMap: "/stamps/geo_antarctica.jpg",
    rows: [
      [
        { name: "ANTARCTICA RES.", id: "antarctica-terr", status: "active" },
        { name: "VOSTOK STATION", status: "coming-soon" },
        { name: "MCMURDO BASE", status: "coming-soon" },
      ],
    ],
  },
};

interface ContinentArchiveViewProps {
  continent: Continent;
  onSelectCountry: (countryId: string) => void;
  onBackToEarth: () => void;
  onSelectLiveLocation: (loc: GeoLocation) => void;
}

export default function ContinentArchiveView({
  continent,
  onSelectCountry,
  onBackToEarth,
  onSelectLiveLocation,
}: ContinentArchiveViewProps) {
  // Config selection with robust fallback
  const config = useMemo(() => {
    return (
      CONTINENT_CONFIGS[continent.id] || {
        id: continent.id,
        name: continent.name.toUpperCase(),
        index: "01",
        coordinates: `${Math.abs(continent.lat).toFixed(4)}° ${continent.lat >= 0 ? "N" : "S"}\n${Math.abs(continent.lon).toFixed(4)}° ${continent.lon >= 0 ? "E" : "W"}`,
        totalCountries: continent.countryCount || 54,
        activeCountryIds: COUNTRIES.filter((c) => c.continentId === continent.id).map((c) => c.id),
        quote: `"Atmospheric research across ${continent.name}."`,
        editorialTags: ["ATMOSPHERE", "TERRAIN", "COMMUNITIES", "CLEAN AIR", "INTELLIGENCE"],
        reliefMap: "/continents/africa_map_relief.jpg",
        rows: [
          COUNTRIES.filter((c) => c.continentId === continent.id).map((c) => ({
            name: c.name.toUpperCase(),
            id: c.id,
            status: "active" as const,
          })),
        ],
      }
    );
  }, [continent]);

  // Actual active countries in this continent from application data
  const realActiveCountries = useMemo(() => {
    return COUNTRIES.filter((c) => c.continentId === continent.id);
  }, [continent.id]);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Synchronously compute local matches with useMemo
  const localMatches = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (q.length < 2) return [];

    const matches: { type: string; title: string; subtitle: string; action: () => void }[] = [];

    COUNTRIES.forEach((c) => {
      if (c.name.toLowerCase().includes(q)) {
        matches.push({
          type: "COUNTRY",
          title: c.name,
          subtitle: `Continent: ${c.continentId.toUpperCase()} • Code: ${c.code}`,
          action: () => onSelectCountry(c.id),
        });
      }
    });

    STATES.forEach((s) => {
      if (s.name.toLowerCase().includes(q)) {
        matches.push({
          type: "REGION",
          title: s.name,
          subtitle: `Country ID: ${s.countryId.toUpperCase()} • Code: ${s.code}`,
          action: () => onSelectCountry(s.countryId),
        });
      }
    });

    CITIES.forEach((ci) => {
      if (ci.name.toLowerCase().includes(q)) {
        matches.push({
          type: "CITY",
          title: ci.name,
          subtitle: `${ci.country} • Lat: ${ci.lat.toFixed(2)}, Lon: ${ci.lon.toFixed(2)}`,
          action: () => onSelectCountry(ci.countryId),
        });
      }
    });

    return matches.slice(0, 5);
  }, [searchQuery, onSelectCountry]);

  // 2. Debounced query for live telemetry
  const [liveMatches, setLiveMatches] = useState<GeoLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [moreModalOpen, setMoreModalOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (q.length < 2) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?live=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!cancelled && data.liveLocations && Array.isArray(data.liveLocations)) {
          setLiveMatches(data.liveLocations.slice(0, 5));
        }
      } catch (err) {
        console.error("Live search failed:", err);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const displayedLiveMatches = searchQuery.trim().length >= 2 ? liveMatches : [];

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalActive = realActiveCountries.length;

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#070707",
        color: "#F2F2F0",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* ── RESPONSIVE COMPOSITION STYLES ── */}
      <style>{`
        .continent-stage {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem 2rem 3rem 2rem;
          z-index: 5;
          min-height: 640px;
        }

        .continent-left-col {
          position: absolute;
          left: 3.5rem;
          top: 2rem;
          width: 340px;
          z-index: 10;
          display: flex;
          flex-direction: column;
          pointer-events: auto;
        }

        .continent-title {
          font-family: 'Orbitron', -apple-system, sans-serif;
          font-size: clamp(3.2rem, 4.5vw, 4.8rem);
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #F2F2F0;
          line-height: 0.95;
          margin: 0 0 0.85rem 0;
          text-shadow: 0 2px 25px rgba(0, 0, 0, 0.9);
          background: linear-gradient(180deg, #FFFFFF 20%, #B8B8B5 75%, #6D6D6A 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .continent-wildlife-elem {
          position: absolute;
          left: -10px;
          bottom: 0px;
          width: 360px;
          height: 340px;
          pointer-events: none;
          z-index: 8;
          opacity: 0.85;
          mask-image: linear-gradient(to top, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%), linear-gradient(to right, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%);
          -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%), linear-gradient(to right, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%);
        }

        .continent-right-col {
          position: absolute;
          right: 3.5rem;
          top: 4.5rem;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          text-align: right;
          pointer-events: auto;
        }

        .hex-item {
          width: 116px;
          height: 130px;
          position: relative;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .hex-row {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: -26px;
        }
        .hex-row:first-child {
          margin-top: 0;
        }

        /* ── 1440x900 & 1366x768 OPTIMIZATIONS ── */
        @media (max-width: 1480px) {
          .continent-left-col {
            left: 2.2rem;
            width: 290px;
            top: 1.5rem;
          }
          .continent-title {
            font-size: clamp(2.8rem, 3.8vw, 3.8rem);
          }
          .continent-right-col {
            right: 2.2rem;
            top: 3.5rem;
          }
          .hex-item {
            width: 104px;
            height: 116px;
          }
          .hex-row {
            gap: 6px;
            margin-top: -22px;
          }
          .continent-wildlife-elem {
            width: 280px;
            height: 280px;
            opacity: 0.65;
          }
        }

        @media (max-width: 1220px) {
          .continent-left-col {
            left: 1.5rem;
            width: 250px;
          }
          .continent-right-col {
            right: 1.5rem;
          }
          .hex-item {
            width: 92px;
            height: 104px;
          }
          .hex-row {
            gap: 5px;
            margin-top: -19px;
          }
          .continent-wildlife-elem {
            display: none;
          }
        }

        /* ── MOBILE REFLOW SPECIFICATION (<= 860px) ── */
        @media (max-width: 860px) {
          .continent-stage {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding: 1.5rem 1rem 3rem 1rem;
            min-height: auto;
          }
          .continent-left-col {
            position: relative;
            left: auto;
            top: auto;
            width: 100%;
            max-width: 480px;
            text-align: center;
            align-items: center;
            margin-bottom: 2rem;
          }
          .continent-right-col {
            position: relative;
            right: auto;
            top: auto;
            width: 100%;
            max-width: 480px;
            align-items: center;
            text-align: center;
            margin-top: 2rem;
          }
          .hex-item {
            width: 78px;
            height: 88px;
          }
          .hex-row {
            gap: 4px;
            margin-top: -15px;
          }
          .hidden-mobile {
            display: none !important;
          }
        }
      `}</style>

      {/* ── SUBTLE FILM GRAIN NOISE & VIGNETTE OVERLAYS ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          backgroundImage:
            "radial-gradient(ellipse at 50% 50%, rgba(17, 17, 17, 0) 0%, rgba(7, 7, 7, 0.75) 85%, rgba(0, 0, 0, 0.95) 100%)",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          opacity: 0.035,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── TOP NAVIGATION BAR (MATCHING APPROVED REFERENCE) ── */}
      <header
        style={{
          position: "relative",
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.2rem 3rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          backgroundColor: "rgba(7, 7, 7, 0.9)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Brand Left */}
        <div
          onClick={onBackToEarth}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
            cursor: "pointer",
          }}
        >
          <svg width="22" height="20" viewBox="0 0 24 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0L24 22H18.5L12 9.5L5.5 22H0L12 0Z" fill="#F2F2F0" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: "1.05rem",
                fontWeight: 900,
                letterSpacing: "0.18em",
                color: "#F2F2F0",
                lineHeight: 1,
              }}
            >
              AEROPURE
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.58rem",
                letterSpacing: "0.22em",
                color: "#929292",
                marginTop: "3px",
              }}
            >
              ATMOSPHERIC RESEARCH
            </span>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.75rem",
          }}
          className="hidden-mobile"
        >
          <div
            style={{
              padding: "0.4rem 0.9rem",
              border: "1px solid #6D6D6A",
              borderRadius: "2px",
              fontSize: "0.68rem",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              letterSpacing: "0.16em",
              color: "#F2F2F0",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
            }}
          >
            GEOSPATIAL INDEX
          </div>
          {["ATMOSPHERE", "INTELLIGENCE", "INSTRUMENTATION", "ARCHIVE"].map((item) => (
            <span
              key={item}
              style={{
                fontSize: "0.68rem",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 500,
                letterSpacing: "0.14em",
                color: "#929292",
                cursor: "pointer",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#F2F2F0")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#929292")}
            >
              {item}
            </span>
          ))}
        </nav>

        {/* Right CTA / Motto */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
          }}
        >
          <Search size={15} color="#929292" style={{ cursor: "pointer" }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.68rem",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.15em",
              color: "#B8B8B5",
            }}
          >
            <span>A CLEANER TOMORROW</span>
            <span style={{ color: "#6D6D6A" }}>—</span>
          </div>
        </div>
      </header>

      {/* ── BREADCRUMB & COMPACT SEARCH BAR SUB-HEADER ── */}
      <div
        style={{
          position: "relative",
          zIndex: 15,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 3.5rem 0.5rem 3.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        {/* Breadcrumb Left */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.72rem",
            letterSpacing: "0.18em",
            color: "#929292",
          }}
        >
          <span
            onClick={onBackToEarth}
            style={{
              cursor: "pointer",
              color: "#929292",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#F2F2F0")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#929292")}
          >
            EARTH
          </span>
          <span style={{ color: "#41413F" }}>/</span>
          <span style={{ color: "#F2F2F0", fontWeight: 700 }}>{config.name}</span>
        </div>

        {/* Compact Search Bar Right */}
        <div
          ref={searchContainerRef}
          style={{
            position: "relative",
            width: "360px",
            maxWidth: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              backgroundColor: "rgba(17, 17, 17, 0.8)",
              border: "1px solid #333331",
              borderRadius: "2px",
              padding: "0.6rem 1rem",
              backdropFilter: "blur(10px)",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            <Search size={14} color="#6D6D6A" />
            <input
              type="text"
              placeholder="Search country, city, or region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#F2F2F0",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.72rem",
                letterSpacing: "0.05em",
              }}
            />
            {searchQuery && (
              <X
                size={13}
                color="#6D6D6A"
                style={{ cursor: "pointer" }}
                onClick={() => setSearchQuery("")}
              />
            )}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "0.35rem",
              fontSize: "0.58rem",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.2em",
              color: "#6D6D6A",
            }}
          >
            EXPLORE · ANALYZE · ACT
          </div>

          {/* Live Search Floating Results Dropdown */}
          {(localMatches.length > 0 || displayedLiveMatches.length > 0 || isSearching) && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                width: "100%",
                marginTop: "0.4rem",
                backgroundColor: "#111111",
                border: "1px solid #41413F",
                borderRadius: "2px",
                zIndex: 100,
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.8)",
                maxHeight: "360px",
                overflowY: "auto",
              }}
            >
              {isSearching && (
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    fontSize: "0.68rem",
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "#929292",
                    borderBottom: "1px solid #242423",
                  }}
                >
                  QUERYING TELEMETRY STREAMS...
                </div>
              )}

              {/* Local Index Hits */}
              {localMatches.map((item, idx) => (
                <div
                  key={`local-${idx}`}
                  onClick={() => {
                    item.action();
                    setSearchQuery("");
                  }}
                  style={{
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid #242423",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#242423")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
                >
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#F2F2F0" }}>{item.title}</div>
                    <div style={{ fontSize: "0.62rem", color: "#929292", fontFamily: "'JetBrains Mono', monospace" }}>
                      {item.subtitle}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.55rem",
                      fontFamily: "'JetBrains Mono', monospace",
                      border: "1px solid #41413F",
                      padding: "0.2rem 0.4rem",
                      borderRadius: "2px",
                      color: "#B8B8B5",
                    }}
                  >
                    {item.type}
                  </span>
                </div>
              ))}

              {/* Global Live OpenWeather Telemetry Hits */}
              {displayedLiveMatches.map((loc, idx) => (
                <div
                  key={`live-${idx}`}
                  onClick={() => {
                    onSelectLiveLocation(loc);
                    setSearchQuery("");
                  }}
                  style={{
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid #242423",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#242423")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
                >
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#F2F2F0" }}>
                      {loc.name}
                      {loc.state ? `, ${loc.state}` : ""}
                    </div>
                    <div style={{ fontSize: "0.62rem", color: "#929292", fontFamily: "'JetBrains Mono', monospace" }}>
                      {loc.country} • Lat: {loc.lat.toFixed(2)}, Lon: {loc.lon.toFixed(2)}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.55rem",
                      fontFamily: "'JetBrains Mono', monospace",
                      border: "1px solid #6D6D6A",
                      padding: "0.2rem 0.4rem",
                      borderRadius: "2px",
                      color: "#F2F2F0",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    LIVE
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CONTINENTAL STAGE ── */}
      <div className="continent-stage">
        {/* 1. CENTRAL TOPOGRAPHIC RELIEF MAP BACKGROUND ANCHOR */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "54%",
            transform: "translate(-50%, -52%)",
            width: "820px",
            maxWidth: "90vw",
            height: "720px",
            pointerEvents: "none",
            zIndex: 1,
            opacity: 0.38,
            maskImage:
              "radial-gradient(ellipse 65% 65% at 50% 50%, rgba(0, 0, 0, 1) 35%, rgba(0, 0, 0, 0.6) 65%, rgba(0, 0, 0, 0) 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 65% 65% at 50% 50%, rgba(0, 0, 0, 1) 35%, rgba(0, 0, 0, 0.6) 65%, rgba(0, 0, 0, 0) 100%)",
          }}
        >
          <Image
            src={config.reliefMap}
            alt={`${config.name} Relief Archive`}
            fill
            style={{
              objectFit: "contain",
              filter: "grayscale(100%) contrast(140%) brightness(85%)",
            }}
            priority
          />
        </div>

        {/* 2. LEFT EDITORIAL IDENTITY COLUMN */}
        <div className="continent-left-col">
          {/* Index 01 & Editorial Tags */}
          <div style={{ marginBottom: "2rem" }}>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#6D6D6A",
                display: "block",
                marginBottom: "0.6rem",
              }}
            >
              {config.index}
            </span>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.58rem",
                letterSpacing: "0.22em",
                color: "#6D6D6A",
                lineHeight: 1.6,
              }}
            >
              {config.editorialTags.map((tag, i) => (
                <div key={i}>{tag}</div>
              ))}
              <div style={{ marginTop: "0.4rem", color: "#41413F" }}>————</div>
            </div>
          </div>

          {/* Continent Title */}
          <h1 className="continent-title">{config.name}</h1>

          {/* Subtitle */}
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.24em",
              color: "#B8B8B5",
              marginBottom: "1.2rem",
            }}
          >
            CONTINENTAL AIR ARCHIVE
          </div>

          {/* Short Restrained Description */}
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.78rem",
              lineHeight: 1.65,
              color: "#929292",
              maxWidth: "320px",
              marginBottom: "2rem",
            }}
          >
            Explore atmospheric intelligence across the continent, from country-level conditions to local air forecasts.
          </p>

          {/* Crosshairs Reticle & Continent Motto */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginTop: "0.2rem",
            }}
          >
            <div
              style={{
                width: "30px",
                height: "30px",
                minWidth: "30px",
                borderRadius: "50%",
                border: "1px solid #41413F",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Target size={14} color="#929292" />
            </div>
            <span
              style={{
                fontFamily: "Georgia, serif",
                fontStyle: "italic",
                fontSize: "0.85rem",
                color: "#B8B8B5",
                lineHeight: 1.4,
              }}
            >
              {config.quote}
            </span>
          </div>
        </div>

        {/* 3. LOWER-LEFT ATMOSPHERIC WILDLIFE / SAVANNAH ELEMENT */}
        {config.wildlifeVisual && (
          <div className="continent-wildlife-elem">
            <Image
              src={config.wildlifeVisual}
              alt={`${config.name} Atmospheric Visual`}
              fill
              style={{
                objectFit: "contain",
                objectPosition: "bottom left",
                filter: "grayscale(100%) contrast(125%) brightness(90%)",
              }}
            />
          </div>
        )}

        {/* 4. RIGHT ARCHIVAL MARGIN CONTENT & POLAROID CARD */}
        <div className="continent-right-col">
          {/* Vertical Editorial Markers */}
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.62rem",
              letterSpacing: "0.22em",
              color: "#6D6D6A",
              lineHeight: 1.8,
              marginBottom: "1.2rem",
            }}
          >
            <div>DIVERSE</div>
            <div>LANDS</div>
            <div style={{ height: "0.4rem" }} />
            <div>VITAL AIR</div>
            <div style={{ height: "0.4rem" }} />
            <div>RESILIENT</div>
            <div>PEOPLE</div>
            <div style={{ marginTop: "0.4rem", color: "#41413F" }}>————</div>
          </div>

          {/* Coordinates */}
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.72rem",
              letterSpacing: "0.14em",
              color: "#929292",
              lineHeight: 1.5,
              marginBottom: "2.5rem",
            }}
          >
            {config.coordinates.split("\n").map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>

          {/* Archival Polaroid / Map Card */}
          {config.polaroidPhoto && (
            <div
              style={{
                position: "relative",
                width: "175px",
                maxWidth: "100%",
                backgroundColor: "#E8E8E6",
                padding: "8px 8px 14px 8px",
                boxShadow: "0 12px 35px rgba(0, 0, 0, 0.9)",
                transform: "rotate(3.5deg)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "rotate(1deg) scale(1.04)";
                e.currentTarget.style.boxShadow = "0 16px 45px rgba(0, 0, 0, 1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "rotate(3.5deg) scale(1)";
                e.currentTarget.style.boxShadow = "0 12px 35px rgba(0, 0, 0, 0.9)";
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "135px",
                  overflow: "hidden",
                  backgroundColor: "#070707",
                }}
              >
                <Image
                  src={config.polaroidPhoto}
                  alt="Archival Polaroid"
                  fill
                  style={{
                    objectFit: "cover",
                    filter: "grayscale(100%) contrast(115%)",
                  }}
                />
              </div>
              <div
                style={{
                  paddingTop: "9px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.52rem",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  color: "#242423",
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
              >
                {config.polaroidCaption?.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. THE CENTERPIECE: SYMMETRICAL INTERLOCKING COUNTRY HONEYCOMB NETWORK */}
        <div
          style={{
            position: "relative",
            zIndex: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "1rem",
          }}
        >
          {config.rows.map((row, rowIdx) => (
            <div key={`hex-row-${rowIdx}`} className="hex-row">
              {row.map((node, nodeIdx) => {
                const isActive = node.status === "active";
                const isAction = node.isAction;

                return (
                  <div
                    key={`hex-${rowIdx}-${nodeIdx}`}
                    className="hex-item"
                    onClick={() => {
                      if (isActive && node.id) {
                        onSelectCountry(node.id);
                      } else if (isAction) {
                        setMoreModalOpen(true);
                      }
                    }}
                    style={{
                      cursor: isActive || isAction ? "pointer" : "default",
                      filter: isActive
                        ? "drop-shadow(0 4px 14px rgba(0, 0, 0, 0.8))"
                        : "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6))",
                    }}
                    onMouseEnter={(e) => {
                      if (isActive || isAction) {
                        e.currentTarget.style.transform = "scale(1.08) translateY(-3px)";
                        e.currentTarget.style.zIndex = "25";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isActive || isAction) {
                        e.currentTarget.style.transform = "scale(1) translateY(0)";
                        e.currentTarget.style.zIndex = "12";
                      }
                    }}
                  >
                    {/* Outer Hexagon Border Shell */}
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: isActive ? "#929292" : isAction ? "#41413F" : "#242423",
                        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                        padding: isActive ? "1.5px" : "1px",
                        boxSizing: "border-box",
                        transition: "background-color 0.2s ease",
                      }}
                    >
                      {/* Inner Hexagon Container */}
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          backgroundColor: "#111111",
                          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                          position: "relative",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        {/* Photographic Background if provided (e.g. Pyramids / Table Mountain) */}
                        {node.image && (
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              zIndex: 1,
                            }}
                          >
                            <Image
                              src={node.image}
                              alt={node.name}
                              fill
                              style={{
                                objectFit: "cover",
                                filter: "grayscale(100%) contrast(130%) brightness(75%)",
                              }}
                            />
                            {/* Dark Gradient Overlay for razor-sharp typography */}
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                background:
                                  "linear-gradient(to top, rgba(7, 7, 7, 0.92) 20%, rgba(17, 17, 17, 0.5) 70%, rgba(7, 7, 7, 0.8) 100%)",
                              }}
                            />
                          </div>
                        )}

                        {/* Node Content */}
                        <div
                          style={{
                            position: "relative",
                            zIndex: 2,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            padding: "0 6px",
                            width: "100%",
                          }}
                        >
                          {isAction ? (
                            <>
                              <Plus size={15} color="#B8B8B5" style={{ marginBottom: "3px" }} />
                              <span
                                style={{
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontSize: "0.56rem",
                                  fontWeight: 700,
                                  letterSpacing: "0.08em",
                                  color: "#F2F2F0",
                                  lineHeight: 1.2,
                                }}
                              >
                                MORE
                                <br />
                                COUNTRIES
                              </span>
                            </>
                          ) : (
                            <>
                              <span
                                style={{
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontSize: node.name.length > 10 ? "0.54rem" : "0.62rem",
                                  fontWeight: 800,
                                  letterSpacing: "0.05em",
                                  color: isActive ? "#FFFFFF" : "#B8B8B5",
                                  lineHeight: 1.2,
                                  textShadow: isActive ? "0 2px 8px rgba(0, 0, 0, 1)" : "none",
                                  marginBottom: "3px",
                                }}
                              >
                                {node.name}
                              </span>
                              <span
                                style={{
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontSize: "0.46rem",
                                  fontWeight: 600,
                                  letterSpacing: "0.14em",
                                  color: isActive ? "#F2F2F0" : "#6D6D6A",
                                  backgroundColor: isActive ? "rgba(255, 255, 255, 0.15)" : "transparent",
                                  padding: isActive ? "1px 5px" : "0",
                                  borderRadius: "1px",
                                  border: isActive ? "1px solid rgba(255, 255, 255, 0.3)" : "none",
                                }}
                              >
                                {isActive ? "ACTIVE" : "COMING SOON"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── MODAL: ALL CONTINENTAL COUNTRIES DIRECTORY ── */}
      {moreModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
          onClick={() => setMoreModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#111111",
              border: "1px solid #41413F",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "80vh",
              overflowY: "auto",
              padding: "2rem",
              borderRadius: "2px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
                borderBottom: "1px solid #242423",
                paddingBottom: "1rem",
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: "Orbitron, sans-serif",
                    fontSize: "1.2rem",
                    letterSpacing: "0.1em",
                    color: "#F2F2F0",
                    margin: 0,
                  }}
                >
                  {config.name} — REGIONAL DIRECTORY
                </h3>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.68rem",
                    color: "#929292",
                  }}
                >
                  {totalActive} Active / {config.totalCountries} Continental Entities
                </span>
              </div>
              <X
                size={20}
                color="#929292"
                style={{ cursor: "pointer" }}
                onClick={() => setMoreModalOpen(false)}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "1rem",
              }}
            >
              {COUNTRIES.filter((c) => c.continentId === continent.id).map((ctry) => (
                <div
                  key={ctry.id}
                  onClick={() => {
                    setMoreModalOpen(false);
                    onSelectCountry(ctry.id);
                  }}
                  style={{
                    padding: "1rem",
                    backgroundColor: "#1c1c1b",
                    border: "1px solid #6D6D6A",
                    borderRadius: "2px",
                    cursor: "pointer",
                    transition: "transform 0.15s ease, background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#242423";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#1c1c1b";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#FFFFFF" }}>{ctry.name}</div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "0.5rem",
                      fontSize: "0.6rem",
                      fontFamily: "'JetBrains Mono', monospace",
                      color: "#B8B8B5",
                    }}
                  >
                    <span>{ctry.stateCount} Regions</span>
                    <span style={{ color: "#F2F2F0", fontWeight: 700 }}>ACTIVE</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM INFORMATION & TELEMETRY STRIP (MATCHING APPROVED REFERENCE) ── */}
      <footer
        style={{
          position: "relative",
          zIndex: 20,
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          backgroundColor: "#070707",
          padding: "1.2rem 3.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1.5rem",
        }}
      >
        {/* Leftmost Global Counter */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.9rem",
          }}
        >
          <Globe size={22} color="#929292" />
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.64rem",
              letterSpacing: "0.14em",
              color: "#929292",
              lineHeight: 1.4,
            }}
          >
            <div>{config.totalCountries} COUNTRIES</div>
            <div style={{ color: "#6D6D6A" }}>1 SHARED ATMOSPHERE</div>
          </div>
        </div>

        {/* Center 4 Telemetry Blocks */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "3rem",
            flexWrap: "wrap",
          }}
          className="hidden-mobile"
        >
          {/* Block 1: Countries Active */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <Layers size={18} color="#929292" />
            <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <div style={{ fontSize: "0.58rem", letterSpacing: "0.18em", color: "#6D6D6A" }}>COUNTRIES</div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: "#F2F2F0" }}>
                {String(totalActive).padStart(2, "0")} ACTIVE / {config.totalCountries} TOTAL
              </div>
            </div>
          </div>

          {/* Block 2: Geospatial Index */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <BarChart3 size={18} color="#929292" />
            <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <div style={{ fontSize: "0.58rem", letterSpacing: "0.18em", color: "#6D6D6A" }}>GEOSPATIAL INDEX</div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: "#F2F2F0" }}>
                CONTINENTAL
              </div>
            </div>
          </div>

          {/* Block 3: Air Intelligence */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <Activity size={18} color="#929292" />
            <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <div style={{ fontSize: "0.58rem", letterSpacing: "0.18em", color: "#6D6D6A" }}>AIR INTELLIGENCE</div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: "#F2F2F0" }}>
                LIVE TELEMETRY
              </div>
            </div>
          </div>

          {/* Block 4: Our Mission */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <Leaf size={18} color="#929292" />
            <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <div style={{ fontSize: "0.58rem", letterSpacing: "0.18em", color: "#6D6D6A" }}>OUR MISSION</div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: "#F2F2F0" }}>
                CLEANER AIR / BRIGHTER TOMORROWS
              </div>
            </div>
          </div>
        </div>

        {/* Rightmost Copyright */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.64rem",
            letterSpacing: "0.18em",
            color: "#6D6D6A",
          }}
        >
          AEROPURE © 2026
        </div>
      </footer>
    </div>
  );
}
