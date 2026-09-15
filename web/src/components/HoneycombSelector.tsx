"use client";

import React from "react";

interface Region {
  id: string;
  name: string;
  status: "active" | "inactive";
}

// A simple honeycomb-style grid implementation
export default function HoneycombSelector({ regions, title, onSelect }: { regions: Region[], title: string, onSelect?: (id: string) => void }) {
  return (
    <div style={{ padding: "4rem 2rem", background: "#111111" }}>
      <h3 style={{
        fontFamily: "JetBrains Mono, monospace",
        color: "var(--silver)",
        fontSize: "1.2rem",
        marginBottom: "3rem",
        textAlign: "center",
        letterSpacing: "0.15em"
      }}>
        {title}
      </h3>

      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "1rem",
        justifyContent: "center",
        maxWidth: "1000px",
        margin: "0 auto"
      }}>
        {regions.map((region) => (
          <div 
            key={region.id}
            onClick={() => {
              if (region.status === "active" && onSelect) onSelect(region.id);
            }}
            style={{ textDecoration: "none", pointerEvents: region.status === "active" ? "auto" : "none" }}
          >
            <div style={{
              width: "140px",
              height: "140px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              background: region.status === "active" ? "var(--charcoal)" : "transparent",
              border: `1px solid ${region.status === "active" ? "var(--steel)" : "#2a2a2a"}`,
              color: region.status === "active" ? "var(--air-white)" : "#4a4a4a",
              transition: "all 0.2s ease",
              clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              cursor: region.status === "active" ? "pointer" : "not-allowed",
            }}
            onMouseEnter={(e) => {
              if (region.status === "active") {
                e.currentTarget.style.background = "var(--air-white)";
                e.currentTarget.style.color = "var(--void)";
                e.currentTarget.style.transform = "scale(1.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (region.status === "active") {
                e.currentTarget.style.background = "var(--charcoal)";
                e.currentTarget.style.color = "var(--air-white)";
                e.currentTarget.style.transform = "scale(1)";
              }
            }}
            >
              <span style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: "0.9rem",
                fontWeight: 700,
                textAlign: "center",
                padding: "0 0.5rem"
              }}>
                {region.name}
              </span>
              <span style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "0.6rem",
                marginTop: "0.5rem",
                opacity: 0.6
              }}>
                {region.status.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
