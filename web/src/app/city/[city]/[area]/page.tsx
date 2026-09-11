import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AqiDisplay from "@/components/AqiDisplay";
import HazardBanner from "@/components/HazardBanner";
import ForecastTimeline from "@/components/ForecastTimeline";
import RegimeCard from "@/components/RegimeCard";
import ShapExplainer from "@/components/ShapExplainer";
import DriftPanel from "@/components/DriftPanel";
import WhatIfSimulator from "@/components/WhatIfSimulator";
import DemoModeBanner from "@/components/DemoModeBanner";
import ResponsibleAI from "@/components/ResponsibleAI";
import { getCity, getArea } from "@/lib/locations";
import { buildDemoInput, buildForecastInput, FORECAST_OFFSETS } from "@/lib/demo-inputs";
import { aeropureClient } from "@/lib/aeropure-client";
import { MapPin, ChevronRight, Clock } from "lucide-react";

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
  const input = buildDemoInput(area, now);

  // Parallel server-side fetches
  const [prediction, explanation, drift, timelineResults] = await Promise.allSettled([
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
  ]);

  const pred = prediction.status === "fulfilled" ? prediction.value : null;
  const expl = explanation.status === "fulfilled" ? explanation.value : null;
  const driftData = drift.status === "fulfilled" ? drift.value : null;
  const timeline = timelineResults.status === "fulfilled" ? timelineResults.value : [];

  const mlOffline = !pred;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-void)" }}>
      <Navbar />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>

        {/* Breadcrumb */}
        <nav style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1.5rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
          <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</Link>
          <ChevronRight size={14} />
          <Link href={`/city/${city.slug}`} style={{ color: "var(--text-muted)", textDecoration: "none" }}>{city.name}</Link>
          <ChevronRight size={14} />
          <span style={{ color: "var(--gold)" }}>{area.name}</span>
        </nav>

        {/* ── 01 LOCATION ─────────────────────────────────────────── */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
            <MapPin size={16} color="var(--gold)" />
            <span className="section-label" style={{ margin: 0 }}>01 — LOCATION</span>
          </div>

          <h1
            style={{
              fontFamily: "Orbitron, sans-serif",
              fontSize: "clamp(2.2rem, 7vw, 4rem)",
              fontWeight: 900,
              color: "var(--text-primary)",
              lineHeight: 1,
              marginBottom: "0.25rem",
              letterSpacing: "0.04em",
            }}
          >
            {area.name.toUpperCase()}
          </h1>
          <h2
            style={{
              fontFamily: "Orbitron, sans-serif",
              fontSize: "clamp(1rem, 3vw, 1.6rem)",
              fontWeight: 700,
              color: "var(--gold)",
              letterSpacing: "0.1em",
              marginBottom: "0.6rem",
            }}
          >
            {city.name.toUpperCase()}
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.2rem" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <MapPin size={12} /> {area.lat.toFixed(4)}°N, {area.lon.toFixed(4)}°E
            </span>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Clock size={12} /> Updated: {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="demo-badge">Demo Mode</span>
          </div>
        </div>

        <div className="gold-line" />
        <DemoModeBanner />

        {/* ML offline warning */}
        {mlOffline && (
          <div style={{
            background: "rgba(177,18,38,0.1)", border: "1px solid var(--red)",
            borderRadius: 10, padding: "1rem 1.3rem", marginBottom: "1.5rem",
            color: "var(--red-bright)", fontSize: "0.88rem",
          }}>
            ⚠ ML engine unavailable. Ensure FastAPI is running on port 8000 ({`python -m uvicorn api.main:app --port 8000`}).
          </div>
        )}

        {pred && (
          <>
            {/* ── 02 HAZARD BANNER ──────────────────────────────────── */}
            <HazardBanner
              hazardous={pred.hazardous}
              hazardProbability={pred.hazard_probability}
              predictedAqi={pred.predicted_aqi_proxy}
              areaName={area.name}
            />

            {/* ── 02 CURRENT AIR ──────────────────────────────────── */}
            <section style={{ marginBottom: "2rem" }}>
              <p className="section-label" style={{ marginBottom: "1.2rem" }}>02 — CURRENT AIR QUALITY</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.2rem" }}>

                {/* AQI hero */}
                <div className="card-gold" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                  <AqiDisplay value={pred.current_aqi_proxy} label="CURRENT AQI PROXY" size="xl" />
                  <p style={{ marginTop: "1rem", fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "center" }}>
                    Dominant Pollutant: <strong style={{ color: "var(--gold)" }}>{pred.dominant_current_pollutant}</strong>
                  </p>
                </div>

                {/* Forecast AQI */}
                <div className="card-gold" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                  <AqiDisplay value={pred.predicted_aqi_proxy} label="TOMORROW'S FORECAST (+24H)" size="xl" />
                  <p style={{ marginTop: "1rem", fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "center" }}>
                    Risk Category: <strong style={{ color: pred.hazardous ? "var(--red-bright)" : "var(--gold)" }}>{pred.risk_category}</strong>
                  </p>
                </div>

                {/* Hazard probability */}
                <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <p className="section-label" style={{ marginBottom: "0.75rem" }}>04 — HAZARD PROBABILITY</p>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <span style={{
                      fontFamily: "Orbitron, sans-serif",
                      fontSize: "3.5rem", fontWeight: 900,
                      color: pred.hazard_probability > 0.5 ? "var(--red-bright)" : "var(--gold)",
                      lineHeight: 1,
                      textShadow: `0 0 30px ${pred.hazard_probability > 0.5 ? "var(--red-bright)" : "var(--gold)"}`,
                    }}>
                      {(pred.hazard_probability * 100).toFixed(0)}%
                    </span>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>hazard probability</span>
                  </div>

                  {/* Probability bar */}
                  <div style={{ height: 6, background: "var(--bg-elevated)", borderRadius: 3, overflow: "hidden", marginBottom: "0.5rem" }}>
                    <div style={{
                      height: "100%",
                      width: `${pred.hazard_probability * 100}%`,
                      background: pred.hazard_probability > 0.5 ? "var(--red-bright)" : "var(--gold)",
                      borderRadius: 3,
                      transition: "width 0.5s ease",
                    }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-faint)" }}>
                    <span>0%</span>
                    <span style={{ color: "var(--gold-dim)" }}>Threshold ≥ 180</span>
                    <span>100%</span>
                  </div>

                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>
                    XGBoost Classifier · F1 0.683 · AUC 0.824 · Brier Score 0.1726
                  </p>
                </div>
              </div>
            </section>

            {/* ── 03 FORECAST TIMELINE ───────────────────────────────── */}
            <section style={{ marginBottom: "2rem" }}>
              <p className="section-label" style={{ marginBottom: "0.4rem" }}>03 — 24-HOUR FORECAST</p>
              <div className="card">
                {timeline.length > 0 ? (
                  <ForecastTimeline timeline={timeline} />
                ) : (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>Forecast timeline unavailable.</p>
                )}
              </div>
            </section>

            {/* ── 05 POLLUTION REGIME ───────────────────────────────── */}
            <section style={{ marginBottom: "2rem" }}>
              <p className="section-label" style={{ marginBottom: "0.75rem" }}>05 — POLLUTION REGIME</p>
              <RegimeCard regime={pred.pollution_regime} />
            </section>

            {/* ── 06 EXPLAINABILITY ─────────────────────────────────── */}
            {expl && (
              <section style={{ marginBottom: "2rem" }}>
                <div className="card">
                  <ShapExplainer
                    positiveContributors={expl.top_positive_contributors}
                    negativeContributors={expl.top_negative_contributors}
                    summary={expl.explanation_summary}
                    baseValue={expl.base_expected_value}
                  />
                </div>
              </section>
            )}
          </>
        )}

        {/* ── 07 WHAT-IF SIMULATOR ─────────────────────────────────── */}
        <section style={{ marginBottom: "2rem" }}>
          <p className="section-label" style={{ marginBottom: "0.75rem" }}>07 — ADVANCED SIMULATION</p>
          <div className="card">
            <WhatIfSimulator />
          </div>
        </section>

        {/* ── 08 DRIFT & MODEL HEALTH ──────────────────────────────── */}
        {driftData && (
          <section style={{ marginBottom: "2rem" }}>
            <p className="section-label" style={{ marginBottom: "0.75rem" }}>08 — MODEL HEALTH</p>
            <div className="card">
              <DriftPanel
                driftStatus={driftData.drift_status}
                meanPsi={driftData.mean_psi}
                retrainingFlagged={driftData.retraining_flagged}
                recommendation={driftData.recommendation}
                significantDriftFeatures={driftData.significant_drift_features}
                psiByFeature={driftData.psi_by_feature}
              />
            </div>
          </section>
        )}

        <ResponsibleAI />
      </main>
    </div>
  );
}
