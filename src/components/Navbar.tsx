"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Menu, X, ShieldAlert, User, LogOut, Heart, Activity } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    if (user.role === "admin") return "/dashboard/admin";
    if (user.role === "team") return "/dashboard/team";
    return "/dashboard/user";
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0B132B] text-white border-b border-orange-500/20 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-32">
          {/* Logo / Branding */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-28 h-28 overflow-hidden rounded-full border border-orange-500/30 shadow-lg shadow-orange-500/10 group-hover:scale-105 transition-transform duration-300">
                <img
                  src="/logo.png"
                  alt="Hum Hai Hindu Foundation Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-3xl tracking-tight text-white group-hover:text-orange-400 transition-colors">
                  HUM HAI
                </span>
                <span className="text-sm tracking-[0.2em] font-semibold text-orange-500">
                  HINDU FOUNDATION
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg text-sm font-medium hover:text-orange-400 transition-colors"
            >
              {t("nav.home")}
            </Link>

            {/* Role-Specific Links */}
            {!user ? (
              <>
                <Link
                  href="/#about"
                  className="px-4 py-2 rounded-lg text-sm font-medium hover:text-orange-400 transition-colors"
                >
                  {t("nav.about")}
                </Link>
                <Link
                  href="/#how-it-works"
                  className="px-4 py-2 rounded-lg text-sm font-medium hover:text-orange-400 transition-colors"
                >
                  {t("nav.howItWorks")}
                </Link>
                <Link
                  href="/#donate"
                  className="px-4 py-2 text-orange-400 font-semibold text-sm hover:text-orange-300 transition-colors"
                >
                  ❤️ {t("home.donateNow")}
                </Link>
                <div className="w-[1px] h-6 bg-white/10 mx-2" />
                <Link
                  href="/auth?role=user"
                  className="px-4 py-2 text-sm font-medium hover:text-orange-400 transition-colors"
                >
                  {t("home.reportOnline")}
                </Link>
                <Link
                  href="/auth?role=team"
                  className="px-4 py-2 text-sm font-medium border border-orange-500/30 rounded-lg hover:border-orange-500 hover:text-orange-400 transition-all duration-300"
                >
                  {t("nav.teamPortal")}
                </Link>
                <Link
                  href="/auth?role=admin"
                  className="ml-2 px-4 py-2 bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all duration-300 shadow-md shadow-orange-500/20"
                >
                  {t("nav.adminPortal")}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={getDashboardLink()}
                  className="px-4 py-2 text-orange-400 font-semibold text-sm hover:text-orange-300 transition-colors flex items-center gap-2"
                >
                  <Activity className="w-4 h-4" />
                  {t("nav.dashboard")} ({user.role === "admin" ? t("auth.admin") : user.role === "team" ? t("auth.rescueTeam") : t("auth.citizenUser")})
                </Link>

                <div className="w-[1px] h-6 bg-white/10 mx-2" />

                <div className="flex items-center gap-3 bg-white/5 rounded-full px-4 py-1.5 border border-white/10">
                  <User className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-medium text-white/95 max-w-[120px] truncate">
                    {user.name}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="ml-2 p-2 text-white/70 hover:text-red-400 transition-colors flex items-center gap-1.5 text-sm"
                  title={t("nav.logout")}
                >
                  <LogOut className="w-5 h-5" />
                  <span className="sr-only md:not-sr-only text-xs">{t("nav.logout")}</span>
                </button>
              </>
            )}

            {/* Desktop Language Switcher */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 ml-4">
              <button
                onClick={() => setLanguage("hi")}
                className={`px-3 py-1 text-xs font-black rounded-lg transition-all duration-300 ${
                  language === "hi"
                    ? "bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-white shadow-md"
                    : "text-white/60 hover:text-white"
                }`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1 text-xs font-black rounded-lg transition-all duration-300 ${
                  language === "en"
                    ? "bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-white shadow-md"
                    : "text-white/60 hover:text-white"
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-white hover:text-orange-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500 transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#0B132B]/95 border-b border-orange-500/10 transition-all duration-300">
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-orange-500/10 hover:text-orange-400"
            >
              {t("nav.home")}
            </Link>

            {!user ? (
              <>
                <Link
                  href="/#about"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-orange-500/10 hover:text-orange-400"
                >
                  {t("nav.about")}
                </Link>
                <Link
                  href="/#how-it-works"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-orange-500/10 hover:text-orange-400"
                >
                  {t("nav.howItWorks")}
                </Link>
                <Link
                  href="/#donate"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-semibold text-orange-400 hover:bg-orange-500/10"
                >
                  ❤️ {t("home.donateNow")}
                </Link>
                <div className="border-t border-white/5 my-2" />
                <Link
                  href="/auth?role=user"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-orange-500/10 hover:text-orange-400"
                >
                  {t("home.reportOnline")}
                </Link>
                <Link
                  href="/auth?role=team"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-orange-500/10 hover:text-orange-400"
                >
                  {t("nav.teamPortal")}
                </Link>
                <Link
                  href="/auth?role=admin"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-semibold bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-center text-white"
                >
                  {t("nav.adminPortal")}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={getDashboardLink()}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-semibold text-orange-400 hover:bg-orange-500/10"
                >
                  {t("nav.dashboard")} ({user.role === "admin" ? t("auth.admin") : user.role === "team" ? t("auth.rescueTeam") : t("auth.citizenUser")})
                </Link>
                <div className="border-t border-white/5 my-2" />
                <div className="px-3 py-2 text-sm text-white/70">
                  Logged in as: <span className="font-semibold text-white">{user.name}</span>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-red-500/10"
                >
                  {t("nav.logout")}
                </button>
              </>
            )}

            {/* Mobile Language Switcher */}
            <div className="border-t border-white/5 pt-4 pb-2 px-3">
              <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-2">🌐 भाषा / Language</span>
              <div className="grid grid-cols-2 gap-2 bg-white/5 border border-white/10 p-1 rounded-xl">
                <button
                  onClick={() => {
                    setLanguage("hi");
                    setIsOpen(false);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg text-center transition-all ${
                    language === "hi"
                      ? "bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-white shadow"
                      : "text-white/60"
                  }`}
                >
                  हिन्दी
                </button>
                <button
                  onClick={() => {
                    setLanguage("en");
                    setIsOpen(false);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg text-center transition-all ${
                    language === "en"
                      ? "bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-white shadow"
                      : "text-white/60"
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
