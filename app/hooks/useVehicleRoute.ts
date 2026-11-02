"use client";

import { useMemo } from "react";
import { DEMO_BENGALURU_ROUTE, routeToGeoJSON } from "@/utils/mapbox";

export function useVehicleRoute(selectedVehicleId?: string | null) {
  // Return the GeoJSON feature for the active Bengaluru corridor route
  const routeGeoJSON = useMemo(() => {
    return routeToGeoJSON(DEMO_BENGALURU_ROUTE);
  }, [selectedVehicleId]);

  const origin = DEMO_BENGALURU_ROUTE[0];
  const midPoint = DEMO_BENGALURU_ROUTE[Math.floor(DEMO_BENGALURU_ROUTE.length / 2)];
  const destination = DEMO_BENGALURU_ROUTE[DEMO_BENGALURU_ROUTE.length - 1];

  return {
    routeCoords: DEMO_BENGALURU_ROUTE,
    routeGeoJSON,
    origin,
    midPoint,
    destination,
  };
}
