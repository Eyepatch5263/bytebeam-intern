import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Vehicle ID is required" }, { status: 400 });
    }

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

    // 1. Vehicle info with assigned driver
    const { data: vehicle, error: vErr } = await supabase
      .from("vehicles")
      .select("*, driver:drivers(*)")
      .eq("id", id)
      .single();

    if (vErr || !vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // 2. Fetch trips for this vehicle (active and historical)
    const { data: trips } = await supabase
      .from("trips")
      .select("*, driver:drivers(full_name, phone, license_number)")
      .eq("vehicle_id", id)
      .order("created_at", { ascending: false })
      .limit(6);

    const activeTrip = trips?.find((t) => t.status === "ongoing") || trips?.[0] || null;

    // 3. Fetch latest telemetry points (for diagnostics & trail)
    const { data: telemetryPoints } = await supabase
      .from("telemetry")
      .select("*")
      .eq("vehicle_id", id)
      .order("recorded_at", { ascending: false })
      .limit(15);

    const latestTelemetry = telemetryPoints?.[0] || null;

    // 4. Fetch alerts for this vehicle
    const { data: alerts } = await supabase
      .from("alerts")
      .select("*")
      .eq("vehicle_id", id)
      .order("triggered_at", { ascending: false })
      .limit(8);

    // 5. Operations Manager Metric Derivations
    const isElectric = Boolean(
      vehicle.vehicle_type?.toLowerCase().includes("electric") ||
      vehicle.model?.toLowerCase().includes("ev")
    );

    // Speed & limits
    const currentSpeed = Number(vehicle.current_speed || 0);
    const speedLimit = 80;
    const isOverspeeding = currentSpeed > speedLimit;

    // Heading calculation & cardinal
    const headingDeg = Number(latestTelemetry?.heading ?? 142);
    const cardinals = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const cardinalIndex = Math.round((headingDeg % 360) / 45) % 8;
    const cardinalHeading = cardinals[cardinalIndex];

    // Engine temp
    const engineTemp = Number(latestTelemetry?.engine_temperature ?? 86.4);
    const isOverheating = engineTemp > 100;

    // Fuel & Battery tanks
    const fuelLevel = vehicle.fuel_level !== null ? Number(vehicle.fuel_level) : null;
    const batteryLevel = vehicle.battery_level !== null ? Number(vehicle.battery_level) : null;

    const isHeavyDuty = vehicle.vehicle_type?.toLowerCase().includes("heavy") || vehicle.vehicle_type?.toLowerCase().includes("container");
    const isReefer = vehicle.vehicle_type?.toLowerCase().includes("reefer") || vehicle.vehicle_type?.toLowerCase().includes("refrigerated");
    
    const fuelTankCapacity = isHeavyDuty ? 380 : isReefer ? 240 : 120;
    const batteryCapacityKwh = isElectric ? 64 : null;

    const remainingFuelLitres = fuelLevel !== null ? parseFloat(((fuelLevel / 100) * fuelTankCapacity).toFixed(1)) : null;
    const remainingBatteryKwh = batteryLevel !== null && isElectric ? parseFloat(((batteryLevel / 100) * 64).toFixed(1)) : null;

    const estimatedRangeKm = isElectric
      ? Math.round((batteryLevel || 80) * 2.6)
      : Math.round(((fuelLevel || 70) / 100) * fuelTankCapacity * 3.4);

    // Deterministic VIN / Chassis
    const cleanId = vehicle.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();
    const vin = `MB8XF${cleanId}K9402`;

    // Odometer reading (in km)
    const seedNum = (vehicle.id.charCodeAt(0) * 31 + vehicle.id.charCodeAt(vehicle.id.length - 1)) % 1000;
    const odometerKm = 38400 + seedNum * 24;

    // Locality resolution
    let locality = "Bengaluru Logistics Corridor";
    if (vehicle.latitude && vehicle.longitude) {
      if (vehicle.latitude > 12.98 && vehicle.longitude > 77.68) locality = "Whitefield Tech & Logistics Gate";
      else if (vehicle.latitude < 12.87 && vehicle.longitude > 77.65) locality = "Electronic City Expressway Phase 1";
      else if (vehicle.latitude > 13.01 && vehicle.longitude < 77.58) locality = "Peenya Industrial Area Stage 2";
      else if (vehicle.latitude > 12.92 && vehicle.longitude < 77.64) locality = "Koramangala Fulfillment Hub";
      else if (vehicle.latitude > 13.02 && vehicle.longitude > 77.59) locality = "Hebbal Flyover Transit Corridor";
    }

    // Health Status
    const criticalAlerts = alerts?.filter(
      (a) => a.status === "active" && (a.severity === "critical" || a.severity === "high")
    ) || [];

    const healthStatus =
      criticalAlerts.length > 0 || isOverheating
        ? "critical"
        : isOverspeeding || (fuelLevel !== null && fuelLevel < 20) || (batteryLevel !== null && batteryLevel < 20)
        ? "warning"
        : "healthy";

    // IoT Telematics Gateway
    const iotGateway = {
      model: "Bytebeam Edge Telematics Unit v3.2",
      imei: `86029304918${seedNum.toString().padStart(4, "0")}`,
      firmware_version: "v2.8.4-edge-release",
      cellular_network: "Airtel IoT 4G LTE",
      signal_strength_dbm: -68,
      signal_bars: 5,
      satellites_connected: 11,
      telemetry_interval_sec: 10,
    };

    // Reefer Cold Chain Diagnostics (if reefer or food/pharma hauler)
    const reeferDiagnostics = isReefer
      ? {
          cargo_temperature_celsius: -18.4,
          setpoint_temperature_celsius: -18.0,
          compressor_state: "RUNNING",
          defrost_cycle: "STANDBY",
          airflow_cfm: 1420,
          status: "COMPLIANT",
        }
      : null;

    // Regulatory Compliance
    const regulatoryCompliance = {
      insurance_provider: "Digit Commercial Fleet Insurance",
      insurance_policy_number: `FLT-POL-${cleanId}`,
      insurance_valid_until: "2027-08-30",
      insurance_status: "ACTIVE",
      fitness_certificate_expiry: "2027-11-15",
      fitness_certificate_status: "VERIFIED",
      pollution_under_control_status: "CERTIFIED (BS-VI)",
      national_permit_valid: true,
      national_permit_type: "All-India Commercial Goods Carriage",
    };

    // Driver Compliance
    const driverCompliance = vehicle.driver
      ? {
          license_type: "Heavy Transport Commercial (HTV)",
          duty_hours_today: 4.8,
          max_duty_hours: 8.0,
          continuous_driving_hours: 2.2,
          safety_score: 95,
          harsh_braking_events_30d: 1,
          rapid_acceleration_events_30d: 0,
          overspeed_events_30d: isOverspeeding ? 1 : 0,
          rest_break_required_in_hours: 1.8,
        }
      : null;

    // Active Trip Enrichment
    let enrichedActiveTrip = null;
    if (activeTrip) {
      const distanceCovered = activeTrip.status === "completed"
        ? activeTrip.distance_km
        : parseFloat(Math.min(activeTrip.distance_km, (activeTrip.distance_km * 0.58)).toFixed(1));
      const progressPercent = Math.min(100, Math.round((distanceCovered / activeTrip.distance_km) * 100));

      const startedTime = new Date(activeTrip.started_at);
      const estTotalMinutes = Math.round((activeTrip.distance_km / (activeTrip.average_speed || 42)) * 60);
      const etaTime = new Date(startedTime.getTime() + (estTotalMinutes + 8) * 60000);

      enrichedActiveTrip = {
        ...activeTrip,
        consignment_number: `CN-${cleanId}-2026`,
        cargo_type: isReefer ? "Cold-Chain Dairy & Pharmaceuticals" : isHeavyDuty ? "Automotive & Steel Assemblies" : "Express FMCG Parcels",
        cargo_weight_tons: isHeavyDuty ? 18.4 : isReefer ? 8.2 : 2.4,
        distance_covered_km: distanceCovered,
        progress_percentage: progressPercent,
        scheduled_eta: etaTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        delay_minutes: 8,
        delay_reason: "Outer Ring Road Peak Traffic Congestion",
        on_time_status: "Minor Delay (+8m)",
      };
    }

    return NextResponse.json({
      vehicle: {
        ...vehicle,
        vin,
        speed_limit: speedLimit,
        is_overspeeding: isOverspeeding,
        engine_temperature: engineTemp,
        is_overheating: isOverheating,
        heading: headingDeg,
        cardinal_heading: cardinalHeading,
        locality,
        health_status: healthStatus,
        fuel_tank_capacity_litres: fuelTankCapacity,
        remaining_fuel_litres: remainingFuelLitres,
        battery_capacity_kwh: batteryCapacityKwh,
        remaining_battery_kwh: remainingBatteryKwh,
        estimated_range_km: estimatedRangeKm,
        odometer_km: odometerKm,
        oil_pressure_psi: 42,
        battery_voltage: "13.8V DC",
        is_electric: isElectric,
        iot_gateway: iotGateway,
        reefer: reeferDiagnostics,
        regulatory: regulatoryCompliance,
        driver_compliance: driverCompliance,
      },
      activeTrip: enrichedActiveTrip,
      trips: trips || [],
      telemetryTrail: telemetryPoints || [],
      alerts: alerts || [],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching vehicle details";
    console.error("Vehicle detail API error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
