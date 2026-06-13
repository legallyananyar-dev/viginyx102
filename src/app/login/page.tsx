"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const DEMO_CREDENTIALS = {
  email: "demo@viginyx.in",
  password: "Viginyx@2026",
};

type Mode = "login" | "signup";
type AccessMode = "pharmacist" | "patient";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [accessMode, setAccessMode] = useState<AccessMode>("pharmacist");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [patientCode, setPatientCode] = useState("");
  const [name, setName] = useState("");
  const [pharmReg, setPharmReg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemoHint, setShowDemoHint] = useState(true);

  const handlePatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedCode = patientCode.trim().toUpperCase();

    if (!normalizedCode) {
      setError("Please enter your patient code.");
      return;
    }

    router.push(`/vigiroom?code=${encodeURIComponent(normalizedCode)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        if (!email.trim() || !password.trim()) {
          throw new Error("Please enter your email and password.");
        }

        await signInWithEmailAndPassword(auth, email.trim(), password);
        router.push("/portal");
        return;
      }

      if (!name.trim() || !email.trim() || !password.trim()) {
        throw new Error("Please fill in all required fields.");
      }

      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters.");
      }

      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      await updateProfile(credential.user, { displayName: name.trim() });
      router.push("/portal");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to sign in with Firebase. Check the Firebase Auth project settings.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setShowDemoHint(false);
  };

  return (
    <div className="min-h-screen bg-[#F9FAF8] flex flex-col">
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

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm flex flex-col gap-5">
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
              {accessMode === "pharmacist"
                ? mode === "login"
                  ? "Sign in to your Viginyx workspace"
                  : "Join the Viginyx pilot programme"
                : "Enter your pharmacist code to start the ADR check-in"}
            </p>
          </div>

          <div className="flex bg-[#F0F4F2] rounded-xl p-1 gap-1">
            {(["pharmacist", "patient"] as AccessMode[]).map((currentAccessMode) => (
              <button
                key={currentAccessMode}
                type="button"
                onClick={() => {
                  setAccessMode(currentAccessMode);
                  setError(null);
                }}
                className={`flex-1 h-9 rounded-lg text-xs font-black capitalize transition-all duration-200 ${
                  accessMode === currentAccessMode
                    ? "bg-white text-[#1B4332] shadow-sm"
                    : "text-[#0D1F17]/50 hover:text-[#0D1F17]"
                }`}
              >
                {currentAccessMode === "pharmacist" ? "Pharmacist" : "Patient"}
              </button>
            ))}
          </div>

          {accessMode === "patient" ? (
            <form
              onSubmit={handlePatientSubmit}
              className="bg-white rounded-2xl border border-[#1B4332]/10 shadow-sm p-5 flex flex-col gap-4"
            >
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

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wide text-[#0D1F17]/60">
                  Patient Code <span className="text-[#D62839]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={patientCode}
                  onChange={(e) => setPatientCode(e.target.value.toUpperCase())}
                  placeholder="Enter your 6-character code"
                  maxLength={6}
                  className="h-11 px-4 bg-[#F4F7F6] rounded-xl border border-[#1B4332]/10 text-sm font-semibold text-[#0D1F17] focus:outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332]/20 transition-all placeholder-[#0D1F17]/30 tracking-widest uppercase"
                />
              </div>

              <button
                type="submit"
                className="h-12 bg-[#1B4332] text-white rounded-xl font-black text-sm hover:bg-[#0D1F17] transition-all active:scale-95"
              >
                Start Patient Check-in
              </button>
            </form>
          ) : (
            <>
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

              <div className="flex bg-[#F0F4F2] rounded-xl p-1 gap-1">
                {(["login", "signup"] as Mode[]).map((currentMode) => (
                  <button
                    key={currentMode}
                    type="button"
                    onClick={() => {
                      setMode(currentMode);
                      setError(null);
                    }}
                    className={`flex-1 h-9 rounded-lg text-xs font-black capitalize transition-all duration-200 ${
                      mode === currentMode
                        ? "bg-white text-[#1B4332] shadow-sm"
                        : "text-[#0D1F17]/50 hover:text-[#0D1F17]"
                    }`}
                  >
                    {currentMode === "login" ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>

              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl border border-[#1B4332]/10 shadow-sm p-5 flex flex-col gap-4"
              >
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

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wide text-[#0D1F17]/60">
                    Password <span className="text-[#D62839]">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "Min. 8 characters" : "Your password"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="h-11 px-4 bg-[#F4F7F6] rounded-xl border border-[#1B4332]/10 text-sm font-semibold text-[#0D1F17] focus:outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332]/20 transition-all placeholder-[#0D1F17]/30"
                  />
                </div>

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

                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 bg-[#1B4332] text-white rounded-xl font-black text-sm hover:bg-[#0D1F17] transition-all active:scale-95 disabled:opacity-60"
                >
                  {loading
                    ? "Please wait..."
                    : mode === "login"
                      ? "Sign In to Viginyx"
                      : "Create Viginyx Account"}
                </button>

                <p className="text-[11px] text-[#0D1F17]/45 leading-relaxed text-center">
                  By signing up you agree to Viginyx&apos;s Terms of Use and Privacy Policy.
                </p>
              </form>

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-sm font-semibold text-[#1B4332] text-center hover:underline"
                >
                  Need an account? Sign up
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
