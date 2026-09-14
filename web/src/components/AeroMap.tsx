"use client";

import React, { useRef, useEffect } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Area } from "@/lib/locations";

interface Props {
  currentAreaObj: Area | null;
}

export default function AeroMap({ currentAreaObj }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  const lat = currentAreaObj?.lat ?? 17.385;
  const lon = currentAreaObj?.lon ?? 78.4867;

  useEffect(() => {
    if (map.current) return; // initialize map only once
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap Contributors & CartoDB'
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      },
      center: [lon, lat],
      zoom: 12,
      attributionControl: false
    });

    // Add a monochrome marker
    new maplibregl.Marker({ color: "#F2F2F0" })
      .setLngLat([lon, lat])
      .addTo(map.current);

  }, [lat, lon]);

  // Update map center when area changes
  useEffect(() => {
    if (map.current) {
      map.current.flyTo({
        center: [lon, lat],
        zoom: 12,
        essential: true 
      });
      
      // Update marker (we'll just clear old markers and add new one for simplicity in this example)
      const markers = document.querySelectorAll('.maplibregl-marker');
      markers.forEach(m => m.remove());
      new maplibregl.Marker({ color: "#F2F2F0" })
        .setLngLat([lon, lat])
        .addTo(map.current);
    }
  }, [lat, lon]);

  return (
    <div style={{ position: "relative", width: "100%", height: "400px", background: "#070707", border: "1px solid var(--charcoal)", borderRadius: "4px", overflow: "hidden" }}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%", filter: "grayscale(100%) contrast(1.2)" }} />
      <div style={{
        position: "absolute",
        top: 10,
        left: 10,
        background: "rgba(17, 17, 17, 0.8)",
        backdropFilter: "blur(4px)",
        padding: "0.5rem 1rem",
        borderRadius: "2px",
        border: "1px solid var(--steel)",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: "0.7rem",
        color: "var(--air-white)",
        textTransform: "uppercase",
        letterSpacing: "0.1em"
      }}>
        {currentAreaObj?.name || "Global Origin"}
      </div>
    </div>
  );
}
