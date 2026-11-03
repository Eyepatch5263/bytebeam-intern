"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import type { FleetVehicle } from "@/app/hooks/useFleetVehicle";
import AddVehicleModal from "@/components/AddVehicleModal";
import VehicleDetailDrawer from "@/components/VehicleDetailDrawer";

interface VehiclesViewProps {
  user?: User | null | {
    id?: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      role?: string;
    };
  };
}

interface VehicleItem extends FleetVehicle {
  locality?: string;
  needsAttention?: boolean;
  activeAlertCount?: number;
}

export default function VehiclesView({ user }: VehiclesViewProps) {
  const router = useRouter();
  const supabase = createClient();

  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [drivers, setDrivers] = useState<{ id: string; full_name: string; license_number: string }[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    inMotion: 0,
    parked: 0,
    attention: 0,
    inMotionPercentage: 0,
  });
  const [statusFilter, setStatusFilter] = useState<"all" | "in_trip" | "parked" | "attention">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastSyncSeconds, setLastSyncSeconds] = useState(0);

  const pageSize = 7;

  const fetchVehicles = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/fleet/vehicles?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load vehicles");
      const json = await res.json();

      setVehicles(json.vehicles || []);
      setDrivers(json.drivers || []);
      if (json.metrics) {
        setMetrics(json.metrics);
      }
      setLastSyncSeconds(0);
    } catch (err) {
      console.error("Vehicles query notice:", err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 25000);
    const ticker = setInterval(() => setLastSyncSeconds((s) => s + 1), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(ticker);
    };
  }, [fetchVehicles]);

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

  // Pagination slice
  const totalPages = Math.ceil(vehicles.length / pageSize) || 1;
  const paginatedVehicles = vehicles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

              {/* Vehicles (ACTIVE on this page) */}
              <button
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold bg-[#eaf4f0] text-[#11382b] transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 text-[#11382b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                onClick={() => router.push("/alerts")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span>Alerts</span>
                </div>
                <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex items-center justify-center">
                  {metrics.attention}
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
      {/* 2. MAIN VEHICLES WORKSPACE                 */}
      {/* ========================================= */}
      <div className="flex-1 pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-gray-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
            <span>Fleet</span>
            <span>/</span>
            <span className="text-gray-800 font-semibold">Vehicles</span>
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
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono font-medium tracking-[0.2em] text-gray-400 uppercase block">
                FLEET &nbsp;/&nbsp; VEHICLE REGISTER
              </span>
              <h1 className="text-2xl sm:text-[28px] font-bold text-gray-900 tracking-tight mt-0.5">
                Vehicles
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Find a vehicle, check its current state, and open its live view.
              </p>
            </div>

            {/* Action buttons matching screenshot */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchQuery("")}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200/90 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Filters</span>
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-[#11382b] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0c2a20] active:scale-[0.99] shadow-xs transition-all cursor-pointer"
              >
                <span className="text-sm leading-none">+</span>
                <span>Add vehicle</span>
              </button>
            </div>
          </div>

          {/* ========================================= */}
          {/* 3. METRIC CARDS (4 Columns)               */}
          {/* ========================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Fleet size */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs">
              <span className="text-xs font-medium text-gray-500 block">Fleet size</span>
              <div className="mt-2 flex items-baseline gap-1.5">
                {isLoading ? (
                  <div className="h-7 w-12 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <>
                    <span className="text-2xl font-bold text-gray-900">{metrics.total}</span>
                    <span className="text-xs text-gray-400">registered vehicles</span>
                  </>
                )}
              </div>
            </div>

            {/* Card 2: In motion */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs">
              <span className="text-xs font-medium text-gray-500 block">In motion</span>
              <div className="mt-2 flex items-baseline gap-1.5">
                {isLoading ? (
                  <div className="h-7 w-12 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <>
                    <span className="text-2xl font-bold text-gray-900">{metrics.inMotion}</span>
                    <span className="text-xs text-gray-400">{metrics.inMotionPercentage}% of fleet</span>
                  </>
                )}
              </div>
            </div>

            {/* Card 3: Parked */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs">
              <span className="text-xs font-medium text-gray-500 block">Parked</span>
              <div className="mt-2 flex items-baseline gap-1.5">
                {isLoading ? (
                  <div className="h-7 w-12 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <>
                    <span className="text-2xl font-bold text-gray-900">{metrics.parked}</span>
                    <span className="text-xs text-gray-400">vehicles currently parked</span>
                  </>
                )}
              </div>
            </div>

            {/* Card 4: Attention needed */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs">
              <span className="text-xs font-medium text-gray-500 block">Attention needed</span>
              <div className="mt-2 flex items-baseline gap-1.5">
                {isLoading ? (
                  <div className="h-7 w-10 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <>
                    <span className="text-2xl font-bold text-gray-900">{metrics.attention}</span>
                    <span className="text-xs text-gray-400">open alerts</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ========================================= */}
          {/* 4. VEHICLES REGISTER TABLE & FILTER BAR    */}
          {/* ========================================= */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
              {/* Left Search & Status Pills */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search registration or driver..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-56 pl-7 pr-3 py-1 text-xs rounded-lg border border-gray-200 bg-gray-50/50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#11382b]"
                  />
                  <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      statusFilter === "all"
                        ? "bg-[#eaf4f0] text-[#11382b] font-semibold"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    All {metrics.total}
                  </button>
                  <button
                    onClick={() => setStatusFilter("in_trip")}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      statusFilter === "in_trip"
                        ? "bg-[#eaf4f0] text-[#11382b] font-semibold"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    In trip {metrics.inMotion}
                  </button>
                  <button
                    onClick={() => setStatusFilter("parked")}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      statusFilter === "parked"
                        ? "bg-[#eaf4f0] text-[#11382b] font-semibold"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    Parked {metrics.parked}
                  </button>
                  <button
                    onClick={() => setStatusFilter("attention")}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      statusFilter === "attention"
                        ? "bg-[#eaf4f0] text-[#11382b] font-semibold"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    Attention {metrics.attention}
                  </button>
                </div>
              </div>

              {/* Right Update Indicator */}
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <span>Updated just now</span>
                <button
                  onClick={fetchVehicles}
                  title="Refresh table"
                  className="p-1 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer"
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
                  <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/30">
                    <th className="py-3 px-5 font-semibold">VEHICLE</th>
                    <th className="py-3 px-5 font-semibold">DRIVER</th>
                    <th className="py-3 px-5 font-semibold">STATUS</th>
                    <th className="py-3 px-5 font-semibold">LAST KNOWN LOCATION</th>
                    <th className="py-3 px-5 font-semibold">SPEED</th>
                    <th className="py-3 px-5 font-semibold">FUEL</th>
                    <th className="py-3 px-5 font-semibold">LAST SEEN</th>
                    <th className="py-3 px-5 text-right font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-gray-100 shrink-0" />
                            <div className="space-y-1.5">
                              <div className="h-3 w-24 bg-gray-200 rounded" />
                              <div className="h-2.5 w-32 bg-gray-100 rounded" />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5"><div className="h-3 w-28 bg-gray-100 rounded" /></td>
                        <td className="py-3.5 px-5"><div className="h-5 w-16 bg-gray-100 rounded-full" /></td>
                        <td className="py-3.5 px-5"><div className="h-3 w-32 bg-gray-100 rounded" /></td>
                        <td className="py-3.5 px-5"><div className="h-3 w-16 bg-gray-100 rounded" /></td>
                        <td className="py-3.5 px-5"><div className="h-3 w-12 bg-gray-100 rounded" /></td>
                        <td className="py-3.5 px-5"><div className="h-3 w-16 bg-gray-100 rounded" /></td>
                        <td className="py-3.5 px-5 text-right"><div className="h-3 w-4 bg-gray-100 rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : paginatedVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-gray-400">
                        No vehicles match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedVehicles.map((vehicle) => {
                      const isMoving = vehicle.status === "moving";
                      const isIdle = vehicle.status === "idle";
                      const isOffline = vehicle.status === "offline";

                      const statusBadge = isMoving ? (
                        <span className="inline-block rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 text-[11px] font-semibold">
                          In trip
                        </span>
                      ) : isIdle ? (
                        <span className="inline-block rounded-full bg-gray-100 text-gray-600 border border-gray-200/60 px-2.5 py-0.5 text-[11px] font-medium">
                          Parked
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-0.5 text-[11px] font-medium">
                          Offline
                        </span>
                      );

                      const speedDisplay = isMoving ? `${vehicle.current_speed || 42} km/h` : "—";
                      const fuelDisplay = vehicle.fuel_level ? `${vehicle.fuel_level}%` : vehicle.battery_level ? `${vehicle.battery_level}%` : "—";

                      return (
                        <tr
                          key={vehicle.id}
                          onClick={() => setSelectedVehicle(vehicle)}
                          className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                        >
                          {/* Vehicle */}
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 group-hover:text-[#11382b] flex items-center justify-center shrink-0 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h8m-8 5h8m-8 5h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                                </svg>
                              </div>
                              <div>
                                <span className="font-bold text-xs text-gray-900 block leading-tight">
                                  {vehicle.registration_number}
                                </span>
                                <span className="text-[11px] text-gray-400 block leading-tight mt-0.5">
                                  {vehicle.manufacturer} {vehicle.model}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Driver */}
                          <td className="py-3.5 px-5 text-gray-700 font-medium">
                            {vehicle.driver?.full_name || "Unassigned"}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-5">{statusBadge}</td>

                          {/* Last known location */}
                          <td className="py-3.5 px-5 text-gray-600 font-medium">
                            {vehicle.locality || "Bengaluru Metro"}
                          </td>

                          {/* Speed */}
                          <td className="py-3.5 px-5 font-mono text-gray-600">
                            {speedDisplay}
                          </td>

                          {/* Fuel */}
                          <td className="py-3.5 px-5 font-mono text-gray-600">
                            {fuelDisplay}
                          </td>

                          {/* Last seen */}
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-600 font-mono">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isMoving ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                                }`}
                              />
                              <span>
                                {isMoving
                                  ? "Now"
                                  : new Date(vehicle.last_seen_at).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-5 text-right text-gray-400 group-hover:text-gray-700">
                            <span>···</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-white">
              <span>
                Showing {Math.min(vehicles.length, paginatedVehicles.length)} of {metrics.total} vehicles
              </span>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium transition-colors cursor-pointer ${
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
                  className="px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onVehicleAdded={fetchVehicles}
        drivers={drivers}
      />

      {/* Vehicle Detail Slide-over Drawer */}
      <VehicleDetailDrawer
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onViewOnMap={(v) => {
          router.push(`/?vehicle=${v.id}`);
        }}
      />
    </div>
  );
}
