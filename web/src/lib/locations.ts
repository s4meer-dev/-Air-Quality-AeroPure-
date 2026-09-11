/**
 * AeroPure Location Registry & Geospatial Index
 * ==============================================
 * Comprehensive dataset of Indian State Capitals and Major Metropolitan Cities
 * with verified GPS coordinates and curated locality zones.
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
  country: string;
  lat: number;
  lon: number;
  isCapital: boolean;
  type: "state_capital" | "major_city";
  areas: Area[];
}

export const CITIES: City[] = [
  // ── 1. STATE & UT CAPITALS ──────────────────────────────────────────────
  {
    slug: "delhi",
    name: "Delhi",
    state: "Delhi NCT",
    country: "India",
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
      { slug: "noida", name: "Noida", lat: 28.535, lon: 77.391, defaultRegimeHint: 2 },
    ],
  },
  {
    slug: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    country: "India",
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
      { slug: "thane", name: "Thane", lat: 19.218, lon: 72.978, defaultRegimeHint: 2 },
    ],
  },
  {
    slug: "bengaluru",
    name: "Bengaluru",
    state: "Karnataka",
    country: "India",
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
      { slug: "yelahanka", name: "Yelahanka", lat: 13.101, lon: 77.596, defaultRegimeHint: 1 },
      { slug: "hsr-layout", name: "HSR Layout", lat: 12.912, lon: 77.644, defaultRegimeHint: 0 },
      { slug: "marathahalli", name: "Marathahalli", lat: 12.956, lon: 77.702, defaultRegimeHint: 0 },
    ],
  },
  {
    slug: "hyderabad",
    name: "Hyderabad",
    state: "Telangana",
    country: "India",
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
      { slug: "lb-nagar", name: "L.B. Nagar", lat: 17.349, lon: 78.552, defaultRegimeHint: 2 },
    ],
  },
  {
    slug: "chennai",
    name: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    lat: 13.0827,
    lon: 80.2707,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "t-nagar", name: "T. Nagar", lat: 13.04, lon: 80.234, defaultRegimeHint: 2 },
      { slug: "anna-nagar", name: "Anna Nagar", lat: 13.085, lon: 80.21, defaultRegimeHint: 0 },
      { slug: "velachery", name: "Velachery", lat: 12.978, lon: 80.221, defaultRegimeHint: 0 },
      { slug: "omr", name: "OMR", lat: 12.9, lon: 80.229, defaultRegimeHint: 1 },
      { slug: "adyar", name: "Adyar", lat: 13.006, lon: 80.256, defaultRegimeHint: 1 },
    ],
  },
  {
    slug: "kolkata",
    name: "Kolkata",
    state: "West Bengal",
    country: "India",
    lat: 22.5726,
    lon: 88.3639,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "park-street", name: "Park Street", lat: 22.55, lon: 88.352, defaultRegimeHint: 2 },
      { slug: "salt-lake", name: "Salt Lake", lat: 22.573, lon: 88.428, defaultRegimeHint: 0 },
      { slug: "howrah", name: "Howrah", lat: 22.587, lon: 88.31, defaultRegimeHint: 2 },
      { slug: "new-town", name: "New Town", lat: 22.623, lon: 88.462, defaultRegimeHint: 1 },
    ],
  },
  {
    slug: "jaipur",
    name: "Jaipur",
    state: "Rajasthan",
    country: "India",
    lat: 26.9124,
    lon: 75.7873,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "pink-city", name: "Pink City", lat: 26.924, lon: 75.824, defaultRegimeHint: 2 },
      { slug: "malviya-nagar", name: "Malviya Nagar", lat: 26.853, lon: 75.816, defaultRegimeHint: 0 },
      { slug: "vaishali-nagar", name: "Vaishali Nagar", lat: 26.914, lon: 75.742, defaultRegimeHint: 1 },
    ],
  },
  {
    slug: "lucknow",
    name: "Lucknow",
    state: "Uttar Pradesh",
    country: "India",
    lat: 26.8467,
    lon: 80.9462,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "hazratganj", name: "Hazratganj", lat: 26.853, lon: 80.946, defaultRegimeHint: 2 },
      { slug: "gomti-nagar", name: "Gomti Nagar", lat: 26.851, lon: 81.0, defaultRegimeHint: 0 },
      { slug: "aliganj", name: "Aliganj", lat: 26.892, lon: 80.941, defaultRegimeHint: 1 },
    ],
  },
  {
    slug: "patna",
    name: "Patna",
    state: "Bihar",
    country: "India",
    lat: 25.5941,
    lon: 85.1376,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "boring-road", name: "Boring Road", lat: 25.617, lon: 85.118, defaultRegimeHint: 2 },
      { slug: "kankarbagh", name: "Kankarbagh", lat: 25.599, lon: 85.155, defaultRegimeHint: 2 },
    ],
  },
  {
    slug: "bhopal",
    name: "Bhopal",
    state: "Madhya Pradesh",
    country: "India",
    lat: 23.2599,
    lon: 77.4126,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "mp-nagar", name: "MP Nagar", lat: 23.232, lon: 77.433, defaultRegimeHint: 0 },
      { slug: "arera-colony", name: "Arera Colony", lat: 23.212, lon: 77.439, defaultRegimeHint: 1 },
    ],
  },
  {
    slug: "chandigarh",
    name: "Chandigarh",
    state: "Punjab & Haryana",
    country: "India",
    lat: 30.7333,
    lon: 76.7794,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "sector-17", name: "Sector 17", lat: 30.739, lon: 76.782, defaultRegimeHint: 1 },
      { slug: "sector-35", name: "Sector 35", lat: 30.725, lon: 76.764, defaultRegimeHint: 0 },
    ],
  },
  {
    slug: "bhubaneswar",
    name: "Bhubaneswar",
    state: "Odisha",
    country: "India",
    lat: 20.2961,
    lon: 85.8245,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "saheed-nagar", name: "Saheed Nagar", lat: 20.288, lon: 85.843, defaultRegimeHint: 0 },
      { slug: "patia", name: "Patia", lat: 20.354, lon: 85.819, defaultRegimeHint: 1 },
    ],
  },
  {
    slug: "guwahati",
    name: "Guwahati",
    state: "Assam",
    country: "India",
    lat: 26.1445,
    lon: 91.7362,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "dispur", name: "Dispur", lat: 26.142, lon: 91.791, defaultRegimeHint: 0 },
      { slug: "gs-road", name: "GS Road", lat: 26.155, lon: 91.771, defaultRegimeHint: 1 },
    ],
  },
  {
    slug: "thiruvananthapuram",
    name: "Thiruvananthapuram",
    state: "Kerala",
    country: "India",
    lat: 8.5241,
    lon: 76.9366,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "technopark", name: "Technopark", lat: 8.558, lon: 76.881, defaultRegimeHint: 1 },
      { slug: "kowdiar", name: "Kowdiar", lat: 8.529, lon: 76.958, defaultRegimeHint: 1 },
    ],
  },
  {
    slug: "ranchi",
    name: "Ranchi",
    state: "Jharkhand",
    country: "India",
    lat: 23.3441,
    lon: 85.3096,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "doranda", name: "Doranda", lat: 23.332, lon: 85.324, defaultRegimeHint: 2 },
      { slug: "kanke", name: "Kanke", lat: 23.435, lon: 85.322, defaultRegimeHint: 1 },
    ],
  },
  {
    slug: "dehradun",
    name: "Dehradun",
    state: "Uttarakhand",
    country: "India",
    lat: 30.3165,
    lon: 78.0322,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "rajpur-road", name: "Rajpur Road", lat: 30.342, lon: 78.062, defaultRegimeHint: 1 },
      { slug: "clock-tower", name: "Clock Tower", lat: 30.324, lon: 78.042, defaultRegimeHint: 0 },
    ],
  },
  {
    slug: "shimla",
    name: "Shimla",
    state: "Himachal Pradesh",
    country: "India",
    lat: 31.1048,
    lon: 77.1734,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "mall-road", name: "Mall Road", lat: 31.104, lon: 77.174, defaultRegimeHint: 1 },
      { slug: "sanjauli", name: "Sanjauli", lat: 31.102, lon: 77.195, defaultRegimeHint: 1 },
    ],
  },
  {
    slug: "srinagar",
    name: "Srinagar",
    state: "Jammu & Kashmir",
    country: "India",
    lat: 34.0837,
    lon: 74.7973,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "lal-chowk", name: "Lal Chowk", lat: 34.072, lon: 74.808, defaultRegimeHint: 1 },
      { slug: "rajbagh", name: "Rajbagh", lat: 34.062, lon: 74.823, defaultRegimeHint: 1 },
    ],
  },
  {
    slug: "raipur",
    name: "Raipur",
    state: "Chhattisgarh",
    country: "India",
    lat: 21.2514,
    lon: 81.6296,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "pandri", name: "Pandri", lat: 21.258, lon: 81.652, defaultRegimeHint: 2 },
      { slug: "telibandha", name: "Telibandha", lat: 21.236, lon: 81.668, defaultRegimeHint: 0 },
    ],
  },
  {
    slug: "panaji",
    name: "Panaji",
    state: "Goa",
    country: "India",
    lat: 15.4909,
    lon: 73.8278,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "fontainhas", name: "Fontainhas", lat: 15.496, lon: 73.832, defaultRegimeHint: 1 },
      { slug: "miramar", name: "Miramar", lat: 15.482, lon: 73.811, defaultRegimeHint: 1 },
    ],
  },
  {
    slug: "gandhinagar",
    name: "Gandhinagar",
    state: "Gujarat",
    country: "India",
    lat: 23.2156,
    lon: 72.6369,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "sector-21", name: "Sector 21", lat: 23.22, lon: 72.645, defaultRegimeHint: 1 },
      { slug: "gift-city", name: "GIFT City", lat: 23.16, lon: 72.684, defaultRegimeHint: 0 },
    ],
  },
  {
    slug: "amaravati",
    name: "Amaravati",
    state: "Andhra Pradesh",
    country: "India",
    lat: 16.5131,
    lon: 80.5165,
    isCapital: true,
    type: "state_capital",
    areas: [
      { slug: "secretariat-zone", name: "Secretariat Zone", lat: 16.513, lon: 80.516, defaultRegimeHint: 0 },
      { slug: "vijayawada-central", name: "Vijayawada Central", lat: 16.506, lon: 80.648, defaultRegimeHint: 0 },
    ],
  },

  // ── 2. MAJOR INDUSTRIAL & METROPOLITAN CITIES ───────────────────────────
  {
    slug: "pune",
    name: "Pune",
    state: "Maharashtra",
    country: "India",
    lat: 18.5204,
    lon: 73.8567,
    isCapital: false,
    type: "major_city",
    areas: [
      { slug: "hinjewadi", name: "Hinjewadi", lat: 18.592, lon: 73.737, defaultRegimeHint: 0 },
      { slug: "kothrud", name: "Kothrud", lat: 18.504, lon: 73.806, defaultRegimeHint: 1 },
      { slug: "viman-nagar", name: "Viman Nagar", lat: 18.567, lon: 73.912, defaultRegimeHint: 0 },
      { slug: "pimpri", name: "Pimpri", lat: 18.627, lon: 73.804, defaultRegimeHint: 2 },
    ],
  },
  {
    slug: "ahmedabad",
    name: "Ahmedabad",
    state: "Gujarat",
    country: "India",
    lat: 23.0225,
    lon: 72.5714,
    isCapital: false,
    type: "major_city",
    areas: [
      { slug: "sg-highway", name: "SG Highway", lat: 23.061, lon: 72.519, defaultRegimeHint: 0 },
      { slug: "navrangpura", name: "Navrangpura", lat: 23.031, lon: 72.563, defaultRegimeHint: 1 },
      { slug: "satellite", name: "Satellite", lat: 23.03, lon: 72.528, defaultRegimeHint: 0 },
      { slug: "maninagar", name: "Maninagar", lat: 22.995, lon: 72.601, defaultRegimeHint: 2 },
    ],
  },
  {
    slug: "surat",
    name: "Surat",
    state: "Gujarat",
    country: "India",
    lat: 21.1702,
    lon: 72.8311,
    isCapital: false,
    type: "major_city",
    areas: [
      { slug: "ring-road", name: "Ring Road", lat: 21.187, lon: 72.835, defaultRegimeHint: 2 },
      { slug: "vesu", name: "Vesu", lat: 21.139, lon: 72.775, defaultRegimeHint: 0 },
    ],
  },
  {
    slug: "visakhapatnam",
    name: "Visakhapatnam",
    state: "Andhra Pradesh",
    country: "India",
    lat: 17.6868,
    lon: 83.2185,
    isCapital: false,
    type: "major_city",
    areas: [
      { slug: "mvp-colony", name: "MVP Colony", lat: 17.74, lon: 83.332, defaultRegimeHint: 1 },
      { slug: "gajuwaka", name: "Gajuwaka Industrial Zone", lat: 17.691, lon: 83.212, defaultRegimeHint: 2 },
    ],
  },
  {
    slug: "nagpur",
    name: "Nagpur",
    state: "Maharashtra",
    country: "India",
    lat: 21.1458,
    lon: 79.0882,
    isCapital: false,
    type: "major_city",
    areas: [
      { slug: "dharampeth", name: "Dharampeth", lat: 21.142, lon: 79.062, defaultRegimeHint: 1 },
      { slug: "sitabuldi", name: "Sitabuldi", lat: 21.146, lon: 79.083, defaultRegimeHint: 2 },
    ],
  },
  {
    slug: "indore",
    name: "Indore",
    state: "Madhya Pradesh",
    country: "India",
    lat: 22.7196,
    lon: 75.8577,
    isCapital: false,
    type: "major_city",
    areas: [
      { slug: "vijay-nagar", name: "Vijay Nagar", lat: 22.753, lon: 75.894, defaultRegimeHint: 0 },
      { slug: "palasia", name: "Palasia", lat: 22.724, lon: 75.883, defaultRegimeHint: 1 },
    ],
  },
  {
    slug: "kochi",
    name: "Kochi",
    state: "Kerala",
    country: "India",
    lat: 9.9312,
    lon: 76.2673,
    isCapital: false,
    type: "major_city",
    areas: [
      { slug: "mg-road-kochi", name: "MG Road", lat: 9.972, lon: 76.279, defaultRegimeHint: 1 },
      { slug: "kakkanad-infopark", name: "Kakkanad InfoPark", lat: 10.012, lon: 76.363, defaultRegimeHint: 1 },
    ],
  },
  {
    slug: "coimbatore",
    name: "Coimbatore",
    state: "Tamil Nadu",
    country: "India",
    lat: 11.0168,
    lon: 76.9558,
    isCapital: false,
    type: "major_city",
    areas: [
      { slug: "rs-puram", name: "RS Puram", lat: 11.008, lon: 76.948, defaultRegimeHint: 1 },
      { slug: "peelamedu", name: "Peelamedu", lat: 11.028, lon: 77.001, defaultRegimeHint: 0 },
    ],
  },
  {
    slug: "varanasi",
    name: "Varanasi",
    state: "Uttar Pradesh",
    country: "India",
    lat: 25.3176,
    lon: 82.9739,
    isCapital: false,
    type: "major_city",
    areas: [
      { slug: "godowlia", name: "Godowlia", lat: 25.311, lon: 83.006, defaultRegimeHint: 2 },
      { slug: "lanka-bhu", name: "Lanka (BHU)", lat: 25.274, lon: 82.999, defaultRegimeHint: 1 },
    ],
  },
  {
    slug: "agra",
    name: "Agra",
    state: "Uttar Pradesh",
    country: "India",
    lat: 27.1767,
    lon: 78.0081,
    isCapital: false,
    type: "major_city",
    areas: [
      { slug: "taj-ganj", name: "Taj Ganj Zone", lat: 27.168, lon: 78.042, defaultRegimeHint: 2 },
      { slug: "sanjay-place", name: "Sanjay Place", lat: 27.198, lon: 78.003, defaultRegimeHint: 2 },
    ],
  },
  {
    slug: "gurugram",
    name: "Gurugram",
    state: "Haryana",
    country: "India",
    lat: 28.4595,
    lon: 77.0266,
    isCapital: false,
    type: "major_city",
    areas: [
      { slug: "cyber-city", name: "DLF Cyber City", lat: 28.495, lon: 77.088, defaultRegimeHint: 2 },
      { slug: "golf-course-road", name: "Golf Course Road", lat: 28.448, lon: 77.098, defaultRegimeHint: 0 },
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
  { city: CITIES[3], area: CITIES[3].areas[0] }, // Hyderabad / Gachibowli
  { city: CITIES[0], area: CITIES[0].areas[0] }, // Delhi / Connaught Place
  { city: CITIES[1], area: CITIES[1].areas[0] }, // Mumbai / Bandra
  { city: CITIES[2], area: CITIES[2].areas[0] }, // Bengaluru / Whitefield
  { city: CITIES[4], area: CITIES[4].areas[0] }, // Chennai / T.Nagar
  { city: CITIES[5], area: CITIES[5].areas[1] }, // Kolkata / Salt Lake
];
