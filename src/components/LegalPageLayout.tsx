"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, ShieldCheck } from "lucide-react";

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  backToHomeText: string;
  children: ReactNode;
}

export default function LegalPageLayout({
  title,
  lastUpdated,
  backToHomeText,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="flex-grow bg-[#0B132B] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Action Area */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-orange-400 transition-colors uppercase tracking-wider group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {backToHomeText}
          </Link>
        </div>

        {/* Legal Header Card Block */}
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#F15A24] to-[#FF8C00]" />
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border border-orange-500/20 overflow-hidden flex-shrink-0 shadow-lg shadow-orange-500/5">
              <img src="/logo.png" alt="Hum Hai Hindu Foundation Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-[10px] text-orange-400 tracking-[0.2em] font-extrabold uppercase block leading-none">
                Hum Hai Hindu Foundation
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-white mt-1.5 leading-tight">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold uppercase tracking-wider bg-white/[0.03] border border-white/5 px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            <span>{lastUpdated}</span>
          </div>
        </div>

        {/* Detailed Legal Content Container */}
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl space-y-8 leading-relaxed text-sm md:text-base text-white/90">
          {children}
        </div>
      </div>
    </div>
  );
}
