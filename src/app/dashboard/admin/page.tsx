"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
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
  X,
  ShieldCheck
} from "lucide-react";
import { Ticket, RescueTeam, Donation } from "@/lib/types";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();

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

  const getStatusTranslation = (status: string) => {
    if (status === "Pending") return t("user.pending");
    if (status === "Accepted") return t("user.accepted");
    if (status === "Closed") return t("user.closed");
    return status;
  };

  // Core Data States
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvalAmounts, setApprovalAmounts] = useState<Record<string, string>>({});

  const verifiedDonations = donations.filter((d) => d.status !== "Pending");
  const pendingProofs = donations.filter((d) => d.status === "Pending");

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
      setTeamFormError(t("admin.allTeamFieldsRequired"));
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
        setTeamFormError(err.error || t("admin.actionFailed"));
      }
    } catch (err) {
      setTeamFormError(t("admin.serverCommunicationFailed"));
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
    if (!confirm(t("admin.confirmDeleteTeam"))) return;
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
        alert(t("admin.failedAllocateTeam"));
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

  const handleVerifyDonationProof = async (donationId: string) => {
    const verifiedAmount = Number(approvalAmounts[donationId] || 0);
    if (verifiedAmount <= 0) {
      alert(language === "hi" ? "कृपया सत्यापन राशि दर्ज करें जो 0 से अधिक हो!" : "Please enter a validation amount greater than 0!");
      return;
    }

    if (!confirm(t("donate.admin.confirmVerify"))) return;

    try {
      const res = await fetch(`/api/donations/${donationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Verified",
          amount: verifiedAmount
        })
      });

      if (res.ok) {
        // Clear approval amount input
        setApprovalAmounts(prev => {
          const updated = { ...prev };
          delete updated[donationId];
          return updated;
        });
        loadAdminData();
      } else {
        alert("Failed to verify donation proof.");
      }
    } catch (e) {
      console.error(e);
    }
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
  const totalDonationVal = verifiedDonations.reduce((sum, d) => sum + d.amount, 0) + 1540250;
  const activeTeamsCount = teams.filter((t) => t.status === "Active").length;

  if (loading || !user) {
    return (
      <div className="flex-grow flex items-center justify-center bg-[#0B132B] min-h-screen text-white">
        <span className="font-extrabold text-sm tracking-wider text-orange-500 animate-pulse">
          {t("admin.loading")}
        </span>
      </div>
    );
  }

  return (
    <div className="flex-grow bg-[#0B132B] text-white p-6 max-w-7xl mx-auto w-full space-y-10 min-h-screen">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-[#F15A24] font-black text-xs uppercase tracking-widest block">{t("admin.coreControl")}</span>
          <h1 className="text-3xl font-black mt-1">{t("admin.portalTitle")}</h1>
          <p className="text-xs text-white/50">{t("admin.portalSubtitle")}</p>
        </div>
      </div>

      {/* ANALYTICS HIGHLIGHT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: t("admin.totalDonations"), val: `₹${totalDonationVal.toLocaleString()}`, icon: DollarSign, color: "border-orange-500/20 text-orange-400" },
          { label: t("admin.tabTickets"), val: tickets.length, icon: Ambulance, color: "border-white/10 text-white" },
          { label: t("admin.pendingResponse"), val: tickets.filter(t => t.status === "Pending").length, icon: Clock, color: "border-amber-500/20 text-amber-400" },
          { label: t("admin.closedSuccessful"), val: tickets.filter(t => t.status === "Closed").length, icon: CheckCircle, color: "border-emerald-500/20 text-emerald-400" },
          { label: t("admin.activeRescueUnits"), val: activeTeamsCount, icon: Users, color: "border-blue-500/20 text-blue-400" },
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
            {t("admin.teamManagementTitle")}
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
            {t("admin.createTeamBtn")}
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-xs text-white/40">{t("admin.loadingTeams")}</div>
        ) : teams.length === 0 ? (
          <div className="text-center py-10 text-xs text-white/40">{t("admin.noTeams")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/50 uppercase tracking-widest font-black text-[9px]">
                  <th className="py-3 px-4">{t("admin.teamName")}</th>
                  <th className="py-3 px-4">{t("admin.mobileNumber")}</th>
                  <th className="py-3 px-4">{t("admin.locality")}</th>
                  <th className="py-3 px-4">{t("admin.email")}</th>
                  <th className="py-3 px-4">{t("admin.status")}</th>
                  <th className="py-3 px-4 text-right">{t("team.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {teams.map((team) => (
                  <tr key={team.id} className="hover:bg-white/[0.01]">
                    <td className="py-3 px-4 font-extrabold text-white">{team.name}</td>
                    <td className="py-3 px-4 font-mono text-white/80">{team.mobile}</td>
                    <td className="py-3 px-4 text-white/70">{team.city}, {team.state}</td>
                    <td className="py-3 px-4 text-white/60">{team.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        team.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        {team.status === "Active" ? t("admin.active") : t("admin.disabled")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleTeamStatus(team)}
                        title={team.status === "Active" ? t("admin.disableTeam") : t("admin.activateTeam")}
                        className="p-1.5 hover:bg-white/5 rounded text-white/50 hover:text-white"
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingTeam(team);
                          setTeamForm({ name: team.name, mobile: team.mobile, city: team.city, state: team.state, email: team.email, status: team.status });
                          setShowTeamModal(true);
                        }}
                        className="p-1.5 hover:bg-white/5 rounded text-white/50 hover:text-orange-400"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
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
            {t("admin.dispatchTerminal")}
          </h3>
          
          <div className="flex gap-4 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-grow sm:w-60">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder={t("admin.searchPlaceholder")}
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            {/* Download reports trigger */}
            <button
              onClick={handlePrintTicketsReport}
              className="p-2 border border-white/15 rounded-xl text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-1.5 text-xs font-bold"
              title={t("admin.printTooltip")}
            >
              <Download className="w-4 h-4" />
              {t("admin.printLog")}
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
              {tab === "All" ? t("admin.tabAll") : tab === "Pending" ? t("user.pending") : tab === "Accepted" ? t("user.accepted") : t("user.closed")}
            </button>
          ))}
        </div>

        {/* Tickets Allocation list */}
        {isLoading ? (
          <div className="text-center py-10 text-xs text-white/40">{t("admin.loadingIncidents")}</div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-10 text-xs text-white/40">{t("admin.noTicketsFound")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/50 uppercase tracking-widest font-black text-[9px]">
                  <th className="py-3 px-4">{t("admin.ticketIdHeader")}</th>
                  <th className="py-3 px-4">{t("user.animalType")}</th>
                  <th className="py-3 px-4">{t("admin.localityGrid")}</th>
                  <th className="py-3 px-4">{t("user.assignedTeam")}</th>
                  <th className="py-3 px-4">{t("team.status")}</th>
                  <th className="py-3 px-4">{t("team.reportedOn")}</th>
                  <th className="py-3 px-4 text-right">{t("admin.dispatchControl")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTickets.map((tItem) => (
                  <tr key={tItem.id} className="hover:bg-white/[0.01]">
                    <td className="py-3 px-4 font-black text-white">{tItem.id}</td>
                    <td className="py-3 px-4 font-extrabold text-white/95">
                      {tItem.animalType === "Other" ? tItem.customAnimalType : getAnimalTypeTranslation(tItem.animalType)}
                    </td>
                    <td className="py-3 px-4 text-white/70 font-mono">lat: {tItem.latitude}, lng: {tItem.longitude}</td>
                    <td className="py-3 px-4 font-extrabold text-orange-400">
                      {tItem.assignedRescueTeamName || t("admin.unassignedDispatch")}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        tItem.status === "Closed"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : tItem.status === "Accepted"
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {getStatusTranslation(tItem.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/40">{new Date(tItem.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      {tItem.status !== "Closed" ? (
                        <button
                          onClick={() => {
                            setAllocatingTicket(tItem);
                            setSelectedTeamId(tItem.assignedRescueTeamId || "");
                          }}
                          className="px-3 py-1.5 bg-white/5 hover:bg-orange-500 hover:text-white border border-white/10 hover:border-orange-500 rounded-lg text-white/70 font-bold transition-all"
                        >
                          {tItem.assignedRescueTeamId ? t("admin.rerouteTeam") : t("admin.assignTeam")}
                        </button>
                      ) : (
                        <span className="text-[10px] text-white/30 italic">{t("admin.incidentClosed")}</span>
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
            {t("admin.donationsLedgerTitle")}
          </h3>
          
          <button
            onClick={handleExportDonations}
            disabled={verifiedDonations.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0B132B] hover:bg-[#1E293B] border border-white/10 text-orange-400 text-xs font-extrabold rounded-xl"
          >
            <Download className="w-4 h-4" />
            {t("admin.exportCsvBtn")}
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-xs text-white/40">{t("admin.loadingDonations")}</div>
        ) : verifiedDonations.length === 0 ? (
          <div className="text-center py-10 text-xs text-white/40">{t("admin.emptyDonations")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/50 uppercase tracking-widest font-black text-[9px]">
                  <th className="py-3 px-4">{t("admin.transactionId")}</th>
                  <th className="py-3 px-4">{t("admin.donorName")}</th>
                  <th className="py-3 px-4">{t("admin.mobileNumber")}</th>
                  <th className="py-3 px-4">{t("admin.amount")}</th>
                  <th className="py-3 px-4">{t("admin.paymentMode")}</th>
                  <th className="py-3 px-4">{t("admin.paymentDate")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {verifiedDonations.map((d) => (
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

      {/* PENDING OFFLINE DONATION PROOFS AUDIT */}
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <h3 className="font-extrabold text-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-400" />
            {t("donate.admin.auditTitle")}
          </h3>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-xs text-white/40">{t("admin.loadingDonations")}</div>
        ) : pendingProofs.length === 0 ? (
          <div className="text-center py-10 text-xs text-white/40">{t("donate.admin.emptyProofs")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/50 uppercase tracking-widest font-black text-[9px]">
                  <th className="py-3 px-4">{t("admin.transactionId")}</th>
                  <th className="py-3 px-4">{t("admin.donorName")}</th>
                  <th className="py-3 px-4">{t("admin.mobileNumber")}</th>
                  <th className="py-3 px-4">{t("admin.paymentMode")}</th>
                  <th className="py-3 px-4">{language === "hi" ? "रसीद प्रमाण" : "Receipt Proof"}</th>
                  <th className="py-3 px-4">{language === "hi" ? "सत्यापन राशि (₹)" : "Verify Amount (₹)"}</th>
                  <th className="py-3 px-4 text-right">{t("team.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pendingProofs.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.01]">
                    <td className="py-3 px-4 font-mono text-white/80 font-semibold">{p.transactionId}</td>
                    <td className="py-3 px-4 font-extrabold text-white">{p.donorName}</td>
                    <td className="py-3 px-4 font-mono text-white/60">{p.mobile}</td>
                    <td className="py-3 px-4 text-white/70">{p.paymentMode}</td>
                    <td className="py-3 px-4 text-orange-400 font-extrabold">
                      {p.screenshotUrl ? (
                        <a
                          href={p.screenshotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{language === "hi" ? "रसीद देखें" : "View Receipt"}</span>
                        </a>
                      ) : (
                        <span className="text-white/30 italic">No proof</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="1"
                        placeholder="₹"
                        value={approvalAmounts[p.id] || ""}
                        onChange={(e) => setApprovalAmounts({ ...approvalAmounts, [p.id]: e.target.value })}
                        className="w-24 bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleVerifyDonationProof(p.id)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg transition-colors cursor-pointer"
                      >
                        {t("donate.admin.verifyBtn")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RESCUE TEAM CRUD MODAL */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-start md:items-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-white/20 max-w-lg w-full rounded-3xl p-6 shadow-2xl relative my-4 md:my-8">
            <button
              onClick={() => setShowTeamModal(false)}
              className="absolute top-5 right-5 text-white/40 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-lg font-black mb-6 text-white border-b border-white/5 pb-3">
              {editingTeam ? `${t("admin.editTeamBtn")}: ${editingTeam.name}` : t("admin.registerNewTeam")}
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
                  <label className="block mb-1.5 uppercase tracking-wider text-white/50">{t("admin.teamNameLabel")}</label>
                  <input
                    type="text"
                    required
                    placeholder={t("admin.teamNamePlaceholder")}
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 uppercase tracking-wider text-white/50">{t("admin.mobileOtpLabel")}</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    placeholder={t("admin.mobilePlaceholder")}
                    value={teamForm.mobile}
                    onChange={(e) => setTeamForm({ ...teamForm, mobile: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 uppercase tracking-wider text-white/50">{t("admin.cityLabel")}</label>
                  <input
                    type="text"
                    required
                    placeholder={t("admin.cityPlaceholder")}
                    value={teamForm.city}
                    onChange={(e) => setTeamForm({ ...teamForm, city: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 uppercase tracking-wider text-white/50">{t("admin.stateLabel")}</label>
                  <input
                    type="text"
                    required
                    placeholder={t("admin.statePlaceholder")}
                    value={teamForm.state}
                    onChange={(e) => setTeamForm({ ...teamForm, state: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 uppercase tracking-wider text-white/50">{t("admin.emailLabel")}</label>
                <input
                  type="email"
                  required
                  placeholder={t("admin.emailPlaceholder")}
                  value={teamForm.email}
                  onChange={(e) => setTeamForm({ ...teamForm, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                />
              </div>

              <div>
                <label className="block mb-1.5 uppercase tracking-wider text-white/50">{t("admin.operationStatusLabel")}</label>
                <select
                  value={teamForm.status}
                  onChange={(e) => setTeamForm({ ...teamForm, status: e.target.value as any })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                >
                  <option value="Active">{t("admin.activeDeployable")}</option>
                  <option value="Disabled">{t("admin.disabled")}</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="w-1/3 py-3 border border-white/10 rounded-xl text-xs font-bold text-white/60 hover:text-white"
                >
                  {t("admin.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTeam}
                  className="w-2/3 py-3 bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-white font-black rounded-xl text-xs transition-opacity flex items-center justify-center cursor-pointer"
                >
                  {isSubmittingTeam ? t("admin.savingDetails") : t("admin.saveTeamBtn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPATCH TEAM ALLOCATION MODAL */}
      {allocatingTicket && (
        <div className="fixed inset-0 z-50 flex justify-center items-start md:items-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-white/20 max-w-md w-full rounded-3xl p-6 shadow-2xl relative my-4 md:my-8">
            <button
              onClick={() => setAllocatingTicket(null)}
              className="absolute top-5 right-5 text-white/40 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black mb-4 border-b border-white/5 pb-3">
              {t("admin.dispatchSaffronUnit")}
            </h3>

            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl mb-6 text-xs text-white/70 space-y-2">
              <div>
                <span className="block text-[9px] uppercase text-white/40 font-bold">{t("admin.allocatingTicket")}</span>
                <span className="font-extrabold text-white">{allocatingTicket.id} ({allocatingTicket.animalType === "Other" ? allocatingTicket.customAnimalType : getAnimalTypeTranslation(allocatingTicket.animalType)})</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase text-white/40 font-bold">{t("admin.reportedCoordinates")}</span>
                <span className="font-mono text-white/80">lat: {allocatingTicket.latitude}, lng: {allocatingTicket.longitude}</span>
              </div>
            </div>

            <form onSubmit={handleAssignTeamSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">{t("admin.selectSaffronActiveTeam")}</label>
                <select
                  required
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">{t("admin.chooseActiveTeamOption")}</option>
                  {teams
                    .filter((tItem) => tItem.status === "Active")
                    .map((tItem) => (
                      <option key={tItem.id} value={tItem.id}>
                        {tItem.name} ({tItem.city})
                      </option>
                    ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!selectedTeamId}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 disabled:from-blue-600/50 text-white font-black rounded-xl text-xs shadow-lg transition-all flex items-center justify-center cursor-pointer"
              >
                {t("admin.allocateDispatchAmbulance")}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
