"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface AuthCardProps {
  initialMode?: "signin" | "signup";
}

export default function AuthCard({ initialMode = "signin" }: AuthCardProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"operator" | "admin" | "viewer">("operator");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else if (data?.user) {
        setMessage({ type: "success", text: "Signed in successfully. Redirecting..." });
        router.refresh();
        router.push("/");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setMessage({ type: "error", text: errMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Create user via server admin API to bypass Supabase's free-tier email rate limit
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName,
          role,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Failed to create account");
      }

      // Automatically sign in with the new credentials
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInErr) {
        setMessage({
          type: "success",
          text: "Account registered successfully! Please sign in with your password.",
        });
        setMode("signin");
      } else if (signInData?.user) {
        setMessage({ type: "success", text: "Account created and logged in! Redirecting..." });
        router.refresh();
        router.push("/");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setMessage({ type: "error", text: errMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setMessage({ type: "error", text: error.message });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Google authentication failed.";
      setMessage({ type: "error", text: errMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setMessage({ type: "error", text: "Please enter your email address." });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      });
      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "success",
          text: "Password reset link sent to your email.",
        });
        setShowForgotPassword(false);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Password reset failed.";
      setMessage({ type: "error", text: errMsg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#f5f7f6] overflow-hidden select-none">
      {/* Background Architectural / Topo Contour Circles */}
      <svg
        className="pointer-events-none absolute -right-32 -top-32 w-162.5 h-162.5 text-emerald-900/[0.035]"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="300" cy="300" r="120" stroke="currentColor" strokeWidth="1" />
        <circle cx="300" cy="300" r="200" stroke="currentColor" strokeWidth="1" />
        <circle cx="300" cy="300" r="280" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
        <circle cx="300" cy="300" r="360" stroke="currentColor" strokeWidth="1" />
      </svg>
      <svg
        className="pointer-events-none absolute -left-48 -bottom-48 w-175 h-175 text-emerald-950/3"
        viewBox="0 0 700 700"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="350" cy="350" r="160" stroke="currentColor" strokeWidth="1" />
        <circle cx="350" cy="350" r="260" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
        <circle cx="350" cy="350" r="360" stroke="currentColor" strokeWidth="1" />
      </svg>

      {/* Main Authentication Card */}
      <div className="relative z-10 w-full max-w-240 min-h-145 bg-white rounded-[22px] shadow-[0_25px_60px_-15px_rgba(10,35,25,0.09),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* ========================================= */}
        {/* LEFT COLUMN: Deep Forest Green Console     */}
        {/* ========================================= */}
        <div className="relative bg-[#11382b] p-8 sm:p-10 flex flex-col justify-between overflow-hidden text-white">
          {/* Subtle background radar / contour accents */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <svg className="w-full h-full" viewBox="0 0 450 550" fill="none">
              <circle cx="380" cy="480" r="150" stroke="#a7f3d0" strokeWidth="0.75" />
              <circle cx="380" cy="480" r="250" stroke="#a7f3d0" strokeWidth="0.75" strokeDasharray="4 8" />
              <circle cx="80" cy="120" r="200" stroke="#a7f3d0" strokeWidth="0.5" />
            </svg>
          </div>

          {/* Top Brand Header */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              {/* Bytebeam Diamond Icon */}
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center shadow-inner">
                <svg
                  className="w-4 h-4 text-emerald-400 transform rotate-45"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="4" />
                  <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                </svg>
              </div>

              <div>
                <span className="text-[17px] font-bold tracking-tight text-white block leading-tight">
                  bytebeam
                </span>
                <span className="text-[9px] font-semibold tracking-[0.24em] uppercase text-emerald-300/80 block">
                  FLEET OPERATIONS
                </span>
              </div>
            </div>
          </div>

          {/* Middle Content */}
          <div className="relative z-10 my-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-400/90 block mb-2">
              OPERATIONS CONSOLE
            </span>
            <h1 className="text-2xl sm:text-[28px] font-bold text-white tracking-tight leading-[1.2]">
              Know where your fleet is.
              <br />
              And what needs you.
            </h1>
            <p className="mt-3 text-[12.5px] text-emerald-100/70 leading-relaxed max-w-85">
              A focused workspace for vehicle health, trip activity, and the small signals that keep operations moving.
            </p>

            {/* Stylized Vector Route Card */}
            <div className="mt-6 rounded-xl border border-emerald-500/20 bg-[#0c281e]/85 p-3.5 backdrop-blur-sm shadow-inner relative overflow-hidden">
              <div className="flex items-center justify-between text-[9px] font-mono text-emerald-300/80 tracking-wider">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE ROUTE · BENGALURU</span>
                </div>
              </div>

              {/* Vector Highway Map */}
              <div className="relative h-24 my-2 w-full">
                <svg className="w-full h-full" viewBox="0 0 320 90" fill="none">
                  {/* Faint Grid Roads */}
                  <path
                    d="M 10 30 C 90 20, 160 55, 310 40"
                    stroke="#194838"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 20 80 C 110 70, 200 20, 300 15"
                    stroke="#194838"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 70 85 C 80 50, 100 10, 120 5"
                    stroke="#194838"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 230 85 C 240 50, 260 20, 280 5"
                    stroke="#194838"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />

                  {/* Active Glowing Route */}
                  <path
                    d="M 25 70 C 85 65, 140 45, 200 40 S 260 25, 295 20"
                    stroke="#34d399"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="filter drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                  />

                  {/* Origin Dot */}
                  <circle cx="25" cy="70" r="3.5" fill="#ffffff" stroke="#10b981" strokeWidth="2" />

                  {/* Destination Dot with Pulsing Radar Halo */}
                  <g transform="translate(295, 20)">
                    <circle cx="0" cy="0" r="7" fill="#34d399" opacity="0.3" className="animate-ping" />
                    <circle cx="0" cy="0" r="3.5" fill="#ffffff" stroke="#34d399" strokeWidth="2" />
                  </g>
                </svg>
              </div>

              <div className="flex items-center justify-end text-[9px] font-mono text-emerald-300/60 tracking-wider">
                <span>20 connected vehicles</span>
              </div>
            </div>
          </div>

          {/* Bottom Footer Row */}
          <div className="relative z-10 pt-4 border-t border-emerald-800/40 flex items-center justify-between text-[9px] font-mono uppercase tracking-widest text-emerald-300/70">
            <span>CONNECTED FLEET · 20 VEHICLES</span>
            <span>FIELD RECORD 01</span>
          </div>
        </div>

        {/* ========================================= */}
        {/* RIGHT COLUMN: Minimalist Form Workspace   */}
        {/* ========================================= */}
        <div className="p-8 sm:p-10 flex flex-col justify-between bg-white">
          <div>
            {/* Top Eyebrow & Mode Tabs */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-400">
                NORTHSTAR LOGISTICS
              </span>
              <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setMessage(null);
                  }}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    mode === "signin"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setMessage(null);
                  }}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    mode === "signup"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Header Titles */}
            <h2 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create operator access"}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {mode === "signin"
                ? "Sign in to continue to your fleet workspace."
                : "Register credentials for fleet telematics and trip monitoring."}
            </p>

            {/* Notification Banner */}
            {message && (
              <div
                className={`mt-4 p-3 rounded-lg text-xs flex items-start gap-2 border ${
                  message.type === "error"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : message.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-blue-50 text-blue-800 border-blue-200"
                }`}
              >
                <span className="font-bold">•</span>
                <span className="flex-1">{message.text}</span>
              </div>
            )}

            {/* Form */}
            {showForgotPassword ? (
              /* Forgot Password View */
              <form onSubmit={handlePasswordReset} className="mt-5 space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                    Work email
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#11382b] focus:ring-1 focus:ring-[#11382b] transition-all"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="flex-1 rounded-lg border border-gray-200 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Back to Sign In
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 rounded-lg bg-[#11382b] py-2.5 text-xs font-medium text-white hover:bg-[#0d2d22] transition-colors disabled:opacity-50"
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>
              </form>
            ) : mode === "signin" ? (
              /* ================= Sign In Form ================= */
              <form onSubmit={handleSignIn} className="mt-5 space-y-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                    Work email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-lg border border-gray-200 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#11382b] focus:ring-1 focus:ring-[#11382b] transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-gray-700">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setResetEmail(email);
                        setMessage(null);
                      }}
                      className="text-[11px] text-gray-500 hover:text-[#11382b] transition-colors cursor-pointer"
                    >
                      forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-lg border border-gray-200 pl-3.5 pr-10 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#11382b] focus:ring-1 focus:ring-[#11382b] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                          />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-[#11382b] focus:ring-[#11382b] cursor-pointer"
                  />
                  <label htmlFor="rememberMe" className="text-xs text-gray-600 cursor-pointer">
                    Remember me
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 rounded-lg bg-[#11382b] py-2.5 px-4 text-xs font-semibold text-white tracking-wide hover:bg-[#0c2a20] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in to Fleet Ops</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* ================= Sign Up Form ================= */
              <form onSubmit={handleSignUp} className="mt-5 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Pratyush Sharma"
                    className="w-full rounded-lg border border-gray-200 px-3.5 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#11382b] focus:ring-1 focus:ring-[#11382b] transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                    Work email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-lg border border-gray-200 px-3.5 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#11382b] focus:ring-1 focus:ring-[#11382b] transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                    Workspace Role
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["operator", "viewer", "admin"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-1.5 text-xs font-medium rounded-md border text-center capitalize transition-all ${
                          role === r
                            ? "bg-[#11382b] text-white border-[#11382b]"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full rounded-lg border border-gray-200 pl-3.5 pr-10 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#11382b] focus:ring-1 focus:ring-[#11382b] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 rounded-lg bg-[#11382b] py-2.5 px-4 text-xs font-semibold text-white tracking-wide hover:bg-[#0c2a20] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Fleet Ops Account</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* OR Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-2.5 text-gray-400 font-medium">OR</span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 px-4 text-xs font-medium text-gray-700 hover:bg-gray-50/80 active:bg-gray-100 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Bottom Footnote Links */}
          <div className="mt-5 pt-3 border-t border-gray-100 text-center">
            <p className="text-[11px] text-gray-500">
              Having trouble signing in?{" "}
              <a
                href="mailto:support@bytebeam.io"
                className="font-medium text-[#11382b] hover:underline"
              >
                Contact your administrator
              </a>
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              By continuing, you agree to your organization&apos;s access policy.
            </p>
          </div>
        </div>
      </div>

      {/* Subtle Bottom Right Watermark */}
      <div className="absolute bottom-4 right-6 text-[9.5px] font-mono tracking-[0.2em] uppercase text-gray-400/80 pointer-events-none">
        BYTEBEAM FLEET OPS · V1.0
      </div>
    </div>
  );
}
