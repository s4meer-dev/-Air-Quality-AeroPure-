/**
 * AeroPure Global Location Registry & Geospatial Index
 * ===================================================
 * 6-Level Continuous Hierarchy:
 * Earth -> Continent -> Country -> State/Region -> City -> Locality Area
 */

export interface Area {
  slug: string;
  name: string;
  lat: number;
  lon: number;
  /** Typical regime hint for baseline demo input construction (0=Moderate, 1=Low, 2=Severe) */
  defaultRegimeHint: 0 | 1 | 2;
}

export interface City {
  slug: string;
  name: string;
  state: string;
  stateId: string;
  country: string;
  countryId: string;
  continentId: string;
  lat: number;
  lon: number;
  isCapital: boolean;
  type: "state_capital" | "major_city";
  areas: Area[];
}

export interface StateRegion {
  id: string;
  name: string;
  code: string;
  countryId: string;
  continentId: string;
  lat: number;
  lon: number;
  cityCount: number;
}

export interface Country {
  id: string;
  name: string;
  code: string;
  continentId: string;
  lat: number;
  lon: number;
  stateCount: number;
}

export interface Continent {
  id: string;
  name: string;
  code: string;
  subtitle: string;
  countryCount: number;
  lat: number;
  lon: number;
  description: string;
}

// ── 1. CONTINENTS ─────────────────────────────────────────────────────────────

export const CONTINENTS: Continent[] = [
  {
    id: "asia",
    name: "Asia",
    code: "AS",
    subtitle: "Eastern Atmospheric Shield & Monsoon Belt",
    countryCount: 48,
    lat: 34.0479,
    lon: 100.6197,
    description: "Expansive landmass featuring high-density industrial basins, Himalayan weather barriers, and seasonal monsoon cycles.",
  },
  {
    id: "europe",
    name: "Europe",
    code: "EU",
    subtitle: "North Atlantic & Mediterranean Air Corridors",
    countryCount: 44,
    lat: 54.526,
    lon: 15.2551,
    description: "Temperate marine and continental air regimes shaped by Westerlies, Alps topography, and stringent EU emissions standards.",
  },
  {
    id: "north-america",
    name: "North America",
    code: "NA",
    subtitle: "Boreal & Coastal Jet-Stream Systems",
    countryCount: 23,
    lat: 54.526,
    lon: -105.2551,
    description: "Dynamic polar air mass interactions spanning Pacific coastal basins, Great Plains, and Appalachian corridors.",
  },
  {
    id: "south-america",
    name: "South America",
    code: "SA",
    subtitle: "Amazonian Basin & Andean Topographic Shield",
    countryCount: 12,
    lat: -8.7832,
    lon: -55.4915,
    description: "Vast rainforest oxygen sinks and high-altitude Andean dispersion boundaries.",
  },
  {
    id: "africa",
    name: "Africa",
    code: "AF",
    subtitle: "Saharan Mineral Dust & Equatorial Boundary Zone",
    countryCount: 54,
    lat: -8.7832,
    lon: 34.5085,
    description: "Dominant dust plume transports, ITCZ shifts, and rapidly expanding urban industrial nodes.",
  },
  {
    id: "oceania",
    name: "Oceania",
    code: "OC",
    subtitle: "Pacific Marine Boundary Layer & Maritime Air",
    countryCount: 14,
    lat: -22.7359,
    lon: 140.0188,
    description: "Clean maritime air masses dominated by Southern Ocean wind patterns and coastal urban clusters.",
  },
  {
    id: "antarctica",
    name: "Antarctica",
    code: "AN",
    subtitle: "Polar Cryospheric Reserve & Clean Air Baseline",
    countryCount: 1,
    lat: -82.8628,
    lon: 135.0,
    description: "Global baseline pristine atmospheric monitoring zone under polar vortex isolation.",
  },
];

// ── 2. COUNTRIES ──────────────────────────────────────────────────────────────

