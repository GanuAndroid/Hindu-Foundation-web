"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import MapSelector from "@/components/MapSelector";
import {
  ShieldAlert,
  Ambulance,
  CheckCircle,
  FileImage,
  Clock,
  User,
  Phone,
  Filter,
  CheckSquare,
  AlertTriangle,
  FolderMinus,
  Sparkles,
  Camera,
  Info,
  X,
  Video,
  MessageCircle,
  Navigation
} from "lucide-react";
import { Ticket } from "@/lib/types";

export default function RescueTeamDashboard() {
  const { user, loading } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();

  // Tickets state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [activeHistory, setActiveHistory] = useState<any[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"All" | "Pending" | "Accepted" | "Closed">("All");

  // Interaction Modals/Forms state
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Forms data
  const [pendingForm, setPendingForm] = useState({
    reason: "Ambulance Not Found",
    description: "",
  });

  const [closeForm, setCloseForm] = useState({
    reason: "Treatment Completed",
    description: "",
    photoUrl: "",
  });

  const [closePhotoPreview, setClosePhotoPreview] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);

  // Premium media lightbox states
  const [activeLightbox, setActiveLightbox] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);

  // Auto-pending countdown visual simulator state
  const [countdownStr, setCountdownStr] = useState("03:00:00");

  // Redirect if not team role
  useEffect(() => {
    if (!loading && (!user || user.role !== "team")) {
      router.push("/auth?role=team");
    }
  }, [user, loading, router]);

  // Load all tickets
  const loadTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const res = await fetch("/api/tickets");
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
        if (activeTicket) {
          const fresh = data.find((tItem: Ticket) => tItem.id === activeTicket.id);
          if (fresh) {
            setActiveTicket(fresh);
            const histRes = await fetch(`/api/tickets/${fresh.id}`);
            if (histRes.ok) {
              const histData = await histRes.json();
              setActiveHistory(histData.history || []);
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // Update timer for 3-hour countdown
  useEffect(() => {
    const timer = setInterval(() => {
      if (activeTicket && activeTicket.status === "Accepted" && activeTicket.acceptedAt) {
        const acceptTime = new Date(activeTicket.acceptedAt).getTime();
        const threeHoursMs = 3 * 60 * 60 * 1000;
        const limitTime = acceptTime + threeHoursMs;
        const now = Date.now();
        const diffMs = limitTime - now;

        if (diffMs <= 0) {
          setCountdownStr("AUTO-REVERTING...");
          loadTickets();
        } else {
          const h = Math.floor(diffMs / (3600 * 1000));
          const m = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
          const s = Math.floor((diffMs % (60 * 1000)) / 1000);
          setCountdownStr(
            `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
          );
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTicket]);

  const handleSelectTicket = async (ticket: Ticket) => {
    setActiveTicket(ticket);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveHistory(data.history || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ACCEPT RESCUE TICKET
  const handleAcceptRescue = async () => {
    if (!activeTicket || !user) return;
    setIsSubmittingAction(true);
    try {
      const res = await fetch(`/api/tickets/${activeTicket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "accept",
          updaterName: user.memberName || user.name,
          assignedRescueTeamId: user.teamId || "team-1",
          assignedRescueTeamName: user.teamName || user.name,
          assignedRescueTeamMobile: user.mobile,
        }),
      });

      if (res.ok) {
        loadTickets();
      } else {
        alert("Failed to accept rescue");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // REVERT BACK TO PENDING
  const handleMarkPendingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !user) return;

    if (pendingForm.reason === "Other" && (!pendingForm.description || pendingForm.description.trim().length === 0)) {
      alert("A custom reason description is required.");
      return;
    }

    setIsSubmittingAction(true);
    try {
      const res = await fetch(`/api/tickets/${activeTicket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pending",
          updaterName: user.memberName || user.name,
          pendingReason: pendingForm.reason,
          pendingDescription: pendingForm.description,
        }),
      });

      if (res.ok) {
        setShowPendingModal(false);
        setPendingForm({ reason: "Ambulance Not Found", description: "" });
        loadTickets();
      } else {
        alert("Failed to mark pending");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // CLOSE TICKET SUBMIT
  const handleCloseTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !user) {
      console.warn("[CLOSE RESCUE] Submit blocked: activeTicket or user is null", { activeTicket, user });
      return;
    }

    console.log("[CLOSE RESCUE] Initiating form submit...", { closeForm });

    if (!closeForm.photoUrl) {
      alert(
        language === "hi"
          ? "कृपया समाधान का फ़ोटो प्रमाण अपलोड करें।"
          : "Please upload a photo proof of resolution."
      );
      return;
    }
    if (closeForm.reason === "Other" && (!closeForm.description || closeForm.description.trim().length === 0)) {
      alert(
        language === "hi"
          ? "कृपया समाधान का विवरण दर्ज करें।"
          : "Please provide resolution details for the 'Other' reason."
      );
      return;
    }

    setIsSubmittingAction(true);
    try {
      const payload = {
        action: "close",
        updaterName: user.memberName || user.name,
        closureReason: closeForm.reason,
        closureDescription: closeForm.description,
        closurePhotoUrl: closeForm.photoUrl,
      };

      console.log("[CLOSE RESCUE] Sending PUT request to backend...", { payload });

      const res = await fetch(`/api/tickets/${activeTicket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        console.log("[CLOSE RESCUE] Ticket closed successfully!");
        setShowCloseModal(false);
        setCloseForm({ reason: "Treatment Completed", description: "", photoUrl: "" });
        setClosePhotoPreview("");
        loadTickets();
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("[CLOSE RESCUE] API returned error response:", { status: res.status, errData });
        alert(
          language === "hi"
            ? `रेस्क्यू बंद करने में विफल: ${errData.error || "सिस्टम त्रुटि"}`
            : `Failed to close rescue ticket: ${errData.error || "Unknown system error"}`
        );
      }
    } catch (e) {
      console.error("[CLOSE RESCUE] Network/System error during submit:", e);
      alert("System error communicating with server.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle final photo proof upload
  const handleClosePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 5MB max
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_IMAGE_SIZE) {
      alert(
        language === "hi"
          ? "फ़ोटो का आकार 5MB से अधिक नहीं होना चाहिए।"
          : "Photo file size must not exceed 5MB."
      );
      e.target.value = "";
      setClosePhotoPreview("");
      return;
    }

    setClosePhotoPreview(URL.createObjectURL(file));
    setPhotoUploading(true);

    const uploadForm = new FormData();
    uploadForm.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadForm,
      });

      if (res.ok) {
        const data = await res.json();
        setCloseForm(prev => ({ ...prev, photoUrl: data.url }));
      } else {
        alert(
          language === "hi"
            ? "फ़ोटो अपलोड विफल रहा। कृपया 5MB से छोटी फ़ाइल का उपयोग करें।"
            : "Photo upload failed. Please use a file smaller than 5MB."
        );
        e.target.value = "";
        setClosePhotoPreview("");
      }
    } catch (err) {
      console.error(err);
      alert(
        language === "hi"
          ? "फ़ोटो अपलोड में त्रुटि हुई। कृपया पुन: प्रयास करें।"
          : "Error uploading photo. Please try again."
      );
      e.target.value = "";
      setClosePhotoPreview("");
    } finally {
      setPhotoUploading(false);
    }
  };

  // Filtered tickets lists
  const visibleTickets = tickets.filter((tItem) => {
    if (tItem.status === "Pending") return true;
    return user?.teamId ? tItem.assignedRescueTeamId === user.teamId : tItem.assignedRescueTeamName === user?.name;
  });

  const filteredTickets = visibleTickets.filter((tItem) => {
    if (filterStatus === "All") return true;
    return tItem.status === filterStatus;
  });

  // Stats calculation
  const total = visibleTickets.length;
  const pending = visibleTickets.filter((tItem) => tItem.status === "Pending").length;
  const accepted = visibleTickets.filter((tItem) => tItem.status === "Accepted").length;
  const closed = visibleTickets.filter((tItem) => tItem.status === "Closed").length;

  const getStatusTranslation = (status: string) => {
    if (status === "Pending") return t("user.pending");
    if (status === "Accepted") return t("user.accepted");
    if (status === "Closed") return t("user.closed");
    return status;
  };

  const getAnimalTypeTranslation = (type: string) => {
    switch (type) {
      case "Cow": return language === "hi" ? "गाय (Cow)" : "Cow";
      case "Dog": return language === "hi" ? "कुत्ता (Dog)" : "Dog";
      case "Monkey": return language === "hi" ? "बंदर (Monkey)" : "Monkey";
      case "Cat": return language === "hi" ? "बिल्ली (Cat)" : "Cat";
      case "Bird": return language === "hi" ? "पक्षी (Bird)" : "Bird";
      case "Snake": return language === "hi" ? "साँप (Snake)" : "Snake";
      case "Other": return language === "hi" ? "अन्य (Other)" : "Other";
      default: return type;
    }
  };

  const getPendingReasonTranslation = (reason: string) => {
    switch (reason) {
      case "Ambulance Not Found": return t("team.ambulanceNotFound");
      case "Animal Not Found": return t("team.animalNotFound");
      case "Team Not Available": return t("team.teamNotAvailable");
      case "Other": return t("team.otherReason");
      default: return reason;
    }
  };

  const getClosureReasonTranslation = (reason: string) => {
    switch (reason) {
      case "Treatment Completed": return t("team.treatmentCompleted");
      case "Sent To Gaushala": return t("team.sentToGaushala");
      case "Referred To Hospital": return language === "hi" ? "अस्पताल भेजा गया (Referred To Hospital)" : "Referred To Hospital";
      case "Animal Recovered": return language === "hi" ? "पशु स्वस्थ हुआ (Animal Recovered)" : "Animal Recovered";
      case "Other": return t("team.otherReason");
      default: return reason;
    }
  };

  if (loading || !user) {
    return (
      <div className="flex-grow flex items-center justify-center bg-[#0B132B] min-h-screen text-white">
        <span className="font-extrabold text-sm tracking-wider text-orange-500 animate-pulse">
          VERIFYING TEAM PERMISSIONS...
        </span>
      </div>
    );
  }

  return (
    <div className="flex-grow bg-[#0B132B] text-white p-6 max-w-7xl mx-auto w-full space-y-8 min-h-screen">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-[#F15A24] font-black text-xs uppercase tracking-widest block">{t("team.dashboardTitle")}</span>
          <h1 className="text-3xl font-black mt-1">{t("team.welcome")}, {user.memberName || user.name}</h1>
          {user.teamName && (
            <p className="text-xs text-orange-400 font-bold mt-1">
              {language === "hi" ? "बचाव दल" : "Team"}: {user.teamName}
            </p>
          )}
          <p className="text-xs text-white/50 mt-1">Manage local emergency callouts and perform active veterinary treatments.</p>
        </div>
      </div>

      {/* DASHBOARD STATISTICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t("team.totalTasks"), val: total, color: "border-white/10 text-white/80" },
          { label: t("team.activeCases"), val: pending, color: "border-amber-500/20 text-amber-400" },
          { label: t("user.accepted"), val: accepted, color: "border-blue-500/20 text-blue-400" },
          { label: t("team.completedRescues"), val: closed, color: "border-emerald-500/20 text-emerald-400" },
        ].map((item, idx) => (
          <div key={idx} className={`bg-white/[0.01] border p-5 rounded-2xl space-y-1 ${item.color}`}>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">{item.label}</span>
            <div className="text-3xl font-black">{item.val}</div>
          </div>
        ))}
      </div>

      {/* FILTERS TOOLBAR */}
      <div className="flex gap-2 bg-slate-900 border border-white/5 p-2 rounded-2xl max-w-lg">
        {["All", "Pending", "Accepted", "Closed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s as any)}
            className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
              filterStatus === s
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/10"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            {s === "Pending" ? t("user.pending") : s === "Accepted" ? t("user.accepted") : s === "Closed" ? t("user.closed") : "All"}
          </button>
        ))}
      </div>

      {/* TICKET LIST AND CASE VIEW DETAIL */}
      <div className="space-y-4">
        
        {/* Ticket List (Full Width) */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-lg flex items-center gap-2">
            <Filter className="w-5 h-5 text-orange-400" />
            {t("team.activeCases")} ({filteredTickets.length})
          </h3>

          {isLoadingTickets ? (
            <div className="py-20 text-center text-xs text-white/40">Loading active tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="border border-white/5 bg-slate-900/40 p-12 text-center text-xs text-white/40 rounded-3xl">
              No rescue tickets exist in this filter category.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((tItem) => (
                <div
                  key={tItem.id}
                  onClick={() => handleSelectTicket(tItem)}
                  className={`bg-white/[0.01] border border-white/5 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-all ${
                    activeTicket?.id === tItem.id ? "border-orange-500/30 bg-orange-500/[0.02]" : ""
                  }`}
                >
                  <div className="flex gap-3 items-center">
                    <img
                      src={tItem.imageUrl}
                      alt={tItem.animalType}
                      className="w-12 h-12 object-cover rounded-lg border border-white/10"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-white">{tItem.id}</span>
                        <span className="text-[10px] text-white/40">({getAnimalTypeTranslation(tItem.animalType)})</span>
                      </div>
                      <p className="text-[10px] text-white/50 line-clamp-1 mt-0.5">{tItem.description}</p>
                      <span className="text-[9px] text-white/30 block mt-1">
                        {new Date(tItem.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                      tItem.status === "Closed"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : tItem.status === "Accepted"
                        ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    }`}
                  >
                    {getStatusTranslation(tItem.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* REVERT PENDING MODAL */}
      {showPendingModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-start bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-white/20 max-w-md w-full rounded-3xl p-6 shadow-2xl relative mx-auto my-auto">
            <h3 className="text-lg font-black text-white mb-4 border-b border-white/5 pb-3">{t("team.markPending")}</h3>
            
            <form onSubmit={handleMarkPendingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">{t("team.reasonForRevert")}</label>
                <select
                  value={pendingForm.reason}
                  onChange={(e) => setPendingForm({ ...pendingForm, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  {["Ambulance Not Found", "Animal Not Found", "Team Not Available", "Other"].map((r) => (
                    <option key={r} value={r}>
                      {getPendingReasonTranslation(r)}
                    </option>
                  ))}
                </select>
              </div>

              {pendingForm.reason === "Other" && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">{t("user.description")}</label>
                  <textarea
                    required
                    rows={2}
                    value={pendingForm.description}
                    onChange={(e) => setPendingForm({ ...pendingForm, description: e.target.value })}
                    placeholder={t("team.placeholderRevertRemarks")}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-orange-500 text-white"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPendingModal(false)}
                  className="w-1/3 py-3 border border-white/10 rounded-xl text-xs font-bold text-white/60 hover:text-white"
                >
                  {t("admin.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="w-2/3 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-slate-950 font-black rounded-xl text-xs transition-colors flex items-center justify-center cursor-pointer"
                >
                  {t("team.saveRemarks")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLOSE RESCUE MISSION MODAL */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-start bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-white/20 max-w-lg w-full rounded-3xl p-6 shadow-2xl relative mx-auto my-auto">
            <h3 className="text-lg font-black text-white mb-4 border-b border-white/5 pb-3">{t("team.closeTicket")}</h3>

            <form onSubmit={handleCloseTicketSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">{t("team.closureReason")}</label>
                <select
                  value={closeForm.reason}
                  onChange={(e) => setCloseForm({ ...closeForm, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  {["Treatment Completed", "Sent To Gaushala", "Referred To Hospital", "Animal Recovered", "Other"].map((r) => (
                    <option key={r} value={r}>
                      {getClosureReasonTranslation(r)}
                    </option>
                  ))}
                </select>
              </div>

              {closeForm.reason === "Other" && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">{t("user.description")}</label>
                  <textarea
                    required
                    rows={2}
                    value={closeForm.description}
                    onChange={(e) => setCloseForm({ ...closeForm, description: e.target.value })}
                    placeholder={t("team.placeholderClosureDesc")}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-orange-500 text-white"
                  />
                </div>
              )}

              <div className="border-2 border-dashed border-white/10 hover:border-orange-500/30 rounded-2xl p-4 text-center space-y-3 transition-colors relative">
                <span className="block text-xs font-bold text-white/60 uppercase">{t("team.closurePhoto")} *</span>
                
                <div className="flex flex-col gap-2 w-full pt-1">
                  <label className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#F15A24] to-[#FF8C00] hover:opacity-90 text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-all shadow-md shadow-orange-500/10">
                    <Camera className="w-4 h-4" />
                    {language === "hi" ? "कैमरा से फोटो खींचें" : "Take Photo (Camera)"}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleClosePhotoChange}
                      className="hidden"
                    />
                  </label>
                  <label className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer border border-white/10 transition-colors">
                    <FileImage className="w-4 h-4 text-orange-400" />
                    {language === "hi" ? "गैलरी से फोटो चुनें" : "Upload from Gallery"}
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleClosePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {photoUploading && <div className="text-[10px] text-orange-400 font-bold">Uploading file...</div>}
                {closePhotoPreview && (
                  <img
                    src={closePhotoPreview}
                    className="mx-auto w-full h-32 object-cover rounded-xl mt-2 border border-white/5"
                    alt="Preview Closure"
                  />
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="w-1/3 py-3 border border-white/10 rounded-xl text-xs font-bold text-white/60 hover:text-white"
                >
                  {t("admin.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction || photoUploading}
                  className="w-2/3 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 disabled:bg-emerald-600/50 text-white font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  {t("team.submitClosure")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* TICKET DETAILS DIALOG MODAL */}
      {activeTicket && !showCloseModal && !showPendingModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-start bg-black/85 backdrop-blur-sm p-4 overflow-y-auto pt-10 pb-10 animate-fade-in">
          <div className="bg-slate-900 border border-white/20 max-w-4xl w-full rounded-3xl p-6 shadow-2xl relative mx-auto my-auto space-y-6 font-sans text-white">
            
            {/* Header control toolbar */}
            <div className="flex justify-between items-start border-b border-white/5 pb-4">
              <div>
                <span className="text-[#F15A24] font-black text-[10px] uppercase tracking-widest block">{t("team.actions")}</span>
                <h3 className="text-xl font-black mt-1 text-white flex items-center gap-2">
                  {activeTicket.id}
                  <span className="text-xs text-white/50">({getAnimalTypeTranslation(activeTicket.animalType)})</span>
                </h3>
                <span className="text-[10px] text-white/40 block mt-0.5">{t("team.reportedBy")}: Citizen Reporter | Case ID: {activeTicket.eventId || "112"}</span>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                    activeTicket.status === "Closed"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : activeTicket.status === "Accepted"
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  }`}
                >
                  {getStatusTranslation(activeTicket.status)}
                </span>
                <button
                  onClick={() => { setActiveTicket(null); setActiveHistory([]); }}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all cursor-pointer border border-white/5"
                  title="Close Details Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Media previews grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Photo Preview */}
              <div>
                <span className="block text-[9px] uppercase font-bold text-white/40 mb-1">{t("user.uploadPhoto")}</span>
                {activeTicket.imageUrl ? (
                  <div
                    onClick={() => { setActiveLightbox({ url: activeTicket.imageUrl, type: "image" }); setLightboxZoom(1); }}
                    className="relative group rounded-xl overflow-hidden border border-white/5 cursor-zoom-in hover:border-orange-500/30 transition-all duration-300"
                  >
                    <img
                      src={activeTicket.imageUrl}
                      className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                      alt="Incident photo"
                    />
                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-3 py-1.5 bg-slate-900/95 text-[10px] font-black uppercase tracking-widest text-orange-400 border border-orange-500/30 rounded-xl">Zoom Photo</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/[0.01] border border-white/5 rounded-xl h-44 flex flex-col items-center justify-center text-center p-4 text-white/30 space-y-2">
                    <FileImage className="w-8 h-8 opacity-50" />
                    <span className="text-xs font-bold uppercase tracking-wider">No Image Uploaded</span>
                  </div>
                )}
              </div>

              {/* Video Preview */}
              <div>
                <span className="block text-[9px] uppercase font-bold text-white/40 mb-1">{t("user.uploadVideo")}</span>
                {activeTicket.videoUrl ? (
                  <div
                    onClick={() => { setActiveLightbox({ url: activeTicket.videoUrl, type: "video" }); }}
                    className="relative group rounded-xl overflow-hidden border border-white/5 cursor-pointer hover:border-orange-500/30 transition-all duration-300 bg-black"
                  >
                    <video
                      src={activeTicket.videoUrl}
                      className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                    />
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center group-hover:bg-black/25 transition-all">
                      <span className="px-3.5 py-1.5 bg-slate-900/95 text-[10px] font-black uppercase tracking-widest text-orange-400 border border-orange-500/30 rounded-xl flex items-center gap-1.5">
                        <Video className="w-4 h-4" /> Play Video
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/[0.01] border border-white/5 rounded-xl h-44 flex flex-col items-center justify-center text-center p-4 text-white/30 space-y-2">
                    <Video className="w-8 h-8 opacity-50" />
                    <span className="text-xs font-bold uppercase tracking-wider">No Video Uploaded</span>
                  </div>
                )}
              </div>
            </div>

            {/* Google Map selector */}
            <MapSelector onLocationSelect={() => {}} initialLat={activeTicket.latitude} initialLng={activeTicket.longitude} readonly={true} />

            {/* Accepted Ticket - Reporter Details Box */}
            {activeTicket.status === "Accepted" && (
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-orange-500 animate-pulse" />
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-orange-500">Citizen Reporter Contact Info</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center text-xs">
                  <div>
                    <span className="block text-[9px] text-white/40 font-bold uppercase">Reporter Name / नाम</span>
                    <span className="font-extrabold text-white text-sm">{activeTicket.createdBy || "Citizen Reporter"}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-white/40 font-bold uppercase">Mobile Number / मोबाइल</span>
                    <span className="font-mono font-extrabold text-white text-sm">{activeTicket.creatorMobile || "7777777777"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <a
                    href={`tel:${activeTicket.creatorMobile || "7777777777"}`}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md text-center border border-emerald-500/20 active:scale-95 cursor-pointer font-extrabold"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call / कॉल
                  </a>
                  
                  <a
                    href={`https://wa.me/91${activeTicket.creatorMobile || "7777777777"}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md text-center border border-green-500/20 active:scale-95 cursor-pointer font-extrabold"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activeTicket.latitude},${activeTicket.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md text-center border border-orange-500/20 active:scale-95 cursor-pointer font-extrabold"
                  >
                    <Navigation className="w-3.5 h-3.5" /> Direction
                  </a>
                </div>
              </div>
            )}

            {/* Description quote card */}
            <div className="space-y-1">
              <span className="block text-[10px] uppercase font-bold text-white/40">{t("user.description")}</span>
              <p className="bg-white/[0.01] border border-white/5 p-4 rounded-xl text-xs text-white/80 leading-relaxed font-semibold italic">
                "{activeTicket.description}"
              </p>
            </div>

            {/* 3-Hour Pending countdown rule banner */}
            {activeTicket.status === "Accepted" && (
              <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                <div className="flex gap-2.5 items-start">
                  <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0 animate-bounce" />
                  <div>
                    <span className="block font-black text-white">Active 3-Hour Pending Rule</span>
                    <span className="block text-[10px] text-white/60 mt-0.5 leading-relaxed">If no recovery close or update is recorded within 3 hours of acceptance, system automatically tags back to Pending list.</span>
                  </div>
                </div>
                <div className="bg-slate-950 px-4 py-2 border border-orange-500/30 rounded-xl text-center">
                  <span className="block text-[8px] font-bold text-white/40 uppercase tracking-widest">Time Remaining</span>
                  <span className="font-mono text-orange-400 font-extrabold text-xs">{countdownStr}</span>
                </div>
              </div>
            )}

            {/* Actions / Timeline details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* Timeline audits timeline */}
              <div className="space-y-3 text-xs">
                <span className="text-xs uppercase font-black text-orange-400 block tracking-wider">Audit timeline logs</span>
                <div className="relative border-l border-white/10 pl-4 ml-2 space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {activeHistory.map((hist) => (
                    <div key={hist.id} className="relative">
                      <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-orange-500 border border-slate-900" />
                      <div className="font-black text-white text-base tracking-wide">{getStatusTranslation(hist.status)}</div>
                      <p className="text-white text-sm leading-relaxed mt-1 font-medium">{hist.remarks}</p>
                      <span className="text-xs text-white/70 block mt-1 font-semibold">
                        {new Date(hist.createdAt).toLocaleString()} | By: {hist.updatedBy}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons list */}
              <div className="space-y-4">
                <span className="text-xs uppercase font-black text-orange-400 block tracking-wider">Dispatch operations</span>
                <div className="flex flex-col gap-2">
                  {activeTicket.status === "Pending" && (
                    <button
                      onClick={handleAcceptRescue}
                      disabled={isSubmittingAction}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black uppercase rounded-xl hover:scale-[1.01] active:scale-95 transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Ambulance className="w-4 h-4" />
                      {t("team.acceptTicket")}
                    </button>
                  )}

                  {activeTicket.status === "Accepted" && (
                    <button
                      onClick={() => setShowPendingModal(true)}
                      className="w-full py-3 border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs font-black uppercase rounded-xl hover:bg-amber-500/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Info className="w-4 h-4" />
                      {t("team.markPending")}
                    </button>
                  )}

                  {activeTicket.status === "Accepted" && (
                    <button
                      onClick={() => setShowCloseModal(true)}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black uppercase rounded-xl hover:scale-[1.01] active:scale-95 transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {t("team.closeTicket")}
                    </button>
                  )}

                  {activeTicket.status === "Closed" && (
                    <div className="bg-emerald-500/5 border border-emerald-500/25 p-4 rounded-xl space-y-3 text-xs">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block">{t("user.closeReason")}</span>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="block text-[9px] text-white/40">{t("user.closeReason")}</span>
                          <span className="font-extrabold text-white">{getClosureReasonTranslation(activeTicket.closureReason || "")}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-white/40">{t("team.reportedOn")}</span>
                          <span className="font-extrabold text-white">
                            {activeTicket.closedAt ? new Date(activeTicket.closedAt).toLocaleString() : "Unknown"}
                          </span>
                        </div>
                        {activeTicket.closureDescription && (
                          <div className="col-span-2">
                            <span className="block text-[9px] text-white/40">{t("user.closeDesc")}</span>
                            <span className="font-semibold text-white/80 block italic">"{activeTicket.closureDescription}"</span>
                          </div>
                        )}
                        {activeTicket.closurePhotoUrl && (
                          <div className="col-span-2">
                            <span className="block text-[9px] text-white/40 mb-1">{t("user.closePhoto")}</span>
                            <div className="w-full max-w-sm rounded-xl overflow-hidden border border-white/5 group relative cursor-zoom-in"
                                 onClick={() => setActiveLightbox({ url: activeTicket.closurePhotoUrl || "", type: "image" })}>
                              <img
                                src={activeTicket.closurePhotoUrl}
                                className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500"
                                alt="Final Proof"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="px-2.5 py-1 bg-slate-900/90 text-[9px] font-black uppercase text-orange-400 border border-orange-500/20 rounded-lg">Zoom Proof</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* PREMIUM MEDIA LIGHTBOX MODAL */}
      {activeLightbox && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-center items-center bg-black/95 backdrop-blur-md p-4 animate-fade-in font-sans">
          {/* Top Controls Toolbar */}
          <div className="absolute top-5 right-5 flex items-center gap-4 z-[110]">
            {activeLightbox.type === "image" && (
              <div className="flex gap-2">
                <button
                  onClick={() => setLightboxZoom(prev => Math.max(1, prev - 0.5))}
                  disabled={lightboxZoom <= 1}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 rounded-xl text-xs font-black text-white transition-all cursor-pointer border border-white/5"
                >
                  Zoom -
                </button>
                <button
                  onClick={() => setLightboxZoom(prev => Math.min(3, prev + 0.5))}
                  disabled={lightboxZoom >= 3}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 rounded-xl text-xs font-black text-white transition-all cursor-pointer border border-white/5"
                >
                  Zoom + ({lightboxZoom}x)
                </button>
              </div>
            )}
            <button
              onClick={() => { setActiveLightbox(null); setLightboxZoom(1); }}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-all cursor-pointer border border-white/5"
              title="Close Lightbox"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Core media container */}
          <div className="max-w-4xl max-h-[80vh] w-full flex justify-center items-center overflow-auto rounded-3xl p-4">
            {activeLightbox.type === "image" ? (
              <img
                src={activeLightbox.url}
                alt="Animal High Res"
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl transition-transform duration-300 select-none"
                style={{ transform: `scale(${lightboxZoom})` }}
                onDoubleClick={() => setLightboxZoom(prev => prev > 1 ? 1 : 2)}
                title="Double click to fast-zoom"
              />
            ) : (
              <video
                src={activeLightbox.url}
                controls
                autoPlay
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl bg-black border border-white/10"
              />
            )}
          </div>
          <p className="text-[10px] text-white/40 mt-3 font-semibold uppercase tracking-wider">
            {activeLightbox.type === "image" ? "Double click image to fast zoom" : "Press Esc or click close button to exit"}
          </p>
        </div>
      )}
    </div>
  );
}
