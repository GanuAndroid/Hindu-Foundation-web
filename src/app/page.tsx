"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, ShieldCheck, Ambulance, HeartHandshake, CheckCircle2, QrCode, Sparkles, Award, Phone } from "lucide-react";

export default function Home() {
  const [stats, setStats] = useState({
    rescued: 12450,
    teams: 24,
    donations: 1540250,
    cities: 12,
  });

  const [donationForm, setDonationForm] = useState({
    name: "",
    mobile: "",
    amount: "1100",
    mode: "Razorpay Online",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);

  // Load live counts from DB (if any) and merge
  useEffect(() => {
    async function loadStats() {
      try {
        const [ticketsRes, donationsRes] = await Promise.all([
          fetch("/api/tickets").then(r => r.json()),
          fetch("/api/donations").then(r => r.json())
        ]);

        if (Array.isArray(ticketsRes) && Array.isArray(donationsRes)) {
          const closedCount = ticketsRes.filter(t => t.status === "Closed").length;
          const totalDonated = donationsRes.reduce((sum, d) => sum + d.amount, 0);

          setStats(prev => ({
            ...prev,
            rescued: 12450 + closedCount,
            donations: 1540250 + totalDonated,
          }));
        }
      } catch (e) {
        console.warn("Failed to load live database stats, using initial seeds", e);
      }
    }
    loadStats();
  }, []);

  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donationForm.name || !donationForm.mobile || !donationForm.amount) {
      alert("Please fill out all donation details.");
      return;
    }
    setShowRazorpayModal(true);
  };

  const confirmRazorpayPayment = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorName: donationForm.name,
          mobile: donationForm.mobile,
          amount: Number(donationForm.amount),
          paymentMode: donationForm.mode,
        }),
      });

      if (res.ok) {
        const newDonation = await res.json();
        setStats(prev => ({
          ...prev,
          donations: prev.donations + newDonation.amount,
        }));
        setDonationSuccess(true);
        setShowRazorpayModal(false);
        setDonationForm({ name: "", mobile: "", amount: "1100", mode: "Razorpay Online" });
        setTimeout(() => setDonationSuccess(false), 5000);
      } else {
        alert("Failed to register donation. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting the donation server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col bg-[#0B132B] min-h-screen text-white overflow-x-hidden font-sans">
      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/10 via-[#0B132B] to-[#0B132B] px-4 py-20 border-b border-white/5">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=1600&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center z-10 space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-black tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            HUM HAI HINDU FOUNDATION
          </div>
          
          <h1 className="text-4xl md:text-7xl font-black tracking-tight leading-tight">
            Protecting Animals Through <br className="hidden md:inline" />
            <span className="bg-gradient-to-r from-[#F15A24] to-[#FF8C00] bg-clip-text text-transparent">
              Fast Rescue & Care
            </span>
          </h1>
          
          <p className="text-white/70 max-w-3xl mx-auto text-base md:text-xl font-medium leading-relaxed">
            Serving humanity through animal rescue, emergency medical assistance, ambulance services, shelter support, and volunteer coordination.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Link
              href="#donate"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-white font-extrabold rounded-2xl shadow-xl shadow-orange-500/20 hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-2"
            >
              <Heart className="w-5 h-5 fill-current" />
              Donate Online Now
            </Link>
            <Link
              href="/auth?role=user"
              className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <Ambulance className="w-5 h-5 text-orange-400" />
              Report Case Online
            </Link>
            <a
              href="https://wa.me/918447816192"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-extrabold rounded-2xl shadow-xl shadow-green-500/20 hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.057 5.291 5.348.002 11.857.002c3.15.001 6.112 1.23 8.338 3.461 2.227 2.229 3.453 5.19 3.45 8.341-.005 6.56-5.296 11.848-11.805 11.848-2.006-.002-3.98-.51-5.731-1.479L0 24zm6.59-4.846c1.6.95 3.398 1.452 5.228 1.453h.011c5.44 0 9.866-4.42 9.87-9.856.002-2.633-1.02-5.107-2.882-6.97C16.993 1.87 14.525.842 11.89.842c-5.45 0-9.877 4.421-9.882 9.858-.002 1.848.482 3.655 1.401 5.257L2.4 21.055l5.247-1.378zm11.236-4.577c-.307-.154-1.82-.898-2.102-1.001-.282-.102-.488-.153-.692.154-.204.307-.79.997-.969 1.2-.178.204-.356.229-.663.076-.307-.154-1.297-.478-2.47-1.524-.913-.815-1.53-1.82-1.709-2.127-.179-.307-.019-.473.135-.626.139-.138.307-.358.461-.537.154-.179.205-.307.307-.512.103-.205.051-.384-.026-.537-.076-.154-.692-1.666-.948-2.28-.249-.597-.502-.516-.692-.525-.179-.009-.384-.01-.59-.01-.205 0-.538.077-.82.384-.282.307-1.077 1.05-1.077 2.562 0 1.511 1.1 2.972 1.253 3.177.154.205 2.164 3.303 5.242 4.633.732.316 1.302.505 1.748.647.734.233 1.402.2 1.93.121.588-.088 1.82-.743 2.076-1.46.256-.717.256-1.332.179-1.46-.077-.127-.282-.204-.589-.359z"/>
              </svg>
              Rescue: WhatsApp Only (No Calls)
            </a>
          </div>
        </div>
      </section>

      {/* MISSION & ABOUT SECTION */}
      <section id="about" className="py-24 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="text-[#F15A24] font-black text-xs uppercase tracking-widest flex items-center gap-2">
              <Award className="w-4 h-4" />
              Our Sacred Duty
            </div>
            <h2 className="text-3xl md:text-5xl font-black leading-tight">
              Dedicated to Protecting Every Innocent Soul
            </h2>
            <p className="text-white/70 text-base md:text-lg leading-relaxed">
              Hum Hai Hindu Foundation is deeply dedicated to protecting injured and abandoned animals by providing rapid emergency rescue services, direct medical assistance, specialized animal ambulances, and rehab shelter support.
            </p>
            <p className="text-white/60 text-sm leading-relaxed">
              We operate across key spiritual zones and cities, ensuring that cows, street dogs, monkeys, birds, and other animals are never left to suffer. Our platform integrates citizens, quick rescue teams, and expert veterinarians into a single cohesive dispatch network.
            </p>
          </div>

          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
            <img
              src="/rescued-cow.png"
              alt="Rescued Cow"
              className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 bg-slate-900/80 backdrop-blur border border-white/5 p-6 rounded-2xl">
              <h4 className="font-bold text-white mb-1">Active Shelter Care</h4>
              <p className="text-xs text-white/70">Over 1,200 animals are currently undergoing veterinary rehab in our Varanasi and Ayodhya shelters.</p>
            </div>
          </div>
        </div>
      </section>

      {/* STATISTICS SECTION */}
      <section className="bg-gradient-to-b from-[#0B132B] to-[#060B18] py-20 px-4 border-y border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: "Animals Rescued", value: stats.rescued.toLocaleString(), icon: Ambulance },
            { label: "Active Rescue Teams", value: stats.teams, icon: ShieldCheck },
            { label: "Donations Received", value: `₹${stats.donations.toLocaleString()}`, icon: HeartHandshake },
            { label: "Cities Covered", value: stats.cities, icon: Sparkles },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl text-center space-y-2 hover:border-orange-500/20 transition-all duration-300">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-2xl md:text-4xl font-black text-white">{stat.value}</div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-white/50">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-24 px-4 max-w-7xl mx-auto text-center space-y-16">
        <div className="space-y-4">
          <span className="text-[#F15A24] font-black text-xs uppercase tracking-widest">Operation Pipeline</span>
          <h2 className="text-3xl md:text-5xl font-black">How It Works</h2>
          <p className="text-white/60 max-w-lg mx-auto text-sm">Four structured phases of animal salvation from citizen reporting to permanent recovery.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {[
            { step: "Step 1", title: "Report Animal", desc: "Upload photos & videos, auto-detect location GPS pin under emergency Event 112." },
            { step: "Step 2", title: "Rescue Dispatched", desc: "Nearby rescue team gets notified, accepts ticket, and reaches in ambulance." },
            { step: "Step 3", title: "Medical Treatment", desc: "Immediate first aid is provided on-site or shifted to gaushala/hospital." },
            { step: "Step 4", title: "Case Closed", desc: "Citizen is notified with final proof recovery photo and transparent closure logs." },
          ].map((item, idx) => (
            <div key={idx} className="bg-white/[0.01] border border-white/5 p-8 rounded-3xl space-y-4 relative hover:bg-white/[0.02] transition-all">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-white text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full shadow-md">
                {item.step}
              </div>
              <h3 className="font-extrabold text-lg pt-2">{item.title}</h3>
              <p className="text-xs text-white/60 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DONATION SECTION */}
      <section id="donate" className="py-24 px-4 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-orange-500/10 via-[#0B132B] to-[#0B132B] border-t border-white/5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* Donation Info & Methods */}
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="text-orange-500 font-black text-xs uppercase tracking-widest">Support the Cause</span>
              <h2 className="text-3xl md:text-5xl font-black">Sacred Animal Charity</h2>
              <p className="text-white/70 text-sm md:text-base leading-relaxed">
                Your contributions directly fund critical veterinary medicines, sterile surgical gears, animal transit ambulances, and fodder/shelter for recovering holy cows, street dogs, and birds.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* UPI ID card */}
              <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl space-y-3">
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Method A: UPI Payment</span>
                <p className="text-xs text-white/60">Pay instantly from any banking app like GPay, PhonePe, Paytm, BHIM.</p>
                <div
                  className="bg-white/5 p-3 rounded-lg border border-orange-500/30 text-sm font-black text-orange-300 text-center select-all cursor-pointer hover:bg-orange-500/10 transition-colors"
                  onClick={() => { navigator.clipboard.writeText('8447816192@kotak'); }}
                  title="Click to copy UPI ID"
                >
                  8447816192@kotak
                </div>
                <p className="text-[10px] text-white/30 text-center">Tap to copy • Powered by Kotak Mahindra Bank</p>
              </div>

              {/* QR Code Card */}
              <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Method B: Scan QR</span>
                <div className="bg-white p-2 rounded-xl shadow-lg">
                  <img
                    src="/upi-qr.jpg"
                    alt="UPI QR Code - HUM HAI HINDU FOUNDATION - 8447816192@kotak"
                    className="w-28 h-28 object-contain rounded-lg"
                  />
                </div>
                <span className="text-[9px] text-white/40">Scan with GPay · PhonePe · BHIM · Paytm</span>
                <span className="text-[9px] font-bold text-orange-400/70">8447816192@kotak</span>
              </div>
            </div>
          </div>

          {/* Simulated Razorpay Checkout Form */}
          <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
            <h3 className="font-extrabold text-xl mb-6 text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-400" />
              Method C: Online Donation Form
            </h3>

            {donationSuccess && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Thank you! Payment of ₹{donationForm.amount} was received successfully. God Bless Your Kindness!
              </div>
            )}

            <form onSubmit={handleDonationSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">Donor Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={donationForm.name}
                  onChange={(e) => setDonationForm({ ...donationForm, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">Mobile Number</label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  placeholder="Enter 10-digit mobile"
                  value={donationForm.mobile}
                  onChange={(e) => setDonationForm({ ...donationForm, mobile: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">Donation Amount (INR)</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {["501", "1100", "2100", "5100"].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDonationForm({ ...donationForm, amount: amt })}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                        donationForm.amount === amt
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Or enter custom amount"
                  value={donationForm.amount}
                  onChange={(e) => setDonationForm({ ...donationForm, amount: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors text-white font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-white font-black rounded-xl shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Heart className="w-5 h-5 fill-current" />
                Donate Online
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* RAZORPAY MODAL SIMULATION */}
      {showRazorpayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-white/20 max-w-md w-full rounded-3xl p-6 shadow-2xl relative">
            <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                  <QrCode className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-sm text-blue-400">RAZORPAY SECURE GATEWAY</span>
              </div>
              <button
                onClick={() => setShowRazorpayModal(false)}
                className="text-white/40 hover:text-white text-xs font-bold border border-white/10 px-2.5 py-1 rounded-lg"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-4 text-center">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 inline-block mx-auto">
                <span className="block text-[10px] text-white/50 uppercase tracking-widest font-black">Paying to</span>
                <span className="font-black text-white text-base">HUM HAI HINDU FOUNDATION</span>
              </div>

              <div className="text-3xl font-black text-white font-mono py-2">
                ₹{Number(donationForm.amount).toLocaleString()}
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 p-4 rounded-xl text-left text-xs space-y-1">
                <span className="block font-bold">Simulating Payment Mode: UPI/Card API</span>
                <span className="block text-white/60">A secure simulated webhook transaction is launched. Click Confirm to finalize this charitable contribution.</span>
              </div>

              <button
                onClick={confirmRazorpayPayment}
                disabled={isSubmitting}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-black rounded-xl shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center gap-2 text-sm"
              >
                {isSubmitting ? "Processing Payment..." : "Confirm & Pay (Simulate Success)"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
