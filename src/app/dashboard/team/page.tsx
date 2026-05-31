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
  Info
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
          updaterName: user.name,
          assignedRescueTeamId: "team-1",
          assignedRescueTeamName: user.name,
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
          updaterName: user.name,
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
    if (!activeTicket || !user) return;

    if (!closeForm.photoUrl) {
      alert(t("team.validationError"));
      return;
    }
    if (closeForm.reason === "Other" && (!closeForm.description || closeForm.description.trim().length === 0)) {
      alert(t("team.validationError"));
      return;
    }

    setIsSubmittingAction(true);
    try {
      const res = await fetch(`/api/tickets/${activeTicket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "close",
          updaterName: user.name,
          closureReason: closeForm.reason,
          closureDescription: closeForm.description,
          closurePhotoUrl: closeForm.photoUrl,
        }),
      });

      if (res.ok) {
        setShowCloseModal(false);
        setCloseForm({ reason: "Treatment Completed", description: "", photoUrl: "" });
        setClosePhotoPreview("");
        loadTickets();
      } else {
        alert("Failed to close rescue ticket");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle final photo proof upload
  const handleClosePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        alert("Photo upload failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPhotoUploading(false);
    }
  };

  // Filtered tickets lists
  const filteredTickets = tickets.filter((tItem) => {
    if (filterStatus === "All") return true;
    return tItem.status === filterStatus;
  });

  // Stats calculation
  const total = tickets.length;
  const pending = tickets.filter((tItem) => tItem.status === "Pending").length;
  const accepted = tickets.filter((tItem) => tItem.status === "Accepted").length;
  const closed = tickets.filter((tItem) => tItem.status === "Closed").length;

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
          <h1 className="text-3xl font-black mt-1">{t("team.welcome")}, {user.name}</h1>
          <p className="text-xs text-white/50">Manage local emergency callouts and perform active veterinary treatments.</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Ticket List (Left Side) */}
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
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
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

        {/* Action Detail View Panel (Right Side) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-extrabold text-lg flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-orange-400" />
            {t("team.actions")}
          </h3>

          {activeTicket ? (
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-6 animate-fade-in relative overflow-hidden">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="font-black text-lg text-white flex items-center gap-2">
                    {activeTicket.id}
                    <span className="text-xs text-white/50">({getAnimalTypeTranslation(activeTicket.animalType)})</span>
                  </h3>
                  <div className="text-[10px] text-white/40 mt-0.5">{t("team.reportedBy")}: Citizen Reporter | Case ID: {activeTicket.eventId || "112"}</div>
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
                </div>
              </div>

              {/* Media display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[9px] uppercase font-bold text-white/40 mb-1">{t("user.uploadPhoto")}</span>
                  <img
                    src={activeTicket.imageUrl}
                    className="w-full h-44 object-cover rounded-xl border border-white/5"
                    alt="Animal photo"
                  />
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-white/40 mb-1">{t("user.uploadVideo")}</span>
                  <video
                    src={activeTicket.videoUrl}
                    controls
                    className="w-full h-44 object-cover rounded-xl border border-white/5 bg-black"
                  />
                </div>
              </div>

              {/* Case GPS Selector Map */}
              <MapSelector onLocationSelect={() => {}} initialLat={activeTicket.latitude} initialLng={activeTicket.longitude} readonly={true} />

              {/* Description */}
              <div className="space-y-1">
                <span className="block text-[10px] uppercase font-bold text-white/40">{t("user.description")}</span>
                <p className="bg-white/[0.01] border border-white/5 p-4 rounded-xl text-xs text-white/80 leading-relaxed font-semibold italic">
                  "{activeTicket.description}"
                </p>
              </div>

              {/* Auto Pending 3-hour timer */}
              {activeTicket.status === "Accepted" && (
                <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex gap-2.5 items-start">
                    <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0 animate-bounce" />
                    <div>
                      <span className="block text-xs font-black text-white">Active 3-Hour Pending Rule</span>
                      <span className="block text-[10px] text-white/60 mt-0.5 leading-relaxed">If no recovery close or update is recorded within 3 hours of acceptance, system automatically tags back to Pending list.</span>
                    </div>
                  </div>
                  <div className="bg-slate-950 px-4 py-2 border border-orange-500/30 rounded-xl text-center">
                    <span className="block text-[8px] font-bold text-white/40 uppercase tracking-widest">Time Remaining</span>
                    <span className="font-mono text-orange-400 font-extrabold text-xs">{countdownStr}</span>
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap gap-3 border-t border-white/5 pt-6">
                {activeTicket.status === "Pending" && (
                  <button
                    onClick={handleAcceptRescue}
                    disabled={isSubmittingAction}
                    className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black uppercase rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Ambulance className="w-4 h-4" />
                    {t("team.acceptTicket")}
                  </button>
                )}

                {activeTicket.status === "Accepted" && (
                  <button
                    onClick={() => setShowPendingModal(true)}
                    className="px-5 py-4 border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs font-black uppercase rounded-2xl hover:bg-amber-500/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Info className="w-4 h-4" />
                    {t("team.markPending")}
                  </button>
                )}

                {activeTicket.status === "Accepted" && (
                  <button
                    onClick={() => setShowCloseModal(true)}
                    className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black uppercase rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {t("team.closeTicket")}
                  </button>
                )}

                {activeTicket.status === "Closed" && (
                  <div className="w-full bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl space-y-3">
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
                          <img
                            src={activeTicket.closurePhotoUrl}
                            className="w-full h-40 object-cover rounded-xl border border-white/5"
                            alt="Final Proof"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="border border-white/5 bg-slate-900/40 p-16 text-center text-xs text-white/40 rounded-3xl">
              Select an emergency rescue case from the filter list to view details and operate.
            </div>
          )}
        </div>
      </div>

      {/* REVERT PENDING MODAL */}
      {showPendingModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-start md:items-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-white/20 max-w-md w-full rounded-3xl p-6 shadow-2xl relative my-4 md:my-8">
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
        <div className="fixed inset-0 z-50 flex justify-center items-start md:items-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-white/20 max-w-lg w-full rounded-3xl p-6 shadow-2xl relative my-4 md:my-8">
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
                <span className="block text-xs font-bold text-white/60 uppercase">{t("team.closurePhoto")}</span>
                <div className="flex items-center justify-center gap-3">
                  <Camera className="w-8 h-8 text-orange-400" />
                  <input
                    type="file"
                    required
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleClosePhotoChange}
                    className="text-xs text-white/40 w-full"
                  />
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

    </div>
  );
}
