"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import SelectedTripMap from "@/components/SelectedTripMap";
import VehicleDetailDrawer from "@/components/VehicleDetailDrawer";
import type { FleetVehicle } from "@/app/hooks/useFleetVehicle";

interface TripItem {
  id: string;
  trip_number: string;
  vehicle_id?: string;
  status: "in_progress" | "completed" | "attention";
  raw_status?: string;
  date_day: string;
  date_month: string;
  start_location: string;
  end_location: string;
  distance_km: number;
  duration_min: number;
  average_speed: number;
  halt_time_min: number;
  started_at: string;
  start_time: string;
  last_seen_time: string;
  vehicle: {
    id?: string;
    registration_number: string;
    model: string;
    vehicle_type: string;
  };
  driver: {
    id?: string;
    full_name: string;
    phone?: string;
  };
  timeline?: {
    id: string;
    title: string;
    location: string;
    time: string;
    status: string;
  }[];
}

export default function TripsView() {
  const router = useRouter();
  const supabase = createClient();

  const [trips, setTrips] = useState<TripItem[]>([]);
  const [metrics, setMetrics] = useState({
    tripsToday: 0,
    totalVehiclesCount: 0,
    distanceCoveredKm: 0,
    avgTripDurationMin: 0,
    activeTripsCount: 0,
    attentionCount: 0,
    completedCount: 0,
    totalTrips: 0,
  });

  const [statusFilter, setStatusFilter] = useState<"all" | "in_progress" | "completed" | "attention">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [inspectVehicle, setInspectVehicle] = useState<FleetVehicle | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncSeconds, setLastSyncSeconds] = useState(0);

  const pageSize = 6;

  const fetchTrips = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/fleet/trips?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load trips data");

      const json = await res.json();
      if (json.trips) {
        setTrips(json.trips);
        if (json.metrics) setMetrics(json.metrics);
        setSelectedTripId((currentId) => {
          if (currentId && json.trips.some((t: any) => t.id === currentId)) {
            return currentId;
          }
          return json.trips[0]?.id || null;
        });
      } else {
        setTrips([]);
      }
    } catch (err) {
      console.error("Failed to load trips:", err);
      setTrips([]);
    } finally {
      setIsLoading(false);
      setLastSyncSeconds(0);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchTrips();
    const interval = setInterval(fetchTrips, 25000);
    const ticker = setInterval(() => setLastSyncSeconds((s) => s + 1), 1000);

    return () => {
      clearInterval(interval);
      clearInterval(ticker);
    };
  }, [fetchTrips]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  };

  const displayName = "Pratyush Pragyey";
  const userRole = "Operations manager";
  const initials = "PP";

  // Selected trip for the right inspector card
  const selectedTrip = useMemo(() => {
    if (!trips.length) return null;
    return trips.find((t) => t.id === selectedTripId) || trips[0] || null;
  }, [trips, selectedTripId]);

  // Pagination slice
  const totalPages = Math.ceil(trips.length / pageSize) || 1;
  const paginatedTrips = trips.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // CSV export handler
  const handleDownloadCSV = () => {
    const headers = ["Trip Number", "Vehicle", "Driver", "Route", "Distance (km)", "Duration (min)", "Status"];
    const rows = trips.map((t) => [
      t.trip_number,
      t.vehicle.registration_number,
      `"${t.driver.full_name}"`,
      `"${t.start_location} - ${t.end_location}"`,
      t.distance_km,
      t.duration_min,
      t.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fleet-trips-report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] flex font-sans text-gray-900 select-none">
      {/* ========================================= */}
      {/* 1. LEFT SIDEBAR                           */}
      {/* ========================================= */}
      <aside className="w-64 bg-white border-r border-gray-200/80 flex flex-col justify-between shrink-0 fixed inset-y-0 left-0 z-30">
        <div>
          {/* Top Brand Logo */}
          <div className="p-5 pb-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#11382b] flex items-center justify-center text-white shadow-xs">
              <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-gray-900 tracking-tight text-sm block">bytebeam</span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block -mt-1 font-mono">
                Fleet Operations
              </span>
            </div>
          </div>

          {/* Workspace Switcher */}
          <div className="p-3">
            <div className="bg-[#f6f8f7] rounded-xl p-2.5 border border-gray-200/70 flex items-center justify-between cursor-pointer hover:bg-gray-100/70 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center font-bold text-xs text-gray-700 shadow-2xs">
                  N
                </div>
                <div className="leading-tight">
                  <span className="text-[10px] text-gray-400 font-medium block">Workspace</span>
                  <span className="text-xs font-semibold text-gray-800 block">Northstar Logistics</span>
                </div>
              </div>
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Nav Items */}
          <div className="px-3 py-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 block mb-1 font-mono">
              OPERATIONS
            </span>
            <nav className="space-y-0.5">
              {/* Overview */}
              <button
                onClick={() => router.push("/")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>Overview</span>
              </button>

              {/* Vehicles */}
              <button
                onClick={() => router.push("/vehicles")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h8m-8 5h8m-8 5h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                </svg>
                <span>Vehicles</span>
              </button>

              {/* Trips (Active Tab) */}
              <button
                onClick={() => setStatusFilter("all")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold bg-[#eaf4f0] text-[#11382b] transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 text-[#11382b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>Trips</span>
              </button>

              {/* Alerts */}
              <button
                onClick={() => router.push("/alerts")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span>Alerts</span>
                </div>
                <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex items-center justify-center font-mono">
                  3
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Help Card & Profile */}
        <div>
          <div className="p-3 mx-3 mb-3 bg-[#f6f8f7] border border-gray-200/60 rounded-xl">
            <span className="text-xs font-semibold text-gray-900 block">Need a hand?</span>
            <p className="text-[11px] text-gray-500 mt-1 leading-snug">
              Find quick answers about fleet status and trip data.
            </p>
            <button className="text-[11px] font-medium text-[#11382b] hover:underline mt-2 flex items-center gap-1 cursor-pointer">
              <span>Open help center</span>
              <span>→</span>
            </button>
          </div>

          <div className="p-3 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-xs font-bold text-amber-800">
                {initials}
              </div>
              <div className="leading-tight">
                <span className="text-xs font-semibold text-gray-800 block">{displayName}</span>
                <span className="text-[10px] text-gray-400 block">{userRole}</span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================= */}
      {/* 2. MAIN WORKSPACE CONTENT AREA             */}
      {/* ========================================= */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-14 bg-white border-b border-gray-200/80 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="hover:text-gray-700 cursor-pointer" onClick={() => router.push("/")}>
              Fleet
            </span>
            <span className="text-gray-300">/</span>
            <span className="font-semibold text-gray-900">Trips</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search vehicles, trips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 pl-8 pr-8 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50/50 text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#11382b]"
              />
              <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-gray-400 border border-gray-200 px-1 rounded bg-white">
                ⌘K
              </kbd>
            </div>

            {/* Sync Pill */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px]">Last sync: {lastSyncSeconds}s ago</span>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => router.push("/alerts")}
              title="Alerts"
              className="relative p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
            </button>

            {/* Avatar Pill */}
            <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-xs font-bold text-amber-800">
              {initials}
            </div>
          </div>
        </header>

        {/* Workspace Body */}
        <div className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header Title Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-emerald-800/80 block">
                FLEET / ACTIVITY LOG
              </span>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">Trips</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Review routes, durations, and notable vehicle activity.
              </p>
            </div>

            {/* Actions: Date Picker & Filters Button */}
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-2xs hover:bg-gray-50 transition-colors cursor-pointer">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Today</span>
                <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <button
                onClick={fetchTrips}
                title="Refresh trips"
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-2xs hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* ========================================= */}
          {/* 3. TOP 3 METRIC CARDS WITH SKELETONS      */}
          {/* ========================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: Trips today */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs flex flex-col justify-between">
              <span className="text-xs font-medium text-gray-500 block">Trips today</span>
              <div className="mt-2">
                {isLoading ? (
                  <div className="flex items-baseline gap-2 animate-pulse">
                    <div className="h-7 w-12 bg-gray-200 rounded" />
                    <div className="h-3 w-24 bg-gray-100 rounded" />
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-gray-900">{metrics.tripsToday}</span>
                    <span className="text-xs text-gray-400">across {metrics.totalVehiclesCount} vehicles</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Distance covered */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs flex flex-col justify-between">
              <span className="text-xs font-medium text-gray-500 block">Distance covered</span>
              <div className="mt-2">
                {isLoading ? (
                  <div className="flex items-baseline gap-2 animate-pulse">
                    <div className="h-7 w-20 bg-gray-200 rounded" />
                    <div className="h-3 w-20 bg-gray-100 rounded" />
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-gray-900">
                      {metrics.distanceCoveredKm.toLocaleString()} km
                    </span>
                    <span className="text-xs text-emerald-700 font-medium">live fleet log</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card 3: Avg trip duration */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs flex flex-col justify-between">
              <span className="text-xs font-medium text-gray-500 block">Avg. trip duration</span>
              <div className="mt-2">
                {isLoading ? (
                  <div className="flex items-baseline gap-2 animate-pulse">
                    <div className="h-7 w-16 bg-gray-200 rounded" />
                    <div className="h-3 w-24 bg-gray-100 rounded" />
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-gray-900">{metrics.avgTripDurationMin} min</span>
                    <span className="text-xs text-gray-400">{metrics.activeTripsCount} trips still active</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================= */}
          {/* 4. MAIN SPLIT SECTION: LIST + INSPECTOR   */}
          {/* ========================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Recent Activity Trips List (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden flex flex-col justify-between">
              <div>
                {/* List Header */}
                <div className="p-4 sm:p-5 border-b border-gray-100 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      {isLoading ? "Recent activity" : `Recent activity · ${metrics.totalTrips} trips`}
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Select a trip to inspect its route and details.
                    </p>
                  </div>

                  <button
                    onClick={handleDownloadCSV}
                    className="text-xs font-semibold text-[#11382b] hover:underline cursor-pointer whitespace-nowrap"
                  >
                    Download CSV
                  </button>
                </div>

                {/* Filter Pills */}
                <div className="p-3 sm:px-5 border-b border-gray-100 bg-[#fafbfa] flex items-center gap-1.5 text-xs overflow-x-auto">
                  <button
                    onClick={() => {
                      setStatusFilter("all");
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      statusFilter === "all"
                        ? "bg-[#eaf4f0] text-[#11382b] font-bold"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    All trips {isLoading ? "" : metrics.totalTrips}
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter("in_progress");
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      statusFilter === "in_progress"
                        ? "bg-[#eaf4f0] text-[#11382b] font-bold"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    In progress {isLoading ? "" : metrics.activeTripsCount}
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter("completed");
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      statusFilter === "completed"
                        ? "bg-[#eaf4f0] text-[#11382b] font-bold"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    Completed {isLoading ? "" : metrics.completedCount}
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter("attention");
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      statusFilter === "attention"
                        ? "bg-[#eaf4f0] text-[#11382b] font-bold"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    Attention {isLoading ? "" : metrics.attentionCount}
                  </button>
                </div>

                {/* Trips Rows with Loading Skeletons */}
                <div className="divide-y divide-gray-100">
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, idx) => (
                      <div key={idx} className="p-3.5 sm:px-5 flex items-center justify-between gap-4 animate-pulse">
                        <div className="flex items-center gap-3.5">
                          <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0" />
                          <div className="space-y-1.5">
                            <div className="h-3 w-28 bg-gray-200 rounded" />
                            <div className="h-2.5 w-48 bg-gray-100 rounded" />
                            <div className="h-2 w-36 bg-gray-100 rounded" />
                          </div>
                        </div>
                        <div className="h-5 w-16 bg-gray-100 rounded-full" />
                      </div>
                    ))
                  ) : paginatedTrips.length === 0 ? (
                    <div className="py-16 text-center text-xs text-gray-400">
                      No trips match the selected filter.
                    </div>
                  ) : (
                    paginatedTrips.map((trip) => {
                      const isSelected = selectedTrip?.id === trip.id;
                      const isProgress = trip.status === "in_progress";
                      const isAttention = trip.status === "attention";

                      const statusBadgeClass = isProgress
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                        : isAttention
                        ? "bg-amber-50 text-amber-800 border-amber-200/80"
                        : "bg-gray-100 text-gray-600 border-gray-200/80";

                      const statusText = isProgress
                        ? "In progress"
                        : isAttention
                        ? "Attention"
                        : "Completed";

                      return (
                        <div
                          key={trip.id}
                          onClick={() => setSelectedTripId(trip.id)}
                          className={`p-3.5 sm:px-5 flex items-center justify-between gap-4 transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#f0fdf4] border-l-4 border-[#11382b]"
                              : "hover:bg-gray-50/80"
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Date Block */}
                            <div className="w-9 shrink-0 text-center font-mono leading-none">
                              <span className="text-sm font-bold text-gray-900 block">
                                {trip.date_day}
                              </span>
                              <span className="text-[10px] text-gray-400 uppercase tracking-wider block mt-0.5">
                                {trip.date_month}
                              </span>
                            </div>

                            {/* Trip Info */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-gray-900 tracking-tight block">
                                  {trip.vehicle?.registration_number}
                                </span>
                              </div>

                              <div className="text-xs text-gray-600 font-medium truncate mt-0.5">
                                {trip.start_location} <span className="text-gray-400">──</span> {trip.end_location}
                              </div>

                              <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5 font-mono">
                                <span>{trip.distance_km} km</span>
                                <span>·</span>
                                <span>{trip.duration_min} min</span>
                                <span>·</span>
                                <span className="text-gray-500 font-sans">{trip.driver?.full_name}</span>
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border shrink-0 ${statusBadgeClass}`}
                          >
                            {statusText}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Pagination Footer */}
              <div className="p-3.5 sm:px-5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Showing {paginatedTrips.length} of {metrics.totalTrips} trips
                </span>

                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2 py-0.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer text-xs"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(idx + 1)}
                        className={`w-6 h-6 rounded text-xs font-medium cursor-pointer ${
                          currentPage === idx + 1
                            ? "bg-[#11382b] text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2 py-0.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer text-xs"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Selected Trip Inspector (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs space-y-4">
              {isLoading ? (
                /* Inspector Skeleton while loading */
                <div className="space-y-4 animate-pulse">
                  <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                    <div className="space-y-1.5">
                      <div className="h-2.5 w-24 bg-gray-200 rounded" />
                      <div className="h-4 w-48 bg-gray-200 rounded" />
                      <div className="h-3 w-36 bg-gray-100 rounded" />
                    </div>
                    <div className="h-5 w-20 bg-gray-200 rounded-full" />
                  </div>
                  <div className="w-full h-64 sm:h-72 rounded-xl bg-gray-100 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>LOADING ROUTE MAP...</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center space-y-1">
                        <div className="h-2 w-12 bg-gray-200 rounded mx-auto" />
                        <div className="h-4 w-16 bg-gray-200 rounded mx-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : selectedTrip ? (
                <>
                  {/* Selected Trip Header */}
                  <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-gray-400 block">
                        SELECTED TRIP · {selectedTrip.date_day} {selectedTrip.date_month}
                      </span>
                      <h3 className="text-base font-bold text-gray-900 tracking-tight mt-0.5">
                        {selectedTrip.start_location} <span className="text-gray-400 font-light">──</span> {selectedTrip.end_location}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        <button
                          onClick={() => {
                            setInspectVehicle({
                              id: selectedTrip.vehicle_id || "v-selected",
                              registration_number: selectedTrip.vehicle.registration_number,
                              manufacturer: selectedTrip.vehicle.model.split(" ")[0],
                              model: selectedTrip.vehicle.model,
                              vehicle_type: selectedTrip.vehicle.vehicle_type,
                              status: selectedTrip.status === "in_progress" ? "moving" : "idle",
                              current_speed: selectedTrip.average_speed,
                              driver: {
                                full_name: selectedTrip.driver.full_name,
                                phone: selectedTrip.driver.phone || "+91 98450 12345",
                                license_number: "KA0120200045674",
                              },
                              last_seen_at: selectedTrip.started_at,
                              latitude: 12.9716,
                              longitude: 77.5946,
                              ignition_on: selectedTrip.status === "in_progress",
                              fuel_level: 64,
                              battery_level: 88,
                            });
                          }}
                          className="hover:underline hover:text-[#11382b] font-semibold text-gray-700 cursor-pointer"
                        >
                          {selectedTrip.vehicle.registration_number}
                        </button>{" "}
                        · {selectedTrip.vehicle.model} · {selectedTrip.driver.full_name}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                        selectedTrip.status === "in_progress"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : selectedTrip.status === "attention"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}
                    >
                      {selectedTrip.status === "in_progress"
                        ? "In progress"
                        : selectedTrip.status === "attention"
                        ? "Attention"
                        : "Completed"}
                    </span>
                  </div>

                  {/* Mapbox Route Visualizer */}
                  <div className="pt-1">
                    <SelectedTripMap
                      startLocation={selectedTrip.start_location}
                      endLocation={selectedTrip.end_location}
                      startTime={selectedTrip.start_time}
                      lastSeenTime={selectedTrip.last_seen_time}
                      currentLocationName={selectedTrip.end_location}
                    />
                  </div>

                  {/* 3 Metric Cards */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100 text-center">
                      <span className="text-[10px] text-gray-400 font-medium block">Distance</span>
                      <span className="text-sm font-bold text-gray-900 block mt-0.5 font-mono">
                        {selectedTrip.distance_km} km
                      </span>
                    </div>

                    <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100 text-center">
                      <span className="text-[10px] text-gray-400 font-medium block">Duration</span>
                      <span className="text-sm font-bold text-gray-900 block mt-0.5 font-mono">
                        {selectedTrip.duration_min} min
                      </span>
                    </div>

                    <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100 text-center">
                      <span className="text-[10px] text-gray-400 font-medium block">Avg. speed</span>
                      <span className="text-sm font-bold text-gray-900 block mt-0.5 font-mono">
                        {selectedTrip.average_speed} km/h
                      </span>
                    </div>
                  </div>

                  {/* Key Events Vertical Timeline */}
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-xs font-bold text-gray-900 block mb-3">Key events</span>

                    <div className="relative pl-6 space-y-3.5 before:absolute before:left-2 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-gray-200">
                      {(selectedTrip.timeline || []).map((event, idx) => (
                        <div key={event.id || idx} className="relative flex items-baseline justify-between text-xs">
                          {/* Dot Bullet */}
                          <div
                            className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 bg-white ${
                              event.status === "active"
                                ? "border-emerald-600 bg-emerald-500 ring-2 ring-emerald-100"
                                : event.status === "halt"
                                ? "border-amber-500 bg-amber-400"
                                : "border-gray-400 bg-white"
                            }`}
                          />

                          <div className="pr-2">
                            <span className="font-semibold text-gray-800 block text-xs leading-snug">
                              {event.title}
                            </span>
                            <span className="text-[11px] text-gray-400 block mt-0.5">
                              {event.location}
                            </span>
                          </div>

                          <span className="text-[11px] font-mono text-gray-400 shrink-0">
                            {event.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-xs text-gray-400">
                  No trip selected.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Detail Drawer Modal */}
      {inspectVehicle && (
        <VehicleDetailDrawer
          vehicle={inspectVehicle}
          onClose={() => setInspectVehicle(null)}
        />
      )}
    </div>
  );
}
