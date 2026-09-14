"use client";

import React, { useState, useEffect } from "react";
import { GeoLocation } from "@/lib/openweather";

interface LiveGlobalSearchProps {
  onSelectLiveLocation: (loc: GeoLocation) => void;
}

export default function LiveGlobalSearch({ onSelectLiveLocation }: LiveGlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length < 3) {
        setResults([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/search?live=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.liveLocations) {
          setResults(json.liveLocations);
        } else if (json.error) {
          setError(json.error);
        }
      } catch (err) {
        setError("Search failed");
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div style={{ padding: "2rem", background: "var(--void)", borderBottom: "1px solid var(--charcoal)" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h3 style={{
          fontFamily: "Orbitron, sans-serif",
          color: "var(--air-white)",
          fontSize: "1.2rem",
          marginBottom: "1rem",
          letterSpacing: "0.1em",
          textAlign: "center"
        }}>
          LIVE GLOBAL SEARCH
        </h3>
        <p style={{
          fontFamily: "JetBrains Mono, monospace",
          color: "var(--silver)",
          fontSize: "0.8rem",
          marginBottom: "1.5rem",
          textAlign: "center"
        }}>
          Search globally for live telemetry.
        </p>

        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Search city (e.g. Paris, FR)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "1rem 1.5rem",
              background: "#111111",
              border: "1px solid var(--steel)",
              color: "var(--air-white)",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "1rem",
              outline: "none",
            }}
          />

          {loading && (
            <div style={{ position: "absolute", right: "1rem", top: "1rem", color: "var(--silver)", fontFamily: "JetBrains Mono, monospace" }}>
              LOADING...
            </div>
          )}

          {error && (
            <div style={{ marginTop: "1rem", color: "#ff4444", fontFamily: "JetBrains Mono, monospace", fontSize: "0.8rem" }}>
              {error}
            </div>
          )}

          {results.length > 0 && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#111111",
              border: "1px solid var(--steel)",
              borderTop: "none",
              zIndex: 10,
              maxHeight: "300px",
              overflowY: "auto"
            }}>
              {results.map((r, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                    onSelectLiveLocation(r);
                  }}
                  style={{
                    padding: "1rem 1.5rem",
                    borderBottom: i < results.length - 1 ? "1px solid var(--charcoal)" : "none",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--charcoal)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#111111"}
                >
                  <span style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--air-white)", fontWeight: "bold" }}>
                    {r.name}
                  </span>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--silver)", fontSize: "0.8rem" }}>
                    {r.state ? `${r.state}, ` : ""}{r.country} (Lat: {r.lat.toFixed(2)}, Lon: {r.lon.toFixed(2)})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
