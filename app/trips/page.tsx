import { Suspense } from "react";
import TripsView from "@/components/TripsView";

export const metadata = {
  title: "Trips · Bytebeam Fleet Operations",
  description: "Review routes, durations, and notable vehicle activity across your fleet.",
};

export default function TripsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center font-sans">
          <div className="flex items-center gap-2.5 text-xs text-gray-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>LOADING FLEET ACTIVITY LOG...</span>
          </div>
        </div>
      }
    >
      <TripsView />
    </Suspense>
  );
}
