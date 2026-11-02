import { createClient } from "@supabase/supabase-js";

// Load environment variables from process.env (passed via --env-file=.env or system)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// Seed configuration
const VEHICLE_COUNT = 20;
const DRIVER_COUNT = 20;
const TRIP_COUNT = 100;
const TELEMETRY_COUNT_TARGET = 5200; // 5000+
const ALERT_COUNT = 25;

// Indian logistics hub routes with realistic coords
const CORRIDORS = [
  {
    name: "Mumbai to Pune Expressway",
    startLoc: "Bhiwandi Hub, Mumbai",
    startLat: 19.2974,
    startLon: 73.0645,
    endLoc: "Chakan MIDC, Pune",
    endLat: 18.7606,
    endLon: 73.8636,
    distanceKm: 148,
  },
  {
    name: "Delhi - Jaipur Highway (NH48)",
    startLoc: "Bilaspur Logistics Park, Gurugram",
    startLat: 28.3242,
    startLon: 76.8437,
    endLoc: "VKI Industrial Area, Jaipur",
    endLat: 26.9744,
    endLon: 75.7681,
    distanceKm: 242,
  },
  {
    name: "Bengaluru - Chennai Corridor",
    startLoc: "Electronic City, Bengaluru",
    startLat: 12.8399,
    startLon: 77.677,
    endLoc: "Sriperumbudur Hub, Chennai",
    endLat: 12.9734,
    endLon: 79.9431,
    distanceKm: 315,
  },
  {
    name: "Hyderabad - Vijayawada (NH65)",
    startLoc: "Shamshabad Cargo Terminal, Hyderabad",
    startLat: 17.2341,
    startLon: 78.4312,
    endLoc: "Autonagar Logistics Park, Vijayawada",
    endLat: 16.4965,
    endLon: 80.6865,
    distanceKm: 275,
  },
  {
    name: "Ahmedabad - Surat Expressway",
    startLoc: "Changodar Industrial Hub, Ahmedabad",
    startLat: 22.9238,
    startLon: 72.4419,
    endLoc: "Sachin GIDC, Surat",
    endLat: 21.0837,
    endLon: 72.8761,
    distanceKm: 265,
  },
  {
    name: "Kolkata - Durgapur Industrial Corridor",
    startLoc: "Dankuni Logistics Park, Kolkata",
    startLat: 22.6841,
    startLon: 88.2917,
    endLoc: "Muchipara Industrial Area, Durgapur",
    endLat: 23.5189,
    endLon: 87.3292,
    distanceKm: 168,
  },
];

// Helper: interpolate lat/lon between start & end with realistic random deviation
function interpolateLocation(startLat, startLon, endLat, endLon, progress, noiseScale = 0.005) {
  const lat = startLat + (endLat - startLat) * progress + (Math.random() - 0.5) * noiseScale;
  const lon = startLon + (endLon - startLon) * progress + (Math.random() - 0.5) * noiseScale;
  return {
    latitude: parseFloat(lat.toFixed(6)),
    longitude: parseFloat(lon.toFixed(6)),
  };
}

// Calculate bearing/heading in degrees
function calculateHeading(lat1, lon1, lat2, lon2) {
  const y = Math.sin((lon2 - lon1) * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180));
  const x =
    Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
    Math.sin(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.cos((lon2 - lon1) * (Math.PI / 180));
  const b = (Math.atan2(y, x) * 180) / Math.PI;
  return parseFloat(((b + 360) % 360).toFixed(2));
}

