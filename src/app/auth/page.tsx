"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Heart, Smartphone, ShieldCheck, UserCheck, AlertTriangle } from "lucide-react";

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Detect role from URL query param, default to "user" (citizen)
  const roleFromUrl = (searchParams.get("role") as any) || "user";
  const [role, setRole] = useState<"user" | "team" | "admin">(roleFromUrl);

  const { sendOtp, verifyOtp, error, user } = useAuth();

  const [mobile, setMobile] = useState("");
  const [name, setName] = useState(""); // For new signup
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showDemoCodeAlert, setShowDemoCodeAlert] = useState(false);

  // Sync role if URL query param changes
  useEffect(() => {
    const urlRole = searchParams.get("role") as any;
    if (urlRole && ["user", "team", "admin"].includes(urlRole)) {
      setRole(urlRole);
    }
  }, [searchParams]);

  // If already logged in, redirect to correct dashboard
  useEffect(() => {
    if (user) {
      if (user.role === "admin") router.push("/dashboard/admin");
      else if (user.role === "team") router.push("/dashboard/team");
      else router.push("/dashboard/user");
    }
  }, [user, router]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile || mobile.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSending(true);
    const success = await sendOtp(mobile, role);
    setIsSending(false);

    if (success) {
      setStep("otp");
      setShowDemoCodeAlert(true);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      alert("Please enter the 6-digit OTP code.");
      return;
    }

    setIsVerifying(true);
    const loggedInUser = await verifyOtp(otp, name);
    setIsVerifying(false);

    if (loggedInUser) {
      if (loggedInUser.role === "admin") router.push("/dashboard/admin");
      else if (loggedInUser.role === "team") router.push("/dashboard/team");
      else router.push("/dashboard/user");
    }
  };

  const getRoleTitle = () => {
    if (role === "admin") return "Administrator Gateway";
    if (role === "team") return "Rescue Team Operations";
    return "Citizen Reporting Portal";
  };

  const getRoleBadgeColor = () => {
    if (role === "admin") return "from-purple-500 to-indigo-600 border-purple-500/30";
    if (role === "team") return "from-blue-500 to-cyan-600 border-blue-500/30";
    return "from-[#F15A24] to-[#FF8C00] border-orange-500/30";
  };

  return (
    <div className="flex-grow flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/5 via-[#0B132B] to-[#0B132B] px-4 py-20">
      {/* Hidden container required by Firebase Auth to mount reCAPTCHA invisibly */}
      <div id="recaptcha-container" className="hidden"></div>
      
      <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Top Saffron Glow Decoration */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#F15A24] to-[#FF8C00]" />

        <div className="text-center space-y-4 mb-8">
          <div className="mx-auto w-32 h-32 rounded-full overflow-hidden border border-orange-500/30 shadow-lg shadow-orange-500/10 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Hum Hai Hindu Foundation Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex justify-center gap-1.5 mb-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border bg-gradient-to-r ${getRoleBadgeColor()}`}>
                {role} role
              </span>
            </div>
            <h2 className="text-2xl font-black text-white">{getRoleTitle()}</h2>
            <p className="text-xs text-white/50 mt-1">HUM HAI | HINDU FOUNDATION</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* STEP A: MOBILE INPUT */}
        {step === "mobile" && (
          <form onSubmit={handleSendOtp} className="space-y-5">



            {role === "user" && (
              <div>
                <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">Full Name (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors text-white"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">Mobile Number</label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  placeholder="Enter 10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors text-white font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-3.5 bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-white font-black rounded-xl shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {isSending ? "Requesting OTP..." : "Get OTP Verification Code"}
            </button>
          </form>
        )}

        {/* STEP B: OTP VERIFICATION */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            {showDemoCodeAlert && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="block">Firebase OTP Sent!</span>
                  <span className="block font-medium text-[11px] text-white/70 mt-0.5">Please check your mobile phone for the 6-digit SMS verification code.</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-white/60 uppercase mb-2 text-center">Enter 6-Digit OTP</label>
              <input
                type="text"
                required
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-lg font-black tracking-[0.4em] focus:outline-none focus:border-orange-500 transition-colors text-white font-mono placeholder:tracking-normal placeholder:font-bold"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("mobile")}
                className="w-1/3 py-3 border border-white/10 rounded-xl text-xs font-bold text-white/60 hover:text-white transition-colors"
              >
                Go Back
              </button>
              <button
                type="submit"
                disabled={isVerifying}
                className="w-2/3 py-3 bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-white font-black rounded-xl shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                {isVerifying ? "Verifying..." : "Verify & Sign In"}
              </button>
            </div>
          </form>
        )}

        {/* Role Quick Toggle at Footer */}
        <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs space-y-2">
          <span className="text-white/40 font-semibold block">Need another gateway?</span>
          <div className="flex justify-center gap-4 text-[#F15A24] font-bold">
            {role !== "user" && (
              <button onClick={() => { setRole("user"); setStep("mobile"); }} className="hover:underline">Citizen Reporter</button>
            )}
            {role !== "team" && (
              <button onClick={() => { setRole("team"); setStep("mobile"); }} className="hover:underline">Rescue Team</button>
            )}
            {role !== "admin" && (
              <button onClick={() => { setRole("admin"); setStep("mobile"); }} className="hover:underline">NGO Admin</button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center bg-[#0B132B] text-white py-20">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Securing Connection...</p>
        </div>
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}
