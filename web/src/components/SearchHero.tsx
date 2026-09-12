"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Loader2, AlertTriangle } from "lucide-react";
import type { City, Area } from "@/lib/locations";
import { POPULAR_SEARCHES } from "@/lib/locations";

export default function SearchHero() {
  const router = useRouter();

  const [cityQuery, setCityQuery] = useState("");
  const [areaQuery, setAreaQuery] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<City[]>([]);
  const [areaSuggestions, setAreaSuggestions] = useState<Area[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCitySugg, setShowCitySugg] = useState(false);
  const [showAreaSugg, setShowAreaSugg] = useState(false);

  const cityRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  // City search
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!cityQuery.trim()) { setCitySuggestions([]); return; }
      const res = await fetch(`/api/search?city=${encodeURIComponent(cityQuery)}`);
      const data = await res.json();
      setCitySuggestions(data.cities ?? []);
      setShowCitySugg(true);
    }, 200);
    return () => clearTimeout(t);
  }, [cityQuery]);

  // Area search
  useEffect(() => {
    if (!selectedCity) return;
    const t = setTimeout(async () => {
      const res = await fetch(
        `/api/search?citySlug=${selectedCity.slug}&area=${encodeURIComponent(areaQuery)}`
      );
      const data = await res.json();
      setAreaSuggestions(data.areas ?? []);
      setShowAreaSugg(true);
    }, 200);
    return () => clearTimeout(t);
  }, [areaQuery, selectedCity]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (cityRef.current && !cityRef.current.contains(e.target as Node))
        setShowCitySugg(false);
      if (areaRef.current && !areaRef.current.contains(e.target as Node))
        setShowAreaSugg(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function selectCity(city: City) {
    setSelectedCity(city);
    setCityQuery(city.name);
    setShowCitySugg(false);
    setSelectedArea(null);
    setAreaQuery("");
    setError("");
  }

  function selectArea(area: Area) {
    setSelectedArea(area);
    setAreaQuery(area.name);
    setShowAreaSugg(false);
    setError("");
  }

  async function handleCheck() {
    if (!selectedCity) { setError("Please select a city from the suggestions."); return; }
    if (!selectedArea) { setError("Please select an area from the suggestions."); return; }
    setLoading(true);
    setError("");
    router.push(`/city/${selectedCity.slug}/${selectedArea.slug}`);
  }

  function quickSearch(city: City, area: Area) {
    selectCity(city);
    selectArea(area);
    router.push(`/city/${city.slug}/${area.slug}`);
  }

  return (
    <div style={{ width: "100%", maxWidth: 640, margin: "0 auto" }}>
      {/* City input */}
      <div ref={cityRef} style={{ position: "relative", marginBottom: "1rem" }}>
        <p className="section-label">CITY INDEX</p>
        <div style={{ position: "relative" }}>
          <MapPin
            size={16}
            color="var(--silver)"
            style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          />
          <input
            className="input-dark"
            style={{ paddingLeft: "2.6rem" }}
            type="text"
            placeholder="e.g. Hyderabad, Delhi, Mumbai..."
            value={cityQuery}
            onChange={(e) => {
              setCityQuery(e.target.value);
              setSelectedCity(null);
              setSelectedArea(null);
            }}
            onFocus={() => cityQuery && setShowCitySugg(true)}
            autoComplete="off"
          />
        </div>
        {showCitySugg && citySuggestions.length > 0 && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
            background: "#111111", border: "1px solid var(--border-strong)",
            borderRadius: 3, marginTop: 4, overflow: "hidden",
            boxShadow: "0 12px 40px rgba(0,0,0,0.8)",
          }}>
            {citySuggestions.map((city) => (
              <button
                key={city.slug}
                onClick={() => selectCity(city)}
                style={{
                  width: "100%", textAlign: "left", padding: "0.85rem 1.1rem",
                  background: "transparent", border: "none", cursor: "pointer",
                  color: "var(--air-white)", fontSize: "0.88rem",
                  fontFamily: "JetBrains Mono, monospace",
                  borderBottom: "1px solid var(--border-default)", display: "flex",
                  alignItems: "center", gap: "0.6rem",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                <MapPin size={13} color="var(--silver)" />
                <span>{city.name}</span>
                <span style={{ color: "var(--steel)", fontSize: "0.74rem", marginLeft: "auto" }}>
                  {city.country}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Area input */}
      <div ref={areaRef} style={{ position: "relative", marginBottom: "1.5rem" }}>
        <p className="section-label">LOCALITY / SENSOR ZONE</p>
        <div style={{ position: "relative" }}>
          <Search
            size={16}
            color={selectedCity ? "var(--silver)" : "var(--steel)"}
            style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          />
          <input
            className="input-dark"
            style={{ paddingLeft: "2.6rem", opacity: selectedCity ? 1 : 0.45 }}
            type="text"
            placeholder={selectedCity ? `Search areas in ${selectedCity.name}...` : "Select a city first"}
            disabled={!selectedCity}
            value={areaQuery}
            onChange={(e) => {
              setAreaQuery(e.target.value);
              setSelectedArea(null);
            }}
            onFocus={() => selectedCity && setShowAreaSugg(true)}
            autoComplete="off"
          />
        </div>
        {showAreaSugg && areaSuggestions.length > 0 && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
            background: "#111111", border: "1px solid var(--border-strong)",
            borderRadius: 3, marginTop: 4, overflow: "hidden",
            boxShadow: "0 12px 40px rgba(0,0,0,0.8)",
          }}>
            {areaSuggestions.map((area) => (
              <button
                key={area.slug}
                onClick={() => selectArea(area)}
                style={{
                  width: "100%", textAlign: "left", padding: "0.85rem 1.1rem",
                  background: "transparent", border: "none", cursor: "pointer",
                  color: "var(--air-white)", fontSize: "0.88rem",
                  fontFamily: "JetBrains Mono, monospace",
                  borderBottom: "1px solid var(--border-default)", display: "flex",
                  alignItems: "center", gap: "0.6rem",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                <Search size={13} color="var(--silver)" />
                {area.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-strong)",
          borderRadius: 3, padding: "0.75rem 1rem", marginBottom: "1rem",
          color: "var(--air-white)", fontSize: "0.82rem",
          fontFamily: "JetBrains Mono, monospace",
        }}>
          <AlertTriangle size={15} color="var(--air-white)" />
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        className="btn-primary-mono"
        style={{ width: "100%", justifyContent: "center", fontSize: "0.88rem", padding: "0.9rem" }}
        onClick={handleCheck}
        disabled={loading}
      >
        {loading ? (
          <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> QUERYING ATMOSPHERE...</>
        ) : (
          <><Search size={16} /> INSPECT LOCAL ATMOSPHERE</>
        )}
      </button>

      {/* Popular searches */}
      <div style={{ marginTop: "2.5rem" }}>
        <p className="section-label" style={{ textAlign: "center", marginBottom: "1rem" }}>
          FREQUENT OBSERVATION NODES
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}>
          {POPULAR_SEARCHES.map(({ city, area }) => (
            <button
              key={`${city.slug}-${area.slug}`}
              onClick={() => quickSearch(city, area)}
              className="btn-ghost"
              style={{ fontSize: "0.74rem", fontFamily: "JetBrains Mono, monospace" }}
            >
              <MapPin size={12} />
              {area.name}, {city.name}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