// Driver mock data
const DRIVER_PROFILES = [
  { name: "Rajesh Kumar Sharma", phone: "+91 98234 11201", code: "DL1420190012341" },
  { name: "Vikramjit Singh", phone: "+91 98112 44302", code: "PB0820180023452" },
  { name: "Amitabh Deshmukh", phone: "+91 94220 55603", code: "MH1220170034563" },
  { name: "Suresh Babu Reddy", phone: "+91 99480 66704", code: "KA0520200045674" },
  { name: "Mohammed Irfan Khan", phone: "+91 97180 77805", code: "UP1620160056785" },
  { name: "Gurpreet Singh Gill", phone: "+91 98765 88906", code: "HR2620190067896" },
  { name: "Manoj Kumar Verma", phone: "+91 93345 99007", code: "RJ1420210078907" },
  { name: "Deepak S. Patil", phone: "+91 98221 12308", code: "MH0420180089018" },
  { name: "Anand R. Murthy", phone: "+91 94480 23409", code: "KA0120200090129" },
  { name: "Praveen Yadav", phone: "+91 99100 34510", code: "HR5520170101230" },
  { name: "Kishore Kumar Das", phone: "+91 94370 45611", code: "OD0220190112341" },
  { name: "Rameshwar Sen", phone: "+91 98290 56712", code: "RJ2020200123452" },
  { name: "Venkatesh Rao", phone: "+91 98490 67813", code: "TS0920180134563" },
  { name: "Harishankar Pandey", phone: "+91 97950 78914", code: "UP3220210145674" },
  { name: "Santosh M. Shinde", phone: "+91 98210 89015", code: "MH4320190156785" },
  { name: "Balwinder Singh", phone: "+91 98720 90116", code: "PB1020170167896" },
  { name: "Selvamani P.", phone: "+91 94430 01217", code: "TN0720200178907" },
  { name: "Ashok Chandra Bose", phone: "+91 98300 12318", code: "WB0220180189018" },
  { name: "Dinesh Bhai Patel", phone: "+91 98250 23419", code: "GJ0120210190129" },
  { name: "Nitin Jagtap", phone: "+91 98900 34520", code: "MH1420190201230" },
];

// Vehicle catalog
const VEHICLE_TEMPLATES = [
  { reg: "MH-12-RN-4821", mfg: "Tata Motors", model: "Signa 4825.T", type: "Heavy Duty Truck", isEV: false },
  { reg: "MH-14-GH-2934", mfg: "Ashok Leyland", model: "AVTR 3520", type: "Heavy Duty Truck", isEV: false },
  { reg: "MH-43-BP-7102", mfg: "BharatBenz", model: "3528R Multi-Axle", type: "Heavy Duty Truck", isEV: false },
  { reg: "KA-01-MJ-9943", mfg: "Volvo Trucks", model: "FM 420 6x4", type: "Container Hauler", isEV: false },
  { reg: "KA-05-AB-5120", mfg: "Tata Motors", model: "Prima 4438.S", type: "Container Hauler", isEV: false },
  { reg: "HR-26-DF-1049", mfg: "Eicher Motors", model: "Pro 6028TM", type: "Heavy Duty Truck", isEV: false },
  { reg: "HR-55-AK-6621", mfg: "Tata Motors", model: "Ultra T.16", type: "Medium Commercial Vehicle", isEV: false },
  { reg: "DL-1L-CX-3891", mfg: "Mahindra", model: "Blazo X 28", type: "Heavy Duty Truck", isEV: false },
  { reg: "DL-1M-TY-8832", mfg: "Ashok Leyland", model: "Boss 1415 HB", type: "Refrigerated Reefer", isEV: false },
  { reg: "TN-07-BL-4019", mfg: "Eicher Motors", model: "Pro 3015 Reefer", type: "Refrigerated Reefer", isEV: false },
  { reg: "TN-09-EQ-7422", mfg: "Tata Motors", model: "Ace Gold Diesel", type: "Light Commercial Vehicle", isEV: false },
  { reg: "TS-09-UB-8210", mfg: "Mahindra", model: "Bolero Maxi Truck Plus", type: "Light Commercial Vehicle", isEV: false },
  { reg: "TS-07-ZZ-1384", mfg: "Ashok Leyland", model: "Dost+ Strong", type: "Light Commercial Vehicle", isEV: false },
  { reg: "GJ-01-WX-9511", mfg: "Force Motors", model: "Urbania Delivery Van", type: "Delivery Van", isEV: false },
  { reg: "GJ-06-KR-3290", mfg: "Mahindra", model: "Supro Profit Van Maxi", type: "Delivery Van", isEV: false },
  { reg: "RJ-14-VC-6031", mfg: "Tata Motors", model: "Ace EV 1000", type: "Electric Delivery Vehicle", isEV: true },
  { reg: "RJ-20-MB-2194", mfg: "Mahindra Electric", model: "Zor Grand EV", type: "Electric Delivery Vehicle", isEV: true },
  { reg: "WB-02-AK-7712", mfg: "Euler Motors", model: "HiLoad EV 2024", type: "Electric Delivery Vehicle", isEV: true },
  { reg: "WB-19-DF-4401", mfg: "Switch Mobility", model: "IeV4 Electric", type: "Electric Commercial Vehicle", isEV: true },
  { reg: "OD-02-PK-6385", mfg: "Tata Motors", model: "Yodha 2.0 4x4", type: "Light Commercial Vehicle", isEV: false },
];

