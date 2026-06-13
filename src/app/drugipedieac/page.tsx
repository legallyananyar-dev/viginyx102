"use client";

import { useState } from "react";

interface FDAEventResult {
  term: string;
  count: number;
}

// Severity color for event bars
function getEventColor(idx: number): string {
  const colors = [
    "#D62839",
    "#E85D04",
    "#F48C06",
    "#FCBF49",
    "#1B4332",
    "#2D6A4F",
    "#52B788",
    "#74C69D",
  ];
  return colors[idx] || "#1B4332";
}

// Compact info pill
function InfoPill({
  label,
  value,
}: {
  label: string;
  value: string | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[9px] font-black uppercase tracking-widest text-[#0D1F17]/40">
        {label}
      </span>
      <span className="text-xs font-semibold text-[#0D1F17]/80 truncate">
        {value}
      </span>
    </div>
  );
}

// Collapsible section
function CollapseSection({
  title,
  children,
  defaultOpen = false,
  accent = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accent?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        accent
          ? "border-[#D62839]/20 bg-[#FFF0F2]"
          : "border-[#1B4332]/8 bg-white"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span
          className={`text-xs font-black uppercase tracking-wide ${
            accent ? "text-[#D62839]" : "text-[#0D1F17]/70"
          }`}
        >
          {title}
        </span>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          } ${accent ? "text-[#D62839]" : "text-[#1B4332]"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>
      {open && (
        <div
          className={`px-4 pb-4 text-xs leading-relaxed whitespace-pre-line border-t ${
            accent
              ? "text-[#D62839]/80 border-[#D62839]/10"
              : "text-[#0D1F17]/70 border-[#1B4332]/6"
          }`}
        >
          <div className="pt-3">{children}</div>
        </div>
      )}
    </div>
  );
}

const QUICK_DRUGS = [
  "Metformin",
  "Atorvastatin",
  "Amlodipine",
  "Amoxicillin",
  "Paracetamol",
  "Tramadol",
];

export default function DrugipediaCompact() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [labelData, setLabelData] = useState<any>(null);
  const [eventData, setEventData] = useState<FDAEventResult[]>([]);
  const [searched, setSearched] = useState("");

  const getFieldText = (field: any): string => {
    if (!field) return "";
    if (Array.isArray(field))
      return field
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .join("\n\n");
    return String(field);
  };

  const fetchDrug = async (drugName: string) => {
    if (!drugName.trim()) return;
    setLoading(true);
    setError(null);
    setLabelData(null);
    setEventData([]);
    setSearched(drugName);

    try {
      // Label lookup with 3-tier fallback
      let labelJson: any = { error: true };
      for (const searchStr of [
        `openfda.generic_name:"${encodeURIComponent(drugName)}"`,
        `openfda.brand_name:"${encodeURIComponent(drugName)}"`,
        `"${encodeURIComponent(drugName)}"`,
      ]) {
        const res = await fetch(
          `https://api.fda.gov/drug/label.json?search=${searchStr}&limit=1`
        );
        labelJson = await res.json();
        if (!labelJson.error && labelJson.results?.length > 0) break;
      }

      if (labelJson.error || !labelJson.results?.length) {
        throw new Error(
          `No data found for "${drugName}". Try a generic name like Metformin.`
        );
      }

      const result = labelJson.results[0];
      setLabelData(result);

      // Events
      const evRes = await fetch(
        `https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"${encodeURIComponent(drugName)}"&count=patient.reaction.reactionmeddrapt.exact&limit=8`
      );
      const evJson = await evRes.json();
      if (!evJson.error && evJson.results) {
        setEventData(evJson.results);
      } else {
        // fallback to generic
        const gen = result.openfda?.generic_name?.[0];
        if (gen) {
          const fb = await fetch(
            `https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"${encodeURIComponent(gen)}"&count=patient.reaction.reactionmeddrapt.exact&limit=8`
          );
          const fbJson = await fb.json();
          if (!fbJson.error && fbJson.results) setEventData(fbJson.results);
        }
      }
    } catch (err: any) {
      setError(err.message || "Lookup failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (name: string) => {
    setQuery(name);
    fetchDrug(name);
  };

  return (
    <div className="flex flex-col gap-4 py-2">
      {/* Compact Search */}
      <section className="bg-white rounded-2xl p-4 border border-[#1B4332]/10 shadow-sm flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
              placeholder="Generic or brand name..."
              className="w-full h-11 pl-10 pr-3 bg-[#F4F7F6] text-sm font-semibold rounded-xl border border-[#1B4332]/10 focus:outline-none focus:border-[#1B4332] text-[#0D1F17] placeholder-[#0D1F17]/30"
            />
            <svg
              className="absolute left-3 top-3 w-5 h-5 text-[#0D1F17]/30"
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
          </div>
          <button
            type="button"
            onClick={() => handleSearch(query)}
            disabled={loading}
            className="h-11 px-5 rounded-xl bg-[#1B4332] text-white font-bold text-sm hover:bg-[#0D1F17] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Search"
            )}
          </button>
        </div>

        {/* Quick pills */}
        <div className="flex flex-wrap gap-1.5">
          {QUICK_DRUGS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleSearch(d)}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#1B4332]/15 bg-[#D8F3DC]/40 hover:bg-[#D8F3DC] text-[#1B4332] transition-colors"
            >
              {d}
            </button>
          ))}
        </div>
      </section>

      {/* Error */}
      {error && !loading && (
        <div className="bg-[#FFF0F2] border border-[#FFCCD5] rounded-2xl p-4 flex gap-3 text-[#D62839] text-xs font-semibold">
          <svg
            className="w-4 h-4 shrink-0 mt-0.5"
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

      {/* Skeleton */}
      {loading && (
        <div className="flex flex-col gap-3 animate-pulse">
          <div className="h-20 bg-white rounded-2xl border border-[#1B4332]/8" />
          <div className="h-32 bg-white rounded-2xl border border-[#1B4332]/8" />
          <div className="h-24 bg-white rounded-2xl border border-[#1B4332]/8" />
        </div>
      )}

      {/* Results */}
      {labelData && !loading && (
        <div className="flex flex-col gap-3">
          {/* Drug identity card */}
          <div className="bg-white rounded-2xl p-4 border border-[#1B4332]/10 shadow-sm flex flex-col gap-3">
            {/* Name + badge row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#1B4332] bg-[#D8F3DC] px-2 py-0.5 rounded-full">
                  Generic
                </span>
                <h2 className="text-xl font-black text-[#0D1F17] mt-1 leading-tight capitalize">
                  {labelData.openfda?.generic_name?.[0]?.toLowerCase() ||
                    searched}
                </h2>
              </div>
              {labelData.openfda?.product_type?.[0] && (
                <span className="text-[9px] font-bold uppercase bg-[#F4F7F6] text-[#0D1F17]/50 px-2 py-1 rounded-lg shrink-0">
                  {labelData.openfda.product_type[0]}
                </span>
              )}
            </div>

            {/* Metadata grid */}
            {labelData.openfda?.brand_name && (
              <div className="flex flex-wrap gap-1.5">
                {labelData.openfda.brand_name.slice(0, 4).map(
                  (b: string, i: number) => (
                    <span
                      key={i}
                      className="text-[11px] font-semibold bg-[#F4F7F6] text-[#0D1F17]/60 border border-[#1B4332]/8 px-2 py-0.5 rounded"
                    >
                      {b}
                    </span>
                  )
                )}
              </div>
            )}

            {/* Route + manufacturer in a row */}
            <div className="flex gap-4 flex-wrap">
              <InfoPill
                label="Route"
                value={labelData.openfda?.route?.[0]}
              />
              <InfoPill
                label="Manufacturer"
                value={labelData.openfda?.manufacturer_name?.[0]}
              />
              <InfoPill
                label="Substance"
                value={labelData.openfda?.substance_name?.[0]}
              />
            </div>

            {/* Indications inline — short */}
            {labelData.indications_and_usage && (
              <div className="border-t border-[#1B4332]/6 pt-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#1B4332]">
                  Indications
                </span>
                <p className="text-xs text-[#0D1F17]/75 mt-1.5 leading-relaxed line-clamp-4">
                  {getFieldText(labelData.indications_and_usage)}
                </p>
              </div>
            )}
          </div>

          {/* FAERS events — horizontal bar chart */}
          {eventData.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-[#1B4332]/10 shadow-sm">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#1B4332]">
                  FAERS Adverse Events
                </span>
                <span className="text-[9px] text-[#0D1F17]/40 font-medium">
                  Top 8 · global reports
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {eventData.map((ev, idx) => {
                  const maxCount = eventData[0].count;
                  const pct = Math.round((ev.count / maxCount) * 100);
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-[#0D1F17]/70 capitalize w-36 shrink-0 truncate">
                        {ev.term.toLowerCase()}
                      </span>
                      <div className="flex-1 h-2 bg-[#F4F7F6] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: getEventColor(idx),
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-[#0D1F17]/40 w-10 text-right shrink-0">
                        {ev.count >= 1000
                          ? `${(ev.count / 1000).toFixed(1)}k`
                          : ev.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Warnings — always shown first, red */}
          {labelData.warnings && (
            <CollapseSection title="⚠ Warnings & Boxed Warnings" accent defaultOpen>
              {getFieldText(labelData.warnings)}
            </CollapseSection>
          )}

          {/* Other collapsible sections */}
          {[
            { key: "dosage_and_administration", label: "Dosage & Administration" },
            { key: "contraindications", label: "Contraindications" },
            { key: "drug_interactions", label: "Drug Interactions" },
            { key: "adverse_reactions", label: "Adverse Reactions (Label)" },
            { key: "storage_and_handling", label: "Storage & Handling" },
          ]
            .filter(({ key }) => labelData[key])
            .map(({ key, label }) => (
              <CollapseSection key={key} title={label}>
                {getFieldText(labelData[key])}
              </CollapseSection>
            ))}
        </div>
      )}
    </div>
  );
}
