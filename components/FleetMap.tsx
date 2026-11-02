"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_ACCESS_TOKEN, BENGALURU_CENTER, DEFAULT_ZOOM, MAPBOX_STYLE } from "@/utils/mapbox";
import { useVehicleRoute } from "@/app/hooks/useVehicleRoute";
import type { FleetVehicle } from "@/app/hooks/useFleetVehicle";

interface FleetMapProps {
  vehicles?: FleetVehicle[];
  selectedVehicleId?: string | null;
  onSelectVehicle?: (vehicle: FleetVehicle) => void;
}

export default function FleetMap({
  vehicles = [],
  selectedVehicleId,
  onSelectVehicle,
}: FleetMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const { routeGeoJSON, origin, midPoint, destination } = useVehicleRoute(selectedVehicleId);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!MAPBOX_ACCESS_TOKEN) {
      setMapError("Mapbox access token is missing in environment variables.");
      return;
    }

    try {
      mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: MAPBOX_STYLE,
        center: BENGALURU_CENTER,
        zoom: DEFAULT_ZOOM,
        attributionControl: false,
      });

      mapRef.current = map;

      map.on("load", () => {
        setIsLoaded(true);

        // Add Active Bengaluru Corridor Route Source & Layer
        if (!map.getSource("active-corridor-route")) {
          map.addSource("active-corridor-route", {
            type: "geojson",
            data: routeGeoJSON,
          });

          // Outer subtle glow
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
      });

      map.on("error", (e) => {
        console.error("Mapbox error event:", e);
      });

      return () => {
        map.remove();
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error initializing Mapbox";
      setMapError(msg);
    }
  }, [routeGeoJSON]);

  // Update Waypoint Markers and Vehicle Markers when Map is loaded or data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Helper to create HTML marker element
    const createMarkerEl = (
      type: "origin" | "midpoint" | "destination" | "moving" | "parked" | "offline",
      label?: string
    ) => {
      const el = document.createElement("div");
      el.className = "flex items-center justify-center cursor-pointer transition-transform hover:scale-110";

      if (type === "origin") {
        el.innerHTML = `
          <div class="w-5 h-5 rounded-full bg-white border-[3px] border-[#107557] shadow-md flex items-center justify-center">
            <div class="w-1.5 h-1.5 rounded-full bg-[#107557]"></div>
          </div>
        `;
      } else if (type === "midpoint") {
        el.innerHTML = `
          <div class="w-4 h-4 rounded-full bg-white border-[2.5px] border-amber-500 shadow-md flex items-center justify-center">
            <div class="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
          </div>
        `;
      } else if (type === "destination") {
        el.innerHTML = `
          <div class="relative flex items-center justify-center w-7 h-7">
            <div class="absolute w-7 h-7 rounded-full bg-emerald-400 opacity-40 animate-ping"></div>
            <div class="w-5 h-5 rounded-full bg-white border-[3px] border-emerald-600 shadow-md flex items-center justify-center z-10">
              <div class="w-2 h-2 rounded-full bg-emerald-600"></div>
            </div>
          </div>
        `;
      } else {
        // Vehicle markers
        const color = type === "moving" ? "#10b981" : type === "parked" ? "#f59e0b" : "#ef4444";
        el.innerHTML = `
          <div class="flex items-center gap-1 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-md border border-gray-200/80 text-[10px] font-semibold text-gray-800">
            <span class="w-2 h-2 rounded-full" style="background-color: ${color};"></span>
            <span>${label || "Vehicle"}</span>
          </div>
        `;
      }
      return el;
    };

    // 1. Add Corridor Waypoint Markers
    if (origin) {
      const originMarker = new mapboxgl.Marker({ element: createMarkerEl("origin") })
        .setLngLat(origin)
        .setPopup(new mapboxgl.Popup({ offset: 12 }).setHTML("<div class='text-xs font-semibold'>Origin · Koramangala Hub</div>"))
        .addTo(map);
      markersRef.current.push(originMarker);
    }

    if (midPoint) {
      const midMarker = new mapboxgl.Marker({ element: createMarkerEl("midpoint") })
        .setLngLat(midPoint)
        .setPopup(new mapboxgl.Popup({ offset: 12 }).setHTML("<div class='text-xs font-semibold'>Checkpoint · Mahadevapura</div>"))
        .addTo(map);
      markersRef.current.push(midMarker);
    }

    if (destination) {
      const destMarker = new mapboxgl.Marker({ element: createMarkerEl("destination") })
        .setLngLat(destination)
        .setPopup(new mapboxgl.Popup({ offset: 14 }).setHTML("<div class='text-xs font-semibold'>Active Transit · Whitefield Logistics Gate</div>"))
        .addTo(map);
      markersRef.current.push(destMarker);
    }

    // 2. Add Live Vehicles from Props
    vehicles.forEach((vehicle, idx) => {
      // If coordinates are null or outside Bengaluru box, provide realistic local scatter
      let lng = vehicle.longitude;
      let lat = vehicle.latitude;

      if (!lng || !lat || lng < 75 || lng > 80 || lat < 11 || lat > 15) {
        // Scatter around Bengaluru coordinates
        const scatterOffsets = [
          [77.604, 12.971],
          [77.625, 12.935],
          [77.689, 12.988],
          [77.721, 13.012],
          [77.585, 13.032],
          [77.551, 12.954],
          [77.654, 12.915],
          [77.668, 13.002],
        ];
        const offset = scatterOffsets[idx % scatterOffsets.length];
        lng = offset[0] + (Math.sin(idx) * 0.015);
        lat = offset[1] + (Math.cos(idx) * 0.015);
      }

      const markerType = vehicle.status === "moving" ? "moving" : vehicle.status === "idle" ? "parked" : "offline";
      const vehicleMarkerEl = createMarkerEl(markerType, vehicle.registration_number.slice(0, 10));

      const popupHtml = `
        <div class="p-1 font-sans">
          <div class="flex items-center justify-between gap-3 border-b pb-1 mb-1">
            <span class="font-bold text-xs text-gray-900">${vehicle.registration_number}</span>
            <span class="text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded ${
              vehicle.status === "moving"
                ? "bg-emerald-50 text-emerald-700"
                : vehicle.status === "idle"
                ? "bg-amber-50 text-amber-700"
                : "bg-red-50 text-red-700"
            }">${vehicle.status}</span>
          </div>
          <div class="text-[11px] text-gray-600">${vehicle.manufacturer} ${vehicle.model}</div>
          <div class="text-[10px] text-gray-500 mt-0.5">Driver: ${vehicle.driver?.full_name || "Unassigned"}</div>
          <div class="flex items-center justify-between mt-2 pt-1 border-t text-[10px] font-mono text-gray-600">
            <span>Speed: ${vehicle.current_speed || 0} km/h</span>
            <span>Fuel: ${vehicle.fuel_level ? vehicle.fuel_level + "%" : vehicle.battery_level ? vehicle.battery_level + "% (EV)" : "N/A"}</span>
          </div>
        </div>
      `;

      const vehicleMarker = new mapboxgl.Marker({ element: vehicleMarkerEl })
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup({ offset: 12 }).setHTML(popupHtml))
        .addTo(map);

      vehicleMarkerEl.addEventListener("click", () => {
        if (onSelectVehicle) onSelectVehicle(vehicle);
      });

      markersRef.current.push(vehicleMarker);
    });
  }, [isLoaded, vehicles, origin, midPoint, destination, onSelectVehicle]);

  // Zoom handlers
  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  return (
    <div className="relative w-full h-[380px] sm:h-[420px] rounded-xl overflow-hidden bg-[#e5ece8] border border-gray-200/80">
      {/* Mapbox Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Left Watermark from Reference */}
      <div className="absolute top-3 left-4 z-10 pointer-events-none text-[11px] font-bold tracking-widest uppercase text-gray-500/80 font-mono">
        BENGALURU
      </div>

      {/* Top Right Zoom Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 bg-white/90 backdrop-blur-xs rounded-lg border border-gray-200/80 shadow-xs overflow-hidden">
        <button
          onClick={handleZoomIn}
          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 text-sm font-semibold transition-colors cursor-pointer"
          aria-label="Zoom in"
        >
          +
        </button>
        <div className="w-full h-px bg-gray-200" />
        <button
          onClick={handleZoomOut}
          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 text-sm font-semibold transition-colors cursor-pointer"
          aria-label="Zoom out"
        >
          −
        </button>
      </div>

      {/* Bottom Left Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-gray-200/80 shadow-xs flex items-center gap-3 text-[11px] font-medium text-gray-700">
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
      <div className="absolute bottom-3 right-3 z-10 text-[9.5px] font-mono text-gray-500/80 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded border border-gray-200/60 pointer-events-none">
        Illustrative map · Bengaluru
      </div>

      {/* Graceful Fallback if Token is Missing or Mapbox Error */}
      {mapError && (
        <div className="absolute inset-0 z-20 bg-gray-50/95 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-2 font-bold">
            !
          </div>
          <h4 className="text-sm font-semibold text-gray-800">Mapbox Access Setup</h4>
          <p className="text-xs text-gray-500 max-w-sm mt-1">{mapError}</p>
        </div>
      )}
    </div>
  );
}
