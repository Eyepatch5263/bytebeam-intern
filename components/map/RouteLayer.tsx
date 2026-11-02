import type mapboxgl from "mapbox-gl";

export function addCorridorRouteLayer(
  map: mapboxgl.Map,
  routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString>
) {
  if (map.getSource("active-corridor-route")) {
    const src = map.getSource("active-corridor-route") as mapboxgl.GeoJSONSource;
    src.setData(routeGeoJSON);
    return;
  }

  map.addSource("active-corridor-route", {
    type: "geojson",
    data: routeGeoJSON,
  });

  // Outer glow
  map.addLayer({
    id: "corridor-route-glow",
    type: "line",
    source: "active-corridor-route",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#34d399",
      "line-width": 8,
      "line-opacity": 0.25,
    },
  });

  // Main crisp route line
  map.addLayer({
    id: "corridor-route-line",
    type: "line",
    source: "active-corridor-route",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#115e4a",
      "line-width": 4,
      "line-opacity": 0.95,
    },
  });
}
