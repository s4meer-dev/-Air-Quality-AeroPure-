/**
 * AeroPure Location Registry
 * ==========================
 * Curated set of supported Indian cities and areas with real GPS coordinates.
 * No air-quality values are stored here — those come from the ML model.
 */

export interface Area {
  slug: string;
  name: string;
  lat: number;
  lon: number;
  /** Which of the 3 validated regimes this area typically represents (0=Moderate,1=Low,2=Severe) */
  defaultRegimeHint: 0 | 1 | 2;
}

export interface City {
  slug: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  areas: Area[];
}

export const CITIES: City[] = [
  {
    slug: "hyderabad",
    name: "Hyderabad",
    country: "India",
    lat: 17.385,
    lon: 78.4867,
    areas: [
      { slug: "gachibowli",   name: "Gachibowli",   lat: 17.44,  lon: 78.35,  defaultRegimeHint: 0 },
      { slug: "hitec-city",   name: "HITEC City",    lat: 17.447, lon: 78.376, defaultRegimeHint: 0 },
      { slug: "banjara-hills",name: "Banjara Hills", lat: 17.41,  lon: 78.448, defaultRegimeHint: 1 },
      { slug: "jubilee-hills",name: "Jubilee Hills",  lat: 17.432, lon: 78.409, defaultRegimeHint: 1 },
      { slug: "secunderabad", name: "Secunderabad",   lat: 17.441, lon: 78.499, defaultRegimeHint: 2 },
      { slug: "lb-nagar",     name: "L.B. Nagar",    lat: 17.349, lon: 78.552, defaultRegimeHint: 2 },
    ],
  },
  {
    slug: "delhi",
    name: "Delhi",
    country: "India",
    lat: 28.6139,
    lon: 77.209,
    areas: [
      { slug: "connaught-place", name: "Connaught Place", lat: 28.633,  lon: 77.22,  defaultRegimeHint: 2 },
      { slug: "dwarka",          name: "Dwarka",           lat: 28.5921, lon: 77.046, defaultRegimeHint: 2 },
      { slug: "rohini",          name: "Rohini",           lat: 28.735,  lon: 77.112, defaultRegimeHint: 2 },
      { slug: "saket",           name: "Saket",            lat: 28.524,  lon: 77.208, defaultRegimeHint: 0 },
      { slug: "vasant-kunj",     name: "Vasant Kunj",      lat: 28.52,   lon: 77.155, defaultRegimeHint: 0 },
    ],
  },
  {
    slug: "mumbai",
    name: "Mumbai",
    country: "India",
    lat: 19.076,
    lon: 72.8777,
    areas: [
      { slug: "bandra",         name: "Bandra",          lat: 19.054,  lon: 72.841,  defaultRegimeHint: 0 },
      { slug: "andheri",        name: "Andheri",          lat: 19.119,  lon: 72.847,  defaultRegimeHint: 0 },
      { slug: "worli",          name: "Worli",            lat: 19.015,  lon: 72.813,  defaultRegimeHint: 1 },
      { slug: "thane",          name: "Thane",            lat: 19.218,  lon: 72.978,  defaultRegimeHint: 2 },
      { slug: "powai",          name: "Powai",            lat: 19.118,  lon: 72.906,  defaultRegimeHint: 1 },
    ],
  },
  {
    slug: "bengaluru",
    name: "Bengaluru",
    country: "India",
    lat: 12.9716,
    lon: 77.5946,
    areas: [
      { slug: "whitefield",    name: "Whitefield",    lat: 12.97,  lon: 77.75,  defaultRegimeHint: 0 },
      { slug: "koramangala",   name: "Koramangala",   lat: 12.935, lon: 77.626, defaultRegimeHint: 0 },
      { slug: "electronic-city", name: "Electronic City", lat: 12.845, lon: 77.664, defaultRegimeHint: 1 },
      { slug: "marathahalli",  name: "Marathahalli",  lat: 12.956, lon: 77.702, defaultRegimeHint: 0 },
      { slug: "hebbal",        name: "Hebbal",        lat: 13.035, lon: 77.597, defaultRegimeHint: 2 },
    ],
  },
  {
    slug: "chennai",
    name: "Chennai",
    country: "India",
    lat: 13.0827,
    lon: 80.2707,
    areas: [
      { slug: "t-nagar",        name: "T. Nagar",       lat: 13.04,  lon: 80.234, defaultRegimeHint: 2 },
      { slug: "anna-nagar",     name: "Anna Nagar",     lat: 13.085, lon: 80.21,  defaultRegimeHint: 0 },
      { slug: "velachery",      name: "Velachery",      lat: 12.978, lon: 80.221, defaultRegimeHint: 0 },
      { slug: "omr",            name: "OMR",            lat: 12.9,   lon: 80.229, defaultRegimeHint: 1 },
      { slug: "adyar",          name: "Adyar",          lat: 13.006, lon: 80.256, defaultRegimeHint: 1 },
    ],
  },
  {
    slug: "kolkata",
    name: "Kolkata",
    country: "India",
    lat: 22.5726,
    lon: 88.3639,
    areas: [
      { slug: "park-street",   name: "Park Street",   lat: 22.55,  lon: 88.352, defaultRegimeHint: 2 },
      { slug: "salt-lake",     name: "Salt Lake",     lat: 22.573, lon: 88.428, defaultRegimeHint: 0 },
      { slug: "howrah",        name: "Howrah",        lat: 22.587, lon: 88.31,  defaultRegimeHint: 2 },
      { slug: "new-town",      name: "New Town",      lat: 22.623, lon: 88.462, defaultRegimeHint: 1 },
    ],
  },
  {
    slug: "pune",
    name: "Pune",
    country: "India",
    lat: 18.5204,
    lon: 73.8567,
    areas: [
      { slug: "hinjewadi",     name: "Hinjewadi",     lat: 18.592, lon: 73.737, defaultRegimeHint: 0 },
      { slug: "kothrud",       name: "Kothrud",       lat: 18.504, lon: 73.806, defaultRegimeHint: 1 },
      { slug: "viman-nagar",   name: "Viman Nagar",   lat: 18.567, lon: 73.912, defaultRegimeHint: 0 },
      { slug: "pimpri",        name: "Pimpri",        lat: 18.627, lon: 73.804, defaultRegimeHint: 2 },
    ],
  },
  {
    slug: "ahmedabad",
    name: "Ahmedabad",
    country: "India",
    lat: 23.0225,
    lon: 72.5714,
    areas: [
      { slug: "sg-highway",    name: "SG Highway",    lat: 23.061, lon: 72.519, defaultRegimeHint: 0 },
      { slug: "navrangpura",   name: "Navrangpura",   lat: 23.031, lon: 72.563, defaultRegimeHint: 1 },
      { slug: "satellite",     name: "Satellite",     lat: 23.03,  lon: 72.528, defaultRegimeHint: 0 },
      { slug: "maninagar",     name: "Maninagar",     lat: 22.995, lon: 72.601, defaultRegimeHint: 2 },
    ],
  },
];

