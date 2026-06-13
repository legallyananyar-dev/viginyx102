"use client";

import { useState, useRef, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  createPatientRecord,
  subscribeToPatients,
  updatePatientRecord,
  type Answer,
  type PatientRecord,
} from "@/lib/patientStore";

// ── Types ──────────────────────────────────────────────────────────────────────
type Role = "pharmacist" | "patient" | null;
type Screen =
  | "landing"
  | "pharmacist-dashboard"
  | "add-patient"
  | "patient-room"
  | "patient-login"
  | "patient-chat";

interface ChatMsg {
  role: "bot" | "patient";
  text: string;
  ts: Date;
}

// ── MVP drug list ──────────────────────────────────────────────────────────────
const MVP_DRUGS = [
  "Metformin",
  "Atorvastatin",
  "Amlodipine",
  "Amoxicillin",
  "Paracetamol",
];

// ── ADR questions per drug ─────────────────────────────────────────────────────
const DRUG_QUESTIONS: Record<string, string[]> = {
  Metformin: [
    "क्या आपको पेट में दर्द या मतली हो रही है? / Are you experiencing stomach pain or nausea?",
    "क्या आपको लूज़ मोशन हो रहे हैं? / Are you having loose motions or diarrhea?",
    "क्या आपको चक्कर आ रहे हैं? / Do you feel dizzy or lightheaded?",
    "क्या आपका खाना ठीक से खाया जा रहा है? / Are you eating your meals regularly?",
    "क्या आपको सांस लेने में कोई तकलीफ है? / Any difficulty breathing?",
  ],
  Atorvastatin: [
    "क्या आपको मांसपेशियों में दर्द है? / Do you have muscle pain or weakness?",
    "क्या आपकी पेशाब का रंग बदल गया है (गहरा)? / Has your urine become dark-colored?",
    "क्या आपको जोड़ों में दर्द है? / Do you have joint pain?",
    "क्या आपको थकान ज़्यादा लग रही है? / Are you feeling unusually tired?",
    "क्या आपको पेट में दाहिनी तरफ दर्द है? / Any pain on the right side of your abdomen?",
  ],
  Amlodipine: [
    "क्या आपके पैरों में सूजन है? / Do you have swelling in your feet or ankles?",
    "क्या आपको सिर दर्द हो रहा है? / Are you having headaches?",
    "क्या आपका चेहरा लाल हो जाता है (flushing)? / Do you experience flushing or redness of face?",
    "क्या आपको दिल तेज़ धड़कने जैसा लगता है? / Do you feel your heart racing (palpitations)?",
    "क्या आपको थकान और कमज़ोरी है? / Are you feeling fatigued or weak?",
  ],
  Amoxicillin: [
    "क्या आपको दाने या खुजली है? / Do you have any rash or itching?",
    "क्या आपके होंठ या गले में सूजन है? / Any swelling in lips or throat?",
    "क्या आपको दस्त हो रहे हैं? / Are you experiencing diarrhea?",
    "क्या आपको पेट में दर्द है? / Do you have stomach pain?",
    "क्या आपको सांस लेने में कोई तकलीफ है? / Any difficulty breathing or wheezing?",
  ],
  Paracetamol: [
    "क्या आपको पीलिया के लक्षण हैं (आँखें या त्वचा पीली)? / Any jaundice symptoms (yellow eyes or skin)?",
    "क्या आपको पेट के ऊपरी हिस्से में दर्द है? / Pain in the upper abdomen?",
    "क्या आपको मतली या उल्टी है? / Any nausea or vomiting?",
    "क्या आप दिन में कितनी बार दवा लेते हैं? (ज़्यादा न लें) / How many times a day are you taking it? (Don't exceed prescribed dose)",
    "क्या आप शराब का सेवन कर रहे हैं? / Are you consuming alcohol?",
  ],
};

// Flag keywords — simple heuristic
const FLAG_KEYWORDS = [
  "हाँ", "yes", "haan", "ha", "ji", "bilkul", "sure", "ya", "y",
  "दर्द", "pain", "सूजन", "swelling", "pita", "dard", "yes there",
];

function isFlagged(answer: string): boolean {
  const low = answer.toLowerCase();
  return FLAG_KEYWORDS.some((k) => low.includes(k));
}

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ── Severity badge ─────────────────────────────────────────────────────────────
type Patient = PatientRecord;

