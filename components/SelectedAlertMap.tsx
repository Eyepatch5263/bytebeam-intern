"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  MAPBOX_ACCESS_TOKEN,
  MAPBOX_STYLE,
  routeToGeoJSON,
} from "@/utils/mapbox";

interface SelectedAlertMapProps {
  eventLocationLabel: string;
  locationName: string;
  coordinates: {
    start: [number, number];
    event: [number, number];
    route?: [number, number][];
  };
}

export default function SelectedAlertMap({
  eventLocationLabel,
  locationName,
  coordinates,
}: SelectedAlertMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const startCoord = coordinates.start || [77.6255, 12.9602];
  const eventCoord = coordinates.event || [77.6418, 12.9735];
  const routeCoords =
    coordinates.route && coordinates.route.length > 1
      ? coordinates.route
      : [startCoord, eventCoord];

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!MAPBOX_ACCESS_TOKEN) {
      setMapError("Mapbox access token is missing.");
      return;
    }

    try {
      mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: MAPBOX_STYLE,
        center: eventCoord,
        zoom: 12.2,
        attributionControl: false,
      });

      mapRef.current = map;

      map.on("load", () => {
        setIsLoaded(true);

        // Add Route source
        if (!map.getSource("alert-route")) {
          map.addSource("alert-route", {
            type: "geojson",
            data: routeToGeoJSON(routeCoords),
          });

          // Route glow layer
          map.addLayer({
            id: "alert-route-glow",
            type: "line",
            source: "alert-route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#34d399",
              "line-width": 6,
              "line-opacity": 0.35,
            },
          });

          // Primary dark green route line matching reference
          map.addLayer({
            id: "alert-route-line",
            type: "line",
            source: "alert-route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#115e4a",
              "line-width": 3.5,
              "line-opacity": 0.95,
            },
          });
        }

        // Fit bounds to route with comfortable padding
        const bounds = new mapboxgl.LngLatBounds();
        routeCoords.forEach((pt) => bounds.extend(pt));
        map.fitBounds(bounds, { padding: 45, maxZoom: 13.5, duration: 600 });
      });

      map.on("error", (e) => {
        console.error("SelectedAlertMap error:", e);
      });

      return () => {
        map.remove();
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error initializing map";
      setMapError(msg);
    }
  }, []);

  // Update Route GeoJSON and Bounds when coordinates change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    const source = map.getSource("alert-route") as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(routeToGeoJSON(routeCoords));

      const bounds = new mapboxgl.LngLatBounds();
      routeCoords.forEach((pt) => bounds.extend(pt));
      map.fitBounds(bounds, { padding: 45, maxZoom: 13.5, duration: 600 });
    }
  }, [isLoaded, routeCoords]);

  // Update Markers when event or start coordinates change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // 1. Origin / Start Marker (Green circle ring with white center)
    const startEl = document.createElement("div");
    startEl.className = "flex flex-col items-center pointer-events-none";
    startEl.innerHTML = `
      <div class="w-3.5 h-3.5 rounded-full bg-white border-[3px] border-[#11382b] shadow-sm flex items-center justify-center">
        <div class="w-1.5 h-1.5 rounded-full bg-[#11382b]"></div>
      </div>
    `;

    const startMarker = new mapboxgl.Marker({ element: startEl, anchor: "center" })
      .setLngLat(startCoord)
      .addTo(map);
    markersRef.current.push(startMarker);

    // 2. Event Location Callout Box & Pulse Marker matching reference screenshot
    const eventEl = document.createElement("div");
    eventEl.className = "flex flex-col items-center pointer-events-none transform -translate-y-2";
    eventEl.innerHTML = `
      <div class="bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-gray-200/90 shadow-md text-center text-xs font-sans">
        <span class="block text-[9.5px] text-gray-900 font-bold leading-tight">Event location</span>
        <span class="block text-[11px] font-medium text-gray-700 leading-tight mt-0.5">${eventLocationLabel}</span>
      </div>
      <div class="w-2 h-2 bg-white border-r border-b border-gray-200/90 transform rotate-45 -mt-1 shadow-2xs"></div>
      <div class="relative flex items-center justify-center w-5 h-5 mt-0.5">
        <div class="absolute w-5 h-5 rounded-full bg-amber-400 opacity-70 animate-ping"></div>
        <div class="w-3.5 h-3.5 rounded-full bg-amber-600 border-2 border-white shadow-md z-10"></div>
      </div>
    `;

    const eventMarker = new mapboxgl.Marker({ element: eventEl, anchor: "bottom" })
      .setLngLat(eventCoord)
      .addTo(map);
    markersRef.current.push(eventMarker);
  }, [isLoaded, startCoord, eventCoord, eventLocationLabel]);

  return (
    <div className="relative w-full h-64 sm:h-72 rounded-xl overflow-hidden bg-[#e5ece8] border border-gray-200/80 font-sans">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Left Watermark */}
      <div className="absolute top-2.5 left-3.5 z-10 pointer-events-none text-[10px] font-bold tracking-widest uppercase text-gray-500/80 font-mono">
        BENGALURU
      </div>

      {/* Top Right Zoom Controls */}
      <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1 bg-white/90 backdrop-blur-xs rounded-lg border border-gray-200/80 shadow-xs overflow-hidden">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-xs font-semibold transition-colors cursor-pointer"
          aria-label="Zoom in"
        >
          +
        </button>
        <div className="w-full h-px bg-gray-200" />
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-xs font-semibold transition-colors cursor-pointer"
          aria-label="Zoom out"
        >
          −
        </button>
      </div>

      {/* Bottom Right Illustrative Map Label */}
      <div className="absolute bottom-2.5 right-2.5 z-10 text-[9px] font-mono text-gray-500/80 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded border border-gray-200/60 pointer-events-none">
        Illustrative map · {locationName || "Bengaluru"}
      </div>

      {mapError && (
        <div className="absolute inset-0 z-20 bg-gray-50/95 flex flex-col items-center justify-center p-4 text-center">
          <p className="text-xs text-gray-500">{mapError}</p>
        </div>
      )}
    </div>
  );
}
