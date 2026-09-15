"use client";

import { useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import StampScrapbook from "@/components/StampScrapbook";
import ContinentArchiveView from "@/components/ContinentArchiveView";
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
import { aeropureClient, PredictResponse, ExplainResponse, DriftResponse } from "@/lib/aeropure-client";
import { buildForecastInput, FORECAST_OFFSETS } from "@/lib/demo-inputs";

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

    // Fetch AeroPure ML Intelligence
    try {
      const baseInput = buildForecastInput(area, 0);
      const predRes = await aeropureClient.predict(baseInput);
      setPrediction(predRes);

      const expRes = await aeropureClient.explain(baseInput);
      setExplanation(expRes);

      const driftRes = await aeropureClient.drift();
      setDrift(driftRes);

      // Fetch Timeline (24h to 120h)
      const tl = await Promise.all(
        FORECAST_OFFSETS.map(async (offset) => {
          const inp = buildForecastInput(area, offset);
          const r = await aeropureClient.predict(inp);
          return {
            hourOffset: offset,
            predicted_aqi_proxy: r.predicted_aqi_proxy,
            hazard_probability: r.hazard_probability,
            hazardous: r.hazardous,
            risk_category: r.risk_category,
            label: `+${offset}h`,
            time: new Date(Date.now() + offset * 3600000).toISOString()
          };
        })
      );
      setTimeline(tl);
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
    
    await fetchWeather(loc.lat, loc.lon);

    try {
      // Mock an Area object for the inputs since the model needs lat/lon/elevation/etc.
      // We assume elevation=0 or something generic since we don't have it.
      const pseudoArea: Area = {
        slug: loc.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name: loc.name,
        lat: loc.lat,
        lon: loc.lon,
        defaultRegimeHint: 0
      };
      
      const baseInput = buildForecastInput(pseudoArea, 0);
      const predRes = await aeropureClient.predict(baseInput);
      setPrediction(predRes);

      const expRes = await aeropureClient.explain(baseInput);
      setExplanation(expRes);

      const driftRes = await aeropureClient.drift();
      setDrift(driftRes);

      const tl = await Promise.all(
        FORECAST_OFFSETS.map(async (offset) => {
          const inp = buildForecastInput(pseudoArea, offset);
          const r = await aeropureClient.predict(inp);
          return {
            hourOffset: offset,
            predicted_aqi_proxy: r.predicted_aqi_proxy,
            hazard_probability: r.hazard_probability,
            hazardous: r.hazardous,
            risk_category: r.risk_category,
            label: `+${offset}h`,
            time: new Date(Date.now() + offset * 3600000).toISOString()
          };
        })
      );
      setTimeline(tl);
    } catch (err) {
      console.error("AeroPure ML API Error for Live Location:", err);
      setPrediction(null);
      setExplanation(null);
      setTimeline([]);
    }
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
    const crumbs = ["EARTH"];
    if (selectedContinent) crumbs.push(selectedContinent.name.toUpperCase());
    if (selectedCountry && navLevel !== "earth" && navLevel !== "continent") crumbs.push(selectedCountry.name.toUpperCase());
    if (selectedState && (navLevel === "state" || navLevel === "city" || navLevel === "area")) crumbs.push(selectedState.name.toUpperCase());
    if (selectedCity && (navLevel === "city" || navLevel === "area")) crumbs.push(selectedCity.name.toUpperCase());
    if (currentAreaObj && navLevel === "area") crumbs.push(currentAreaObj.name.toUpperCase());
    if (liveLocation && navLevel === "area") crumbs.push(liveLocation.name.toUpperCase());
    
    return (
      <div style={{ padding: "1rem 2rem", fontSize: "0.7rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)", letterSpacing: "0.1em", borderBottom: "1px solid var(--charcoal)" }}>
        {crumbs.join(" / ")}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {navLevel !== "earth" && navLevel !== "continent" && <Navbar />}

      <main style={{ flex: 1 }}>
        {navLevel !== "earth" && navLevel !== "continent" && renderBreadcrumbs()}
        {navLevel !== "earth" && navLevel !== "continent" && navLevel !== "area" && <LiveGlobalSearch onSelectLiveLocation={handleLiveLocationSelection} />}

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
          <HoneycombSelector 
            title={`REGIONS IN ${selectedCountry.name.toUpperCase()}`} 
            regions={STATES.filter(s => s.countryId === selectedCountry.id).map(s => ({
              id: s.id, name: s.name.toUpperCase(), status: "active"
            }))}
            onSelect={handleStateSelect}
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
