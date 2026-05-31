"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import hiTranslations from "../../locales/hi/common.json";
import enTranslations from "../../locales/en/common.json";

export type Language = "hi" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, any> = {
  hi: hiTranslations,
  en: enTranslations,
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("hi"); // Default to Hindi
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read persisted language on client mount
    const stored = localStorage.getItem("language") as Language;
    if (stored === "hi" || stored === "en") {
      setLanguageState(stored);
    } else {
      localStorage.setItem("language", "hi");
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  // Reusable translation nested path lookup: t("nav.home")
  const t = (path: string): string => {
    const keys = path.split(".");
    let current = translations[language];

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        // Fallback to English lookup if Hindi key is missing
        let fallback = translations["en"];
        for (const fKey of keys) {
          if (fallback && typeof fallback === "object" && fKey in fallback) {
            fallback = fallback[fKey];
          } else {
            return path;
          }
        }
        return typeof fallback === "string" ? fallback : path;
      }
    }

    return typeof current === "string" ? current : path;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
