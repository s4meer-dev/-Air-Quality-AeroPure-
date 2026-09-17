"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { 
  Search, 
  Layers, 
  BarChart3, 
  Activity, 
  Leaf, 
  Globe, 
  Target, 
  Plus, 
  X,
  Radio
} from "lucide-react";
import { Continent, COUNTRIES, STATES, CITIES } from "@/lib/locations";
import { GeoLocation } from "@/lib/openweather";

export type CountryStatus = "aeropure-active" | "live-telemetry" | "coming-soon";

export interface HexNode {
  name: string;
  id?: string;
  lat?: number;
  lon?: number;
  countryCode?: string;
  status: CountryStatus;
  image?: string;
  isAction?: boolean;
}

interface ContinentConfig {
  id: string;
  name: string;
  index: string;
  coordinates: string;
  quote: string;
  editorialTags: string[];
  reliefMap: string;
  wildlifeVisual?: string;
  polaroidPhoto?: string;
  polaroidCaption?: string[];
  rows: HexNode[][];
  directoryCountries?: { name: string; status: CountryStatus; lat?: number; lon?: number; id?: string; code?: string }[];
}

// ── PROGRAMMATIC CONTINENT CONFIGS & COUNTRY CAPABILITY REGISTRY ─────────────────

const CONTINENT_CONFIGS: Record<string, ContinentConfig> = {
  "north-america": {
    id: "north-america",
    name: "NORTH AMERICA",
    index: "04",
    coordinates: "54.5260° N\n105.2551° W",
    quote: '"Jet-stream tracking from arctic borders to gulf shores."',
    editorialTags: ["PACIFIC BASINS", "BOREAL", "GREAT PLAINS", "JET STREAM", "RESEARCH"],
    reliefMap: "/continents/north_america_map_relief.jpg",
    wildlifeVisual: "/continents/north_america_ambient.jpg",
    polaroidPhoto: "/stamps/north-america.jpg",
    polaroidCaption: ["NORTH AMERICA", "BOREAL & PACIFIC", "JET STREAM"],
    rows: [
      [
        { name: "CANADA", id: "canada", status: "aeropure-active", image: "/continents/north_america_ambient.jpg" },
        { name: "UNITED STATES", id: "united-states", status: "aeropure-active", image: "/regions/golden_gate_fog.jpg" },
        { name: "MEXICO", status: "live-telemetry", lat: 23.6345, lon: -102.5528, countryCode: "MX" },
      ],
      [
        { name: "CUBA", status: "live-telemetry", lat: 21.5218, lon: -77.7812, countryCode: "CU" },
        { name: "GUATEMALA", status: "live-telemetry", lat: 15.7835, lon: -90.2308, countryCode: "GT" },
        { name: "PANAMA", status: "live-telemetry", lat: 8.538, lon: -80.7821, countryCode: "PA" },
        { name: "COSTA RICA", status: "live-telemetry", lat: 9.7489, lon: -83.7534, countryCode: "CR" },
      ],
      [
        { name: "JAMAICA", status: "live-telemetry", lat: 18.1096, lon: -77.2975, countryCode: "JM" },
        { name: "HONDURAS", status: "live-telemetry", lat: 15.2, lon: -86.2419, countryCode: "HN" },
        { name: "DOMINICAN REP", status: "live-telemetry", lat: 18.7357, lon: -70.1627, countryCode: "DO" },
      ],
      [
        { name: "ALL COUNTRIES", isAction: true, status: "coming-soon" },
      ],
    ],
    directoryCountries: [
      { name: "CANADA", id: "canada", status: "aeropure-active" },
      { name: "UNITED STATES", id: "united-states", status: "aeropure-active" },
      { name: "MEXICO", status: "live-telemetry", lat: 23.6345, lon: -102.5528, code: "MX" },
      { name: "CUBA", status: "live-telemetry", lat: 21.5218, lon: -77.7812, code: "CU" },
      { name: "GUATEMALA", status: "live-telemetry", lat: 15.7835, lon: -90.2308, code: "GT" },
      { name: "PANAMA", status: "live-telemetry", lat: 8.538, lon: -80.7821, code: "PA" },
      { name: "COSTA RICA", status: "live-telemetry", lat: 9.7489, lon: -83.7534, code: "CR" },
      { name: "JAMAICA", status: "live-telemetry", lat: 18.1096, lon: -77.2975, code: "JM" },
      { name: "HONDURAS", status: "live-telemetry", lat: 15.2, lon: -86.2419, code: "HN" },
      { name: "DOMINICAN REP", status: "live-telemetry", lat: 18.7357, lon: -70.1627, code: "DO" },
      { name: "BAHAMAS", status: "live-telemetry", lat: 25.0343, lon: -77.3963, code: "BS" },
      { name: "BELIZE", status: "live-telemetry", lat: 17.1899, lon: -88.4976, code: "BZ" },
      { name: "EL SALVADOR", status: "live-telemetry", lat: 13.7942, lon: -88.8965, code: "SV" },
      { name: "NICARAGUA", status: "live-telemetry", lat: 12.8654, lon: -85.2072, code: "NI" },
      { name: "HAITI", status: "live-telemetry", lat: 18.9712, lon: -72.2852, code: "HT" },
      { name: "TRINIDAD", status: "live-telemetry", lat: 10.6918, lon: -61.2225, code: "TT" },
      { name: "BARBADOS", status: "live-telemetry", lat: 13.1939, lon: -59.5432, code: "BB" },
      { name: "SAINT LUCIA", status: "live-telemetry", lat: 13.9094, lon: -60.9789, code: "LC" },
      { name: "GRENADA", status: "live-telemetry", lat: 12.1165, lon: -61.679, code: "GD" },
      { name: "ANTIGUA", status: "live-telemetry", lat: 17.0608, lon: -61.7964, code: "AG" },
      { name: "DOMINICA", status: "live-telemetry", lat: 15.415, lon: -61.371, code: "DM" },
      { name: "GREENLAND", status: "coming-soon" },
    ],
  },
  africa: {
    id: "africa",
    name: "AFRICA",
    index: "01",
    coordinates: "8.7832° N\n34.5085° E",
    quote: '"A healthier Africa for a brighter world."',
    editorialTags: ["PEOPLE", "LANDSCAPES", "CULTURE", "CLEANER AIR", "BRIGHTER TOMORROWS"],
    reliefMap: "/continents/africa_map_relief.jpg",
    wildlifeVisual: "/continents/africa_wildlife_elephant.jpg",
    polaroidPhoto: "/continents/africa_savannah_card.jpg",
    polaroidCaption: ["AFRICA", "A CLEANER", "TOMORROW"],
    rows: [
      [
        { name: "MOROCCO", status: "live-telemetry", lat: 31.7917, lon: -7.0926, countryCode: "MA", image: "/continents/morocco_casablanca.jpg" },
        { name: "ALGERIA", status: "live-telemetry", lat: 28.0339, lon: 1.6596, countryCode: "DZ" },
        { name: "TUNISIA", status: "live-telemetry", lat: 33.8869, lon: 9.5375, countryCode: "TN" },
        { name: "LIBYA", status: "live-telemetry", lat: 26.3351, lon: 17.2283, countryCode: "LY" },
        { name: "EGYPT", id: "egypt", status: "aeropure-active", image: "/continents/egypt_pyramids.jpg" },
      ],
      [
        { name: "MAURITANIA", status: "live-telemetry", lat: 21.0079, lon: -10.9408, countryCode: "MR" },
        { name: "MALI", status: "live-telemetry", lat: 17.5707, lon: -3.9962, countryCode: "ML" },
        { name: "NIGER", status: "live-telemetry", lat: 17.6078, lon: 8.0817, countryCode: "NE" },
        { name: "CHAD", status: "live-telemetry", lat: 15.4542, lon: 18.7322, countryCode: "TD" },
        { name: "SUDAN", status: "live-telemetry", lat: 12.8628, lon: 30.2176, countryCode: "SD" },
        { name: "ETHIOPIA", status: "live-telemetry", lat: 9.145, lon: 40.4897, countryCode: "ET" },
      ],
      [
        { name: "NIGERIA", status: "live-telemetry", lat: 9.082, lon: 8.6753, countryCode: "NG" },
        { name: "GHANA", status: "live-telemetry", lat: 7.9465, lon: -1.0232, countryCode: "GH" },
        { name: "CAMEROON", status: "live-telemetry", lat: 7.3697, lon: 12.3547, countryCode: "CM" },
        { name: "DRC", status: "live-telemetry", lat: -4.0383, lon: 21.7587, countryCode: "CD" },
        { name: "KENYA", status: "live-telemetry", lat: -0.0236, lon: 37.9062, countryCode: "KE" },
        { name: "TANZANIA", status: "live-telemetry", lat: -6.369, lon: 34.8888, countryCode: "TZ" },
      ],
      [
        { name: "ANGOLA", status: "live-telemetry", lat: -11.2027, lon: 17.8739, countryCode: "AO" },
        { name: "ZAMBIA", status: "live-telemetry", lat: -13.1339, lon: 27.8493, countryCode: "ZM" },
        { name: "ZIMBABWE", status: "live-telemetry", lat: -19.0154, lon: 29.1549, countryCode: "ZW" },
        { name: "BOTSWANA", status: "live-telemetry", lat: -22.3285, lon: 24.6849, countryCode: "BW" },
        { name: "SOUTH AFRICA", id: "south-africa", status: "aeropure-active", image: "/continents/table_mountain.jpg" },
        { name: "MORE COUNTRIES", isAction: true, status: "coming-soon" },
      ],
    ],
    directoryCountries: [
      { name: "EGYPT", id: "egypt", status: "aeropure-active" },
      { name: "SOUTH AFRICA", id: "south-africa", status: "aeropure-active" },
      { name: "MOROCCO", status: "live-telemetry", lat: 31.7917, lon: -7.0926, code: "MA" },
      { name: "ALGERIA", status: "live-telemetry", lat: 28.0339, lon: 1.6596, code: "DZ" },
      { name: "TUNISIA", status: "live-telemetry", lat: 33.8869, lon: 9.5375, code: "TN" },
      { name: "LIBYA", status: "live-telemetry", lat: 26.3351, lon: 17.2283, code: "LY" },
      { name: "NIGERIA", status: "live-telemetry", lat: 9.082, lon: 8.6753, code: "NG" },
      { name: "KENYA", status: "live-telemetry", lat: -0.0236, lon: 37.9062, code: "KE" },
      { name: "GHANA", status: "live-telemetry", lat: 7.9465, lon: -1.0232, code: "GH" },
      { name: "ETHIOPIA", status: "live-telemetry", lat: 9.145, lon: 40.4897, code: "ET" },
      { name: "TANZANIA", status: "live-telemetry", lat: -6.369, lon: 34.8888, code: "TZ" },
      { name: "UGANDA", status: "live-telemetry", lat: 1.3733, lon: 32.2903, code: "UG" },
      { name: "SENEGAL", status: "live-telemetry", lat: 14.4974, lon: -14.4524, code: "SN" },
      { name: "RWANDA", status: "live-telemetry", lat: -1.9403, lon: 29.8739, code: "RW" },
      { name: "IVORY COAST", status: "live-telemetry", lat: 7.54, lon: -5.5471, code: "CI" },
      { name: "CAMEROON", status: "live-telemetry", lat: 7.3697, lon: 12.3547, code: "CM" },
      { name: "ANGOLA", status: "live-telemetry", lat: -11.2027, lon: 17.8739, code: "AO" },
      { name: "ZAMBIA", status: "live-telemetry", lat: -13.1339, lon: 27.8493, code: "ZM" },
      { name: "ZIMBABWE", status: "live-telemetry", lat: -19.0154, lon: 29.1549, code: "ZW" },
      { name: "BOTSWANA", status: "live-telemetry", lat: -22.3285, lon: 24.6849, code: "BW" },
      { name: "NAMIBIA", status: "live-telemetry", lat: -22.9576, lon: 18.4904, code: "NA" },
      { name: "MOZAMBIQUE", status: "live-telemetry", lat: -18.6657, lon: 35.5296, code: "MZ" },
      { name: "MADAGASCAR", status: "coming-soon" },
    ],
  },
  europe: {
    id: "europe",
    name: "EUROPE",
    index: "03",
    coordinates: "54.5260° N\n15.2551° E",
    quote: '"Pioneering continental standards for atmospheric clarity."',
    editorialTags: ["ALPINE WINDS", "MARITIME", "CORRIDORS", "EMISSION CAPS", "ARCHIVE"],
    reliefMap: "/continents/europe_ambient.jpg",
    polaroidPhoto: "/stamps/europe.jpg",
    polaroidCaption: ["EUROPE", "ALPINE BASINS", "CLEAN HORIZONS"],
    rows: [
      [
        { name: "UNITED KINGDOM", id: "united-kingdom", status: "aeropure-active", image: "/continents/europe_ambient.jpg" },
        { name: "FRANCE", id: "france", status: "aeropure-active", image: "/stamps/europe.jpg" },
        { name: "GERMANY", id: "germany", status: "aeropure-active", image: "/stamps/geo_europe.jpg" },
      ],
      [
        { name: "IRELAND", status: "live-telemetry", lat: 53.1424, lon: -7.6921, countryCode: "IE" },
        { name: "SPAIN", status: "live-telemetry", lat: 40.4637, lon: -3.7492, countryCode: "ES" },
        { name: "ITALY", status: "live-telemetry", lat: 41.8719, lon: 12.5674, countryCode: "IT" },
        { name: "POLAND", status: "live-telemetry", lat: 51.9194, lon: 19.1451, countryCode: "PL" },
      ],
      [
        { name: "NETHERLANDS", status: "live-telemetry", lat: 52.1326, lon: 5.2913, countryCode: "NL" },
        { name: "SWEDEN", status: "live-telemetry", lat: 60.1282, lon: 18.6435, countryCode: "SE" },
        { name: "NORWAY", status: "live-telemetry", lat: 60.472, lon: 8.4689, countryCode: "NO" },
      ],
      [
        { name: "ALL COUNTRIES", isAction: true, status: "coming-soon" },
      ],
    ],
    directoryCountries: [
      { name: "GERMANY", id: "germany", status: "aeropure-active" },
      { name: "UNITED KINGDOM", id: "united-kingdom", status: "aeropure-active" },
      { name: "FRANCE", id: "france", status: "aeropure-active" },
      { name: "IRELAND", status: "live-telemetry", lat: 53.1424, lon: -7.6921, code: "IE" },
      { name: "SPAIN", status: "live-telemetry", lat: 40.4637, lon: -3.7492, code: "ES" },
      { name: "ITALY", status: "live-telemetry", lat: 41.8719, lon: 12.5674, code: "IT" },
      { name: "POLAND", status: "live-telemetry", lat: 51.9194, lon: 19.1451, code: "PL" },
      { name: "NETHERLANDS", status: "live-telemetry", lat: 52.1326, lon: 5.2913, code: "NL" },
      { name: "SWEDEN", status: "live-telemetry", lat: 60.1282, lon: 18.6435, code: "SE" },
      { name: "NORWAY", status: "live-telemetry", lat: 60.472, lon: 8.4689, code: "NO" },
      { name: "SWITZERLAND", status: "live-telemetry", lat: 46.8182, lon: 8.2275, code: "CH" },
      { name: "AUSTRIA", status: "live-telemetry", lat: 47.5162, lon: 14.5501, code: "AT" },
      { name: "BELGIUM", status: "live-telemetry", lat: 50.5039, lon: 4.4699, code: "BE" },
      { name: "PORTUGAL", status: "live-telemetry", lat: 39.3999, lon: -8.2245, code: "PT" },
      { name: "GREECE", status: "live-telemetry", lat: 39.0742, lon: 21.8243, code: "GR" },
      { name: "DENMARK", status: "live-telemetry", lat: 56.2639, lon: 9.5018, code: "DK" },
      { name: "FINLAND", status: "live-telemetry", lat: 61.9241, lon: 25.7482, code: "FI" },
      { name: "CZECHIA", status: "live-telemetry", lat: 49.8175, lon: 15.473, code: "CZ" },
      { name: "HUNGARY", status: "live-telemetry", lat: 47.1625, lon: 19.5033, code: "HU" },
      { name: "ICELAND", status: "coming-soon" },
    ],
  },
  asia: {
    id: "asia",
    name: "ASIA",
    index: "02",
    coordinates: "34.0479° N\n100.6197° E",
    quote: '"Atmospheric resilience across historic trade corridors."',
    editorialTags: ["MEGACITIES", "MONSOONS", "INDUSTRY", "CLEAN HORIZONS", "TOMORROW"],
    reliefMap: "/continents/asia_ambient.jpg",
    polaroidPhoto: "/stamps/asia.jpg",
    polaroidCaption: ["ASIA", "HIMALAYAN SHIELD", "MONSOON BELT"],
    rows: [
      [
        { name: "INDIA", id: "india", status: "aeropure-active", image: "/continents/asia_ambient.jpg" },
        { name: "UAE", id: "uae", status: "aeropure-active", image: "/stamps/asia.jpg" },
        { name: "JAPAN", id: "japan", status: "aeropure-active", image: "/stamps/geo_asia.jpg" },
      ],
      [
        { name: "SAUDI ARABIA", status: "live-telemetry", lat: 23.8859, lon: 45.0792, countryCode: "SA" },
        { name: "SINGAPORE", id: "singapore", status: "aeropure-active" },
        { name: "SOUTH KOREA", status: "live-telemetry", lat: 35.9078, lon: 127.7669, countryCode: "KR" },
        { name: "CHINA", status: "live-telemetry", lat: 35.8617, lon: 104.1954, countryCode: "CN" },
      ],
      [
        { name: "VIETNAM", status: "live-telemetry", lat: 14.0583, lon: 108.2772, countryCode: "VN" },
        { name: "THAILAND", status: "live-telemetry", lat: 15.87, lon: 100.9925, countryCode: "TH" },
        { name: "TURKEY", status: "live-telemetry", lat: 38.9637, lon: 35.2433, countryCode: "TR" },
      ],
      [
        { name: "ALL COUNTRIES", isAction: true, status: "coming-soon" },
      ],
    ],
    directoryCountries: [
      { name: "INDIA", id: "india", status: "aeropure-active" },
      { name: "JAPAN", id: "japan", status: "aeropure-active" },
      { name: "UAE", id: "uae", status: "aeropure-active" },
      { name: "SINGAPORE", id: "singapore", status: "aeropure-active" },
      { name: "SAUDI ARABIA", status: "live-telemetry", lat: 23.8859, lon: 45.0792, code: "SA" },
      { name: "SOUTH KOREA", status: "live-telemetry", lat: 35.9078, lon: 127.7669, code: "KR" },
      { name: "CHINA", status: "live-telemetry", lat: 35.8617, lon: 104.1954, code: "CN" },
      { name: "VIETNAM", status: "live-telemetry", lat: 14.0583, lon: 108.2772, code: "VN" },
      { name: "THAILAND", status: "live-telemetry", lat: 15.87, lon: 100.9925, code: "TH" },
      { name: "TURKEY", status: "live-telemetry", lat: 38.9637, lon: 35.2433, code: "TR" },
      { name: "INDONESIA", status: "live-telemetry", lat: -0.7893, lon: 113.9213, code: "ID" },
      { name: "MALAYSIA", status: "live-telemetry", lat: 4.2105, lon: 101.9758, code: "MY" },
      { name: "PHILIPPINES", status: "live-telemetry", lat: 12.8797, lon: 121.774, code: "PH" },
      { name: "QATAR", status: "live-telemetry", lat: 25.3548, lon: 51.1839, code: "QA" },
      { name: "KUWAIT", status: "live-telemetry", lat: 29.3117, lon: 47.4818, code: "KW" },
      { name: "ISRAEL", status: "live-telemetry", lat: 31.0461, lon: 34.8516, code: "IL" },
      { name: "TAIWAN", status: "live-telemetry", lat: 23.6978, lon: 120.9605, code: "TW" },
      { name: "MONGOLIA", status: "coming-soon" },
    ],
  },
  "south-america": {
    id: "south-america",
    name: "SOUTH AMERICA",
    index: "05",
    coordinates: "8.7832° S\n55.4915° W",
    quote: '"Protecting planetary respiration across the Amazon basin."',
    editorialTags: ["AMAZON BASIN", "ANDEAN HEIGHTS", "OXYGEN SINKS", "PURITY", "ARCHIVE"],
    reliefMap: "/continents/south_america_ambient.jpg",
    polaroidPhoto: "/stamps/south-america.jpg",
    polaroidCaption: ["SOUTH AMERICA", "AMAZON BASIN", "OXYGEN SINK"],
    rows: [
      [
        { name: "COLOMBIA", status: "live-telemetry", lat: 4.5709, lon: -74.2973, countryCode: "CO" },
        { name: "BRAZIL", id: "brazil", status: "aeropure-active", image: "/continents/south_america_ambient.jpg" },
        { name: "ARGENTINA", status: "live-telemetry", lat: -38.4161, lon: -63.6167, countryCode: "AR" },
      ],
      [
        { name: "CHILE", status: "live-telemetry", lat: -35.6751, lon: -71.543, countryCode: "CL" },
        { name: "PERU", status: "live-telemetry", lat: -9.19, lon: -75.0152, countryCode: "PE" },
        { name: "ECUADOR", status: "live-telemetry", lat: -1.8312, lon: -78.1834, countryCode: "EC" },
        { name: "URUGUAY", status: "live-telemetry", lat: -32.5228, lon: -55.7658, countryCode: "UY" },
      ],
      [
        { name: "VENEZUELA", status: "live-telemetry", lat: 6.4238, lon: -66.5897, countryCode: "VE" },
        { name: "PARAGUAY", status: "live-telemetry", lat: -23.4425, lon: -58.4438, countryCode: "PY" },
        { name: "BOLIVIA", status: "live-telemetry", lat: -16.2902, lon: -63.5887, countryCode: "BO" },
      ],
      [
        { name: "ALL COUNTRIES", isAction: true, status: "coming-soon" },
      ],
    ],
    directoryCountries: [
      { name: "BRAZIL", id: "brazil", status: "aeropure-active" },
      { name: "ARGENTINA", status: "live-telemetry", lat: -38.4161, lon: -63.6167, code: "AR" },
      { name: "COLOMBIA", status: "live-telemetry", lat: 4.5709, lon: -74.2973, code: "CO" },
      { name: "CHILE", status: "live-telemetry", lat: -35.6751, lon: -71.543, code: "CL" },
      { name: "PERU", status: "live-telemetry", lat: -9.19, lon: -75.0152, code: "PE" },
      { name: "ECUADOR", status: "live-telemetry", lat: -1.8312, lon: -78.1834, code: "EC" },
      { name: "URUGUAY", status: "live-telemetry", lat: -32.5228, lon: -55.7658, code: "UY" },
      { name: "VENEZUELA", status: "live-telemetry", lat: 6.4238, lon: -66.5897, code: "VE" },
      { name: "PARAGUAY", status: "live-telemetry", lat: -23.4425, lon: -58.4438, code: "PY" },
      { name: "BOLIVIA", status: "live-telemetry", lat: -16.2902, lon: -63.5887, code: "BO" },
      { name: "GUYANA", status: "live-telemetry", lat: 4.8604, lon: -58.9302, code: "GY" },
      { name: "SURINAME", status: "coming-soon" },
    ],
  },
  oceania: {
    id: "oceania",
    name: "OCEANIA",
    index: "06",
    coordinates: "22.7359° S\n140.0188° E",
    quote: '"Uninterrupted maritime baseline over the Southern Ocean."',
    editorialTags: ["MARITIME", "REEF BASINS", "WESTERLIES", "CLEAN SEAS", "ISLAND NET"],
    reliefMap: "/continents/oceania_ambient.jpg",
    polaroidPhoto: "/stamps/oceania.jpg",
    polaroidCaption: ["OCEANIA", "SOUTHERN OCEAN", "CLEAN SEAS"],
    rows: [
      [
        { name: "AUSTRALIA", id: "australia", status: "aeropure-active", image: "/continents/oceania_ambient.jpg" },
        { name: "NEW ZEALAND", status: "live-telemetry", lat: -40.9006, lon: 174.886, countryCode: "NZ" },
        { name: "FIJI", status: "live-telemetry", lat: -17.7134, lon: 178.065, countryCode: "FJ" },
      ],
      [
        { name: "PAPUA NEW GUINEA", status: "live-telemetry", lat: -6.315, lon: 143.9555, countryCode: "PG" },
        { name: "SOLOMON ISLANDS", status: "live-telemetry", lat: -9.6457, lon: 160.1562, countryCode: "SB" },
        { name: "SAMOA", status: "live-telemetry", lat: -13.759, lon: -172.1046, countryCode: "WS" },
      ],
      [
        { name: "ALL COUNTRIES", isAction: true, status: "coming-soon" },
      ],
    ],
    directoryCountries: [
      { name: "AUSTRALIA", id: "australia", status: "aeropure-active" },
      { name: "NEW ZEALAND", status: "live-telemetry", lat: -40.9006, lon: 174.886, code: "NZ" },
      { name: "FIJI", status: "live-telemetry", lat: -17.7134, lon: 178.065, code: "FJ" },
      { name: "PAPUA NEW GUINEA", status: "live-telemetry", lat: -6.315, lon: 143.9555, code: "PG" },
      { name: "SOLOMON ISLANDS", status: "live-telemetry", lat: -9.6457, lon: 160.1562, code: "SB" },
      { name: "SAMOA", status: "live-telemetry", lat: -13.759, lon: -172.1046, code: "WS" },
      { name: "VANUATU", status: "live-telemetry", lat: -15.3767, lon: 166.9592, code: "VU" },
      { name: "TONGA", status: "live-telemetry", lat: -21.1789, lon: -175.1982, code: "TO" },
      { name: "MICRONESIA", status: "coming-soon" },
    ],
  },
  antarctica: {
    id: "antarctica",
    name: "ANTARCTICA",
    index: "07",
    coordinates: "82.8628° S\n135.0000° E",
    quote: '"The absolute global zero baseline for atmospheric chemistry."',
    editorialTags: ["CRYOSPHERE", "ZERO BASELINE", "POLAR VORTEX", "PRISTINE", "ARCHIVE"],
    reliefMap: "/continents/antarctica_wildlife.jpg",
    polaroidPhoto: "/stamps/antarctica.jpg",
    polaroidCaption: ["ANTARCTICA", "POLAR VORTEX", "ZERO BASELINE"],
    rows: [
      [
        { name: "ANTARCTICA RES.", id: "antarctica-terr", status: "aeropure-active", image: "/continents/antarctica_wildlife.jpg" },
        { name: "MCMURDO BASE", status: "live-telemetry", lat: -77.8419, lon: 166.6863, countryCode: "AQ" },
        { name: "VOSTOK STATION", status: "live-telemetry", lat: -78.4644, lon: 106.8373, countryCode: "AQ" },
      ],
      [
        { name: "AMUNDSEN-SCOTT", status: "live-telemetry", lat: -90.0, lon: 0.0, countryCode: "AQ" },
        { name: "CONCORDIA BASE", status: "coming-soon" },
      ],
    ],
    directoryCountries: [
      { name: "ANTARCTICA RESERVE", id: "antarctica-terr", status: "aeropure-active" },
      { name: "MCMURDO STATION", status: "live-telemetry", lat: -77.8419, lon: 166.6863, code: "AQ" },
      { name: "VOSTOK STATION", status: "live-telemetry", lat: -78.4644, lon: 106.8373, code: "AQ" },
      { name: "AMUNDSEN-SCOTT", status: "live-telemetry", lat: -90.0, lon: 0.0, code: "AQ" },
      { name: "CONCORDIA BASE", status: "coming-soon" },
    ],
  },
};

