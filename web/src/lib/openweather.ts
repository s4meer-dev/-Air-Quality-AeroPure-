/**
 * OpenWeather Server-Side API Client
 * ===================================
 * All API key requests are executed strictly server-side.
 * Never exposes OPENWEATHER_API_KEY to browser client JavaScript.
 */

const OPENWEATHER_KEY = process.env.OPENWEATHER_API_KEY ?? "e5bbf9de83aaaa20ad9166ea75bfc1fd";
const BASE_URL = "https://api.openweathermap.org/data/2.5";
const GEO_URL = "https://api.openweathermap.org/geo/1.0";

export interface WeatherData {
  city: string;
  country: string;
  lat: number;
  lon: number;
  temp: number;
  temp_feels_like: number;
  temp_min: number;
  temp_max: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_deg: number;
  visibility: number;
  condition: string;
  description: string;
  icon: string;
  sunrise: number;
  sunset: number;
}

export interface AirPollutionData {
  aqi: number;
  co: number;
  no: number;
  no2: number;
  o3: number;
  so2: number;
  pm2_5: number;
  pm10: number;
  nh3: number;
}

export interface GeoLocation {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

export async function getWeatherData(lat: number, lon: number): Promise<{ data: WeatherData | null; error: string | null }> {
  try {
    const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=metric`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      if (res.status === 401) {
        return { data: null, error: "OpenWeather API Key Unauthorized (401)" };
      }
      return { data: null, error: `OpenWeather HTTP ${res.status}: ${res.statusText}` };
    }
    const json = await res.json();
    return {
      data: {
        city: json.name ?? "Selected Location",
        country: json.sys?.country ?? "",
        lat: json.coord?.lat ?? lat,
        lon: json.coord?.lon ?? lon,
        temp: Math.round(json.main?.temp ?? 0),
        temp_feels_like: Math.round(json.main?.feels_like ?? 0),
        temp_min: Math.round(json.main?.temp_min ?? 0),
        temp_max: Math.round(json.main?.temp_max ?? 0),
        humidity: json.main?.humidity ?? 0,
        pressure: json.main?.pressure ?? 0,
        wind_speed: json.wind?.speed ?? 0,
        wind_deg: json.wind?.deg ?? 0,
        visibility: json.visibility ? Math.round(json.visibility / 1000) : 0,
        condition: json.weather?.[0]?.main ?? "Clear",
        description: json.weather?.[0]?.description ?? "",
        icon: json.weather?.[0]?.icon ?? "01d",
        sunrise: json.sys?.sunrise ?? 0,
        sunset: json.sys?.sunset ?? 0,
      },
      error: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Network/Fetch Error: ${msg}` };
  }
}

export async function getAirPollutionData(lat: number, lon: number): Promise<{ data: AirPollutionData | null; error: string | null }> {
  try {
    const url = `${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      return { data: null, error: `OpenWeather Air Pollution HTTP ${res.status}` };
    }
    const json = await res.json();
    const list = json.list?.[0];
    if (!list) return { data: null, error: "No pollution payload" };
    return {
      data: {
        aqi: list.main?.aqi ?? 0,
        co: list.components?.co ?? 0,
        no: list.components?.no ?? 0,
        no2: list.components?.no2 ?? 0,
        o3: list.components?.o3 ?? 0,
        so2: list.components?.so2 ?? 0,
        pm2_5: list.components?.pm2_5 ?? 0,
        pm10: list.components?.pm10 ?? 0,
        nh3: list.components?.nh3 ?? 0,
      },
      error: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { data: null, error: msg };
  }
}

export async function searchLocation(query: string): Promise<{ data: GeoLocation[]; error: string | null }> {
  try {
    const url = `${GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${OPENWEATHER_KEY}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) {
      return { data: [], error: `Geocoding HTTP ${res.status}` };
    }
    const json = (await res.json()) as GeoLocation[];
    return { data: json, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { data: [], error: msg };
  }
}

export async function searchGlobalLocation(query: string): Promise<{ data: GeoLocation[] | null; error: string | null }> {
  try {
    const url = `${GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${OPENWEATHER_KEY}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      if (res.status === 401) {
        return { data: null, error: "OpenWeather API Key Unauthorized (401)" };
      }
      return { data: null, error: `OpenWeather Geo API Error: ${res.status}` };
    }
    const data: GeoLocation[] = await res.json();
    return { data, error: null };
  } catch (error: unknown) {
    console.error("OpenWeather Geo API Fetch Error:", error);
    return { data: null, error: (error as Error).message };
  }
}

