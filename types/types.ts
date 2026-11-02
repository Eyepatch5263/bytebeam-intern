export interface Profile {
    id: string;
    full_name: string;
    email: string;
    role: ['admin', 'operator', 'viewer'];
    created_at: Date;
}

export interface Driver {
    id: string;
    full_name: string;
    phone: string;
    license_number: string;
    license_expiry: Date;
    is_active: boolean;
    created_at: Date;
}

export interface Vehicle {
    id: string;
    registration_number: string;
    manufacturer: string;
    model: string;
    vehicle_type: string;
    driver_id: string;
    status: ["moving", "idle", "offline"];
    latitude: number;
    longitude: number;
    current_speed: number;
    fuel_level: number;
    battery_level: number;
    ignition_on: boolean;
    last_seen_at: Date;
    created_at: Date;
}

export interface trips {
    id: string;
    trip_number: string;
    vehicle_id: string;
    driver_id: string;
    status: ["scheduled", "ongoing", "completed", "cancelled"];
    start_location: string;
    end_location: string;
    start_latitude: number;
    start_longitude: number;
    end_latitude: number;
    end_longitude: number;
    started_at: Date;
    ended_at: Date;
    distance_km: number;
    average_speed: number;
    max_speed: number;
    idle_duration_seconds: number;
    halt_count: number;
    created_at: Date;
}

export interface Telemetry {
    id: string;
    vehicle_id: string;
    trip_id: string;
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    fuel_level: number;
    battery_level: number;
    ignition_on: boolean;
    engine_temperature: number;
    recorded_at: Date;
}

export interface Alerts {
    id: string;
    vehicle_id: string;
    trip_id: string;
    alert_type: string;
    severity: ["low", "medium", "high", "critical"];
    title: string;
    description: string;
    status: ["active", "acknowledged", "resolved"];
    triggered_at: Date;
    acknowledged_at: Date;
    resolved_at: Date;
}