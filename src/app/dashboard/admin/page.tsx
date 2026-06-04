"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import AnalyticsCharts, { AnimalCategoryReports, DonationsLedgerChart } from "@/components/AnalyticsCharts";
import MapSelector from "@/components/MapSelector";
import {
  Heart,
  Ambulance,
  Users,
  User as UserIcon,
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
  ShieldCheck,
  MapPin,
  FileImage,
  Video,
  Server,
  Activity
} from "lucide-react";
import { Ticket, RescueTeam, Donation, User, UserRole, TeamMember } from "@/lib/types";

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
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvalAmounts, setApprovalAmounts] = useState<Record<string, string>>({});

  const verifiedDonations = donations.filter((d) => d.status !== "Pending");
  const pendingProofs = donations.filter((d) => d.status === "Pending");

  // Premium active ticket incident command center & lightbox states
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [ticketHistory, setTicketHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeLightbox, setActiveLightbox] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);

  // Search & Filters
  const [ticketSearch, setTicketSearch] = useState("");
  const [selectedTicketTab, setSelectedTicketTab] = useState<"All" | "Pending" | "Accepted" | "Closed">("All");

  // Tab navigation states
  const [activeTab, setActiveTab] = useState<"terminal" | "teams" | "members" | "users" | "donations" | "proofs" | "reports" | "monitor" | "media">("terminal");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Media Manager States
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [mediaCategoryFilter, setMediaCategoryFilter] = useState("all");
  const [mediaSearchQuery, setMediaSearchQuery] = useState("");
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [deletingMediaUrl, setDeletingMediaUrl] = useState<string | null>(null);
  
  // User tab search & CRUD states
  const [userSearch, setUserSearch] = useState("");
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    mobile: "",
    role: "user" as UserRole,
  });
  const [userFormError, setUserFormError] = useState<string | null>(null);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

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

  // Team Member States
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<RescueTeam | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberForm, setMemberForm] = useState({
    teamId: "",
    memberName: "",
    mobileNumber: "",
    email: "",
    status: "Active" as "Active" | "Inactive",
    city: "",
    state: ""
  });
  const [memberFormError, setMemberFormError] = useState<string | null>(null);
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedTeamFilter, setSelectedTeamFilter] = useState("");

  // Ticket Allocation Modal
  const [allocatingTicket, setAllocatingTicket] = useState<Ticket | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState("");

  // Server Monitor Live Metrics States
  const [serverHealth, setServerHealth] = useState<any>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState("");

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
      const [tRes, tmRes, dRes, uRes, memRes] = await Promise.all([
        fetch("/api/tickets").then(r => r.json()),
        fetch("/api/teams").then(r => r.json()),
        fetch("/api/donations").then(r => r.json()),
        fetch("/api/users").then(r => r.json()),
        fetch("/api/teams/members").then(r => r.json())
      ]);

      if (Array.isArray(tRes)) setTickets(tRes);
      if (Array.isArray(tmRes)) setTeams(tmRes);
      if (Array.isArray(dRes)) setDonations(dRes);
      if (Array.isArray(uRes)) setUsers(uRes);
      if (Array.isArray(memRes)) setMembers(memRes);
    } catch (e) {
      console.error("Failed to load admin analytics scope", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Media Manager Assets
  const fetchMedia = async () => {
    setIsMediaLoading(true);
    setMediaError(null);
    try {
      const res = await fetch("/api/media");
      const data = await res.json();
      if (data.success) {
        setMediaItems(data.media || []);
      } else {
        setMediaError(data.error || "Failed to load media items");
      }
    } catch (err: any) {
      setMediaError(err.message || "Failed to communicate with media server");
    } finally {
      setIsMediaLoading(false);
    }
  };

  const handleDeleteMedia = async (url: string) => {
    try {
      const res = await fetch(`/api/media?url=${encodeURIComponent(url)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        await fetchMedia();
        await loadAdminData();
      } else {
        alert(data.error || "Failed to delete media item");
      }
    } catch (err: any) {
      alert(err.message || "Failed to connect to media server");
    } finally {
      setDeletingMediaUrl(null);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    if (activeTab === "media") {
      fetchMedia();
    }
  }, [activeTab]);

  // Fetch Server Health Statistics
  const fetchServerHealth = async (silent = false) => {
    if (!user) return;
    if (!silent) setIsHealthLoading(true);
    setHealthError(null);
    try {
      const res = await fetch("/api/admin/server-health", {
        headers: {
          "x-admin-role": user.role,
          "x-admin-mobile": user.mobile,
        }
      });
      if (res.ok) {
        const data = await res.json();
        setServerHealth(data);
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        const err = await res.json();
        setHealthError(err.error || "Failed to load server stats.");
      }
    } catch (e) {
      setHealthError("Failed to communicate with server monitoring API.");
    } finally {
      if (!silent) setIsHealthLoading(false);
    }
  };

  // Trigger server health intervals when activeTab === monitor
  useEffect(() => {
    if (activeTab === "monitor") {
      fetchServerHealth();
      const interval = setInterval(() => {
        fetchServerHealth(true);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Handle detailed incident view popup
  const handleViewTicket = async (ticket: Ticket) => {
    setActiveTicket(ticket);
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`);
      if (res.ok) {
        const data = await res.json();
        setTicketHistory(data.history || []);
        if (data.ticket) {
          setActiveTicket(data.ticket);
        }
      }
    } catch (e) {
      console.error("Failed to load ticket audit history", e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // CRUD: CREATE OR UPDATE RESCUE TEAM
  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeamFormError(null);

    // Validation (Only Unit Name, City, and State are required now)
    if (!teamForm.name || !teamForm.city || !teamForm.state) {
      setTeamFormError(language === "hi" ? "इकाई का नाम, शहर और राज्य आवश्यक हैं।" : "Unit Name, City, and State are required.");
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

  // CRUD: CREATE OR UPDATE TEAM MEMBER
  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberFormError(null);

    if (!memberForm.teamId || !memberForm.memberName || !memberForm.mobileNumber || !memberForm.city || !memberForm.state) {
      setMemberFormError(language === "hi" ? "सभी फ़ील्ड आवश्यक हैं।" : "All fields are required.");
      return;
    }

    setIsSubmittingMember(true);
    try {
      const isEdit = !!editingMember;
      const url = "/api/teams/members";
      const method = isEdit ? "PUT" : "POST";
      const body = isEdit ? { id: editingMember.id, ...memberForm } : memberForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowMemberModal(false);
        setEditingMember(null);
        setMemberForm({ teamId: "", memberName: "", mobileNumber: "", email: "", status: "Active", city: "", state: "" });
        setTeamSearchQuery("");
        loadAdminData();
      } else {
        const err = await res.json();
        setMemberFormError(err.error || (language === "hi" ? "कार्रवाई विफल रही" : "Action failed"));
      }
    } catch (err) {
      setMemberFormError(language === "hi" ? "सर्वर संचार विफल रहा" : "Server communication failed");
    } finally {
      setIsSubmittingMember(false);
    }
  };

  // CRUD: TOGGLE MEMBER STATUS ACTIVE/INACTIVE
  const handleToggleMemberStatus = async (member: TeamMember) => {
    const nextStatus = member.status === "Active" ? "Inactive" : "Active";
    try {
      const res = await fetch("/api/teams/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: member.id,
          status: nextStatus,
        }),
      });

      if (res.ok) {
        loadAdminData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to toggle status");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // CRUD: DELETE TEAM MEMBER
  const handleDeleteMember = async (id: string) => {
    if (!confirm(t("admin.confirmDeleteMember") || "Are you sure you want to remove this team member?")) return;
    try {
      const res = await fetch(`/api/teams/members?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadAdminData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete team member.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // CRUD: CREATE OR UPDATE USER
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError(null);

    if (!userForm.name || !userForm.mobile || !userForm.role) {
      setUserFormError(language === "hi" ? "सभी फ़ील्ड आवश्यक हैं।" : "All fields are required.");
      return;
    }

    setIsSubmittingUser(true);
    try {
      const isEdit = !!editingUser;
      const url = "/api/users";
      const method = isEdit ? "PUT" : "POST";
      const body = isEdit ? { id: editingUser.id, ...userForm } : userForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowUserModal(false);
        setEditingUser(null);
        setUserForm({ name: "", mobile: "", role: "user" });
        loadAdminData();
      } else {
        const err = await res.json();
        setUserFormError(err.error || (language === "hi" ? "कार्रवाई विफल रही" : "Action failed"));
      }
    } catch (err) {
      setUserFormError(language === "hi" ? "सर्वर संचार विफल रहा" : "Server communication failed");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // CRUD: DELETE USER
  const handleDeleteUser = async (id: string) => {
    if (id === user?.id) {
      alert(language === "hi" ? "आप स्वयं को ब्लॉक या हटा नहीं सकते!" : "You cannot delete your own admin account!");
      return;
    }
    if (!confirm(language === "hi" ? "क्या आप वाकई इस उपयोगकर्ता को हटाना चाहते हैं?" : "Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/users?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadAdminData();
      } else {
        alert("Failed to delete user.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // TICKET ALLOCATION SUBMIT
  const handleAssignTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetTicketId = allocatingTicket?.id || activeTicket?.id;
    if (!targetTicketId || !selectedTeamId) return;

    try {
      const res = await fetch(`/api/tickets/${targetTicketId}`, {
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
        if (activeTicket && activeTicket.id === targetTicketId) {
          handleViewTicket(activeTicket);
        }
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

  // Filtered Tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch = t.id.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                          t.animalType.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                          t.description.toLowerCase().includes(ticketSearch.toLowerCase());
    
    const matchesTab = selectedTicketTab === "All" ? true : t.status === selectedTicketTab;
    
    return matchesSearch && matchesTab;
  });

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    return u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
           u.mobile.includes(userSearch);
  });

  // Filtered Members
  const filteredMembers = members.filter((m) => {
    const q = memberSearch.toLowerCase();
    const matchesSearch = m.memberName.toLowerCase().includes(q) ||
           m.teamName.toLowerCase().includes(q) ||
           m.mobileNumber.includes(q);
    const matchesTeamFilter = selectedTeamFilter === "" ? true : m.teamId === selectedTeamFilter;
    return matchesSearch && matchesTeamFilter;
  });

  // Filtered Media items
  const filteredMediaItems = mediaItems.filter((item) => {
    const matchesCategory = mediaCategoryFilter === "all" ? true : item.category === mediaCategoryFilter;
    const q = mediaSearchQuery.toLowerCase();
    const matchesSearch = item.fileName.toLowerCase().includes(q) ||
                          (item.associatedId && item.associatedId.toLowerCase().includes(q)) ||
                          (item.associatedName && item.associatedName.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
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
    <div className="min-h-screen bg-[#0B132B] text-white flex flex-col md:flex-row w-full overflow-x-hidden">
      
      {/* MOBILE RESPONSIVE HEADER BAR */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-white/5 w-full">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-orange-500 animate-pulse" />
          <span className="font-black text-sm uppercase tracking-wider text-white">HF Admin Portal</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 border border-white/10"
        >
          <Sliders className="w-5 h-5" />
        </button>
      </div>

      {/* ADMIN SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-white/5 p-6 flex flex-col justify-between shrink-0 transition-transform duration-300
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="space-y-8">
          {/* Logo Brand Block */}
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20">
              <ShieldCheck className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <span className="text-[#F15A24] font-black text-[9px] uppercase tracking-widest block">{t("admin.coreControl")}</span>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">HF Admin</h2>
            </div>
          </div>

          {/* Sidebar Menu Options */}
          <nav className="space-y-1">
            {[
              { id: "terminal", label: language === "hi" ? "ऑपरेशन्स टर्मिनल" : "Operations Terminal", icon: Sliders },
              { id: "teams", label: language === "hi" ? "इकाई बनाएं (Create Unit)" : "Create Unit", icon: Ambulance },
              { id: "members", label: language === "hi" ? "टीम के सदस्य (Team Members)" : "Team Members", icon: Users },
              { id: "users", label: language === "hi" ? "उपयोगकर्ता प्रबंधन" : "User Management", icon: UserIcon },
              { id: "donations", label: language === "hi" ? "दान बहीखाता (Ledger)" : "Donations Ledger", icon: DollarSign },
              { id: "proofs", label: language === "hi" ? "ऑफ़लाइन दान ऑडिट" : "Offline Donation Proofs", icon: ShieldCheck },
              { id: "media", label: language === "hi" ? "मीडिया मैनेजर" : "Media Manager", icon: FileImage },
              { id: "reports", label: language === "hi" ? "सभी विश्लेषण रिपोर्ट" : "All Reports", icon: Heart },
              { id: "monitor", label: language === "hi" ? "सर्वर मॉनिटर" : "Server Monitor", icon: Server }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border
                    ${isActive 
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-500/30 shadow-md shadow-orange-500/10 scale-[1.02]" 
                      : "text-white/60 hover:text-white hover:bg-white/[0.02] border-transparent"
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white animate-pulse" : "text-white/40"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Info footer block */}
        <div className="pt-4 border-t border-white/5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center font-black text-orange-400 text-xs">
              {user?.name?.slice(0, 2).toUpperCase() || "AD"}
            </div>
            <div className="min-w-0 flex-grow">
              <div className="font-extrabold text-white text-xs truncate">{user?.name}</div>
              <div className="text-[10px] text-white/40 font-mono truncate">{user?.mobile}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER BACKDROP OVERLAY */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* MAIN ADMIN WINDOW */}
      <main className="flex-grow p-6 md:p-8 overflow-y-auto space-y-8 max-w-7xl mx-auto w-full">
        
        {/* Page Title Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
          <div>
            <span className="text-[#F15A24] font-black text-xs uppercase tracking-widest block">{t("admin.coreControl")}</span>
            <h1 className="text-3xl font-black mt-1">
              {activeTab === "terminal" && t("admin.portalTitle")}
              {activeTab === "teams" && (language === "hi" ? "इकाई बनाएं (Create Unit)" : "Create Unit")}
              {activeTab === "members" && (language === "hi" ? "टीम के सदस्य" : "Team Members")}
              {activeTab === "users" && (language === "hi" ? "उपयोगकर्ता प्रबंधन" : "User Management")}
              {activeTab === "donations" && (language === "hi" ? "दान बहीखाता (Ledger)" : "Donations Ledger")}
              {activeTab === "proofs" && (language === "hi" ? "ऑफ़लाइन दान ऑडिट" : "Offline Donation Proofs")}
              {activeTab === "reports" && (language === "hi" ? "सभी विश्लेषण रिपोर्ट" : "All Reports")}
              {activeTab === "monitor" && (language === "hi" ? "सर्वर मॉनिटर" : "Server Monitor")}
              {activeTab === "media" && (language === "hi" ? "मीडिया मैनेजर" : "Media Manager")}
            </h1>
            <p className="text-xs text-white/50">{t("admin.portalSubtitle")}</p>
          </div>
        </div>

        {/* ANALYTICS HIGHLIGHT CARDS (Shown on Terminal & Reports Tabs) */}
        {(activeTab === "terminal" || activeTab === "reports") && (
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
        )}

        {/* VIEW 1: OPERATIONS DISPATCH TERMINAL */}
        {activeTab === "terminal" && (
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <Ambulance className="w-5 h-5 text-orange-400" />
                {t("admin.dispatchTerminal")}
              </h3>
              
              <div className="flex gap-4 w-full sm:w-auto">
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
              </div>
            </div>

            {/* Ticket statuses navigation filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 border-b border-white/5">
              {(["All", "Pending", "Accepted", "Closed"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTicketTab(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex-shrink-0 cursor-pointer ${
                    selectedTicketTab === tab
                      ? "bg-white/10 text-white font-extrabold"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {tab === "All" && language === "hi" ? "सभी टिकट" : tab === "All" ? "All Tickets" : getStatusTranslation(tab)}
                  <span className="ml-1.5 text-[10px] opacity-60">
                    ({tab === "All" ? tickets.length : tickets.filter(t => t.status === tab).length})
                  </span>
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="text-center py-10 text-xs text-white/40">{t("admin.loadingTickets")}</div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-10 text-xs text-white/40">{t("admin.noIncidentReportsMatched")}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-white/50 uppercase tracking-widest font-black text-[9px]">
                      <th className="py-3 px-4">{t("admin.caseId")}</th>
                      <th className="py-3 px-4">{t("admin.animalType")}</th>
                      <th className="py-3 px-4">{t("admin.reportedDescription")}</th>
                      <th className="py-3 px-4">{t("admin.currentStatus")}</th>
                      <th className="py-3 px-4">{t("admin.assignedUnit")}</th>
                      <th className="py-3 px-4 text-right">{t("team.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredTickets.map((tItem) => (
                      <tr key={tItem.id} className="hover:bg-white/[0.01]">
                        <td className="py-3 px-4 font-mono font-bold text-white/80">{tItem.id}</td>
                        <td className="py-3 px-4 font-extrabold text-white">{tItem.animalType === "Other" ? tItem.customAnimalType : getAnimalTypeTranslation(tItem.animalType)}</td>
                        <td className="py-3 px-4 text-white/70 max-w-xs truncate">{tItem.description}</td>
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
                        <td className="py-3 px-4 text-white/70">
                          {tItem.assignedRescueTeamName || (
                            <span className="text-white/30 italic">{t("user.notAssigned")}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleViewTicket(tItem)}
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] uppercase font-black text-orange-400 rounded-lg transition-colors cursor-pointer"
                          >
                            Incident Center
                          </button>
                          {tItem.status === "Pending" ? (
                            <button
                              onClick={() => setAllocatingTicket(tItem)}
                              className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-[10px] uppercase font-black text-white rounded-lg transition-colors cursor-pointer"
                            >
                              Dispatch Unit
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
        )}

        {/* VIEW 2: RESCUE TEAM MANAGEMENT */}
        {/* VIEW 2: RESCUE TEAM MANAGEMENT */}
        {activeTab === "teams" && (
          selectedTeam ? (
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-6 animate-fade-in">
              {/* Header with back button */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                <div>
                  <button
                    onClick={() => setSelectedTeam(null)}
                    className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-bold mb-2 cursor-pointer"
                  >
                    ← {language === "hi" ? "वापस टीमों की सूची पर जाएं" : "Back to Teams List"}
                  </button>
                  <h3 className="font-extrabold text-xl text-white flex items-center gap-2">
                    <Users className="w-6 h-6 text-orange-400" />
                    {selectedTeam.name}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setEditingMember(null);
                    setMemberForm({
                      teamId: selectedTeam.id,
                      memberName: "",
                      mobileNumber: "",
                      email: "",
                      status: "Active",
                      city: selectedTeam.city,
                      state: selectedTeam.state
                    });
                    setTeamSearchQuery(selectedTeam.name);
                    setShowMemberModal(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {t("admin.createMemberBtn")}
                </button>
              </div>

              {/* Team Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                  <div className="text-[10px] uppercase text-white/40 tracking-wider mb-1">{t("admin.locality")}</div>
                  <div className="text-sm font-bold text-white">{selectedTeam.city}, {selectedTeam.state}</div>
                </div>
                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                  <div className="text-[10px] uppercase text-white/40 tracking-wider mb-1">{t("admin.status")}</div>
                  <div className="text-sm font-bold">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      selectedTeam.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {selectedTeam.status === "Active" ? t("admin.active") : t("admin.disabled")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Members Table */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-sm text-white/80 uppercase tracking-wider">
                  {language === "hi" ? "टीम के सदस्य" : "Team Members"}
                </h4>
                {members.filter(m => m.teamId === selectedTeam.id).length === 0 ? (
                  <div className="text-center py-10 text-xs text-white/40 bg-white/[0.02] border border-white/5 rounded-2xl">
                    {language === "hi" ? "इस टीम में अभी कोई सदस्य नहीं है।" : "No members registered in this team yet."}
                  </div>
                ) : (
                  <div className="overflow-x-auto bg-white/[0.01] border border-white/5 rounded-2xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-white/50 uppercase tracking-widest font-black text-[9px]">
                          <th className="py-3 px-4">{t("admin.memberName")}</th>
                          <th className="py-3 px-4">{t("admin.mobileNumber")}</th>
                          <th className="py-3 px-4">{t("admin.email")}</th>
                          <th className="py-3 px-4">{t("admin.status")}</th>
                          <th className="py-3 px-4 text-right">{t("team.actions")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {members.filter(m => m.teamId === selectedTeam.id).map((member) => (
                          <tr key={member.id} className="hover:bg-white/[0.01]">
                            <td className="py-3 px-4 font-extrabold text-white">{member.memberName}</td>
                            <td className="py-3 px-4 font-mono text-white/80">{member.mobileNumber}</td>
                            <td className="py-3 px-4 text-white/60">{member.email || "-"}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                member.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                              }`}>
                                {member.status === "Active" ? t("admin.active") : t("admin.disabled")}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button
                                onClick={() => handleToggleMemberStatus(member)}
                                title={member.status === "Active" ? (language === "hi" ? "सदस्य को अक्षम करें" : "Disable Member") : (language === "hi" ? "सदस्य को सक्षम करें" : "Enable Member")}
                                className="p-1.5 hover:bg-white/5 rounded text-white/50 hover:text-white cursor-pointer"
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingMember(member);
                                  setMemberForm({
                                    teamId: member.teamId,
                                    memberName: member.memberName,
                                    mobileNumber: member.mobileNumber,
                                    email: member.email || "",
                                    status: member.status,
                                    city: member.city || "",
                                    state: member.state || ""
                                  });
                                  setTeamSearchQuery(member.teamName);
                                  setShowMemberModal(true);
                                }}
                                className="p-1.5 hover:bg-white/5 rounded text-white/50 hover:text-orange-400 cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMember(member.id)}
                                className="p-1.5 hover:bg-white/5 rounded text-white/50 hover:text-red-400 cursor-pointer"
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
            </div>
          ) : (
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
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-white text-xs font-bold rounded-xl cursor-pointer"
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
                        <th className="py-3 px-4">{t("admin.locality")}</th>
                        <th className="py-3 px-4">{t("admin.status")}</th>
                        <th className="py-3 px-4 text-right">{t("team.actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {teams.map((team) => (
                        <tr key={team.id} className="hover:bg-white/[0.01]">
                          <td
                            onClick={() => setSelectedTeam(team)}
                            className="py-3 px-4 font-extrabold text-white hover:underline cursor-pointer"
                          >
                            {team.name}
                          </td>
                          <td className="py-3 px-4 text-white/70">{team.city}, {team.state}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              team.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                            }`}>
                              {team.status === "Active" ? t("admin.active") : t("admin.disabled")}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => setSelectedTeam(team)}
                              title={language === "hi" ? "सदस्य देखें" : "View Details / Members"}
                              className="p-1.5 hover:bg-white/5 rounded text-white/50 hover:text-blue-400 cursor-pointer"
                            >
                              <Users className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleTeamStatus(team)}
                              title={team.status === "Active" ? t("admin.disableTeam") : t("admin.activateTeam")}
                              className="p-1.5 hover:bg-white/5 rounded text-white/50 hover:text-white cursor-pointer"
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingTeam(team);
                                setTeamForm({ name: team.name, mobile: team.mobile, city: team.city, state: team.state, email: team.email, status: team.status });
                                setShowTeamModal(true);
                              }}
                              className="p-1.5 hover:bg-white/5 rounded text-white/50 hover:text-orange-400 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTeam(team.id)}
                              className="p-1.5 hover:bg-white/5 rounded text-white/50 hover:text-red-400 cursor-pointer"
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
          )
        )}

        {/* VIEW: RESCUE TEAM MEMBER MANAGEMENT (TAB VIEW) */}
        {activeTab === "members" && (
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-400" />
                {t("admin.tabMembers") || (language === "hi" ? "टीम के सदस्य" : "Team Members")}
              </h3>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-stretch sm:items-center">
                {/* Rescue Unit / Team Filter Dropdown */}
                <div className="relative flex-grow sm:w-56">
                  <select
                    value={selectedTeamFilter}
                    onChange={(e) => setSelectedTeamFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-bold cursor-pointer"
                  >
                    <option value="">
                      {t("admin.allTeamsOption") || (language === "hi" ? "सभी इकाइयाँ / टीमें" : "All Units / Teams")}
                    </option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative flex-grow sm:w-60">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder={language === "hi" ? "सदस्य या टीम खोजें..." : "Search members or units..."}
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                
                <button
                  onClick={() => {
                    setEditingMember(null);
                    setMemberForm({
                      teamId: "",
                      memberName: "",
                      mobileNumber: "",
                      email: "",
                      status: "Active",
                      city: "",
                      state: ""
                    });
                    setTeamSearchQuery("");
                    setShowMemberModal(true);
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-white text-xs font-bold rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  {t("admin.createMemberBtn")}
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-10 text-xs text-white/40">{t("admin.loadingTeams") || "Loading..."}</div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-10 text-xs text-white/40 bg-white/[0.02] border border-white/5 rounded-2xl">
                {language === "hi" ? "कोई टीम सदस्य नहीं मिला।" : "No team members found."}
              </div>
            ) : (
              <div className="overflow-x-auto bg-white/[0.01] border border-white/5 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-white/50 uppercase tracking-widest font-black text-[9px]">
                      <th className="py-3 px-4">{t("admin.memberName")}</th>
                      <th className="py-3 px-4">{language === "hi" ? "बचाव दल / इकाई" : "Rescue Unit / Team"}</th>
                      <th className="py-3 px-4">{t("admin.mobileNumber")}</th>
                      <th className="py-3 px-4">{t("admin.email")}</th>
                      <th className="py-3 px-4">{t("admin.status")}</th>
                      <th className="py-3 px-4 text-right">{t("team.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-white/[0.01]">
                        <td className="py-3 px-4 font-extrabold text-white">{member.memberName}</td>
                        <td className="py-3 px-4 font-bold text-orange-400">{member.teamName}</td>
                        <td className="py-3 px-4 font-mono text-white/80">{member.mobileNumber}</td>
                        <td className="py-3 px-4 text-white/60">{member.email || "-"}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            member.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                          }`}>
                            {member.status === "Active" ? t("admin.active") : t("admin.disabled")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleToggleMemberStatus(member)}
                            title={member.status === "Active" ? (language === "hi" ? "सदस्य को अक्षम करें" : "Disable Member") : (language === "hi" ? "सदस्य को सक्षम करें" : "Enable Member")}
                            className="p-1.5 hover:bg-white/5 rounded text-white/50 hover:text-white cursor-pointer"
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingMember(member);
                              setMemberForm({
                                teamId: member.teamId,
                                memberName: member.memberName,
                                mobileNumber: member.mobileNumber,
                                email: member.email || "",
                                status: member.status,
                                city: member.city || "",
                                state: member.state || ""
                              });
                              setTeamSearchQuery(member.teamName);
                              setShowMemberModal(true);
                            }}
                            className="p-1.5 hover:bg-white/5 rounded text-white/50 hover:text-orange-400 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            className="p-1.5 hover:bg-white/5 rounded text-white/50 hover:text-red-400 cursor-pointer"
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
        )}

        {/* VIEW 3: USER MANAGEMENT */}
        {activeTab === "users" && (
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
              <div>
                <h3 className="font-extrabold text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-400" />
                  {language === "hi" ? "उपयोगकर्ता प्रबंधन" : "User Management"}
                </h3>
                <p className="text-xs text-white/40 mt-1">
                  {language === "hi" ? "सभी नागरिकों, राहत दल और प्रशासनिक खातों का प्रबंधन करें" : "Manage all citizen, rescue team, and administrative accounts"}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setUserForm({ name: "", mobile: "", role: "user" });
                  setShowUserModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {language === "hi" ? "नया उपयोगकर्ता जोड़ें" : "Add New User"}
              </button>
            </div>

            <div className="flex gap-4 w-full md:max-w-xs">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder={language === "hi" ? "नाम या मोबाइल नंबर से खोजें..." : "Search by name or mobile..."}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-10 text-xs text-white/40">
                {language === "hi" ? "उपयोगकर्ता सूची लोड हो रही है..." : "Loading users list..."}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-10 text-xs text-white/40">
                {language === "hi" ? "कोई उपयोगकर्ता नहीं मिला" : "No users found"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-white/50 uppercase tracking-widest font-black text-[9px]">
                      <th className="py-3 px-4">{language === "hi" ? "यूजर आईडी" : "User ID"}</th>
                      <th className="py-3 px-4">{language === "hi" ? "नाम" : "Name"}</th>
                      <th className="py-3 px-4">{language === "hi" ? "मोबाइल नंबर" : "Mobile Number"}</th>
                      <th className="py-3 px-4">{language === "hi" ? "भूमिका (Role)" : "Role"}</th>
                      <th className="py-3 px-4">{language === "hi" ? "पंजीकरण तिथि" : "Registered Date"}</th>
                      <th className="py-3 px-4 text-right">{language === "hi" ? "कार्रवाई" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map((uItem) => (
                      <tr key={uItem.id} className="hover:bg-white/[0.01]">
                        <td className="py-3 px-4 font-mono text-white/50">{uItem.id}</td>
                        <td className="py-3 px-4 font-extrabold text-white">{uItem.name}</td>
                        <td className="py-3 px-4 font-mono text-white/80">{uItem.mobile}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                            uItem.role === "admin" 
                              ? "bg-red-500/10 text-red-400 border-red-500/20" 
                              : uItem.role === "team"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                          }`}>
                            {uItem.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white/40">
                          {new Date(uItem.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingUser(uItem);
                              setUserForm({ name: uItem.name, mobile: uItem.mobile, role: uItem.role });
                              setShowUserModal(true);
                            }}
                            className="p-1.5 hover:bg-white/5 rounded text-white/50 hover:text-orange-400 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(uItem.id)}
                            disabled={uItem.id === user?.id}
                            className="p-1.5 hover:bg-white/5 rounded text-white/50 hover:text-red-400 disabled:opacity-30 cursor-pointer"
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
        )}

        {/* VIEW 4: DONATIONS GENERAL LEDGER */}
        {activeTab === "donations" && (
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-orange-400" />
                {t("admin.donationsLedgerTitle")}
              </h3>
              
              <button
                onClick={handleExportDonations}
                disabled={verifiedDonations.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0B132B] hover:bg-[#1E293B] border border-white/10 text-orange-400 text-xs font-extrabold rounded-xl cursor-pointer"
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
        )}

        {/* VIEW 5: OFFLINE DONATION PROOFS */}
        {activeTab === "proofs" && (
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
        )}

        {/* VIEW 6: REPORTS & CHARTS */}
        {activeTab === "reports" && (
          <div className="space-y-8 w-full">
            <AnimalCategoryReports />
            <DonationsLedgerChart />
            
            {/* Direct analytical review details */}
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-orange-500">
                {language === "hi" ? "सिस्टम प्रदर्शन रिपोर्ट" : "System Performance Review"}
              </h3>
              <p className="text-xs text-white/70 leading-relaxed font-medium">
                {language === "hi" 
                  ? "यह रिपोर्ट कुल दान विश्लेषण, राहत दल के सक्रिय योगदान, और रिपोर्ट किए गए मामलों के सफल समाधान चक्र को प्रदर्शित करती है। यह डेटा प्रत्येक गौशाला और चिकित्सा राहत अभियानों को मजबूत करने में मदद करता है।"
                  : "This analytics pane represents overall verification flows, active volunteer ambulance dispatches, and emergency incident closures. The visual matrix helps administrative personnel allocate critical budget resources where they are needed most."}
              </p>
            </div>
          </div>
        )}

        {/* VIEW 7: SERVER HEALTH MONITORING DASHBOARD */}
        {activeTab === "monitor" && (
          <div className="space-y-8 w-full">
            
            {/* Last updated and quick reload toolbar */}
            <div className="flex justify-between items-center bg-slate-900 border border-white/10 p-4 rounded-2xl">
              <span className="text-xs text-white/50 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {language === "hi" ? `अंतिम अद्यतन: ${lastUpdated || "कभी नहीं"}` : `Last Updated: ${lastUpdated || "Never"}`}
                <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded-full text-white/30 tracking-widest font-mono">10s REFRESH</span>
              </span>
              <button
                onClick={() => fetchServerHealth()}
                disabled={isHealthLoading}
                className="px-3.5 py-1.5 bg-[#0B132B] hover:bg-[#1E293B] border border-white/10 text-orange-400 text-xs font-black rounded-xl transition-all cursor-pointer disabled:opacity-40"
              >
                {isHealthLoading ? (language === "hi" ? "रिफ्रेशिंग..." : "Refreshing...") : (language === "hi" ? "अभी रिफ्रेश करें" : "Refresh Now")}
              </button>
            </div>

            {healthError && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {healthError}
              </div>
            )}

            {/* LIVE ALERT NOTIFICATIONS SYSTEM */}
            {serverHealth && (
              <div className="space-y-2">
                {serverHealth.cpu.usage > 80 && (
                  <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-2xl text-red-400 text-xs font-black flex items-center gap-2 animate-pulse">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span>⚠️ ALERT: High CPU usage detected ({serverHealth.cpu.usage}%)! System resources heavily loaded.</span>
                  </div>
                )}
                {serverHealth.memory.percentage > 85 && (
                  <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-2xl text-red-400 text-xs font-black flex items-center gap-2 animate-pulse">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span>⚠️ ALERT: Memory usage is extremely high ({serverHealth.memory.percentage}%)! Consider checking leak traces.</span>
                  </div>
                )}
                {serverHealth.storage.percentage > 90 && (
                  <div className="p-4 bg-orange-500/15 border border-orange-500/30 rounded-2xl text-orange-400 text-xs font-black flex items-center gap-2 animate-pulse">
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                    <span>⚠️ WARNING: Low disk space available! Storage almost full ({serverHealth.storage.percentage}% used). Please clean logs.</span>
                  </div>
                )}
              </div>
            )}

            {!serverHealth && isHealthLoading ? (
              <div className="text-center py-20 text-xs text-white/40 animate-pulse">
                {language === "hi" ? "सर्वर स्वास्थ्य मेट्रिक्स एकत्र किए जा रहे हैं..." : "Gathering server health metrics..."}
              </div>
            ) : !serverHealth ? (
              <div className="text-center py-20 text-xs text-white/40">
                {language === "hi" ? "कोई डेटा उपलब्ध नहीं है" : "No monitoring data available."}
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* CORE RESOURCE CARDS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Card 1: RAM Memory usage circular monitor */}
                  <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl flex flex-col justify-between items-center text-center space-y-4">
                    <div className="w-full flex justify-between items-center border-b border-white/5 pb-2 text-left">
                      <span className="text-xs uppercase font-extrabold text-white/40">RAM Usage</span>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                        serverHealth.memory.percentage >= 85 
                          ? "bg-red-500/10 text-red-400" 
                          : serverHealth.memory.percentage >= 70
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-emerald-500/10 text-emerald-400"
                      }`}>
                        {serverHealth.memory.percentage >= 85 
                          ? "Critical" 
                          : serverHealth.memory.percentage >= 70
                          ? "Warning"
                          : "Normal"}
                      </span>
                    </div>

                    {/* Circular visual logic */}
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="46" strokeWidth="8" stroke="rgba(255,255,255,0.03)" fill="transparent" />
                        <circle cx="56" cy="56" r="46" strokeWidth="8" 
                                stroke={serverHealth.memory.percentage >= 85 ? "#EF4444" : serverHealth.memory.percentage >= 70 ? "#F59E0B" : "#F15A24"}
                                strokeDasharray={2 * Math.PI * 46} 
                                strokeDashoffset={2 * Math.PI * 46 * (1 - serverHealth.memory.percentage / 100)} 
                                strokeLinecap="round" fill="transparent" />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-black text-white">{serverHealth.memory.percentage}%</span>
                        <span className="text-[8px] uppercase tracking-wider text-white/40">Used</span>
                      </div>
                    </div>

                    <div className="w-full text-xs text-white/70 space-y-1.5 text-left bg-white/[0.01] p-3 rounded-2xl border border-white/5">
                      <div className="flex justify-between">
                        <span className="text-white/40 font-bold">Total RAM:</span>
                        <span className="font-extrabold text-white">{serverHealth.memory.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40 font-bold">Used RAM:</span>
                        <span className="font-extrabold text-orange-400">{serverHealth.memory.used}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40 font-bold">Available:</span>
                        <span className="font-extrabold text-emerald-400">{serverHealth.memory.free}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: CPU load & processor details */}
                  <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl flex flex-col justify-between space-y-4">
                    <div className="w-full flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-xs uppercase font-extrabold text-white/40">CPU Monitor</span>
                      <Activity className="w-4 h-4 text-orange-400 animate-pulse" />
                    </div>

                    {/* Progress Bar Display */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/60 font-bold">CPU Usage</span>
                        <span className="font-black text-orange-400">{serverHealth.cpu.usage}%</span>
                      </div>
                      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                        <div className="h-full bg-gradient-to-r from-orange-500 to-[#FF8C00] transition-all duration-1000"
                             style={{ width: `${serverHealth.cpu.usage}%` }} />
                      </div>
                    </div>

                    <div className="text-xs text-white/70 space-y-2 bg-white/[0.01] p-3 rounded-2xl border border-white/5">
                      <div>
                        <span className="block text-[8px] uppercase text-white/40 font-bold">Processor Name</span>
                        <span className="font-extrabold text-white line-clamp-1">{serverHealth.cpu.processor}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <span className="block text-[8px] uppercase text-white/40 font-bold">Architecture</span>
                          <span className="font-mono text-white/90">{serverHealth.cpu.architecture}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] uppercase text-white/40 font-bold">CPU Cores</span>
                          <span className="font-extrabold text-white">{serverHealth.cpu.cores} Cores</span>
                        </div>
                      </div>
                      <div className="border-t border-white/5 pt-1.5 flex justify-between items-center">
                        <span className="text-white/40 font-bold">Load Average:</span>
                        <span className="font-mono font-black text-white">{serverHealth.cpu.loadAverage}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Storage Disk utilization */}
                  <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl flex flex-col justify-between space-y-4">
                    <div className="w-full flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-xs uppercase font-extrabold text-white/40">Storage Partition</span>
                      <Server className="w-4 h-4 text-orange-400" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/60 font-bold">Disk Space Used</span>
                        <span className="font-black text-orange-400">{serverHealth.storage.percentage}%</span>
                      </div>
                      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                        <div className="h-full bg-gradient-to-r from-orange-500 to-[#FF8C00] transition-all duration-1000"
                             style={{ width: `${serverHealth.storage.percentage}%` }} />
                      </div>
                    </div>

                    <div className="text-xs text-white/70 space-y-1.5 bg-white/[0.01] p-3 rounded-2xl border border-white/5">
                      <div className="flex justify-between">
                        <span className="text-white/40 font-bold">Total Storage:</span>
                        <span className="font-extrabold text-white">{serverHealth.storage.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40 font-bold">Used Disk Space:</span>
                        <span className="font-extrabold text-orange-400">{serverHealth.storage.used}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40 font-bold">Available Free:</span>
                        <span className="font-extrabold text-emerald-400">{serverHealth.storage.available}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SERVER INFORMATION TABLES & DATABASE STATUSES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* OS Operating system and versions table */}
                  <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl space-y-4">
                    <h4 className="font-extrabold text-sm uppercase tracking-wider text-orange-500 border-b border-white/5 pb-2 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Server Information
                    </h4>
                    
                    <div className="text-xs space-y-2">
                      {[
                        { label: "Operating System", val: serverHealth.server.os },
                        { label: "Platform / Architecture", val: `${serverHealth.server.platform} / ${serverHealth.server.architecture}` },
                        { label: "Hostname / Host IP", val: `${serverHealth.server.hostname} (${serverHealth.server.ip})` },
                        { label: "Node.js Environment", val: serverHealth.server.nodeVersion },
                        { label: "Server Time / Zone", val: `${serverHealth.server.currentTime} (${serverHealth.server.timezone})` },
                        { label: "Server Uptime", val: serverHealth.server.uptime, highlight: true },
                        { label: "App Uptime", val: serverHealth.server.appUptime, highlight: true },
                      ].map((row, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1 border-b border-white/[0.02]">
                          <span className="text-white/50 font-bold">{row.label}</span>
                          <span className={`font-semibold ${row.highlight ? "text-orange-400 font-extrabold" : "text-white"}`}>
                            {row.val}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Database & Application Health states */}
                  <div className="space-y-6">
                    
                    {/* PostgreSQL database connector stat */}
                    <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl space-y-4">
                      <h4 className="font-extrabold text-sm uppercase tracking-wider text-orange-500 border-b border-white/5 pb-2 flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <Sliders className="w-4 h-4" />
                          Database connection status
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          serverHealth.database.status === "CONNECTED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" : "bg-red-500/10 text-red-400 border border-red-500/25"
                        }`}>
                          {serverHealth.database.status}
                        </span>
                      </h4>
                      <div className="text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-white/50 font-bold">Database Driver</span>
                          <span className="font-extrabold text-white">PostgreSQL (Neon Serverless)</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/50 font-bold">Database Name</span>
                          <span className="font-mono text-white/80">{serverHealth.database.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/50 font-bold">Query Response Time</span>
                          <span className="font-extrabold text-emerald-400">{serverHealth.database.responseTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* Integrated Firebase & Health Indicators */}
                    <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl space-y-4">
                      <h4 className="font-extrabold text-sm uppercase tracking-wider text-orange-500 border-b border-white/5 pb-2">
                        Application Service Health
                      </h4>
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        {[
                          { label: "Backend API", val: serverHealth.health.apiStatus, active: serverHealth.health.apiStatus === "ONLINE" },
                          { label: "Firebase OTP", val: serverHealth.health.firebaseStatus, active: serverHealth.health.firebaseStatus === "CONNECTED" },
                          { label: "S3 Storage", val: serverHealth.health.storageStatus, active: serverHealth.health.storageStatus === "AVAILABLE" },
                        ].map((stat, idx) => (
                          <div key={idx} className="bg-white/[0.01] border border-white/5 rounded-2xl p-3 space-y-1">
                            <span className="block text-[8px] uppercase tracking-wider text-white/40 font-bold">{stat.label}</span>
                            <span className={`block text-[10px] font-black uppercase ${
                              stat.active ? "text-emerald-400" : "text-red-400"
                            }`}>
                              {stat.val}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* NETWORK SPEEDS & FLOW INFO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Active Network Metrics */}
                  <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl space-y-4">
                    <h4 className="font-extrabold text-sm uppercase tracking-wider text-orange-500 border-b border-white/5 pb-2">
                      Network Interfaces Speed
                    </h4>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-3">
                        <span className="block text-[8px] uppercase tracking-wider text-white/40 font-bold">Upload (TX)</span>
                        <span className="block text-sm font-black text-orange-400 mt-1">{serverHealth.network.upload}</span>
                      </div>
                      <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-3">
                        <span className="block text-[8px] uppercase tracking-wider text-white/40 font-bold">Download (RX)</span>
                        <span className="block text-sm font-black text-emerald-400 mt-1">{serverHealth.network.download}</span>
                      </div>
                      <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-3">
                        <span className="block text-[8px] uppercase tracking-wider text-white/40 font-bold">Interface Speed</span>
                        <span className="block text-sm font-black text-white mt-1">{serverHealth.network.speed}</span>
                      </div>
                    </div>
                  </div>

                  {/* Network stats load */}
                  <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl space-y-4">
                    <h4 className="font-extrabold text-sm uppercase tracking-wider text-orange-500 border-b border-white/5 pb-2">
                      API Metrics Overview
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-3">
                        <span className="block text-[8px] uppercase tracking-wider text-white/40 font-bold">Total Request Load</span>
                        <span className="block text-sm font-black text-white mt-1">{serverHealth.network.requestCount.toLocaleString()}</span>
                      </div>
                      <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-3">
                        <span className="block text-[8px] uppercase tracking-wider text-white/40 font-bold">Avg Response Time</span>
                        <span className="block text-sm font-black text-emerald-400 mt-1">{serverHealth.network.responseTime}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FUTURE SCOPE MONITORING ROADMAP */}
                <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl space-y-4">
                  <h4 className="font-extrabold text-xs uppercase tracking-widest text-orange-500/60">
                    🔍 Future Ready Logs Monitoring roadmap
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
                    {[
                      "Error Logs Viewer",
                      "API Gateway Logs",
                      "User activity trail",
                      "Firebase usages",
                      "S3 storage details",
                      "Active Live Users"
                    ].map((roadmap, idx) => (
                      <div key={idx} className="bg-white/[0.01] border border-white/5 hover:border-orange-500/10 p-2.5 rounded-xl text-[10px] text-white/40 hover:text-white/70 transition-all font-semibold select-none cursor-help">
                        {roadmap}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* VIEW: MEDIA MANAGER (TAB VIEW) */}
        {activeTab === "media" && (
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <FileImage className="w-5 h-5 text-orange-400" />
                {language === "hi" ? "मीडिया मैनेजर" : "Media Manager"}
              </h3>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-stretch sm:items-center">
                {/* Category Dropdown Filter */}
                <div className="relative flex-grow sm:w-56">
                  <select
                    value={mediaCategoryFilter}
                    onChange={(e) => setMediaCategoryFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-bold cursor-pointer"
                  >
                    <option value="all">{language === "hi" ? "सभी मीडिया" : "All Media"}</option>
                    <option value="incident_image">{language === "hi" ? "घटना की तस्वीरें" : "Incident Images"}</option>
                    <option value="incident_video">{language === "hi" ? "घटना के वीडियो" : "Incident Videos"}</option>
                    <option value="donation_proof">{language === "hi" ? "दान के प्रमाण" : "Donation Proofs"}</option>
                    <option value="closure_photo">{language === "hi" ? "केस बंद होने की तस्वीरें" : "Closure Photos"}</option>
                    <option value="unlinked">{language === "hi" ? "अनाथ फ़ाइलें (Orphaned)" : "Orphaned Files"}</option>
                  </select>
                </div>

                {/* Search Box */}
                <div className="relative flex-grow sm:w-60">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder={language === "hi" ? "फ़ाइल या आईडी खोजें..." : "Search filename, case ID..."}
                    value={mediaSearchQuery}
                    onChange={(e) => setMediaSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Quick Metrics Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-[10px] text-white/40 uppercase font-extrabold tracking-wider block mb-1">
                  {language === "hi" ? "कुल फाइलें" : "Total Assets"}
                </span>
                <span className="text-xl font-black text-white">{mediaItems.length}</span>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-[10px] text-white/40 uppercase font-extrabold tracking-wider block mb-1">
                  {language === "hi" ? "अनाथ फाइलें" : "Orphaned Files"}
                </span>
                <span className="text-xl font-black text-orange-400">
                  {mediaItems.filter(m => m.category === "unlinked").length}
                </span>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-[10px] text-white/40 uppercase font-extrabold tracking-wider block mb-1">
                  {language === "hi" ? "कुल स्थान" : "Total Disk Space"}
                </span>
                <span className="text-xl font-black text-white">
                  {(mediaItems.reduce((sum, m) => sum + m.sizeBytes, 0) / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-[10px] text-white/40 uppercase font-extrabold tracking-wider block mb-1">
                  {language === "hi" ? "वीडियो क्लिप्स" : "Video Clips"}
                </span>
                <span className="text-xl font-black text-white">
                  {mediaItems.filter(m => m.fileType === "video").length}
                </span>
              </div>
            </div>

            {/* Error or Loading */}
            {isMediaLoading ? (
              <div className="text-center py-20 text-xs text-white/40 animate-pulse">
                {language === "hi" ? "मीडिया फ़ाइलें लोड हो रही हैं..." : "Loading media resources..."}
              </div>
            ) : mediaError ? (
              <div className="text-center py-20 text-xs text-red-400 bg-red-500/5 border border-red-500/10 rounded-2xl">
                {mediaError}
              </div>
            ) : filteredMediaItems.length === 0 ? (
              <div className="text-center py-20 text-xs text-white/40 bg-white/[0.02] border border-white/5 rounded-2xl">
                {language === "hi" ? "कोई मीडिया फ़ाइल नहीं मिली।" : "No media files found matching the criteria."}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {filteredMediaItems.map((item, idx) => {
                  const sizeStr = (item.sizeBytes / 1024).toFixed(1) + " KB";
                  const uploadDate = new Date(item.uploadedAt).toLocaleDateString();
                  
                  return (
                    <div 
                      key={idx}
                      className="group bg-white/[0.02] border border-white/10 hover:border-orange-500/20 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between"
                    >
                      {/* Media Preview Container */}
                      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden cursor-pointer"
                           onClick={() => setActiveLightbox({ url: item.url, type: item.fileType })}>
                        {item.fileType === "image" ? (
                          <img 
                            src={item.url} 
                            alt={item.fileName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
                            <video src={item.url} className="w-full h-full object-cover opacity-60 pointer-events-none" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="p-3 bg-orange-500 rounded-full text-white shadow-lg">
                                <Video className="w-5 h-5" />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Type Tag */}
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[8px] uppercase tracking-wider text-white/90 font-black">
                          {item.fileType}
                        </div>
                      </div>

                      {/* Info & Metadata Panel */}
                      <div className="p-4 space-y-3 flex-grow flex flex-col justify-between">
                        <div>
                          <p className="text-[11px] font-black text-white truncate" title={item.fileName}>
                            {item.fileName}
                          </p>
                          <div className="flex justify-between items-center text-[9px] text-white/40 mt-1 font-bold">
                            <span>{uploadDate}</span>
                            <span>{sizeStr}</span>
                          </div>
                        </div>

                        {/* Associated Case/Donation Reference */}
                        <div className="pt-2 border-t border-white/5 flex justify-between items-center gap-2">
                          {item.associatedId ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (item.category === "donation_proof") {
                                  setActiveTab("proofs");
                                } else {
                                  setActiveTab("terminal");
                                  setTicketSearch(item.associatedId);
                                }
                              }}
                              className="text-[9px] px-2 py-1 rounded-lg bg-orange-500/10 text-orange-400 font-extrabold hover:bg-orange-500/20 transition-all text-left truncate flex-grow"
                            >
                              {item.category === "donation_proof" ? `Donation Proof` : `Case #${item.associatedId}`}
                            </button>
                          ) : (
                            <span className="text-[9px] px-2 py-1 rounded-lg bg-red-500/10 text-red-400 font-extrabold">
                              {language === "hi" ? "अनाथ (Unlinked)" : "Orphaned"}
                            </span>
                          )}

                          {/* Delete Action button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(language === "hi" 
                                ? "क्या आप वाकई इस फ़ाइल को स्थायी रूप से हटाना चाहते हैं? यह इसे सर्वर से हटा देगा।"
                                : "Are you sure you want to permanently delete this media file? This will remove it from the server."
                              )) {
                                handleDeleteMedia(item.url);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                            title="Delete Media"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

      {/* USER CRUD MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-start bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-white/20 max-w-md w-full rounded-3xl p-6 shadow-2xl relative mx-auto my-auto">
            <button
              onClick={() => setShowUserModal(false)}
              className="absolute top-5 right-5 text-white/40 hover:text-white cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-lg font-black mb-6 text-white border-b border-white/5 pb-3">
              {editingUser ? (language === "hi" ? "उपयोगकर्ता विवरण संपादित करें" : "Edit User Profile") : (language === "hi" ? "नया उपयोगकर्ता पंजीकृत करें" : "Register New Account")}
            </h3>

            {userFormError && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {userFormError}
              </div>
            )}

            <form onSubmit={handleUserSubmit} className="space-y-4 text-xs font-bold text-white/70">
              <div>
                <label className="block mb-1.5 uppercase tracking-wider text-white/50">{language === "hi" ? "पूरा नाम" : "Full Name"}</label>
                <input
                  type="text"
                  required
                  placeholder={language === "hi" ? "नाम दर्ज करें" : "Enter full name"}
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                />
              </div>

              <div>
                <label className="block mb-1.5 uppercase tracking-wider text-white/50">{t("admin.mobileOtpLabel")}</label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  disabled={!!editingUser}
                  placeholder={t("admin.mobilePlaceholder")}
                  value={userForm.mobile}
                  onChange={(e) => setUserForm({ ...userForm, mobile: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white font-mono disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block mb-1.5 uppercase tracking-wider text-white/50">{language === "hi" ? "भूमिका (User Role)" : "Account Role"}</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                >
                  <option value="user">{language === "hi" ? "नागरिक (Citizen User)" : "Citizen Reporter (User)"}</option>
                  <option value="team">{language === "hi" ? "राहत दल (Rescue Team Account)" : "Rescue Team User"}</option>
                  <option value="admin">{language === "hi" ? "प्रशासक (Admin Profile)" : "Super Administrator"}</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="w-1/3 py-3 border border-white/10 rounded-xl text-xs font-bold text-white/60 hover:text-white cursor-pointer"
                >
                  {t("admin.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="w-2/3 py-3 bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-white font-black rounded-xl text-xs transition-opacity flex items-center justify-center cursor-pointer"
                >
                  {isSubmittingUser ? t("admin.savingDetails") : t("admin.saveTeamBtn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESCUE TEAM CRUD MODAL */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-start bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-white/20 max-w-lg w-full rounded-3xl p-6 shadow-2xl relative mx-auto my-auto">
            <button
              onClick={() => setShowTeamModal(false)}
              className="absolute top-5 right-5 text-white/40 hover:text-white cursor-pointer"
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
                  className="w-1/3 py-3 border border-white/10 rounded-xl text-xs font-bold text-white/60 hover:text-white cursor-pointer"
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

      {/* TEAM MEMBER CRUD MODAL */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-start bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-white/20 max-w-lg w-full rounded-3xl p-6 shadow-2xl relative mx-auto my-auto">
            <button
              onClick={() => {
                setShowMemberModal(false);
                setIsTeamDropdownOpen(false);
              }}
              className="absolute top-5 right-5 text-white/40 hover:text-white cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-lg font-black mb-6 text-white border-b border-white/5 pb-3">
              {editingMember ? `${t("admin.editMemberBtn")}: ${editingMember.memberName}` : t("admin.createMemberBtn")}
            </h3>

            {memberFormError && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {memberFormError}
              </div>
            )}

            <form onSubmit={handleMemberSubmit} className="space-y-4 text-xs font-bold text-white/70">
              {/* Select Team dropdown with search filter functionality */}
              <div>
                <label className="block mb-1.5 uppercase tracking-wider text-white/50">{t("admin.selectTeamDropdown")}</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder={t("admin.selectTeamOption")}
                    value={teamSearchQuery}
                    onChange={(e) => {
                      setTeamSearchQuery(e.target.value);
                      setIsTeamDropdownOpen(true);
                      // If typing, reset teamId if it doesn't match
                      const matched = teams.find(t => t.name === e.target.value);
                      if (matched) {
                        setMemberForm(prev => ({ 
                          ...prev, 
                          teamId: matched.id,
                          city: matched.city,
                          state: matched.state
                        }));
                      }
                    }}
                    onFocus={() => setIsTeamDropdownOpen(true)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                  />
                  {isTeamDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-slate-950 border border-white/20 rounded-xl max-h-48 overflow-y-auto shadow-2xl">
                      {teams
                        .filter((t) => t.status === "Active" && t.name.toLowerCase().includes(teamSearchQuery.toLowerCase()))
                        .map((team) => (
                           <div
                             key={team.id}
                             onClick={() => {
                               setMemberForm(prev => ({ 
                                 ...prev, 
                                 teamId: team.id,
                                 city: team.city,
                                 state: team.state
                               }));
                               setTeamSearchQuery(team.name);
                               setIsTeamDropdownOpen(false);
                             }}
                            className="px-4 py-2 hover:bg-white/10 text-white text-xs font-bold cursor-pointer"
                          >
                            {team.name} ({team.city})
                          </div>
                        ))}
                      {teams.filter((t) => t.status === "Active" && t.name.toLowerCase().includes(teamSearchQuery.toLowerCase())).length === 0 && (
                        <div className="px-4 py-2 text-white/40 text-xs">
                          {language === "hi" ? "कोई सक्रिय टीम नहीं मिली" : "No active teams found"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* City and State fields (enabled/editable) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 uppercase tracking-wider text-white/50">{t("admin.city")}</label>
                  <input
                    type="text"
                    required
                    placeholder={t("admin.city")}
                    value={memberForm.city}
                    onChange={(e) => setMemberForm({ ...memberForm, city: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 uppercase tracking-wider text-white/50">{t("admin.state")}</label>
                  <input
                    type="text"
                    required
                    placeholder={t("admin.state")}
                    value={memberForm.state}
                    onChange={(e) => setMemberForm({ ...memberForm, state: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 uppercase tracking-wider text-white/50">{t("admin.memberNameLabel")}</label>
                  <input
                    type="text"
                    required
                    placeholder={t("admin.memberNamePlaceholder")}
                    value={memberForm.memberName}
                    onChange={(e) => setMemberForm({ ...memberForm, memberName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 uppercase tracking-wider text-white/50">{t("admin.mobileNumber")}</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    placeholder={t("admin.mobilePlaceholder")}
                    value={memberForm.mobileNumber}
                    onChange={(e) => setMemberForm({ ...memberForm, mobileNumber: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 uppercase tracking-wider text-white/50">{t("admin.emailLabel")}</label>
                <input
                  type="email"
                  placeholder={t("admin.emailPlaceholder")}
                  value={memberForm.email}
                  onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                />
              </div>

              <div>
                <label className="block mb-1.5 uppercase tracking-wider text-white/50">{t("admin.status")}</label>
                <select
                  value={memberForm.status}
                  onChange={(e) => setMemberForm({ ...memberForm, status: e.target.value as any })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                >
                  <option value="Active">{t("admin.active")}</option>
                  <option value="Inactive">{t("admin.disabled")}</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setShowMemberModal(false);
                    setIsTeamDropdownOpen(false);
                  }}
                  className="w-1/3 py-3 border border-white/10 rounded-xl text-xs font-bold text-white/60 hover:text-white cursor-pointer"
                >
                  {t("admin.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMember}
                  className="w-2/3 py-3 bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-white font-black rounded-xl text-xs transition-opacity flex items-center justify-center cursor-pointer"
                >
                  {isSubmittingMember ? t("admin.savingDetails") : t("admin.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPATCH TEAM ALLOCATION MODAL */}
      {allocatingTicket && (
        <div className="fixed inset-0 z-50 flex justify-center items-start bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-white/20 max-w-md w-full rounded-3xl p-6 shadow-2xl relative mx-auto my-auto">
            <button
              onClick={() => setAllocatingTicket(null)}
              className="absolute top-5 right-5 text-white/40 hover:text-white cursor-pointer"
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

      {/* TICKET DETAILS MODAL (INCIDENT COMMAND CENTER) */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex justify-center items-start bg-black/85 backdrop-blur-sm p-4 overflow-y-auto pt-10 pb-10 animate-fade-in">
          <div className="bg-slate-900 border border-white/20 max-w-4xl w-full rounded-3xl p-6 shadow-2xl relative mx-auto my-auto space-y-6 font-sans text-white">
            
            {/* Header control toolbar */}
            <div className="flex justify-between items-start border-b border-white/5 pb-4">
              <div>
                <span className="text-[#F15A24] font-black text-[10px] uppercase tracking-widest block">Incident Command Center</span>
                <h3 className="text-xl font-black mt-1 text-white flex items-center gap-2">
                  {activeTicket.id}
                  <span className="text-xs text-white/50">({activeTicket.animalType === "Other" ? activeTicket.customAnimalType : getAnimalTypeTranslation(activeTicket.animalType)})</span>
                </h3>
                <span className="text-[10px] text-white/40 block mt-0.5">Reported On: {new Date(activeTicket.createdAt).toLocaleString()} | Reporter: {activeTicket.createdBy}</span>
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
                  onClick={() => { setActiveTicket(null); setTicketHistory([]); }}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all cursor-pointer border border-white/5"
                  title="Close Details Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Saffron Unit Re-allocation panel inside the details modal */}
            {activeTicket.status !== "Closed" && (
              <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-orange-400">Emergency Dispatch controls</span>
                  <span className="block text-[10px] text-white/50 mt-0.5">Allocate or re-route Saffron Veterinary Ambulance Unit in real-time.</span>
                </div>
                <form onSubmit={handleAssignTeamSubmit} className="flex gap-2 w-full sm:w-auto">
                  <select
                    required
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-orange-500 w-full sm:w-56"
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
                  <button
                    type="submit"
                    disabled={!selectedTeamId}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 disabled:from-blue-600/50 text-white text-xs font-black rounded-xl cursor-pointer flex-shrink-0"
                  >
                    {activeTicket.assignedRescueTeamId ? "Re-Route" : "Dispatch"}
                  </button>
                </form>
              </div>
            )}

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
                      alt="Incident proof"
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

            {/* Description quote card */}
            <div className="space-y-1">
              <span className="block text-[10px] uppercase font-bold text-white/40">{t("user.description")}</span>
              <p className="bg-white/[0.01] border border-white/5 p-4 rounded-xl text-xs text-white/80 leading-relaxed font-semibold italic">
                "{activeTicket.description}"
              </p>
            </div>

            {/* Location and address detail */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div className="space-y-3">
                <span className="block text-[10px] uppercase font-bold text-white/40">{t("user.currentLocation")}</span>
                <MapSelector onLocationSelect={() => {}} initialLat={activeTicket.latitude} initialLng={activeTicket.longitude} readonly={true} />
              </div>

              <div className="space-y-4">
                {/* Assignment detail block */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2 text-xs">
                  <span className="text-[10px] uppercase font-bold text-orange-400">{t("user.assignedTeam")}</span>
                  {activeTicket.assignedRescueTeamName ? (
                    <div>
                      <div className="font-black text-white text-sm">{activeTicket.assignedRescueTeamName}</div>
                      <div className="text-[10px] text-white/50 mt-1">Assigned On: {activeTicket.acceptedAt ? new Date(activeTicket.acceptedAt).toLocaleString() : "Pending"}</div>
                    </div>
                  ) : (
                    <div className="font-semibold italic text-white/40">{t("user.notAssigned")}</div>
                  )}
                </div>

                {/* Dynamic Timeline audit logs */}
                <div className="space-y-3 text-xs">
                  <span className="text-[10px] uppercase font-bold text-white/40 block">Audit timeline logs</span>
                  {isLoadingHistory ? (
                    <div className="text-center py-4 text-white/40 text-[10px]">Loading audit trail...</div>
                  ) : (
                    <div className="relative border-l border-white/10 pl-4 ml-2 space-y-4 max-h-40 overflow-y-auto">
                      {ticketHistory.map((hist) => (
                        <div key={hist.id} className="relative">
                          <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-orange-500 border border-slate-900" />
                          <div className="font-black text-white/90 text-[11px]">{getStatusTranslation(hist.status)}</div>
                          <p className="text-white/60 text-[10px] leading-relaxed mt-0.5">{hist.remarks}</p>
                          <span className="text-[9px] text-white/40 block mt-0.5">
                            {new Date(hist.createdAt).toLocaleString()} | By: {hist.updatedBy}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Closure proof panel */}
            {activeTicket.status === "Closed" && (
              <div className="bg-emerald-500/5 border border-emerald-500/25 p-4 rounded-2xl space-y-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>{t("user.closeReason")}: {activeTicket.closureReason}</span>
                </div>
                {activeTicket.closureDescription && (
                  <p className="text-white/70 italic">"{activeTicket.closureDescription}"</p>
                )}
                {activeTicket.closurePhotoUrl && (
                  <div className="w-full max-w-sm rounded-xl overflow-hidden border border-white/5 group relative cursor-zoom-in"
                       onClick={() => setActiveLightbox({ url: activeTicket.closurePhotoUrl || "", type: "image" })}>
                    <img
                      src={activeTicket.closurePhotoUrl}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500"
                      alt="Closure proof photo"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-2.5 py-1 bg-slate-900/90 text-[9px] font-black uppercase text-orange-400 border border-orange-500/20 rounded-lg">Zoom Proof</span>
                    </div>
                  </div>
                )}
              </div>
            )}
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
