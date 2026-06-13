"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

// ECG pulse SVG path - the signature element
function ECGPulse({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 40"
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points="0,20 60,20 75,20 85,4 95,36 105,4 115,36 125,20 140,20 200,20 215,20 225,4 235,36 245,4 255,36 265,20 280,20 400,20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-[dash_3s_linear_infinite]"
        style={{
          strokeDasharray: 600,
          strokeDashoffset: 600,
          animation: "ecgDraw 3s linear infinite",
        }}
      />
      <style>{`
        @keyframes ecgDraw {
          0% { stroke-dashoffset: 600; opacity: 0.3; }
          40% { opacity: 1; }
          80% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: -100; opacity: 0; }
        }
      `}</style>
    </svg>
  );
}

// Stat counter
function StatCard({
  number,
  label,
  sub,
}: {
  number: string;
  label: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-3xl font-black text-[#1B4332] leading-none tracking-tight">
        {number}
      </span>
      <span className="text-xs font-bold text-[#1B4332]/80 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-[10px] text-[#1B4332]/50 font-medium">{sub}</span>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [patientCode, setPatientCode] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openPatientCheckIn = () => {
    const normalizedCode = patientCode.trim().toUpperCase();
    if (!normalizedCode) return;

    router.push(`/vigiroom?code=${encodeURIComponent(normalizedCode)}`);
  };

  return (
    <div className="min-h-screen bg-[#F9FAF8] text-[#0D1F17] font-sans">
      {/* NAV */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-[#1B4332]/10"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image
              src="/viginyx-wordmark.png"
              alt="Viginyx"
              width={150}
              height={43}
              priority
              className="h-8 w-auto"
            />
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-[#1B4332]/70 hover:text-[#1B4332] transition-colors"
            >
              Pharmacist Sign in
            </Link>
            <Link
              href="/login"
              className="h-9 px-4 rounded-lg bg-[#1B4332] text-white text-sm font-bold hover:bg-[#0D1F17] transition-colors shadow-sm"
            >
              Pharmacist Access
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-16 px-5 max-w-5xl mx-auto">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-[#D8F3DC] text-[#1B4332] text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1B4332] animate-pulse" />
            Pre-incubated at RIIDL · KJ Somaiya
          </div>

          <h1 className="text-5xl sm:text-6xl font-black text-[#0D1F17] leading-[1.05] tracking-tight mb-6">
            India&apos;s ADR
            <br />
            reporting gap
            <br />
            <span className="text-[#1B4332]">ends here.</span>
          </h1>

          <p className="text-lg text-[#0D1F17]/60 font-medium leading-relaxed max-w-lg mb-8">
            Viginyx is a pharmacovigilance tool built for Indian community
            pharmacists — structured ADR capture, real-time drug lookup, and
            PVPI-aligned reporting. Without the paperwork.
          </p>

          <div className="bg-white rounded-2xl border border-[#1B4332]/10 shadow-sm p-4 mb-8 max-w-lg">
            <div className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]/50 mb-2">
              Patient Check-in
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={patientCode}
                onChange={(e) => setPatientCode(e.target.value.toUpperCase())}
                placeholder="Enter your 6-character code"
                className="h-12 flex-1 px-4 rounded-xl border border-[#1B4332]/10 bg-[#F4F7F6] text-sm font-semibold text-[#0D1F17] uppercase tracking-widest focus:outline-none focus:border-[#1B4332]"
              />
              <button
                type="button"
                onClick={openPatientCheckIn}
                disabled={patientCode.trim().length < 4}
                className="h-12 px-5 rounded-xl bg-[#1B4332] text-white text-sm font-black hover:bg-[#0D1F17] transition-colors disabled:opacity-40"
              >
                Patient Login
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-12 px-7 rounded-xl bg-[#1B4332] text-white font-bold text-sm shadow-md hover:bg-[#0D1F17] transition-all active:scale-95"
            >
              Try the Demo
              <svg
                className="ml-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
            <a
              href="#problem"
              className="inline-flex items-center justify-center h-12 px-7 rounded-xl border border-[#1B4332]/20 text-[#1B4332] font-bold text-sm hover:bg-[#1B4332]/5 transition-colors"
            >
              See the problem
            </a>
          </div>
        </div>

        {/* ECG Signal Strip — the signature */}
        <div className="mt-16 relative">
          <div className="text-[#1B4332]/25 w-full h-10">
            <ECGPulse className="w-full h-full" />
          </div>
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2">
            <span className="text-[9px] font-bold text-[#1B4332]/30 uppercase tracking-widest">
              ADR Signal
            </span>
            <span className="text-[9px] font-bold text-[#1B4332]/30 uppercase tracking-widest">
              Viginyx PV Engine
            </span>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-[#D8F3DC] border-y border-[#1B4332]/10">
        <div className="max-w-5xl mx-auto px-5 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <StatCard
            number="<1%"
            label="ADR reports filed"
            sub="of estimated ADRs in India"
          />
          <StatCard
            number="8L+"
            label="Community pharmacies"
            sub="in India, largely unconnected"
          />
          <StatCard
            number="5 fields"
            label="To log an ADR"
            sub="vs 40+ on PVPI Yellow Form"
          />
          <StatCard
            number="RIIDL"
            label="Pre-incubated"
            sub="KJ Somaiya Institute, Mumbai"
          />
        </div>
      </section>

      {/* PROBLEM */}
      <section id="problem" className="py-20 px-5 max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#D62839] bg-[#D62839]/8 px-2 py-1 rounded-full">
              The Problem
            </span>
            <h2 className="text-3xl font-black text-[#0D1F17] mt-4 mb-5 leading-tight">
              ADR reporting in India is
              <br />
              <span className="text-[#D62839]">broken by design.</span>
            </h2>
            <div className="flex flex-col gap-4 text-sm text-[#0D1F17]/70 leading-relaxed">
              <p>
                The PVPI Yellow Form has 40+ fields. Most pharmacists have
                never filled one. Adverse drug reactions — events that kill and
                injure patients — go unrecorded because the system makes
                reporting harder than ignoring.
              </p>
              <p>
                India has over 8 lakh community pharmacies. Less than 1% of
                estimated ADRs are ever reported. That is a public health
                catastrophe hiding in plain sight.
              </p>
              <p className="font-semibold text-[#0D1F17]/90">
                The pharmacist at the counter knows something is wrong. They
                just have no fast, compliant way to say so.
              </p>
            </div>
          </div>

          {/* Problem visual */}
          <div className="bg-white rounded-2xl border border-[#1B4332]/10 p-6 shadow-sm flex flex-col gap-4">
            <div className="text-xs font-black uppercase tracking-wider text-[#0D1F17]/40 mb-1">
              Current state
            </div>
            {[
              {
                label: "PVPI Yellow Form fields",
                val: 40,
                max: 40,
                color: "#D62839",
              },
              {
                label: "Viginyx fields required",
                val: 5,
                max: 40,
                color: "#1B4332",
              },
              {
                label: "Estimated ADRs reported",
                val: 1,
                max: 100,
                color: "#D62839",
                suffix: "%",
              },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-semibold text-[#0D1F17]/60">
                  <span>{item.label}</span>
                  <span style={{ color: item.color }}>
                    {item.val}
                    {item.suffix || ""}
                  </span>
                </div>
                <div className="h-2 bg-[#F4F7F6] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${(item.val / item.max) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section className="py-20 px-5 bg-[#1B4332] text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#D8F3DC]/60">
              The Solution
            </span>
            <h2 className="text-3xl font-black mt-3 leading-tight">
              Capture. Verify. Report.
              <br />
              <span className="text-[#52B788]">In under 60 seconds.</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                ),
                title: "ADR Logger",
                desc: "5-field structured capture. Drug, complaint, severity, age group, reporter. Done. Data goes to your pharmacy database instantly.",
              },
              {
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z"
                    />
                  </svg>
                ),
                title: "Drugipedia",
                desc: "Live OpenFDA lookup. Generic names, brand names, dosage, contraindications, real FAERS adverse event counts — at the counter.",
              },
              {
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                ),
                title: "PVPI Aligned",
                desc: "Structured to feed into PVPI reporting hierarchy. Designed with CDSCO, MedWatch, and Naranjo causality scoring in mind.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white/8 border border-white/12 rounded-2xl p-6 flex flex-col gap-4 hover:bg-white/12 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#52B788]/20 flex items-center justify-center text-[#52B788]">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-black text-base mb-1.5">{item.title}</h3>
                  <p className="text-sm text-white/65 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRACTION */}
      <section className="py-20 px-5 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]/50">
            Traction & Validation
          </span>
          <h2 className="text-3xl font-black text-[#0D1F17] mt-3">
            Built with real pharmacists.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {/* Discovery call card */}
          <div className="bg-white rounded-2xl border border-[#1B4332]/10 p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-[#D8F3DC] flex items-center justify-center text-[#1B4332] font-black text-sm shrink-0">
                KJ
              </div>
              <div>
                <div className="font-bold text-sm text-[#0D1F17]">
                  KJ Somaiya Hospital
                </div>
                <div className="text-[11px] text-[#0D1F17]/50">
                  PV Department Discovery Call
                </div>
              </div>
            </div>
            <p className="text-sm text-[#0D1F17]/70 leading-relaxed">
              Mapped the PVPI reporting hierarchy — hospital → AMC/EMC → PVPI
              via Vigiflow. Validated the structured capture approach with
              department pharmacovigilance staff.
            </p>
          </div>

          {/* RIIDL card */}
          <div className="bg-white rounded-2xl border border-[#1B4332]/10 p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-[#D8F3DC] flex items-center justify-center text-[#1B4332] font-black text-sm shrink-0">
                RI
              </div>
              <div>
                <div className="font-bold text-sm text-[#0D1F17]">RIIDL</div>
                <div className="text-[11px] text-[#0D1F17]/50">
                  Pre-Incubation · KJ Somaiya Vidyavihar
                </div>
              </div>
            </div>
            <p className="text-sm text-[#0D1F17]/70 leading-relaxed">
              Viginyx is pre-incubated at RIIDL. Regulatory framework
              validated against DPDP Act 2023, DISHA, and CDSCO requirements.
              Pilot targeting Kalyan community pharmacists in progress.
            </p>
          </div>

          {/* WHO/UMC cert */}
          <div className="bg-white rounded-2xl border border-[#1B4332]/10 p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-[#D8F3DC] flex items-center justify-center text-[#1B4332] font-black text-sm shrink-0">
                WH
              </div>
              <div>
                <div className="font-bold text-sm text-[#0D1F17]">
                  WHO/Uppsala Monitoring Centre
                </div>
                <div className="text-[11px] text-[#0D1F17]/50">
                  Clinical ADR Diagnosis · In Progress
                </div>
              </div>
            </div>
            <p className="text-sm text-[#0D1F17]/70 leading-relaxed">
              Founder completing WHO/UMC certified course on clinical diagnosis
              of adverse drug reactions — domain depth that distinguishes
              Viginyx from purely technical solutions.
            </p>
          </div>

          {/* Tech card */}
          <div className="bg-white rounded-2xl border border-[#1B4332]/10 p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-[#D8F3DC] flex items-center justify-center text-[#1B4332] font-black text-sm shrink-0">
                MV
              </div>
              <div>
                <div className="font-bold text-sm text-[#0D1F17]">
                  Working MVP
                </div>
                <div className="text-[11px] text-[#0D1F17]/50">
                  Next.js · OpenFDA · Google Sheets
                </div>
              </div>
            </div>
            <p className="text-sm text-[#0D1F17]/70 leading-relaxed">
              Live drug lookup via OpenFDA API, real-time ADR submission to
              Google Sheets, mobile-first UI optimised for pharmacy counter
              use. Deployed on Vercel.
            </p>
          </div>
        </div>
      </section>

      {/* FOUNDER */}
      <section className="py-16 px-5 bg-[#F9FAF8] border-t border-[#1B4332]/8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-8">
          <div className="w-16 h-16 rounded-2xl bg-[#1B4332] flex items-center justify-center text-white font-black text-2xl shrink-0 shadow-md">
            A
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]/50 mb-1">
              Founder
            </div>
            <div className="font-black text-lg text-[#0D1F17]">
              Ananya Raghu
            </div>
            <div className="text-sm text-[#0D1F17]/60 mb-3">
              B.Pharm, Mumbai University · Pharmacovigilance + AI
            </div>
            <p className="text-sm text-[#0D1F17]/70 max-w-xl leading-relaxed">
              Most engineers don&apos;t hold the regulatory knowledge. Most
              pharmacists don&apos;t build software. The overlap is rare —
              and that&apos;s the bet. Viginyx exists because I can think
              fluently in CDSCO, PVPI, Naranjo scoring, ICD-10, and DPDP
              — and actually build the product.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5 bg-[#1B4332] text-white text-center">
        <div className="max-w-xl mx-auto">
          <div className="text-[#52B788] text-sm font-bold mb-3">
            Ready to try it?
          </div>
          <h2 className="text-3xl font-black mb-5 leading-tight">
            One pharmacist. One report.
            <br />
            One step closer to safer India.
          </h2>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-13 px-8 rounded-xl bg-white text-[#1B4332] font-black text-sm shadow-md hover:bg-[#D8F3DC] transition-colors active:scale-95"
          >
            Get Early Access
            <svg
              className="ml-2 w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
          <p className="text-white/40 text-xs mt-4">
            Free for pilot pharmacists · No Yellow Form required
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-6 px-5 text-center text-[11px] text-[#0D1F17]/35 font-medium bg-[#F9FAF8] border-t border-[#1B4332]/8">
        © 2026 Viginyx · Pre-incubated at RIIDL, KJ Somaiya Vidyavihar ·
        Mumbai, India
      </footer>
    </div>
  );
}
