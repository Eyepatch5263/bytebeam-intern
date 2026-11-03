"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import SelectedAlertMap from "@/components/SelectedAlertMap";
import VehicleDetailDrawer from "@/components/VehicleDetailDrawer";
import type { FleetVehicle } from "@/app/hooks/useFleetVehicle";

interface AlertParameter {
  label: string;
  value: string;
  highlight?: boolean;
  isVehicle?: boolean;
}

interface AlertItem {
  id: string;
  event_id: string;
  alert_type: string;
  title: string;
  severity: "high" | "critical" | "medium" | "low";
  status: "open" | "resolved" | "active" | "acknowledged";
  time_formatted: string;
  time_exact: string;
  summary_line: string;
  description: string;
  vehicle: {
    id: string;
    registration_number: string;
    model: string;
    vehicle_type: string;
    status: string;
    current_speed: number;
    last_seen_at: string;
  };
  driver: {
    full_name: string;
    phone?: string;
  };
  parameters: AlertParameter[];
  event_location_label: string;
  location_name: string;
  coordinates: {
    start: [number, number];
    event: [number, number];
    route?: [number, number][];
  };
  live_status_note: string;
}

export default function AlertsView() {
  const router = useRouter();
  const supabase = createClient();

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [metrics, setMetrics] = useState({
    openCount: 0,
    highPriorityCount: 0,
    resolvedTodayCount: 0,
    vehiclesAffectedCount: 0,
    totalVehiclesCount: 0,
    totalAlertsCount: 0,
  });

  const [filterTab, setFilterTab] = useState<"all" | "open" | "resolved" | "high">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Vehicle Detail Drawer state
  const [inspectVehicle, setInspectVehicle] = useState<FleetVehicle | null>(null);

  // Fetch alerts from API
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterTab !== "all") params.set("status", filterTab);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/fleet/alerts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load alerts");
      const json = await res.json();

      if (json.alerts) {
        setAlerts(json.alerts);
        if (json.metrics) setMetrics(json.metrics);
        setSelectedAlertId((currentId) => {
          if (currentId && json.alerts.some((a: any) => a.id === currentId)) {
            return currentId;
          }
          return json.alerts[0]?.id || null;
        });
      } else {
        setAlerts([]);
      }
    } catch (err) {
      console.error("Failed to load alerts:", err);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [filterTab, searchQuery]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Handle Mark reviewed / Acknowledge alert
  const handleMarkReviewed = async (alertId: string) => {
    try {
      setActionLoading(true);

      // Optimistically update status to resolved
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? {
                ...a,
                status: "resolved",
                live_status_note:
                  "Alert marked as reviewed by operations manager. Event closed.",
              }
            : a
        )
      );

      setMetrics((m) => ({
        ...m,
        openCount: Math.max(0, m.openCount - 1),
        resolvedTodayCount: m.resolvedTodayCount + 1,
      }));

      setToastMessage("Alert marked as reviewed.");
      setTimeout(() => setToastMessage(null), 3000);

      // Persist to API
      await fetch(`/api/fleet/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      }).catch((e) => console.warn("Supabase update error:", e));
    } catch (err) {
      console.error("Failed to mark alert reviewed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Selected Alert Object
  const selectedAlert = useMemo(() => {
    if (!alerts.length) return null;
    return alerts.find((a) => a.id === selectedAlertId) || alerts[0] || null;
  }, [alerts, selectedAlertId]);

  // Filtered Alert List based on active tab and search
  const displayedAlerts = useMemo(() => {
    let list = alerts;

    if (filterTab === "open") {
      list = list.filter((a) => a.status === "open" || a.status === "active");
    } else if (filterTab === "resolved") {
      list = list.filter((a) => a.status === "resolved" || a.status === "acknowledged");
    } else if (filterTab === "high") {
      list = list.filter((a) => a.severity === "high" || a.severity === "critical");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.vehicle.registration_number.toLowerCase().includes(q) ||
          a.driver.full_name.toLowerCase().includes(q) ||
          a.summary_line.toLowerCase().includes(q) ||
          a.location_name.toLowerCase().includes(q)
      );
    }

    return list;
  }, [alerts, filterTab, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Event ID",
      "Title",
      "Severity",
      "Status",
      "Vehicle",
      "Driver",
      "Location",
      "Time",
      "Summary",
    ];
    const rows = alerts.map((a) => [
      a.event_id,
      `"${a.title}"`,
      a.severity,
      a.status,
      a.vehicle.registration_number,
      `"${a.driver.full_name}"`,
      `"${a.location_name}"`,
      a.time_formatted,
      `"${a.summary_line}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fleet-alerts-log-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] flex font-sans antialiased text-gray-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#11382b] text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 border border-emerald-500/20 animate-fade-in">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Left Sidebar Navigation matching screenshot */}
      <aside className="w-60 bg-white border-r border-gray-200/90 hidden md:flex flex-col justify-between shrink-0 select-none">
        <div>
          {/* Brand Logo */}
          <div className="p-5 pb-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#11382b] flex items-center justify-center text-white shadow-xs">
              <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-gray-900 tracking-tight text-sm block">bytebeam</span>
              <span className="text-[9.5px] font-semibold text-gray-400 uppercase tracking-wider block -mt-1 font-mono">
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

          {/* Navigation Section */}
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

              {/* Alerts (ACTIVE TAB) */}
              <button
                onClick={() => setFilterTab("all")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold bg-[#eaf4f0] text-[#11382b] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-[#11382b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span>Alerts</span>
                </div>
                {loading ? (
                  <span className="w-4 h-4 rounded-full bg-gray-200 animate-pulse" />
                ) : (
                  <span className="text-[10px] font-bold text-red-600 bg-red-100/80 px-1.5 py-0.5 rounded-full font-mono">
                    {metrics.openCount}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Help Card & Profile */}
        <div>
          <div className="p-3 mx-3 mb-3 bg-linear-to-br from-emerald-50/50 to-gray-50 border border-emerald-100/60 rounded-xl">
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
                PP
              </div>
              <div className="leading-tight">
                <span className="text-xs font-semibold text-gray-800 block">Pratyush Pragyey</span>
                <span className="text-[10px] text-gray-400 block">Operations manager</span>
              </div>
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
              }}
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

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-14 bg-white border-b border-gray-200/80 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-sans">
            <span className="hover:text-gray-700 cursor-pointer" onClick={() => router.push("/")}>
              Fleet
            </span>
            <span className="text-gray-300">/</span>
            <span className="font-semibold text-gray-900">Alerts</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative">
              <svg className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search vehicles, trips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-12 py-1.5 w-60 text-xs rounded-lg border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#11382b] focus:border-[#11382b] transition-all"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-mono bg-white px-1 rounded border border-gray-200">
                ⌘K
              </span>
            </div>

            {/* Sync Pill */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px]">Last sync: just now</span>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => setFilterTab("open")}
              title="Open alerts"
              className="relative p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {metrics.openCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>

            {/* User Avatar */}
            <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-xs font-bold text-amber-800">
              PP
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Section Heading & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-emerald-800/80 block">
                FLEET / EXCEPTIONS
              </span>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">Alerts</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Review the signals that need an operator&apos;s attention.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Date Filter Pill */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 shadow-2xs">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Today</span>
              </div>

              {/* Export Log Button */}
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Export log</span>
              </button>
            </div>
          </div>

          {/* 3 Top Metric KPI Cards with Skeleton Loading */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Open alerts */}
            <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-2xs">
              <span className="text-xs text-gray-500 font-medium block">Open alerts</span>
              {loading ? (
                <div className="flex items-baseline gap-2 mt-2 animate-pulse">
                  <div className="h-7 w-12 bg-gray-200 rounded" />
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                </div>
              ) : (
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-gray-900">{metrics.openCount}</span>
                  <span className="text-xs text-red-600 font-medium">{metrics.highPriorityCount} high priority</span>
                </div>
              )}
            </div>

            {/* Resolved today */}
            <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-2xs">
              <span className="text-xs text-gray-500 font-medium block">Resolved today</span>
              {loading ? (
                <div className="flex items-baseline gap-2 mt-2 animate-pulse">
                  <div className="h-7 w-12 bg-gray-200 rounded" />
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                </div>
              ) : (
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-gray-900">{metrics.resolvedTodayCount}</span>
                  <span className="text-xs text-gray-400">across the fleet</span>
                </div>
              )}
            </div>

            {/* Vehicles affected */}
            <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-2xs">
              <span className="text-xs text-gray-500 font-medium block">Vehicles affected</span>
              {loading ? (
                <div className="flex items-baseline gap-2 mt-2 animate-pulse">
                  <div className="h-7 w-12 bg-gray-200 rounded" />
                  <div className="h-3 w-28 bg-gray-100 rounded" />
                </div>
              ) : (
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-gray-900">{metrics.vehiclesAffectedCount}</span>
                  <span className="text-xs text-gray-400">out of {metrics.totalVehiclesCount} vehicles</span>
                </div>
              )}
            </div>
          </div>

          {/* 2-Column Split: Alert Queue (Left) & Alert Inspector Detail (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 6.5 Cols: Alert Queue */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 tracking-tight">
                    {loading ? "Alert queue" : `Alert queue · ${metrics.openCount} open`}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Sorted by severity, then most recent.
                  </p>
                </div>
                <button
                  onClick={fetchAlerts}
                  title="Refresh alerts"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              {/* Filter Pills matching screenshot */}
              <div className="px-4 sm:px-5 py-3 border-b border-gray-100 flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setFilterTab("all")}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    filterTab === "all"
                      ? "bg-[#eaf4f0] text-[#11382b] font-semibold border border-emerald-200/60"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80"
                  }`}
                >
                  All alerts {loading ? "" : metrics.totalAlertsCount}
                </button>
                <button
                  onClick={() => setFilterTab("open")}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    filterTab === "open"
                      ? "bg-[#eaf4f0] text-[#11382b] font-semibold border border-emerald-200/60"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80"
                  }`}
                >
                  Open {loading ? "" : metrics.openCount}
                </button>
                <button
                  onClick={() => setFilterTab("resolved")}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    filterTab === "resolved"
                      ? "bg-[#eaf4f0] text-[#11382b] font-semibold border border-emerald-200/60"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80"
                  }`}
                >
                  Resolved {loading ? "" : metrics.resolvedTodayCount}
                </button>
                <button
                  onClick={() => setFilterTab("high")}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    filterTab === "high"
                      ? "bg-[#eaf4f0] text-[#11382b] font-semibold border border-emerald-200/60"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80"
                  }`}
                >
                  High priority {loading ? "" : metrics.highPriorityCount}
                </button>
              </div>

              {/* Alert List with Loading Skeleton */}
              <div className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="p-4 sm:p-5 flex items-start gap-3.5 animate-pulse">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-40 bg-gray-200 rounded" />
                        <div className="h-2.5 w-56 bg-gray-100 rounded" />
                        <div className="h-2 w-28 bg-gray-100 rounded" />
                      </div>
                      <div className="h-3 w-12 bg-gray-200 rounded" />
                    </div>
                  ))
                ) : displayedAlerts.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs">
                    No alerts match the selected criteria.
                  </div>
                ) : (
                  displayedAlerts.map((alert) => {
                    const isSelected = selectedAlert && alert.id === selectedAlert.id;
                    const isOpen = alert.status === "open" || alert.status === "active";
                    const isHigh = alert.severity === "high" || alert.severity === "critical";
                    const isMedium = alert.severity === "medium";

                    return (
                      <div
                        key={alert.id}
                        onClick={() => setSelectedAlertId(alert.id)}
                        className={`p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-[#f4f9f6] border-l-4 border-[#11382b]"
                            : "hover:bg-gray-50/80 border-l-4 border-transparent"
                        }`}
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          {/* Alert Icon based on type */}
                          <div className="shrink-0 mt-0.5">
                            {alert.alert_type === "overspeed" || alert.alert_type === "overspeeding" ? (
                              <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              </div>
                            ) : alert.alert_type === "offline" || alert.alert_type === "unauthorized_movement" ? (
                              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-2.828-6.364m0 0a9 9 0 012.828-6.364M8.464 15.536a5 5 0 01-1.414-3.536m0 0a5 5 0 011.414-3.536" />
                                </svg>
                              </div>
                            ) : alert.alert_type === "fuel_low" || alert.alert_type === "low_fuel" ? (
                              <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                              </div>
                            ) : alert.alert_type === "harsh_braking" ? (
                              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                </svg>
                              </div>
                            ) : alert.alert_type === "long_idle" || alert.alert_type === "excessive_idling" ? (
                              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Alert Info */}
                          <div className="min-w-0">
                            <h3 className="text-xs font-bold text-gray-900 tracking-tight leading-tight">
                              {alert.title}
                            </h3>
                            <p className="text-[11px] text-gray-600 mt-0.5 font-medium">
                              {alert.vehicle.registration_number} · {alert.driver.full_name}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              {alert.summary_line}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1 font-mono">
                              {alert.time_formatted} ·{" "}
                              <span className={isOpen ? "text-gray-600 font-semibold" : "text-gray-400"}>
                                {isOpen ? "Open" : "Resolved"}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Right: Severity Badge & Chevron */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-xs font-semibold ${
                              isHigh
                                ? "text-red-600"
                                : isMedium
                                ? "text-amber-600"
                                : "text-gray-400"
                            }`}
                          >
                            {isHigh ? "High" : isMedium ? "Medium" : "Low"}
                          </span>
                          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right 5.5 Cols: Selected Alert Inspector Detail */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden p-5 space-y-4">
              {loading ? (
                /* Skeleton Loader for Inspector while fetching */
                <div className="space-y-4 animate-pulse">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="space-y-1.5">
                      <div className="h-2.5 w-24 bg-gray-200 rounded" />
                      <div className="h-2 w-16 bg-gray-100 rounded" />
                    </div>
                    <div className="h-5 w-20 bg-gray-200 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-40 bg-gray-200 rounded" />
                    <div className="h-3 w-full bg-gray-100 rounded" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 py-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-1">
                        <div className="h-2 w-14 bg-gray-100 rounded" />
                        <div className="h-3 w-24 bg-gray-200 rounded" />
                      </div>
                    ))}
                  </div>
                  <div className="w-full h-64 sm:h-72 rounded-xl bg-gray-100 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>LOADING EVENT ROUTE...</span>
                    </div>
                  </div>
                </div>
              ) : selectedAlert ? (
                <>
                  {/* Header: Alert Detail & Priority Badge */}
                  <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-gray-400 block">
                        ALERT DETAIL · {selectedAlert.time_exact}
                      </span>
                      <span className="text-xs text-gray-400 mt-0.5 block font-mono">
                        Event ID {selectedAlert.event_id}
                      </span>
                    </div>

                    <div>
                      {selectedAlert.severity === "high" || selectedAlert.severity === "critical" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-600 border border-red-100">
                          High priority
                        </span>
                      ) : selectedAlert.severity === "medium" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                          Medium priority
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-50 text-gray-600 border border-gray-200">
                          Standard priority
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title and Event Description */}
                  <div>
                    <h3 className="text-base font-bold text-gray-900 tracking-tight">
                      {selectedAlert.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {selectedAlert.description}
                    </p>
                  </div>

                  {/* 4 Parameter Breakdown Grid */}
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-1 pb-1 text-xs">
                    {selectedAlert.parameters.map((param, idx) => (
                      <div key={idx}>
                        <span className="text-[10.5px] text-gray-400 font-medium block">
                          {param.label}
                        </span>
                        {param.isVehicle ? (
                          <button
                            onClick={() => {
                              setInspectVehicle({
                                id: selectedAlert.vehicle.id || "v-alert",
                                registration_number: selectedAlert.vehicle.registration_number,
                                manufacturer: selectedAlert.vehicle.model.split(" ")[0],
                                model: selectedAlert.vehicle.model,
                                vehicle_type: selectedAlert.vehicle.vehicle_type,
                                status: selectedAlert.vehicle.status === "moving" ? "moving" : "idle",
                                current_speed: selectedAlert.vehicle.current_speed,
                                driver: {
                                  full_name: selectedAlert.driver.full_name,
                                  phone: selectedAlert.driver.phone || "+91 98450 12345",
                                  license_number: "KA0120200045674",
                                },
                                last_seen_at: selectedAlert.vehicle.last_seen_at,
                                latitude: selectedAlert.coordinates.event[1],
                                longitude: selectedAlert.coordinates.event[0],
                                ignition_on: selectedAlert.vehicle.status === "moving",
                                fuel_level: 64,
                                battery_level: 88,
                              });
                            }}
                            className="font-bold text-gray-900 hover:text-[#11382b] hover:underline cursor-pointer block mt-0.5"
                          >
                            {param.value}
                          </button>
                        ) : (
                          <span
                            className={`font-semibold block mt-0.5 ${
                              param.highlight ? "text-red-600 font-bold" : "text-gray-900"
                            }`}
                          >
                            {param.value}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Interactive Route & Event Mapbox Map */}
                  <div className="pt-1">
                    <SelectedAlertMap
                      eventLocationLabel={selectedAlert.event_location_label}
                      locationName={selectedAlert.location_name}
                      coordinates={selectedAlert.coordinates}
                    />
                  </div>

                  {/* Status Note & Action Footer */}
                  <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-[11px] text-gray-500 leading-snug">
                      {selectedAlert.live_status_note}
                    </p>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Mark reviewed action */}
                      <button
                        onClick={() => handleMarkReviewed(selectedAlert.id)}
                        disabled={actionLoading || selectedAlert.status === "resolved"}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                          selectedAlert.status === "resolved"
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-[#115e4a] hover:bg-[#0d4a3a] text-white"
                        }`}
                      >
                        {selectedAlert.status === "resolved" ? "Reviewed" : "Mark reviewed"}
                      </button>

                      {/* Open Vehicle Profile */}
                      <button
                        onClick={() => {
                          if (selectedAlert.vehicle.id) {
                            router.push(`/vehicles/${selectedAlert.vehicle.id}`);
                          } else {
                            router.push("/vehicles");
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
                      >
                        <span>Open vehicle profile</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-xs text-gray-400">
                  No alert selected.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

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
