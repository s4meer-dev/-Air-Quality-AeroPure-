"use client";

import React, { useRef, useEffect, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Area } from "@/lib/locations";

interface Props {
  currentAreaObj: Area | null;
}

export default function AeroMap({ currentAreaObj }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(12);

  const lat = currentAreaObj?.lat ?? 35.694;
  const lon = currentAreaObj?.lon ?? 139.753;

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return; // initialize only once

    // Esri ArcGIS World Dark Gray Base + Reference (legitimate, keyless, monochrome)
    const baseTileUrl =
      process.env.NEXT_PUBLIC_MAP_TILE_URL ||
      "https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";

    const refTileUrl =
      "https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}";

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "esri-dark-base": {
            type: "raster",
            tiles: [baseTileUrl],
            tileSize: 256,
            attribution: "&copy; Esri, HERE, Garmin, OpenStreetMap contributors",
            maxzoom: 16,
          },
          "esri-dark-ref": {
            type: "raster",
            tiles: [refTileUrl],
            tileSize: 256,
            maxzoom: 16,
          },
        },
        layers: [
          {
            id: "esri-dark-base-layer",
            type: "raster",
            source: "esri-dark-base",
            minzoom: 0,
            maxzoom: 18,
          },
          {
            id: "esri-dark-ref-layer",
            type: "raster",
            source: "esri-dark-ref",
            minzoom: 0,
            maxzoom: 18,
          },
        ],
      },
      center: [lon, lat],
      zoom: 12,
      attributionControl: false,
    });

    map.current = mapInstance;

    // Add navigation controls (zoom + compass)
    mapInstance.addControl(
      new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true,
      }),
      "bottom-right"
    );

    // Track zoom level for UI display
    mapInstance.on("zoom", () => {
      setZoomLevel(Math.round(mapInstance.getZoom() * 10) / 10);
    });

    // Custom monochrome pulse marker
    const markerEl = document.createElement("div");
    markerEl.className = "aeropure-map-marker";
    markerEl.style.cssText = `
      width: 22px;
      height: 22px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    `;

    const pulseRing = document.createElement("div");
    pulseRing.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2px solid #F2F2F0;
      animation: aeropure-pulse 2s infinite ease-out;
      pointer-events: none;
    `;

    const centerDot = document.createElement("div");
    centerDot.style.cssText = `
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #F2F2F0;
      border: 2px solid #111111;
      box-shadow: 0 0 10px rgba(242, 242, 240, 0.8);
      z-index: 2;
    `;

    markerEl.appendChild(pulseRing);
    markerEl.appendChild(centerDot);

    const markerInstance = new maplibregl.Marker({ element: markerEl })
      .setLngLat([lon, lat])
      .addTo(mapInstance);

    marker.current = markerInstance;

    // Trigger resize observer to handle responsive layout
    const resizeObserver = new ResizeObserver(() => {
      mapInstance.resize();
    });
    resizeObserver.observe(mapContainer.current);

    return () => {
      resizeObserver.disconnect();
      markerInstance.remove();
      mapInstance.remove();
      map.current = null;
    };
  }, [lat, lon]);

  // Update map center and marker when area changes
  useEffect(() => {
    if (map.current) {
      map.current.flyTo({
        center: [lon, lat],
        zoom: 12,
        essential: true,
      });

      if (marker.current) {
        marker.current.setLngLat([lon, lat]);
      }
    }
  }, [lat, lon]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "440px",
        background: "#070707",
        border: "1px solid #242423",
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes aeropure-pulse {
          0% {
            transform: scale(0.6);
            opacity: 1;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
        .maplibregl-ctrl-group {
          background: #111111 !important;
          border: 1px solid #41413F !important;
          border-radius: 2px !important;
        }
        .maplibregl-ctrl-group button {
          border-bottom: 1px solid #242423 !important;
        }
        .maplibregl-ctrl-group button:last-child {
          border-bottom: none !important;
        }
        .maplibregl-ctrl-icon {
          filter: invert(1) brightness(0.85);
        }
      `}</style>

      {/* MapLibre WebGL container with pure monochrome filter */}
      <div
        ref={mapContainer}
        style={{
          width: "100%",
          height: "100%",
          filter: "grayscale(100%) contrast(1.1) brightness(0.95)",
        }}
      />

      {/* Top Left: Location Chip */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          background: "rgba(17, 17, 17, 0.88)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          padding: "0.6rem 1rem",
          borderRadius: "3px",
          border: "1px solid #41413F",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "0.78rem",
            fontWeight: 700,
            color: "#F2F2F0",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {currentAreaObj?.name || "Chiyoda Central"}
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.65rem",
            color: "#929292",
            letterSpacing: "0.04em",
          }}
        >
          {lat.toFixed(4)}° N, {lon.toFixed(4)}° E · MONOCHROME RADAR
        </div>
      </div>

      {/* Top Right: Telemetry Badge */}
      <div
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          background: "rgba(17, 17, 17, 0.88)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          padding: "0.45rem 0.8rem",
          borderRadius: "3px",
          border: "1px solid #242423",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.65rem",
          color: "#929292",
          letterSpacing: "0.05em",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        MAG: {zoomLevel.toFixed(1)}X · ESRI CARTOGRAPHIC
      </div>
    </div>
  );
}