// ── Lookup helpers ────────────────────────────────────────────────────────────

export function getCity(citySlug: string): City | undefined {
  return CITIES.find((c) => c.slug === citySlug);
}

export function getArea(citySlug: string, areaSlug: string): Area | undefined {
  return getCity(citySlug)?.areas.find((a) => a.slug === areaSlug);
}

export function searchCities(query: string): City[] {
  const q = query.toLowerCase().trim();
  if (!q) return CITIES;
  return CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) || c.slug.includes(q)
  );
}

export function searchAreas(citySlug: string, query: string): Area[] {
  const city = getCity(citySlug);
  if (!city) return [];
  const q = query.toLowerCase().trim();
  if (!q) return city.areas;
  return city.areas.filter(
    (a) => a.name.toLowerCase().includes(q) || a.slug.includes(q)
  );
}

export const POPULAR_SEARCHES: Array<{ city: City; area: Area }> = [
  { city: CITIES[0], area: CITIES[0].areas[0] }, // Hyderabad / Gachibowli
  { city: CITIES[1], area: CITIES[1].areas[0] }, // Delhi / Connaught Place
  { city: CITIES[2], area: CITIES[2].areas[0] }, // Mumbai / Bandra
  { city: CITIES[3], area: CITIES[3].areas[0] }, // Bengaluru / Whitefield
  { city: CITIES[4], area: CITIES[4].areas[0] }, // Chennai / T.Nagar
  { city: CITIES[5], area: CITIES[5].areas[1] }, // Kolkata / Salt Lake
];
