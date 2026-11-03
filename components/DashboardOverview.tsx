import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { useFleetVehicle, type FleetVehicle } from "@/app/hooks/useFleetVehicle";
import FleetMap from "@/components/FleetMap";
import VehicleDetailDrawer from "@/components/VehicleDetailDrawer";

interface DashboardOverviewProps {
  user?: User | null | {
    id?: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      role?: string;
    };
  };
}

export default function DashboardOverview({ user }: DashboardOverviewProps) {
  const router = useRouter();
  const supabase = createClient();
  const { data: fleetData, secondsAgo, refetch, tripFilter, setTripFilter } = useFleetVehicle(20000);

  const [activeTab, setActiveTab] = useState<"overview" | "vehicles" | "trips" | "alerts">("overview");
  const [vehicleFilter, setVehicleFilter] = useState<"all" | "moving" | "idle" | "offline">("all");
  const [selectedVehicle, setSelectedVehicle] = useState<FleetVehicle | null>(null);

  // Auto-select vehicle from URL query (?vehicle=id) e.g. when redirected from /vehicles
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const vehicleId = params.get("vehicle");
    if (vehicleId && fleetData?.vehicles?.length) {
      const target = fleetData.vehicles.find((v) => v.id === vehicleId);
      if (target) {
        setSelectedVehicle(target);
      }
    }
  }, [fleetData?.vehicles]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Pratyush Pragyey";
  const userRole = user?.user_metadata?.role || "Operations manager";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Metrics calculated dynamically from API / live database with fallbacks matching reference
  const metrics = fleetData?.metrics || {
    vehiclesInMotion: 19,
    totalVehicles: 20,
    parkedVehicles: 6,
    offlineVehicles: 8,
    openAlerts: 3,
    urgentAlerts: 2,
    distanceToday: 1248,
  };

  // Vehicles list
  const vehicles = fleetData?.vehicles || [];
  const filteredVehicles = vehicles.filter((v) => {
    if (vehicleFilter === "all") return true;
    return v.status === vehicleFilter;
  });

  // Recent trips fallback matching reference
  const trips = fleetData?.trips?.length
    ? fleetData.trips
    : [
        {
          id: "1",
          trip_number: "TRIP-01",
          status: "ongoing" as const,
          start_location: "Koramangala",
          end_location: "Whitefield",
          distance_km: 28.4,
          average_speed: 42,
          started_at: new Date(Date.now() - 52 * 60000).toISOString(),
          ended_at: null,
          vehicle: {
            registration_number: "KA 03 MN 4821",
            model: "Tata Ace",
            vehicle_type: "Light Commercial Vehicle",
          },
          driver: { full_name: "Rohan Kumar" },
        },
        {
          id: "2",
          trip_number: "TRIP-02",
          status: "ongoing" as const,
          start_location: "Hebbal",
          end_location: "Electronic City",
          distance_km: 36.8,
          average_speed: 48,
          started_at: new Date(Date.now() - 68 * 60000).toISOString(),
          ended_at: null,
          vehicle: {
            registration_number: "KA 51 M 8932",
            model: "Mahindra Bolero",
            vehicle_type: "Delivery Van",
          },
          driver: { full_name: "Amit S." },
        },
        {
          id: "3",
          trip_number: "TRIP-03",
          status: "completed" as const,
          start_location: "Yeshwanthpur",
          end_location: "Indiranagar",
          distance_km: 18.2,
          average_speed: 35,
          started_at: new Date(Date.now() - 120 * 60000).toISOString(),
          ended_at: new Date(Date.now() - 81 * 60000).toISOString(),
          vehicle: {
            registration_number: "KA 04 AC 6173",
            model: "Ashok Leyland Dost",
            vehicle_type: "Light Commercial Vehicle",
          },
          driver: { full_name: "Naveen R." },
        },
        {
          id: "4",
          trip_number: "TRIP-04",
          status: "cancelled" as const,
          start_location: "Peenya",
          end_location: "Rajajinagar",
          distance_km: 12.6,
          average_speed: 28,
          started_at: new Date(Date.now() - 45 * 60000).toISOString(),
          ended_at: null,
          vehicle: {
            registration_number: "KA 05 AB 2910",
            model: "Tata Intra V30",
            vehicle_type: "Light Commercial Vehicle",
          },
          driver: { full_name: "Sanjay P." },
        },
      ];

  // Alerts fallback matching reference
  const alerts = fleetData?.alerts?.length
    ? fleetData.alerts
    : [
        {
          id: "a1",
          vehicle_id: "v1",
          alert_type: "overspeeding",
          severity: "high" as const,
          title: "Overspeed detected",
          description: "KA 03 MN 4821 · 72 km/h in a 50 km/h zone",
          status: "active" as const,
          triggered_at: "12:08 PM",
          vehicle: { registration_number: "KA 03 MN 4821", model: "Tata Ace" },
        },
        {
          id: "a2",
          vehicle_id: "v2",
          alert_type: "offline",
          severity: "medium" as const,
          title: "Vehicle offline",
          description: "KA 05 AB 2910 · No signal for 34 minutes",
          status: "active" as const,
          triggered_at: "11:42 AM",
          vehicle: { registration_number: "KA 05 AB 2910", model: "Tata Intra V30" },
        },
        {
          id: "a3",
          vehicle_id: "v3",
          alert_type: "low_fuel",
          severity: "low" as const,
          title: "Fuel level low",
          description: "KA 51 M 8932 · Remaining fuel 14%",
          status: "active" as const,
          triggered_at: "10:56 AM",
          vehicle: { registration_number: "KA 51 M 8932", model: "Mahindra Bolero" },
        },
      ];

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

          {/* Workspace Switcher Box */}
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
              {/* Overview (Active) */}
              <button
                onClick={() => setActiveTab("overview")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === "overview"
                    ? "bg-[#eaf4f0] text-[#11382b]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>Overview</span>
              </button>

              {/* Vehicles */}
              <button
                onClick={() => router.push("/vehicles")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === "vehicles"
                    ? "bg-[#eaf4f0] text-[#11382b] font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h8m-8 5h8m-8 5h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                </svg>
                <span>Vehicles</span>
              </button>

              {/* Trips */}
              <button
                onClick={() => router.push("/trips")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>Trips</span>
              </button>

              {/* Alerts */}
              <button
                onClick={() => setActiveTab("alerts")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === "alerts"
                    ? "bg-[#eaf4f0] text-[#11382b] font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span>Alerts</span>
                </div>
                <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex items-center justify-center">
                  {metrics.openAlerts}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Lower Sidebar: Help Widget & User Footer */}
        <div className="p-4 space-y-4">
          {/* Help Center Box */}
          <div className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-3.5">
            <h4 className="text-xs font-semibold text-gray-900">Need a hand?</h4>
            <p className="text-[11px] text-gray-500 mt-1 leading-snug">
              Find quick answers about fleet status and trip data.
            </p>
            <a
              href="#help"
              className="text-[11px] font-medium text-[#11382b] hover:underline mt-2 inline-block"
            >
              Open help center →
            </a>
          </div>

          {/* User Profile Footer */}
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
      {/* 2. MAIN CONTENT AREA (Offset by 256px)     */}
      {/* ========================================= */}
      <div className="flex-1 pl-64 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-14 bg-white border-b border-gray-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
            <span>Fleet</span>
            <span>/</span>
            <span className="text-gray-800 font-semibold">Overview</span>
          </div>

          {/* Search, Live Sync & Profile Icon */}
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search vehicles, trips..."
                className="w-56 lg:w-64 pl-8 pr-8 py-1.5 rounded-lg border border-gray-200/80 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#11382b] bg-gray-50/50"
              />
              <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-gray-400 border border-gray-200 px-1 py-0.2 rounded bg-white">
                ⌘K
              </span>
            </div>

            {/* Last Sync Indicator */}
            <button
              onClick={() => refetch()}
              title="Click to sync now"
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono text-gray-500">
                Last sync: {secondsAgo} sec ago
              </span>
            </button>

            {/* Notification Bell */}
            <button className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors relative cursor-pointer">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {/* User Avatar Circle */}
            <div className="w-7 h-7 rounded-full bg-[#a88168] text-white flex items-center justify-center font-bold text-[11px]">
              {initials}
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="p-6 sm:p-8 space-y-6 max-w-350 w-full mx-auto">
          {/* Header Row: Title & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono font-medium tracking-[0.2em] text-gray-400 uppercase block">
                MONDAY · 02 NOVEMBER 2026 &nbsp;/&nbsp; FIELD RECORD 01
              </span>
              <h1 className="text-2xl sm:text-[28px] font-bold text-gray-900 tracking-tight mt-0.5">
                Fleet overview
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                A clear view of your {metrics.totalVehicles} vehicles across Bengaluru.
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
              <button className="rounded-lg border border-gray-200/90 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer">
                Export report
              </button>
            </div>
          </div>

          {/* ========================================= */}
          {/* 3. TOP KPI CARDS (4 Columns)              */}
          {/* ========================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Vehicles in motion */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-gray-500">Vehicles in motion</span>
                
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-gray-900">{metrics.vehiclesInMotion}</span>
                  <span className="text-xs text-gray-400">of {metrics.totalVehicles} vehicles</span>
                </div>
                <div className="text-[11px] font-medium text-emerald-700 mt-1">
                  ↑ 2 since 9:00 AM
                </div>
              </div>
            </div>

            {/* Card 2: Parked / idle */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-gray-500">Parked / idle</span>
               
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-gray-900">{metrics.parkedVehicles}</span>
                  <span className="text-xs text-gray-400">vehicles currently parked</span>
                </div>
                <div className="text-[11px] text-gray-400 mt-1">
                  4 at depot
                </div>
              </div>
            </div>

            {/* Card 3: Needs attention */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-gray-500">Needs attention</span>
                
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-gray-900">{metrics.openAlerts}</span>
                  <span className="text-xs text-gray-400">open fleet alerts</span>
                </div>
                <div className="text-[11px] font-medium text-amber-700 mt-1">
                  {metrics.urgentAlerts} urgent · 1 device
                </div>
              </div>
            </div>

            {/* Card 4: Distance today */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-gray-500">Distance today</span>
                
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-gray-900">
                    {metrics.distanceToday.toLocaleString()} km
                  </span>
                  <span className="text-xs text-gray-400">across active trips</span>
                </div>
                <div className="text-[11px] font-medium text-emerald-700 mt-1">
                  ↑ 13% vs yesterday
                </div>
              </div>
            </div>
          </div>

          {/* ========================================= */}
          {/* 4. MIDDLE SECTION: Map + Needs Attention   */}
          {/* ========================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2/3: Live Fleet Map */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Live fleet map</h3>
                  <p className="text-[11px] text-gray-400">Vehicle locations and recent movement</p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Location badge */}
                  <div className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200/70 text-xs font-medium text-gray-600">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Bengaluru, IN</span>
                  </div>

                  {/* Vehicle Filter Selector */}
                  <select
                    value={vehicleFilter}
                    onChange={(e) => setVehicleFilter(e.target.value as "all" | "moving" | "idle" | "offline")}
                    className="rounded-lg border border-gray-200/70 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 focus:outline-none focus:border-[#11382b] cursor-pointer"
                  >
                    <option value="all">All vehicles</option>
                    <option value="moving">Moving only</option>
                    <option value="idle">Parked only</option>
                    <option value="offline">Offline only</option>
                  </select>

                 
                </div>
              </div>

              {/* Mapbox Canvas Component */}
              <FleetMap
                vehicles={filteredVehicles}
                selectedVehicleId={selectedVehicle?.id}
                onSelectVehicle={(v) => setSelectedVehicle(v)}
              />
            </div>

            {/* Right 1/3: Needs attention alerts widget */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">Needs attention</h3>
                    <span className="rounded-full bg-red-50 text-red-700 border border-red-200/60 px-2 py-0.5 text-[10px] font-bold">
                      {metrics.openAlerts} open
                    </span>
                  </div>
                  <a href="#alerts" className="text-xs font-medium text-[#11382b] hover:underline">
                    view all →
                  </a>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">Prioritized for your review</p>

                {/* Alert list */}
                <div className="mt-4 divide-y divide-gray-100">
                  {alerts.slice(0, 3).map((alert) => {
                    const matchingVehicle =
                      vehicles.find((v) => v.id === alert.vehicle_id || v.registration_number === alert.vehicle?.registration_number) ||
                      (alert.vehicle ? {
                        id: alert.vehicle_id || "v-" + alert.id,
                        registration_number: alert.vehicle.registration_number,
                        manufacturer: alert.vehicle.model?.split(" ")[0] || "Fleet",
                        model: alert.vehicle.model || "Vehicle",
                        vehicle_type: "Commercial Vehicle",
                        status: alert.alert_type === "overspeeding" ? "moving" : "idle",
                        current_speed: alert.alert_type === "overspeeding" ? 72 : 0,
                        fuel_level: 14,
                        battery_level: 80,
                        ignition_on: alert.alert_type === "overspeeding",
                        latitude: 12.9716,
                        longitude: 77.5946,
                        last_seen_at: new Date().toISOString(),
                      } as FleetVehicle : null);

                    return (
                      <div
                        key={alert.id}
                        onClick={() => {
                          if (matchingVehicle) setSelectedVehicle(matchingVehicle);
                        }}
                        title="Click to view vehicle operations details"
                        className="py-3 flex items-start gap-3 hover:bg-gray-50/80 -mx-2 px-2 rounded-lg transition-colors cursor-pointer group"
                      >
                      {/* Icon */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          alert.severity === "high" || alert.severity === "critical"
                            ? "bg-red-50 text-red-600"
                            : alert.alert_type === "offline"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {alert.alert_type === "overspeeding" ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        ) : alert.alert_type === "offline" ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.166a1 1 0 111.414 1.414M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-gray-900 truncate">
                            {alert.title}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono shrink-0">
                            {typeof alert.triggered_at === "string" && alert.triggered_at.includes("T")
                              ? new Date(alert.triggered_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                              : alert.triggered_at}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                          {alert.description}
                        </p>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>

              {/* Review all alerts footer */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <a
                  href="#alerts"
                  className="text-xs font-medium text-[#11382b] hover:underline flex items-center gap-1"
                >
                  <span>Review all alerts</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          </div>

          {/* ========================================= */}
          {/* 5. BOTTOM SECTION: Recent Trips Table     */}
          {/* ========================================= */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Recent trips</h3>
                <p className="text-[11px] text-gray-400">Latest activity across your fleet</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={tripFilter}
                    onChange={(e) => setTripFilter(e.target.value)}
                    className="appearance-none flex items-center gap-1.5 rounded-lg border border-gray-200/80 bg-gray-50 pl-2.5 pr-7 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer focus:outline-none focus:border-[#11382b]"
                  >
                    <option value="all">All trips</option>
                    <option value="ongoing">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">
                    ▾
                  </span>
                </div>
                <button
                  onClick={() => refetch()}
                  title="Refresh trips"
                  className="p-1 rounded-lg border border-gray-200/80 bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="pb-2.5 font-semibold">VEHICLE</th>
                    <th className="pb-2.5 font-semibold">DRIVER</th>
                    <th className="pb-2.5 font-semibold">ROUTE</th>
                    <th className="pb-2.5 font-semibold">DISTANCE</th>
                    <th className="pb-2.5 font-semibold">DURATION</th>
                    <th className="pb-2.5 font-semibold text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {trips.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-xs text-gray-400">
                        No {tripFilter === "all" ? "" : tripFilter} trips recorded.
                      </td>
                    </tr>
                  ) : (
                    trips.map((trip) => {
                      const statusText =
                        trip.status === "ongoing"
                          ? "In progress"
                          : trip.status === "completed"
                          ? "Completed"
                          : trip.status === "cancelled"
                          ? "Cancelled"
                          : trip.status === "scheduled"
                          ? "Scheduled"
                          : "Attention";

                      const statusStyle =
                        trip.status === "ongoing"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                          : trip.status === "completed"
                          ? "bg-gray-50 text-gray-600 border-gray-200/60"
                          : trip.status === "cancelled"
                          ? "bg-red-50 text-red-700 border-red-200/60"
                          : "bg-amber-50 text-amber-700 border-amber-200/60";

                    return (
                      <tr
                        key={trip.id}
                        onClick={() => {
                          const tripVehicleId = (trip as { vehicle_id?: string }).vehicle_id;
                          const matchingVehicle =
                            vehicles.find((v) => v.id === tripVehicleId || v.registration_number === trip.vehicle?.registration_number) ||
                            (trip.vehicle ? {
                              id: tripVehicleId || "trip-v-" + trip.id,
                              registration_number: trip.vehicle.registration_number,
                              manufacturer: trip.vehicle.model?.split(" ")[0] || "Fleet",
                              model: trip.vehicle.model || "Vehicle",
                              vehicle_type: trip.vehicle.vehicle_type || "Commercial Vehicle",
                              status: trip.status === "ongoing" ? "moving" : "idle",
                              current_speed: trip.average_speed || 40,
                              fuel_level: 65,
                              battery_level: 85,
                              ignition_on: trip.status === "ongoing",
                              latitude: 12.9716,
                              longitude: 77.5946,
                              last_seen_at: new Date().toISOString(),
                              driver: trip.driver,
                            } as FleetVehicle : null);

                          if (matchingVehicle) {
                            setSelectedVehicle(matchingVehicle);
                          }
                        }}
                        title="Click to inspect vehicle operational diagnostics"
                        className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                      >
                        {/* Vehicle */}
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h8m-8 5h8m-8 5h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                              </svg>
                            </div>
                            <div>
                              <span className="font-bold text-xs text-gray-900 block leading-tight">
                                {trip.vehicle?.registration_number || "KA 03 MN 4821"}
                              </span>
                              <span className="text-[11px] text-gray-400 block leading-tight mt-0.5">
                                {trip.vehicle?.model || "Tata Ace"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Driver */}
                        <td className="py-3 text-gray-700">
                          {trip.driver?.full_name || "Unassigned"}
                        </td>

                        {/* Route */}
                        <td className="py-3 text-gray-700 font-medium">
                          <div className="flex items-center gap-1.5">
                            <span>{trip.start_location}</span>
                            <span className="text-gray-400">→</span>
                            <span>{trip.end_location}</span>
                          </div>
                        </td>

                        {/* Distance */}
                        <td className="py-3 font-mono text-gray-600">
                          {trip.distance_km} km
                        </td>

                        {/* Duration */}
                        <td className="py-3 font-mono text-gray-600">
                          {Math.round((trip.distance_km / (trip.average_speed || 40)) * 60)} min
                        </td>

                        {/* Status */}
                        <td className="py-3 text-right">
                          <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusStyle}`}>
                            {statusText}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Vehicle Detail Slide-over Drawer for Operations Manager */}
      <VehicleDetailDrawer
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onViewOnMap={(v) => {
          setSelectedVehicle(v);
        }}
      />
    </div>
  );
}
