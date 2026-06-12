"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface FDAEventResult {
  term: string;
  count: number;
}

export default function Drugipedia() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [labelData, setLabelData] = useState<any>(null);
  const [eventData, setEventData] = useState<FDAEventResult[]>([]);
  
  // Accordion state to toggle sections on mobile
  const [activeTabs, setActiveTabs] = useState<{ [key: string]: boolean }>({
    dosage: false,
    contraindications: false,
    interactions: false,
    storage: false,
  });

  const toggleTab = (tab: string) => {
    setActiveTabs((prev) => ({ ...prev, [tab]: !prev[tab] }));
  };

  const quickSearchPills = [
    "Metformin",
    "Atorvastatin",
    "Amlodipine",
    "Tramadol",
    "Pioglitazone",
    "Amoxicillin",
  ];

  const handleSearch = (drugName: string) => {
    if (!drugName.trim()) return;
    setQuery(drugName);
    fetchDrugData(drugName);
  };

  const fetchDrugData = async (drugName: string) => {
    setLoading(true);
    setError(null);
    setLabelData(null);
    setEventData([]);

    try {
      // 1. Fetch Label info
      // Try generic name first
      let labelUrl = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(drugName)}"&limit=1`;
      let labelRes = await fetch(labelUrl);
      let labelJson = await labelRes.json();

      // Fallback 1: Try brand name
      if (labelJson.error) {
        labelUrl = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(drugName)}"&limit=1`;
        labelRes = await fetch(labelUrl);
        labelJson = await labelRes.json();
      }

      // Fallback 2: Try general free-text search
      if (labelJson.error) {
        labelUrl = `https://api.fda.gov/drug/label.json?search="${encodeURIComponent(drugName)}"&limit=1`;
        labelRes = await fetch(labelUrl);
        labelJson = await labelRes.json();
      }

      if (labelJson.error || !labelJson.results || labelJson.results.length === 0) {
        throw new Error(`No drug found matching "${drugName}". Please try a generic name like Metformin or Amoxicillin.`);
      }

      const result = labelJson.results[0];
      setLabelData(result);

      // 2. Fetch side effects (FAERS Events API)
      const sideEffectsUrl = `https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"${encodeURIComponent(drugName)}"&count=patient.reaction.reactionmeddrapt.exact&limit=8`;
      const eventRes = await fetch(sideEffectsUrl);
      const eventJson = await eventRes.json();

      if (!eventJson.error && eventJson.results) {
        setEventData(eventJson.results);
      } else {
        // Fallback search with generic name extracted from label
        const extractedGeneric = result.openfda?.generic_name?.[0];
        if (extractedGeneric) {
          const fallbackSideEffectsUrl = `https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"${encodeURIComponent(extractedGeneric)}"&count=patient.reaction.reactionmeddrapt.exact&limit=8`;
          const fbEventRes = await fetch(fallbackSideEffectsUrl);
          const fbEventJson = await fbEventRes.json();
          if (!fbEventJson.error && fbEventJson.results) {
            setEventData(fbEventJson.results);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  // Safe data extraction helper
  const getFieldText = (field: any) => {
    if (!field) return "";
    if (Array.isArray(field)) {
      // Filter out empty lines or titles and join paragraphs nicely
      return field.map(t => t.trim()).filter(t => t.length > 0).join("\n\n");
    }
    return String(field);
  };

  return (
    <div className="flex flex-col gap-5 py-2">
      {/* Search Section */}
      <section className="bg-white rounded-2xl p-5 border border-primary/10 shadow-sm flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-primary-dark">Drugipedia Search</h1>
          <p className="text-xs text-primary-dark/70 mt-1">
            Access real-time clinical definitions, indications, warnings, and patient reports from OpenFDA.
          </p>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter generic or brand name..."
              className="w-full h-12 pl-11 pr-4 bg-neutral-bg text-sm font-semibold rounded-xl border border-primary/10 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-primary-dark placeholder-primary-dark/40"
            />
            <svg 
              className="absolute left-3.5 top-3.5 w-5 h-5 text-primary-dark/40" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
            </svg>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="h-12 px-6 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary-hover active:scale-95 transition-all duration-150 flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              "Search"
            )}
          </button>
        </form>

        {/* Quick Search Pills */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-primary-dark/50">
            Quick-Search Drugs
          </span>
          <div className="flex flex-wrap gap-2">
            {quickSearchPills.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => handleSearch(pill)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-primary/15 bg-primary-light/30 hover:bg-primary-light hover:border-primary/40 text-primary transition-colors cursor-pointer"
              >
                {pill}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Loading state skeletal screen */}
      {loading && (
        <div className="bg-white rounded-2xl p-5 border border-primary/10 shadow-sm flex flex-col gap-4 animate-pulse">
          <div className="h-6 w-1/3 bg-primary-light/50 rounded-lg"></div>
          <div className="h-4 w-2/3 bg-neutral-bg rounded-lg"></div>
          <div className="h-24 w-full bg-neutral-bg rounded-xl"></div>
          <div className="h-16 w-full bg-warning-bg/50 rounded-xl"></div>
        </div>
      )}

      {/* Error state alert */}
      {error && !loading && (
        <div className="bg-warning-bg border border-warning-border rounded-2xl p-5 flex gap-3.5 text-warning-red shadow-sm">
          <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div className="flex-1">
            <h3 className="font-extrabold text-sm">Lookup Failed</h3>
            <p className="text-xs mt-1 font-medium leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Lookup results */}
      {labelData && !loading && (
        <div className="flex flex-col gap-4">
          {/* Header Card (Primary Details) */}
          <div className="bg-white rounded-2xl p-5 border border-primary/10 shadow-sm flex flex-col gap-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase bg-primary-light text-primary px-2 py-0.5 rounded-full">
                Generic Name
              </span>
              <h2 className="text-2xl font-black text-primary-dark mt-1">
                {labelData.openfda?.generic_name?.[0] || query}
              </h2>
            </div>

            {labelData.openfda?.brand_name && (
              <div>
                <span className="text-[10px] font-semibold text-primary-dark/50 uppercase block">
                  Common Brand Names (US/International)
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {labelData.openfda.brand_name.slice(0, 5).map((brand: string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-neutral-bg text-primary-dark border border-primary/5 px-2 py-0.5 text-xs font-semibold rounded"
                    >
                      {brand}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Indications & Usage */}
            {labelData.indications_and_usage && (
              <div className="border-t border-primary/5 pt-3">
                <span className="text-[10px] font-extrabold uppercase text-primary tracking-wider">
                  Indications & Usage
                </span>
                <p className="text-xs font-medium text-primary-dark/85 mt-1 leading-relaxed whitespace-pre-line">
                  {getFieldText(labelData.indications_and_usage)}
                </p>
              </div>
            )}
          </div>

          {/* Warnings Section - HIGHLIGHTED RED AS REQUESTED */}
          {labelData.warnings && (
            <div className="bg-warning-bg border border-warning-border rounded-2xl p-5 shadow-sm text-warning-red">
              <div className="flex items-center gap-2 font-black text-sm border-b border-warning-border/40 pb-2">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                CLINICAL WARNINGS & BOXED WARNINGS
              </div>
              <p className="text-xs font-semibold mt-2.5 leading-relaxed whitespace-pre-line">
                {getFieldText(labelData.warnings)}
              </p>
            </div>
          )}

          {/* Side Effects Event Count (FAERS Grid) */}
          <div className="bg-white rounded-2xl p-5 border border-primary/10 shadow-sm flex flex-col gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-primary-dark">
                Reported Side Effects (FAERS)
              </h3>
              <p className="text-[10px] text-primary-dark/60">
                Top 8 patient-reported reactions logged globally.
              </p>
            </div>

            {eventData.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 mt-1">
                {eventData.map((event, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-neutral-bg border border-primary/5 hover:border-primary/10 transition-colors flex flex-col"
                  >
                    <span className="text-xs font-bold text-primary-dark capitalize truncate">
                      {event.term.toLowerCase()}
                    </span>
                    <span className="text-[10px] font-semibold text-primary/80 mt-0.5">
                      {event.count.toLocaleString()} cases
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {/* Fallback to adverse_reactions text if events data is empty */}
                {labelData.adverse_reactions ? (
                  <p className="text-xs text-primary-dark/80 mt-1 leading-relaxed whitespace-pre-line">
                    {getFieldText(labelData.adverse_reactions)}
                  </p>
                ) : (
                  <p className="text-xs text-primary-dark/50 italic py-2">
                    No active side effects statistics reported.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Collapsible Accordion Sections */}
          <div className="flex flex-col gap-2.5">
            {/* Dosage & Administration */}
            {labelData.dosage_and_administration && (
              <div className="bg-white rounded-xl border border-primary/10 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleTab("dosage")}
                  className="w-full p-4 flex items-center justify-between text-left font-bold text-sm text-primary-dark hover:bg-primary-light/10 transition-colors"
                >
                  Dosage & Administration
                  <svg
                    className={`w-4 h-4 text-primary transition-transform duration-200 ${activeTabs.dosage ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {activeTabs.dosage && (
                  <div className="p-4 pt-0 text-xs text-primary-dark/80 border-t border-primary/5 whitespace-pre-line leading-relaxed">
                    {getFieldText(labelData.dosage_and_administration)}
                  </div>
                )}
              </div>
            )}

            {/* Contraindications */}
            {labelData.contraindications && (
              <div className="bg-white rounded-xl border border-primary/10 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleTab("contraindications")}
                  className="w-full p-4 flex items-center justify-between text-left font-bold text-sm text-primary-dark hover:bg-primary-light/10 transition-colors"
                >
                  Contraindications
                  <svg
                    className={`w-4 h-4 text-primary transition-transform duration-200 ${activeTabs.contraindications ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {activeTabs.contraindications && (
                  <div className="p-4 pt-0 text-xs text-primary-dark/80 border-t border-primary/5 whitespace-pre-line leading-relaxed">
                    {getFieldText(labelData.contraindications)}
                  </div>
                )}
              </div>
            )}

            {/* Drug Interactions */}
            {labelData.drug_interactions && (
              <div className="bg-white rounded-xl border border-primary/10 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleTab("interactions")}
                  className="w-full p-4 flex items-center justify-between text-left font-bold text-sm text-primary-dark hover:bg-primary-light/10 transition-colors"
                >
                  Drug Interactions
                  <svg
                    className={`w-4 h-4 text-primary transition-transform duration-200 ${activeTabs.interactions ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {activeTabs.interactions && (
                  <div className="p-4 pt-0 text-xs text-primary-dark/80 border-t border-primary/5 whitespace-pre-line leading-relaxed">
                    {getFieldText(labelData.drug_interactions)}
                  </div>
                )}
              </div>
            )}

            {/* Storage & Handling */}
            {labelData.storage_and_handling && (
              <div className="bg-white rounded-xl border border-primary/10 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleTab("storage")}
                  className="w-full p-4 flex items-center justify-between text-left font-bold text-sm text-primary-dark hover:bg-primary-light/10 transition-colors"
                >
                  Storage & Handling
                  <svg
                    className={`w-4 h-4 text-primary transition-transform duration-200 ${activeTabs.storage ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {activeTabs.storage && (
                  <div className="p-4 pt-0 text-xs text-primary-dark/80 border-t border-primary/5 whitespace-pre-line leading-relaxed">
                    {getFieldText(labelData.storage_and_handling)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
