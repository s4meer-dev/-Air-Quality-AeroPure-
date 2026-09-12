"use client";

import { useState, useMemo } from "react";
import {
  CONTINENTS,
  COUNTRIES,
  STATES,
  CITIES,
  Country,
  StateRegion,
  City,
  Area,
  getContinent,
  getCountriesForContinent,
  getCountry,
  getStatesForCountry,
  getState,
  getCitiesForState,
  getCity,
  searchGlobalLocation,
  GlobalSearchResult,
} from "@/lib/locations";
import StampScrapbookContinent from "@/components/StampScrapbookContinent";
import { Globe, ChevronRight, ArrowLeft, Search, MapPin } from "lucide-react";

export type GeographicLevel = 1 | 2 | 3 | 4 | 5;

interface Props {
  selectedCitySlug: string;
  selectedAreaSlug: string;
  onSelectFinalLocation: (citySlug: string, areaSlug: string) => void;
}

export default function GlobalGeospatialExplorer({
  selectedCitySlug,
  selectedAreaSlug,
  onSelectFinalLocation,
}: Props) {
  // Navigation level: 1=Earth/Continent, 2=Continent/Country, 3=Country/State, 4=State/City, 5=City/Area
  const [level, setLevel] = useState<GeographicLevel>(1);

  // Active selections
  const [activeContinentId, setActiveContinentId] = useState<string>("asia");
  const [activeCountryId, setActiveCountryId] = useState<string>("india");
  const [activeStateId, setActiveStateId] = useState<string>("telangana");
  const [activeCitySlug, setActiveCitySlug] = useState<string>(selectedCitySlug || "hyderabad");

  // Global search input & results dropdown
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchResults = useMemo(() => {
    return searchGlobalLocation(searchQuery);
  }, [searchQuery]);

  // Object lookups
  const activeContinent = useMemo(() => getContinent(activeContinentId) ?? CONTINENTS[0], [activeContinentId]);
  const activeCountry = useMemo(() => getCountry(activeCountryId) ?? COUNTRIES[0], [activeCountryId]);
  const activeState = useMemo(() => getState(activeStateId) ?? STATES[0], [activeStateId]);
  const activeCity = useMemo(() => getCity(activeCitySlug) ?? CITIES[0], [activeCitySlug]);

  // Current Level Options for Honeycomb Grids
  const currentCountries = useMemo(() => getCountriesForContinent(activeContinentId), [activeContinentId]);
  const currentStates = useMemo(() => getStatesForCountry(activeCountryId), [activeCountryId]);
  const currentCities = useMemo(() => getCitiesForState(activeStateId), [activeStateId]);
  const currentAreas = useMemo(() => activeCity.areas, [activeCity]);

  // Handlers for Level Navigation
  const handleSelectContinent = (continentId: string) => {
    setActiveContinentId(continentId);
    const countries = getCountriesForContinent(continentId);
    if (countries.length > 0) {
      setActiveCountryId(countries[0].id);
      const states = getStatesForCountry(countries[0].id);
      if (states.length > 0) {
        setActiveStateId(states[0].id);
        const cities = getCitiesForState(states[0].id);
        if (cities.length > 0) {
          setActiveCitySlug(cities[0].slug);
        }
      }
    }
    setLevel(2);
  };

  const handleSelectCountry = (country: Country) => {
    setActiveCountryId(country.id);
    const states = getStatesForCountry(country.id);
    if (states.length > 0) {
      setActiveStateId(states[0].id);
      const cities = getCitiesForState(states[0].id);
      if (cities.length > 0) {
        setActiveCitySlug(cities[0].slug);
      }
    }
    setLevel(3);
  };

  const handleSelectState = (st: StateRegion) => {
    setActiveStateId(st.id);
    const cities = getCitiesForState(st.id);
    if (cities.length > 0) {
      setActiveCitySlug(cities[0].slug);
    }
    setLevel(4);
  };

  const handleSelectCity = (city: City) => {
    setActiveCitySlug(city.slug);
    setLevel(5);
  };

  const handleSelectArea = (area: Area) => {
    onSelectFinalLocation(activeCitySlug, area.slug);
  };

  const handleBackOneLevel = () => {
    if (level > 1) {
      setLevel((prev) => (prev - 1) as GeographicLevel);
    }
  };

  // Direct Jump from Global Search
  const handleSearchResultClick = (res: GlobalSearchResult) => {
    setSearchQuery("");
    setIsSearchFocused(false);

    if (res.type === "continent") {
      setActiveContinentId(res.continentId);
      setLevel(2);
    } else if (res.type === "country" && res.countryId) {
      setActiveContinentId(res.continentId);
      setActiveCountryId(res.countryId);
      setLevel(3);
    } else if (res.type === "state" && res.countryId && res.stateId) {
      setActiveContinentId(res.continentId);
      setActiveCountryId(res.countryId);
      setActiveStateId(res.stateId);
      setLevel(4);
    } else if (res.type === "city" && res.citySlug && res.countryId && res.stateId) {
      setActiveContinentId(res.continentId);
      setActiveCountryId(res.countryId);
      setActiveStateId(res.stateId);
      setActiveCitySlug(res.citySlug);
      setLevel(5);
    } else if (res.type === "area" && res.citySlug && res.areaSlug && res.countryId && res.stateId) {
      setActiveContinentId(res.continentId);
      setActiveCountryId(res.countryId);
      setActiveStateId(res.stateId);
      setActiveCitySlug(res.citySlug);
      onSelectFinalLocation(res.citySlug, res.areaSlug);
      setLevel(5);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* ── GLOBAL HIERARCHY BREADCRUMB HEADER ─────────────────────────────── */}
      <div
        style={{
          background: "rgba(14, 14, 14, 0.95)",
          border: "1px solid var(--border-default)",
          borderRadius: 4,
          padding: "0.85rem 1.4rem",
          marginBottom: "1.2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        {/* Step-by-Step Monospace Breadcrumb Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.4rem",
            fontSize: "0.72rem",
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          <button
            onClick={() => setLevel(1)}
            style={{
              background: level === 1 ? "rgba(255, 255, 255, 0.08)" : "transparent",
              border: level === 1 ? "1px solid rgba(255, 255, 255, 0.3)" : "none",
              color: level === 1 ? "var(--air-white)" : "var(--silver)",
              cursor: "pointer",
              padding: "0.25rem 0.6rem",
              borderRadius: 2,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              letterSpacing: "0.08em",
            }}
          >
            <Globe size={13} color="var(--air-white)" /> EARTH
          </button>

          {level >= 2 && (
            <>
              <ChevronRight size={11} color="var(--steel)" />
              <button
                onClick={() => setLevel(2)}
                style={{
                  background: level === 2 ? "rgba(255, 255, 255, 0.08)" : "transparent",
                  border: level === 2 ? "1px solid rgba(255, 255, 255, 0.3)" : "none",
                  color: level === 2 ? "var(--air-white)" : "var(--silver)",
                  cursor: "pointer",
                  padding: "0.25rem 0.6rem",
                  borderRadius: 2,
                  fontWeight: 700,
                }}
              >
                {activeContinent.name.toUpperCase()}
              </button>
            </>
          )}

          {level >= 3 && (
            <>
              <ChevronRight size={11} color="var(--steel)" />
              <button
                onClick={() => setLevel(3)}
                style={{
                  background: level === 3 ? "rgba(255, 255, 255, 0.08)" : "transparent",
                  border: level === 3 ? "1px solid rgba(255, 255, 255, 0.3)" : "none",
                  color: level === 3 ? "var(--air-white)" : "var(--silver)",
                  cursor: "pointer",
                  padding: "0.25rem 0.6rem",
                  borderRadius: 2,
                  fontWeight: 700,
                }}
              >
                {activeCountry.name.toUpperCase()}
              </button>
            </>
          )}

          {level >= 4 && (
            <>
              <ChevronRight size={11} color="var(--steel)" />
              <button
                onClick={() => setLevel(4)}
                style={{
                  background: level === 4 ? "rgba(255, 255, 255, 0.08)" : "transparent",
                  border: level === 4 ? "1px solid rgba(255, 255, 255, 0.3)" : "none",
                  color: level === 4 ? "var(--air-white)" : "var(--silver)",
                  cursor: "pointer",
                  padding: "0.25rem 0.6rem",
                  borderRadius: 2,
                  fontWeight: 700,
                }}
              >
                {activeState.name.toUpperCase()}
              </button>
            </>
          )}

          {level >= 5 && (
            <>
              <ChevronRight size={11} color="var(--steel)" />
              <button
                onClick={() => setLevel(5)}
                style={{
                  background: level === 5 ? "rgba(255, 255, 255, 0.08)" : "transparent",
                  border: level === 5 ? "1px solid rgba(255, 255, 255, 0.3)" : "none",
                  color: level === 5 ? "var(--air-white)" : "var(--silver)",
                  cursor: "pointer",
                  padding: "0.25rem 0.6rem",
                  borderRadius: 2,
                  fontWeight: 700,
                }}
              >
                {activeCity.name.toUpperCase()}
              </button>
            </>
          )}
        </div>

        {/* Global Search Bar */}
        <div style={{ position: "relative", minWidth: 260 }}>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Search Location (City, Area, Country)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              style={{
                background: "rgba(10, 10, 10, 0.95)",
                border: "1px solid var(--border-default)",
                borderRadius: 2,
                padding: "0.45rem 0.8rem 0.45rem 2rem",
                color: "var(--air-white)",
                fontSize: "0.74rem",
                fontFamily: "JetBrains Mono, monospace",
                width: "100%",
                outline: "none",
              }}
            />
            <Search size={12} color="var(--silver)" style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)" }} />
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchFocused && searchResults.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "105%",
                left: 0,
                right: 0,
                background: "#121212",
                border: "1px solid var(--border-strong)",
                borderRadius: 3,
                boxShadow: "0 15px 40px rgba(0,0,0,0.9)",
                zIndex: 100,
                maxHeight: 280,
                overflowY: "auto",
                padding: "0.4rem",
              }}
            >
              {searchResults.map((res, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSearchResultClick(res)}
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: 2,
                    cursor: "pointer",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    transition: "background 0.2s ease",
                  }}
                  className="search-item"
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--air-white)" }}>
                      {res.title}
                    </span>
                    <span style={{ fontSize: "0.6rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)", textTransform: "uppercase" }}>
                      {res.type}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.68rem", color: "var(--silver)" }}>{res.subtitle}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── LEVEL 1: CONTINENT SELECTION (STAMP SCRAPBOOK) ────────────────── */}
      {level === 1 && (
        <StampScrapbookContinent onSelectContinent={handleSelectContinent} />
      )}

      {/* ── LEVELS 2-5: HONEYCOMB INTERACTION GRID ───────────────────────── */}
      {level > 1 && (
        <div
          style={{
            background: "#090909",
            border: "1px solid var(--border-default)",
            borderRadius: 4,
            padding: "1.8rem",
            marginBottom: "2.5rem",
            position: "relative",
            boxShadow: "0 20px 60px rgba(0,0,0,0.85)",
          }}
        >
          {/* Section Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "1.5rem",
              borderBottom: "1px solid var(--border-default)",
              paddingBottom: "1rem",
            }}
          >
            <div>
              <span style={{ fontSize: "0.68rem", fontFamily: "JetBrains Mono, monospace", color: "var(--silver)", fontWeight: 700, letterSpacing: "0.1em" }}>
                LEVEL {level} — {level === 2 ? "COUNTRY SELECTION" : level === 3 ? "STATE / REGION INDEX" : level === 4 ? "CITY SELECTOR" : "LOCALITY ZONE SELECTOR"}
              </span>
              <h2
                style={{
                  fontFamily: "Orbitron, sans-serif",
                  fontSize: "1.35rem",
                  fontWeight: 900,
                  color: "var(--air-white)",
                  margin: "0.2rem 0 0 0",
                  letterSpacing: "0.06em",
                }}
              >
                {level === 2
                  ? `${activeContinent.name.toUpperCase()} — SELECT COUNTRY`
                  : level === 3
                  ? `${activeCountry.name.toUpperCase()} — SELECT STATE / UT`
                  : level === 4
                  ? `${activeState.name.toUpperCase()} — SELECT CITY`
                  : `${activeCity.name.toUpperCase()} — SELECT AREA / LOCALITY`}
              </h2>
            </div>

            <button
              onClick={handleBackOneLevel}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-default)",
                color: "var(--air-white)",
                padding: "0.4rem 0.85rem",
                borderRadius: 2,
                fontSize: "0.72rem",
                fontFamily: "JetBrains Mono, monospace",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                letterSpacing: "0.06em",
              }}
            >
              <ArrowLeft size={12} /> BACK TO LEVEL {level - 1}
            </button>
          </div>

          {/* Honeycomb Grid Container */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "1.2rem 0.8rem",
              padding: "0.8rem 0",
            }}
          >
            {/* LEVEL 2: COUNTRIES */}
            {level === 2 &&
              currentCountries.map((country) => {
                const isSelected = country.id === activeCountryId;

                return (
                  <div
                    key={country.id}
                    onClick={() => handleSelectCountry(country)}
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "1 / 1.15",
                      clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                      background: isSelected
                        ? "var(--air-white)"
                        : "var(--charcoal)",
                      color: isSelected ? "var(--void)" : "var(--air-white)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0.9rem 0.5rem",
                      textAlign: "center",
                      transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                      boxShadow: isSelected ? "0 0 20px rgba(255, 255, 255, 0.28)" : "none",
                    }}
                    className="honeycomb-hex"
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 2,
                        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                        border: isSelected ? "2px solid #070707" : "1px solid rgba(255, 255, 255, 0.14)",
                        pointerEvents: "none",
                      }}
                    />
                    <span style={{ fontSize: "0.58rem", fontFamily: "JetBrains Mono, monospace", color: isSelected ? "#070707" : "var(--silver)", fontWeight: 800 }}>
                      {country.code}
                    </span>
                    <h4 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "0.82rem", fontWeight: 800, color: isSelected ? "#070707" : "var(--air-white)", margin: "0.15rem 0" }}>
                      {country.name}
                    </h4>
                    <span style={{ fontSize: "0.55rem", fontFamily: "JetBrains Mono, monospace", color: isSelected ? "#333333" : "var(--steel)" }}>
                      {country.stateCount} REGIONS
                    </span>
                  </div>
                );
              })}

            {/* LEVEL 3: STATES / REGIONS */}
            {level === 3 &&
              currentStates.map((st) => {
                const isSelected = st.id === activeStateId;

                return (
                  <div
                    key={st.id}
                    onClick={() => handleSelectState(st)}
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "1 / 1.15",
                      clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                      background: isSelected
                        ? "var(--air-white)"
                        : "var(--charcoal)",
                      color: isSelected ? "var(--void)" : "var(--air-white)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0.9rem 0.5rem",
                      textAlign: "center",
                      transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                      boxShadow: isSelected ? "0 0 20px rgba(255, 255, 255, 0.28)" : "none",
                    }}
                    className="honeycomb-hex"
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 2,
                        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                        border: isSelected ? "2px solid #070707" : "1px solid rgba(255, 255, 255, 0.14)",
                        pointerEvents: "none",
                      }}
                    />
                    <span style={{ fontSize: "0.58rem", fontFamily: "JetBrains Mono, monospace", color: isSelected ? "#070707" : "var(--silver)", fontWeight: 800 }}>
                      {st.code}
                    </span>
                    <h4 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "0.82rem", fontWeight: 800, color: isSelected ? "#070707" : "var(--air-white)", margin: "0.15rem 0" }}>
                      {st.name}
                    </h4>
                    <span style={{ fontSize: "0.55rem", fontFamily: "JetBrains Mono, monospace", color: isSelected ? "#333333" : "var(--steel)" }}>
                      {st.cityCount} CITIES
                    </span>
                  </div>
                );
              })}

            {/* LEVEL 4: CITIES */}
            {level === 4 &&
              currentCities.map((city) => {
                const isSelected = city.slug === activeCitySlug;

                return (
                  <div
                    key={city.slug}
                    onClick={() => handleSelectCity(city)}
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "1 / 1.15",
                      clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                      background: isSelected
                        ? "var(--air-white)"
                        : city.isCapital
                        ? "var(--graphite)"
                        : "var(--charcoal)",
                      color: isSelected ? "var(--void)" : "var(--air-white)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0.9rem 0.5rem",
                      textAlign: "center",
                      transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                      boxShadow: isSelected ? "0 0 20px rgba(255, 255, 255, 0.28)" : "none",
                    }}
                    className="honeycomb-hex"
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 2,
                        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                        border: isSelected ? "2px solid #070707" : "1px solid rgba(255, 255, 255, 0.14)",
                        pointerEvents: "none",
                      }}
                    />
                    <span style={{ fontSize: "0.55rem", fontFamily: "JetBrains Mono, monospace", color: isSelected ? "#070707" : "var(--silver)", fontWeight: 700 }}>
                      {city.isCapital ? "CAPITAL" : "METRO"}
                    </span>
                    <h4 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "0.82rem", fontWeight: 800, color: isSelected ? "#070707" : "var(--air-white)", margin: "0.15rem 0" }}>
                      {city.name}
                    </h4>
                    <span style={{ fontSize: "0.55rem", fontFamily: "JetBrains Mono, monospace", color: isSelected ? "#333333" : "var(--steel)" }}>
                      {city.areas.length} LOCALITIES
                    </span>
                  </div>
                );
              })}

            {/* LEVEL 5: LOCALITY AREAS */}
            {level === 5 &&
              currentAreas.map((area) => {
                const isSelectedArea = area.slug === selectedAreaSlug;

                return (
                  <div
                    key={area.slug}
                    onClick={() => handleSelectArea(area)}
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "1 / 1.15",
                      clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                      background: isSelectedArea
                        ? "var(--air-white)"
                        : "var(--charcoal)",
                      color: isSelectedArea ? "var(--void)" : "var(--air-white)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0.9rem 0.5rem",
                      textAlign: "center",
                      transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                      boxShadow: isSelectedArea ? "0 0 20px rgba(255, 255, 255, 0.28)" : "none",
                    }}
                    className="honeycomb-hex"
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 2,
                        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                        border: isSelectedArea
                          ? "2px solid #070707"
                          : "1px solid rgba(255, 255, 255, 0.14)",
                        pointerEvents: "none",
                      }}
                    />
                    <MapPin size={13} color={isSelectedArea ? "#070707" : "var(--silver)"} style={{ marginBottom: "0.15rem" }} />
                    <h4 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "0.8rem", fontWeight: 800, color: isSelectedArea ? "#070707" : "var(--air-white)", margin: "0 0 0.15rem 0" }}>
                      {area.name}
                    </h4>
                    <span style={{ fontSize: "0.58rem", fontFamily: "JetBrains Mono, monospace", color: isSelectedArea ? "#333333" : "var(--silver)" }}>
                      {area.lat.toFixed(2)}°N, {area.lon.toFixed(2)}°E
                    </span>
                    <span style={{ fontSize: "0.55rem", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: isSelectedArea ? "#070707" : "var(--steel)", marginTop: "0.25rem", letterSpacing: "0.06em" }}>
                      {isSelectedArea ? "ACTIVE ZONE" : "MONITORED"}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Embedded CSS for Hex Hover Effects */}
      <style jsx>{`
        .honeycomb-hex:hover {
          transform: scale(1.05);
          background: var(--silver) !important;
          color: #070707 !important;
          z-index: 10;
        }
        .honeycomb-hex:hover h4,
        .honeycomb-hex:hover span {
          color: #070707 !important;
        }
        .search-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
}
