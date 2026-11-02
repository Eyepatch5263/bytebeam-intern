"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import AuthCard from "@/components/AuthCard";
import DashboardOverview from "@/components/DashboardOverview";

export default function FleetApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function checkAuth() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch (err) {
        console.error("Auth check notice:", err);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center font-sans">
        <div className="flex items-center gap-2.5 text-xs text-gray-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>CONNECTING TO FLEET OPERATIONS...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthCard initialMode="signin" />;
  }

  return <DashboardOverview user={user} />;
}
