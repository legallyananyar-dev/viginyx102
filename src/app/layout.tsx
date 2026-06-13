"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const hideNav = pathname === "/" || pathname === "/login";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-bg text-foreground">
        {!hideNav && (
          <header className="sticky top-0 z-50 nav-glass border-b border-primary/10">
            <div className="mx-auto max-w-lg px-4 h-16 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform duration-200">
                  V
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-xl tracking-tight text-primary leading-none">Viginyx</span>
                  <span className="text-[10px] text-primary/70 font-semibold tracking-wider uppercase mt-0.5">Pharmacist Suite</span>
                </div>
              </Link>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center rounded-full bg-primary-light px-2 py-1 text-xs font-semibold text-primary">
                  <span className="mr-1 h-1.5 w-1.5 rounded-full bg-primary animate-pulse-ring"></span>
                  Live FDA
                </span>
              </div>
            </div>
          </header>
        )}

        <main className={`flex-1 w-full max-w-lg mx-auto px-4 ${hideNav ? "" : "pt-4 pb-24"}`}>
          {children}
        </main>

        {!hideNav && (
          <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-primary/10 shadow-2xl max-w-lg mx-auto rounded-t-2xl">
            <div className="grid grid-cols-3 h-16">
              <Link href="/" className="flex flex-col items-center justify-center text-primary/70 hover:text-primary transition-colors duration-150">
                <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
                <span className="text-[11px] font-bold">Portal</span>
              </Link>

              <Link href="/drugipedia" className="flex flex-col items-center justify-center text-primary/70 hover:text-primary transition-colors duration-150 border-x border-primary/5">
                <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
                </svg>
                <span className="text-[11px] font-bold">Drugipedia</span>
              </Link>

              <Link href="/adr-report" className="flex flex-col items-center justify-center text-primary/70 hover:text-primary transition-colors duration-150">
                <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <span className="text-[11px] font-bold">ADR Report</span>
              </Link>
            </div>
          </nav>
        )}
      </body>
    </html>
  );
}
