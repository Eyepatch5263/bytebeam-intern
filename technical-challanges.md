1. Supabase's default email service has a strict built-in rate limit on free tier projects of 3 to 4 confirmation emails per hour. When creating test accounts via client-side supabase.auth.signUp(), Supabase attempts to dispatch an email confirmation, quickly hitting: 429: Email rate limit exceeded.

The Solution Implemented
We created a server-side registration handler 

app/api/auth/signup/route.ts
 that uses your SUPABASE_SERVICE_ROLE_KEY:

Auto-Confirms Email (email_confirm: true): Creates the user directly in Supabase Auth as pre-confirmed. No confirmation email is sent, completely bypassing the rate limit.
Auto-Populates Profile: Automatically records their full_name, email, and selected role (operator, viewer, admin) in the profiles table.
Instant Sign-In: Immediately signs the user in and redirects them to the fleet workspace without requiring any email clicks.