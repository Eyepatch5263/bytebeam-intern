
"use client";

import { useEffect, useState, useCallback } from "react";

export interface FleetVehicle {
  id: string;
  registration_number: string;
  manufacturer: string;
  model: string;
  vehicle_type: string;
  status: "moving" | "idle" | "offline";
  latitude: number | null;
  longitude: number | null;
  current_speed: number;
  fuel_level: number | null;
  battery_level: number | null;
  ignition_on: boolean;
  last_seen_at: string;
  driver?: {
    full_name: string;
    phone: string;
    license_number: string;
  } | null;
}

export interface FleetAlert {
  id: string;
  vehicle_id: string;
  alert_type: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  status: "active" | "acknowledged" | "resolved";
  triggered_at: string;
  vehicle?: {
    registration_number: string;
    model: string;
  } | null;
}

export interface FleetTrip {
  id: string;
  trip_number: string;
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
  start_location: string;
  end_location: string;
  distance_km: number;
  average_speed: number;
  started_at: string;
  ended_at: string | null;
  vehicle?: {
    registration_number: string;
    model: string;
    vehicle_type: string;
  } | null;
  driver?: {
    full_name: string;
  } | null;
}

export interface FleetMetrics {
  vehiclesInMotion: number;
  totalVehicles: number;
  parkedVehicles: number;
  offlineVehicles: number;
  openAlerts: number;
  urgentAlerts: number;
  distanceToday: number;
}

interface FleetOverviewData {
  metrics: FleetMetrics;
  vehicles: FleetVehicle[];
  alerts: FleetAlert[];
  trips: FleetTrip[];
}

export function useFleetVehicle(
  pollIntervalMs = 30000,
  initialTripFilter = "all"
) {
  const [data, setData] = useState<FleetOverviewData | null>(null);
  const [tripFilter, setTripFilter] = useState<string>(initialTripFilter);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const fetchFleet = useCallback(
    async (overrideTripFilter?: string) => {
      try {
        const filterToUse = overrideTripFilter ?? tripFilter;

        const url =
          filterToUse && filterToUse !== "all"
            ? `/api/fleet/overview?trip_status=${encodeURIComponent(filterToUse)}`
            : "/api/fleet/overview";

        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(`Failed to load fleet data (${res.status})`);
        }

        const json = await res.json();

        setData(json);
        setLastSyncTime(new Date());
        setSecondsAgo(0);
        setError(null);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Error fetching fleet overview";

        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [tripFilter]
  );

  // Handle trip filter changes
  const handleSetTripFilter = useCallback(
    (newFilter: string) => {
      setTripFilter(newFilter);
      fetchFleet(newFilter);
    },
    [fetchFleet]
  );

  // Initial fetch and polling
  useEffect(() => {
    fetchFleet();

    const pollTimer = setInterval(() => {
      fetchFleet();
    }, pollIntervalMs);

    return () => {
      clearInterval(pollTimer);
    };
  }, [fetchFleet, pollIntervalMs]);

  // Update elapsed time since last successful synchronization
  useEffect(() => {
    if (!lastSyncTime) return;

    const ticker = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - lastSyncTime.getTime()) / 1000
      );

      setSecondsAgo(elapsed);
    }, 1000);

    return () => clearInterval(ticker);
  }, [lastSyncTime]);

  return {
    data,
    isLoading,
    error,
    lastSyncTime,
    secondsAgo,
    tripFilter,
    setTripFilter: handleSetTripFilter,
    refetch: fetchFleet,
  };
}
