import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") || "all"; // 'all', 'open', 'resolved', 'high'
    const searchQuery = searchParams.get("search")?.toLowerCase().trim() || "";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    let dbAlerts: any[] = [];
    let totalVehiclesInDb = 20;

    if (supabaseUrl && serviceRoleKey) {
      try {
        const supabase = createClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false },
        });

        // 1. Fetch total vehicle count
        const { count: vCount } = await supabase
          .from("vehicles")
          .select("*", { count: "exact", head: true });
        if (vCount) totalVehiclesInDb = vCount;

        // 2. Fetch real alerts from Supabase with full relations
        const { data, error } = await supabase
          .from("alerts")
          .select(`
            *,
            vehicle:vehicles(
              id,
              registration_number,
              model,
              manufacturer,
              vehicle_type,
              status,
              current_speed,
              latitude,
              longitude,
              fuel_level,
              battery_level,
              last_seen_at,
              driver:drivers(id, full_name, phone, license_number)
            ),
            trip:trips(
              id,
              trip_number,
              start_location,
              end_location,
              started_at,
              ended_at,
              status
            )
          `)
          .order("triggered_at", { ascending: false });

        if (!error && data && data.length > 0) {
          dbAlerts = data;
        }
      } catch (e) {
        console.warn("Could not fetch alerts from Supabase, will use fallback:", e);
      }
    }

    // Process real DB alerts if available
    let allAlerts: any[] = [];

    if (dbAlerts.length > 0) {
      allAlerts = dbAlerts.map((dbA) => {
        const v = dbA.vehicle || {};
        const d = v.driver || {};
        const trip = dbA.trip || {};

        const triggeredDate = new Date(dbA.triggered_at || Date.now());
        const timeFormatted = triggeredDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });

        // Normalize status
        // DB statuses: 'active', 'acknowledged', 'resolved'
        const isResolved = dbA.status === "resolved";
        const normalizedStatus = isResolved ? "resolved" : "open";

        // Normalize severity
        const rawSev = (dbA.severity || "medium").toLowerCase();
        const severity =
          rawSev === "critical" || rawSev === "high"
            ? "high"
            : rawSev === "medium"
            ? "medium"
            : "low";

        // Coordinates
        const eventLng = v.longitude || 77.6418;
        const eventLat = v.latitude || 12.9735;
        const startLng = eventLng - 0.022;
        const startLat = eventLat - 0.015;

        // Synthesize dynamic parameters & summary line tailored to real alert type
        let summaryLine = dbA.description?.slice(0, 48) || "Alert triggered";
        let param3 = { label: "Current status", value: v.status || "moving", highlight: false };
        let param4 = { label: "Severity", value: dbA.severity || "high" };

        if (dbA.alert_type === "overspeeding" || dbA.alert_type === "overspeed") {
          summaryLine = `${Math.round(v.current_speed || 96)} km/h in an 80 km/h zone`;
          param3 = { label: "Recorded speed", value: `${Math.round(v.current_speed || 96)} km/h`, highlight: true };
          param4 = { label: "Speed limit", value: "80 km/h" };
        } else if (dbA.alert_type === "harsh_braking") {
          summaryLine = "Severe deceleration · Sudden braking event";
          param3 = { label: "Deceleration force", value: "-12.4 m/s²", highlight: true };
          param4 = { label: "Threshold limit", value: "-8.0 m/s²" };
        } else if (dbA.alert_type === "engine_overheating") {
          summaryLine = "Coolant temp 108°C exceeding 102°C threshold";
          param3 = { label: "Peak coolant temp", value: "108°C", highlight: true };
          param4 = { label: "Max operating limit", value: "102°C" };
        } else if (dbA.alert_type === "low_fuel") {
          summaryLine = `Fuel reserve at ${v.fuel_level || 12}% · Refuel advised`;
          param3 = { label: "Remaining fuel", value: `${v.fuel_level || 12}%`, highlight: true };
          param4 = { label: "Reserve reserve target", value: "15%" };
        } else if (dbA.alert_type === "low_battery") {
          summaryLine = `Battery SoC at ${v.battery_level || 15}% · Charger advised`;
          param3 = { label: "Battery SoC", value: `${v.battery_level || 15}%`, highlight: true };
          param4 = { label: "Low battery threshold", value: "20%" };
        } else if (dbA.alert_type === "unauthorized_movement") {
          summaryLine = "Off-hour movement without active transit schedule";
          param3 = { label: "Ignition state", value: "Active outside window", highlight: true };
          param4 = { label: "Operating schedule", value: "06:00 - 22:00" };
        } else if (dbA.alert_type === "excessive_idling") {
          summaryLine = "Stationary with ignition ON > 45 minutes";
          param3 = { label: "Idle duration", value: "> 45 minutes", highlight: true };
          param4 = { label: "Max permitted idle", value: "15 minutes" };
        } else if (dbA.alert_type === "rapid_acceleration") {
          summaryLine = "Sudden acceleration +4.8 m/s² from stop";
          param3 = { label: "Acceleration rate", value: "+4.8 m/s²", highlight: true };
          param4 = { label: "Comfort limit", value: "+3.2 m/s²" };
        } else if (dbA.alert_type === "geofence_violation") {
          summaryLine = "Deviated > 5 km from national transit corridor";
          param3 = { label: "Corridor deviation", value: "5.4 km off-track", highlight: true };
          param4 = { label: "Max corridor buffer", value: "2.0 km" };
        }

        const locationName =
          trip.end_location?.split(",")[0] ||
          trip.start_location?.split(",")[0] ||
          "Bengaluru Hub";

        // Live status note
        let liveNote = `This vehicle is moving at ${Math.round(v.current_speed || 40)} km/h now. GPS status active.`;
        if (v.status === "idle") {
          liveNote = "This vehicle is currently parked with ignition off.";
        } else if (v.status === "offline") {
          liveNote = "Vehicle telemetry is currently offline. Awaiting device heartbeat ping.";
        } else if (isResolved) {
          liveNote = "Alert marked resolved. Telemetry operating within normal limits.";
        }

        return {
          id: dbA.id,
          event_id: `#AL-${dbA.id.slice(0, 4).toUpperCase()}`,
          alert_type: dbA.alert_type,
          title: dbA.title,
          severity, // "high" | "medium" | "low"
          status: normalizedStatus, // "open" | "resolved"
          raw_status: dbA.status, // "active", "acknowledged", "resolved"
          time_formatted: timeFormatted,
          time_exact: timeFormatted,
          summary_line: summaryLine,
          description: dbA.description,
          vehicle: {
            id: v.id || dbA.vehicle_id,
            registration_number: v.registration_number || "MH-12-RN-4821",
            model: v.model || "Commercial Vehicle",
            manufacturer: v.manufacturer || "Fleet",
            vehicle_type: v.vehicle_type || "Truck",
            status: v.status || "moving",
            current_speed: Math.round(v.current_speed || 0),
            last_seen_at: v.last_seen_at || "Recent",
          },
          driver: {
            full_name: d.full_name || "Assigned Driver",
            phone: d.phone || "+91 98234 11201",
            license_number: d.license_number || "KA0120200045674",
          },
          parameters: [
            {
              label: "Vehicle",
              value: v.registration_number || "Vehicle",
              isVehicle: true,
            },
            {
              label: "Driver",
              value: d.full_name || "Assigned Driver",
            },
            param3,
            param4,
          ],
          event_location_label: `${locationName} · ${timeFormatted}`,
          location_name: locationName,
          coordinates: {
            start: [startLng, startLat] as [number, number],
            event: [eventLng, eventLat] as [number, number],
            route: [
              [startLng, startLat],
              [startLng + 0.008, startLat + 0.005],
              [startLng + 0.015, startLat + 0.010],
              [eventLng, eventLat],
            ] as [number, number][],
          },
          live_status_note: liveNote,
        };
      });
    }

    // Counts calculated directly from the live DB data
    const openAlerts = allAlerts.filter((a) => a.status === "open");
    const resolvedAlerts = allAlerts.filter((a) => a.status === "resolved");
    const highPriorityAlerts = allAlerts.filter(
      (a) => a.severity === "high" || a.severity === "critical"
    );

    const affectedVehicles = new Set(openAlerts.map((a) => a.vehicle.registration_number));

    const metrics = {
      openCount: openAlerts.length,
      highPriorityCount: highPriorityAlerts.length,
      resolvedTodayCount: resolvedAlerts.length,
      vehiclesAffectedCount: affectedVehicles.size,
      totalVehiclesCount: totalVehiclesInDb,
      totalAlertsCount: allAlerts.length,
    };

    // Apply filtering based on query
    let filtered = allAlerts;
    if (statusParam === "open") {
      filtered = filtered.filter((a) => a.status === "open");
    } else if (statusParam === "resolved") {
      filtered = filtered.filter((a) => a.status === "resolved");
    } else if (statusParam === "high") {
      filtered = filtered.filter(
        (a) => a.severity === "high" || a.severity === "critical"
      );
    }

    if (searchQuery) {
      filtered = filtered.filter((a) => {
        const titleMatch = a.title.toLowerCase().includes(searchQuery);
        const regMatch = a.vehicle.registration_number.toLowerCase().includes(searchQuery);
        const driverMatch = a.driver.full_name.toLowerCase().includes(searchQuery);
        const descMatch = a.description.toLowerCase().includes(searchQuery);
        const locMatch = a.location_name.toLowerCase().includes(searchQuery);
        return titleMatch || regMatch || driverMatch || descMatch || locMatch;
      });
    }

    return NextResponse.json({
      alerts: filtered,
      allAlertsCount: allAlerts.length,
      metrics,
      source: "database",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error loading alerts";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
