"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import LegalPageLayout from "@/components/LegalPageLayout";

export default function PrivacyPolicyClient() {
  const { t } = useLanguage();

  return (
    <LegalPageLayout
      title={t("privacy.title")}
      lastUpdated={t("privacy.lastUpdated")}
      backToHomeText={t("privacy.backToHome")}
    >
      <div className="space-y-8">
        {/* 1. Introduction */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-orange-400 uppercase tracking-wide">
            {t("privacy.introTitle")}
          </h2>
          <p className="text-white/80 leading-relaxed text-sm">
            {t("privacy.introText")}
          </p>
        </section>

        {/* 2. Information We Collect */}
        <section className="space-y-4">
          <h2 className="text-lg font-black text-orange-400 uppercase tracking-wide">
            {t("privacy.collectTitle")}
          </h2>
          <p className="text-white/80 leading-relaxed text-sm">
            {t("privacy.collectText")}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Personal Details */}
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-2">
              <h3 className="font-extrabold text-xs text-orange-400 uppercase tracking-wider">
                {t("privacy.personalTitle")}
              </h3>
              <ul className="list-disc pl-4 text-xs text-white/70 space-y-1">
                <li>{t("privacy.personalName")}</li>
                <li>{t("privacy.personalMobile")}</li>
                <li>{t("privacy.personalEmail")}</li>
              </ul>
            </div>

            {/* Rescue Details */}
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-2">
              <h3 className="font-extrabold text-xs text-orange-400 uppercase tracking-wider">
                {t("privacy.rescueTitle")}
              </h3>
              <ul className="list-disc pl-4 text-xs text-white/70 space-y-1">
                <li>{t("privacy.rescueAnimal")}</li>
                <li>{t("privacy.rescueDesc")}</li>
                <li>{t("privacy.rescuePhotos")}</li>
                <li>{t("privacy.rescueVideos")}</li>
                <li>{t("privacy.rescueGps")}</li>
                <li>{t("privacy.rescueTime")}</li>
              </ul>
            </div>

            {/* Donation Details */}
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-2">
              <h3 className="font-extrabold text-xs text-orange-400 uppercase tracking-wider">
                {t("privacy.donationTitle")}
              </h3>
              <ul className="list-disc pl-4 text-xs text-white/70 space-y-1">
                <li>{t("privacy.donationName")}</li>
                <li>{t("privacy.donationContact")}</li>
                <li>{t("privacy.donationTx")}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Why We Collect Information */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-orange-400 uppercase tracking-wide">
            {t("privacy.whyTitle")}
          </h2>
          <p className="text-white/80 leading-relaxed text-sm">
            {t("privacy.whyText")}
          </p>
          <ul className="list-disc pl-5 text-sm text-white/70 space-y-1.5">
            <li>{t("privacy.whyItem1")}</li>
            <li>{t("privacy.whyItem2")}</li>
            <li>{t("privacy.whyItem3")}</li>
            <li>{t("privacy.whyItem4")}</li>
            <li>{t("privacy.whyItem5")}</li>
            <li>{t("privacy.whyItem6")}</li>
            <li>{t("privacy.whyItem7")}</li>
          </ul>
        </section>

        {/* 4. Location Permission */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-orange-400 uppercase tracking-wide">
            {t("privacy.locTitle")}
          </h2>
          <p className="text-white/80 leading-relaxed text-sm">
            {t("privacy.locText")}
          </p>
          <p className="text-white/80 leading-relaxed text-sm font-bold">
            {t("privacy.locWhy")}
          </p>
          <ul className="list-disc pl-5 text-sm text-white/70 space-y-1.5">
            <li>{t("privacy.locItem1")}</li>
            <li>{t("privacy.locItem2")}</li>
            <li>{t("privacy.locItem3")}</li>
          </ul>
          <p className="text-xs text-orange-400/80 font-black italic">
            * {t("privacy.locNote")}
          </p>
        </section>

        {/* 5. Camera and Media Permission */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-orange-400 uppercase tracking-wide">
            {t("privacy.camTitle")}
          </h2>
          <p className="text-white/80 leading-relaxed text-sm">
            {t("privacy.camText")}
          </p>
          <ul className="list-disc pl-5 text-sm text-white/70 space-y-1.5">
            <li>{t("privacy.camItem1")}</li>
            <li>{t("privacy.camItem2")}</li>
            <li>{t("privacy.camItem3")}</li>
          </ul>
        </section>

        {/* 6. Data Security */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-orange-400 uppercase tracking-wide">
            {t("privacy.secTitle")}
          </h2>
          <p className="text-white/80 leading-relaxed text-sm">
            {t("privacy.secText")}
          </p>
          <ul className="list-disc pl-5 text-sm text-white/70 space-y-1.5">
            <li>{t("privacy.secItem1")}</li>
            <li>{t("privacy.secItem2")}</li>
            <li>{t("privacy.secItem3")}</li>
            <li>{t("privacy.secItem4")}</li>
          </ul>
        </section>

        {/* 7. Data Sharing */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-orange-400 uppercase tracking-wide">
            {t("privacy.shareTitle")}
          </h2>
          <p className="text-white/80 leading-relaxed text-sm">
            {t("privacy.shareText")}
          </p>
          <ul className="list-disc pl-5 text-sm text-white/70 space-y-1.5">
            <li>{t("privacy.shareItem1")}</li>
            <li>{t("privacy.shareItem2")}</li>
            <li>{t("privacy.shareItem3")}</li>
            <li>{t("privacy.shareItem4")}</li>
          </ul>
          <p className="text-xs text-orange-400/80 font-black italic">
            * {t("privacy.shareNote")}
          </p>
        </section>

        {/* 8. Donations */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-orange-400 uppercase tracking-wide">
            {t("privacy.donTitle")}
          </h2>
          <p className="text-white/80 leading-relaxed text-sm">
            {t("privacy.donText")}
          </p>
          <ul className="list-disc pl-5 text-sm text-white/70 space-y-1.5">
            <li>{t("privacy.donItem1")}</li>
            <li>{t("privacy.donItem2")}</li>
            <li>{t("privacy.donItem3")}</li>
          </ul>
        </section>

        {/* 9. Contact */}
        <section className="space-y-4">
          <h2 className="text-lg font-black text-orange-400 uppercase tracking-wide">
            {t("privacy.contactTitle")}
          </h2>
          <p className="text-white/80 leading-relaxed text-sm font-semibold">
            {t("privacy.contactText")}
          </p>
          
          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl space-y-3 text-sm">
            <div className="flex flex-col sm:flex-row justify-between border-b border-white/5 pb-2">
              <span className="text-white/40 font-bold">{t("privacy.contactAddressLabel")}</span>
              <span className="font-extrabold text-white text-right sm:max-w-xs">{t("privacy.contactAddress")}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-white/40 font-bold">{t("privacy.contactWhatsappLabel")}</span>
              <span className="font-black text-white font-mono">{t("privacy.contactWhatsapp")}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/40 font-bold">{t("privacy.contactEmailLabel")}</span>
              <a href={`mailto:${t("privacy.contactEmail")}`} className="font-extrabold text-orange-400 hover:underline">
                {t("privacy.contactEmail")}
              </a>
            </div>
          </div>
        </section>
      </div>
    </LegalPageLayout>
  );
}
