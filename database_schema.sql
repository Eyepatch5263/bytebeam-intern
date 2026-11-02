
-- =========================================
-- 1. PROFILES
-- =========================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'operator'
        CHECK (role IN ('admin', 'operator', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 2. DRIVERS
-- =========================================

CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT,
    license_number TEXT UNIQUE,
    license_expiry DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 3. VEHICLES
-- =========================================

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    registration_number TEXT UNIQUE NOT NULL,
    manufacturer TEXT NOT NULL,
    model TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,

    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,

    status TEXT NOT NULL DEFAULT 'offline'
        CHECK (status IN ('moving', 'idle', 'offline')),

    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,

    current_speed NUMERIC(7,2) DEFAULT 0,
    fuel_level NUMERIC(5,2),
    battery_level NUMERIC(5,2),
    ignition_on BOOLEAN DEFAULT FALSE,

    last_seen_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CHECK (fuel_level IS NULL OR fuel_level BETWEEN 0 AND 100),
    CHECK (battery_level IS NULL OR battery_level BETWEEN 0 AND 100),
    CHECK (current_speed >= 0)
);

-- =========================================
-- 4. TRIPS
-- =========================================

CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    trip_number TEXT UNIQUE NOT NULL,

    vehicle_id UUID NOT NULL
        REFERENCES vehicles(id) ON DELETE CASCADE,

    driver_id UUID
        REFERENCES drivers(id) ON DELETE SET NULL,

    status TEXT NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),

    start_location TEXT,
    end_location TEXT,

    start_latitude DOUBLE PRECISION,
    start_longitude DOUBLE PRECISION,
    end_latitude DOUBLE PRECISION,
    end_longitude DOUBLE PRECISION,

    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,

    distance_km NUMERIC(10,2) DEFAULT 0,
    average_speed NUMERIC(7,2),
    max_speed NUMERIC(7,2),

    idle_duration_seconds INTEGER DEFAULT 0,
    halt_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CHECK (distance_km >= 0),
    CHECK (idle_duration_seconds >= 0),
    CHECK (halt_count >= 0),
    CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at)
);

-- =========================================
-- 5. TELEMETRY
-- =========================================

CREATE TABLE telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    vehicle_id UUID NOT NULL
        REFERENCES vehicles(id) ON DELETE CASCADE,

    trip_id UUID
        REFERENCES trips(id) ON DELETE SET NULL,

    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,

    speed NUMERIC(7,2) DEFAULT 0,
    heading NUMERIC(6,2),

    fuel_level NUMERIC(5,2),
    battery_level NUMERIC(5,2),

    ignition_on BOOLEAN,
    engine_temperature NUMERIC(6,2),

    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (latitude BETWEEN -90 AND 90),
    CHECK (longitude BETWEEN -180 AND 180),
    CHECK (speed >= 0),
    CHECK (fuel_level IS NULL OR fuel_level BETWEEN 0 AND 100),
    CHECK (battery_level IS NULL OR battery_level BETWEEN 0 AND 100)
);

-- =========================================
-- 6. ALERTS
-- =========================================

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    vehicle_id UUID NOT NULL
        REFERENCES vehicles(id) ON DELETE CASCADE,

    trip_id UUID
        REFERENCES trips(id) ON DELETE SET NULL,

    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),

    title TEXT NOT NULL,
    description TEXT,

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'acknowledged', 'resolved')),

    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
);

-- =========================================
-- INDEXES
-- =========================================

CREATE INDEX idx_vehicles_status
ON vehicles(status);

CREATE INDEX idx_vehicles_driver
ON vehicles(driver_id);

CREATE INDEX idx_trips_vehicle
ON trips(vehicle_id);

CREATE INDEX idx_trips_started_at
ON trips(started_at DESC);

CREATE INDEX idx_telemetry_vehicle_time
ON telemetry(vehicle_id, recorded_at DESC);

CREATE INDEX idx_telemetry_trip_time
ON telemetry(trip_id, recorded_at ASC);

CREATE INDEX idx_alerts_status
ON alerts(status);

CREATE INDEX idx_alerts_vehicle
ON alerts(vehicle_id);

CREATE INDEX idx_alerts_triggered
ON alerts(triggered_at DESC);