export const COUNTRIES: Country[] = [
  // ASIA
  { id: "india", name: "India", code: "IN", continentId: "asia", lat: 20.5937, lon: 78.9629, stateCount: 28 },
  { id: "japan", name: "Japan", code: "JP", continentId: "asia", lat: 36.2048, lon: 138.2529, stateCount: 8 },
  { id: "uae", name: "United Arab Emirates", code: "AE", continentId: "asia", lat: 23.4241, lon: 53.8478, stateCount: 7 },
  { id: "singapore", name: "Singapore", code: "SG", continentId: "asia", lat: 1.3521, lon: 103.8198, stateCount: 1 },

  // EUROPE
  { id: "germany", name: "Germany", code: "DE", continentId: "europe", lat: 51.1657, lon: 10.4515, stateCount: 16 },
  { id: "united-kingdom", name: "United Kingdom", code: "GB", continentId: "europe", lat: 55.3781, lon: -3.436, stateCount: 4 },
  { id: "france", name: "France", code: "FR", continentId: "europe", lat: 46.2276, lon: 2.2137, stateCount: 18 },

  // NORTH AMERICA
  { id: "united-states", name: "United States", code: "US", continentId: "north-america", lat: 37.0902, lon: -95.7129, stateCount: 50 },
  { id: "canada", name: "Canada", code: "CA", continentId: "north-america", lat: 56.1304, lon: -106.3468, stateCount: 10 },

  // SOUTH AMERICA
  { id: "brazil", name: "Brazil", code: "BR", continentId: "south-america", lat: -14.235, lon: -51.9253, stateCount: 26 },

  // AFRICA
  { id: "egypt", name: "Egypt", code: "EG", continentId: "africa", lat: 26.8206, lon: 30.8025, stateCount: 27 },
  { id: "south-africa", name: "South Africa", code: "ZA", continentId: "africa", lat: -30.5595, lon: 22.9375, stateCount: 9 },

  // OCEANIA
  { id: "australia", name: "Australia", code: "AU", continentId: "oceania", lat: -25.2744, lon: 133.7751, stateCount: 6 },

  // ANTARCTICA
  { id: "antarctica-terr", name: "Antarctica Reserve", code: "AQ", continentId: "antarctica", lat: -82.8628, lon: 135.0, stateCount: 1 },
];

// ── 3. STATES / ADMINISTRATIVE REGIONS ───────────────────────────────────────

