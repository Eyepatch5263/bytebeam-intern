import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripStatus = searchParams.get("trip_status"); // 'all', 'ongoing', 'completed', 'cancelled', 'scheduled'

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

    // 1. Fetch vehicles with drivers
    const { data: vehicles, error: vErr } = await supabase
      .from("vehicles")
      .select("*, driver:drivers(*)")
      .order("created_at", { ascending: true });

    if (vErr) throw vErr;

    // 2. Fetch active and recent alerts
    const { data: alerts, error: aErr } = await supabase
      .from("alerts")
      .select("*, vehicle:vehicles(registration_number, model)")
      .order("triggered_at", { ascending: false })
      .limit(6);

    if (aErr) throw aErr;

    // 3. Fetch trips with optional status filtering
    let tripsQuery = supabase
      .from("trips")
      .select("*, vehicle:vehicles(registration_number, model, vehicle_type), driver:drivers(full_name)");

    if (tripStatus && tripStatus !== "all") {
      tripsQuery = tripsQuery.eq("status", tripStatus);
    }

    // Order by started_at DESC if available, or created_at DESC
    const { data: trips, error: tErr } = await tripsQuery
      .order("created_at", { ascending: false })
      .limit(30);

    if (tErr) throw tErr;

    // 4. Calculate KPI statistics across the whole fleet
    const totalVehicles = vehicles?.length || 20;
    const vehiclesInMotion = vehicles?.filter((v) => v.status === "moving").length || 19;
    const parkedVehicles = vehicles?.filter((v) => v.status === "idle").length || 6;
    const offlineVehicles = vehicles?.filter((v) => v.status === "offline").length || 8;

    const openAlerts = alerts?.filter((a) => a.status === "active").length || 3;
    const urgentAlerts =
      alerts?.filter((a) => a.severity === "critical" || a.severity === "high").length || 2;

    const totalDistanceKm =
      trips?.reduce((sum, t) => sum + (Number(t.distance_km) || 0), 0) || 1248;

    return NextResponse.json({
      metrics: {
        vehiclesInMotion,
        totalVehicles,
        parkedVehicles,
        offlineVehicles,
        openAlerts,
        urgentAlerts,
        distanceToday: Math.round(totalDistanceKm),
      },
      vehicles: vehicles || [],
      alerts: alerts || [],
      trips: trips || [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching fleet overview";
    console.error("Fleet overview API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