interface ContinentArchiveViewProps {
  continent: Continent;
  onSelectCountry: (countryId: string) => void;
  onBackToEarth: () => void;
  onSelectLiveLocation: (loc: GeoLocation) => void;
}

export default function ContinentArchiveView({
  continent,
  onSelectCountry,
  onBackToEarth,
  onSelectLiveLocation,
}: ContinentArchiveViewProps) {
  // Config selection with robust fallback
  const config = useMemo(() => {
    return (
      CONTINENT_CONFIGS[continent.id] || {
        id: continent.id,
        name: continent.name.toUpperCase(),
        index: "01",
        coordinates: `${Math.abs(continent.lat).toFixed(4)}° ${continent.lat >= 0 ? "N" : "S"}\n${Math.abs(continent.lon).toFixed(4)}° ${continent.lon >= 0 ? "E" : "W"}`,
        quote: `"Atmospheric research across ${continent.name}."`,
        editorialTags: ["ATMOSPHERE", "TERRAIN", "COMMUNITIES", "CLEAN AIR", "INTELLIGENCE"],
        reliefMap: "/continents/africa_map_relief.jpg",
        rows: [
          COUNTRIES.filter((c) => c.continentId === continent.id).map((c) => ({
            name: c.name.toUpperCase(),
            id: c.id,
            status: "aeropure-active" as const,
          })),
        ],
      }
    );
  }, [continent]);

  // ── DYNAMIC PROGRAMMATIC CAPABILITY CALCULATION ──
  // 1. Exact AeroPure ML supported countries (from locations.ts)
  const aeropureActiveCountries = useMemo(() => {
    return COUNTRIES.filter((c) => c.continentId === continent.id);
  }, [continent.id]);

  const aeropureActiveCount = aeropureActiveCountries.length;

  // 2. Exact Live Telemetry count available on this continent
  const liveTelemetryCount = useMemo(() => {
    const allNodes = config.rows.flat();
    const liveSet = new Set(
      allNodes
        .filter((n) => n.status === "live-telemetry" && !n.isAction)
        .map((n) => n.name)
    );
    return liveSet.size;
  }, [config.rows]);

  // 3. Total continental entities (actual total defined by continent or capabilities)
  const totalEntities = continent.countryCount || (aeropureActiveCount + liveTelemetryCount);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Synchronously compute local matches with useMemo
  const localMatches = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (q.length < 2) return [];

    const matches: { type: string; title: string; subtitle: string; action: () => void }[] = [];

    COUNTRIES.forEach((c) => {
      if (c.name.toLowerCase().includes(q)) {
        matches.push({
          type: "AEROPURE ML",
          title: c.name,
          subtitle: `Continent: ${c.continentId.toUpperCase()} • Code: ${c.code}`,
          action: () => onSelectCountry(c.id),
        });
      }
    });

    STATES.forEach((s) => {
      if (s.name.toLowerCase().includes(q)) {
        matches.push({
          type: "REGION",
          title: s.name,
          subtitle: `Country ID: ${s.countryId.toUpperCase()} • Code: ${s.code}`,
          action: () => onSelectCountry(s.countryId),
        });
      }
    });

    CITIES.forEach((ci) => {
      if (ci.name.toLowerCase().includes(q)) {
        matches.push({
          type: "CITY",
          title: ci.name,
          subtitle: `${ci.country} • Lat: ${ci.lat.toFixed(2)}, Lon: ${ci.lon.toFixed(2)}`,
          action: () => onSelectCountry(ci.countryId),
        });
      }
    });

    return matches.slice(0, 5);
  }, [searchQuery, onSelectCountry]);

  // Debounced query for live OpenWeather telemetry
  const [liveMatches, setLiveMatches] = useState<GeoLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [moreModalOpen, setMoreModalOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (q.length < 2) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?live=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!cancelled && data.liveLocations && Array.isArray(data.liveLocations)) {
          setLiveMatches(data.liveLocations.slice(0, 5));
        }
      } catch (err) {
        console.error("Live search failed:", err);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const displayedLiveMatches = searchQuery.trim().length >= 2 ? liveMatches : [];

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── DENSITY & RESPONSIVE GEOMETRY ──
  const densityClass = useMemo(() => {
    if (config.id === "africa") return "network-density-africa";
    if (config.id === "oceania" || config.id === "antarctica") return "network-density-compact";
    return "network-density-standard";
  }, [config.id]);

  // ── RESPONSIVE CONTINENT TITLE TYPOGRAPHY (NEVER CUT OFF) ──
  const renderContinentTitle = () => {
    const name = config.name.toUpperCase();
    if (name === "NORTH AMERICA") {
      return (
        <h1 className="continent-title continent-title-two-line">
          <span className="title-line">NORTH</span>
          <span className="title-line">AMERICA</span>
        </h1>
      );
    }
    if (name === "SOUTH AMERICA") {
      return (
        <h1 className="continent-title continent-title-two-line">
          <span className="title-line">SOUTH</span>
          <span className="title-line">AMERICA</span>
        </h1>
      );
    }
    if (name === "ANTARCTICA") {
      return (
        <h1 className="continent-title continent-title-antarctica">
          <span className="title-line">ANTARCTICA</span>
        </h1>
      );
    }
    return (
      <h1 className="continent-title">
        <span className="title-line">{name}</span>
      </h1>
    );
  };

  // ── RESPONSIVE COUNTRY NAME FIT (NEVER TRUNCATE OR OVERFLOW) ──
  const renderCountryName = (name: string, isAeropure: boolean, nameColor: string) => {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      let line1 = words[0];
      let line2 = words.slice(1).join(" ");
      if (words.length === 3) {
        line1 = words.slice(0, 2).join(" ");
        line2 = words[2];
      } else if (words.length > 3) {
        line1 = words.slice(0, Math.ceil(words.length / 2)).join(" ");
        line2 = words.slice(Math.ceil(words.length / 2)).join(" ");
      }
      return (
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.50rem",
            fontWeight: 800,
            letterSpacing: "0.03em",
            color: nameColor,
            lineHeight: 1.15,
            textShadow: isAeropure ? "0 2px 8px rgba(0, 0, 0, 1)" : "none",
            marginBottom: "2px",
            display: "block",
            textAlign: "center",
            maxWidth: "100%",
          }}
        >
          <span style={{ display: "block", whiteSpace: "nowrap" }}>{line1}</span>
          <span style={{ display: "block", whiteSpace: "nowrap" }}>{line2}</span>
        </span>
      );
    }

    const fontSize = name.length > 10 ? "0.48rem" : name.length > 7 ? "0.54rem" : "0.62rem";
    return (
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize,
          fontWeight: 800,
          letterSpacing: "0.04em",
          color: nameColor,
          lineHeight: 1.2,
          textShadow: isAeropure ? "0 2px 8px rgba(0, 0, 0, 1)" : "none",
          marginBottom: "2px",
          display: "block",
          textAlign: "center",
          maxWidth: "100%",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </span>
    );
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#070707",
        color: "#F2F2F0",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* ── RESPONSIVE COMPOSITION STYLES ── */}
      <style>{`
        .continent-header {
          position: relative;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.1rem 3.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background-color: rgba(7, 7, 7, 0.9);
          backdrop-filter: blur(12px);
          width: 100%;
          box-sizing: border-box;
        }

        .continent-sub-header {
          position: relative;
          z-index: 15;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 3.5rem 0.35rem 3.5rem;
          flex-wrap: wrap;
          gap: 1rem;
          width: 100%;
          box-sizing: border-box;
        }

        .continent-search-container {
          position: relative;
          width: clamp(280px, 24vw, 360px);
          max-width: 100%;
          box-sizing: border-box;
        }

        .continent-stage {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1rem 2rem 2rem 2rem;
          z-index: 5;
          min-height: 580px;
          width: 100%;
          box-sizing: border-box;
          overflow: visible;
        }

        .continent-left-col {
          position: absolute;
          left: 3.5rem;
          top: 1.5rem;
          width: clamp(340px, 30vw, 480px);
          z-index: 10;
          display: flex;
          flex-direction: column;
          pointer-events: auto;
          overflow: visible;
        }

        .continent-title {
          font-family: 'Orbitron', -apple-system, sans-serif;
          font-size: clamp(3.2rem, 4.6vw, 5.0rem);
          font-weight: 900;
          letter-spacing: 0.05em;
          color: #F2F2F0;
          line-height: 0.94;
          margin: 0 0 0.85rem 0;
          text-shadow: 0 2px 25px rgba(0, 0, 0, 0.9);
          background: linear-gradient(180deg, #FFFFFF 20%, #B8B8B5 75%, #6D6D6A 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          word-break: keep-all;
          overflow: visible;
          white-space: normal;
        }

        .continent-title-two-line {
          font-size: clamp(2.5rem, 3.8vw, 4.0rem);
          line-height: 0.92;
        }

        .continent-title-two-line .title-line {
          display: block;
          white-space: nowrap !important;
          word-break: keep-all !important;
          overflow: visible !important;
        }

        .continent-title-antarctica {
          font-size: clamp(2.0rem, 2.9vw, 3.2rem);
          letter-spacing: 0.035em;
          line-height: 1;
        }

        .continent-title-antarctica .title-line {
          display: block;
          white-space: nowrap !important;
          word-break: keep-all !important;
          overflow: visible !important;
        }

        .continent-title .title-line {
          display: block;
          white-space: nowrap !important;
          word-break: keep-all !important;
          overflow: visible !important;
        }

        .continent-relief-anchor {
          position: absolute;
          top: 50%;
          left: 54%;
          transform: translate(-50%, -50%);
          width: clamp(720px, 62vw, 960px);
          height: clamp(620px, 52vw, 840px);
          pointer-events: none;
          z-index: 1;
          opacity: 0.44;
          mask-image: radial-gradient(ellipse 65% 65% at 50% 50%, rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 0.7) 70%, rgba(0, 0, 0, 0) 100%);
          -webkit-mask-image: radial-gradient(ellipse 65% 65% at 50% 50%, rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 0.7) 70%, rgba(0, 0, 0, 0) 100%);
        }

        .continent-wildlife-elem {
          position: absolute;
          left: -10px;
          bottom: 0px;
          width: 320px;
          height: 300px;
          pointer-events: none;
          z-index: 8;
          opacity: 0.8;
          mask-image: linear-gradient(to top, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%), linear-gradient(to right, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%);
          -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%), linear-gradient(to right, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%);
        }

        .continent-right-col {
          position: absolute;
          right: 3.5rem;
          top: 3.5rem;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          text-align: right;
          pointer-events: auto;
        }

        /* ── NETWORK DENSITY SYSTEM (ADAPTIVE GEOMETRY) ── */
        .continent-network-container {
          position: relative;
          z-index: 12;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 0.5rem;
        }

        /* Africa (5, 6, 6, 6) */
        .network-density-africa .hex-item {
          width: 104px;
          height: 118px;
          position: relative;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .network-density-africa .hex-row {
          display: flex;
          justify-content: center;
          gap: 7px;
          margin-top: -24px;
        }
        .network-density-africa .hex-row:first-child {
          margin-top: 0;
        }

        /* Standard: North America, Europe, Asia, South America (3, 4, 3, 1) */
        .network-density-standard .hex-item {
          width: 132px;
          height: 152px;
          position: relative;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .network-density-standard .hex-row {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: -33px;
        }
        .network-density-standard .hex-row:first-child {
          margin-top: 0;
        }

        /* Compact: Oceania (3, 3, 1), Antarctica (3, 2) */
        .network-density-compact .hex-item {
          width: 140px;
          height: 162px;
          position: relative;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .network-density-compact .hex-row {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-top: -36px;
        }
        .network-density-compact .hex-row:first-child {
          margin-top: 0;
        }

        .continent-footer {
          position: relative;
          z-index: 20;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          background-color: #070707;
          padding: 1.1rem 3.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1.5rem;
          width: 100%;
          box-sizing: border-box;
        }

        /* ── 1480px / 1440x900 / 1366x768 OPTIMIZATIONS ── */
        @media (max-width: 1480px) {
          .continent-header {
            padding: 1rem 2.2rem;
          }
          .continent-sub-header {
            padding: 0.75rem 2.2rem 0.35rem 2.2rem;
          }
          .continent-search-container {
            width: 300px;
          }
          .continent-left-col {
            left: 2.2rem;
            width: clamp(290px, 26vw, 380px);
            top: 1.2rem;
          }
          .continent-title {
            font-size: clamp(2.8rem, 4.0vw, 4.2rem);
          }
          .continent-title-two-line {
            font-size: clamp(2.2rem, 3.4vw, 3.4rem);
          }
          .continent-title-antarctica {
            font-size: clamp(1.8rem, 2.5vw, 2.7rem);
          }
          .continent-right-col {
            right: 2.2rem;
            top: 2.8rem;
          }
          .continent-relief-anchor {
            width: 680px;
            height: 580px;
            opacity: 0.38;
          }
          .network-density-africa .hex-item {
            width: 92px;
            height: 105px;
          }
          .network-density-africa .hex-row {
            gap: 6px;
            margin-top: -21px;
          }
          .network-density-standard .hex-item {
            width: 116px;
            height: 133px;
          }
          .network-density-standard .hex-row {
            gap: 8px;
            margin-top: -28px;
          }
          .network-density-compact .hex-item {
            width: 124px;
            height: 142px;
          }
          .network-density-compact .hex-row {
            gap: 10px;
            margin-top: -30px;
          }
          .continent-wildlife-elem {
            width: 250px;
            height: 250px;
            opacity: 0.6;
          }
          .continent-footer {
            padding: 1rem 2.2rem;
          }
        }

        /* ── TABLET / 1220px BREAKPOINT ── */
        @media (max-width: 1220px) {
          .continent-header {
            padding: 0.9rem 1.5rem;
          }
          .continent-sub-header {
            padding: 0.7rem 1.5rem 0.3rem 1.5rem;
          }
          .continent-search-container {
            width: 260px;
          }
          .continent-left-col {
            left: 1.5rem;
            width: clamp(240px, 23vw, 300px);
            top: 1rem;
          }
          .continent-title {
            font-size: clamp(2.2rem, 3.2vw, 3.0rem);
          }
          .continent-title-two-line {
            font-size: clamp(1.85rem, 2.7vw, 2.5rem);
          }
          .continent-title-antarctica {
            font-size: clamp(1.55rem, 2.2vw, 2.2rem);
          }
          .continent-right-col {
            right: 1.5rem;
          }
          .continent-relief-anchor {
            width: 520px;
            height: 450px;
            opacity: 0.28;
          }
          .network-density-africa .hex-item {
            width: 80px;
            height: 92px;
          }
          .network-density-africa .hex-row {
            gap: 5px;
            margin-top: -18px;
          }
          .network-density-standard .hex-item {
            width: 98px;
            height: 112px;
          }
          .network-density-standard .hex-row {
            gap: 7px;
            margin-top: -24px;
          }
          .network-density-compact .hex-item {
            width: 106px;
            height: 122px;
          }
          .network-density-compact .hex-row {
            gap: 8px;
            margin-top: -26px;
          }
          .continent-wildlife-elem {
            width: 200px;
            height: 200px;
            opacity: 0.45;
          }
          .continent-footer {
            padding: 0.9rem 1.5rem;
          }
        }

        /* ── MOBILE REFLOW (<= 860px) ── */
        @media (max-width: 860px) {
          .continent-header {
            padding: 0.8rem 1.25rem;
          }
          .continent-sub-header {
            padding: 0.7rem 1.25rem;
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
          }
          .continent-search-container {
            width: 100%;
          }
          .continent-stage {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding: 1.5rem 1rem 3rem 1rem;
            min-height: auto;
          }
          .continent-left-col {
            position: relative;
            left: auto;
            top: auto;
            width: 100%;
            max-width: 480px;
            text-align: center;
            align-items: center;
            margin-bottom: 2rem;
          }
          .continent-title {
            font-size: clamp(2.4rem, 8vw, 3.4rem);
          }
          .continent-title-two-line {
            font-size: clamp(2.0rem, 7vw, 2.8rem);
          }
          .continent-title-antarctica {
            font-size: clamp(1.7rem, 6vw, 2.3rem);
            letter-spacing: 0.03em;
          }
          .continent-right-col {
            position: relative;
            right: auto;
            top: auto;
            width: 100%;
            max-width: 480px;
            align-items: center;
            text-align: center;
            margin-top: 2rem;
          }
          .continent-relief-anchor {
            width: 90vw;
            height: 380px;
            top: 45%;
            left: 50%;
            opacity: 0.22;
          }
          .network-density-africa .hex-item,
          .network-density-standard .hex-item,
          .network-density-compact .hex-item {
            width: 74px;
            height: 84px;
          }
          .network-density-africa .hex-row,
          .network-density-standard .hex-row,
          .network-density-compact .hex-row {
            gap: 4px;
            margin-top: -16px;
          }
          .continent-wildlife-elem {
            display: none !important;
          }
          .continent-footer {
            padding: 1.2rem 1.25rem;
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          .hidden-mobile {
            display: none !important;
          }
        }
      `}</style>

      {/* ── SUBTLE FILM GRAIN NOISE & VIGNETTE OVERLAYS ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          backgroundImage:
            "radial-gradient(ellipse at 50% 50%, rgba(17, 17, 17, 0) 0%, rgba(7, 7, 7, 0.75) 85%, rgba(0, 0, 0, 0.95) 100%)",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          opacity: 0.035,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── TOP NAVIGATION BAR ── */}
      <header
        className="continent-header"
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          backgroundColor: "rgba(7, 7, 7, 0.9)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Brand Left */}
        <div
          onClick={onBackToEarth}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
            cursor: "pointer",
          }}
        >
          <svg width="22" height="20" viewBox="0 0 24 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0L24 22H18.5L12 9.5L5.5 22H0L12 0Z" fill="#F2F2F0" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: "1.05rem",
                fontWeight: 900,
                letterSpacing: "0.18em",
                color: "#F2F2F0",
                lineHeight: 1,
              }}
            >
              AEROPURE
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.58rem",
                letterSpacing: "0.22em",
                color: "#929292",
                marginTop: "3px",
              }}
            >
              ATMOSPHERIC RESEARCH
            </span>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.75rem",
          }}
          className="hidden-mobile"
        >
          <div
            style={{
              padding: "0.4rem 0.9rem",
              border: "1px solid #6D6D6A",
              borderRadius: "2px",
              fontSize: "0.68rem",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              letterSpacing: "0.16em",
              color: "#F2F2F0",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
            }}
          >
            GEOSPATIAL INDEX
          </div>
          {["ATMOSPHERE", "INTELLIGENCE", "INSTRUMENTATION", "ARCHIVE"].map((item) => (
            <span
              key={item}
              style={{
                fontSize: "0.68rem",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 500,
                letterSpacing: "0.14em",
                color: "#929292",
                cursor: "pointer",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#F2F2F0")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#929292")}
            >
              {item}
            </span>
          ))}
        </nav>

        {/* Right CTA / Motto */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
          }}
        >
          <Search size={15} color="#929292" style={{ cursor: "pointer" }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.68rem",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.15em",
              color: "#B8B8B5",
            }}
          >
            <span>A CLEANER TOMORROW</span>
            <span style={{ color: "#6D6D6A" }}>—</span>
          </div>
        </div>
      </header>

      {/* ── BREADCRUMB & COMPACT SEARCH BAR SUB-HEADER ── */}
      <div className="continent-sub-header">
        {/* Breadcrumb Left */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.72rem",
            letterSpacing: "0.18em",
            color: "#929292",
          }}
        >
          <span
            onClick={onBackToEarth}
            style={{
              cursor: "pointer",
              color: "#929292",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#F2F2F0")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#929292")}
          >
            EARTH
          </span>
          <span style={{ color: "#41413F" }}>/</span>
          <span style={{ color: "#F2F2F0", fontWeight: 700 }}>{config.name}</span>
        </div>

        {/* Compact Search Bar Right */}
        <div
          ref={searchContainerRef}
          className="continent-search-container"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              backgroundColor: "rgba(17, 17, 17, 0.8)",
              border: "1px solid #333331",
              borderRadius: "2px",
              padding: "0.6rem 1rem",
              backdropFilter: "blur(10px)",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            <Search size={14} color="#6D6D6A" />
            <input
              type="text"
              placeholder="Search country, city, or region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#F2F2F0",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.72rem",
                letterSpacing: "0.05em",
              }}
            />
            {searchQuery && (
              <X
                size={13}
                color="#6D6D6A"
                style={{ cursor: "pointer" }}
                onClick={() => setSearchQuery("")}
              />
            )}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "0.35rem",
              fontSize: "0.58rem",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.2em",
              color: "#6D6D6A",
            }}
          >
            EXPLORE · ANALYZE · ACT
          </div>

          {/* Live Search Floating Results Dropdown */}
          {(localMatches.length > 0 || displayedLiveMatches.length > 0 || isSearching) && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                width: "100%",
                marginTop: "0.4rem",
                backgroundColor: "#111111",
                border: "1px solid #41413F",
                borderRadius: "2px",
                zIndex: 100,
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.8)",
                maxHeight: "360px",
                overflowY: "auto",
              }}
            >
              {isSearching && (
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    fontSize: "0.68rem",
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "#929292",
                    borderBottom: "1px solid #242423",
                  }}
                >
                  QUERYING TELEMETRY STREAMS...
                </div>
              )}

              {/* Local Index Hits */}
              {localMatches.map((item, idx) => (
                <div
                  key={`local-${idx}`}
                  onClick={() => {
                    item.action();
                    setSearchQuery("");
                  }}
                  style={{
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid #242423",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#242423")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
                >
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#F2F2F0" }}>{item.title}</div>
                    <div style={{ fontSize: "0.62rem", color: "#929292", fontFamily: "'JetBrains Mono', monospace" }}>
                      {item.subtitle}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.55rem",
                      fontFamily: "'JetBrains Mono', monospace",
                      border: "1px solid #FFFFFF",
                      padding: "0.2rem 0.4rem",
                      borderRadius: "2px",
                      color: "#FFFFFF",
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                    }}
                  >
                    {item.type}
                  </span>
                </div>
              ))}

              {/* Global Live OpenWeather Telemetry Hits */}
              {displayedLiveMatches.map((loc, idx) => (
                <div
                  key={`live-${idx}`}
                  onClick={() => {
                    onSelectLiveLocation(loc);
                    setSearchQuery("");
                  }}
                  style={{
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid #242423",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#242423")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
                >
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#F2F2F0" }}>
                      {loc.name}
                      {loc.state ? `, ${loc.state}` : ""}
                    </div>
                    <div style={{ fontSize: "0.62rem", color: "#929292", fontFamily: "'JetBrains Mono', monospace" }}>
                      {loc.country} • Lat: {loc.lat.toFixed(2)}, Lon: {loc.lon.toFixed(2)}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.55rem",
                      fontFamily: "'JetBrains Mono', monospace",
                      border: "1px solid #6D6D6A",
                      padding: "0.2rem 0.4rem",
                      borderRadius: "2px",
                      color: "#D9D9D6",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    LIVE TELEMETRY
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CONTINENTAL STAGE ── */}
      <div className="continent-stage">
        {/* 1. CENTRAL TOPOGRAPHIC RELIEF MAP BACKGROUND ANCHOR */}
        <div className="continent-relief-anchor">
          <Image
            src={config.reliefMap}
            alt={`${config.name} Relief Archive`}
            fill
            style={{
              objectFit: "contain",
              filter: "grayscale(100%) contrast(140%) brightness(85%)",
            }}
            priority
          />
        </div>

        {/* 2. LEFT EDITORIAL IDENTITY COLUMN */}
        <div className="continent-left-col">
          {/* Index 01 & Editorial Tags */}
          <div style={{ marginBottom: "2rem" }}>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#6D6D6A",
                display: "block",
                marginBottom: "0.6rem",
              }}
            >
              {config.index}
            </span>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.58rem",
                letterSpacing: "0.22em",
                color: "#6D6D6A",
                lineHeight: 1.6,
              }}
            >
              {config.editorialTags.map((tag, i) => (
                <div key={i}>{tag}</div>
              ))}
              <div style={{ marginTop: "0.4rem", color: "#41413F" }}>————</div>
            </div>
          </div>

          {/* Continent Title */}
          {renderContinentTitle()}

          {/* Subtitle */}
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.24em",
              color: "#B8B8B5",
              marginBottom: "1.2rem",
            }}
          >
            CONTINENTAL AIR ARCHIVE
          </div>

          {/* Short Restrained Description */}
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.78rem",
              lineHeight: 1.65,
              color: "#929292",
              maxWidth: "320px",
              marginBottom: "2rem",
            }}
          >
            Explore atmospheric intelligence across the continent, from country-level conditions to local air forecasts.
          </p>

          {/* Crosshairs Reticle & Continent Motto */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginTop: "0.2rem",
            }}
          >
            <div
              style={{
                width: "30px",
                height: "30px",
                minWidth: "30px",
                borderRadius: "50%",
                border: "1px solid #41413F",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Target size={14} color="#929292" />
            </div>
            <span
              style={{
                fontFamily: "Georgia, serif",
                fontStyle: "italic",
                fontSize: "0.85rem",
                color: "#B8B8B5",
                lineHeight: 1.4,
              }}
            >
              {config.quote}
            </span>
          </div>
        </div>

        {/* 3. LOWER-LEFT ATMOSPHERIC WILDLIFE / SAVANNAH ELEMENT */}
        {config.wildlifeVisual && (
          <div className="continent-wildlife-elem">
            <Image
              src={config.wildlifeVisual}
              alt={`${config.name} Atmospheric Visual`}
              fill
              style={{
                objectFit: "contain",
                objectPosition: "bottom left",
                filter: "grayscale(100%) contrast(125%) brightness(90%)",
              }}
            />
          </div>
        )}

        {/* 4. RIGHT ARCHIVAL MARGIN CONTENT & POLAROID CARD */}
        <div className="continent-right-col">
          {/* Vertical Editorial Markers */}
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.62rem",
              letterSpacing: "0.22em",
              color: "#6D6D6A",
              lineHeight: 1.8,
              marginBottom: "1.2rem",
            }}
          >
            <div>DIVERSE</div>
            <div>LANDS</div>
            <div style={{ height: "0.4rem" }} />
            <div>VITAL AIR</div>
            <div style={{ height: "0.4rem" }} />
            <div>RESILIENT</div>
            <div>PEOPLE</div>
            <div style={{ marginTop: "0.4rem", color: "#41413F" }}>————</div>
          </div>

          {/* Coordinates */}
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.72rem",
              letterSpacing: "0.14em",
              color: "#929292",
              lineHeight: 1.5,
              marginBottom: "2.5rem",
            }}
          >
            {config.coordinates.split("\n").map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>

          {/* Archival Polaroid / Map Card */}
          {config.polaroidPhoto && (
            <div
              style={{
                position: "relative",
                width: "175px",
                maxWidth: "100%",
                backgroundColor: "#E8E8E6",
                padding: "8px 8px 14px 8px",
                boxShadow: "0 12px 35px rgba(0, 0, 0, 0.9)",
                transform: "rotate(3.5deg)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "rotate(1deg) scale(1.04)";
                e.currentTarget.style.boxShadow = "0 16px 45px rgba(0, 0, 0, 1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "rotate(3.5deg) scale(1)";
                e.currentTarget.style.boxShadow = "0 12px 35px rgba(0, 0, 0, 0.9)";
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "135px",
                  overflow: "hidden",
                  backgroundColor: "#070707",
                }}
              >
                <Image
                  src={config.polaroidPhoto}
                  alt="Archival Polaroid"
                  fill
                  style={{
                    objectFit: "cover",
                    filter: "grayscale(100%) contrast(115%)",
                  }}
                />
              </div>
              <div
                style={{
                  paddingTop: "9px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.52rem",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  color: "#242423",
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
              >
                {config.polaroidCaption?.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. THE CENTERPIECE: SYMMETRICAL INTERLOCKING COUNTRY HONEYCOMB NETWORK */}
        <div className={`continent-network-container ${densityClass}`}>
          {config.rows.map((row, rowIdx) => (
            <div key={`hex-row-${rowIdx}`} className="hex-row">
              {row.map((node, nodeIdx) => {
                const isAeropure = node.status === "aeropure-active";
                const isLive = node.status === "live-telemetry";
                const isAction = node.isAction;

                // Color tokens for outer shell:
                const outerBg = isAeropure 
                  ? "#FFFFFF" 
                  : isLive 
                  ? "#454542" 
                  : isAction 
                  ? "#41413F" 
                  : "#242423";

                const shellPadding = isAeropure ? "1.8px" : "1px";

                const innerBg = isAeropure 
                  ? "#161616" 
                  : isLive 
                  ? "#121212" 
                  : "#0d0d0d";

                const nameColor = isAeropure 
                  ? "#FFFFFF" 
                  : isLive 
                  ? "#E6E6E3" 
                  : isAction 
                  ? "#F2F2F0" 
                  : "#6D6D6A";

                const badgeLabel = isAeropure 
                  ? "ACTIVE" 
                  : isLive 
                  ? "LIVE TELEMETRY" 
                  : "COMING SOON";

                return (
                  <div
                    key={`hex-${rowIdx}-${nodeIdx}`}
                    className="hex-item"
                    onClick={() => {
                      if (isAeropure && node.id) {
                        onSelectCountry(node.id);
                      } else if (isLive && node.lat !== undefined && node.lon !== undefined) {
                        onSelectLiveLocation({
                          name: node.name,
                          lat: node.lat,
                          lon: node.lon,
                          country: node.countryCode || node.name,
                        });
                      } else if (isAction) {
                        setMoreModalOpen(true);
                      }
                    }}
                    style={{
                      cursor: isAeropure || isLive || isAction ? "pointer" : "default",
                      filter: isAeropure
                        ? "drop-shadow(0 4px 18px rgba(255, 255, 255, 0.22)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.8))"
                        : isLive
                        ? "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.7))"
                        : "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6))",
                    }}
                    onMouseEnter={(e) => {
                      if (isAeropure || isLive || isAction) {
                        e.currentTarget.style.transform = isAeropure 
                          ? "scale(1.08) translateY(-4px)" 
                          : "scale(1.06) translateY(-2px)";
                        e.currentTarget.style.zIndex = "25";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isAeropure || isLive || isAction) {
                        e.currentTarget.style.transform = "scale(1) translateY(0)";
                        e.currentTarget.style.zIndex = "12";
                      }
                    }}
                  >
                    {/* Outer Hexagon Border Shell */}
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: outerBg,
                        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                        padding: shellPadding,
                        boxSizing: "border-box",
                        transition: "background-color 0.2s ease",
                      }}
                    >
                      {/* Inner Hexagon Container */}
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          backgroundColor: innerBg,
                          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                          position: "relative",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        {/* Photographic Background if provided */}
                        {node.image && (
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              zIndex: 1,
                            }}
                          >
                            <Image
                              src={node.image}
                              alt={node.name}
                              fill
                              style={{
                                objectFit: "cover",
                                filter: isAeropure
                                  ? "grayscale(100%) contrast(135%) brightness(80%)"
                                  : "grayscale(100%) contrast(115%) brightness(65%)",
                              }}
                            />
                            {/* Dark Gradient Overlay for razor-sharp typography */}
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                background:
                                  "linear-gradient(to top, rgba(7, 7, 7, 0.94) 25%, rgba(17, 17, 17, 0.5) 70%, rgba(7, 7, 7, 0.82) 100%)",
                              }}
                            />
                          </div>
                        )}

                        {/* Node Content */}
                        <div
                          style={{
                            position: "relative",
                            zIndex: 2,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            padding: "0 6px",
                            width: "100%",
                          }}
                        >
                          {isAction ? (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Plus size={16} color="#B8B8B5" style={{ marginBottom: "3px" }} />
                              <span
                                style={{
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontSize: "0.54rem",
                                  fontWeight: 700,
                                  letterSpacing: "0.08em",
                                  color: "#F2F2F0",
                                  lineHeight: 1.2,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {node.name.includes(" ") ? (
                                  <>
                                    <span style={{ display: "block" }}>{node.name.split(" ")[0]}</span>
                                    <span style={{ display: "block" }}>{node.name.split(" ").slice(1).join(" ")}</span>
                                  </>
                                ) : (
                                  node.name
                                )}
                              </span>
                            </div>
                          ) : (
                            <>
                              {renderCountryName(node.name, isAeropure, nameColor)}
                              <span
                                style={{
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontSize: isAeropure ? "0.46rem" : "0.42rem",
                                  fontWeight: isAeropure ? 800 : 600,
                                  letterSpacing: "0.12em",
                                  color: isAeropure ? "#FFFFFF" : isLive ? "#D9D9D6" : "#6D6D6A",
                                  backgroundColor: isAeropure 
                                    ? "rgba(255, 255, 255, 0.18)" 
                                    : isLive 
                                    ? "rgba(255, 255, 255, 0.05)" 
                                    : "transparent",
                                  padding: isAeropure ? "2px 7px" : isLive ? "1px 5px" : "0",
                                  borderRadius: "2px",
                                  border: isAeropure 
                                    ? "1px solid rgba(255, 255, 255, 0.6)" 
                                    : isLive 
                                    ? "1px solid #454542" 
                                    : "none",
                                  marginTop: "3px",
                                  textShadow: isAeropure ? "0 0 10px rgba(255, 255, 255, 0.4)" : "none",
                                }}
                              >
                                {badgeLabel}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── MODAL: ALL CONTINENTAL COUNTRIES DIRECTORY ── */}
      {moreModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            backgroundColor: "rgba(0, 0, 0, 0.88)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
          onClick={() => setMoreModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#111111",
              border: "1px solid #41413F",
              width: "100%",
              maxWidth: "760px",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "2.2rem",
              borderRadius: "2px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
                borderBottom: "1px solid #242423",
                paddingBottom: "1.2rem",
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: "Orbitron, sans-serif",
                    fontSize: "1.2rem",
                    letterSpacing: "0.1em",
                    color: "#F2F2F0",
                    margin: 0,
                  }}
                >
                  {config.name} — GEOGRAPHIC INDEX
                </h3>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.68rem",
                    color: "#929292",
                  }}
                >
                  {aeropureActiveCount} AeroPure ML Active • {liveTelemetryCount} Live Telemetry • {totalEntities} Total Regions
                </span>
              </div>
              <X
                size={20}
                color="#929292"
                style={{ cursor: "pointer" }}
                onClick={() => setMoreModalOpen(false)}
              />
            </div>

            {/* 1. AEROPURE PREDICTION PIPELINE SUPPORTED COUNTRIES */}
            <div style={{ marginBottom: "2rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                <Layers size={14} color="#FFFFFF" />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    color: "#FFFFFF",
                  }}
                >
                  AEROPURE ACTIVE (VERIFIED 113-FEATURE ML PIPELINE)
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                  gap: "0.85rem",
                }}
              >
                {aeropureActiveCountries.map((ctry) => (
                  <div
                    key={ctry.id}
                    onClick={() => {
                      setMoreModalOpen(false);
                      onSelectCountry(ctry.id);
                    }}
                    style={{
                      padding: "1rem",
                      backgroundColor: "#1c1c1b",
                      border: "1.5px solid #FFFFFF",
                      borderRadius: "2px",
                      cursor: "pointer",
                      transition: "transform 0.15s ease, background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#242423";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#1c1c1b";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#FFFFFF" }}>{ctry.name}</div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "0.5rem",
                        fontSize: "0.62rem",
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "#B8B8B5",
                      }}
                    >
                      <span>{ctry.stateCount} Regions</span>
                      <span
                        style={{
                          color: "#070707",
                          backgroundColor: "#FFFFFF",
                          padding: "1px 4px",
                          fontWeight: 800,
                          borderRadius: "1px",
                        }}
                      >
                        AEROPURE ACTIVE
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. LIVE OPENWEATHER TELEMETRY REGIONS */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                <Radio size={14} color="#929292" />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    color: "#D9D9D6",
                  }}
                >
                  LIVE TELEMETRY (EXTERNAL OPENWEATHER REFERENCE)
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                  gap: "0.85rem",
                }}
              >
                {(config.directoryCountries && config.directoryCountries.length > 0
                  ? config.directoryCountries.filter((c) => c.status !== "aeropure-active")
                  : config.rows.flat().filter((n) => n.status === "live-telemetry" && !n.isAction)
                ).map((node, idx) => (
                    <div
                      key={`modal-live-${idx}`}
                      onClick={() => {
                        if (node.lat !== undefined && node.lon !== undefined) {
                          setMoreModalOpen(false);
                          onSelectLiveLocation({
                            name: node.name,
                            lat: node.lat,
                            lon: node.lon,
                            country: ("code" in node && node.code) || ("countryCode" in node && node.countryCode) || node.name,
                          });
                        }
                      }}
                      style={{
                        padding: "1rem",
                        backgroundColor: "#141414",
                        border: "1px solid #6D6D6A",
                        borderRadius: "2px",
                        cursor: "pointer",
                        transition: "transform 0.15s ease, background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#1f1f1f";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#141414";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "#E6E6E3" }}>{node.name}</div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: "0.5rem",
                          fontSize: "0.6rem",
                          fontFamily: "'JetBrains Mono', monospace",
                          color: "#929292",
                        }}
                      >
                        <span>
                          {node.lat !== undefined ? `${node.lat.toFixed(1)}°, ${node.lon?.toFixed(1)}°` : "GPS Ready"}
                        </span>
                        <span
                          style={{
                            color: "#D9D9D6",
                            border: "1px solid #6D6D6A",
                            padding: "1px 4px",
                            fontWeight: 600,
                            borderRadius: "1px",
                          }}
                        >
                          LIVE TELEMETRY
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM INFORMATION & TELEMETRY STRIP ── */}
      <footer
        className="continent-footer"
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          backgroundColor: "#070707",
        }}
      >
        {/* Leftmost Global Counter */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.9rem",
          }}
        >
          <Globe size={22} color="#929292" />
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.64rem",
              letterSpacing: "0.14em",
              color: "#929292",
              lineHeight: 1.4,
            }}
          >
            <div>{totalEntities} TOTAL COUNTRIES</div>
            <div style={{ color: "#6D6D6A" }}>1 SHARED ATMOSPHERE</div>
          </div>
        </div>

        {/* Center 4 Telemetry Blocks */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "3rem",
            flexWrap: "wrap",
          }}
          className="hidden-mobile"
        >
          {/* Block 1: AeroPure Model Active */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <Layers size={18} color="#FFFFFF" />
            <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <div style={{ fontSize: "0.58rem", letterSpacing: "0.18em", color: "#929292" }}>AEROPURE MODEL</div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: "#FFFFFF" }}>
                {String(aeropureActiveCount).padStart(2, "0")} ACTIVE (VERIFIED ML)
              </div>
            </div>
          </div>

          {/* Block 2: Live Telemetry Feeds */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <Activity size={18} color="#929292" />
            <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <div style={{ fontSize: "0.58rem", letterSpacing: "0.18em", color: "#6D6D6A" }}>LIVE TELEMETRY</div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: "#D9D9D6" }}>
                {String(liveTelemetryCount).padStart(2, "0")} AVAILABLE FEEDS
              </div>
            </div>
          </div>

          {/* Block 3: Total Geographic Index */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <BarChart3 size={18} color="#929292" />
            <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <div style={{ fontSize: "0.58rem", letterSpacing: "0.18em", color: "#6D6D6A" }}>GEOSPATIAL INDEX</div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: "#B8B8B5" }}>
                {totalEntities} TOTAL REGIONS
              </div>
            </div>
          </div>

          {/* Block 4: Scientific Provenance */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <Leaf size={18} color="#929292" />
            <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <div style={{ fontSize: "0.58rem", letterSpacing: "0.18em", color: "#6D6D6A" }}>DATA PROVENANCE</div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: "#B8B8B5" }}>
                MODEL / TELEMETRY SEPARATION
              </div>
            </div>
          </div>
        </div>

        {/* Rightmost Copyright */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.64rem",
            letterSpacing: "0.18em",
            color: "#6D6D6A",
          }}
        >
          AEROPURE © 2026
        </div>
      </footer>
    </div>
  );
}
