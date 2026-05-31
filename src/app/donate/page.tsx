"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Copy,
  CheckCircle,
  Download,
  AlertTriangle,
  Upload,
  Heart,
  DollarSign,
  Info,
  ShieldCheck,
  Smartphone,
  CreditCard,
  QrCode,
  Coins,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Check
} from "lucide-react";

export default function DonatePage() {
  const { t, language } = useLanguage();

  // Navigation / Scroll helper
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // State: Tab selections
  const [activeTab, setActiveTab] = useState<"upi" | "qr" | "bank" | "crypto">("upi");

  // State: Copy feedback toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleCopyToClipboard = (text: string, successLabel: string) => {
    navigator.clipboard.writeText(text);
    triggerToast(successLabel);
  };

  // State: Interactive donation form
  const [formData, setFormData] = useState({
    donorName: "",
    mobile: "",
    email: "",
    amount: "",
    purpose: "General Donation"
  });
  const [customAmount, setCustomAmount] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  // Preset amounts map
  const presets = [501, 1100, 2100, 5100];

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.donorName || !formData.mobile || !formData.amount) {
      alert(language === "hi" ? "कृपया सभी आवश्यक विवरण भरें!" : "Please fill all required details!");
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorName: formData.donorName,
          mobile: formData.mobile,
          email: formData.email || undefined,
          amount: Number(formData.amount),
          paymentMode: "Razorpay Online Simulator",
          purpose: formData.purpose,
          status: "Verified"
        })
      });

      if (res.ok) {
        setFormSuccess(true);
        setFormData({ donorName: "", mobile: "", email: "", amount: "", purpose: "General Donation" });
        setCustomAmount(false);
        setTimeout(() => setFormSuccess(false), 5000);
      } else {
        alert("Failed to submit donation.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting donation.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // State: Offline proof upload form
  const [proofData, setProofData] = useState({
    donorName: "",
    mobile: "",
    transactionId: "",
    screenshotUrl: ""
  });
  const [isUploading, setIsUploading] = useState(false);
  const [proofSubmitting, setProofSubmitting] = useState(false);
  const [proofSuccess, setProofSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // File Upload flow
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    const uData = new FormData();
    uData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uData
      });
      if (res.ok) {
        const out = await res.json();
        setProofData(prev => ({ ...prev, screenshotUrl: out.url }));
      } else {
        setUploadError(t("donate.verify.errorMsg"));
      }
    } catch (err) {
      setUploadError(t("donate.verify.errorMsg"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofData.donorName || !proofData.mobile || !proofData.transactionId || !proofData.screenshotUrl) {
      alert(t("donate.verify.errorMsg"));
      return;
    }

    setProofSubmitting(true);
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorName: proofData.donorName,
          mobile: proofData.mobile,
          amount: 0, // Admin updates actual amount upon verification
          paymentMode: activeTab === "crypto" ? "Crypto USDT (TRC20)" : activeTab === "bank" ? "Direct Bank Transfer" : "UPI QR Offline",
          transactionId: proofData.transactionId,
          screenshotUrl: proofData.screenshotUrl,
          purpose: "General Donation",
          status: "Pending"
        })
      });

      if (res.ok) {
        setProofSuccess(true);
        setProofData({ donorName: "", mobile: "", transactionId: "", screenshotUrl: "" });
        setTimeout(() => setProofSuccess(false), 5000);
      } else {
        alert("Failed to submit proof.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting proof.");
    } finally {
      setProofSubmitting(false);
    }
  };

  const handleDownloadQR = (url: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#0B132B] text-white min-h-screen relative overflow-x-hidden font-sans">
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Global Copied Status Toast */}
      {toastMessage && (
        <div className="fixed bottom-10 right-10 z-50 p-4 bg-emerald-600 border border-emerald-500 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-slide-up">
          <CheckCircle className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HERO HEADER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center space-y-8">
        
        {/* Foundation Branding Badge */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-24 h-24 overflow-hidden rounded-full border-2 border-orange-500/30 shadow-lg shadow-orange-500/10 animate-fade-in">
            <img src="/logo.png" alt="Hum Hai Hindu Foundation Logo" className="w-full h-full object-cover" />
          </div>
          <span className="px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full text-[10px] font-black tracking-widest uppercase">
            {t("donate.pageTitle")}
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight py-2 bg-gradient-to-r from-white via-white to-orange-400 bg-clip-text text-transparent max-w-4xl mx-auto">
          {t("donate.heroTitle")}
        </h1>

        <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          {t("donate.heroDesc")}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => scrollToSection("donate-methods")}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-white font-extrabold rounded-2xl shadow-lg shadow-orange-500/20 hover:scale-105 transition-all text-sm cursor-pointer"
          >
            <Heart className="w-4 h-4" />
            {t("donate.donateNow")}
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <a
            href="https://wa.me/919899317003"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-extrabold rounded-2xl transition-all text-sm"
          >
            {t("donate.contactRescue")}
            <ArrowRight className="w-4 h-4 text-orange-400" />
          </a>
        </div>
      </div>

      {/* DONATION METHODS GRID */}
      <div id="donate-methods" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-black">{language === "hi" ? "सहयोग करने के तरीके" : "Flexible Giving Methods"}</h2>
          <p className="text-xs text-white/50">{language === "hi" ? "अपना पसंदीदा विकल्प चुनें" : "Select your preferred payment channel below"}</p>
        </div>

        {/* Dynamic Tabs Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 bg-slate-900/50 border border-white/5 p-1.5 rounded-2xl max-w-3xl mx-auto">
          {[
            { id: "upi", icon: Smartphone, label: t("donate.tabs.upi") },
            { id: "qr", icon: QrCode, label: t("donate.tabs.qr") },
            { id: "bank", icon: CreditCard, label: t("donate.tabs.bank") },
            { id: "crypto", icon: Coins, label: t("donate.tabs.crypto") }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-white shadow-lg"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: UPI CONTAINER */}
        {activeTab === "upi" && (
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-2xl mx-auto space-y-6 text-center animate-fade-in">
            <Smartphone className="w-12 h-12 text-orange-400 mx-auto" />
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-xl">{t("donate.upi.title")}</h3>
              <p className="text-xs text-white/50">{language === "hi" ? "सीधे अपनी बैंकिंग एप से ट्रांसफर करें" : "Pay securely from any standard banking software"}</p>
            </div>

            <div className="bg-slate-950 border border-white/10 p-5 rounded-2xl max-w-md mx-auto flex items-center justify-between gap-4">
              <div className="text-left font-mono">
                <span className="block text-[8px] uppercase tracking-widest text-white/40 font-bold">{t("donate.upi.upiId")}</span>
                <span className="text-base font-extrabold text-white">8447816192@kotak</span>
              </div>
              <button
                onClick={() => handleCopyToClipboard("8447816192@kotak", t("donate.upi.copied"))}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-orange-500 hover:text-white hover:border-orange-500 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{t("donate.upi.copyId")}</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 border-t border-white/5">
              <a
                href="upi://pay?pa=8447816192@kotak&pn=HUM%20HAI%20HINDU%20FOUNDATION"
                className="px-6 py-3 bg-[#0B132B] hover:bg-[#1C2541] border border-white/10 text-xs font-bold rounded-xl flex items-center justify-center gap-2"
              >
                {t("donate.upi.openApp")}
              </a>
            </div>
          </div>
        )}

        {/* TAB 2: QR CODE SCANNING */}
        {activeTab === "qr" && (
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-2xl mx-auto space-y-6 text-center animate-fade-in">
            <QrCode className="w-12 h-12 text-orange-400 mx-auto" />
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-xl">{t("donate.qr.title")}</h3>
              <p className="text-xs text-white/60 leading-relaxed font-semibold">{t("donate.qr.scanText")}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl inline-block border-4 border-orange-500/20 shadow-2xl">
              <img src="/upi-qr.jpg" alt="UPI Donation QR Code" className="w-64 h-64 object-contain rounded-lg" />
            </div>

            <div className="pt-4 border-t border-white/5">
              <button
                onClick={() => handleDownloadQR("/upi-qr.jpg", "HumHaiHinduFoundation_UPI_QR.jpg")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 hover:bg-orange-500 hover:text-white hover:border-orange-500 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                {t("donate.qr.downloadQr")}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: BANK DETAILS */}
        {activeTab === "bank" && (
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="text-center space-y-1.5">
              <CreditCard className="w-12 h-12 text-orange-400 mx-auto" />
              <h3 className="font-extrabold text-xl">{t("donate.bank.title")}</h3>
              <p className="text-xs text-white/50">{language === "hi" ? "पारंपरिक बैंक हस्तांतरण का उपयोग करें" : "Transfer using standard net banking protocols"}</p>
            </div>

            <div className="bg-slate-950 border border-white/10 rounded-2xl p-5 space-y-4 text-xs">
              {[
                { label: t("donate.bank.accountName"), val: "HUM HAI HINDU FOUNDATION" },
                { label: t("donate.bank.accountNumber"), val: "2051533834" },
                { label: t("donate.bank.ifscCode"), val: "KKBK0000193" },
                { label: t("donate.bank.bank"), val: "Kotak Mahindra Bank" },
                { label: t("donate.bank.accountType"), val: "Current Account" }
              ].map((row, idx) => (
                <div key={idx} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
                  <span className="text-white/50 font-bold">{row.label}</span>
                  <span className="font-black text-right text-white font-mono">{row.val}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 border-t border-white/5">
              <button
                onClick={() => handleCopyToClipboard("2051533834", t("donate.bank.copied"))}
                className="px-6 py-3 bg-[#0B132B] hover:bg-[#1C2541] border border-white/10 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                {t("donate.bank.copyAccountNumber")}
              </button>
              
              <button
                onClick={() => {
                  const details = `Account Name: HUM HAI HINDU FOUNDATION\nAccount Number: 2051533834\nIFSC Code: KKBK0000193\nBank: Kotak Mahindra Bank\nAccount Type: Current Account`;
                  handleCopyToClipboard(details, t("donate.bank.copied"));
                }}
                className="px-6 py-3 bg-gradient-to-r from-orange-500/20 to-amber-500/20 hover:from-orange-500 hover:to-amber-500 border border-orange-500/20 text-orange-400 hover:text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                {t("donate.bank.copyAllDetails")}
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: CRYPTO TRANSACTIONS */}
        {activeTab === "crypto" && (
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-2xl mx-auto space-y-6 text-center animate-fade-in">
            <Coins className="w-12 h-12 text-orange-400 mx-auto" />
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-xl">{t("donate.crypto.title")}</h3>
              <p className="text-xs text-white/50">{language === "hi" ? "सीमा पार दान के लिए त्वरित क्रिप्टो" : "Instant global cross-border crypto contributions"}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl inline-block border-4 border-orange-500/20 shadow-2xl">
              {/* Uses the QR image as layout */}
              <img src="/crypto-qr.png" alt="Crypto TRC20 QR Code" className="w-64 h-auto object-contain rounded-lg" />
            </div>

            <div className="bg-slate-950 border border-white/10 p-5 rounded-2xl max-w-md mx-auto flex items-center justify-between gap-4 text-xs">
              <div className="text-left font-mono">
                <span className="block text-[8px] uppercase tracking-widest text-white/40 font-bold">{t("donate.crypto.walletAddress")}</span>
                <span className="text-xs font-extrabold text-white break-all">TKhmUEKk2h23MzQMk5e8LvLocdDHu4zy6J</span>
              </div>
              <button
                onClick={() => handleCopyToClipboard("TKhmUEKk2h23MzQMk5e8LvLocdDHu4zy6J", t("donate.crypto.copied"))}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 hover:bg-orange-500 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Warning Box */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 text-xs font-bold flex items-center gap-3 text-left max-w-md mx-auto">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div>
                <span className="block font-black">{t("donate.crypto.warning")}</span>
                <span className="block text-[10px] opacity-60">Network: Tron (TRC20)</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <button
                onClick={() => handleDownloadQR("/crypto-qr.png", "HumHaiHinduFoundation_USDT_TRC20_QR.png")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 hover:bg-orange-500 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                {t("donate.qr.downloadQr")}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* DUAL GRID: ONLINE FORM AND OFFLINE VERIFIER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* ONLINE FORM */}
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="font-extrabold text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-400" />
              {t("donate.form.title")}
            </h3>
            <p className="text-xs text-white/50 mt-1">{language === "hi" ? "सुरक्षित रूप से ऑनलाइन दान करें" : "Simulate automated secure Razorpay online payments"}</p>
          </div>

          {formSuccess ? (
            <div className="p-8 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-center space-y-3">
              <CheckCircle className="w-12 h-12 mx-auto" />
              <h4 className="font-black text-lg">{t("donate.form.successText")}</h4>
              <p className="text-xs opacity-80">{language === "hi" ? "भगवान आपके गौ-सेवा के पुनीत कार्य पर अपनी दया बनाए रखें।" : "May God bless your sacred kindness for Gau Sewa."}</p>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-bold text-white/70">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 uppercase text-white/40">{t("donate.form.donorName")} *</label>
                  <input
                    type="text"
                    required
                    placeholder={t("donate.form.placeholderName")}
                    value={formData.donorName}
                    onChange={e => setFormData({ ...formData, donorName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 uppercase text-white/40">{t("donate.form.mobileNumber")} *</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    placeholder={t("donate.form.placeholderMobile")}
                    value={formData.mobile}
                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 uppercase text-white/40">{t("donate.form.email")}</label>
                <input
                  type="email"
                  placeholder={t("donate.form.placeholderEmail")}
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                />
              </div>

              <div>
                <label className="block mb-1.5 uppercase text-white/40">{t("donate.form.purpose")} *</label>
                <select
                  required
                  value={formData.purpose}
                  onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                >
                  <option value="General Donation">{t("donate.form.purposeGeneral")}</option>
                  <option value="Animal Rescue">{t("donate.form.purposeRescue")}</option>
                  <option value="Medical Treatment">{t("donate.form.purposeTreatment")}</option>
                  <option value="Animal Ambulance">{t("donate.form.purposeAmbulance")}</option>
                  <option value="Food Support">{t("donate.form.purposeFood")}</option>
                  <option value="Shelter Support">{t("donate.form.purposeShelter")}</option>
                </select>
              </div>

              <div>
                <label className="block mb-1.5 uppercase text-white/40">{t("donate.form.amount")} *</label>
                
                {/* Preset Row */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {presets.map(val => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => {
                        setCustomAmount(false);
                        setFormData({ ...formData, amount: String(val) });
                      }}
                      className={`py-2 px-1 border rounded-lg text-xs font-black transition-all cursor-pointer ${
                        formData.amount === String(val) && !customAmount
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "border-white/10 text-white hover:border-orange-500/50"
                      }`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 font-mono font-black text-sm text-white/40">₹</span>
                  <input
                    type="number"
                    required
                    placeholder={language === "hi" ? "कस्टम राशि दर्ज करें" : "Enter custom amount"}
                    value={formData.amount}
                    onChange={e => {
                      setCustomAmount(true);
                      setFormData({ ...formData, amount: e.target.value });
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full py-4 bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-white font-black rounded-xl text-xs shadow-lg shadow-orange-500/10 cursor-pointer"
              >
                {formSubmitting ? t("donate.form.submitting") : t("donate.donateNow")}
              </button>

            </form>
          )}

        </div>

        {/* OFFLINE PROOF SUBMISSION */}
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="font-extrabold text-xl flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-400" />
              {t("donate.verify.title")}
            </h3>
            <p className="text-xs text-white/50 mt-1">{t("donate.verify.desc")}</p>
          </div>

          {proofSuccess ? (
            <div className="p-8 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-center space-y-3">
              <CheckCircle className="w-12 h-12 mx-auto" />
              <h4 className="font-black text-lg">{t("donate.verify.success")}</h4>
            </div>
          ) : (
            <form onSubmit={handleProofSubmit} className="space-y-4 text-xs font-bold text-white/70">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 uppercase text-white/40">{t("donate.verify.donorName")} *</label>
                  <input
                    type="text"
                    required
                    placeholder={t("donate.form.placeholderName")}
                    value={proofData.donorName}
                    onChange={e => setProofData({ ...proofData, donorName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 uppercase text-white/40">{t("donate.verify.mobileNumber")} *</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    placeholder={t("donate.form.placeholderMobile")}
                    value={proofData.mobile}
                    onChange={e => setProofData({ ...proofData, mobile: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 uppercase text-white/40">{t("donate.verify.transactionId")} *</label>
                <input
                  type="text"
                  required
                  placeholder={t("donate.verify.placeholderTxId")}
                  value={proofData.transactionId}
                  onChange={e => setProofData({ ...proofData, transactionId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white font-mono"
                />
              </div>

              {/* Receipt screenshot uploader */}
              <div>
                <label className="block mb-1.5 uppercase text-white/40">{t("donate.verify.screenshot")} *</label>
                
                {proofData.screenshotUrl ? (
                  <div className="relative border border-emerald-500/30 rounded-2xl overflow-hidden bg-slate-950 p-2">
                    <img src={proofData.screenshotUrl} alt="Transaction screenshot proof" className="w-full h-36 object-contain rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setProofData(prev => ({ ...prev, screenshotUrl: "" }))}
                      className="absolute top-4 right-4 p-1.5 bg-red-500 rounded-full text-white font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-white/10 rounded-2xl hover:border-orange-500/50 transition-colors p-6 text-center cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 text-white/30 mx-auto mb-2" />
                    <span className="block text-white/50">{isUploading ? t("donate.verify.submitting") : t("donate.verify.uploadText")}</span>
                    {uploadError && <span className="block text-red-400 mt-2">{uploadError}</span>}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={proofSubmitting || !proofData.screenshotUrl}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 disabled:from-blue-600/50 text-white font-black rounded-xl text-xs shadow-lg cursor-pointer"
              >
                {proofSubmitting ? t("donate.verify.submitting") : t("donate.verify.submitBtn")}
              </button>

            </form>
          )}

        </div>

      </div>

      {/* IMPACT SECTION */}
      <div className="bg-slate-900/50 border-y border-white/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black">{t("donate.impact.title")}</h2>
            <p className="text-xs text-white/60 max-w-md mx-auto">{t("donate.impact.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { amount: "₹501", text: t("donate.impact.food"), icon: Heart, color: "border-orange-500/10 text-orange-400" },
              { amount: "₹1100", text: t("donate.impact.medical"), icon: ShieldCheck, color: "border-amber-500/10 text-amber-400" },
              { amount: "₹2100", text: t("donate.impact.ambulance"), icon: Sparkles, color: "border-blue-500/10 text-blue-400" },
              { amount: "₹5100", text: t("donate.impact.complete"), icon: Check, color: "border-emerald-500/10 text-emerald-400" }
            ].map((item, idx) => (
              <div key={idx} className={`bg-slate-900 border p-6 rounded-3xl space-y-3 text-center ${item.color}`}>
                <item.icon className="w-8 h-8 mx-auto" />
                <div className="text-3xl font-black font-mono">{item.amount}</div>
                <div className="text-xs font-semibold text-white/70">{item.text}</div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* WHY DONATE SECTION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-black">{t("donate.why.title")}</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              t("donate.why.reasonRescue"),
              t("donate.why.reasonAmbulance"),
              t("donate.why.reasonTreatment"),
              t("donate.why.reasonShelter"),
              t("donate.why.reasonTransparent"),
              t("donate.why.reasonCommunity")
            ].map((reason, idx) => (
              <div key={idx} className="flex items-center gap-2 p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                <CheckCircle className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-bold text-white/90">{reason}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 space-y-4">
          <h3 className="font-extrabold text-lg flex items-center gap-2">
            <Info className="w-5 h-5 text-orange-400" />
            {t("donate.about.title")}
          </h3>
          <p className="text-xs text-white/60 leading-relaxed font-semibold">
            {t("donate.about.desc")}
          </p>
        </div>
      </div>

    </div>
  );
}
