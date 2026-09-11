"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import HeroMap from "@/components/HeroMap";
import HoneycombSelector from "@/components/HoneycombSelector";
import DualSourcePanel from "@/components/DualSourcePanel";
import ForecastTimeline, { ForecastPoint } from "@/components/ForecastTimeline";
import RegimeCard from "@/components/RegimeCard";
import ShapExplainer from "@/components/ShapExplainer";
import WhatIfSimulator from "@/components/WhatIfSimulator";
import DriftPanel from "@/components/DriftPanel";
import ModelTrustPanel from "@/components/ModelTrustPanel";
import ResponsibleAI from "@/components/ResponsibleAI";
import DemoModeBanner from "@/components/DemoModeBanner";
import { getArea, Area } from "@/lib/locations";
import { aeropureClient, PredictResponse, ExplainResponse, DriftResponse } from "@/lib/aeropure-client";
import { buildForecastInput, FORECAST_OFFSETS } from "@/lib/demo-inputs";

export default function HomePage() {
  const [citySlug, setCitySlug] = useState("hyderabad");
  const [areaSlug, setAreaSlug] = useState("gachibowli");

  const [currentAreaObj, setCurrentAreaObj] = useState<Area | null>(() => getArea("hyderabad", "gachibowli") ?? null);

  // Weather State
  const [weatherState, setWeatherState] = useState<{
    available: boolean;
    temp?: number;
    humidity?: number;
    windSpeed?: number;
    condition?: string;
    description?: string;
    error?: string;
  }>({ available: false });

  // External Pollution State (OpenWeather)
  const [externalPollution, setExternalPollution] = useState<{
    aqi: number;
    co: number;
    no2: number;
    o3: number;
    so2: number;
    pm2_5: number;
    pm10: number;
  } | null>(null);

  // AeroPure ML States
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [timeline, setTimeline] = useState<ForecastPoint[]>([]);
  const [explanation, setExplanation] = useState<ExplainResponse | null>(null);
  const [drift, setDrift] = useState<DriftResponse | null>(null);

  // Fetch OpenWeather Data
  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      const json = await res.json();
      if (json.available && json.weather) {
        setWeatherState({
          available: true,
          temp: json.weather.temp,
          humidity: json.weather.humidity,
          windSpeed: json.weather.wind_speed,
          condition: json.weather.condition,
          description: json.weather.description,
        });
      } else {
        setWeatherState({ available: false, error: json.error ?? "OpenWeather API Key Pending Activation (401)" });
      }

      // External Pollution Reference
      const pRes = await fetch(`/api/pollution?lat=${lat}&lon=${lon}`);
      const pJson = await pRes.json();
      if (pJson.available && pJson.pollution) {
        setExternalPollution(pJson.pollution);
      } else {
        setExternalPollution(null);
      }
    } catch {
      setWeatherState({ available: false, error: "Network Error Fetching OpenWeather" });
    }
  }, []);

  // Fetch AeroPure ML Model Outputs
  const fetchModelOutputs = useCallback(async (area: Area) => {
    const now = new Date();
    const currentInput = buildForecastInput(area, 0, now);

    try {
      // 1. Predict
      const predRes = await aeropureClient.predict(currentInput);
      setPrediction(predRes);

      // 2. Timeline (6 forecast points)
      const fcTimeline = await Promise.all(
        FORECAST_OFFSETS.map(async (offset) => {
          const inp = buildForecastInput(area, offset, now);
          const res = await aeropureClient.predict(inp);
          return {
            hourOffset: offset,
            label: offset === 0 ? "Now" : `+${offset}h`,
            time: new Date(now.getTime() + offset * 3600 * 1000).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            predicted_aqi_proxy: res.predicted_aqi_proxy,
            hazard_probability: res.hazard_probability,
            hazardous: res.hazardous,
            risk_category: res.risk_category,
            pollution_regime: res.pollution_regime,
          };
        })
      );
      setTimeline(fcTimeline);

      // 3. Explain (SHAP)
      const expRes = await aeropureClient.explain(currentInput);
      setExplanation(expRes);

      // 4. Drift
      const driftRes = await aeropureClient.drift();
      setDrift(driftRes);
    } catch (err) {
      console.error("ML Model Fetch Error:", err);
    }
  }, []);

  // Handle Location Selection
  const handleSelectArea = useCallback(
    (newCitySlug: string, newAreaSlug: string) => {
      setCitySlug(newCitySlug);
      setAreaSlug(newAreaSlug);
      const area = getArea(newCitySlug, newAreaSlug);
      if (area) {
        setCurrentAreaObj(area);
        fetchWeather(area.lat, area.lon);
        fetchModelOutputs(area);
      }
    },
    [fetchWeather, fetchModelOutputs]
  );

  // Initial Load & Updates
  useEffect(() => {
    let isMounted = true;
    const targetArea = getArea(citySlug, areaSlug);
    if (!targetArea) return;

    const area: Area = targetArea;
    const now = new Date();
    const currentInput = buildForecastInput(area, 0, now);

    async function loadData() {
      // 1. Weather Context
      try {
        const [wRes, pRes] = await Promise.all([
          fetch(`/api/weather?lat=${area.lat}&lon=${area.lon}`).then((r) => r.json()).catch(() => ({ available: false })),
          fetch(`/api/pollution?lat=${area.lat}&lon=${area.lon}`).then((r) => r.json()).catch(() => ({ available: false })),
        ]);
        if (!isMounted) return;
        if (wRes.available && wRes.weather) {
          setWeatherState({
            available: true,
            temp: wRes.weather.temp,
            humidity: wRes.weather.humidity,
            windSpeed: wRes.weather.wind_speed,
            condition: wRes.weather.condition,
            description: wRes.weather.description,
          });
        } else {
          setWeatherState({ available: false, error: wRes.error ?? "OpenWeather API Key Pending Activation (401)" });
        }
        if (pRes.available && pRes.pollution) {
          setExternalPollution(pRes.pollution);
        } else {
          setExternalPollution(null);
        }
      } catch {
        if (isMounted) setWeatherState({ available: false, error: "Network Error Fetching OpenWeather" });
      }

      // 2. AeroPure ML Outputs
      try {
        const [predRes, expRes, driftRes, fcTimeline] = await Promise.all([
          aeropureClient.predict(currentInput),
          aeropureClient.explain(currentInput),
          aeropureClient.drift(),
          Promise.all(
            FORECAST_OFFSETS.map(async (offset) => {
              const inp = buildForecastInput(area, offset, now);
              const res = await aeropureClient.predict(inp);
              return {
                hourOffset: offset,
                label: offset === 0 ? "Now" : `+${offset}h`,
                time: new Date(now.getTime() + offset * 3600 * 1000).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                }),
                predicted_aqi_proxy: res.predicted_aqi_proxy,
                hazard_probability: res.hazard_probability,
                hazardous: res.hazardous,
                risk_category: res.risk_category,
                pollution_regime: res.pollution_regime,
              };
            })
          ),
        ]);

        if (!isMounted) return;
        setPrediction(predRes);
        setExplanation(expRes);
        setDrift(driftRes);
        setTimeline(fcTimeline);
      } catch (err) {
        console.error("ML Model Fetch Error:", err);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [citySlug, areaSlug]);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-void)", color: "var(--text-primary)" }}>
      <Navbar />

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
        {/* Phase 4 Hero Branding */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <span
            style={{
              fontFamily: "Orbitron, sans-serif",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: "var(--gold)",
              background: "rgba(201,162,39,0.08)",
              border: "1px solid var(--gold-dim)",
              padding: "0.35rem 1rem",
              borderRadius: 30,
              display: "inline-block",
              marginBottom: "1rem",
            }}
          >
            ATMOSPHERIC & AIR QUALITY INTELLIGENCE PLATFORM
          </span>

          <h1
            style={{
              fontFamily: "Orbitron, sans-serif",
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              fontWeight: 900,
              color: "var(--gold)",
              letterSpacing: "0.04em",
              lineHeight: 1,
              marginBottom: "0.5rem",
              textShadow: "0 0 50px rgba(201,162,39,0.25)",
            }}
          >
            AEROPURE
          </h1>

          <p
            style={{
              fontSize: "clamp(1.1rem, 2.5vw, 1.4rem)",
              fontWeight: 300,
              letterSpacing: "0.02em",
              marginBottom: "0.5rem",
            }}
          >
            KNOW TOMORROW&apos;S AIR. <span style={{ color: "var(--gold)", fontWeight: 600 }}>TODAY.</span>
          </p>

          <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", maxWidth: 640, margin: "0 auto" }}>
            Model-driven air-quality intelligence combining pollutant observations, environmental conditions, and historical patterns.
          </p>
        </div>

        {/* Primary Honeycomb Geospatial Location Index */}
        <section id="location-index" style={{ marginBottom: "2.5rem" }}>
          <HoneycombSelector
            selectedCitySlug={citySlug}
            selectedAreaSlug={areaSlug}
            onSelectLocation={handleSelectArea}
          />
        </section>

        {/* Phase 4 Hero Map Viewport */}
        <section style={{ marginBottom: "2.5rem" }}>
          <HeroMap
            selectedArea={areaSlug}
            currentAreaObj={currentAreaObj}
            onSelectArea={handleSelectArea}
            weatherState={weatherState}
            onRetryWeather={() => currentAreaObj && fetchWeather(currentAreaObj.lat, currentAreaObj.lon)}
          />
        </section>

        {/* Demo Mode Notice */}
        <DemoModeBanner />

        {/* Phase 5 & 7 Dual-Source Presentation */}
        <section id="forecast">
          <DualSourcePanel
            weatherState={weatherState}
            prediction={prediction}
            externalPollution={externalPollution}
            onRetryWeather={() => currentAreaObj && fetchWeather(currentAreaObj.lat, currentAreaObj.lon)}
          />
        </section>

        {/* Phase 6 Model-Estimated Forecast Timeline */}
        {timeline.length > 0 && (
          <section style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.5rem", marginBottom: "2.5rem" }}>
            <ForecastTimeline timeline={timeline} />
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "1rem", textAlign: "right" }}>
              * Methodological Note: Forecast points represent discrete model inference under available observation/state assumptions.
            </p>
          </section>
        )}

        {/* Phase 10 Atmospheric Regime */}
        {prediction && (
          <section style={{ marginBottom: "2.5rem" }}>
            <RegimeCard regime={prediction.pollution_regime} />
          </section>
        )}

        {/* Phase 9 SHAP Model Contribution Analysis */}
        {explanation && (
          <section id="explainability" style={{ marginBottom: "2.5rem" }}>
            <ShapExplainer
              positiveContributors={explanation.top_positive_contributors}
              negativeContributors={explanation.top_negative_contributors}
              summary={explanation.explanation_summary}
              baseValue={explanation.base_expected_value}
            />
          </section>
        )}

        {/* Phase 11 What-If Scenario Analysis */}
        <section style={{ marginBottom: "2.5rem" }}>
          <WhatIfSimulator />
        </section>

        {/* Phase 12 Drift Governance */}
        {drift && (
          <section id="governance" style={{ marginBottom: "2.5rem" }}>
            <DriftPanel
              driftStatus={drift.drift_status}
              meanPsi={drift.mean_psi}
              retrainingFlagged={drift.retraining_flagged}
              recommendation={drift.recommendation}
              significantDriftFeatures={drift.significant_drift_features}
              psiByFeature={drift.psi_by_feature}
            />
          </section>
        )}

        {/* Phase 13 Model Trust Panel */}
        <section style={{ marginBottom: "2.5rem" }}>
          <ModelTrustPanel />
        </section>

        {/* Phase 14 Methodology & Responsible AI */}
        <section id="methodology">
          <ResponsibleAI />
        </section>
      </main>
    </div>
  );
}
