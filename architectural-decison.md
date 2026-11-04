# Architectural Decison

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

5. Technical Decisions

    Frontend	Next
    Styling	Tailwind CSS + shadcn/ui
    Database	Supabase PostgreSQL
    Authentication	Supabase Auth
    Maps	Mapbox-gl
    Deployment	Vercel


# Data-model Decisons

1. We chose start and end (location,longitude,latitude) to add a start and end marker/endpoint on the map for customization and to draw the route we stored the (latitude and logitude with speed) at certain intervals of time, so that we can draw a route between start and end on the map. 

Below is the query via which we can fetch the required longitude and latitude for a certain trip

`sql`:` SELECT latitude, longitude, speed, recorded_at
FROM telemetry
WHERE trip_id = '<trip_id>' order by recorded_at asc; `  

2. we have vehicle_id and trip_id as foreign keys in alerts so that we can track the vehicle having any ongoing trip to find out it's alerts and can display them. 


# Map Library Choice

### We'll be using Mapbox for fleet tracking and visualization. 

-   mapbox.com is a provider of custom online maps which provides APIs for geocoding, routing, and displaying maps. We'll be using it for our fleet tracking and visualization.
-    I'm using recorded GPS points as the source of truth and Map Matching to improve the historical route appearance. We don't need to call Directions API every time someone opens a trip. 

We've build three map view. 
- Fleet Overview
-  Trip Inspection
- Vehicle Inspection

