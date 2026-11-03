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

CREATE INDEX idx_telemetry_vehicle_time
ON telemetry(vehicle_id, recorded_at DESC);

CREATE INDEX idx_telemetry_trip_time
ON telemetry(trip_id, recorded_at ASC);