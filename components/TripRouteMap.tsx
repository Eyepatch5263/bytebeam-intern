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
import type { FleetVehicle } from "@/app/hooks/useFleetVehicle";

interface TripRouteMapProps {
  trip?: {
    id: string;
    trip_number: string;
    status: string;
    start_location: string;
    end_location: string;
    distance_km: number;
    distance_covered_km?: number;
    average_speed?: number;
    started_at?: string;
    scheduled_eta?: string;
    delay_minutes?: number;
    halt_count?: number;
    idle_duration_seconds?: number;
  } | null;
  vehicle: FleetVehicle & {
    locality?: string;
    current_speed?: number;
  };
  showSideDetails?: boolean;
}

export default function TripRouteMap({
  trip,
  vehicle,
  showSideDetails = true,
}: TripRouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Origin, midpoint, current position, and destination coordinates along the Bengaluru route
  const startCoord = DEMO_BENGALURU_ROUTE[0]; // Koramangala
  const haltCoord = DEMO_BENGALURU_ROUTE[2]; // Domlur / Indiranagar
  const currentCoord = DEMO_BENGALURU_ROUTE[4] || [vehicle.longitude || 77.6685, vehicle.latitude || 12.9811]; // Indiranagar east
  const destCoord = DEMO_BENGALURU_ROUTE[DEMO_BENGALURU_ROUTE.length - 1]; // Whitefield

  const startLoc = trip?.start_location || "Koramangala";
  const destLoc = trip?.end_location || "Whitefield";
  const startTime = trip?.started_at
    ? new Date(trip.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "11:16 AM";
  const currentSpeed = vehicle.current_speed || trip?.average_speed || 48;
  const currentLocName = vehicle.locality || "Indiranagar";

  // Fit bounds to full route
  const handleShowFullRoute = () => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = new mapboxgl.LngLatBounds();
    DEMO_BENGALURU_ROUTE.forEach((pt) => bounds.extend(pt));
    map.fitBounds(bounds, { padding: 45, duration: 900 });
  };

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

        // Add Active Route GeoJSON
        if (!map.getSource("trip-active-route")) {
          map.addSource("trip-active-route", {
            type: "geojson",
            data: routeToGeoJSON(DEMO_BENGALURU_ROUTE),
          });

          // Soft green glow layer
          map.addLayer({
            id: "trip-route-glow",
            type: "line",
            source: "trip-active-route",
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

          // Primary crisp emerald green line
          map.addLayer({
            id: "trip-route-line",
            type: "line",
            source: "trip-active-route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#115e4a",
              "line-width": 4.5,
              "line-opacity": 0.95,
            },
          });
        }

        // Fit bounds cleanly on initial load
        const bounds = new mapboxgl.LngLatBounds();
        DEMO_BENGALURU_ROUTE.forEach((pt) => bounds.extend(pt));
        map.fitBounds(bounds, { padding: 40, duration: 600 });
      });

      // Handle map resize cleanly in drawers
      const resizeTimer = setTimeout(() => {
        map.resize();
      }, 250);

      map.on("error", (e) => {
        console.error("Trip route map error:", e);
      });

      return () => {
        clearTimeout(resizeTimer);
        map.remove();
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error initializing map";
      setMapError(msg);
    }
  }, []);

  // Update Waypoint and Location Markers with callout tooltips
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // 1. Trip Start Callout Bubble Marker
    const startEl = document.createElement("div");
    startEl.className = "flex flex-col items-center pointer-events-none transform -translate-y-2";
    startEl.innerHTML = `
      <div class="bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-gray-200/90 shadow-md text-center text-xs font-sans">
        <span class="block text-[9.5px] text-gray-400 font-semibold leading-tight uppercase tracking-wider">Trip start</span>
        <span class="block text-[11px] font-bold text-gray-900 leading-tight mt-0.5">${startLoc} · ${startTime}</span>
      </div>
      <div class="w-2 h-2 bg-white border-r border-b border-gray-200/90 transform rotate-45 -mt-1 shadow-2xs"></div>
      <div class="w-4 h-4 rounded-full bg-white border-[3px] border-[#11382b] mt-0.5 shadow-sm flex items-center justify-center">
        <div class="w-1.5 h-1.5 rounded-full bg-[#11382b]"></div>
      </div>
    `;

    const startMarker = new mapboxgl.Marker({ element: startEl, anchor: "bottom" })
      .setLngLat(startCoord)
      .addTo(map);
    markersRef.current.push(startMarker);

    // 2. Halt Point Marker (Domlur Junction)
    const haltEl = document.createElement("div");
    haltEl.className = "flex flex-col items-center pointer-events-none";
    haltEl.innerHTML = `
      <div class="w-4 h-4 rounded-full bg-white border-[3px] border-amber-500 shadow-md flex items-center justify-center">
        <div class="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
      </div>
    `;

    const haltMarker = new mapboxgl.Marker({ element: haltEl })
      .setLngLat(haltCoord)
      .addTo(map);
    markersRef.current.push(haltMarker);

    // 3. Current Location Callout Bubble Marker
    const currEl = document.createElement("div");
    currEl.className = "flex flex-col items-center pointer-events-none transform -translate-y-2";
    currEl.innerHTML = `
      <div class="bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-gray-200/90 shadow-md text-center text-xs font-sans">
        <span class="block text-[9.5px] text-emerald-700 font-bold leading-tight uppercase tracking-wider">Current location</span>
        <span class="block text-[11px] font-bold text-gray-900 leading-tight mt-0.5">${currentLocName} · ${currentSpeed} km/h</span>
      </div>
      <div class="w-2 h-2 bg-white border-r border-b border-gray-200/90 transform rotate-45 -mt-1 shadow-2xs"></div>
      <div class="relative flex items-center justify-center w-6 h-6 mt-0.5">
        <div class="absolute w-6 h-6 rounded-full bg-emerald-400 opacity-60 animate-ping"></div>
        <div class="w-4 h-4 rounded-full bg-[#11382b] border-2 border-white shadow-md z-10"></div>
      </div>
    `;

    const currMarker = new mapboxgl.Marker({ element: currEl, anchor: "bottom" })
      .setLngLat(currentCoord as [number, number])
      .addTo(map);
    markersRef.current.push(currMarker);
  }, [isLoaded, startLoc, startTime, currentLocName, currentSpeed, startCoord, haltCoord, currentCoord]);

  return (
    <div className="space-y-4 font-sans">
      {/* ========================================= */}
      {/* 1. CURRENT TRIP MAP CARD                  */}
      {/* ========================================= */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-2xs space-y-3">
        {/* Map Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 leading-tight">Current trip</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Live route · last position updated 28 seconds ago
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShowFullRoute}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200/90 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span>Show full route</span>
            </button>

            <button
              title="Map layer controls"
              className="p-1 rounded-lg border border-gray-200/80 bg-white text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mapbox Canvas */}
        <div className="relative w-full h-70 sm:h-80 rounded-xl overflow-hidden bg-[#e5ece8] border border-gray-200/80">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Top Left Watermark */}
          <div className="absolute top-3 left-4 z-10 pointer-events-none text-[11px] font-bold tracking-widest uppercase text-gray-500/80 font-mono">
            BENGALURU
          </div>

          {/* Top Right Zoom Controls */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 bg-white/90 backdrop-blur-xs rounded-lg border border-gray-200/80 shadow-xs overflow-hidden">
            <button
              onClick={() => mapRef.current?.zoomIn()}
              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-sm font-semibold transition-colors cursor-pointer"
              aria-label="Zoom in"
            >
              +
            </button>
            <div className="w-full h-px bg-gray-200" />
            <button
              onClick={() => mapRef.current?.zoomOut()}
              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-sm font-semibold transition-colors cursor-pointer"
              aria-label="Zoom out"
            >
              −
            </button>
          </div>

          {/* Bottom Left Legend */}
          <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-gray-200/80 shadow-xs flex items-center gap-2.5 text-[10.5px] font-medium text-gray-700">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Moving</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              <span>Parked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              <span>Needs attention</span>
            </div>
          </div>

          {/* Bottom Right Illustrative Map Label */}
          <div className="absolute bottom-3 right-3 z-10 text-[9px] font-mono text-gray-500/80 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded border border-gray-200/60 pointer-events-none">
            Illustrative map · Bengaluru
          </div>

          {mapError && (
            <div className="absolute inset-0 z-20 bg-gray-50/95 flex flex-col items-center justify-center p-4 text-center">
              <p className="text-xs text-gray-500">{mapError}</p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================= */}
      {/* 2. TRIP DETAILS CARD                      */}
      {/* ========================================= */}
      {showSideDetails && (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-2xs space-y-4">
          {/* Top Status Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <span className="text-xs font-semibold text-gray-500">
                Today · {startTime} — In progress
              </span>
            </div>
            <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold">
              Active
            </span>
          </div>

          {/* Route Headline */}
          <div>
            <h4 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span>{startLoc}</span>
              <span className="text-gray-400 font-light">──</span>
              <span>{destLoc}</span>
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Delivery route · Bengaluru, Karnataka
            </p>
          </div>

          {/* 4 Metric Boxes (2x2) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-gray-100 bg-[#f9faf9]">
              <span className="text-[10px] text-gray-400 uppercase font-medium block">Distance travelled</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold font-mono text-gray-900">
                  {trip?.distance_covered_km || 28.4}
                </span>
                <span className="text-xs text-gray-500">km</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-gray-100 bg-[#f9faf9]">
              <span className="text-[10px] text-gray-400 uppercase font-medium block">Trip duration</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold font-mono text-gray-900">52</span>
                <span className="text-xs text-gray-500">min</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-gray-100 bg-[#f9faf9]">
              <span className="text-[10px] text-gray-400 uppercase font-medium block">Avg speed</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold font-mono text-gray-900">
                  {trip?.average_speed || 39}
                </span>
                <span className="text-xs text-gray-500">km/h</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-gray-100 bg-[#f9faf9]">
              <span className="text-[10px] text-gray-400 uppercase font-medium block">Halt time</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold font-mono text-gray-900">
                  {Math.round((trip?.idle_duration_seconds || 360) / 60)}
                </span>
                <span className="text-xs text-gray-500">min</span>
              </div>
            </div>
          </div>

          {/* Route Timeline with Vertical Connector */}
          <div className="pt-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">
              Route timeline
            </span>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
              {/* Event 1: Trip started */}
              <div className="relative">
                <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-emerald-600 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Trip started</h5>
                    <p className="text-[11px] text-gray-500 mt-0.5">Koramangala depot</p>
                  </div>
                  <span className="text-[11px] font-mono text-gray-400">{startTime}</span>
                </div>
              </div>

              {/* Event 2: Short halt */}
              <div className="relative">
                <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-amber-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Short halt · 6 min</h5>
                    <p className="text-[11px] text-gray-500 mt-0.5">Domlur junction</p>
                  </div>
                  <span className="text-[11px] font-mono text-gray-400">11:42 AM</span>
                </div>
              </div>

              {/* Event 3: Last position */}
              <div className="relative">
                <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-emerald-600 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Last position</h5>
                    <p className="text-[11px] text-gray-500 mt-0.5">Indiranagar · heading east</p>
                  </div>
                  <span className="text-[11px] font-mono text-gray-400">12:08 PM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Speed Event Warning Banner */}
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-center gap-2.5">
            <span className="text-base">⚠️</span>
            <span className="font-medium">
              1 speed event · 72 km/h for 38 sec at 12:02 PM
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
