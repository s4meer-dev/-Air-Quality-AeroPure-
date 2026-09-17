"use client";

import { useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import StampScrapbook from "@/components/StampScrapbook";
import ContinentArchiveView from "@/components/ContinentArchiveView";
import RegionArchiveView from "@/components/RegionArchiveView";
import HoneycombSelector from "@/components/HoneycombSelector";
import AeroMap from "@/components/AeroMap";
import DualSourcePanel from "@/components/DualSourcePanel";
import ForecastTimeline, { ForecastPoint } from "@/components/ForecastTimeline";
import RegimeCard from "@/components/RegimeCard";
import ShapExplainer from "@/components/ShapExplainer";
import WhatIfSimulator from "@/components/WhatIfSimulator";
import DriftPanel from "@/components/DriftPanel";
import ModelTrustPanel from "@/components/ModelTrustPanel";
import ResponsibleAI from "@/components/ResponsibleAI";
import LiveGlobalSearch from "@/components/LiveGlobalSearch";
import { GeoLocation } from "@/lib/openweather";
import { CONTINENTS, COUNTRIES, STATES, CITIES, Continent, Country, StateRegion, City, Area, getArea } from "@/lib/locations";
import type { PredictResponse, ExplainResponse, DriftResponse } from "@/lib/aeropure-client";
import { buildForecastInput } from "@/lib/demo-inputs";

export default function HomePage() {
  type NavLevel = "earth" | "continent" | "country" | "state" | "city" | "area";
  const [navLevel, setNavLevel] = useState<NavLevel>("earth");
  const [selectedContinent, setSelectedContinent] = useState<Continent | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedState, setSelectedState] = useState<StateRegion | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [currentAreaObj, setCurrentAreaObj] = useState<Area | null>(null);
  const [liveLocation, setLiveLocation] = useState<GeoLocation | null>(null);

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
          temp: json.weather.main.temp,
          humidity: json.weather.main.humidity,
          windSpeed: json.weather.wind.speed,
          condition: json.weather.weather[0].main,
          description: json.weather.weather[0].description,
        });
        if (json.pollution && json.pollution.list && json.pollution.list.length > 0) {
          const p = json.pollution.list[0];
          setExternalPollution({
            aqi: p.main.aqi,
            co: p.components.co,
            no2: p.components.no2,
            o3: p.components.o3,
            so2: p.components.so2,
            pm2_5: p.components.pm2_5,
            pm10: p.components.pm10,
          });
        }
      } else {
        setWeatherState({ available: false, error: json.error });
      }
    } catch (e) {
      console.error(e);
      setWeatherState({ available: false, error: "Failed to fetch weather" });
    }
  }, []);

  const handleAreaSelection = useCallback(async (cSlug: string, aSlug: string) => {
    const area = getArea(cSlug, aSlug);
    if (!area) return;
    setCurrentAreaObj(area);
    setLiveLocation(null);
    setNavLevel("area");

    // Fetch Weather
    await fetchWeather(area.lat, area.lon);

    // Fetch AeroPure ML Intelligence via same-origin production API routes
    try {
      const baseInput = buildForecastInput(area, 0);

      const [predRes, expRes, driftRes, tlData] = await Promise.all([
        fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(baseInput),
        }).then((r) => (r.ok ? (r.json() as Promise<PredictResponse>) : null)),
        fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ citySlug: cSlug, areaSlug: area.slug }),
        }).then((r) => (r.ok ? (r.json() as Promise<ExplainResponse>) : null)),
        fetch("/api/drift").then((r) => (r.ok ? (r.json() as Promise<DriftResponse>) : null)),
        fetch("/api/forecast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ citySlug: cSlug, areaSlug: area.slug }),
        }).then((r) => (r.ok ? r.json() : null)),
      ]);

      if (predRes) setPrediction(predRes);
      if (expRes) setExplanation(expRes);
      if (driftRes) setDrift(driftRes);
      if (tlData?.timeline) setTimeline(tlData.timeline);
    } catch (err) {
      console.error("AeroPure ML API Error:", err);
      setPrediction(null);
      setExplanation(null);
      setTimeline([]);
    }
  }, [fetchWeather]);

  const handleLiveLocationSelection = useCallback(async (loc: GeoLocation) => {
    setLiveLocation(loc);
    setCurrentAreaObj(null);
    setNavLevel("area");
    
    // Scientifically rigorous: Never fabricate AeroPure predictions for unmonitored external domains
    setPrediction(null);
    setExplanation(null);
    setTimeline([]);
    setDrift(null);

    // Fetch genuine live meteorological and air quality observation telemetry
    await fetchWeather(loc.lat, loc.lon);
  }, [fetchWeather]);

  const handleContinentSelect = (continentId: string) => {
    const cont = CONTINENTS.find(c => c.id === continentId) || null;
    if (cont) {
      setSelectedContinent(cont);
      setNavLevel("continent");
    }
  };

  const handleCountrySelect = (countryId: string) => {
    const ctry = COUNTRIES.find(c => c.id === countryId) || null;
    if (ctry) {
      setSelectedCountry(ctry);
      setNavLevel("country");
    }
  };

  const handleStateSelect = (stateId: string) => {
    const st = STATES.find(s => s.id === stateId) || null;
    if (st) {
      setSelectedState(st);
      setNavLevel("state");
    }
  };

  const handleCitySelect = (citySlug: string) => {
    const c = CITIES.find(ci => ci.slug === citySlug) || null;
    if (c) {
      setSelectedCity(c);
      setNavLevel("city");
    }
  };

  const handleAreaSelect = (areaSlug: string) => {
    if (selectedCity) {
      const a = selectedCity.areas.find(ar => ar.slug === areaSlug) || null;
      if (a) {
        handleAreaSelection(selectedCity.slug, a.slug);
      }
    }
  };

  const renderBreadcrumbs = () => {
    const crumbs: { label: string; action?: () => void }[] = [
      { label: "EARTH", action: () => setNavLevel("earth") }
    ];
    if (selectedContinent) {
      crumbs.push({ label: selectedContinent.name.toUpperCase(), action: () => setNavLevel("continent") });
    }
    if (selectedCountry && navLevel !== "earth" && navLevel !== "continent") {
      crumbs.push({ label: selectedCountry.name.toUpperCase(), action: () => setNavLevel("country") });
    }
    if (selectedState && (navLevel === "state" || navLevel === "city" || navLevel === "area")) {
      crumbs.push({ label: selectedState.name.toUpperCase(), action: () => setNavLevel("state") });
    }
    if (selectedCity && (navLevel === "city" || navLevel === "area")) {
      crumbs.push({ label: selectedCity.name.toUpperCase(), action: () => setNavLevel("city") });
    }
    if (currentAreaObj && navLevel === "area") {
      crumbs.push({ label: currentAreaObj.name.toUpperCase() });
    }
    if (liveLocation && navLevel === "area") {
      crumbs.push({ label: liveLocation.name.toUpperCase() });
    }
    
    return (
      <div style={{ padding: "1rem 2rem", fontSize: "0.7rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)", letterSpacing: "0.1em", borderBottom: "1px solid var(--charcoal)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            {c.action ? (
              <span
                onClick={c.action}
                style={{ cursor: "pointer", color: i === crumbs.length - 1 ? "var(--air-white)" : "var(--silver)", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--air-white)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = i === crumbs.length - 1 ? "var(--air-white)" : "var(--silver)")}
              >
                {c.label}
              </span>
            ) : (
              <span style={{ color: "var(--air-white)", fontWeight: 700 }}>{c.label}</span>
            )}
            {i < crumbs.length - 1 && <span style={{ color: "var(--charcoal)" }}>/</span>}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {navLevel !== "earth" && navLevel !== "continent" && navLevel !== "country" && <Navbar />}

      <main style={{ flex: 1 }}>
        {navLevel !== "earth" && navLevel !== "continent" && navLevel !== "country" && renderBreadcrumbs()}
        {navLevel !== "earth" && navLevel !== "continent" && navLevel !== "country" && navLevel !== "area" && <LiveGlobalSearch onSelectLiveLocation={handleLiveLocationSelection} />}

        {/* GEOGRAPHIC INTELLIGENCE NAVIGATION */}
        {navLevel === "earth" && (
          <StampScrapbook onSelectContinent={handleContinentSelect} />
        )}

        {navLevel === "continent" && selectedContinent && (
          <ContinentArchiveView
            continent={selectedContinent}
            onSelectCountry={handleCountrySelect}
            onBackToEarth={() => setNavLevel("earth")}
            onSelectLiveLocation={handleLiveLocationSelection}
          />
        )}

        {navLevel === "country" && selectedCountry && (
          <RegionArchiveView 
            country={selectedCountry}
            continent={selectedContinent}
            regions={STATES.filter(s => s.countryId === selectedCountry.id)}
            onSelectRegion={handleStateSelect}
            onBackToContinent={() => setNavLevel("continent")}
            onBackToEarth={() => setNavLevel("earth")}
            onSelectLiveLocation={handleLiveLocationSelection}
          />
        )}

        {navLevel === "state" && selectedState && (
          <HoneycombSelector 
            title={`CITIES IN ${selectedState.name.toUpperCase()}`} 
            regions={CITIES.filter(c => c.stateId === selectedState.id).map(c => ({
              id: c.slug, name: c.name.toUpperCase(), status: "active"
            }))}
            onSelect={handleCitySelect}
          />
        )}

        {navLevel === "city" && selectedCity && (
          <HoneycombSelector 
            title={`AREAS IN ${selectedCity.name.toUpperCase()}`} 
            regions={selectedCity.areas.map(a => ({
              id: a.slug, name: a.name.toUpperCase(), status: "active"
            }))}
            onSelect={handleAreaSelect}
          />
        )}

        {navLevel === "area" && (currentAreaObj || liveLocation) && (
          <div style={{ padding: "0" }}>
            {/* Phase 7: Hero Map & Context */}
            {currentAreaObj && <AeroMap currentAreaObj={currentAreaObj} />}
            {liveLocation && <AeroMap currentAreaObj={{
              slug: liveLocation.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              name: liveLocation.name,
              lat: liveLocation.lat,
              lon: liveLocation.lon,
              defaultRegimeHint: 0
            }} />}

            <div style={{ padding: "3rem 2rem", maxWidth: "1400px", margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr", gap: "3rem" }}>
              <div>
                <button 
                  onClick={() => setNavLevel("earth")}
                  style={{
                    background: "transparent", border: "1px solid var(--steel)", color: "var(--silver)",
                    padding: "0.4rem 1rem", fontSize: "0.7rem", fontFamily: "JetBrains Mono, monospace",
                    cursor: "pointer", marginBottom: "2rem"
                  }}
                >
                  ← BACK TO GLOBAL EXPLORER
                </button>
                {/* Phase 8 & 9: Model Insights */}
                <h2 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "2rem", color: "var(--air-white)", marginBottom: "1rem" }}>
                  AEROPURE INTELLIGENCE
                </h2>
                {/* DualSourcePanel renders both if available, but handles nulls gracefully */}
                <DualSourcePanel 
                  prediction={prediction} 
                  externalPollution={externalPollution} 
                  weatherState={weatherState} 
                  onRetryWeather={() => fetchWeather(currentAreaObj?.lat || liveLocation?.lat || 0, currentAreaObj?.lon || liveLocation?.lon || 0)} 
                />

                {prediction ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                    <ForecastTimeline timeline={timeline} />
                    <RegimeCard regime={prediction.pollution_regime} />
                  </div>
                ) : (
                  <div style={{
                    padding: "2rem",
                    border: "1px solid var(--charcoal)",
                    background: "rgba(36,36,35,0.3)",
                    color: "var(--mist)",
                    fontFamily: "JetBrains Mono, monospace",
                    textAlign: "center"
                  }}>
                    AeroPure predictive modeling is unavailable for this location because compatible model inputs are insufficient.
                  </div>
                )}
              </div>
              
              <div>
                {prediction && (
                  <>
                    <WhatIfSimulator />
                    
                    {explanation && (
                      <div style={{ marginTop: "2rem" }}>
                        <ShapExplainer 
                          positiveContributors={explanation.top_positive_contributors}
                          negativeContributors={explanation.top_negative_contributors}
                          summary={explanation.explanation_summary}
                          baseValue={explanation.base_expected_value}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Governance & Trust */}
            <div style={{ background: "#111111", borderTop: "1px solid #333333", padding: "4rem 2rem" }}>
              <div style={{ maxWidth: "1400px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem" }}>
                {drift && (
                  <DriftPanel 
                    driftStatus={drift.drift_status}
                    meanPsi={drift.mean_psi}
                    retrainingFlagged={drift.retraining_flagged}
                    recommendation={drift.recommendation}
                    significantDriftFeatures={drift.significant_drift_features}
                    psiByFeature={drift.psi_by_feature}
                  />
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                  <ModelTrustPanel />
                  <ResponsibleAI />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
