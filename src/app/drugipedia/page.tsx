"use client";

import { useState } from "react";

interface FDAEventResult {
  term: string;
  count: number;
}

type TabKey = "overview" | "dosage" | "safety" | "interactions";

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

// Title-case helper for MedDRA terms (e.g. "NAUSEA" -> "Nausea")
function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
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

// Section block - replaces the old collapsibles with a flatter, always-visible card
function InfoSection({
  title,
  children,
  accent = false,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        accent
          ? "border-[#D62839]/20 bg-[#FFF0F2]"
          : "border-[#1B4332]/8 bg-white"
      }`}
    >
      <div className="px-4 py-3 flex items-center gap-2 border-b border-current/5">
        {icon && (
          <span className={accent ? "text-[#D62839]" : "text-[#1B4332]"}>
            {icon}
          </span>
        )}
        <span
          className={`text-xs font-black uppercase tracking-wide ${
            accent ? "text-[#D62839]" : "text-[#0D1F17]/70"
          }`}
        >
          {title}
        </span>
      </div>
      <div
        className={`px-4 py-3 text-[13px] leading-relaxed whitespace-pre-line ${
          accent ? "text-[#D62839]/80" : "text-[#0D1F17]/75"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

// Empty-state for tabs with no data
function EmptyTab({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#1B4332]/8 p-6 text-center">
      <p className="text-xs text-[#0D1F17]/40 font-semibold">{message}</p>
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

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "dosage", label: "Dosage" },
  { key: "safety", label: "Safety" },
  { key: "interactions", label: "Interactions" },
];

export default function DrugipediaPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [labelData, setLabelData] = useState<any>(null);
  const [eventData, setEventData] = useState<FDAEventResult[]>([]);
  const [searched, setSearched] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

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
    setActiveTab("overview");

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

  // Precompute which tabs have content, for badges
  const hasWarnings = !!labelData?.warnings || !!labelData?.boxed_warning;
  const hasContraindications = !!labelData?.contraindications;
  const hasAdverseReactions = !!labelData?.adverse_reactions;
  const hasDosage = !!labelData?.dosage_and_administration;
  const hasStorage = !!labelData?.storage_and_handling;
  const hasInteractions = !!labelData?.drug_interactions;

  const safetyFlagCount =
    (hasWarnings ? 1 : 0) +
    (hasContraindications ? 1 : 0) +
    (hasAdverseReactions ? 1 : 0);

  return (
    <div className="flex flex-col gap-4 py-2">
      {/* Search */}
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
          <div className="h-24 bg-white rounded-2xl border border-[#1B4332]/8" />
          <div className="h-10 bg-white rounded-xl border border-[#1B4332]/8" />
          <div className="h-40 bg-white rounded-2xl border border-[#1B4332]/8" />
        </div>
      )}

      {/* Results */}
      {labelData && !loading && (
        <div className="flex flex-col gap-3">
          {/* Drug identity card - the "at a glance" header */}
          <div className="bg-white rounded-2xl p-4 border border-[#1B4332]/10 shadow-sm flex flex-col gap-3">
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

            {/* Brand names */}
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

            {/* Route + manufacturer + substance */}
            <div className="flex gap-4 flex-wrap pt-1 border-t border-[#1B4332]/6">
              <InfoPill label="Route" value={labelData.openfda?.route?.[0]} />
              <InfoPill
                label="Manufacturer"
                value={labelData.openfda?.manufacturer_name?.[0]}
              />
              <InfoPill
                label="Substance"
                value={labelData.openfda?.substance_name?.[0]}
              />
            </div>

            {/* Safety flag summary - quick visual warning if applicable */}
            {safetyFlagCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("safety")}
                className="flex items-center gap-2 bg-[#FFF0F2] border border-[#D62839]/15 rounded-lg px-3 py-2 text-left hover:bg-[#FFE5E9] transition-colors"
              >
                <svg
                  className="w-4 h-4 text-[#D62839] shrink-0"
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
                <span className="text-[11px] font-bold text-[#D62839]">
                  {safetyFlagCount} safety note
                  {safetyFlagCount > 1 ? "s" : ""} — tap Safety tab to review
                </span>
              </button>
            )}
          </div>

          {/* Tab bar */}
          <div className="bg-white rounded-xl border border-[#1B4332]/8 p-1 flex gap-1 shadow-sm">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              let showBadge = false;
              if (tab.key === "safety" && safetyFlagCount > 0) showBadge = true;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex-1 h-9 rounded-lg text-xs font-black transition-all duration-150 ${
                    isActive
                      ? "bg-[#1B4332] text-white shadow-sm"
                      : "text-[#0D1F17]/50 hover:text-[#0D1F17] hover:bg-[#F4F7F6]"
                  }`}
                >
                  {tab.label}
                  {showBadge && (
                    <span
                      className={`absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full ${
                        isActive ? "bg-[#FCBF49]" : "bg-[#D62839]"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="flex flex-col gap-3">
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <>
                {labelData.indications_and_usage ? (
                  <InfoSection
                    title="What it's used for"
                    icon={
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    }
                  >
                    {getFieldText(labelData.indications_and_usage)}
                  </InfoSection>
                ) : (
                  <EmptyTab message="No indication/usage information available for this product." />
                )}

                {/* FAERS events — plain-language framing */}
                {eventData.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 border border-[#1B4332]/10 shadow-sm">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-xs font-black uppercase tracking-wide text-[#0D1F17]/70">
                        Commonly reported side effects
                      </span>
                    </div>
                    <p className="text-[11px] text-[#0D1F17]/40 font-medium mb-3">
                      Based on global patient reports (FAERS) — not specific
                      to this manufacturer or dose.
                    </p>
                    <div className="flex flex-col gap-2">
                      {eventData.map((ev, idx) => {
                        const maxCount = eventData[0].count;
                        const pct = Math.round((ev.count / maxCount) * 100);
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold text-[#0D1F17]/70 w-32 shrink-0 truncate">
                              {titleCase(ev.term)}
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
              </>
            )}

            {/* DOSAGE TAB */}
            {activeTab === "dosage" && (
              <>
                {hasDosage ? (
                  <InfoSection
                    title="Dosage & Administration"
                    icon={
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a7.696 7.696 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
                        />
                      </svg>
                    }
                  >
                    {getFieldText(labelData.dosage_and_administration)}
                  </InfoSection>
                ) : (
                  <EmptyTab message="No dosage information available for this product." />
                )}

                {hasStorage && (
                  <InfoSection
                    title="Storage & Handling"
                    icon={
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                        />
                      </svg>
                    }
                  >
                    {getFieldText(labelData.storage_and_handling)}
                  </InfoSection>
                )}
              </>
            )}

            {/* SAFETY TAB */}
            {activeTab === "safety" && (
              <>
                {hasWarnings && (
                  <InfoSection
                    title="Warnings & Boxed Warnings"
                    accent
                    icon={
                      <svg
                        className="w-4 h-4"
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
                    }
                  >
                    {getFieldText(labelData.warnings || labelData.boxed_warning)}
                  </InfoSection>
                )}

                {hasContraindications && (
                  <InfoSection
                    title="Contraindications"
                    accent
                    icon={
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                        />
                      </svg>
                    }
                  >
                    {getFieldText(labelData.contraindications)}
                  </InfoSection>
                )}

                {hasAdverseReactions && (
                  <InfoSection
                    title="Adverse Reactions (Label)"
                    icon={
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
                        />
                      </svg>
                    }
                  >
                    {getFieldText(labelData.adverse_reactions)}
                  </InfoSection>
                )}

                {!hasWarnings && !hasContraindications && !hasAdverseReactions && (
                  <EmptyTab message="No specific warnings, contraindications, or adverse reactions listed for this product." />
                )}
              </>
            )}

            {/* INTERACTIONS TAB */}
            {activeTab === "interactions" && (
              <>
                {hasInteractions ? (
                  <InfoSection
                    title="Drug Interactions"
                    accent
                    icon={
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                        />
                      </svg>
                    }
                  >
                    {getFieldText(labelData.drug_interactions)}
                  </InfoSection>
                ) : (
                  <EmptyTab message="No documented drug interactions for this product. Always cross-check with the patient's full medication list." />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* No-search empty state */}
      {!labelData && !loading && !error && (
        <div className="bg-white rounded-2xl border border-[#1B4332]/8 p-8 text-center flex flex-col items-center gap-2">
          <svg
            className="w-8 h-8 text-[#1B4332]/20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z"
            />
          </svg>
          <p className="text-xs text-[#0D1F17]/40 font-semibold max-w-xs">
            Search a generic or brand name above, or tap one of the quick
            picks to see its overview, dosage, safety notes, and reported
            side effects.
          </p>
        </div>
      )}
    </div>
  );
}
