import { Suspense } from "react";
import AlertsView from "@/components/AlertsView";

export const metadata = {
  title: "Alerts · Bytebeam Fleet Operations",
  description: "Review signals that need an operator's attention across your fleet.",
};

export default function AlertsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center font-sans">
          <div className="flex items-center gap-2.5 text-xs text-gray-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>LOADING FLEET EXCEPTIONS & ALERTS...</span>
          </div>
        </div>
      }
    >
      <AlertsView />
    </Suspense>
  );
}
