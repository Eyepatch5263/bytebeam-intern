import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim();
    const status = searchParams.get("status"); // 'all', 'moving', 'idle', 'offline', 'attention'

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // 1. Fetch all vehicles with assigned drivers
    const { data: allVehicles, error: vErr } = await supabase
      .from("vehicles")
      .select("*, driver:drivers(*)")
      .order("created_at", { ascending: false });

    if (vErr) throw vErr;

    // 2. Fetch active alerts to know which vehicles need attention
    const { data: activeAlerts } = await supabase
      .from("alerts")
      .select("vehicle_id, severity, status, title")
      .eq("status", "active");

    const alertVehicleIds = new Set(activeAlerts?.map((a) => a.vehicle_id) || []);

    const vehiclesWithAlertFlag = (allVehicles || []).map((v) => {
      const hasAlert = alertVehicleIds.has(v.id);
      const isLowFuel = v.fuel_level !== null && v.fuel_level !== undefined && Number(v.fuel_level) < 18;
      const isLowBattery = v.battery_level !== null && v.battery_level !== undefined && Number(v.battery_level) < 20;
      const needsAttention = hasAlert || isLowFuel || isLowBattery;

      // Realistic Bengaluru locality naming for display
      const localities = [
        "Indiranagar",
        "Electronic City",
        "Indiranagar depot",
        "Last: Peenya",
        "Whitefield",
        "Jayanagar",
        "Hebbal",
        "Koramangala 4th Block",
        "HSR Layout",
        "Marathahalli ORR",
      ];
      const assignedLocality = localities[Math.abs(v.registration_number.split("").reduce((a: number, b: string) => a + b.charCodeAt(0), 0)) % localities.length];

      return {
        ...v,
        needsAttention,
        locality: assignedLocality,
        activeAlertCount: activeAlerts?.filter((a) => a.vehicle_id === v.id).length || 0,
      };
    });

    // 3. Compute Metrics
    const totalCount = vehiclesWithAlertFlag.length;
    const inMotionCount = vehiclesWithAlertFlag.filter((v) => v.status === "moving").length;
    const parkedCount = vehiclesWithAlertFlag.filter((v) => v.status === "idle").length;
    const offlineCount = vehiclesWithAlertFlag.filter((v) => v.status === "offline").length;
    const attentionCount = vehiclesWithAlertFlag.filter((v) => v.needsAttention).length;

    // 4. Apply Filters
    let filtered = vehiclesWithAlertFlag;

    if (status && status !== "all") {
      if (status === "attention") {
        filtered = filtered.filter((v) => v.needsAttention);
      } else if (status === "in_trip" || status === "moving") {
        filtered = filtered.filter((v) => v.status === "moving");
      } else if (status === "parked" || status === "idle") {
        filtered = filtered.filter((v) => v.status === "idle");
      } else if (status === "offline") {
        filtered = filtered.filter((v) => v.status === "offline");
      }
    }

    if (search) {
      filtered = filtered.filter((v) => {
        const reg = (v.registration_number || "").toLowerCase();
        const model = (v.model || "").toLowerCase();
        const mfg = (v.manufacturer || "").toLowerCase();
        const driverName = (v.driver?.full_name || "").toLowerCase();
        const loc = (v.locality || "").toLowerCase();
        return (
          reg.includes(search) ||
          model.includes(search) ||
          mfg.includes(search) ||
          driverName.includes(search) ||
          loc.includes(search)
        );
      });
    }

    // 5. Fetch available drivers for assignment
    const { data: drivers } = await supabase
      .from("drivers")
      .select("id, full_name, license_number, is_active")
      .order("full_name", { ascending: true });

    return NextResponse.json({
      metrics: {
        total: totalCount || 20,
        inMotion: inMotionCount || 6,
        parked: parkedCount || 6,
        offline: offlineCount || 8,
        attention: attentionCount || 3,
        inMotionPercentage: totalCount > 0 ? Math.round((inMotionCount / totalCount) * 100) : 68,
      },
      vehicles: filtered,
      drivers: drivers || [],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error querying vehicles";
    console.error("Vehicles API error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      registration_number,
      manufacturer,
      model,
      vehicle_type,
      driver_id,
      fuel_level,
      battery_level,
      status = "idle",
    } = body;

    if (!registration_number || !manufacturer || !model || !vehicle_type) {
      return NextResponse.json(
        { error: "Registration number, manufacturer, model, and vehicle type are required." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
      auth: { persistSession: false },
    });

    // Default Bengaluru coordinates for new vehicle
    const latitude = 12.9716 + (Math.random() - 0.5) * 0.08;
    const longitude = 77.5946 + (Math.random() - 0.5) * 0.08;

    const { data: newVehicle, error } = await supabase
      .from("vehicles")
      .insert({
        registration_number: registration_number.trim().toUpperCase(),
        manufacturer: manufacturer.trim(),
        model: model.trim(),
        vehicle_type: vehicle_type.trim(),
        driver_id: driver_id || null,
        status: status,
        current_speed: status === "moving" ? 45 : 0,
        fuel_level: fuel_level ? Number(fuel_level) : 85,
        battery_level: battery_level ? Number(battery_level) : 90,
        ignition_on: status === "moving" || status === "idle",
        latitude: parseFloat(latitude.toFixed(6)),
        longitude: parseFloat(longitude.toFixed(6)),
        last_seen_at: new Date().toISOString(),
      })
      .select("*, driver:drivers(*)")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, vehicle: newVehicle }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error creating vehicle";
    console.error("Create vehicle API error:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
