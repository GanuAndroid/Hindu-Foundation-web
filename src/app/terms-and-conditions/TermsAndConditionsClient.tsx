"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import LegalPageLayout from "@/components/LegalPageLayout";

export default function TermsAndConditionsClient() {
  const { t } = useLanguage();

  return (
    <LegalPageLayout
      title={t("terms.title")}
      lastUpdated={t("terms.lastUpdated")}
      backToHomeText={t("terms.backToHome")}
    >
      <div className="space-y-8">
        {/* 1. Acceptance of Terms */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-orange-400 uppercase tracking-wide">
            {t("terms.acceptTitle")}
          </h2>
          <p className="text-white/80 leading-relaxed text-sm">
            {t("terms.acceptText")}
          </p>
        </section>

        {/* 2. Purpose of Platform */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-orange-400 uppercase tracking-wide">
            {t("terms.purposeTitle")}
          </h2>
          <p className="text-white/80 leading-relaxed text-sm">
            {t("terms.purposeText")}
          </p>
          <ul className="list-disc pl-5 text-sm text-white/70 space-y-1.5">
            <li>{t("terms.purposeItem1")}</li>
            <li>{t("terms.purposeItem2")}</li>
            <li>{t("terms.purposeItem3")}</li>
            <li>{t("terms.purposeItem4")}</li>
            <li>{t("terms.purposeItem5")}</li>
          </ul>
        </section>

        {/* 3. User Responsibilities */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-orange-400 uppercase tracking-wide">
            {t("terms.userTitle")}
          </h2>
          <p className="text-white/80 leading-relaxed text-sm">
            {t("terms.userText")}
          </p>
          <ul className="list-disc pl-5 text-sm text-white/70 space-y-1.5">
            <li>{t("terms.userItem1")}</li>
            <li>{t("terms.userItem2")}</li>
            <li>{t("terms.userItem3")}</li>
            <li>{t("terms.userItem4")}</li>
            <li>{t("terms.userItem5")}</li>
          </ul>
        </section>

        {/* 4. Rescue Request Policy */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-orange-400 uppercase tracking-wide">
            {t("terms.rescueTitle")}
          </h2>
          <p className="text-white/80 leading-relaxed text-sm">
            {t("terms.rescueText")}
          </p>
          <ul className="list-disc pl-5 text-sm text-white/70 space-y-1.5">
            <li>{t("terms.rescueItem1")}</li>
            <li>{t("terms.rescueItem2")}</li>
            <li>{t("terms.rescueItem3")}</li>
            <li>{t("terms.rescueItem4")}</li>
          </ul>
        </section>

        {/* 5. Photo and Video Upload Policy */}
        <section className="space-y-4">
          <h2 className="text-lg font-black text-orange-400 uppercase tracking-wide">
            {t("terms.mediaTitle")}
          </h2>
          <p className="text-white/80 leading-relaxed text-sm">
            {t("terms.mediaText")}
          </p>
          <ul className="list-disc pl-5 text-sm text-white/70 space-y-1.5">
            <li>{t("terms.mediaItem1")}</li>
            <li>{t("terms.mediaItem2")}</li>
          </ul>
          
          <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-2xl space-y-2">
            <h3 className="font-extrabold text-xs text-red-400 uppercase tracking-wider">
              {t("terms.mediaWarningText")}
            </h3>
            <ul className="list-disc pl-4 text-xs text-white/70 space-y-1">
              <li>{t("terms.mediaWarningItem1")}</li>
              <li>{t("terms.mediaWarningItem2")}</li>
              <li>{t("terms.mediaWarningItem3")}</li>
            </ul>
          </div>
        </section>

        {/* 6. Donations */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-orange-400 uppercase tracking-wide">
            {t("terms.donTitle")}
          </h2>
          <p className="text-white/80 leading-relaxed text-sm">
            {t("terms.donText")}
          </p>
          <ul className="list-disc pl-5 text-sm text-white/70 space-y-1.5">
            <li>{t("terms.donItem1")}</li>
            <li>{t("terms.donItem2")}</li>
            <li>{t("terms.donItem3")}</li>
          </ul>
        </section>

        {/* 7. Volunteer / Rescue Team Terms */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-orange-400 uppercase tracking-wide">
            {t("terms.volunteerTitle")}
          </h2>
          <p className="text-white/80 leading-relaxed text-sm">
            {t("terms.volunteerText")}
          </p>
          <ul className="list-disc pl-5 text-sm text-white/70 space-y-1.5">
            <li>{t("terms.volunteerItem1")}</li>
            <li>{t("terms.volunteerItem2")}</li>
            <li>{t("terms.volunteerItem3")}</li>
            <li>{t("terms.volunteerItem4")}</li>
          </ul>
        </section>

        {/* 8. Account Access */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-orange-400 uppercase tracking-wide">
            {t("terms.accountTitle")}
          </h2>
          <p className="text-white/80 leading-relaxed text-sm">
            {t("terms.accountText")}
          </p>
        </section>

        {/* 9. Limitation of Responsibility */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-orange-400 uppercase tracking-wide">
            {t("terms.limitTitle")}
          </h2>
          <p className="text-white/80 leading-relaxed text-sm">
            {t("terms.limitText")}
          </p>
          <ul className="list-disc pl-5 text-sm text-white/70 space-y-1.5">
            <li>{t("terms.limitItem1")}</li>
            <li>{t("terms.limitItem2")}</li>
            <li>{t("terms.limitItem3")}</li>
          </ul>
        </section>

        {/* 10. Updates */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-orange-400 uppercase tracking-wide">
            {t("terms.updatesTitle")}
          </h2>
          <p className="text-white/80 leading-relaxed text-sm">
            {t("terms.updatesText")}
          </p>
        </section>
      </div>
    </LegalPageLayout>
  );
}
