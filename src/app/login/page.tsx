"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Demo credentials for pitchathon
const DEMO_CREDENTIALS = {
  email: "demo@viginyx.in",
  password: "Viginyx@2026",
};

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [pharmReg, setPharmReg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemoHint, setShowDemoHint] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    await new Promise((r) => setTimeout(r, 900)); // realistic delay

    if (mode === "login") {
      if (
        email === DEMO_CREDENTIALS.email &&
        password === DEMO_CREDENTIALS.password
      ) {
        // success — redirect to app
        router.push("/portal");
      } else if (email && password) {
        // for pitchathon: accept any filled credentials as "registered"
        router.push("/portal");
      } else {
        setError("Please enter your email and password.");
        setLoading(false);
      }
    } else {
      // signup mode
      if (!name.trim() || !email.trim() || !password.trim()) {
        setError("Please fill in all required fields.");
        setLoading(false);
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        setLoading(false);
        return;
      }
      // mock success — redirect
      router.push("/portal");
    }
  };

  const fillDemo = () => {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setShowDemoHint(false);
  };

  return (
    <div className="min-h-screen bg-[#F9FAF8] flex flex-col">
      {/* Top bar */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-[#1B4332]/8 bg-white/80 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/viginyx-wordmark.png"
            alt="Viginyx"
            width={140}
            height={40}
            priority
            className="h-7 w-auto"
          />
        </Link>
        <Link
          href="/"
          className="text-xs font-semibold text-[#1B4332]/60 hover:text-[#1B4332] transition-colors"
        >
          ← Back to home
        </Link>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm flex flex-col gap-5">
          {/* Header */}
          <div className="text-center">
            <Image
              src="/viginyx-wordmark.png"
              alt="Viginyx"
              width={190}
              height={54}
              priority
              className="h-12 w-auto mx-auto mb-4"
            />
            <h1 className="text-2xl font-black text-[#0D1F17] tracking-tight">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-sm text-[#0D1F17]/50 mt-1 font-medium">
              {mode === "login"
                ? "Sign in to your Viginyx workspace"
                : "Join the Viginyx pilot programme"}
            </p>
          </div>

          {/* Demo hint */}
          {mode === "login" && showDemoHint && (
            <button
              type="button"
              onClick={fillDemo}
              className="w-full text-left bg-[#D8F3DC] border border-[#1B4332]/20 rounded-xl px-4 py-3 flex items-start gap-3 hover:bg-[#D8F3DC]/80 transition-colors"
            >
              <svg
                className="w-4 h-4 mt-0.5 text-[#1B4332] shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
                />
              </svg>
              <div>
                <div className="text-xs font-black text-[#1B4332]">
                  Pitchathon Demo
                </div>
                <div className="text-[11px] text-[#1B4332]/70 font-medium mt-0.5">
                  Click to fill demo credentials automatically
                </div>
              </div>
            </button>
          )}

          {/* Toggle tabs */}
          <div className="flex bg-[#F0F4F2] rounded-xl p-1 gap-1">
            {(["login", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`flex-1 h-9 rounded-lg text-xs font-black capitalize transition-all duration-200 ${
                  mode === m
                    ? "bg-white text-[#1B4332] shadow-sm"
                    : "text-[#0D1F17]/50 hover:text-[#0D1F17]"
                }`}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-[#1B4332]/10 shadow-sm p-5 flex flex-col gap-4"
          >
            {/* Error */}
            {error && (
              <div className="bg-[#FFF0F2] border border-[#FFCCD5] rounded-xl px-3 py-2.5 flex gap-2 text-[#D62839] text-xs font-semibold">
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
                {error}
              </div>
            )}

            {/* Signup only fields */}
            {mode === "signup" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wide text-[#0D1F17]/60">
                    Full Name <span className="text-[#D62839]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="h-11 px-4 bg-[#F4F7F6] rounded-xl border border-[#1B4332]/10 text-sm font-semibold text-[#0D1F17] focus:outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332]/20 transition-all placeholder-[#0D1F17]/30"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wide text-[#0D1F17]/60">
                    Pharmacy Reg. No{" "}
                    <span className="text-[#0D1F17]/30 font-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={pharmReg}
                    onChange={(e) => setPharmReg(e.target.value)}
                    placeholder="e.g. MH-PHR-2024-XXXXX"
                    className="h-11 px-4 bg-[#F4F7F6] rounded-xl border border-[#1B4332]/10 text-sm font-semibold text-[#0D1F17] focus:outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332]/20 transition-all placeholder-[#0D1F17]/30"
                  />
                </div>
              </>
            )}

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wide text-[#0D1F17]/60">
                Email <span className="text-[#D62839]">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@pharmacy.in"
                autoComplete="email"
                className="h-11 px-4 bg-[#F4F7F6] rounded-xl border border-[#1B4332]/10 text-sm font-semibold text-[#0D1F17] focus:outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332]/20 transition-all placeholder-[#0D1F17]/30"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wide text-[#0D1F17]/60">
                Password <span className="text-[#D62839]">*</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  mode === "signup" ? "Min. 8 characters" : "Your password"
                }
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                className="h-11 px-4 bg-[#F4F7F6] rounded-xl border border-[#1B4332]/10 text-sm font-semibold text-[#0D1F17] focus:outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332]/20 transition-all placeholder-[#0D1F17]/30"
              />
            </div>

            {/* Forgot password */}
            {mode === "login" && (
              <div className="text-right -mt-2">
                <button
                  type="button"
                  className="text-[11px] font-semibold text-[#1B4332]/60 hover:text-[#1B4332] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full bg-[#1B4332] hover:bg-[#0D1F17] text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-95 duration-150 flex items-center justify-center mt-1 disabled:opacity-60"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === "login" ? (
                "Sign In to Viginyx"
              ) : (
                "Create My Account"
              )}
            </button>

            {/* Terms for signup */}
            {mode === "signup" && (
              <p className="text-[10px] text-[#0D1F17]/40 text-center leading-relaxed">
                By signing up you agree to Viginyx&apos;s Terms of Use and
                Privacy Policy (DPDP Act 2023 compliant).
              </p>
            )}
          </form>

          {/* Pilot badge */}
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1B4332]/50">
              <span className="w-1.5 h-1.5 rounded-full bg-[#52B788] animate-pulse" />
              Pilot programme open · Kalyan-Dombivli pharmacies
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
