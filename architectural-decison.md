1. How do we determine whether a vehicle is offline?

A vehicle shouldn't necessarily be marked offline simply because its ignition is off.

For our prototype, we can define:
- Moving: ignition on and speed above 0.
- Idle: ignition on and speed approximately 0.
- Offline: no telemetry received for a configurable period, e.g. 5 minutes.

2. Should we store every GPS reading?

Yes. Historical location records are essential for route reconstruction.

For 20 vehicles reporting every 30 seconds, we would generate approximately 2,400 telemetry records per hour.

That's manageable for this prototype.

3. Should trip metrics be stored or calculated?

Ideally, metrics such as distance, average speed, maximum speed, and idle duration can be calculated from telemetry.

However, storing the aggregated values in trips makes dashboard queries simpler. We can calculate them during trip completion or in our seed process.

4. Do we need a separate vehicle assignment history table?

Not initially. vehicles.driver_id represents the current assignment, while trips.driver_id preserves historical trip assignments.

Ignoring for NOW : A separate assignment table would be useful in a more mature fleet platform, but isn't necessary here.