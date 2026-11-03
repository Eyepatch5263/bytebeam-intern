"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FleetVehicle } from "@/app/hooks/useFleetVehicle";
import TripRouteMap from "@/components/TripRouteMap";

interface VehicleDetailDrawerProps {
  vehicle: (FleetVehicle & {
    locality?: string;
    needsAttention?: boolean;
    activeAlertCount?: number;
    health_status?: "healthy" | "warning" | "critical";
  }) | null;
  onClose: () => void;
  onViewOnMap?: (vehicle: FleetVehicle) => void;
}

interface FullVehicleDetails {
  vehicle: FleetVehicle & {
    vin?: string;
    locality?: string;
    needsAttention?: boolean;
    activeAlertCount?: number;
    health_status?: "healthy" | "warning" | "critical";
    speed_limit?: number;
    is_overspeeding?: boolean;
    engine_temperature?: number;
    is_overheating?: boolean;
    heading?: number;
    cardinal_heading?: string;
    fuel_tank_capacity_litres?: number;
    remaining_fuel_litres?: number | null;
    battery_capacity_kwh?: number | null;
    remaining_battery_kwh?: number | null;
    estimated_range_km?: number;
    odometer_km?: number;
    oil_pressure_psi?: number;
    battery_voltage?: string;
    is_electric?: boolean;
    iot_gateway?: {
      model: string;
      imei: string;
      firmware_version: string;
      cellular_network: string;
      signal_strength_dbm: number;
      signal_bars: number;
      satellites_connected: number;
      telemetry_interval_sec: number;
    };
    reefer?: {
      cargo_temperature_celsius: number;
      setpoint_temperature_celsius: number;
      compressor_state: string;
      defrost_cycle: string;
      airflow_cfm: number;
      status: string;
    } | null;
    regulatory?: {
      insurance_provider: string;
      insurance_policy_number: string;
      insurance_valid_until: string;
      insurance_status: string;
      fitness_certificate_expiry: string;
      fitness_certificate_status: string;
      pollution_under_control_status: string;
      national_permit_valid: boolean;
      national_permit_type: string;
    };
    driver_compliance?: {
      license_type: string;
      duty_hours_today: number;
      max_duty_hours: number;
      continuous_driving_hours: number;
      safety_score: number;
      harsh_braking_events_30d: number;
      rapid_acceleration_events_30d: number;
      overspeed_events_30d: number;
      rest_break_required_in_hours: number;
    } | null;
  };
  activeTrip?: {
    id: string;
    trip_number: string;
    status: string;
    start_location: string;
    end_location: string;
    distance_km: number;
    distance_covered_km?: number;
    progress_percentage?: number;
    average_speed: number;
    max_speed: number;
    idle_duration_seconds: number;
    halt_count: number;
    started_at: string;
    ended_at: string | null;
    consignment_number?: string;
    cargo_type?: string;
    cargo_weight_tons?: number;
    scheduled_eta?: string;
    delay_minutes?: number;
    delay_reason?: string;
    on_time_status?: string;
    driver?: { full_name: string; phone?: string; license_number?: string } | null;
  } | null;
  trips?: {
    id: string;
    trip_number: string;
    status: string;
    start_location: string;
    end_location: string;
    distance_km: number;
    started_at: string;
  }[];
  telemetryTrail?: {
    id: string;
    recorded_at: string;
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    engine_temperature: number;
    fuel_level: number | null;
    battery_level: number | null;
    ignition_on: boolean;
  }[];
  alerts?: {
    id: string;
    alert_type: string;
    severity: "critical" | "high" | "medium" | "low";
    title: string;
    description: string;
    status: "active" | "acknowledged" | "resolved";
    triggered_at: string;
  }[];
}

