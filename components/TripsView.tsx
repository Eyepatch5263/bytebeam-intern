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
    tripsToday: 42,
    totalVehiclesCount: 20,
    distanceCoveredKm: 1248,
    avgTripDurationMin: 46,
    activeTripsCount: 4,
    attentionCount: 3,
    completedCount: 35,
    totalTrips: 42,
  });

  const [statusFilter, setStatusFilter] = useState<"all" | "in_progress" | "completed" | "attention">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [inspectVehicle, setInspectVehicle] = useState<FleetVehicle | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncSeconds, setLastSyncSeconds] = useState(28);

  const pageSize = 6;

  // Fallback initial trips data matching user reference screenshot
  const initialFallbackTrips: TripItem[] = useMemo(
    () => [
      {
        id: "t1",
        trip_number: "TRIP-01",
        status: "in_progress",
        date_day: "02",
        date_month: "NOV",
        start_location: "Koramangala",
        end_location: "Whitefield",
        distance_km: 28.4,
        duration_min: 52,
        average_speed: 39,
        halt_time_min: 6,
        started_at: new Date(Date.now() - 52 * 60000).toISOString(),
        start_time: "11:16 AM",
        last_seen_time: "12:08 PM",
        vehicle: {
          registration_number: "KA 03 MN 4821",
          model: "Tata Ace",
          vehicle_type: "Delivery Van",
        },
        driver: {
          full_name: "Rohan Kumar",
          phone: "+91 98234 11201",
        },
        timeline: [
          { id: "e1", title: "Trip started", location: "Koramangala depot", time: "11:16", status: "started" },
          { id: "e2", title: "Stopped · 6 min", location: "Domlur junction", time: "11:42", status: "halt" },
          { id: "e3", title: "Current position", location: "Indiranagar", time: "12:08", status: "active" },
        ],
      },
      {
        id: "t2",
        trip_number: "TRIP-02",
        status: "in_progress",
        date_day: "02",
        date_month: "NOV",
        start_location: "Hebbal",
        end_location: "Electronic City",
        distance_km: 36.8,
        duration_min: 68,
        average_speed: 44,
        halt_time_min: 4,
        started_at: new Date(Date.now() - 68 * 60000).toISOString(),
        start_time: "10:45 AM",
        last_seen_time: "11:53 AM",
        vehicle: {
          registration_number: "KA 51 M 8932",
          model: "Mahindra Bolero",
          vehicle_type: "Light Commercial Vehicle",
        },
        driver: {
          full_name: "Amit S.",
          phone: "+91 98112 44302",
        },
        timeline: [
          { id: "e1", title: "Trip started", location: "Hebbal Hub", time: "10:45", status: "started" },
          { id: "e2", title: "Traffic slow · 8 min", location: "Silk Board", time: "11:20", status: "halt" },
          { id: "e3", title: "Current position", location: "Electronic City Expressway", time: "11:53", status: "active" },
        ],
      },
      {
        id: "t3",
        trip_number: "TRIP-03",
        status: "completed",
        date_day: "02",
        date_month: "NOV",
        start_location: "Yeshwanthpur",
        end_location: "Indiranagar",
        distance_km: 18.2,
        duration_min: 39,
        average_speed: 35,
        halt_time_min: 3,
        started_at: new Date(Date.now() - 120 * 60000).toISOString(),
        start_time: "09:30 AM",
        last_seen_time: "10:09 AM",
        vehicle: {
          registration_number: "KA 04 AC 6173",
          model: "Ashok Leyland Dost",
          vehicle_type: "Light Commercial Vehicle",
        },
        driver: {
          full_name: "Naveen R.",
          phone: "+91 94220 55603",
        },
        timeline: [
          { id: "e1", title: "Trip started", location: "Yeshwanthpur Industrial", time: "09:30", status: "started" },
          { id: "e2", title: "Delivered package", location: "Malleshwaram", time: "09:50", status: "halt" },
          { id: "e3", title: "Trip completed", location: "Indiranagar Gateway", time: "10:09", status: "completed" },
        ],
      },
      {
        id: "t4",
        trip_number: "TRIP-04",
        status: "attention",
        date_day: "02",
        date_month: "NOV",
        start_location: "Peenya",
        end_location: "Rajajinagar",
        distance_km: 12.6,
        duration_min: 31,
        average_speed: 28,
        halt_time_min: 12,
        started_at: new Date(Date.now() - 45 * 60000).toISOString(),
        start_time: "10:15 AM",
        last_seen_time: "10:46 AM",
        vehicle: {
          registration_number: "KA 05 AB 2910",
          model: "Tata Intra V30",
          vehicle_type: "Light Commercial Vehicle",
        },
        driver: {
          full_name: "Sanjay P.",
          phone: "+91 99480 66704",
        },
        timeline: [
          { id: "e1", title: "Trip started", location: "Peenya Stage 2", time: "10:15", status: "started" },
          { id: "e2", title: "Halt · Breakdown warning", location: "Toll Gate", time: "10:32", status: "halt" },
          { id: "e3", title: "Current position", location: "Rajajinagar Industrial", time: "10:46", status: "active" },
        ],
      },
      {
        id: "t5",
        trip_number: "TRIP-05",
        status: "completed",
        date_day: "02",
        date_month: "NOV",
        start_location: "Whitefield",
        end_location: "Marathahalli",
        distance_km: 8.7,
        duration_min: 24,
        average_speed: 32,
        halt_time_min: 2,
        started_at: new Date(Date.now() - 180 * 60000).toISOString(),
        start_time: "08:15 AM",
        last_seen_time: "08:39 AM",
        vehicle: {
          registration_number: "KA 02 CD 7608",
          model: "Mahindra Supro",
          vehicle_type: "Delivery Van",
        },
        driver: {
          full_name: "Dev M.",
          phone: "+91 97180 77805",
        },
        timeline: [
          { id: "e1", title: "Trip started", location: "Whitefield Depot", time: "08:15", status: "started" },
          { id: "e2", title: "Delivered package", location: "Kundalahalli", time: "08:28", status: "halt" },
          { id: "e3", title: "Trip completed", location: "Marathahalli Bridge", time: "08:39", status: "completed" },
        ],
      },
      {
        id: "t6",
        trip_number: "TRIP-06",
        status: "completed",
        date_day: "02",
        date_month: "NOV",
        start_location: "Jayanagar",
        end_location: "Hebbal",
        distance_km: 21.3,
        duration_min: 48,
        average_speed: 36,
        halt_time_min: 5,
        started_at: new Date(Date.now() - 240 * 60000).toISOString(),
        start_time: "07:30 AM",
        last_seen_time: "08:18 AM",
        vehicle: {
          registration_number: "KA 41 DE 1192",
          model: "Eicher Pro 2049",
          vehicle_type: "Light Commercial Vehicle",
        },
        driver: {
          full_name: "Farhan K.",
          phone: "+91 98765 88906",
        },
        timeline: [
          { id: "e1", title: "Trip started", location: "Jayanagar Hub", time: "07:30", status: "started" },
          { id: "e2", title: "Check stop", location: "MG Road", time: "07:55", status: "halt" },
          { id: "e3", title: "Trip completed", location: "Hebbal Flyover", time: "08:18", status: "completed" },
        ],
      },
    ],
    []
  );

  const fetchTrips = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/fleet/trips?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load trips data");

      const json = await res.json();
      if (json.trips && json.trips.length > 0) {
        setTrips(json.trips);
        if (json.metrics) setMetrics(json.metrics);
        if (!selectedTripId) setSelectedTripId(json.trips[0].id);
      } else {
        setTrips(initialFallbackTrips);
        if (!selectedTripId) setSelectedTripId(initialFallbackTrips[0].id);
      }
    } catch (err) {
      console.warn("Using fallback trips data:", err);
      setTrips(initialFallbackTrips);
      if (!selectedTripId) setSelectedTripId(initialFallbackTrips[0].id);
    } finally {
      setIsLoading(false);
      setLastSyncSeconds(0);
    }
  }, [statusFilter, searchQuery, selectedTripId, initialFallbackTrips]);

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
    return trips.find((t) => t.id === selectedTripId) || trips[0] || initialFallbackTrips[0];
  }, [trips, selectedTripId, initialFallbackTrips]);

  // Pagination slice
  const totalPages = Math.ceil(trips.length / pageSize) || 1;
  const paginatedTrips = trips.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // CSV export handler
  const handleDownloadCSV = () => {
    const headers = ["Trip Number", "Vehicle", "Driver", "Route", "Distance (km)", "Duration (min)", "Status"];
    const rows = trips.map((t) => [
      t.trip_number,
      t.vehicle.registration_number,
      t.driver.full_name,
      `${t.start_location} -> ${t.end_location}`,
      t.distance_km,
      t.duration_min,
      t.status,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
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
      {/* 1. LEFT SIDEBAR (Width: 256px)             */}
      {/* ========================================= */}
      <aside className="w-64 bg-white border-r border-gray-200/80 flex flex-col justify-between shrink-0 fixed inset-y-0 left-0 z-30">
        <div>
          {/* Top Brand Logo */}
          <div className="h-16 px-6 flex items-center gap-3 border-b border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-[#11382b] flex items-center justify-center text-emerald-400">
              <svg className="w-3.5 h-3.5 transform rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-[15px] text-gray-900 tracking-tight leading-none block">
                bytebeam
              </span>
              <span className="text-[8.5px] font-semibold tracking-[0.2em] uppercase text-emerald-800 leading-none block mt-0.5">
                FLEET OPERATIONS
              </span>
            </div>
          </div>

          {/* Workspace Switcher */}
          <div className="p-4">
            <div className="rounded-xl border border-gray-200/80 bg-gray-50/50 p-2.5 flex items-center justify-between hover:bg-gray-100/60 transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#eaf4f0] border border-emerald-200/60 flex items-center justify-center font-bold text-xs text-[#11382b]">
                  N
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-400 block leading-tight">
                    Workspace
                  </span>
                  <span className="text-xs font-bold text-gray-900 block leading-tight">
                    Northstar Logistics
                  </span>
                </div>
              </div>
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="px-3 pt-2">
            <span className="px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 block mb-2">
              OPERATIONS
            </span>
            <nav className="space-y-1">
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

              {/* Trips (ACTIVE on this page) */}
              <button
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold bg-[#eaf4f0] text-[#11382b] transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 text-[#11382b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>Trips</span>
              </button>

              {/* Alerts */}
              <button
                onClick={() => router.push("/#alerts")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span>Alerts</span>
                </div>
                <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex items-center justify-center">
                  3
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Lower Sidebar */}
        <div className="p-4 space-y-4">
          <div className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-3.5">
            <h4 className="text-xs font-semibold text-gray-900">Need a hand?</h4>
            <p className="text-[11px] text-gray-500 mt-1 leading-snug">
              Find quick answers about fleet status and trip data.
            </p>
            <a href="#help" className="text-[11px] font-medium text-[#11382b] hover:underline mt-2 inline-block">
              Open help center →
            </a>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#a88168] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {initials}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-gray-900 block truncate leading-tight">
                  {displayName}
                </span>
                <span className="text-[10px] text-gray-500 block truncate leading-tight mt-0.5">
                  {userRole}
                </span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================= */}
      {/* 2. MAIN TRIPS WORKSPACE                    */}
      {/* ========================================= */}
      <div className="flex-1 pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-gray-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
            <span>Fleet</span>
            <span>/</span>
            <span className="text-gray-800 font-semibold">Trips</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search vehicles, trips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 lg:w-64 pl-8 pr-8 py-1.5 rounded-lg border border-gray-200/80 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#11382b] bg-gray-50/50"
              />
              <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-gray-400 border border-gray-200 px-1 py-0.2 rounded bg-white">
                ⌘K
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono text-gray-500">
                Last sync: {lastSyncSeconds} sec ago
              </span>
            </div>

            <button className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            <div className="w-7 h-7 rounded-full bg-[#a88168] text-white flex items-center justify-center font-bold text-[11px]">
              {initials}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 sm:p-8 space-y-6 max-w-350 w-full mx-auto">
          {/* Page Title & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono font-medium tracking-[0.2em] text-gray-400 uppercase block">
                FLEET &nbsp;/&nbsp; ACTIVITY LOG
              </span>
              <h1 className="text-2xl sm:text-[28px] font-bold text-gray-900 tracking-tight mt-0.5">
                Trips
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Review routes, durations, and notable vehicle activity.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-lg border border-gray-200/90 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Today, Nov 02</span>
                <span className="text-gray-400 text-[10px]">▾</span>
              </button>

              <button className="flex items-center gap-1.5 rounded-lg border border-gray-200/90 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* ========================================= */}
          {/* 3. TOP 3 METRIC CARDS                     */}
          {/* ========================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: Trips today */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs flex flex-col justify-between">
              <span className="text-xs font-medium text-gray-500 block">Trips today</span>
              <div className="mt-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-gray-900">{metrics.tripsToday}</span>
                  <span className="text-xs text-gray-400">across {metrics.totalVehiclesCount} vehicles</span>
                </div>
              </div>
            </div>

            {/* Card 2: Distance covered */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs flex flex-col justify-between">
              <span className="text-xs font-medium text-gray-500 block">Distance covered</span>
              <div className="mt-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-gray-900">
                    {metrics.distanceCoveredKm.toLocaleString()} km
                  </span>
                  <span className="text-xs text-emerald-700 font-medium">+13% vs yesterday</span>
                </div>
              </div>
            </div>

            {/* Card 3: Avg trip duration */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs flex flex-col justify-between">
              <span className="text-xs font-medium text-gray-500 block">Avg. trip duration</span>
              <div className="mt-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-gray-900">{metrics.avgTripDurationMin} min</span>
                  <span className="text-xs text-gray-400">{metrics.activeTripsCount} trips still active</span>
                </div>
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
                      Recent activity · {metrics.totalTrips} trips
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
                    All trips {metrics.totalTrips}
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
                    In progress {metrics.activeTripsCount}
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
                    Completed
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
                    Attention {metrics.attentionCount}
                  </button>
                </div>

                {/* Trips Rows */}
                <div className="divide-y divide-gray-100">
                  {isLoading ? (
                    <div className="py-16 text-center">
                      <div className="w-6 h-6 border-2 border-[#11382b] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span className="text-xs text-gray-400 font-mono">LOADING ACTIVITY LOG...</span>
                    </div>
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

                              <div className="text-[11px] text-gray-400 font-mono mt-0.5 truncate">
                                {trip.distance_km} km · {trip.duration_min} min · {trip.driver?.full_name}
                              </div>
                            </div>
                          </div>

                          {/* Status Pill */}
                          <div className="shrink-0">
                            <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold ${statusBadgeClass}`}>
                              {statusText}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Pagination Footer */}
              <div className="p-3.5 sm:px-5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-white">
                <span>
                  Showing {Math.min(trips.length, paginatedTrips.length)} of {metrics.totalTrips} trips
                </span>

                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2 py-0.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer text-xs"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-5 h-5 rounded flex items-center justify-center text-xs font-medium transition-colors cursor-pointer ${
                        currentPage === i + 1
                          ? "bg-[#11382b] text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

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
              {/* Selected Trip Header */}
              <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-gray-400 block">
                    SELECTED TRIP · 02 NOV
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
                      : "bg-gray-100 text-gray-700 border border-gray-200"
                  }`}
                >
                  {selectedTrip.status === "in_progress" ? "In progress" : selectedTrip.status}
                </span>
              </div>

              {/* Mapbox Route Canvas Component */}
              <SelectedTripMap
                startLocation={selectedTrip.start_location}
                endLocation={selectedTrip.end_location}
                startTime={selectedTrip.start_time || "11:16 AM"}
                lastSeenTime={selectedTrip.last_seen_time || "12:08 PM"}
                currentLocationName="Indiranagar"
              />

              {/* 3 Metric Stats below Map */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-medium block">Distance</span>
                  <span className="text-sm font-bold font-mono text-gray-900 mt-0.5 block">
                    {selectedTrip.distance_km} km
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-medium block">Duration</span>
                  <span className="text-sm font-bold font-mono text-gray-900 mt-0.5 block">
                    {selectedTrip.duration_min} min
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-medium block">Avg. speed</span>
                  <span className="text-sm font-bold font-mono text-gray-900 mt-0.5 block">
                    {selectedTrip.average_speed} km/h
                  </span>
                </div>
              </div>

              {/* Key Events Timeline */}
              <div className="pt-3 border-t border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">
                  Key events
                </span>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                  {(selectedTrip.timeline || []).map((ev) => (
                    <div key={ev.id} className="relative">
                      <div
                        className={`absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 flex items-center justify-center ${
                          ev.status === "halt"
                            ? "border-amber-500"
                            : "border-emerald-600"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            ev.status === "halt"
                              ? "bg-amber-500"
                              : "bg-emerald-600"
                          }`}
                        />
                      </div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="text-xs font-bold text-gray-900">{ev.title}</h5>
                          <p className="text-[11px] text-gray-500 mt-0.5">{ev.location}</p>
                        </div>
                        <span className="text-[11px] font-mono text-gray-400">{ev.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Vehicle Detail Slide-over Drawer if vehicle is clicked */}
      <VehicleDetailDrawer
        vehicle={inspectVehicle}
        onClose={() => setInspectVehicle(null)}
        onViewOnMap={(v) => router.push(`/?vehicle=${v.id}`)}
      />
    </div>
  );
}
