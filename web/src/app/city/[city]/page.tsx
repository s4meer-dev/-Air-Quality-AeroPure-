import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AreaCompare from "@/components/AreaCompare";
import DemoModeBanner from "@/components/DemoModeBanner";
import ResponsibleAI from "@/components/ResponsibleAI";
import { getCity } from "@/lib/locations";
import { buildDemoInput } from "@/lib/demo-inputs";
import { aeropureClient } from "@/lib/aeropure-client";
import { MapPin, ChevronRight } from "lucide-react";

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { city: citySlug } = await params;
  const city = getCity(citySlug);
  return {
    title: city ? `${city.name} — AeroPure Air Intelligence` : "City Not Found",
  };
}

export default async function CityPage({ params }: Props) {
  const { city: citySlug } = await params;
  const city = getCity(citySlug);

  if (!city) notFound();

  // Fetch AQI for each area in parallel (server-side, real ML inference)
  const areaCards = await Promise.all(
    city.areas.map(async (area) => {
      try {
        const input = buildDemoInput(area);
        const result = await aeropureClient.predict(input);
        return {
          areaSlug: area.slug,
          areaName: area.name,
          aqi: result.predicted_aqi_proxy,
          hazardProb: result.hazard_probability,
          regime: result.pollution_regime,
          riskCategory: result.risk_category,
        };
      } catch {
        return {
          areaSlug: area.slug,
          areaName: area.name,
          aqi: 0,
          hazardProb: 0,
          regime: "Unavailable",
          riskCategory: "Unknown",
        };
      }
    })
  );

  const validCards = areaCards.filter((c) => c.aqi > 0);
  const worstArea = validCards.reduce((a, b) => (a.aqi > b.aqi ? a : b), validCards[0]);
  const bestArea = validCards.reduce((a, b) => (a.aqi < b.aqi ? a : b), validCards[0]);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-void)" }}>
      <Navbar />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
        {/* Breadcrumb */}
        <nav style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1.5rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
          <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</Link>
          <ChevronRight size={14} />
          <span style={{ color: "var(--gold)" }}>{city.name}</span>
        </nav>

        {/* City Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
            <MapPin size={18} color="var(--gold)" />
            <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-muted)" }}>
              CITY AIR INTELLIGENCE
            </span>
          </div>
          <h1
            style={{
              fontFamily: "Orbitron, sans-serif",
              fontSize: "clamp(2rem, 6vw, 3.5rem)",
              fontWeight: 900,
              color: "var(--gold)",
              letterSpacing: "0.08em",
              lineHeight: 1,
              marginBottom: "0.5rem",
            }}
          >
            {city.name.toUpperCase()}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
            {city.country} · {city.lat.toFixed(3)}°N, {city.lon.toFixed(3)}°E · {city.areas.length} supported areas
          </p>
        </div>

        <div className="gold-line" />
        <DemoModeBanner />

        {/* Summary stats */}
        {validCards.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
            <div className="card-gold">
              <p className="section-label">AREAS MONITORED</p>
              <p style={{ fontFamily: "Orbitron, sans-serif", fontSize: "2.5rem", fontWeight: 900, color: "var(--gold)", lineHeight: 1 }}>
                {validCards.length}
              </p>
            </div>
            {worstArea && (
              <div className="card-red">
                <p className="section-label">HIGHEST AQI PROXY</p>
                <p style={{ fontFamily: "Orbitron, sans-serif", fontSize: "2.5rem", fontWeight: 900, color: "var(--red-bright)", lineHeight: 1 }}>
                  {worstArea.aqi.toFixed(0)}
                </p>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>{worstArea.areaName}</p>
              </div>
            )}
            {bestArea && validCards.length > 1 && (
              <div className="card-gold">
                <p className="section-label">LOWEST AQI PROXY</p>
                <p style={{ fontFamily: "Orbitron, sans-serif", fontSize: "2.5rem", fontWeight: 900, color: "var(--gold-bright)", lineHeight: 1 }}>
                  {bestArea.aqi.toFixed(0)}
                </p>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>{bestArea.areaName}</p>
              </div>
            )}
            <div className="card">
              <p className="section-label">HAZARDOUS AREAS</p>
              <p style={{ fontFamily: "Orbitron, sans-serif", fontSize: "2.5rem", fontWeight: 900, color: validCards.filter(c => c.hazardProb > 0.5).length > 0 ? "var(--red-bright)" : "var(--gold-bright)", lineHeight: 1 }}>
                {validCards.filter((c) => c.hazardProb > 0.5).length}
              </p>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>of {validCards.length} areas</p>
            </div>
          </div>
        )}

        {/* Area comparison */}
        <div className="card" style={{ marginBottom: "2rem" }}>
          <AreaCompare city={city} cards={validCards} />
        </div>

        <ResponsibleAI />
      </main>
    </div>
  );
}
