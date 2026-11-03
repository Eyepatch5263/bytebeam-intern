"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { FleetVehicle } from "@/app/hooks/useFleetVehicle";
import TripRouteMap from "@/components/TripRouteMap";

interface VehicleProfileViewProps {
  vehicleId: string;
}

export default function VehicleProfileView({ vehicleId }: VehicleProfileViewProps) {
  const router = useRouter();
  const supabase = createClient();

  const [vehicle, setVehicle] = useState<(FleetVehicle & { locality?: string; speed_limit?: number }) | null>(null);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncSeconds, setSyncSeconds] = useState(28);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/fleet/vehicles/${vehicleId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) {
          setVehicle(data.vehicle);
          setActiveTrip(data.activeTrip);
          setTrips(data.trips || []);
        }
      })
      .catch((err) => console.error("Error loading vehicle profile:", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    const ticker = setInterval(() => setSyncSeconds((s) => s + 1), 1000);

    return () => {
      isMounted = false;
      clearInterval(ticker);
    };
  }, [vehicleId]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  };

  const displayName = "Pratyush Pragyey";
  const userRole = "Operations manager";
  const initials = "PP";

  const isMoving = vehicle?.status === "moving";
  const isIdle = vehicle?.status === "idle";

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
              <button
                onClick={() => router.push("/")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>Overview</span>
              </button>

              <button
                onClick={() => router.push("/vehicles")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold bg-[#eaf4f0] text-[#11382b] transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 text-[#11382b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h8m-8 5h8m-8 5h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                </svg>
                <span>Vehicles</span>
              </button>

              <button
                onClick={() => router.push("/trips")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>Trips</span>
              </button>

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
      {/* 2. MAIN VEHICLE PROFILE WORKSPACE         */}
      {/* ========================================= */}
      <div className="flex-1 pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-gray-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
            <span>Fleet</span>
            <span>/</span>
            <span className="text-gray-800 font-semibold">{vehicle?.registration_number || "KA 03 MN 4821"}</span>
          </div>

          <div className="flex items-center gap-4">
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

            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono text-gray-500">
                Last sync: {syncSeconds} sec ago
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
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="space-y-2">
                <div className="h-2.5 w-36 bg-gray-200 rounded" />
                <div className="h-8 w-64 bg-gray-200 rounded" />
                <div className="h-3 w-80 bg-gray-100 rounded" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-gray-50 rounded-xl border border-gray-200/80 p-4 h-20" />
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-200/80 p-6 h-80 flex items-center justify-center">
                <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>LOADING VEHICLE PROFILE...</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Breadcrumbs & Title */}
              <div>
                <span className="text-[10px] font-mono font-medium tracking-[0.2em] text-gray-400 uppercase block">
                  FLEET &nbsp;/&nbsp; VEHICLES &nbsp;/&nbsp; VEHICLE PROFILE
                </span>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                  <div className="flex items-center gap-3.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl sm:text-[28px] font-bold text-gray-900 tracking-tight leading-tight">
                          {vehicle?.registration_number || "Vehicle"}
                        </h1>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px] uppercase tracking-wider">
                          {isMoving ? "In trip" : isIdle ? "Parked" : "Offline"}
                        </span>
                        <span>·</span>
                        <span>{vehicle?.manufacturer} {vehicle?.model}</span>
                        <span>·</span>
                        <span>{vehicle?.driver?.full_name || "Assigned Driver"}</span>
                        <span>·</span>
                        <span className="text-emerald-700 font-medium">Device online</span>
                      </div>
                    </div>
                  </div>

              {/* Action buttons matching screenshot */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push("/trips")}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200/90 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>View trip history</span>
                </button>

                <button
                  title="More actions"
                  className="rounded-lg border border-gray-200/90 bg-white p-2 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
                >
                  ···
                </button>
              </div>
            </div>
          </div>

          {/* ========================================= */}
          {/* 3. FOUR TOP METRIC CARDS                  */}
          {/* ========================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Last seen */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs flex items-center gap-3">
              
              <div>
                <span className="text-[11px] text-gray-400 font-medium block">Last seen</span>
                <div className="text-sm font-bold text-gray-900 mt-0.5">
                  Now <span className="text-xs font-normal text-gray-500 font-mono">GPS updated</span>
                </div>
              </div>
            </div>

            {/* Card 2: Current speed */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs flex items-center gap-3">
              
              <div>
                <span className="text-[11px] text-gray-400 font-medium block">Current speed</span>
                <div className="text-sm font-bold text-gray-900 mt-0.5 font-mono">
                  {vehicle?.current_speed || 48} km/h{" "}
                  <span className="text-xs font-normal text-emerald-700 font-sans">Within route limit</span>
                </div>
              </div>
            </div>

            {/* Card 3: Fuel level */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs flex items-center gap-3">
             
              <div>
                <span className="text-[11px] text-gray-400 font-medium block">Fuel level</span>
                <div className="text-sm font-bold text-gray-900 mt-0.5 font-mono">
                  {vehicle?.fuel_level || 64}%{" "}
                  <span className="text-xs font-normal text-gray-500 font-mono">· 186 km range</span>
                </div>
              </div>
            </div>

            {/* Card 4: Ignition */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs flex items-center gap-3">
             
              <div>
                <span className="text-[11px] text-gray-400 font-medium block">Ignition</span>
                <div className="text-sm font-bold text-gray-900 mt-0.5">
                  On <span className="text-xs font-normal text-gray-500">Engine running</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================= */}
          {/* 4. CURRENT TRIP & ROUTE SECTION            */}
          {/* ========================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left 2/3: Live Route Map */}
              <div className="lg:col-span-2">
                <TripRouteMap
                  trip={activeTrip}
                  vehicle={vehicle || ({} as any)}
                  showSideDetails={false}
                />
              </div>

              {/* Right 1/3: Trip Details & Route Timeline */}
              <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Trip details</h3>
                    <span className="text-xs font-medium text-gray-500">
                      Today · 11:16 AM — In progress
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold">
                    Active
                  </span>
                </div>

                {/* Route Headline */}
                <div>
                  <h4 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    <span>{activeTrip?.start_location || "Koramangala"}</span>
                    <span className="text-gray-400 font-light">──</span>
                    <span>{activeTrip?.end_location || "Whitefield"}</span>
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Delivery route · Bengaluru, Karnataka
                  </p>
                </div>

                {/* 4 Metric Boxes (2x2) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-gray-100 bg-[#f9faf9]">
                    <span className="text-[10px] text-gray-400 uppercase font-medium block">Distance travelled</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-xl font-bold font-mono text-gray-900">
                        {activeTrip?.distance_covered_km || 28.4}
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
                        {activeTrip?.average_speed || 39}
                      </span>
                      <span className="text-xs text-gray-500">km/h</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-gray-100 bg-[#f9faf9]">
                    <span className="text-[10px] text-gray-400 uppercase font-medium block">Halt time</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-xl font-bold font-mono text-gray-900">6</span>
                      <span className="text-xs text-gray-500">min</span>
                    </div>
                  </div>
                </div>

                {/* Route Timeline */}
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">
                    Route timeline
                  </span>

                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                    {/* Node 1 */}
                    <div className="relative">
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-emerald-600 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      </div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="text-xs font-bold text-gray-900">Trip started</h5>
                          <p className="text-[11px] text-gray-500 mt-0.5">Koramangala depot</p>
                        </div>
                        <span className="text-[11px] font-mono text-gray-400">11:16 AM</span>
                      </div>
                    </div>

                    {/* Node 2 */}
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

                    {/* Node 3 */}
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
            </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