export const STATES: StateRegion[] = [
  // INDIA STATES & UTS
  { id: "telangana", name: "Telangana", code: "TG", countryId: "india", continentId: "asia", lat: 18.1124, lon: 79.0193, cityCount: 5 },
  { id: "maharashtra", name: "Maharashtra", code: "MH", countryId: "india", continentId: "asia", lat: 19.7515, lon: 75.7139, cityCount: 3 },
  { id: "karnataka", name: "Karnataka", code: "KA", countryId: "india", continentId: "asia", lat: 15.3173, lon: 75.7139, cityCount: 2 },
  { id: "delhi-nct", name: "Delhi NCT", code: "DL", countryId: "india", continentId: "asia", lat: 28.7041, lon: 77.1025, cityCount: 1 },
  { id: "tamil-nadu", name: "Tamil Nadu", code: "TN", countryId: "india", continentId: "asia", lat: 11.1271, lon: 78.6569, cityCount: 2 },
  { id: "west-bengal", name: "West Bengal", code: "WB", countryId: "india", continentId: "asia", lat: 22.9868, lon: 87.855, cityCount: 1 },
  { id: "gujarat", name: "Gujarat", code: "GJ", countryId: "india", continentId: "asia", lat: 22.2587, lon: 71.1924, cityCount: 3 },
  { id: "uttar-pradesh", name: "Uttar Pradesh", code: "UP", countryId: "india", continentId: "asia", lat: 26.8467, lon: 80.9462, cityCount: 3 },
  { id: "bihar", name: "Bihar", code: "BR", countryId: "india", continentId: "asia", lat: 25.0961, lon: 85.3131, cityCount: 1 },
  { id: "madhya-pradesh", name: "Madhya Pradesh", code: "MP", countryId: "india", continentId: "asia", lat: 22.9734, lon: 78.6569, cityCount: 2 },
  { id: "punjab-haryana", name: "Punjab & Haryana", code: "PB-HR", countryId: "india", continentId: "asia", lat: 30.7333, lon: 76.7794, cityCount: 1 },
  { id: "odisha", name: "Odisha", code: "OR", countryId: "india", continentId: "asia", lat: 20.9517, lon: 85.0985, cityCount: 1 },
  { id: "assam", name: "Assam", code: "AS", countryId: "india", continentId: "asia", lat: 26.2006, lon: 92.9376, cityCount: 1 },
  { id: "kerala", name: "Kerala", code: "KL", countryId: "india", continentId: "asia", lat: 10.8505, lon: 76.2711, cityCount: 2 },
  { id: "jharkhand", name: "Jharkhand", code: "JH", countryId: "india", continentId: "asia", lat: 23.6102, lon: 85.2799, cityCount: 1 },
  { id: "uttarakhand", name: "Uttarakhand", code: "UK", countryId: "india", continentId: "asia", lat: 30.0668, lon: 79.0193, cityCount: 1 },
  { id: "himachal-pradesh", name: "Himachal Pradesh", code: "HP", countryId: "india", continentId: "asia", lat: 31.1048, lon: 77.1734, cityCount: 1 },
  { id: "jammu-kashmir", name: "Jammu & Kashmir", code: "JK", countryId: "india", continentId: "asia", lat: 33.7782, lon: 76.5762, cityCount: 1 },
  { id: "chhattisgarh", name: "Chhattisgarh", code: "CG", countryId: "india", continentId: "asia", lat: 21.2787, lon: 81.8661, cityCount: 1 },
  { id: "goa", name: "Goa", code: "GA", countryId: "india", continentId: "asia", lat: 15.2993, lon: 74.124, cityCount: 1 },
  { id: "andhra-pradesh", name: "Andhra Pradesh", code: "AP", countryId: "india", continentId: "asia", lat: 15.9129, lon: 79.74, cityCount: 2 },
  { id: "rajasthan", name: "Rajasthan", code: "RJ", countryId: "india", continentId: "asia", lat: 27.0238, lon: 74.2179, cityCount: 1 },

  // GERMANY STATES
  { id: "bavaria", name: "Bavaria", code: "BY", countryId: "germany", continentId: "europe", lat: 48.7904, lon: 11.4979, cityCount: 2 },
  { id: "berlin-state", name: "Berlin State", code: "BE", countryId: "germany", continentId: "europe", lat: 52.52, lon: 13.405, cityCount: 1 },
  { id: "hesse", name: "Hesse", code: "HE", countryId: "germany", continentId: "europe", lat: 50.6521, lon: 9.1624, cityCount: 1 },

  // USA STATES
  { id: "california", name: "California", code: "CA", countryId: "united-states", continentId: "north-america", lat: 36.7783, lon: -119.4179, cityCount: 3 },
  { id: "new-york-state", name: "New York State", code: "NY", countryId: "united-states", continentId: "north-america", lat: 40.7128, lon: -74.006, cityCount: 1 },
  { id: "texas", name: "Texas", code: "TX", countryId: "united-states", continentId: "north-america", lat: 31.9686, lon: -99.9018, cityCount: 2 },
  { id: "washington-state", name: "Washington State", code: "WA", countryId: "united-states", continentId: "north-america", lat: 47.7511, lon: -120.7401, cityCount: 1 },

  // JAPAN REGIONS
  { id: "kanto", name: "Kanto Region", code: "KT", countryId: "japan", continentId: "asia", lat: 35.6762, lon: 139.6503, cityCount: 1 },

  // UAE EMIRATES
  { id: "dubai-emirate", name: "Dubai Emirate", code: "DXB", countryId: "uae", continentId: "asia", lat: 25.2048, lon: 55.2708, cityCount: 1 },

  // FRANCE REGIONS
  { id: "ile-de-france", name: "Île-de-France", code: "IDF", countryId: "france", continentId: "europe", lat: 48.8499, lon: 2.637, cityCount: 1 },

  // UK REGIONS
  { id: "england", name: "England", code: "ENG", countryId: "united-kingdom", continentId: "europe", lat: 52.3555, lon: -1.1743, cityCount: 1 },

  // CANADA PROVINCES
  { id: "ontario", name: "Ontario", code: "ON", countryId: "canada", continentId: "north-america", lat: 51.2538, lon: -85.3232, cityCount: 1 },

  // AUSTRALIA STATES
  { id: "new-south-wales", name: "New South Wales", code: "NSW", countryId: "australia", continentId: "oceania", lat: -31.8402, lon: 145.6128, cityCount: 1 },

  // BRAZIL STATES
  { id: "sao-paulo-state", name: "São Paulo State", code: "SP", countryId: "brazil", continentId: "south-america", lat: -23.5505, lon: -46.6333, cityCount: 1 },

  // EGYPT GOVERNORATES
  { id: "cairo-gov", name: "Cairo Governorate", code: "CRI", countryId: "egypt", continentId: "africa", lat: 30.0444, lon: 31.2357, cityCount: 1 },

  // SOUTH AFRICA PROVINCES
  { id: "gauteng", name: "Gauteng", code: "GP", countryId: "south-africa", continentId: "africa", lat: -26.2708, lon: 28.1123, cityCount: 1 },

  // ANTARCTICA
  { id: "antarctic-peninsula", name: "Antarctic Peninsula", code: "AP", countryId: "antarctica-terr", continentId: "antarctica", lat: -69.5, lon: -65.0, cityCount: 1 },
];

// ── 4. CITIES & LOCALITIES ──────────────────────────────────────────────────

