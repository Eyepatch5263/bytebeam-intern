import { Suspense } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import AuthCard from "@/components/AuthCard";
import DashboardOverview from "@/components/DashboardOverview";

// Next.js 16 Cache Components configuration for runtime data access
export const instant = false;

export const metadata = {
  title: "Bytebeam Fleet Operations Console",
  description: "Know where your fleet is. And what needs you.",
};

async function AuthenticatedDashboard() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <AuthCard initialMode="signin" />;
  }

  // Fetch live counts from Supabase
  const [
    { count: vehicleCount },
    { count: driverCount },
    { count: tripCount },
    { count: alertCount },
  ] = await Promise.all([
    supabase.from("vehicles").select("*", { count: "exact", head: true }),
    supabase.from("drivers").select("*", { count: "exact", head: true }),
    supabase.from("trips").select("*", { count: "exact", head: true }),
    supabase.from("alerts").select("*", { count: "exact", head: true }),
  ]);

  return (
    <DashboardOverview
      user={user}
      stats={{
        vehicleCount: vehicleCount ?? 20,
        driverCount: driverCount ?? 20,
        tripCount: tripCount ?? 100,
        alertCount: alertCount ?? 25,
      }}
    />
  );
}

export default function Home() {
  return (
    <Suspense fallback={<AuthCard initialMode="signin" />}>
      <AuthenticatedDashboard />
    </Suspense>
  );
}
