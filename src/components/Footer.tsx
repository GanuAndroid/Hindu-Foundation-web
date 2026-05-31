"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Heart, Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#060B18] text-white border-t border-orange-500/10">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-32 h-32 overflow-hidden rounded-full border border-orange-500/30 shadow-lg shadow-orange-500/10">
                <img
                  src="/logo.png"
                  alt="Hum Hai Hindu Foundation Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-2xl tracking-tight leading-tight">
                  HUM HAI
                </span>
                <span className="text-sm tracking-[0.2em] font-bold text-orange-500">
                  HINDU FOUNDATION
                </span>
              </div>
            </div>
            <p className="text-white/60 text-sm max-w-sm mb-6 leading-relaxed">
              {t("home.footerDesc")}
            </p>
            <div className="bg-orange-500/[0.03] border border-orange-500/15 rounded-2xl p-5 space-y-4 max-w-sm">
              <div className="flex items-center gap-2 text-xs font-black text-orange-400 uppercase tracking-widest">
                <svg className="w-4 h-4 fill-current text-green-400" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.057 5.291 5.348.002 11.857.002c3.15.001 6.112 1.23 8.338 3.461 2.227 2.229 3.453 5.19 3.45 8.341-.005 6.56-5.296 11.848-11.805 11.848-2.006-.002-3.98-.51-5.731-1.479L0 24zm6.59-4.846c1.6.95 3.398 1.452 5.228 1.453h.011c5.44 0 9.866-4.42 9.87-9.856.002-2.633-1.02-5.107-2.882-6.97C16.993 1.87 14.525.842 11.89.842c-5.45 0-9.877 4.421-9.882 9.858-.002 1.848.482 3.655 1.401 5.257L2.4 21.055l5.247-1.378zm11.236-4.577c-.307-.154-1.82-.898-2.102-1.001-.282-.102-.488-.153-.692.154-.204.307-.79.997-.969 1.2-.178.204-.356.229-.663.076-.307-.154-1.297-.478-2.47-1.524-.913-.815-1.53-1.82-1.709-2.127-.179-.307-.019-.473.135-.626.139-.138.307-.358.461-.537.154-.179.205-.307.307-.512.103-.205.051-.384-.026-.537-.076-.154-.692-1.666-.948-2.28-.249-.597-.502-.516-.692-.525-.179-.009-.384-.01-.59-.01-.205 0-.538.077-.82.384-.282.307-1.077 1.05-1.077 2.562 0 1.511 1.1 2.972 1.253 3.177.154.205 2.164 3.303 5.242 4.633.732.316 1.302.505 1.748.647.734.233 1.402.2 1.93.121.588-.088 1.82-.743 2.076-1.46.256-.717.256-1.332.179-1.46-.077-.127-.282-.204-.589-.359z"/>
                </svg>
                {t("home.whatsappSupport")}
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] tracking-wide text-white/50 font-bold uppercase leading-none">{t("home.rescueTeam")}</div>
                  <a
                    href="https://wa.me/918447816192"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-black text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 mt-1"
                  >
                    +91-844-781-6192
                  </a>
                </div>
                <div>
                  <div className="text-[10px] tracking-wide text-white/50 font-bold uppercase leading-none">{t("home.customerCare")}</div>
                  <a
                    href="https://wa.me/918512080346"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-black text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 mt-1"
                  >
                    +91-851-208-0346
                  </a>
                </div>
                <div>
                  <div className="text-[10px] tracking-wide text-white/50 font-bold uppercase leading-none">{t("home.medicalSocial")}</div>
                  <a
                    href="https://wa.me/919899317003"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-black text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 mt-1"
                  >
                    +91-989-931-7003
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-orange-400 tracking-wider uppercase mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/" className="hover:text-orange-400 transition-colors">{t("nav.home")}</Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-orange-400 transition-colors">{t("nav.about")}</Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-orange-400 transition-colors">{t("nav.howItWorks")}</Link>
              </li>
              <li>
                <Link href="/#donate" className="hover:text-orange-400 transition-colors">{t("nav.donate")}</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-bold text-orange-400 tracking-wider uppercase mb-4">
              {t("home.contactUs")}
            </h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0 mt-1" />
                <span>163, Kakrola Housing Complex, Apt #8, Dwarka Mor, New Delhi – 110078, India</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <a href="mailto:rescue@hindufoundation.org" className="hover:text-orange-400">rescue@hindufoundation.org</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} Hum Hai Hindu Foundation. All Rights Reserved. Registered NGO.
          </p>
          <div className="flex gap-4 text-xs text-white/40">
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
