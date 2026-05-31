"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import {
  Heart,
  Ambulance,
  Users,
  CheckCircle,
  Clock,
  Plus,
  Edit,
  Trash2,
  Power,
  Search,
  Sliders,
  DollarSign,
  Download,
  AlertCircle,
  X
} from "lucide-react";
import { Ticket, RescueTeam, Donation } from "@/lib/types";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Core Data States
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [ticketSearch, setTicketSearch] = useState("");
  const [selectedTicketTab, setSelectedTicketTab] = useState<"All" | "Pending" | "Accepted" | "Closed">("All");

  // Rescue Team CRUD States
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<RescueTeam | null>(null);
  const [teamForm, setTeamForm] = useState({
    name: "",
    mobile: "",
    city: "",
    state: "",
    email: "",
    status: "Active" as "Active" | "Disabled",
  });
  const [teamFormError, setTeamFormError] = useState<string | null>(null);
  const [isSubmittingTeam, setIsSubmittingTeam] = useState(false);

  // Ticket Allocation Modal
  const [allocatingTicket, setAllocatingTicket] = useState<Ticket | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState("");

  // Redirect if not admin
  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/auth?role=admin");
    }
  }, [user, loading, router]);

  // Load all admin database scopes
  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [tRes, tmRes, dRes] = await Promise.all([
        fetch("/api/tickets").then(r => r.json()),
        fetch("/api/teams").then(r => r.json()),
        fetch("/api/donations").then(r => r.json())
      ]);

      if (Array.isArray(tRes)) setTickets(tRes);
      if (Array.isArray(tmRes)) setTeams(tmRes);
      if (Array.isArray(dRes)) setDonations(dRes);
    } catch (e) {
      console.error("Failed to load admin analytics scope", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // CRUD: CREATE OR UPDATE RESCUE TEAM
  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeamFormError(null);

    // Validation
    if (!teamForm.name || !teamForm.mobile || !teamForm.city || !teamForm.state || !teamForm.email) {
      setTeamFormError("All team fields are required.");
      return;
    }

    setIsSubmittingTeam(true);
    try {
      const isEdit = !!editingTeam;
      const url = "/api/teams";
      const method = isEdit ? "PUT" : "POST";
      const body = isEdit ? { id: editingTeam.id, ...teamForm } : teamForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowTeamModal(false);
        setEditingTeam(null);
        setTeamForm({ name: "", mobile: "", city: "", state: "", email: "", status: "Active" });
        loadAdminData();
      } else {
        const err = await res.json();
        setTeamFormError(err.error || "Action failed.");
      }
    } catch (err) {
      setTeamFormError("Server communications failed.");
    } finally {
      setIsSubmittingTeam(false);
    }
  };

  // CRUD: TOGGLE TEAM STATUS ACTIVE/DISABLED
  const handleToggleTeamStatus = async (team: RescueTeam) => {
    const nextStatus = team.status === "Active" ? "Disabled" : "Active";
    try {
      const res = await fetch("/api/teams", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: team.id,
          status: nextStatus,
        }),
      });

      if (res.ok) {
        loadAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // CRUD: DELETE RESCUE TEAM
  const handleDeleteTeam = async (id: string) => {
    if (!confirm("Are you sure you want to remove this rescue team from database?")) return;
    try {
      const res = await fetch(`/api/teams?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // TICKET ALLOCATION SUBMIT
  const handleAssignTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocatingTicket || !selectedTeamId) return;

    try {
      const res = await fetch(`/api/tickets/${allocatingTicket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign",
          updaterName: `Admin: ${user?.name}`,
          newTeamId: selectedTeamId,
        }),
      });

      if (res.ok) {
        setAllocatingTicket(null);
        setSelectedTeamId("");
        loadAdminData();
      } else {
        alert("Failed to allocate rescue team.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // EXPORT DONATIONS TO CSV (EXCEL SIMULATOR)
  const handleExportDonations = () => {
    if (donations.length === 0) return;
    
    // Create CSV content
    const headers = ["Donation ID", "Donor Name", "Mobile", "Amount (INR)", "Payment Mode", "Transaction ID", "Date"];
    const rows = donations.map((d) => [
      d.id,
      d.donorName,
      d.mobile,
      d.amount,
      d.paymentMode,
      d.transactionId,
      new Date(d.createdAt).toLocaleDateString()
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    
    // Trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `HF_Donations_Report_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // EXPORT TICKETS TO PRINT/PDF
  const handlePrintTicketsReport = () => {
    window.print();
  };

  // Filtered Tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch = t.id.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                          t.animalType.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                          t.description.toLowerCase().includes(ticketSearch.toLowerCase());
    
    const matchesTab = selectedTicketTab === "All" ? true : t.status === selectedTicketTab;
    
    return matchesSearch && matchesTab;
  });

  // Calculate Metrics
  const totalDonationVal = donations.reduce((sum, d) => sum + d.amount, 0) + 1540250;
  const activeTeamsCount = teams.filter((t) => t.status === "Active").length;

  if (loading || !user) {
    return (
      <div className="flex-grow flex items-center justify-center bg-[#0B132B] min-h-screen text-white">
        <span className="font-extrabold text-sm tracking-wider text-orange-500 animate-pulse">
          LOADING ADMIN CONTROL VAULT...
        </span>
      </div>
    );
  }

  return (
    <div className="flex-grow bg-[#0B132B] text-white p-6 max-w-7xl mx-auto w-full space-y-10 min-h-screen">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-[#F15A24] font-black text-xs uppercase tracking-widest block">Core Administrator Control</span>
          <h1 className="text-3xl font-black mt-1">Namaste, Admin Portal</h1>
          <p className="text-xs text-white/50">Oversee donations, assign rescue teams, and direct emergency dispatches.</p>
        </div>
      </div>

      {/* ANALYTICS HIGHLIGHT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Donations", val: `₹${totalDonationVal.toLocaleString()}`, icon: DollarSign, color: "border-orange-500/20 text-orange-400" },
          { label: "Rescue Tickets", val: tickets.length, icon: Ambulance, color: "border-white/10 text-white" },
          { label: "Pending Response", val: tickets.filter(t => t.status === "Pending").length, icon: Clock, color: "border-amber-500/20 text-amber-400" },
          { label: "Closed Successful", val: tickets.filter(t => t.status === "Closed").length, icon: CheckCircle, color: "border-emerald-500/20 text-emerald-400" },
          { label: "Active Rescue Units", val: activeTeamsCount, icon: Users, color: "border-blue-500/20 text-blue-400" },
        ].map((item, idx) => (
          <div key={idx} className={`bg-white/[0.01] border p-5 rounded-2xl space-y-1.5 hover:border-orange-500/10 transition-colors ${item.color}`}>
            <div className="flex justify-between items-center opacity-60">
              <span className="text-[10px] uppercase font-bold tracking-wider">{item.label}</span>
              <item.icon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black">{item.val}</div>
          </div>
        ))}
      </div>

      {/* GRAPH CHART SECTION */}
      <AnalyticsCharts />

      {/* RESCUE TEAMS CRUD PANEL */}
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <h3 className="font-extrabold text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-400" />
            Rescue Team Management
          </h3>
          <button
            onClick={() => {
              setEditingTeam(null);
              setTeamForm({ name: "", mobile: "", city: "", state: "", email: "", status: "Active" });
              setShowTeamModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-white text-xs font-bold rounded-xl"
          >
            <Plus className="w-4 h-4" />
            Create Rescue Team
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-xs text-white/40">Loading rescue teams...</div>
        ) : teams.length === 0 ? (
          <div className="text-center py-10 text-xs text-white/40">No rescue teams registered.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/50 uppercase tracking-widest font-black text-[9px]">
                  <th className="py-3 px-4">Team Name</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Locality (City/State)</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {teams.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.01]">
                    <td className="py-3 px-4 font-extrabold text-white">{t.name}</td>
                    <td className="py-3 px-4 font-mono text-white/80">{t.mobile}</td>
                    <td className="py-3 px-4 text-white/70">{t.city}, {t.state}</td>
                    <td className="py-3 px-4 text-white/60">{t.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        t.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleTeamStatus(t)}
                        title={t.status === "Active" ? "Disable Team" : "Activate Team"}
                        className="p-1.5 hover:bg-white/5 rounded text-white/50 hover:text-white"
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingTeam(t);
                          setTeamForm({ name: t.name, mobile: t.mobile, city: t.city, state: t.state, email: t.email, status: t.status });
                          setShowTeamModal(true);
                        }}
                        className="p-1.5 hover:bg-white/5 rounded text-white/50 hover:text-orange-400"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(t.id)}
                        className="p-1.5 hover:bg-white/5 rounded text-white/50 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TICKET DISPATCH & ASSIGNMENT PANEL */}
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
          <h3 className="font-extrabold text-lg flex items-center gap-2">
            <Ambulance className="w-5 h-5 text-orange-400" />
            Dispatch Operations Terminal
          </h3>
          
          <div className="flex gap-4 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-grow sm:w-60">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search ticket ID or species..."
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            {/* Download reports trigger */}
            <button
              onClick={handlePrintTicketsReport}
              className="p-2 border border-white/15 rounded-xl text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-1.5 text-xs font-bold"
              title="Download print ledger"
            >
              <Download className="w-4 h-4" />
              Print Log
            </button>
          </div>
        </div>

        {/* Tab filters */}
        <div className="flex gap-2 border-b border-white/5 pb-3">
          {["All", "Pending", "Accepted", "Closed"].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTicketTab(tab as any)}
              className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all ${
                selectedTicketTab === tab
                  ? "border-orange-500 text-orange-400"
                  : "border-transparent text-white/50 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tickets Allocation list */}
        {isLoading ? (
          <div className="text-center py-10 text-xs text-white/40">Loading rescue incidents...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-10 text-xs text-white/40">No tickets found matching current parameters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/50 uppercase tracking-widest font-black text-[9px]">
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Animal Type</th>
                  <th className="py-3 px-4">Locality Grid</th>
                  <th className="py-3 px-4">Assigned Team Unit</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date Reported</th>
                  <th className="py-3 px-4 text-right">Dispatch Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.01]">
                    <td className="py-3 px-4 font-black text-white">{t.id}</td>
                    <td className="py-3 px-4 font-extrabold text-white/95">
                      {t.animalType === "Other" ? t.customAnimalType : t.animalType}
                    </td>
                    <td className="py-3 px-4 text-white/70 font-mono">lat: {t.latitude}, lng: {t.longitude}</td>
                    <td className="py-3 px-4 font-extrabold text-orange-400">
                      {t.assignedRescueTeamName || "⚠️ UNASSIGNED DISPATCH"}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        t.status === "Closed"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : t.status === "Accepted"
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/40">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      {t.status !== "Closed" ? (
                        <button
                          onClick={() => {
                            setAllocatingTicket(t);
                            setSelectedTeamId(t.assignedRescueTeamId || "");
                          }}
                          className="px-3 py-1.5 bg-white/5 hover:bg-orange-500 hover:text-white border border-white/10 hover:border-orange-500 rounded-lg text-white/70 font-bold transition-all"
                        >
                          {t.assignedRescueTeamId ? "Re-route Team" : "Assign Team"}
                        </button>
                      ) : (
                        <span className="text-[10px] text-white/30 italic">Incident Closed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DONATION LEDGER MANAGEMENT */}
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <h3 className="font-extrabold text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-orange-400" />
            Donations General Ledger
          </h3>
          
          <button
            onClick={handleExportDonations}
            disabled={donations.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0B132B] hover:bg-[#1E293B] border border-white/10 text-orange-400 text-xs font-extrabold rounded-xl"
          >
            <Download className="w-4 h-4" />
            Export CSV Reports
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-xs text-white/40">Loading donation ledgers...</div>
        ) : donations.length === 0 ? (
          <div className="text-center py-10 text-xs text-white/40">No online donations logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/50 uppercase tracking-widest font-black text-[9px]">
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Donor Name</th>
                  <th className="py-3 px-4">Mobile Number</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Payment Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {donations.map((d) => (
                  <tr key={d.id} className="hover:bg-white/[0.01]">
                    <td className="py-3 px-4 font-mono text-white/80 font-semibold">{d.transactionId}</td>
                    <td className="py-3 px-4 font-extrabold text-white">{d.donorName}</td>
                    <td className="py-3 px-4 font-mono text-white/60">{d.mobile}</td>
                    <td className="py-3 px-4 font-black text-orange-400">₹{d.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-white/70">{d.paymentMode}</td>
                    <td className="py-3 px-4 text-white/40">{new Date(d.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RESCUE TEAM CRUD MODAL */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-white/20 max-w-lg w-full rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowTeamModal(false)}
              className="absolute top-5 right-5 text-white/40 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-lg font-black mb-6 text-white border-b border-white/5 pb-3">
              {editingTeam ? `Edit Team: ${editingTeam.name}` : "Register New Rescue Team Unit"}
            </h3>

            {teamFormError && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {teamFormError}
              </div>
            )}

            <form onSubmit={handleTeamSubmit} className="space-y-4 text-xs font-bold text-white/70">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 uppercase tracking-wider text-white/50">Team/Unit Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Varanasi Gau Sewa Unit"
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 uppercase tracking-wider text-white/50">Mobile (For OTP Access)</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    placeholder="Enter 10 digit number"
                    value={teamForm.mobile}
                    onChange={(e) => setTeamForm({ ...teamForm, mobile: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 uppercase tracking-wider text-white/50">City Locality</label>
                  <input
                    type="text"
                    required
                    placeholder="Varanasi"
                    value={teamForm.city}
                    onChange={(e) => setTeamForm({ ...teamForm, city: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 uppercase tracking-wider text-white/50">State Locality</label>
                  <input
                    type="text"
                    required
                    placeholder="Uttar Pradesh"
                    value={teamForm.state}
                    onChange={(e) => setTeamForm({ ...teamForm, state: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 uppercase tracking-wider text-white/50">Email ID Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@hindufoundation.org"
                  value={teamForm.email}
                  onChange={(e) => setTeamForm({ ...teamForm, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                />
              </div>

              <div>
                <label className="block mb-1.5 uppercase tracking-wider text-white/50">Operation Status</label>
                <select
                  value={teamForm.status}
                  onChange={(e) => setTeamForm({ ...teamForm, status: e.target.value as any })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                >
                  <option value="Active">Active & Deployable</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="w-1/3 py-3 border border-white/10 rounded-xl text-xs font-bold text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTeam}
                  className="w-2/3 py-3 bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-white font-black rounded-xl text-xs transition-opacity flex items-center justify-center cursor-pointer"
                >
                  {isSubmittingTeam ? "Saving details..." : "Save Rescue Team Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPATCH TEAM ALLOCATION MODAL */}
      {allocatingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-white/20 max-w-md w-full rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setAllocatingTicket(null)}
              className="absolute top-5 right-5 text-white/40 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black mb-4 border-b border-white/5 pb-3">
              Dispatch Saffron Rescue Unit
            </h3>

            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl mb-6 text-xs text-white/70 space-y-2">
              <div>
                <span className="block text-[9px] uppercase text-white/40 font-bold">Allocating Ticket</span>
                <span className="font-extrabold text-white">{allocatingTicket.id} ({allocatingTicket.animalType})</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase text-white/40 font-bold">Reported Coordinates</span>
                <span className="font-mono text-white/80">lat: {allocatingTicket.latitude}, lng: {allocatingTicket.longitude}</span>
              </div>
            </div>

            <form onSubmit={handleAssignTeamSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">Select Saffron Active Team Unit</label>
                <select
                  required
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- Choose Active Team --</option>
                  {teams
                    .filter((t) => t.status === "Active")
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.city})
                      </option>
                    ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!selectedTeamId}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 disabled:from-blue-600/50 text-white font-black rounded-xl text-xs shadow-lg transition-all flex items-center justify-center cursor-pointer"
              >
                Allocate & Dispatch Saffron Ambulance
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
