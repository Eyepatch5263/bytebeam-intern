1. Main tables :
    profiles: Authenticated dashboard users.
    drivers: Driver information.
    vehicles: Vehicle records and latest operational state.
    trips: Historical and ongoing trips.
    telemetry: GPS and vehicle sensor readings.
    alerts: Operational events and warnings.
    
2. Important Relationship :
    1. Primary Keys:
    
        - id(profile's table)
        - id(driver's table)
        - id(vehicle's table)
        - id(trip's table)
        - id(telemetry's table)
    2. Foreign Keys:

    - Profile's Id refrences the authenticated user 
    - Vehicle's driver id References id (in driver's table)
    - Telemetry's trip_id and vehicle_id refernces id in trips and vehicles table respectively
    - Alert's vehicle_id and trip_id references id in vehicles and trips table respectively
  
3. Authentication setup :

    For our application we're using Supabase email/password authentication

    setup:
    1. Create a new supabase project with a name and password 
    2. Email authentication will be enabled by default.
    3. Click on connect and choose Next.js as framework and install supabase via npm. 
    4. Add all the required files and copy the env variables
    5. Enable rls policy for the database and copy the servioce role key by going into API keys section and then legacy,anon,service_role api keys and copy the service role api key and add into your .env

    .env example:
        NEXT_PUBLIC_SUPABASE_URL=
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
        SUPABASE_SERVICE_ROLE_KEY=

    After applying the migrations run `npm run seed` which will seed the database with sample data and now you can signup. 

    Demo access :
        Demo credentials :
        - work email : demo@support.com
        - password : admin123