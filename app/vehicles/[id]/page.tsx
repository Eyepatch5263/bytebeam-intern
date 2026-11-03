import { Suspense } from "react";
import VehicleProfileView from "@/components/VehicleProfileView";

// Next.js 16 runtime configuration for dynamic routes with params
export const instant = false;

export const metadata = {
  title: "Vehicle Profile & Live Trip · Bytebeam Operations",
  description: "Live route, trip timeline, and telematics telemetry for fleet asset.",
};

async function VehicleProfileContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VehicleProfileView vehicleId={id} />;
}

export default function VehicleProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center font-sans">
          <div className="flex items-center gap-2.5 text-xs text-gray-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>CONNECTING TO VEHICLE TELEMETRY...</span>
          </div>
        </div>
      }
    >
      <VehicleProfileContent params={params} />
    </Suspense>
  );
}
