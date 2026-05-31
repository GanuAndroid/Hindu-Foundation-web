"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { ShieldCheck, ArrowLeft, Calendar, FileText } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsOfService() {
  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen bg-[#070C19] text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow max-w-4xl mx-auto px-4 py-24 sm:px-6 lg:px-8 space-y-10">
        {/* Back Button */}
        <div className="animate-fade-in pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === "hi" ? "मुख्य पृष्ठ पर लौटें" : "Back to Home"}
          </Link>
        </div>

        {/* Heading Section */}
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight bg-gradient-to-r from-white to-orange-400 bg-clip-text text-transparent py-2">
              {t("terms.title")}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50 font-bold">
            <Calendar className="w-4 h-4 text-orange-400/80" />
            <span>{t("terms.lastUpdated")}</span>
          </div>
        </div>

        {/* Intro Banner */}
        <div className="bg-orange-500/[0.03] border border-orange-500/10 p-6 rounded-3xl text-sm leading-relaxed text-white/80 shadow-inner animate-fade-in">
          {t("terms.intro")}
        </div>

        {/* Detailed Sections Grid */}
        <div className="space-y-8 animate-fade-in">
          {[1, 2, 3, 4].map((num) => (
            <div
              key={num}
              className="bg-slate-900/40 border border-white/5 p-6 md:p-8 rounded-3xl space-y-3 hover:border-orange-500/20 transition-all duration-300 shadow-xl"
            >
              <h2 className="text-lg font-extrabold text-orange-400">
                {t(`terms.section${num}Title` as any)}
              </h2>
              <p className="text-sm leading-relaxed text-white/70">
                {t(`terms.section${num}Desc` as any)}
              </p>
            </div>
          ))}
        </div>

        {/* Trust Badge / Registration Notice */}
        <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl flex flex-col sm:flex-row items-center gap-4 justify-between animate-fade-in text-center sm:text-left">
          <div className="space-y-1">
            <div className="text-sm font-black text-white flex items-center justify-center sm:justify-start gap-2">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              {language === "hi" ? "पंजीकृत एनजीओ ट्रस्ट" : "Registered NGO Trust"}
            </div>
            <p className="text-xs text-white/50">
              {language === "hi" ? "नियम एवं शर्तें भारतीय एनजीओ कानूनों के अधीन हैं।" : "Terms and operations are governed by Indian NGO Trust acts."}
            </p>
          </div>
          <Link
            href="/donate"
            className="px-6 py-3 bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-white text-xs font-black rounded-xl hover:opacity-90 transition-all uppercase tracking-wider"
          >
            {t("donate.donateNow")}
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