export const CITIES: City[] = [
  // ── TELANGANA, INDIA ──
  {
    slug: "hyderabad",
    name: "Hyderabad",
    state: "Telangana",
    stateId: "telangana",
    country: "India",
    countryId: "india",
    continentId: "asia",
    lat: 17.385,
    lon: 78.4867,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "gachibowli", name: "Gachibowli", lat: 17.44, lon: 78.35, defaultRegimeHint: 0 },
      { slug: "hitec-city", name: "HITEC City", lat: 17.447, lon: 78.376, defaultRegimeHint: 0 },
      { slug: "madhapur", name: "Madhapur", lat: 17.448, lon: 78.391, defaultRegimeHint: 0 },
      { slug: "banjara-hills", name: "Banjara Hills", lat: 17.41, lon: 78.448, defaultRegimeHint: 1 },
      { slug: "jubilee-hills", name: "Jubilee Hills", lat: 17.432, lon: 78.409, defaultRegimeHint: 1 },
      { slug: "kondapur", name: "Kondapur", lat: 17.464, lon: 78.365, defaultRegimeHint: 0 },
      { slug: "kukatpally", name: "Kukatpally", lat: 17.485, lon: 78.41, defaultRegimeHint: 2 },
      { slug: "secunderabad", name: "Secunderabad", lat: 17.441, lon: 78.499, defaultRegimeHint: 2 },
    ],
  },
  {
    slug: "warangal",
    name: "Warangal",
    state: "Telangana",
    stateId: "telangana",
    country: "India",
    countryId: "india",
    continentId: "asia",
    lat: 17.9689,
    lon: 79.5941,
    isCapital: false,
    type: "major_city",
    areas: [
      { slug: "hanamkonda", name: "Hanamkonda", lat: 18.007, lon: 79.558, defaultRegimeHint: 1 },
      { slug: "kazipet", name: "Kazipet", lat: 17.981, lon: 79.521, defaultRegimeHint: 1 },
    ],
  },
  {
    slug: "nizamabad",
    name: "Nizamabad",
    state: "Telangana",
    stateId: "telangana",
    country: "India",
    countryId: "india",
    continentId: "asia",
    lat: 18.6725,
    lon: 78.0941,
    isCapital: false,
    type: "major_city",
    areas: [
      { slug: "khaleelwadi", name: "Khaleelwadi", lat: 18.675, lon: 78.098, defaultRegimeHint: 1 },
    ],
  },
  {
    slug: "karimnagar",
    name: "Karimnagar",
    state: "Telangana",
    stateId: "telangana",
    country: "India",
    countryId: "india",
    continentId: "asia",
    lat: 18.4386,
    lon: 79.1288,
    isCapital: false,
    type: "major_city",
    areas: [
      { slug: "collectorate-zone", name: "Collectorate Zone", lat: 18.441, lon: 79.131, defaultRegimeHint: 1 },
    ],
  },
  {
    slug: "khammam",
    name: "Khammam",
    state: "Telangana",
    stateId: "telangana",
    country: "India",
    countryId: "india",
    continentId: "asia",
    lat: 17.2473,
    lon: 80.1514,
    isCapital: false,
    type: "major_city",
    areas: [
      { slug: "wyra-road", name: "Wyra Road", lat: 17.251, lon: 80.154, defaultRegimeHint: 1 },
    ],
  },

  // ── DELHI NCT, INDIA ──
  {
    slug: "delhi",
    name: "Delhi",
    state: "Delhi NCT",
    stateId: "delhi-nct",
    country: "India",
    countryId: "india",
    continentId: "asia",
    lat: 28.6139,
    lon: 77.209,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "connaught-place", name: "Connaught Place", lat: 28.633, lon: 77.22, defaultRegimeHint: 2 },
      { slug: "dwarka", name: "Dwarka", lat: 28.5921, lon: 77.046, defaultRegimeHint: 2 },
      { slug: "rohini", name: "Rohini", lat: 28.735, lon: 77.112, defaultRegimeHint: 2 },
      { slug: "saket", name: "Saket", lat: 28.524, lon: 77.208, defaultRegimeHint: 0 },
      { slug: "vasant-kunj", name: "Vasant Kunj", lat: 28.52, lon: 77.155, defaultRegimeHint: 0 },
      { slug: "lajpat-nagar", name: "Lajpat Nagar", lat: 28.567, lon: 77.243, defaultRegimeHint: 2 },
      { slug: "noida", name: "Noida Sector 18", lat: 28.57, lon: 77.326, defaultRegimeHint: 2 },
    ],
  },

  // ── MAHARASHTRA, INDIA ──
  {
    slug: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    stateId: "maharashtra",
    country: "India",
    countryId: "india",
    continentId: "asia",
    lat: 19.076,
    lon: 72.8777,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "bandra", name: "Bandra", lat: 19.054, lon: 72.841, defaultRegimeHint: 0 },
      { slug: "andheri", name: "Andheri", lat: 19.119, lon: 72.847, defaultRegimeHint: 0 },
      { slug: "powai", name: "Powai", lat: 19.118, lon: 72.906, defaultRegimeHint: 1 },
      { slug: "worli", name: "Worli", lat: 19.015, lon: 72.813, defaultRegimeHint: 1 },
      { slug: "colaba", name: "Colaba", lat: 18.906, lon: 72.814, defaultRegimeHint: 1 },
      { slug: "lower-parel", name: "Lower Parel", lat: 18.995, lon: 72.83, defaultRegimeHint: 2 },
      { slug: "borivali", name: "Borivali", lat: 19.23, lon: 72.856, defaultRegimeHint: 0 },
    ],
  },
  {
    slug: "pune",
    name: "Pune",
    state: "Maharashtra",
    stateId: "maharashtra",
    country: "India",
    countryId: "india",
    continentId: "asia",
    lat: 18.5204,
    lon: 73.8567,
    isCapital: false,
    type: "major_city",
    areas: [
      { slug: "hinjewadi", name: "Hinjewadi", lat: 18.592, lon: 73.737, defaultRegimeHint: 0 },
      { slug: "kothrud", name: "Kothrud", lat: 18.504, lon: 73.806, defaultRegimeHint: 1 },
      { slug: "viman-nagar", name: "Viman Nagar", lat: 18.567, lon: 73.912, defaultRegimeHint: 0 },
    ],
  },
  {
    slug: "nagpur",
    name: "Nagpur",
    state: "Maharashtra",
    stateId: "maharashtra",
    country: "India",
    countryId: "india",
    continentId: "asia",
    lat: 21.1458,
    lon: 79.0882,
    isCapital: false,
    type: "major_city",
    areas: [
      { slug: "dharampeth", name: "Dharampeth", lat: 21.142, lon: 79.062, defaultRegimeHint: 1 },
      { slug: "sitabuldi", name: "Sitabuldi", lat: 21.146, lon: 79.083, defaultRegimeHint: 2 },
    ],
  },

  // ── KARNATAKA, INDIA ──
  {
    slug: "bengaluru",
    name: "Bengaluru",
    state: "Karnataka",
    stateId: "karnataka",
    country: "India",
    countryId: "india",
    continentId: "asia",
    lat: 12.9716,
    lon: 77.5946,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "whitefield", name: "Whitefield", lat: 12.97, lon: 77.75, defaultRegimeHint: 0 },
      { slug: "koramangala", name: "Koramangala", lat: 12.935, lon: 77.626, defaultRegimeHint: 0 },
      { slug: "indiranagar", name: "Indiranagar", lat: 12.978, lon: 77.64, defaultRegimeHint: 0 },
      { slug: "electronic-city", name: "Electronic City", lat: 12.845, lon: 77.664, defaultRegimeHint: 1 },
      { slug: "hebbal", name: "Hebbal", lat: 13.035, lon: 77.597, defaultRegimeHint: 2 },
      { slug: "hsr-layout", name: "HSR Layout", lat: 12.912, lon: 77.644, defaultRegimeHint: 0 },
    ],
  },

  // ── TAMIL NADU, INDIA ──
  {
    slug: "chennai",
    name: "Chennai",
    state: "Tamil Nadu",
    stateId: "tamil-nadu",
    country: "India",
    countryId: "india",
    continentId: "asia",
    lat: 13.0827,
    lon: 80.2707,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "t-nagar", name: "T. Nagar", lat: 13.04, lon: 80.234, defaultRegimeHint: 2 },
      { slug: "anna-nagar", name: "Anna Nagar", lat: 13.085, lon: 80.21, defaultRegimeHint: 0 },
      { slug: "velachery", name: "Velachery", lat: 12.978, lon: 80.221, defaultRegimeHint: 0 },
      { slug: "omr", name: "OMR", lat: 12.9, lon: 80.229, defaultRegimeHint: 1 },
    ],
  },

  // ── WEST BENGAL, INDIA ──
  {
    slug: "kolkata",
    name: "Kolkata",
    state: "West Bengal",
    stateId: "west-bengal",
    country: "India",
    countryId: "india",
    continentId: "asia",
    lat: 22.5726,
    lon: 88.3639,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "park-street", name: "Park Street", lat: 22.55, lon: 88.352, defaultRegimeHint: 2 },
      { slug: "salt-lake", name: "Salt Lake", lat: 22.573, lon: 88.428, defaultRegimeHint: 0 },
      { slug: "new-town", name: "New Town", lat: 22.623, lon: 88.462, defaultRegimeHint: 1 },
    ],
  },

  // ── GUJARAT, INDIA ──
  {
    slug: "ahmedabad",
    name: "Ahmedabad",
    state: "Gujarat",
    stateId: "gujarat",
    country: "India",
    countryId: "india",
    continentId: "asia",
    lat: 23.0225,
    lon: 72.5714,
    isCapital: false,
    type: "major_city",
    areas: [
      { slug: "sg-highway", name: "SG Highway", lat: 23.061, lon: 72.519, defaultRegimeHint: 0 },
      { slug: "navrangpura", name: "Navrangpura", lat: 23.031, lon: 72.563, defaultRegimeHint: 1 },
    ],
  },

  // ── UTTAR PRADESH, INDIA ──
  {
    slug: "lucknow",
    name: "Lucknow",
    state: "Uttar Pradesh",
    stateId: "uttar-pradesh",
    country: "India",
    countryId: "india",
    continentId: "asia",
    lat: 26.8467,
    lon: 80.9462,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "hazratganj", name: "Hazratganj", lat: 26.853, lon: 80.946, defaultRegimeHint: 2 },
      { slug: "gomti-nagar", name: "Gomti Nagar", lat: 26.851, lon: 81.0, defaultRegimeHint: 0 },
    ],
  },

  // ── BAVARIA, GERMANY ──
  {
    slug: "munich",
    name: "Munich",
    state: "Bavaria",
    stateId: "bavaria",
    country: "Germany",
    countryId: "germany",
    continentId: "europe",
    lat: 48.1351,
    lon: 11.582,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "altstadt", name: "Altstadt", lat: 48.137, lon: 11.575, defaultRegimeHint: 1 },
      { slug: "schwabing", name: "Schwabing", lat: 48.161, lon: 11.586, defaultRegimeHint: 1 },
      { slug: "maxvorstadt", name: "Maxvorstadt", lat: 48.148, lon: 11.568, defaultRegimeHint: 1 },
      { slug: "bogenhausen", name: "Bogenhausen", lat: 48.151, lon: 11.618, defaultRegimeHint: 1 },
    ],
  },

  // ── BERLIN STATE, GERMANY ──
  {
    slug: "berlin",
    name: "Berlin",
    state: "Berlin State",
    stateId: "berlin-state",
    country: "Germany",
    countryId: "germany",
    continentId: "europe",
    lat: 52.52,
    lon: 13.405,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "mitte", name: "Mitte", lat: 52.52, lon: 13.405, defaultRegimeHint: 1 },
      { slug: "kreuzberg", name: "Kreuzberg", lat: 52.498, lon: 13.407, defaultRegimeHint: 1 },
      { slug: "charlottenburg", name: "Charlottenburg", lat: 52.516, lon: 13.303, defaultRegimeHint: 1 },
    ],
  },

  // ── CALIFORNIA, USA ──
  {
    slug: "san-francisco",
    name: "San Francisco",
    state: "California",
    stateId: "california",
    country: "United States",
    countryId: "united-states",
    continentId: "north-america",
    lat: 37.7749,
    lon: -122.4194,
    isCapital: false,
    type: "major_city",
    areas: [
      { slug: "financial-district", name: "Financial District", lat: 37.794, lon: -122.401, defaultRegimeHint: 1 },
      { slug: "soma", name: "SoMa", lat: 37.778, lon: -122.397, defaultRegimeHint: 1 },
      { slug: "mission-district", name: "Mission District", lat: 37.759, lon: -122.414, defaultRegimeHint: 1 },
      { slug: "presidio", name: "Presidio", lat: 37.798, lon: -122.466, defaultRegimeHint: 1 },
    ],
  },
  {
    slug: "los-angeles",
    name: "Los Angeles",
    state: "California",
    stateId: "california",
    country: "United States",
    countryId: "united-states",
    continentId: "north-america",
    lat: 34.0522,
    lon: -118.2437,
    isCapital: false,
    type: "major_city",
    areas: [
      { slug: "downtown-la", name: "Downtown LA", lat: 34.04, lon: -118.246, defaultRegimeHint: 2 },
      { slug: "santa-monica", name: "Santa Monica", lat: 34.019, lon: -118.491, defaultRegimeHint: 1 },
      { slug: "hollywood", name: "Hollywood", lat: 34.101, lon: -118.326, defaultRegimeHint: 2 },
    ],
  },

  // ── NEW YORK STATE, USA ──
  {
    slug: "new-york-city",
    name: "New York City",
    state: "New York State",
    stateId: "new-york-state",
    country: "United States",
    countryId: "united-states",
    continentId: "north-america",
    lat: 40.7128,
    lon: -74.006,
    isCapital: false,
    type: "major_city",
    areas: [
      { slug: "manhattan", name: "Manhattan", lat: 40.7831, lon: -73.9712, defaultRegimeHint: 2 },
      { slug: "brooklyn", name: "Brooklyn", lat: 40.6782, lon: -73.9442, defaultRegimeHint: 1 },
      { slug: "queens", name: "Queens", lat: 40.7282, lon: -73.7949, defaultRegimeHint: 1 },
    ],
  },

  // ── KANTO, JAPAN ──
  {
    slug: "tokyo",
    name: "Tokyo",
    state: "Kanto Region",
    stateId: "kanto",
    country: "Japan",
    countryId: "japan",
    continentId: "asia",
    lat: 35.6762,
    lon: 139.6503,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "shinjuku", name: "Shinjuku", lat: 35.6938, lon: 139.7034, defaultRegimeHint: 1 },
      { slug: "shibuya", name: "Shibuya", lat: 35.658, lon: 139.7016, defaultRegimeHint: 1 },
      { slug: "chiyoda", name: "Chiyoda Central", lat: 35.694, lon: 139.753, defaultRegimeHint: 1 },
      { slug: "ginza", name: "Ginza", lat: 35.671, lon: 139.765, defaultRegimeHint: 1 },
    ],
  },

  // ── DUBAI, UAE ──
  {
    slug: "dubai",
    name: "Dubai",
    state: "Dubai Emirate",
    stateId: "dubai-emirate",
    country: "United Arab Emirates",
    countryId: "uae",
    continentId: "asia",
    lat: 25.2048,
    lon: 55.2708,
    isCapital: false,
    type: "major_city",
    areas: [
      { slug: "downtown-dubai", name: "Downtown Dubai", lat: 25.197, lon: 55.274, defaultRegimeHint: 2 },
      { slug: "dubai-marina", name: "Dubai Marina", lat: 25.077, lon: 55.133, defaultRegimeHint: 1 },
      { slug: "business-bay", name: "Business Bay", lat: 25.185, lon: 55.267, defaultRegimeHint: 2 },
    ],
  },

  // ── ÎLE-DE-FRANCE, FRANCE ──
  {
    slug: "paris",
    name: "Paris",
    state: "Île-de-France",
    stateId: "ile-de-france",
    country: "France",
    countryId: "france",
    continentId: "europe",
    lat: 48.8566,
    lon: 2.3522,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "le-marais", name: "Le Marais", lat: 48.857, lon: 2.359, defaultRegimeHint: 1 },
      { slug: "montmartre", name: "Montmartre", lat: 48.886, lon: 2.343, defaultRegimeHint: 1 },
      { slug: "champs-elysees", name: "Champs-Élysées", lat: 48.869, lon: 2.307, defaultRegimeHint: 2 },
    ],
  },

  // ── ENGLAND, UK ──
  {
    slug: "london",
    name: "London",
    state: "England",
    stateId: "england",
    country: "United Kingdom",
    countryId: "united-kingdom",
    continentId: "europe",
    lat: 51.5074,
    lon: -0.1278,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "city-of-london", name: "City of London", lat: 51.515, lon: -0.092, defaultRegimeHint: 1 },
      { slug: "westminster", name: "Westminster", lat: 51.497, lon: -0.135, defaultRegimeHint: 1 },
      { slug: "canary-wharf", name: "Canary Wharf", lat: 51.505, lon: -0.02, defaultRegimeHint: 1 },
    ],
  },

  // ── ONTARIO, CANADA ──
  {
    slug: "toronto",
    name: "Toronto",
    state: "Ontario",
    stateId: "ontario",
    country: "Canada",
    countryId: "canada",
    continentId: "north-america",
    lat: 43.6532,
    lon: -79.3832,
    isCapital: false,
    type: "major_city",
    areas: [
      { slug: "downtown-toronto", name: "Downtown Toronto", lat: 43.653, lon: -79.383, defaultRegimeHint: 1 },
      { slug: "yorkville", name: "Yorkville", lat: 43.67, lon: -79.393, defaultRegimeHint: 1 },
    ],
  },

  // ── NEW SOUTH WALES, AUSTRALIA ──
  {
    slug: "sydney",
    name: "Sydney",
    state: "New South Wales",
    stateId: "new-south-wales",
    country: "Australia",
    countryId: "australia",
    continentId: "oceania",
    lat: -33.8688,
    lon: 151.2093,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "sydney-cbd", name: "Sydney CBD", lat: -33.868, lon: 151.209, defaultRegimeHint: 1 },
      { slug: "bondi", name: "Bondi Beach Zone", lat: -33.891, lon: 151.274, defaultRegimeHint: 1 },
    ],
  },

  // ── SÃO PAULO, BRAZIL ──
  {
    slug: "sao-paulo",
    name: "São Paulo",
    state: "São Paulo State",
    stateId: "sao-paulo-state",
    country: "Brazil",
    countryId: "brazil",
    continentId: "south-america",
    lat: -23.5505,
    lon: -46.6333,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "paulista", name: "Avenida Paulista", lat: -23.561, lon: -46.655, defaultRegimeHint: 2 },
      { slug: "itaim-bibi", name: "Itaim Bibi", lat: -23.584, lon: -46.677, defaultRegimeHint: 1 },
    ],
  },

  // ── CAIRO, EGYPT ──
  {
    slug: "cairo",
    name: "Cairo",
    state: "Cairo Governorate",
    stateId: "cairo-gov",
    country: "Egypt",
    countryId: "egypt",
    continentId: "africa",
    lat: 30.0444,
    lon: 31.2357,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "tahrir-square", name: "Tahrir Square", lat: 30.044, lon: 31.235, defaultRegimeHint: 2 },
      { slug: "zamalek", name: "Zamalek Island", lat: 30.061, lon: 31.219, defaultRegimeHint: 1 },
    ],
  },

  // ── GAUTENG, SOUTH AFRICA ──
  {
    slug: "johannesburg",
    name: "Johannesburg",
    state: "Gauteng",
    stateId: "gauteng",
    country: "South Africa",
    countryId: "south-africa",
    continentId: "africa",
    lat: -26.2041,
    lon: 28.0473,
    isCapital: false,
    type: "major_city",
    areas: [
      { slug: "sandton", name: "Sandton CBD", lat: -26.107, lon: 28.056, defaultRegimeHint: 1 },
      { slug: "rosebank", name: "Rosebank", lat: -26.145, lon: 28.044, defaultRegimeHint: 1 },
    ],
  },

  // ── ANTARCTICA ──
  {
    slug: "mcmurdo",
    name: "McMurdo Station",
    state: "Antarctic Peninsula",
    stateId: "antarctic-peninsula",
    country: "Antarctica Reserve",
    countryId: "antarctica-terr",
    continentId: "antarctica",
    lat: -77.846,
    lon: 166.676,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "mcmurdo-clean-air", name: "McMurdo Atmospheric Facility", lat: -77.846, lon: 166.676, defaultRegimeHint: 1 },
    ],
  },
];