async function seed() {
  console.log("==================================================");
  console.log("   BYTEBEAM FLEET SUPABASE DATABASE SEED SCRIPT   ");
  console.log("==================================================");
  console.log(`Connecting to: ${supabaseUrl}`);

  // Step 1: Clean up existing data in reverse foreign key order
  console.log("\n[1/6] Cleaning existing records (if any)...");
  await supabase.from("alerts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("telemetry").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("trips").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("vehicles").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("drivers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("Existing fleet data cleared.");

  // Step 2: Seed Drivers (20)
  console.log("\n[2/6] Seeding 20 Drivers...");
  const driverRows = DRIVER_PROFILES.map((p, index) => {
    const expiryYear = 2027 + (index % 5);
    const expiryMonth = String((index % 12) + 1).padStart(2, "0");
    return {
      full_name: p.name,
      phone: p.phone,
      license_number: p.code,
      license_expiry: `${expiryYear}-${expiryMonth}-28`,
      is_active: index < 18, // 18 active, 2 inactive
    };
  });

  const { data: insertedDrivers, error: driverErr } = await supabase
    .from("drivers")
    .insert(driverRows)
    .select("id, full_name");

  if (driverErr) {
    throw new Error(`Failed to insert drivers: ${driverErr.message} (Code: ${driverErr.code})`);
  }
  console.log(`Successfully seeded ${insertedDrivers.length} drivers.`);

  // Step 3: Seed Vehicles (20)
  console.log("\n[3/6] Seeding 20 Vehicles (across multiple vehicle types)...");
  const vehicleStatuses = [
    "moving", "moving", "moving", "moving", "moving", "moving", // 6 moving
    "idle", "idle", "idle", "idle", "idle", "idle",             // 6 idle
    "offline", "offline", "offline", "offline", "offline", "offline", "offline", "offline" // 8 offline
  ];

  const vehicleRows = VEHICLE_TEMPLATES.map((tmpl, index) => {
    const assignedDriverId = insertedDrivers[index]?.id;
    const status = vehicleStatuses[index];
    const corridor = CORRIDORS[index % CORRIDORS.length];
    
    // Determine realistic location & operational state
    const progress = status === "offline" ? 1.0 : (status === "idle" ? 0.35 : 0.65);
    const loc = interpolateLocation(corridor.startLat, corridor.startLon, corridor.endLat, corridor.endLon, progress);

    const isMoving = status === "moving";
    const isIdle = status === "idle";
    const isOffline = status === "offline";

    const currentSpeed = isMoving ? parseFloat((42 + (index * 2.5)).toFixed(2)) : 0;
    const ignitionOn = isMoving || isIdle;
    
    // EV vs ICE fuel & battery
    const fuelLevel = tmpl.isEV ? null : parseFloat((45 + (index * 2.2) % 50).toFixed(2));
    const batteryLevel = tmpl.isEV ? parseFloat((60 + (index * 1.8) % 38).toFixed(2)) : parseFloat((88 + (index % 10)).toFixed(2));

    const now = new Date();
    const lastSeenAt = isMoving
      ? new Date(now.getTime() - (index * 30 * 1000)).toISOString()
      : isIdle
      ? new Date(now.getTime() - (index * 60 * 1000)).toISOString()
      : new Date(now.getTime() - (3600 * 1000 * (12 + index * 4))).toISOString();

    return {
      registration_number: tmpl.reg,
      manufacturer: tmpl.mfg,
      model: tmpl.model,
      vehicle_type: tmpl.type,
      driver_id: assignedDriverId,
      status: status,
      latitude: loc.latitude,
      longitude: loc.longitude,
      current_speed: currentSpeed,
      fuel_level: fuelLevel,
      battery_level: batteryLevel,
      ignition_on: ignitionOn,
      last_seen_at: lastSeenAt,
    };
  });

  const { data: insertedVehicles, error: vehicleErr } = await supabase
    .from("vehicles")
    .insert(vehicleRows)
    .select("id, registration_number, vehicle_type, status, driver_id");

  if (vehicleErr) {
    throw new Error(`Failed to insert vehicles: ${vehicleErr.message}`);
  }
  console.log(`Successfully seeded ${insertedVehicles.length} vehicles.`);

  // Step 4: Seed Trips (100)
  console.log("\n[4/6] Seeding 100 Trips (historical & ongoing)...");
  // 75 completed, 15 ongoing, 5 scheduled, 5 cancelled = 100 trips
  const tripRows = [];
  const now = Date.now();

  for (let i = 1; i <= TRIP_COUNT; i++) {
    const tripNumber = `TRIP-2026-${String(i).padStart(4, "0")}`;
    const vehicleIndex = (i - 1) % insertedVehicles.length;
    const vehicle = insertedVehicles[vehicleIndex];
    const corridor = CORRIDORS[(i - 1) % CORRIDORS.length];

    let status = "completed";
    if (i <= 15) {
      status = "ongoing";
    } else if (i <= 20) {
      status = "scheduled";
    } else if (i <= 25) {
      status = "cancelled";
    } else {
      status = "completed";
    }

    let startedAt = null;
    let endedAt = null;
    let distanceKm = 0;
    let avgSpeed = null;
    let maxSpeed = null;
    let idleDuration = 0;
    let haltCount = 0;

    if (status === "completed") {
      // Completed in the past 1 to 30 days
      const daysAgo = 1 + ((i * 7) % 29);
      const hoursOffset = (i * 3) % 24;
      const tripStartTime = new Date(now - (daysAgo * 86400000 + hoursOffset * 3600000));
      const durationHours = 2.5 + ((i % 5) * 1.2);
      const tripEndTime = new Date(tripStartTime.getTime() + durationHours * 3600000);

      startedAt = tripStartTime.toISOString();
      endedAt = tripEndTime.toISOString();
      distanceKm = parseFloat((corridor.distanceKm * (0.92 + (i % 15) * 0.01)).toFixed(2));
      avgSpeed = parseFloat((distanceKm / durationHours).toFixed(2));
      maxSpeed = parseFloat((avgSpeed * 1.42).toFixed(2));
      idleDuration = 600 + (i * 120) % 2400; // seconds
      haltCount = 1 + (i % 4);
    } else if (status === "ongoing") {
      // Started 1 to 6 hours ago
      const hoursAgo = 1 + (i % 5);
      const tripStartTime = new Date(now - hoursAgo * 3600000);
      startedAt = tripStartTime.toISOString();
      endedAt = null;
      const progressFraction = (hoursAgo * 0.18);
      distanceKm = parseFloat((corridor.distanceKm * progressFraction).toFixed(2));
      avgSpeed = parseFloat((48 + (i % 12)).toFixed(2));
      maxSpeed = parseFloat((74 + (i % 14)).toFixed(2));
      idleDuration = 300 + (i * 60) % 900;
      haltCount = Math.floor(i / 5);
    } else if (status === "cancelled") {
      const daysAgo = (i % 10) + 1;
      startedAt = null;
      endedAt = null;
      distanceKm = 0;
      avgSpeed = null;
      maxSpeed = null;
      idleDuration = 0;
      haltCount = 0;
    } else {
      // scheduled
      startedAt = null;
      endedAt = null;
      distanceKm = corridor.distanceKm;
      avgSpeed = null;
      maxSpeed = null;
      idleDuration = 0;
      haltCount = 0;
    }

    tripRows.push({
      trip_number: tripNumber,
      vehicle_id: vehicle.id,
      driver_id: vehicle.driver_id,
      status: status,
      start_location: corridor.startLoc,
      end_location: corridor.endLoc,
      start_latitude: corridor.startLat,
      start_longitude: corridor.startLon,
      end_latitude: corridor.endLat,
      end_longitude: corridor.endLon,
      started_at: startedAt,
      ended_at: endedAt,
      distance_km: distanceKm,
      average_speed: avgSpeed,
      max_speed: maxSpeed,
      idle_duration_seconds: idleDuration,
      halt_count: haltCount,
    });
  }

  const { data: insertedTrips, error: tripErr } = await supabase
    .from("trips")
    .insert(tripRows)
    .select("id, trip_number, vehicle_id, status, started_at, ended_at, start_latitude, start_longitude, end_latitude, end_longitude");

  if (tripErr) {
    throw new Error(`Failed to insert trips: ${tripErr.message}`);
  }
  console.log(`Successfully seeded ${insertedTrips.length} trips.`);

  // Step 5: Seed Telemetry (5,000+ points)
  console.log(`\n[5/6] Generating and seeding ${TELEMETRY_COUNT_TARGET}+ Telemetry points...`);
  const telemetryPoints = [];

  // Filter trips that have started (ongoing + completed)
  const activeTrips = insertedTrips.filter((t) => t.status === "ongoing" || t.status === "completed");
  
  // Distribute ~5200 points across active trips
  const pointsPerTrip = Math.floor(TELEMETRY_COUNT_TARGET / activeTrips.length);
  const remainder = TELEMETRY_COUNT_TARGET % activeTrips.length;

  for (let tIdx = 0; tIdx < activeTrips.length; tIdx++) {
    const trip = activeTrips[tIdx];
    const totalPointsForThisTrip = pointsPerTrip + (tIdx < remainder ? 1 : 0);
    const isOngoing = trip.status === "ongoing";

    const tripStartTime = new Date(trip.started_at).getTime();
    const tripEndTime = isOngoing ? now : new Date(trip.ended_at).getTime();
    const durationTotal = Math.max(tripEndTime - tripStartTime, 1000 * 60 * 30);
    const timeStep = durationTotal / totalPointsForThisTrip;

    // Check if vehicle is EV
    const vehicleRef = VEHICLE_TEMPLATES.find((v) =>
      insertedVehicles.some((iv) => iv.id === trip.vehicle_id && iv.registration_number === v.reg)
    );
    const isEV = vehicleRef?.isEV || false;

    for (let pIdx = 0; pIdx < totalPointsForThisTrip; pIdx++) {
      const progress = pIdx / (totalPointsForThisTrip - 1 || 1);
      const loc = interpolateLocation(
        trip.start_latitude,
        trip.start_longitude,
        trip.end_latitude,
        trip.end_longitude,
        progress,
        0.003
      );

      // Next point for heading calculation
      const nextProgress = Math.min(1, progress + 0.05);
      const nextLoc = interpolateLocation(
        trip.start_latitude,
        trip.start_longitude,
        trip.end_latitude,
        trip.end_longitude,
        nextProgress,
        0.001
      );
      const heading = calculateHeading(loc.latitude, loc.longitude, nextLoc.latitude, nextLoc.longitude);

      // Realistic speed variation
      const isHalted = pIdx % 35 === 0 && pIdx > 0 && pIdx < totalPointsForThisTrip - 5;
      const speed = isHalted
        ? 0
        : parseFloat((35 + Math.sin(pIdx * 0.2) * 20 + ((pIdx % 7) * 3)).toFixed(2));

      // Fuel / battery depletion
      const fuelLevel = isEV
        ? null
        : parseFloat(Math.max(12, 92 - progress * 40 - (pIdx % 3) * 0.1).toFixed(2));
      const batteryLevel = isEV
        ? parseFloat(Math.max(15, 95 - progress * 65 - (pIdx % 2) * 0.1).toFixed(2))
        : parseFloat((92 + (pIdx % 8) * 0.5).toFixed(2));

      // Engine temp: normal 82 - 94°C with occasional warm climbs
      const engineTemp = parseFloat((82 + Math.min(22, progress * 10 + (speed / 10))).toFixed(2));

      const recordedAt = new Date(tripStartTime + pIdx * timeStep).toISOString();

      telemetryPoints.push({
        vehicle_id: trip.vehicle_id,
        trip_id: trip.id,
        latitude: loc.latitude,
        longitude: loc.longitude,
        speed: speed,
        heading: heading,
        fuel_level: fuelLevel,
        battery_level: batteryLevel,
        ignition_on: speed > 0 || isHalted,
        engine_temperature: engineTemp,
        recorded_at: recordedAt,
      });
    }
  }

  // Insert telemetry in chunks of 500 for optimal Supabase REST performance
  console.log(`Generated ${telemetryPoints.length} telemetry points. Uploading in batches...`);
  const CHUNK_SIZE = 500;
  let insertedTelemetryCount = 0;

  for (let i = 0; i < telemetryPoints.length; i += CHUNK_SIZE) {
    const chunk = telemetryPoints.slice(i, i + CHUNK_SIZE);
    const { error: telErr } = await supabase.from("telemetry").insert(chunk);
    if (telErr) {
      throw new Error(`Telemetry insert batch failed at index ${i}: ${telErr.message}`);
    }
    insertedTelemetryCount += chunk.length;
    process.stdout.write(`\r  > Uploaded ${insertedTelemetryCount} / ${telemetryPoints.length} points...`);
  }
  console.log(`\nSuccessfully seeded ${insertedTelemetryCount} telemetry points.`);

  // Step 6: Seed Alerts (20 - 30)
  console.log(`\n[6/6] Seeding ${ALERT_COUNT} realistic Fleet Alerts...`);
  const ALERT_DEFINITIONS = [
    {
      type: "overspeeding",
      severity: "high",
      title: "Speed Threshold Exceeded (96 km/h)",
      desc: "Vehicle exceeded commercial speed limit of 80 km/h on Expressway stretch.",
    },
    {
      type: "harsh_braking",
      severity: "medium",
      title: "Severe Braking Event Detected",
      desc: "Deceleration of -12.4 m/s² detected. Driver may have made sudden emergency stop.",
    },
    {
      type: "engine_overheating",
      severity: "critical",
      title: "Engine Temperature Warning (108°C)",
      desc: "Coolant temperature exceeded safe threshold of 102°C for over 5 minutes.",
    },
    {
      type: "low_fuel",
      severity: "medium",
      title: "Low Fuel Reserve Alert (< 12%)",
      desc: "Fuel level dropped below safe operational reserve. Nearest fuel depot recommended.",
    },
    {
      type: "low_battery",
      severity: "high",
      title: "Critical Battery State (< 15%)",
      desc: "EV battery level critical. Route diversion to nearest fast DC charger advised.",
    },
    {
      type: "geofence_violation",
      severity: "medium",
      title: "Geofence Route Deviation",
      desc: "Vehicle deviated more than 5 km from designated national highway transit route.",
    },
    {
      type: "excessive_idling",
      severity: "low",
      title: "Excessive Engine Idle (> 45 min)",
      desc: "Vehicle stationary with ignition active for prolonged duration at toll/rest stop.",
    },
    {
      type: "unauthorized_movement",
      severity: "critical",
      title: "Off-Hour Movement Alert",
      desc: "Vehicle ignition triggered outside scheduled operating transit window.",
    },
    {
      type: "rapid_acceleration",
      severity: "low",
      title: "Harsh Acceleration Detected",
      desc: "Sudden acceleration +4.8 m/s² detected from stationary position.",
    },
  ];

  const alertRows = [];
  const alertStatuses = ["active", "active", "acknowledged", "acknowledged", "resolved"];

  for (let i = 0; i < ALERT_COUNT; i++) {
    const alertDef = ALERT_DEFINITIONS[i % ALERT_DEFINITIONS.length];
    const vehicle = insertedVehicles[i % insertedVehicles.length];
    const trip = activeTrips[i % activeTrips.length];
    const status = alertStatuses[i % alertStatuses.length];

    const alertTime = new Date(now - (i * 3 + 1) * 3600000);
    const ackTime =
      status === "acknowledged" || status === "resolved"
        ? new Date(alertTime.getTime() + 15 * 60000).toISOString()
        : null;
    const resTime =
      status === "resolved"
        ? new Date(alertTime.getTime() + 45 * 60000).toISOString()
        : null;

    alertRows.push({
      vehicle_id: vehicle.id,
      trip_id: trip.id,
      alert_type: alertDef.type,
      severity: alertDef.severity,
      title: alertDef.title,
      description: alertDef.desc,
      status: status,
      triggered_at: alertTime.toISOString(),
      acknowledged_at: ackTime,
      resolved_at: resTime,
    });
  }

  const { data: insertedAlerts, error: alertErr } = await supabase
    .from("alerts")
    .insert(alertRows)
    .select("id, alert_type, severity, status");

  if (alertErr) {
    throw new Error(`Failed to insert alerts: ${alertErr.message}`);
  }
  console.log(`Successfully seeded ${insertedAlerts.length} alerts.`);

  // Step 7: Final verification
  console.log("\n==================================================");
  console.log("             FINAL DATABASE VERIFICATION          ");
  console.log("==================================================");
  for (const table of ["drivers", "vehicles", "trips", "telemetry", "alerts"]) {
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
    if (error) {
      console.log(`- ${table}: Error (${error.message})`);
    } else {
      console.log(`- ${table.padEnd(12)}: ${count} rows`);
    }
  }
  console.log("\nFleet database seed completed successfully!");
}

seed().catch((err) => {
  console.error("\nSeed failed with error:\n", err);
  process.exit(1);
});
