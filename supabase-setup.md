1. Main tables :

    - profiles :

    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'operator',
    created_at TIMESTAMPTZ 

    - drivers 
    id UUID PRIMARY KEY DEFAULT,
    full_name TEXT NOT NULL,
    phone TEXT,
    license_number TEXT UNIQUE,
    license_expiry DATE,
    is_active BOOLEAN 
    created_at TIMESTAMPTZ 

    - vehicles :

    id UUID PRIMARY KEY DEFAULT 
    registration_number TEXT UNIQUE NOT NULL,
    manufacturer TEXT NOT NULL,
    model TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    driver_id UUID REFERENCES drivers(id),
    status TEXT NOT NULL DEFAULT 'offline',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    current_speed NUMERIC(7,2) DEFAULT 0,
    fuel_level NUMERIC(5,2),
    battery_level NUMERIC(5,2),
    ignition_on BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    - trips : 

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_number TEXT UNIQUE NOT NULL,
    vehicle_id UUID NOT NULL,
    driver_id UUID,
    status TEXT NOT NULL DEFAULT 'scheduled',
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

    - telemetry :

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL
    trip_id UUID
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed NUMERIC(7,2) DEFAULT 0,
    heading NUMERIC(6,2),
    fuel_level NUMERIC(5,2),
    battery_level NUMERIC(5,2),
    ignition_on BOOLEAN,
    engine_temperature NUMERIC(6,2),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

    - alerts :

    id UUID PRIMARY KEY DEFAULT,
    vehicle_id UUID NOT NULL
    trip_id UUID,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active'
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ

2. Important Relationship :
    - Profile's Id refrences the authenticated user 
    - Vehicle's driver id References id (in driver's table)
    - Telemetry's trip_id and vehicle_id refernces id in trips and vehicles table respectively
    - Alert's vehicle_id and trip_id references id in vehicles and trips table respectively
  
3. Authentication setup :
    