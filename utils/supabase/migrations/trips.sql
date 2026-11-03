
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

CREATE INDEX idx_trips_vehicle
ON trips(vehicle_id);

CREATE INDEX idx_trips_started_at
ON trips(started_at DESC);