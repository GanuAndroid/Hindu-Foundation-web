"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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
        // Sync active ticket details if selected
        if (activeTicket) {
          const fresh = data.find((t: Ticket) => t.id === activeTicket.id);
          if (fresh) {
            setActiveTicket(fresh);
            // Refresh history
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

  // Update timer for 3-hour countdown if accepted ticket is active
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
          loadTickets(); // Reload list to trigger system update in dbService
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
          assignedRescueTeamId: "team-1", // Team link
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

  // REVERT BACK TO PENDING (MANUAL)
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
      alert("A final proof recovery photo is required to close this case.");
      return;
    }
    if (closeForm.reason === "Other" && (!closeForm.description || closeForm.description.trim().length === 0)) {
      alert("A custom description is required.");
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
  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === "All") return true;
    return t.status === filterStatus;
  });

  // Stats calculation
  const total = tickets.length;
  const pending = tickets.filter((t) => t.status === "Pending").length;
  const accepted = tickets.filter((t) => t.status === "Accepted").length;
  const closed = tickets.filter((t) => t.status === "Closed").length;

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
          <span className="text-[#F15A24] font-black text-xs uppercase tracking-widest block">Operational Terminal</span>
          <h1 className="text-3xl font-black mt-1">Gau Sewa Unit: {user.name}</h1>
          <p className="text-xs text-white/50">Manage local emergency callouts and perform active veterinary treatments.</p>
        </div>
      </div>

      {/* DASHBOARD STATISTICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Regional Tickets", val: total, color: "border-white/10 text-white/80" },
          { label: "Pending Emergency Dispatch", val: pending, color: "border-amber-500/20 text-amber-400" },
          { label: "Our Accepted Cases", val: accepted, color: "border-blue-500/20 text-blue-400" },
          { label: "Successfully Recovered", val: closed, color: "border-emerald-500/20 text-emerald-400" },
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
            {s}
          </button>
        ))}
      </div>

      {/* TICKET LIST AND CASE VIEW DETAIL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Ticket List (Left Side) */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-lg flex items-center gap-2">
            <Filter className="w-5 h-5 text-orange-400" />
            Filtered Cases ({filteredTickets.length})
          </h3>

          {isLoadingTickets ? (
            <div className="py-20 text-center text-xs text-white/40">Loading active tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="border border-white/5 bg-slate-900/40 p-12 text-center text-xs text-white/40 rounded-3xl">
              No rescue tickets exist in this filter category.
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {filteredTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSelectTicket(t)}
                  className={`bg-white/[0.01] border border-white/5 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-all ${
                    activeTicket?.id === t.id ? "border-orange-500/30 bg-orange-500/[0.02]" : ""
                  }`}
                >
                  <div className="flex gap-3 items-center">
                    <img
                      src={t.imageUrl}
                      alt={t.animalType}
                      className="w-12 h-12 object-cover rounded-lg border border-white/10"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-white">{t.id}</span>
                        <span className="text-[10px] text-white/40">({t.animalType})</span>
                      </div>
                      <p className="text-[10px] text-white/50 line-clamp-1 mt-0.5">{t.description}</p>
                      <span className="text-[9px] text-white/30 block mt-1">
                        {new Date(t.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                      t.status === "Closed"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : t.status === "Accepted"
                        ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Detail View Panel (Right Side - 2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-extrabold text-lg flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-orange-400" />
            Case Assessment & Operations
          </h3>

          {activeTicket ? (
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-6 animate-fade-in relative overflow-hidden">
              
              {/* Top Banner indicating status action */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="font-black text-lg text-white flex items-center gap-2">
                    {activeTicket.id}
                    <span className="text-xs text-white/50">({activeTicket.animalType})</span>
                  </h3>
                  <div className="text-[10px] text-white/40 mt-0.5">Reported by: Citizen Reporter | Event 112</div>
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
                    {activeTicket.status}
                  </span>
                </div>
              </div>

              {/* Media playback block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[9px] uppercase font-bold text-white/40 mb-1">Captured Photo</span>
                  <img
                    src={activeTicket.imageUrl}
                    className="w-full h-44 object-cover rounded-xl border border-white/5"
                    alt="Animal photo"
                  />
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-white/40 mb-1">Incident Video Player</span>
                  <video
                    src={activeTicket.videoUrl}
                    controls
                    className="w-full h-44 object-cover rounded-xl border border-white/5 bg-black"
                  />
                </div>
              </div>

              {/* Case GPS coordinates detailed card */}
              <MapSelector onLocationSelect={() => {}} initialLat={activeTicket.latitude} initialLng={activeTicket.longitude} readonly={true} />

              {/* Description textbox */}
              <div className="space-y-1">
                <span className="block text-[10px] uppercase font-bold text-white/40">Incident Reporter Briefing</span>
                <p className="bg-white/[0.01] border border-white/5 p-4 rounded-xl text-xs text-white/80 leading-relaxed font-semibold italic">
                  "{activeTicket.description}"
                </p>
              </div>

              {/* Auto Pending 3-hour Alert rule display if accepted */}
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

              {/* ACTION TOOLBAR BAR */}
              <div className="flex flex-wrap gap-3 border-t border-white/5 pt-6">
                
                {/* 1. ACCEPT ACTION */}
                {activeTicket.status === "Pending" && (
                  <button
                    onClick={handleAcceptRescue}
                    disabled={isSubmittingAction}
                    className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black uppercase rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Ambulance className="w-4 h-4" />
                    Accept Rescue Mission
                  </button>
                )}

                {/* 2. MANUAL PENDING ACTION */}
                {activeTicket.status === "Accepted" && (
                  <button
                    onClick={() => setShowPendingModal(true)}
                    className="px-5 py-4 border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs font-black uppercase rounded-2xl hover:bg-amber-500/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Info className="w-4 h-4" />
                    Mark Pending
                  </button>
                )}

                {/* 3. CLOSE ACTION */}
                {activeTicket.status === "Accepted" && (
                  <button
                    onClick={() => setShowCloseModal(true)}
                    className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black uppercase rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Close Rescue (Case Recovered)
                  </button>
                )}

                {/* Closed summary info logs */}
                {activeTicket.status === "Closed" && (
                  <div className="w-full bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl space-y-3">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">Case Closure details</span>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="block text-[9px] text-white/40">Resolution Code</span>
                        <span className="font-extrabold text-white">{activeTicket.closureReason}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-white/40">Resolution Date</span>
                        <span className="font-extrabold text-white">
                          {activeTicket.closedAt ? new Date(activeTicket.closedAt).toLocaleString() : "Unknown"}
                        </span>
                      </div>
                      {activeTicket.closureDescription && (
                        <div className="col-span-2">
                          <span className="block text-[9px] text-white/40">Closing Comments</span>
                          <span className="font-semibold text-white/80 block italic">"{activeTicket.closureDescription}"</span>
                        </div>
                      )}
                      {activeTicket.closurePhotoUrl && (
                        <div className="col-span-2">
                          <span className="block text-[9px] text-white/40 mb-1">Final Recovery Proof Photo</span>
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

      {/* MANUAL PENDING MODAL */}
      {showPendingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-white/20 max-w-md w-full rounded-3xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-black text-white mb-4 border-b border-white/5 pb-3">Mark Case Back to Pending</h3>
            
            <form onSubmit={handleMarkPendingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">Delay Reason</label>
                <select
                  value={pendingForm.reason}
                  onChange={(e) => setPendingForm({ ...pendingForm, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  {["Ambulance Not Found", "Animal Not Found", "Team Not Available", "Other"].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {pendingForm.reason === "Other" && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">Provide Description (Required)</label>
                  <textarea
                    required
                    rows={2}
                    value={pendingForm.description}
                    onChange={(e) => setPendingForm({ ...pendingForm, description: e.target.value })}
                    placeholder="Enter brief description of delay reason..."
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="w-2/3 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-slate-950 font-black rounded-xl text-xs transition-colors flex items-center justify-center cursor-pointer"
                >
                  Confirm Revert Pending
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLOSE RESCUE MISSION MODAL */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-white/20 max-w-lg w-full rounded-3xl p-6 shadow-2xl relative my-8">
            <h3 className="text-lg font-black text-white mb-4 border-b border-white/5 pb-3">Close Rescue Case (Successful Recovery)</h3>

            <form onSubmit={handleCloseTicketSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">Closure Reason</label>
                <select
                  value={closeForm.reason}
                  onChange={(e) => setCloseForm({ ...closeForm, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  {["Treatment Completed", "Sent To Gaushala", "Referred To Hospital", "Animal Recovered", "Other"].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {closeForm.reason === "Other" && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">Provide Closure Details (Required)</label>
                  <textarea
                    required
                    rows={2}
                    value={closeForm.description}
                    onChange={(e) => setCloseForm({ ...closeForm, description: e.target.value })}
                    placeholder="Describe outcome..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-orange-500 text-white"
                  />
                </div>
              )}

              {/* Upload Final photo proof */}
              <div className="border-2 border-dashed border-white/10 hover:border-orange-500/30 rounded-2xl p-4 text-center space-y-3 transition-colors relative">
                <span className="block text-xs font-bold text-white/60 uppercase">Upload Final Proof Recovery Photo (Required)</span>
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
                {photoUploading && <div className="text-[10px] text-orange-400 font-bold">Uploading proof photo locally...</div>}
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction || photoUploading}
                  className="w-2/3 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 disabled:bg-emerald-600/50 text-white font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  Confirm Close & Resolve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
