import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col gap-6 py-2">
      {/* Welcome Banner */}
      <section className="bg-gradient-to-br from-primary to-primary-hover rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block bg-white/20 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider mb-2">
            Namaste & Welcome
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight">Pharmacist Workspace</h1>
          <p className="mt-1 text-sm text-primary-light/90 font-medium">
            Helping Indian community pharmacists lookup drug details and report Adverse Events live.
          </p>
        </div>
        
        {/* Abstract background blobs for a premium design look */}
        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-24 h-24 bg-primary-light/10 rounded-full blur-xl"></div>
      </section>

      {/* Main Tools Selection (Mobile Cards) */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-primary/70 px-1">
          Pharmacist Toolkit
        </h2>
        
        {/* Tool 1 Card - Drugipedia */}
        <Link 
          href="/drugipedia" 
          className="group block bg-white rounded-2xl p-5 border border-primary/10 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-lg text-primary-dark group-hover:text-primary transition-colors duration-150">
                  Drugipedia Lookup
                </h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded uppercase">
                  Live
                </span>
              </div>
              <p className="text-xs text-primary-dark/70 mt-1 leading-relaxed">
                Live FDA drug search. Quickly fetch generic/brand names, usage guidelines, dosage, warnings, and adverse reactions.
              </p>
            </div>
          </div>
        </Link>

        {/* Tool 2 Card - ADR Report */}
        <Link 
          href="/adr-report" 
          className="group block bg-white rounded-2xl p-5 border border-primary/10 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-extrabold text-lg text-primary-dark group-hover:text-primary transition-colors duration-150">
                Report ADR Event
              </h3>
              <p className="text-xs text-primary-dark/70 mt-1 leading-relaxed">
                Log Adverse Drug Reactions immediately in 5 steps. Direct submission to your pharmacy database/Google Spreadsheet.
              </p>
            </div>
          </div>
        </Link>
      </section>

      {/* Safety Guideline Section */}
      <section className="bg-white rounded-2xl p-5 border border-primary/10 shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-2 text-primary font-bold text-sm border-b border-primary/5 pb-2">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0110 21a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
          </svg>
          Pharmacovigilance Quick Tips
        </div>
        
        <ul className="text-xs text-primary-dark/80 flex flex-col gap-2 list-disc pl-4 leading-relaxed">
          <li>
            <strong>High-Alert Medications:</strong> Always cross-examine prescriptions containing oral anticoagulants, insulin, and chemotherapeutics.
          </li>
          <li>
            <strong>LASA Alerts:</strong> Be extra careful with Look-Alike Sound-Alike brands in India (e.g., <em>Medrol</em> vs <em>Metrogyl</em>).
          </li>
          <li>
            <strong>ADR Reporting:</strong> Reporting adverse events is crucial to identify substandard medicines and ensure public health safety.
          </li>
        </ul>
      </section>

      {/* Indian Pharmacist Footer text */}
      <footer className="text-center text-[10px] text-primary/50 font-semibold mt-4">
        Viginyx Pharmacist App v1.0.0 • Made for Indian Community Pharmacies
      </footer>
    </div>
  );
}
