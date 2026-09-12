import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ForecastTimeline from "@/components/ForecastTimeline";
import RegimeCard from "@/components/RegimeCard";
import ShapExplainer from "@/components/ShapExplainer";
import DriftPanel from "@/components/DriftPanel";
import WhatIfSimulator from "@/components/WhatIfSimulator";
import DemoModeBanner from "@/components/DemoModeBanner";
import ResponsibleAI from "@/components/ResponsibleAI";
import ModelTrustPanel from "@/components/ModelTrustPanel";
import DualSourcePanel from "@/components/DualSourcePanel";
import { getCity, getArea } from "@/lib/locations";
import { buildForecastInput, FORECAST_OFFSETS } from "@/lib/demo-inputs";
import { aeropureClient } from "@/lib/aeropure-client";
import { getWeatherData, getAirPollutionData } from "@/lib/openweather";
import { MapPin, ChevronRight } from "lucide-react";

interface Props {
  params: Promise<{ city: string; area: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { city: citySlug, area: areaSlug } = await params;
  const city = getCity(citySlug);
  const area = getArea(citySlug, areaSlug);
  return {
    title: area && city
      ? `${area.name}, ${city.name} — AeroPure Air Intelligence`
      : "Area Not Found",
  };
}

export default async function AreaPage({ params }: Props) {
  const { city: citySlug, area: areaSlug } = await params;
  const city = getCity(citySlug);
  const area = getArea(citySlug, areaSlug);

  if (!city || !area) notFound();

  const now = new Date();
  const input = buildForecastInput(area, 0, now);

  // Parallel server-side fetches (AeroPure ML + OpenWeather)
  const [prediction, explanation, drift, timelineResults, weatherRes, pollutionRes] = await Promise.allSettled([
    aeropureClient.predict(input),
    aeropureClient.explain(input),
    aeropureClient.drift(),
    Promise.all(
      FORECAST_OFFSETS.map((offset) =>
        aeropureClient.predict(buildForecastInput(area, offset, now)).then((r) => ({
          hourOffset: offset,
          label: offset === 0 ? "Now" : `+${offset}h`,
          time: new Date(now.getTime() + offset * 3600 * 1000).toLocaleTimeString("en-IN", {
            hour: "2-digit", minute: "2-digit", hour12: true,
          }),
          predicted_aqi_proxy: r.predicted_aqi_proxy,
          hazard_probability: r.hazard_probability,
          hazardous: r.hazardous,
          risk_category: r.risk_category,
          pollution_regime: r.pollution_regime,
        }))
      )
    ),
    getWeatherData(area.lat, area.lon),
    getAirPollutionData(area.lat, area.lon),
  ]);

  const pred = prediction.status === "fulfilled" ? prediction.value : null;
  const expl = explanation.status === "fulfilled" ? explanation.value : null;
  const driftData = drift.status === "fulfilled" ? drift.value : null;
  const timeline = timelineResults.status === "fulfilled" ? timelineResults.value : [];
  
  const weatherObj = weatherRes.status === "fulfilled" ? weatherRes.value : { data: null, error: "Fetch error" };
  const pollutionObj = pollutionRes.status === "fulfilled" ? pollutionRes.value : { data: null, error: null };

  const weatherState = {
    available: Boolean(weatherObj.data),
    weather: weatherObj.data ?? undefined,
    error: weatherObj.error ?? undefined,
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-void)", color: "var(--text-primary)" }}>
      <Navbar />

      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
        {/* Breadcrumb */}
        <nav style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1.5rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
          <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</Link>
          <ChevronRight size={14} />
          <Link href={`/city/${city.slug}`} style={{ color: "var(--text-muted)", textDecoration: "none" }}>{city.name}</Link>
          <ChevronRight size={14} />
          <span style={{ color: "var(--air-white)" }}>{area.name}</span>
        </nav>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
            <MapPin size={16} color="var(--air-white)" />
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.72rem", color: "var(--cloud)", fontWeight: 700, letterSpacing: "0.14em" }}>
              LOCATION INTELLIGENCE
            </span>
          </div>

          <h1
            style={{
              fontFamily: "Orbitron, sans-serif",
              fontSize: "clamp(2.2rem, 7vw, 4rem)",
              fontWeight: 900,
              color: "var(--air-white)",
              letterSpacing: "0.04em",
              lineHeight: 1.1,
              marginBottom: "0.4rem",
              textShadow: "0 0 35px rgba(255,255,255,0.18)",
            }}
          >
            {area.name}
          </h1>
          <p style={{ fontSize: "1rem", color: "var(--text-muted)" }}>
            {city.name}, {city.country} · LAT: <span style={{ fontFamily: "monospace", color: "var(--cloud)" }}>{area.lat}° N</span> | LON: <span style={{ fontFamily: "monospace", color: "var(--cloud)" }}>{area.lon}° E</span>
          </p>
        </div>

        <DemoModeBanner />

        {/* Dual Source Presentation */}
        <DualSourcePanel
          weatherState={weatherState}
          prediction={pred}
          externalPollution={pollutionObj.data}
          onRetryWeather={() => {}}
        />

        {/* Forecast Timeline */}
        {timeline.length > 0 && (
          <section style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 4, padding: "1.5rem", marginBottom: "2.5rem" }}>
            <ForecastTimeline timeline={timeline} />
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "1rem", textAlign: "right" }}>
              * Methodological Note: Forecast points represent discrete model inference under available observation/state assumptions.
            </p>
          </section>
        )}

        {/* Regime */}
        {pred && (
          <section style={{ marginBottom: "2.5rem" }}>
            <RegimeCard regime={pred.pollution_regime} />
          </section>
        )}

        {/* SHAP */}
        {expl && (
          <section style={{ marginBottom: "2.5rem" }}>
            <ShapExplainer
              positiveContributors={expl.top_positive_contributors}
              negativeContributors={expl.top_negative_contributors}
              summary={expl.explanation_summary}
              baseValue={expl.base_expected_value}
            />
          </section>
        )}

        {/* Simulator */}
        <section style={{ marginBottom: "2.5rem" }}>
          <WhatIfSimulator />
        </section>

        {/* Drift */}
        {driftData && (
          <section style={{ marginBottom: "2.5rem" }}>
            <DriftPanel
              driftStatus={driftData.drift_status}
              meanPsi={driftData.mean_psi}
              retrainingFlagged={driftData.retraining_flagged}
              recommendation={driftData.recommendation}
              significantDriftFeatures={driftData.significant_drift_features}
              psiByFeature={driftData.psi_by_feature}
            />
          </section>
        )}

        {/* Model Trust Panel */}
        <section style={{ marginBottom: "2.5rem" }}>
          <ModelTrustPanel />
        </section>

        {/* Responsible AI */}
        <ResponsibleAI />
      </main>
    </div>
  );
}
