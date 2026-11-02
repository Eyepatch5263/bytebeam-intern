"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface DashboardOverviewProps {
  user: {
    email?: string;
    id: string;
    user_metadata?: {
      full_name?: string;
      role?: string;
    };
  };
  stats: {
    vehicleCount: number;
    driverCount: number;
    tripCount: number;
    alertCount: number;
  };
}

export default function DashboardOverview({ user, stats }: DashboardOverviewProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  };

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Fleet Operator";
  const userRole = user.user_metadata?.role || "operator";

  return (
    <div className="min-h-screen bg-[#f5f7f6] text-gray-900 font-sans">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#11382b] flex items-center justify-center text-emerald-400">
              <svg className="w-4 h-4 transform rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-base text-gray-900 tracking-tight leading-none block">
                bytebeam
              </span>
              <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-emerald-700 leading-none block mt-0.5">
                FLEET OPERATIONS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-gray-800">{displayName}</div>
              <div className="text-[10px] text-gray-500 font-mono uppercase">{userRole} · {user.email}</div>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-[#11382b] rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
          <div className="relative z-10 max-w-2xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-400">
              OPERATIONS CONSOLE · ACTIVE SESSION
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 text-white">
              Welcome back, {displayName}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-emerald-100/75 leading-relaxed">
              Real-time telemetry, trip status, and fleet incident monitoring connected to Supabase.
            </p>
          </div>
          <div className="absolute right-6 -bottom-10 opacity-10 pointer-events-none">
            <svg className="w-64 h-64 text-emerald-400" viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="50" r="45" />
            </svg>
          </div>
        </div>

        {/* Live Seeded Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Connected Vehicles</div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-3xl font-bold text-gray-900">{stats.vehicleCount}</div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                6 moving · 6 idle
              </span>
            </div>
            <p className="mt-2 text-[11px] text-gray-400">Heavy, LCV, Reefer & Electric trucks</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Drivers</div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-3xl font-bold text-gray-900">{stats.driverCount}</div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                18 active
              </span>
            </div>
            <p className="mt-2 text-[11px] text-gray-400">Verified commercial license records</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Trips Logged</div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-3xl font-bold text-gray-900">{stats.tripCount}</div>
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                15 ongoing
              </span>
            </div>
            <p className="mt-2 text-[11px] text-gray-400">75 completed, 15 ongoing, 10 scheduled/cancelled</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fleet Alerts</div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-3xl font-bold text-gray-900">{stats.alertCount}</div>
              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                10 active
              </span>
            </div>
            <p className="mt-2 text-[11px] text-gray-400">Overspeeding, Harsh braking & Temp warnings</p>
          </div>
        </div>

        {/* Telemetry points status badge */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm font-semibold text-gray-900">High-Frequency Telemetry Ingestion Active</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              5,200+ GPS coordinates, velocity readings, battery/fuel levels, and engine temperatures seeded in Supabase database.
            </p>
          </div>
          <div className="text-xs font-mono text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200/60 self-start sm:self-auto">
            Supabase DB: Connected
          </div>
        </div>
      </main>
    </div>
  );
}