// ── LOOKUP HELPERS ────────────────────────────────────────────────────────────

export function getContinent(continentId: string): Continent | undefined {
  return CONTINENTS.find((c) => c.id === continentId);
}

export function getCountriesForContinent(continentId: string): Country[] {
  return COUNTRIES.filter((c) => c.continentId === continentId);
}

export function getCountry(countryId: string): Country | undefined {
  return COUNTRIES.find((c) => c.id === countryId);
}

export function getStatesForCountry(countryId: string): StateRegion[] {
  return STATES.filter((s) => s.countryId === countryId);
}

export function getState(stateId: string): StateRegion | undefined {
  return STATES.find((s) => s.id === stateId);
}

export function getCitiesForState(stateId: string): City[] {
  return CITIES.filter((c) => c.stateId === stateId);
}

export function getCity(citySlug: string): City | undefined {
  return CITIES.find((c) => c.slug === citySlug || c.name.toLowerCase() === citySlug.toLowerCase());
}

export function getArea(citySlug: string, areaSlug: string): Area | undefined {
  const city = getCity(citySlug);
  return city?.areas.find((a) => a.slug === areaSlug || a.name.toLowerCase() === areaSlug.toLowerCase());
}

// ── GLOBAL SEARCH INDEX ───────────────────────────────────────────────────────

