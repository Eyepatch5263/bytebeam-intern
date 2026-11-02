export const MAPBOX_ACCESS_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
  process.env.MAPBOX_ACCESS_TOKEN ||
  "";

// Default coordinate center: Bengaluru, Karnataka, India [longitude, latitude]
export const BENGALURU_CENTER: [number, number] = [77.6408, 12.9816];
export const DEFAULT_ZOOM = 11.2;

// Standard Mapbox Light Style
export const MAPBOX_STYLE = "mapbox://styles/mapbox/light-v11";

// Prominent Bengaluru corridor path connecting Domlur -> Indiranagar -> Mahadevapura -> Whitefield
export const DEMO_BENGALURU_ROUTE: [number, number][] = [
  [77.6255, 12.9602], // Domlur / Koramangala junction
  [77.6342, 12.9654],
  [77.6418, 12.9735], // Indiranagar
  [77.6531, 12.9782],
  [77.6685, 12.9811],
  [77.6834, 12.9856], // Mahadevapura
  [77.7012, 12.9912],
  [77.7188, 12.9995],
  [77.7324, 13.0041],
  [77.7485, 13.0078], // Whitefield Tech Corridor
];

// Helper to convert coordinate array to GeoJSON Feature
export function routeToGeoJSON(coords: [number, number][]): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: coords,
    },
  };
}