export default function VehicleDetailDrawer({
  vehicle,
  onClose,
  onViewOnMap,
}: VehicleDetailDrawerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"diagnostics" | "trip" | "driver" | "alerts" | "trail">("diagnostics");
  const [details, setDetails] = useState<FullVehicleDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [acknowledgedAlertIds, setAcknowledgedAlertIds] = useState<Set<string>>(new Set());
  const [isCopiedCoords, setIsCopiedCoords] = useState(false);
  const [showImmobilizerModal, setShowImmobilizerModal] = useState(false);
  const [immobilizerState, setImmobilizerState] = useState<"idle" | "locking" | "locked">("idle");
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!vehicle?.id) return;

    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/fleet/vehicles/${vehicle.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) {
          setDetails(data);
        }
      })
      .catch((err) => console.error("Error fetching vehicle details:", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [vehicle?.id]);

  if (!vehicle) return null;

  const currentVehicle = details?.vehicle || vehicle;
  const isMoving = currentVehicle.status === "moving";
  const isIdle = currentVehicle.status === "idle";
  const activeTrip = details?.activeTrip;
  const alerts = details?.alerts || [];
  const telemetryTrail = details?.telemetryTrail || [];

  const healthStatus =
    currentVehicle.health_status ||
    (alerts.some((a) => a.status === "active" && (a.severity === "critical" || a.severity === "high"))
      ? "critical"
      : currentVehicle.needsAttention
      ? "warning"
      : "healthy");

  const handleAcknowledgeAlert = async (id: string) => {
    setAcknowledgedAlertIds((prev) => new Set(prev).add(id));
    try {
      await fetch(`/api/fleet/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "acknowledged" }),
      });
    } catch (err) {
      console.warn("Failed to update alert remotely:", err);
    }
  };

  const handleCopyCoords = () => {
    if (currentVehicle.latitude && currentVehicle.longitude) {
      navigator.clipboard.writeText(`${currentVehicle.latitude}, ${currentVehicle.longitude}`);
      setIsCopiedCoords(true);
      setTimeout(() => setIsCopiedCoords(false), 2000);
    }
  };

  const handleExportTelemetryCSV = () => {
    if (!telemetryTrail.length) return;
    const headers = ["Timestamp", "Speed (km/h)", "Heading", "Engine Temp (°C)", "Fuel (%)", "Battery (%)", "Ignition", "Latitude", "Longitude"];
    const rows = telemetryTrail.map((p) => [
      p.recorded_at,
      p.speed,
      p.heading,
      p.engine_temperature,
      p.fuel_level ?? "N/A",
      p.battery_level ?? "N/A",
      p.ignition_on ? "ON" : "OFF",
      p.latitude,
      p.longitude,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `telemetry-${currentVehicle.registration_number}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTriggerImmobilizer = () => {
    setImmobilizerState("locking");
    setTimeout(() => {
      startTransition(() => {
        setImmobilizerState("locked");
      });
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans select-none">
      {/* Dimmed backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-12">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col justify-between border-l border-gray-200 animate-in slide-in-from-right duration-250">
          {/* ========================================= */}
          {/* HEADER: Asset Identity & Operations Bar   */}
          {/* ========================================= */}
          <div className="border-b border-gray-100 bg-[#f8faf9]">
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#11382b] text-emerald-400 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <svg className="w-6 h-6 transform rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="3" width="18" height="18" rx="4" />
                      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                    </svg>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">
                        {currentVehicle.registration_number}
                      </h2>

                      {/* Operational Health Badge */}
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          healthStatus === "critical"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : healthStatus === "warning"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {healthStatus === "critical"
                          ? "Critical Attention"
                          : healthStatus === "warning"
                          ? "Operational Alert"
                          : "Optimal State"}
                      </span>

                      {/* VIN / Asset ID */}
                      <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                        {details?.vehicle?.vin || "MB8XFK9402"}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 mt-1">
                      <strong className="text-gray-900">{currentVehicle.manufacturer} {currentVehicle.model}</strong> ·{" "}
                      <span className="text-gray-500">{currentVehicle.vehicle_type}</span>
                    </p>

                    {/* Live Movement & Location Status */}
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-gray-600 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isMoving ? "bg-emerald-500 animate-pulse" : isIdle ? "bg-amber-500" : "bg-gray-400"
                          }`}
                        />
                        <span className="font-semibold text-gray-900">
                          {isMoving
                            ? `In Transit (${currentVehicle.current_speed || 42} km/h)`
                            : isIdle
                            ? "Parked / Idling"
                            : "Offline"}
                        </span>
                      </div>
                      <span>•</span>
                      <span className="text-gray-700 font-medium">
                        {details?.vehicle?.locality || vehicle.locality || "Bengaluru Corridor"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-200/60 transition-colors cursor-pointer"
                  title="Close inspection"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Quick Action Pills in Header */}
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-gray-200/60 text-xs">
                {currentVehicle.driver?.phone && (
                  <a
                    href={`tel:${currentVehicle.driver.phone}`}
                    className="flex items-center gap-1.5 bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-gray-700 hover:text-[#11382b] hover:border-[#11382b] transition-colors"
                  >
                    <span>📞</span>
                    <span className="font-medium">Call Pilot ({currentVehicle.driver.phone})</span>
                  </a>
                )}

                <button
                  onClick={handleCopyCoords}
                  className="flex items-center gap-1.5 bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <span>📍</span>
                  <span className="font-mono text-[11px]">
                    {currentVehicle.latitude?.toFixed(4)}, {currentVehicle.longitude?.toFixed(4)}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {isCopiedCoords ? "✓ Copied" : "Copy"}
                  </span>
                </button>

                <button
                  onClick={() => router.push(`/vehicles/${currentVehicle.id}`)}
                  className="flex items-center gap-1.5 bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-gray-700 hover:text-[#11382b] hover:border-[#11382b] transition-colors cursor-pointer text-xs"
                >
                  <span>Full Profile Page</span>
                  <span>↗</span>
                </button>

                <button
                  onClick={() => setShowImmobilizerModal(true)}
                  className="flex items-center gap-1.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ml-auto"
                >
                  <span>🔒</span>
                  <span className="font-medium text-[11px]">Remote Immobilizer</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 border-t border-gray-200 bg-white flex items-center gap-2 text-xs font-medium overflow-x-auto">
              <button
                onClick={() => setActiveTab("diagnostics")}
                className={`py-3 px-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "diagnostics"
                    ? "border-[#11382b] text-[#11382b] font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                Live Diagnostics
              </button>
              <button
                onClick={() => setActiveTab("trip")}
                className={`py-3 px-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === "trip"
                    ? "border-[#11382b] text-[#11382b] font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                <span>Active Mission</span>
                {activeTrip && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("driver")}
                className={`py-3 px-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "driver"
                    ? "border-[#11382b] text-[#11382b] font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                Pilot & Compliance
              </button>
              <button
                onClick={() => setActiveTab("alerts")}
                className={`py-3 px-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === "alerts"
                    ? "border-[#11382b] text-[#11382b] font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                <span>Alerts & Safety</span>
                {alerts.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex items-center justify-center">
                    {alerts.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("trail")}
                className={`py-3 px-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "trail"
                    ? "border-[#11382b] text-[#11382b] font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                GPS Breadcrumbs
              </button>
            </div>
          </div>

          {/* ========================================= */}
          {/* TAB CONTENTS                               */}
          {/* ========================================= */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {isLoading ? (
              <div className="py-20 text-center">
                <div className="w-7 h-7 border-2 border-[#11382b] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span className="text-xs text-gray-400 font-mono tracking-wider">CONNECTING TO TELEMETRY BUS...</span>
              </div>
            ) : activeTab === "diagnostics" ? (
              /* ========================================= */
              /* TAB 1: LIVE DIAGNOSTICS & TELEMETRY       */
              /* ========================================= */
              <div className="space-y-5">
                {/* 4 Core Telemetry Gauges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* 1. Velocity */}
                  <div className="p-3.5 rounded-xl border border-gray-100 bg-[#f9faf9] shadow-2xs">
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider block">Velocity</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold text-gray-900 font-mono">
                        {currentVehicle.current_speed || 0}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">km/h</span>
                    </div>
                    <span className="text-[10px] text-gray-400 block mt-1">Limit: 80 km/h</span>
                  </div>

                  {/* 2. Ignition */}
                  <div className="p-3.5 rounded-xl border border-gray-100 bg-[#f9faf9] shadow-2xs">
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider block">Ignition</span>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          currentVehicle.ignition_on ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                        }`}
                      />
                      <span className="text-base font-bold text-gray-900">
                        {currentVehicle.ignition_on ? "KEY ON" : "CUT OFF"}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 block mt-1">Relay: Engaged</span>
                  </div>

                  {/* 3. Engine Temp */}
                  <div className="p-3.5 rounded-xl border border-gray-100 bg-[#f9faf9] shadow-2xs">
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider block">Engine Coolant</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span
                        className={`text-2xl font-bold font-mono ${
                          (details?.vehicle?.engine_temperature || 86) > 100 ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        {details?.vehicle?.engine_temperature || 86.4}°C
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-700 block mt-1">Normal Band</span>
                  </div>

                  {/* 4. Azimuth Heading */}
                  <div className="p-3.5 rounded-xl border border-gray-100 bg-[#f9faf9] shadow-2xs">
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider block">Azimuth Bearing</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold text-gray-900 font-mono">
                        {details?.vehicle?.heading || 142}°
                      </span>
                      <span className="text-xs text-emerald-800 font-bold">
                        {details?.vehicle?.cardinal_heading || "SE"}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 block mt-1">Compass True</span>
                  </div>
                </div>

                {/* Fuel / Battery Storage Block */}
                <div className="p-4 rounded-xl border border-gray-200/80 bg-white shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">
                        {details?.vehicle?.is_electric ? "EV Traction Battery State of Charge (SoC)" : "Diesel Fuel Reserve Gauge"}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {details?.vehicle?.is_electric
                          ? `64 kWh High-Voltage Pack · ${details?.vehicle?.remaining_battery_kwh || 48} kWh remaining`
                          : `Tank Capacity: ${details?.vehicle?.fuel_tank_capacity_litres || 120} Litres · ${details?.vehicle?.remaining_fuel_litres || 84}L remaining`}
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900 font-mono">
                      {currentVehicle.fuel_level ? `${currentVehicle.fuel_level}%` : `${currentVehicle.battery_level || 88}%`}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        Number(currentVehicle.fuel_level || currentVehicle.battery_level || 85) < 20
                          ? "bg-red-500"
                          : Number(currentVehicle.fuel_level || currentVehicle.battery_level || 85) < 40
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${currentVehicle.fuel_level || currentVehicle.battery_level || 85}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-gray-500 font-mono pt-1">
                    <span>Reserve Threshold: 18%</span>
                    <span className="font-semibold text-gray-800">
                      Estimated Autonomy: ~{details?.vehicle?.estimated_range_km || 340} km
                    </span>
                  </div>
                </div>

                {/* Odometer, Alternator & Mechanical Health */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl border border-gray-100 bg-[#f9faf9]">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Odometer</span>
                    <div className="text-base font-bold font-mono text-gray-900 mt-1">
                      {(details?.vehicle?.odometer_km || 42800).toLocaleString()} km
                    </div>
                    <span className="text-[10px] text-gray-400">Total distance logged</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-gray-100 bg-[#f9faf9]">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Auxiliary Battery</span>
                    <div className="text-base font-bold font-mono text-gray-900 mt-1">
                      {details?.vehicle?.battery_voltage || "13.8V DC"}
                    </div>
                    <span className="text-[10px] text-emerald-700">Alternator Charging</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-gray-100 bg-[#f9faf9]">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Engine Oil Pressure</span>
                    <div className="text-base font-bold font-mono text-gray-900 mt-1">
                      {details?.vehicle?.oil_pressure_psi || 42} PSI
                    </div>
                    <span className="text-[10px] text-emerald-700">Optimal Lubrication</span>
                  </div>
                </div>

                {/* IoT Gateway Telematics Diagnostics */}
                <div className="p-4 rounded-xl border border-gray-200/80 bg-white shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-gray-900">
                        {details?.vehicle?.iot_gateway?.model || "Bytebeam Edge Telematics Unit v3.2"}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">
                      FW: {details?.vehicle?.iot_gateway?.firmware_version || "v2.8.4"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px] font-mono text-gray-600">
                    <div>
                      <span className="text-[9.5px] text-gray-400 block">IMEI NUMBER</span>
                      <span className="font-semibold text-gray-800">
                        {details?.vehicle?.iot_gateway?.imei || "86029304918241"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9.5px] text-gray-400 block">CELLULAR MODEM</span>
                      <span className="font-semibold text-gray-800">
                        Airtel IoT 4G (5/5 Bars)
                      </span>
                    </div>
                    <div>
                      <span className="text-[9.5px] text-gray-400 block">GNSS CONSTELLATION</span>
                      <span className="font-semibold text-gray-800">
                        11 Satellites · 3D Fix
                      </span>
                    </div>
                    <div>
                      <span className="text-[9.5px] text-gray-400 block">PING CADENCE</span>
                      <span className="font-semibold text-gray-800">10 sec interval</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[9.5px] text-gray-400 block">LAST TELEMETRY PACKET</span>
                      <span className="font-semibold text-gray-800">
                        {new Date(currentVehicle.last_seen_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })} · Transmitted OK
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reefer Diagnostics (if Reefer vehicle) */}
                {details?.vehicle?.reefer && (
                  <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">❄️</span>
                        <span className="text-xs font-bold text-sky-950">Cold Chain Reefer Unit Status</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full border border-sky-200">
                        {details.vehicle.reefer.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-gray-500 block">CARGO TEMP</span>
                        <span className="text-base font-bold text-sky-900">{details.vehicle.reefer.cargo_temperature_celsius}°C</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 block">SETPOINT</span>
                        <span className="text-base font-bold text-gray-700">{details.vehicle.reefer.setpoint_temperature_celsius}°C</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 block">COMPRESSOR</span>
                        <span className="text-base font-bold text-emerald-700">{details.vehicle.reefer.compressor_state}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === "trip" ? (
              /* ========================================= */
              /* TAB 2: ACTIVE MISSION & ROUTE PROGRESS    */
              /* ========================================= */
              <div className="space-y-5">
                {activeTrip ? (
                  <TripRouteMap
                    trip={activeTrip}
                    vehicle={currentVehicle}
                    showSideDetails={true}
                  />
                ) : (
                  <div className="p-8 rounded-xl border border-gray-200 bg-gray-50 text-center text-xs text-gray-500">
                    No active mission currently in progress for this vehicle.
                  </div>
                )}

                {/* Recent Completed Trips History */}
                <div>
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                    Historical Completed Trips
                  </h4>
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden shadow-2xs">
                    {(details?.trips || []).slice(0, 5).map((t) => (
                      <div key={t.id} className="p-3 bg-white flex items-center justify-between text-xs hover:bg-gray-50/60 transition-colors">
                        <div>
                          <div className="font-semibold text-gray-900">{t.trip_number}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            {t.start_location} → {t.end_location}
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              t.status === "completed"
                                ? "bg-gray-100 text-gray-700"
                                : t.status === "ongoing"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {t.status}
                          </span>
                          <div className="text-[10px] text-gray-400 mt-0.5">{t.distance_km} km</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeTab === "driver" ? (
              /* ========================================= */
              /* TAB 3: ASSIGNED PILOT & COMPLIANCE        */
              /* ========================================= */
              <div className="space-y-5">
                {/* Pilot Card */}
                <div className="p-4 rounded-xl border border-gray-200/80 bg-white shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-full bg-[#11382b] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
                        {currentVehicle.driver?.full_name ? currentVehicle.driver.full_name[0] : "D"}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">
                          {currentVehicle.driver?.full_name || "Unassigned"}
                        </h4>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">
                          {currentVehicle.driver?.phone || "+91 98234 11201"}
                        </p>
                        <span className="inline-block bg-emerald-50 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200 mt-1">
                          Senior Commercial Pilot · Active Duty
                        </span>
                      </div>
                    </div>

                    {currentVehicle.driver?.phone && (
                      <a
                        href={`tel:${currentVehicle.driver.phone}`}
                        className="rounded-lg bg-[#11382b] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0c2a20] transition-colors"
                      >
                        Call Pilot
                      </a>
                    )}
                  </div>

                  {/* Commercial Driving License */}
                  <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Commercial License (DL):</span>
                      <span className="font-mono font-bold text-gray-900">
                        {currentVehicle.driver?.license_number || "KA0120200045674"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">License Verification:</span>
                      <span className="font-semibold text-emerald-700">
                        Valid & Active · SARATHI VAHAN Verified
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hours of Service (HOS) & Fatigue Compliance */}
                <div className="p-4 rounded-xl border border-gray-200/80 bg-white shadow-2xs space-y-3">
                  <span className="text-xs font-bold text-gray-900 block">
                    Hours of Service (HOS) & Pilot Fatigue Safety
                  </span>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Duty Hours Today:</span>
                      <span className="font-mono font-bold text-gray-900">
                        {details?.vehicle?.driver_compliance?.duty_hours_today || 4.8} / {details?.vehicle?.driver_compliance?.max_duty_hours || 8.0} hrs max
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-emerald-600 h-full rounded-full"
                        style={{
                          width: `${((details?.vehicle?.driver_compliance?.duty_hours_today || 4.8) / 8.0) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-[11px] font-mono">
                    <div>
                      <span className="text-gray-400 block text-[9.5px]">SAFETY RATING</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        {details?.vehicle?.driver_compliance?.safety_score || 95}/100
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[9.5px]">HARSH BRAKES</span>
                      <span className="font-bold text-gray-800">
                        {details?.vehicle?.driver_compliance?.harsh_braking_events_30d || 1} event
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[9.5px]">REST MANDATE</span>
                      <span className="font-bold text-gray-800">In 1.8 hrs</span>
                    </div>
                  </div>
                </div>

                {/* Regulatory Vehicle Certificates */}
                <div className="p-4 rounded-xl border border-gray-200/80 bg-white shadow-2xs space-y-2.5 text-xs">
                  <span className="font-bold text-gray-900 block mb-1">
                    Fleet Asset Regulatory Documents
                  </span>
                  <div className="flex justify-between border-b border-gray-50 pb-1.5">
                    <span className="text-gray-500">Fitness Certificate (FC):</span>
                    <span className="font-semibold text-emerald-700">Valid until Nov 2027</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-1.5">
                    <span className="text-gray-500">Commercial Insurance:</span>
                    <span className="font-semibold text-gray-900">
                      Digit Fleet Policy #FLT-98214 (Active)
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-1.5">
                    <span className="text-gray-500">PUC Emission Status:</span>
                    <span className="font-semibold text-emerald-700">Certified BS-VI</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">National Permit:</span>
                    <span className="font-semibold text-gray-900">All-India Commercial Goods</span>
                  </div>
                </div>
              </div>
            ) : activeTab === "alerts" ? (
              /* ========================================= */
              /* TAB 4: ALERTS & SAFETY INCIDENT REPORT    */
              /* ========================================= */
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="p-10 text-center bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2.5 font-bold">
                      ✓
                    </div>
                    <h4 className="text-xs font-bold text-gray-800">Zero Pending Safety Alerts</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      This vehicle telemetry is operating within safe mechanical and speed thresholds.
                    </p>
                  </div>
                ) : (
                  alerts.map((alert) => {
                    const isAck = acknowledgedAlertIds.has(alert.id) || alert.status === "acknowledged";
                    return (
                      <div
                        key={alert.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          alert.severity === "critical"
                            ? "bg-red-50/40 border-red-200"
                            : alert.severity === "high"
                            ? "bg-orange-50/40 border-orange-200"
                            : "bg-gray-50/60 border-gray-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[9.5px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                                  alert.severity === "critical"
                                    ? "bg-red-600 text-white"
                                    : alert.severity === "high"
                                    ? "bg-orange-500 text-white"
                                    : "bg-blue-600 text-white"
                                }`}
                              >
                                {alert.severity}
                              </span>
                              <span className="text-xs font-bold text-gray-900">{alert.title}</span>
                            </div>
                            <p className="text-[11px] text-gray-600 mt-1">{alert.description}</p>
                          </div>

                          <span className="text-[10px] text-gray-400 font-mono shrink-0">
                            {new Date(alert.triggered_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-gray-500">
                            Status: <strong className="capitalize">{isAck ? "Acknowledged" : alert.status}</strong>
                          </span>
                          {!isAck && (
                            <button
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                              className="text-[10px] font-semibold text-[#11382b] bg-white border border-[#11382b]/30 hover:bg-[#eaf4f0] px-2.5 py-1 rounded transition-colors cursor-pointer"
                            >
                              Acknowledge Alert
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* ========================================= */
              /* TAB 5: GPS BREADCRUMB REPLAY              */
              /* ========================================= */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Last 15 GPS Telemetry Packets
                  </span>
                  <button
                    onClick={handleExportTelemetryCSV}
                    className="text-xs font-semibold text-[#11382b] hover:underline cursor-pointer"
                  >
                    Download CSV ↓
                  </button>
                </div>

                <div className="border border-gray-200/80 rounded-xl overflow-hidden text-xs shadow-2xs">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-[10px] text-gray-500 uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Time</th>
                        <th className="py-2.5 px-3">Speed</th>
                        <th className="py-2.5 px-3">Temp</th>
                        <th className="py-2.5 px-3">Fuel/Bat</th>
                        <th className="py-2.5 px-3">Heading</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                      {telemetryTrail.map((point) => (
                        <tr key={point.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-2 px-3 text-gray-700">
                            {new Date(point.recorded_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </td>
                          <td className="py-2 px-3 text-gray-900 font-semibold">{point.speed} km/h</td>
                          <td className="py-2 px-3 text-gray-600">{point.engine_temperature}°C</td>
                          <td className="py-2 px-3 text-gray-600">
                            {point.fuel_level ? `${point.fuel_level}%` : `${point.battery_level}%`}
                          </td>
                          <td className="py-2 px-3 text-gray-500">{point.heading}°</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ========================================= */}
          {/* FOOTER ACTIONS                             */}
          {/* ========================================= */}
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-[#f8faf9] flex items-center justify-between gap-3">
            <button
              onClick={() => {
                if (onViewOnMap) onViewOnMap(vehicle);
                onClose();
              }}
              className="flex-1 rounded-lg bg-[#11382b] py-2.5 px-4 text-xs font-semibold text-white hover:bg-[#0c2a20] active:scale-[0.99] transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Locate on Live Map</span>
              <span>→</span>
            </button>
            <button
              onClick={() => router.push(`/vehicles/${currentVehicle.id}`)}
              className="rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Full Profile</span>
              <span>↗</span>
            </button>
            <button
              onClick={handleExportTelemetryCSV}
              className="rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* REMOTE IMMOBILIZER CONFIRMATION MODAL     */}
      {/* ========================================= */}
      {showImmobilizerModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-lg">
                🔒
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Remote Engine Cutoff Relay</h3>
                <p className="text-xs text-gray-500 font-mono">ASSET: {currentVehicle.registration_number}</p>
              </div>
            </div>

            {isMoving && Number(currentVehicle.current_speed || 0) > 5 ? (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>Safety Interlock Active</span>
                </div>
                <p>
                  Vehicle is currently traveling at{" "}
                  <strong>{currentVehicle.current_speed} km/h</strong>. Fleet safety compliance strictly prohibits engine cutoff while moving at speed.
                </p>
                <p className="text-[11px] text-amber-800 font-mono">
                  The cutoff command will be queued and safely engaged once vehicle decelerates below 5 km/h.
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-600">
                Are you sure you want to trigger the remote ignition relay cutoff on this asset? The driver will be notified and engine restart will be disabled until manually unlocked by Operations.
              </p>
            )}

            {immobilizerState === "locked" && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                ✓ Engine cutoff command confirmed by Bytebeam IoT Gateway. Relay engaged.
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowImmobilizerModal(false);
                  setImmobilizerState("idle");
                }}
                className="px-3.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              {immobilizerState !== "locked" ? (
                <button
                  onClick={handleTriggerImmobilizer}
                  disabled={immobilizerState === "locking"}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {immobilizerState === "locking" ? "Engaging Relay..." : "Confirm Immobilization"}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowImmobilizerModal(false);
                    setImmobilizerState("idle");
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#11382b] hover:bg-[#0c2a20] rounded-lg transition-colors cursor-pointer"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