export interface GlobalSearchResult {
  type: "continent" | "country" | "state" | "city" | "area";
  title: string;
  subtitle: string;
  continentId: string;
  countryId?: string;
  stateId?: string;
  citySlug?: string;
  areaSlug?: string;
  lat: number;
  lon: number;
}

export function searchGlobalLocation(query: string): GlobalSearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: GlobalSearchResult[] = [];

  // 1. Continents
  for (const c of CONTINENTS) {
    if (c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)) {
      results.push({
        type: "continent",
        title: c.name,
        subtitle: `Continent • ${c.countryCount} Countries`,
        continentId: c.id,
        lat: c.lat,
        lon: c.lon,
      });
    }
  }

  // 2. Countries
  for (const co of COUNTRIES) {
    if (co.name.toLowerCase().includes(q) || co.code.toLowerCase().includes(q)) {
      const cont = getContinent(co.continentId);
      results.push({
        type: "country",
        title: co.name,
        subtitle: `Country • ${cont?.name ?? "Global"}`,
        continentId: co.continentId,
        countryId: co.id,
        lat: co.lat,
        lon: co.lon,
      });
    }
  }

  // 3. States
  for (const st of STATES) {
    if (st.name.toLowerCase().includes(q) || st.code.toLowerCase().includes(q)) {
      const country = getCountry(st.countryId);
      results.push({
        type: "state",
        title: st.name,
        subtitle: `State/Region • ${country?.name ?? "Global"}`,
        continentId: st.continentId,
        countryId: st.countryId,
        stateId: st.id,
        lat: st.lat,
        lon: st.lon,
      });
    }
  }

  // 4. Cities
  for (const ci of CITIES) {
    if (ci.name.toLowerCase().includes(q) || ci.slug.includes(q)) {
      results.push({
        type: "city",
        title: ci.name,
        subtitle: `City • ${ci.state}, ${ci.country}`,
        continentId: ci.continentId,
        countryId: ci.countryId,
        stateId: ci.stateId,
        citySlug: ci.slug,
        lat: ci.lat,
        lon: ci.lon,
      });
    }

    // 5. Areas
    for (const ar of ci.areas) {
      if (ar.name.toLowerCase().includes(q) || ar.slug.includes(q)) {
        results.push({
          type: "area",
          title: ar.name,
          subtitle: `Locality • ${ci.name}, ${ci.country}`,
          continentId: ci.continentId,
          countryId: ci.countryId,
          stateId: ci.stateId,
          citySlug: ci.slug,
          areaSlug: ar.slug,
          lat: ar.lat,
          lon: ar.lon,
        });
      }
    }
  }

  return results.slice(0, 10);
}

export function searchCities(query: string): City[] {
  const q = query.toLowerCase().trim();
  if (!q) return CITIES;
  return CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.slug.includes(q) ||
      c.state.toLowerCase().includes(q)
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
  { city: CITIES[5], area: CITIES[5].areas[0] }, // Delhi / Connaught Place
  { city: CITIES[6], area: CITIES[6].areas[0] }, // Mumbai / Bandra
  { city: CITIES[9], area: CITIES[9].areas[0] }, // Bengaluru / Whitefield
  { city: CITIES[14], area: CITIES[14].areas[0] }, // Munich / Altstadt
  { city: CITIES[16], area: CITIES[16].areas[0] }, // San Francisco / Financial District
];
