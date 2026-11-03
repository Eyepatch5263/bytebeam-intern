"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  MAPBOX_ACCESS_TOKEN,
  MAPBOX_STYLE,
  DEMO_BENGALURU_ROUTE,
  routeToGeoJSON,
} from "@/utils/mapbox";

interface SelectedTripMapProps {
  startLocation: string;
  endLocation: string;
  startTime: string;
  lastSeenTime: string;
  currentLocationName?: string;
}

export default function SelectedTripMap({
  startLocation,
  endLocation,
  startTime,
  lastSeenTime,
  currentLocationName = "Indiranagar",
}: SelectedTripMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const startCoord = DEMO_BENGALURU_ROUTE[0]; // Koramangala
  const haltCoord = DEMO_BENGALURU_ROUTE[2]; // Domlur junction
  const lastSeenCoord = DEMO_BENGALURU_ROUTE[4]; // Indiranagar

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
        center: [77.67, 12.98],
        zoom: 11.8,
        attributionControl: false,
      });

      mapRef.current = map;

      map.on("load", () => {
        setIsLoaded(true);

        if (!map.getSource("selected-trip-route")) {
          map.addSource("selected-trip-route", {
            type: "geojson",
            data: routeToGeoJSON(DEMO_BENGALURU_ROUTE),
          });

          // Route glow layer
          map.addLayer({
            id: "selected-trip-glow",
            type: "line",
            source: "selected-trip-route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#34d399",
              "line-width": 7,
              "line-opacity": 0.3,
            },
          });

          // Primary green route line
          map.addLayer({
            id: "selected-trip-line",
            type: "line",
            source: "selected-trip-route",
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

        // Fit bounds to route
        const bounds = new mapboxgl.LngLatBounds();
        DEMO_BENGALURU_ROUTE.forEach((pt) => bounds.extend(pt));
        map.fitBounds(bounds, { padding: 40, duration: 600 });
      });

      map.on("error", (e) => {
        console.error("SelectedTripMap error:", e);
      });

      return () => {
        map.remove();
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error initializing map";
      setMapError(msg);
    }
  }, []);

  // Update Callout Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // 1. Start Callout Box Marker
    const startEl = document.createElement("div");
    startEl.className = "flex flex-col items-center pointer-events-none transform -translate-y-2";
    startEl.innerHTML = `
      <div class="bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-gray-200/90 shadow-md text-center text-xs font-sans">
        <span class="block text-[9.5px] text-gray-500 font-bold leading-tight">Start · ${startTime}</span>
        <span class="block text-[11px] font-semibold text-gray-800 leading-tight mt-0.5">${startLocation} depot</span>
      </div>
      <div class="w-2 h-2 bg-white border-r border-b border-gray-200/90 transform rotate-45 -mt-1 shadow-2xs"></div>
      <div class="w-3.5 h-3.5 rounded-full bg-white border-[3px] border-[#11382b] mt-0.5 shadow-sm flex items-center justify-center">
        <div class="w-1.5 h-1.5 rounded-full bg-[#11382b]"></div>
      </div>
    `;

    const startMarker = new mapboxgl.Marker({ element: startEl, anchor: "bottom" })
      .setLngLat(startCoord)
      .addTo(map);
    markersRef.current.push(startMarker);

    // 2. Halt / Checkpoint Marker (Domlur)
    const haltEl = document.createElement("div");
    haltEl.className = "flex flex-col items-center pointer-events-none";
    haltEl.innerHTML = `
      <div class="w-3.5 h-3.5 rounded-full bg-white border-[2.5px] border-amber-500 shadow-md flex items-center justify-center">
        <div class="w-1 h-1 rounded-full bg-amber-500"></div>
      </div>
    `;

    const haltMarker = new mapboxgl.Marker({ element: haltEl })
      .setLngLat(haltCoord)
      .addTo(map);
    markersRef.current.push(haltMarker);

    // 3. Last seen / Current Location Callout Box Marker
    const lastSeenEl = document.createElement("div");
    lastSeenEl.className = "flex flex-col items-center pointer-events-none transform -translate-y-2";
    lastSeenEl.innerHTML = `
      <div class="bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-gray-200/90 shadow-md text-center text-xs font-sans">
        <span class="block text-[9.5px] text-gray-900 font-bold leading-tight">Last seen · ${lastSeenTime}</span>
        <span class="block text-[11px] font-medium text-gray-700 leading-tight mt-0.5">${currentLocationName}</span>
      </div>
      <div class="w-2 h-2 bg-white border-r border-b border-gray-200/90 transform rotate-45 -mt-1 shadow-2xs"></div>
      <div class="relative flex items-center justify-center w-5 h-5 mt-0.5">
        <div class="absolute w-5 h-5 rounded-full bg-emerald-400 opacity-60 animate-ping"></div>
        <div class="w-3.5 h-3.5 rounded-full bg-[#11382b] border-2 border-white shadow-md z-10"></div>
      </div>
    `;

    const lastSeenMarker = new mapboxgl.Marker({ element: lastSeenEl, anchor: "bottom" })
      .setLngLat(lastSeenCoord)
      .addTo(map);
    markersRef.current.push(lastSeenMarker);
  }, [isLoaded, startLocation, endLocation, startTime, lastSeenTime, currentLocationName, startCoord, haltCoord, lastSeenCoord]);

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
        Illustrative map · Bengaluru
      </div>

      {mapError && (
        <div className="absolute inset-0 z-20 bg-gray-50/95 flex flex-col items-center justify-center p-4 text-center">
          <p className="text-xs text-gray-500">{mapError}</p>
        </div>
      )}
    </div>
  );
}