function StatusBadge({ status }: { status: Patient["status"] }) {
  const map = {
    active: "bg-blue-50 text-blue-700 border-blue-200",
    flagged: "bg-red-50 text-red-700 border-red-200",
    completed: "bg-green-50 text-green-700 border-green-200",
  };
  return (
    <span
      className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${map[status]}`}
    >
      {status}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function VigiRoom() {
  const [role, setRole] = useState<Role>(null);
  const [screen, setScreen] = useState<Screen>("landing");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [ownerEmail, setOwnerEmail] = useState(
    auth.currentUser?.email?.toLowerCase() || "mvp@viginyx.local",
  );

  // Add patient form
  const [form, setForm] = useState({ name: "", age: "", drug: "", phone: "" });

  // Patient login
  const [patientCode, setPatientCode] = useState("");
  const [patientFound, setPatientFound] = useState<Patient | null>(null);
  const [loginError, setLoginError] = useState("");

  // Chat
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatDone, setChatDone] = useState(false);
  const [collectedAnswers, setCollectedAnswers] = useState<Answer[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setOwnerEmail(user?.email?.toLowerCase() || "mvp@viginyx.local");
    });
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToPatients(ownerEmail, (nextPatients) => {
      setPatients(nextPatients as Patient[]);
      if (selectedPatient) {
        const refreshed = nextPatients.find((patient) => patient.code === selectedPatient.code);
        if (refreshed) {
          setSelectedPatient(refreshed as Patient);
        }
      }
      if (patientFound) {
        const refreshed = nextPatients.find((patient) => patient.code === patientFound.code);
        if (refreshed) {
          setPatientFound(refreshed as Patient);
        }
      }
    });

    return () => unsubscribe();
  }, [patientFound, selectedPatient]);

  // ── Pharmacist: add patient ────────────────────────────────────────────────
  const handleAddPatient = async () => {
    if (!form.name || !form.age || !form.drug) return;
    const p: Omit<Patient, "id"> = {
      ownerEmail,
      code: generateCode(),
      name: form.name,
      age: form.age,
      drug: form.drug,
      phone: form.phone,
      registeredAt: new Date().toISOString(),
      status: "active",
      answers: [],
    };
    await createPatientRecord(ownerEmail, p);
    setForm({ name: "", age: "", drug: "", phone: "" });
    setScreen("pharmacist-dashboard");
  };

  // ── Patient login ──────────────────────────────────────────────────────────
  const handlePatientLogin = () => {
    const found = patients.find((p) => p.code === patientCode.toUpperCase().trim());
    if (found) {
      setPatientFound(found);
      setLoginError("");
      initChat(found);
      setScreen("patient-chat");
    } else {
      setLoginError("Invalid code. Please check with your pharmacist.");
    }
  };

  // ── Init chat with first question ──────────────────────────────────────────
  const initChat = (p: Patient) => {
    const questions = DRUG_QUESTIONS[p.drug] || [];
    setCurrentQ(0);
    setCollectedAnswers([]);
    setChatDone(false);
    setMessages([
      {
        role: "bot",
        text: `नमस्ते ${p.name}! / Hello ${p.name}! I'm VigiBot — your Viginyx ADR assistant.\n\nमैं आपसे ${p.drug} के बारे में कुछ सवाल पूछूँगा। / I'll ask you a few questions about your ${p.drug} experience.\n\nकृपया हाँ/नहीं में जवाब दें। / Please answer yes/no or describe how you feel.\n\n${questions[0]}`,
        ts: new Date(),
      },
    ]);
  };

  // ── Handle patient reply ───────────────────────────────────────────────────
  const handlePatientReply = async () => {
    if (!chatInput.trim() || !patientFound || chatDone) return;
    const userText = chatInput.trim();
    setChatInput("");

    const questions = DRUG_QUESTIONS[patientFound.drug] || [];
    const flagged = isFlagged(userText);

    const newAnswer: Answer = {
      q: questions[currentQ],
      a: userText,
      flag: flagged,
    };
    const updatedAnswers = [...collectedAnswers, newAnswer];
    setCollectedAnswers(updatedAnswers);

    setMessages((prev) => [
      ...prev,
      { role: "patient", text: userText, ts: new Date() },
    ]);

    const nextQ = currentQ + 1;
    setCurrentQ(nextQ);

    if (nextQ >= questions.length) {
      // Done — summarise
      setChatLoading(true);
      const flagCount = updatedAnswers.filter((a) => a.flag).length;

      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 1000,
            messages: [
              {
                role: "user",
                content: `You are VigiBot, a pharmacovigilance assistant. A patient named ${patientFound.name} (age ${patientFound.age}) is taking ${patientFound.drug}. 

They answered these ADR screening questions:
${updatedAnswers.map((a, i) => `Q${i + 1}: ${a.q}\nAnswer: ${a.a}`).join("\n\n")}

${flagCount > 0 ? `${flagCount} answers suggest possible ADR symptoms.` : "No major symptoms flagged."}

Write a brief, warm closing message (2-3 sentences) in simple bilingual Hindi + English telling the patient:
1. Thank them for completing the check-in
2. Whether their pharmacist will be notified (yes if flagCount > 0)
3. One simple safety reminder relevant to ${patientFound.drug}

Keep it warm, simple, and under 80 words total.`,
              },
            ],
          }),
        });

        const data = await res.json();
        const botReply =
          data.content?.[0]?.text ||
          `आपका check-in पूरा हुआ। / Your check-in is complete. ${flagCount > 0 ? "Your pharmacist has been notified about your symptoms." : "Everything looks okay. Keep taking your medicine as prescribed."}`;

        setMessages((prev) => [
          ...prev,
          { role: "bot", text: botReply, ts: new Date() },
        ]);

        // Update patient record
        const finalStatus: Patient["status"] = flagCount >= 2 ? "flagged" : "completed";
        await updatePatientRecord(ownerEmail, patientFound.code, {
          status: finalStatus,
          answers: updatedAnswers,
          summary: botReply,
        });
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: "आपका check-in पूरा हुआ। / Your check-in is complete. Thank you for your responses.",
            ts: new Date(),
          },
        ]);
      } finally {
        setChatLoading(false);
        setChatDone(true);
      }
    } else {
      // Next question with contextual ack
      const acks = flagged
        ? ["समझा। / Understood. ", "ठीक है। / I see. ", "नोट किया। / Noted. "]
        : ["अच्छा। / Good. ", "ठीक है। / Okay. ", "ध्यान रखें। / Keep monitoring. "];
      const ack = acks[Math.floor(Math.random() * acks.length)];

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: `${ack}\n\n${questions[nextQ]}`,
            ts: new Date(),
          },
        ]);
      }, 400);
    }
  };

  // ── SCREENS ────────────────────────────────────────────────────────────────

  if (screen === "landing") {
    return (
      <div className="flex flex-col gap-6 py-2">
        <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] rounded-2xl p-6 text-white">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#74C69D] animate-pulse" />
            New · VigiRoom
          </div>
          <h1 className="text-2xl font-black leading-tight mb-2">
            Patient-pharmacist<br />ADR monitoring room
          </h1>
          <p className="text-sm text-white/70 leading-relaxed">
            Register patients, send them a code, and let VigiBot collect bilingual ADR check-ins automatically.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => { setRole("pharmacist"); setScreen("pharmacist-dashboard"); }}
            className="bg-[#1B4332] text-white rounded-2xl p-5 flex items-center gap-4 hover:bg-[#0D1F17] transition-colors active:scale-95"
          >
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-black text-base">Pharmacist Login</div>
              <div className="text-white/60 text-xs font-medium mt-0.5">Register patients · View ADR reports</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { setRole("patient"); setScreen("patient-login"); }}
            className="bg-white border border-[#1B4332]/15 rounded-2xl p-5 flex items-center gap-4 hover:bg-[#F4F7F6] transition-colors active:scale-95"
          >
            <div className="w-12 h-12 rounded-xl bg-[#D8F3DC] flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-[#1B4332]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-black text-base text-[#0D1F17]">Patient Check-in</div>
              <div className="text-[#0D1F17]/50 text-xs font-medium mt-0.5">Enter your code · Chat with VigiBot</div>
            </div>
          </button>
        </div>

        <div className="bg-[#F4F7F6] rounded-xl p-4 border border-[#1B4332]/8">
          <div className="text-[9px] font-black uppercase tracking-widest text-[#1B4332]/50 mb-2">How it works</div>
          {[
            { n: "1", t: "Pharmacist registers patient & picks their drug" },
            { n: "2", t: "Patient receives a unique 6-character code" },
            { n: "3", t: "VigiBot asks bilingual ADR questions via chat" },
            { n: "4", t: "Pharmacist sees flagged responses in real time" },
          ].map((s) => (
            <div key={s.n} className="flex items-start gap-3 mb-2 last:mb-0">
              <span className="w-5 h-5 rounded-full bg-[#1B4332] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{s.n}</span>
              <span className="text-xs text-[#0D1F17]/70 font-medium">{s.t}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (screen === "pharmacist-dashboard") {
    const flagged = patients.filter((p) => p.status === "flagged").length;
    return (
      <div className="flex flex-col gap-4 py-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-[#0D1F17]">VigiRoom</h2>
            <p className="text-xs text-[#0D1F17]/50 font-medium">{patients.length} registered · {flagged} flagged</p>
          </div>
          <button
            type="button"
            onClick={() => setScreen("add-patient")}
            className="h-9 px-4 bg-[#1B4332] text-white rounded-xl text-xs font-black hover:bg-[#0D1F17] transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Patient
          </button>
        </div>

        {flagged > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div className="text-xs font-bold text-red-700">{flagged} patient{flagged > 1 ? "s" : ""} flagged for possible ADR — review below</div>
          </div>
        )}

        {patients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#1B4332]/8 p-8 text-center">
            <p className="text-xs text-[#0D1F17]/40 font-semibold">No patients registered yet.<br />Tap "Add Patient" to get started.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {patients.map((p) => (
              <button
                key={p.code}
                type="button"
                onClick={() => { setSelectedPatient(p); setScreen("patient-room"); }}
                className="bg-white border border-[#1B4332]/10 rounded-2xl p-4 text-left hover:border-[#1B4332]/30 transition-colors w-full"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-black text-sm text-[#0D1F17]">{p.name}</div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] font-bold text-[#0D1F17]/50">{p.drug}</span>
                  <span className="text-[10px] font-bold text-[#0D1F17]/30">·</span>
                  <span className="text-[10px] font-bold text-[#0D1F17]/50">Age {p.age}</span>
                  <span className="text-[10px] font-bold text-[#0D1F17]/30">·</span>
                  <span className="font-black text-[10px] text-[#1B4332] bg-[#D8F3DC] px-2 py-0.5 rounded-full">Code: {p.code}</span>
                </div>
                {p.answers && p.answers.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#1B4332]/6 text-[10px] text-[#0D1F17]/50 font-medium">
                    {p.answers.filter((a) => a.flag).length} symptoms flagged of {p.answers.length} questions answered
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setScreen("landing")}
          className="text-xs text-[#0D1F17]/40 font-semibold text-center py-2"
        >
          ← Back to home
        </button>
      </div>
    );
  }

  if (screen === "add-patient") {
    return (
      <div className="flex flex-col gap-4 py-2">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setScreen("pharmacist-dashboard")} className="w-8 h-8 rounded-xl bg-[#F4F7F6] flex items-center justify-center">
            <svg className="w-4 h-4 text-[#0D1F17]/60" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h2 className="font-black text-lg text-[#0D1F17]">Register Patient</h2>
        </div>

        <div className="bg-white rounded-2xl border border-[#1B4332]/10 shadow-sm p-5 flex flex-col gap-4">
          {[
            { label: "Patient Full Name *", key: "name", placeholder: "e.g. Ramesh Sharma", type: "text" },
            { label: "Age *", key: "age", placeholder: "e.g. 54", type: "number" },
            { label: "Phone (optional)", key: "phone", placeholder: "e.g. 9876543210", type: "tel" },
          ].map((f) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wide text-[#0D1F17]/60">{f.label}</label>
              <input
                type={f.type}
                value={(form as any)[f.key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="h-11 px-4 bg-[#F4F7F6] rounded-xl border border-[#1B4332]/10 text-sm font-semibold text-[#0D1F17] focus:outline-none focus:border-[#1B4332] transition-all placeholder-[#0D1F17]/30"
              />
            </div>
          ))}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wide text-[#0D1F17]/60">Drug Dispensed *</label>
            <select
              value={form.drug}
              onChange={(e) => setForm((prev) => ({ ...prev, drug: e.target.value }))}
              className="h-11 px-4 bg-[#F4F7F6] rounded-xl border border-[#1B4332]/10 text-sm font-semibold text-[#0D1F17] focus:outline-none focus:border-[#1B4332] transition-all appearance-none"
            >
              <option value="">Select drug...</option>
              {MVP_DRUGS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleAddPatient}
            disabled={!form.name || !form.age || !form.drug}
            className="h-12 bg-[#1B4332] text-white rounded-xl font-black text-sm hover:bg-[#0D1F17] transition-all active:scale-95 disabled:opacity-40 mt-1"
          >
            Register & Generate Code
          </button>
        </div>
      </div>
    );
  }

  if (screen === "patient-room" && selectedPatient) {
    const p = patients.find((pt) => pt.code === selectedPatient.code) || selectedPatient;
    return (
      <div className="flex flex-col gap-4 py-2">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setScreen("pharmacist-dashboard")} className="w-8 h-8 rounded-xl bg-[#F4F7F6] flex items-center justify-center">
            <svg className="w-4 h-4 text-[#0D1F17]/60" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <h2 className="font-black text-lg text-[#0D1F17]">{p.name}</h2>
            <div className="flex items-center gap-2">
              <StatusBadge status={p.status} />
              <span className="text-[10px] text-[#0D1F17]/40 font-medium">{p.drug} · Age {p.age}</span>
            </div>
          </div>
        </div>

        {/* Patient code card */}
        <div className="bg-[#D8F3DC] border border-[#1B4332]/15 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-[#1B4332]/60 mb-1">Patient Access Code</div>
            <div className="text-3xl font-black text-[#1B4332] tracking-widest">{p.code}</div>
            <div className="text-[10px] text-[#1B4332]/60 font-medium mt-1">Share this with {p.name.split(" ")[0]}</div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-[#1B4332]/10 flex items-center justify-center">
            <svg className="w-7 h-7 text-[#1B4332]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        {/* ADR answers */}
        {p.answers && p.answers.length > 0 ? (
          <div className="bg-white rounded-2xl border border-[#1B4332]/10 p-4 flex flex-col gap-3">
            <div className="text-xs font-black uppercase tracking-wide text-[#0D1F17]/60">ADR Check-in Responses</div>
            {p.answers.map((a, i) => (
              <div
                key={i}
                className={`rounded-xl p-3 border ${a.flag ? "bg-red-50 border-red-200" : "bg-[#F4F7F6] border-[#1B4332]/6"}`}
              >
                <div className="text-[10px] font-bold text-[#0D1F17]/50 mb-1">{a.q.split("/")[1]?.trim() || a.q}</div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-[#0D1F17]">{a.a}</div>
                  {a.flag && (
                    <span className="text-[9px] font-black uppercase text-red-600 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">⚠ Flag</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#1B4332]/8 p-6 text-center">
            <p className="text-xs text-[#0D1F17]/40 font-semibold">Patient hasn't completed the ADR check-in yet.</p>
          </div>
        )}
      </div>
    );
  }

  if (screen === "patient-login") {
    return (
      <div className="flex flex-col gap-4 py-2">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setScreen("landing")} className="w-8 h-8 rounded-xl bg-[#F4F7F6] flex items-center justify-center">
            <svg className="w-4 h-4 text-[#0D1F17]/60" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h2 className="font-black text-lg text-[#0D1F17]">Patient Check-in</h2>
        </div>

        <div className="bg-white rounded-2xl border border-[#1B4332]/10 shadow-sm p-5 flex flex-col gap-4">
          <div className="text-center py-2">
            <div className="w-14 h-14 rounded-2xl bg-[#D8F3DC] flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-[#1B4332]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <div className="font-black text-base text-[#0D1F17]">VigiBot ADR Check-in</div>
            <div className="text-xs text-[#0D1F17]/50 font-medium mt-1">Enter the code your pharmacist gave you</div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wide text-[#0D1F17]/60">Access Code</label>
            <input
              type="text"
              value={patientCode}
              onChange={(e) => setPatientCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handlePatientLogin()}
              placeholder="e.g. A3K9MX"
              maxLength={6}
              className="h-12 px-4 bg-[#F4F7F6] rounded-xl border border-[#1B4332]/10 text-base font-black text-[#0D1F17] text-center tracking-widest focus:outline-none focus:border-[#1B4332] transition-all placeholder-[#0D1F17]/30"
            />
          </div>

          {loginError && (
            <div className="text-xs text-red-600 font-bold text-center">{loginError}</div>
          )}

          <button
            type="button"
            onClick={handlePatientLogin}
            disabled={patientCode.length < 4}
            className="h-12 bg-[#1B4332] text-white rounded-xl font-black text-sm hover:bg-[#0D1F17] transition-all active:scale-95 disabled:opacity-40"
          >
            Start Check-in
          </button>
        </div>

        {/* Demo hint */}
        {patients.length > 0 && (
          <div className="bg-[#D8F3DC] border border-[#1B4332]/15 rounded-xl p-3">
            <div className="text-[10px] font-black text-[#1B4332] uppercase tracking-wide mb-1">Demo — Available Codes</div>
            {patients.map((p) => (
              <button
                key={p.code}
                type="button"
                onClick={() => setPatientCode(p.code)}
                className="text-xs font-bold text-[#1B4332] mr-3 hover:underline"
              >
                {p.code} ({p.name.split(" ")[0]})
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (screen === "patient-chat" && patientFound) {
    return (
      <div className="flex flex-col h-[calc(100vh-120px)]">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-[#1B4332]/8">
          <button type="button" onClick={() => setScreen("patient-login")} className="w-8 h-8 rounded-xl bg-[#F4F7F6] flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-[#0D1F17]/60" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="font-black text-sm text-[#0D1F17]">VigiBot · {patientFound.drug} Check-in</div>
            <div className="text-[10px] text-[#0D1F17]/50 font-medium">
              {chatDone ? "✓ Complete" : `Question ${Math.min(currentQ + 1, (DRUG_QUESTIONS[patientFound.drug] || []).length)} of ${(DRUG_QUESTIONS[patientFound.drug] || []).length}`}
            </div>
          </div>
          {/* progress */}
          <div className="w-16 h-1.5 bg-[#F4F7F6] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1B4332] rounded-full transition-all duration-300"
              style={{ width: `${(currentQ / (DRUG_QUESTIONS[patientFound.drug] || []).length) * 100}%` }}
            />
          </div>
        </div>

        {/* Chat feed */}
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "patient" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "bot"
                    ? "bg-white border border-[#1B4332]/10 text-[#0D1F17]"
                    : "bg-[#1B4332] text-white"
                }`}
                style={{ borderRadius: m.role === "bot" ? "20px 20px 20px 4px" : "20px 20px 4px 20px" }}
              >
                <pre className="whitespace-pre-wrap font-[inherit] text-sm">{m.text}</pre>
              </div>
            </div>
          ))}

          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#1B4332]/10 rounded-2xl px-4 py-3 flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#1B4332]/30 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        {!chatDone ? (
          <div className="flex gap-2 pt-3 border-t border-[#1B4332]/8">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePatientReply()}
              placeholder="Type हाँ/नहीं or describe..."
              className="flex-1 h-11 px-4 bg-[#F4F7F6] rounded-xl border border-[#1B4332]/10 text-sm font-semibold text-[#0D1F17] focus:outline-none focus:border-[#1B4332] transition-all placeholder-[#0D1F17]/30"
            />
            <button
              type="button"
              onClick={handlePatientReply}
              disabled={!chatInput.trim() || chatLoading}
              className="w-11 h-11 bg-[#1B4332] rounded-xl flex items-center justify-center hover:bg-[#0D1F17] transition-colors disabled:opacity-40 active:scale-95 shrink-0"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="pt-3 border-t border-[#1B4332]/8">
            <div className="bg-[#D8F3DC] border border-[#1B4332]/15 rounded-xl p-3 text-center">
              <div className="text-xs font-black text-[#1B4332] mb-1">✓ Check-in Complete</div>
              <div className="text-[11px] text-[#1B4332]/70 font-medium">Your pharmacist will review your responses.</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
