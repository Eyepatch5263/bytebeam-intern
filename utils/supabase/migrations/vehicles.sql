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

CREATE INDEX idx_vehicles_status
ON vehicles(status);

CREATE INDEX idx_vehicles_driver
ON vehicles(driver_id);