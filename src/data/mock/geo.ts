// City centres for placing members on the map. Phase 7 replaces this with geocoding
// (city + state + ZIP -> approximate lat/lng, stored server-side). Exact addresses are never used.
export const CITY_COORDS: Record<string, [number, number]> = {
  chicago: [41.8781, -87.6298],
  evanston: [42.0451, -87.6877],
  'oak park': [41.885, -87.7845],
  naperville: [41.7508, -88.1535],
  milwaukee: [43.0389, -87.9065],
  miami: [25.7617, -80.1918],
  'new york': [40.7128, -74.006],
  nashville: [36.1627, -86.7816],
  austin: [30.2672, -97.7431],
  'san antonio': [29.4241, -98.4936],
  london: [51.5074, -0.1278],
  toronto: [43.6532, -79.3832],
};

export const cityCoords = (city?: string): [number, number] | null =>
  (city && CITY_COORDS[city.trim().toLowerCase()]) || null;
