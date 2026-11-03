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

CREATE INDEX idx_alerts_vehicle
ON alerts(vehicle_id);

CREATE INDEX idx_alerts_triggered
ON alerts(triggered_at DESC);