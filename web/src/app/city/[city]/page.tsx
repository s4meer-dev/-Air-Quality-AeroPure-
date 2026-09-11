import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AreaCompare from "@/components/AreaCompare";
import DemoModeBanner from "@/components/DemoModeBanner";
import ResponsibleAI from "@/components/ResponsibleAI";
import ModelTrustPanel from "@/components/ModelTrustPanel";
import { getCity } from "@/lib/locations";
import { buildForecastInput } from "@/lib/demo-inputs";
import { aeropureClient } from "@/lib/aeropure-client";
import { getWeatherData } from "@/lib/openweather";
import { MapPin, ChevronRight, Droplets, Wind } from "lucide-react";

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

  const now = new Date();

  // Fetch AQI for each area in parallel (server-side, real ML inference) + City OpenWeather
  const [areaCardsRes, weatherRes] = await Promise.all([
    Promise.all(
      city.areas.map(async (area) => {
        try {
          const input = buildForecastInput(area, 0, now);
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
    ),
    getWeatherData(city.lat, city.lon),
  ]);

  const areaCards = areaCardsRes;
  const weatherObj = weatherRes.data;

  const validCards = areaCards.filter((c) => c.aqi > 0);
  const worstArea = validCards.reduce((a, b) => (a.aqi > b.aqi ? a : b), validCards[0]);
  const bestArea = validCards.reduce((a, b) => (a.aqi < b.aqi ? a : b), validCards[0]);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-void)", color: "var(--text-primary)" }}>
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
            <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", color: "var(--gold)" }}>
              CITY ATMOSPHERIC OVERVIEW
            </span>
          </div>
          <h1
            style={{
              fontFamily: "Orbitron, sans-serif",
              fontSize: "clamp(2.2rem, 6vw, 3.8rem)",
              fontWeight: 900,
              color: "var(--gold)",
              letterSpacing: "0.06em",
              lineHeight: 1,
              marginBottom: "0.5rem",
            }}
          >
            {city.name.toUpperCase()}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
            {city.country} · LAT: <span style={{ fontFamily: "monospace", color: "var(--gold)" }}>{city.lat.toFixed(4)}° N</span> | LON: <span style={{ fontFamily: "monospace", color: "var(--gold)" }}>{city.lon.toFixed(4)}° E</span> · {city.areas.length} locality zones
          </p>
        </div>

        {/* City Weather Summary Banner (if available) */}
        {weatherObj && (
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "1rem 1.5rem",
              marginBottom: "2rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: "1.8rem", fontWeight: 800 }}>{weatherObj.temp}°C</span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{weatherObj.condition} ({weatherObj.description})</span>
            </div>

            <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Droplets size={14} color="#4A90E2" />
                <span>{weatherObj.humidity}% RH</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Wind size={14} color="var(--gold-bright)" />
                <span>{weatherObj.wind_speed} m/s</span>
              </div>
            </div>
          </div>
        )}

        <DemoModeBanner />

        {/* Highlights */}
        {validCards.length > 1 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.2rem",
              marginBottom: "2.5rem",
            }}
          >
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--gold-dim)", borderRadius: 12, padding: "1.2rem" }}>
              <span style={{ fontSize: "0.68rem", fontFamily: "Orbitron, sans-serif", fontWeight: 700, color: "var(--gold)" }}>HIGHEST AIR POLLUTION ZONE</span>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: "0.3rem" }}>{worstArea?.areaName}</h3>
              <p style={{ color: "var(--gold-bright)", fontWeight: 700, fontSize: "1.4rem", marginTop: "0.2rem" }}>{worstArea?.aqi.toFixed(1)} AQI Proxy</p>
              <Link href={`/city/${city.slug}/${worstArea?.areaSlug}`} style={{ fontSize: "0.78rem", color: "var(--gold)", textDecoration: "underline", marginTop: "0.5rem", display: "inline-block" }}>
                Inspect Locality Intelligence →
              </Link>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.2rem" }}>
              <span style={{ fontSize: "0.68rem", fontFamily: "Orbitron, sans-serif", fontWeight: 700, color: "var(--text-muted)" }}>LOWEST AIR POLLUTION ZONE</span>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: "0.3rem" }}>{bestArea?.areaName}</h3>
              <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.4rem", marginTop: "0.2rem" }}>{bestArea?.aqi.toFixed(1)} AQI Proxy</p>
              <Link href={`/city/${city.slug}/${bestArea?.areaSlug}`} style={{ fontSize: "0.78rem", color: "var(--gold)", textDecoration: "underline", marginTop: "0.5rem", display: "inline-block" }}>
                Inspect Locality Intelligence →
              </Link>
            </div>
          </div>
        )}

        {/* Locality Matrix Grid */}
        <section style={{ marginBottom: "3rem" }}>
          <AreaCompare city={city} cards={areaCards} />
        </section>

        {/* Trust & Methodology */}
        <section style={{ marginBottom: "2.5rem" }}>
          <ModelTrustPanel />
        </section>

        <ResponsibleAI />
      </main>
    </div>
  );
}
