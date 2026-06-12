"use client";

import { useState } from "react";

export default function AdrReport() {
  const [drugName, setDrugName] = useState("");
  const [complaint, setComplaint] = useState("");
  const [severity, setSeverity] = useState<"Mild" | "Moderate" | "Severe" | "">("");
  const [ageGroup, setAgeGroup] = useState<"Child" | "Adult" | "Elderly" | "">("");
  const [reporterName, setReporterName] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!drugName.trim()) {
      setError("Please specify the drug name.");
      return;
    }
    if (!complaint.trim()) {
      setError("Please enter the patient's complaint.");
      return;
    }
    if (!severity) {
      setError("Please select a severity level.");
      return;
    }
    if (!ageGroup) {
      setError("Please select the patient's age group.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      drugName: drugName.trim(),
      complaint: complaint.trim(),
      severity,
      ageGroup,
      reporterName: reporterName.trim() || undefined,
    };

    const targetUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

    try {
      if (!targetUrl) {
        // Fallback / Mock mode for direct testing if env var isn't configured
        console.warn("NEXT_PUBLIC_APPS_SCRIPT_URL is not set. Simulating spreadsheet insert.");
        await new Promise((resolve) => setTimeout(resolve, 1200));
        setSuccess(true);
      } else {
        // POST to Google Apps Script Web App URL
        const response = await fetch(targetUrl, {
          method: "POST",
          mode: "no-cors", // Google Apps Script Web App redirects are sometimes handled via no-cors
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        // With no-cors, response.ok/status are opaque (usually 0). We assume success if fetch finishes without throwing.
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "Unable to submit report. Please check your internet connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setDrugName("");
    setComplaint("");
    setSeverity("");
    setAgeGroup("");
    setReporterName("");
    setSuccess(false);
    setError(null);
  };

  if (success) {
    return (
      <div className="flex flex-col gap-6 py-6 items-center text-center">
        {/* Success Card */}
        <div className="bg-white rounded-2xl p-8 border border-primary/15 shadow-lg flex flex-col items-center gap-5 w-full">
          <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center text-primary animate-bounce">
            <svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          
          <div>
            <h2 className="text-xl font-black text-primary-dark">Report submitted ✓</h2>
            <p className="text-sm text-primary-dark/85 font-semibold mt-2 px-2">
              Thank you for keeping patients safe.
            </p>
            <p className="text-xs text-primary-dark/50 mt-4 leading-relaxed">
              Your Adverse Drug Reaction log has been safely recorded.
            </p>
          </div>

          {!process.env.NEXT_PUBLIC_APPS_SCRIPT_URL && (
            <div className="text-[10px] bg-yellow-50 text-yellow-800 border border-yellow-200 p-2.5 rounded-lg w-full leading-relaxed">
              <strong>Developer Note:</strong> This was a simulated submission since <code>NEXT_PUBLIC_APPS_SCRIPT_URL</code> is not configured.
            </div>
          )}

          <button
            type="button"
            onClick={resetForm}
            className="w-full h-12 rounded-xl border border-primary/25 text-primary hover:bg-primary-light/10 font-bold text-sm transition-colors cursor-pointer"
          >
            Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 py-2">
      {/* Form Card */}
      <section className="bg-white rounded-2xl p-5 border border-primary/10 shadow-sm flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-primary-dark">Adverse Drug Reaction (ADR)</h1>
          <p className="text-xs text-primary-dark/70 mt-1">
            Log suspected drug side effects and reactions. Information is routed directly to the pharmacy supervisor database.
          </p>
        </div>

        {error && (
          <div className="bg-warning-bg border border-warning-border rounded-xl p-3 flex gap-2 text-warning-red text-xs font-semibold">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Field 1: Drug name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-primary-dark uppercase tracking-wide">
              Drug Name <span className="text-warning-red">*</span>
            </label>
            <input
              type="text"
              required
              value={drugName}
              onChange={(e) => setDrugName(e.target.value)}
              placeholder="e.g. Paracetamol, Amoxicillin"
              className="h-11 px-4 bg-neutral-bg text-sm font-semibold rounded-xl border border-primary/10 focus:outline-none focus:border-primary text-primary-dark"
            />
          </div>

          {/* Field 2: Patient complaint */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-primary-dark uppercase tracking-wide">
              Patient Complaint <span className="text-warning-red">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder="Describe the side effects (e.g. skin rash, severe nausea, headache)"
              className="p-3 bg-neutral-bg text-sm font-semibold rounded-xl border border-primary/10 focus:outline-none focus:border-primary text-primary-dark resize-none"
            />
          </div>

          {/* Field 3: Severity (Three large tap buttons) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-primary-dark uppercase tracking-wide">
              Severity Level <span className="text-warning-red">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Mild Button */}
              <button
                type="button"
                onClick={() => setSeverity("Mild")}
                className={`h-12 text-xs font-black rounded-xl border transition-all duration-150 flex items-center justify-center cursor-pointer ${
                  severity === "Mild"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                    : "bg-neutral-bg border-primary/10 text-primary-dark/60 hover:bg-neutral-bg/85"
                }`}
              >
                Mild
              </button>

              {/* Moderate Button */}
              <button
                type="button"
                onClick={() => setSeverity("Moderate")}
                className={`h-12 text-xs font-black rounded-xl border transition-all duration-150 flex items-center justify-center cursor-pointer ${
                  severity === "Moderate"
                    ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20"
                    : "bg-neutral-bg border-primary/10 text-primary-dark/60 hover:bg-neutral-bg/85"
                }`}
              >
                Moderate
              </button>

              {/* Severe Button */}
              <button
                type="button"
                onClick={() => setSeverity("Severe")}
                className={`h-12 text-xs font-black rounded-xl border transition-all duration-150 flex items-center justify-center cursor-pointer ${
                  severity === "Severe"
                    ? "bg-rose-50 border-warning-red text-warning-red ring-2 ring-warning-red/20"
                    : "bg-neutral-bg border-primary/10 text-primary-dark/60 hover:bg-neutral-bg/85"
                }`}
              >
                Severe
              </button>
            </div>
          </div>

          {/* Field 4: Patient age group (Dropdown) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-primary-dark uppercase tracking-wide">
              Patient Age Group <span className="text-warning-red">*</span>
            </label>
            <div className="relative">
              <select
                required
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value as any)}
                className="w-full h-11 px-4 bg-neutral-bg text-sm font-semibold rounded-xl border border-primary/10 focus:outline-none focus:border-primary text-primary-dark appearance-none"
              >
                <option value="" disabled>Select Age Group</option>
                <option value="Child">Child (0 - 12 yrs)</option>
                <option value="Adult">Adult (13 - 64 yrs)</option>
                <option value="Elderly">Elderly (65+ yrs)</option>
              </select>
              <svg 
                className="absolute right-3.5 top-3.5 w-4 h-4 text-primary-dark/60 pointer-events-none" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>

          {/* Field 5: Reporter name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-primary-dark uppercase tracking-wide">
              Reporter Name <span className="text-[10px] text-primary-dark/45 font-bold italic">(Optional)</span>
            </label>
            <input
              type="text"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              placeholder="Enter pharmacist name or initials"
              className="h-11 px-4 bg-neutral-bg text-sm font-semibold rounded-xl border border-primary/10 focus:outline-none focus:border-primary text-primary-dark"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="h-12 w-full bg-primary hover:bg-primary-hover text-white font-extrabold text-sm rounded-xl shadow-md transition-all active:scale-95 duration-150 flex items-center justify-center mt-3 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              "Submit Adverse Reaction Report"
            )}
          </button>
        </form>
      </section>

      {/* Developer Environment Alert */}
      {!process.env.NEXT_PUBLIC_APPS_SCRIPT_URL && (
        <div className="text-[10px] bg-yellow-50 text-yellow-800 border border-yellow-200/60 p-3.5 rounded-xl leading-relaxed font-semibold">
          <strong>Backend Setup:</strong> Submissions are currently running in simulation mode. To route inputs to Google Spreadsheets, set up a Google Apps Script Web App URL and add it to your <code>.env.local</code> file as <code>NEXT_PUBLIC_APPS_SCRIPT_URL</code>.
        </div>
      )}
    </div>
  );
}
