"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import MapSelector from "@/components/MapSelector";
import {
  Plus,
  AlertCircle,
  Clock,
  Compass,
  CheckCircle,
  FileImage,
  Video,
  ListFilter,
  Eye,
  X,
  FileText,
  MapPin,
  MapPinIcon
} from "lucide-react";
import { Ticket } from "@/lib/types";

export default function UserDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Tickets state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [ticketHistory, setTicketHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Media uploads helper
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [videoPreview, setVideoPreview] = useState<string>("");
  
  const [photoUploading, setPhotoUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);

  const [formData, setFormData] = useState({
    eventId: "112",
    animalType: "Cow",
    customAnimalType: "",
    description: "",
    imageUrl: "",
    videoUrl: "",
    latitude: 25.3176,
    longitude: 82.9739,
    address: "Varanasi, Uttar Pradesh",
  });

  // Redirect if not user role
  useEffect(() => {
    if (!loading && (!user || user.role !== "user")) {
      router.push("/auth?role=user");
    }
  }, [user, loading, router]);

  // Load tickets on mount
  const loadTickets = async () => {
    if (!user) return;
    setIsLoadingTickets(true);
    try {
      // Find tickets reported by this user (we filter by creator name/mobile matching)
      const res = await fetch(`/api/tickets?createdBy=${encodeURIComponent(user.name)}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (e) {
      console.error("Failed to load user tickets", e);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadTickets();
    }
  }, [user]);

  // Handle detailed tracking view
  const handleViewTicket = async (ticket: Ticket) => {
    setActiveTicket(ticket);
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`);
      if (res.ok) {
        const data = await res.json();
        setTicketHistory(data.history || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Upload Photo to simulated S3
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    
    // Auto-upload trigger
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
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
      } else {
        alert("Photo upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading photo");
    } finally {
      setPhotoUploading(false);
    }
  };

  // Upload Video to simulated S3
  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));

    // Auto-upload trigger
    setVideoUploading(true);
    const uploadForm = new FormData();
    uploadForm.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadForm,
      });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, videoUrl: data.url }));
      } else {
        alert("Video upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading video");
    } finally {
      setVideoUploading(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address,
    }));
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Mandatories checks
    if (!formData.imageUrl) {
      setFormError("Animal image upload is required.");
      return;
    }
    if (!formData.videoUrl) {
      setFormError("Animal incident video is required.");
      return;
    }
    if (formData.description.trim().length < 20) {
      setFormError("Please provide a detailed description (minimum 20 characters).");
      return;
    }
    if (formData.animalType === "Other" && !formData.customAnimalType) {
      setFormError("Please clarify the species name since 'Other' was selected.");
      return;
    }

    setIsSubmittingTicket(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          createdBy: user?.name || "Citizen Reporter",
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        // Reset form data
        setFormData({
          eventId: "112",
          animalType: "Cow",
          customAnimalType: "",
          description: "",
          imageUrl: "",
          videoUrl: "",
          latitude: 25.3176,
          longitude: 82.9739,
          address: "Varanasi, Uttar Pradesh",
        });
        setPhotoFile(null);
        setVideoFile(null);
        setPhotoPreview("");
        setVideoPreview("");
        
        loadTickets();
      } else {
        const errData = await res.json();
        setFormError(errData.error || "Failed to create rescue ticket");
      }
    } catch (err) {
      console.error(err);
      setFormError("System error registering ticket");
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Stats calculation
  const total = tickets.length;
  const pending = tickets.filter((t) => t.status === "Pending").length;
  const accepted = tickets.filter((t) => t.status === "Accepted").length;
  const closed = tickets.filter((t) => t.status === "Closed").length;

  if (loading || !user) {
    return (
      <div className="flex-grow flex items-center justify-center bg-[#0B132B] min-h-screen text-white">
        <span className="font-extrabold text-sm tracking-wider text-orange-500 animate-pulse">
          INITIALIZING SECURE SESSION...
        </span>
      </div>
    );
  }

  return (
    <div className="flex-grow bg-[#0B132B] text-white p-6 max-w-7xl mx-auto w-full space-y-8 min-h-screen">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-[#F15A24] font-black text-xs uppercase tracking-widest block">Citizen Dashboard</span>
          <h1 className="text-3xl font-black mt-1">Namaste, {user.name}</h1>
          <p className="text-xs text-white/50">Report stray animal emergencies and monitor operational updates.</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-white font-extrabold rounded-2xl shadow-lg shadow-orange-500/10 hover:scale-105 transition-transform"
        >
          <Plus className="w-5 h-5" />
          Report Animal Case (112)
        </button>
      </div>

      {/* DASHBOARD STATISTICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Cases Created", val: total, color: "border-white/10 text-white/80" },
          { label: "Pending Response", val: pending, color: "border-amber-500/20 text-amber-400" },
          { label: "Accepted / Active", val: accepted, color: "border-blue-500/20 text-blue-400" },
          { label: "Closed / Resolved", val: closed, color: "border-emerald-500/20 text-emerald-400" },
        ].map((item, idx) => (
          <div key={idx} className={`bg-white/[0.01] border p-5 rounded-2xl space-y-1 ${item.color}`}>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">{item.label}</span>
            <div className="text-3xl font-black">{item.val}</div>
          </div>
        ))}
      </div>

      {/* TICKET LIST AND TRACKING DETAIL PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Ticket List (Left Side) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-extrabold text-lg flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-orange-400" />
            Your Rescue Reports
          </h3>

          {isLoadingTickets ? (
            <div className="py-20 text-center text-white/40 text-xs">Loading rescue tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-12 text-center space-y-4">
              <Compass className="w-12 h-12 text-orange-500/30 mx-auto" />
              <p className="text-white/50 text-sm font-semibold">No cases reported yet.</p>
              <p className="text-white/40 text-xs max-w-sm mx-auto">Help street animals around you! Report any injured or sick cow, dog, bird, or snake using the button above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleViewTicket(t)}
                  className={`bg-white/[0.01] border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors relative overflow-hidden ${
                    activeTicket?.id === t.id ? "border-orange-500/30 bg-orange-500/[0.02]" : ""
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Thumbnail preview */}
                    <img
                      src={t.imageUrl}
                      alt={t.animalType}
                      className="w-16 h-16 rounded-xl object-cover border border-white/10"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-sm">{t.id}</span>
                        <span className="text-xs text-white/50">({t.animalType})</span>
                      </div>
                      <p className="text-xs text-white/60 line-clamp-1 mt-1 max-w-xs">{t.description}</p>
                      <span className="text-[10px] text-white/40 block mt-1.5">
                        Created: {new Date(t.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                        t.status === "Closed"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : t.status === "Accepted"
                          ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      }`}
                    >
                      {t.status}
                    </span>
                    <button className="p-2 bg-white/5 rounded-lg text-white/60 hover:text-white transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Step Tracking Detail Pane (Right Side) */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-400" />
            Live Case Progress
          </h3>

          {activeTicket ? (
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-6 animate-fade-in">
              <div className="flex justify-between items-start border-b border-white/5 pb-4">
                <div>
                  <h4 className="font-extrabold text-sm text-white">{activeTicket.id}</h4>
                  <span className="text-[10px] text-white/40">Type: {activeTicket.animalType}</span>
                </div>
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

              {/* Photos & Videos Display */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[9px] uppercase font-bold text-white/40 mb-1">Uploaded Photo</span>
                  <img
                    src={activeTicket.imageUrl}
                    className="w-full h-24 object-cover rounded-xl border border-white/5"
                    alt="Animal"
                  />
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-white/40 mb-1">Incident Video</span>
                  <video
                    src={activeTicket.videoUrl}
                    controls
                    className="w-full h-24 object-cover rounded-xl border border-white/5 bg-black"
                  />
                </div>
              </div>

              {/* Assignment details */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] uppercase font-bold text-orange-400">Assigned Rescue Team</span>
                {activeTicket.assignedRescueTeamName ? (
                  <div>
                    <div className="font-black text-white text-xs">{activeTicket.assignedRescueTeamName}</div>
                    <div className="text-[10px] text-white/50 mt-0.5">Assigned time: {activeTicket.acceptedAt ? new Date(activeTicket.acceptedAt).toLocaleTimeString() : "Pending"}</div>
                  </div>
                ) : (
                  <div className="text-xs text-white/40 font-semibold italic">Waiting for team assignment...</div>
                )}
              </div>

              {/* Case History Audits timeline */}
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-bold text-white/40 block">Operational Audit Logs</span>
                {isLoadingHistory ? (
                  <div className="text-center text-[10px] text-white/40 py-4">Fetching logs...</div>
                ) : (
                  <div className="relative border-l border-white/5 pl-4 ml-2 space-y-4 text-xs">
                    {ticketHistory.map((h, i) => (
                      <div key={h.id} className="relative">
                        {/* Dot indicator */}
                        <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-orange-500 border border-slate-900" />
                        <div className="font-extrabold text-white/80">{h.status}</div>
                        <p className="text-white/60 mt-0.5 text-[11px] leading-relaxed">{h.remarks}</p>
                        <span className="text-[9px] text-white/40 block mt-1">
                          {new Date(h.createdAt).toLocaleString()} | By: {h.updatedBy}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Closure proof panel */}
              {activeTicket.status === "Closed" && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <CheckCircle className="w-4 h-4" />
                    Rescue Outcome: {activeTicket.closureReason}
                  </div>
                  {activeTicket.closureDescription && (
                    <p className="text-[11px] text-white/70 italic leading-relaxed">"{activeTicket.closureDescription}"</p>
                  )}
                  {activeTicket.closurePhotoUrl && (
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-white/40 mb-1">Final Proof Recovery Photo</span>
                      <img
                        src={activeTicket.closurePhotoUrl}
                        className="w-full h-32 object-cover rounded-xl border border-white/5"
                        alt="Closure proof"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="border border-white/5 bg-slate-900/40 p-12 text-center text-xs text-white/40 rounded-3xl">
              Select a ticket from the left to view detailed live progress tracking.
            </div>
          )}
        </div>
      </div>

      {/* CREATE RESCUE TICKET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-white/20 max-w-2xl w-full rounded-3xl p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 text-white/40 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-black mb-6 text-white flex items-center gap-2 border-b border-white/5 pb-4">
              <Plus className="w-6 h-6 text-orange-400" />
              Report New Animal Emergency (Event 112)
            </h3>

            {formError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateTicketSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Event ID default */}
                <div>
                  <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">Event ID</label>
                  <input
                    type="text"
                    disabled
                    value="112"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/50 font-mono"
                  />
                </div>

                {/* Animal Type dropdown */}
                <div>
                  <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">Animal Type</label>
                  <select
                    value={formData.animalType}
                    onChange={(e) => setFormData({ ...formData, animalType: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    {["Cow", "Dog", "Monkey", "Cat", "Bird", "Snake", "Other"].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.animalType === "Other" && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">Specify Animal Species</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Injured Deer, Squirrel"
                    value={formData.customAnimalType}
                    onChange={(e) => setFormData({ ...formData, customAnimalType: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                  />
                </div>
              )}

              {/* Photo & Video Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Photo upload */}
                <div className="border-2 border-dashed border-white/10 hover:border-orange-500/30 rounded-2xl p-4 text-center space-y-3 transition-colors relative">
                  <span className="block text-xs font-bold text-white/60 uppercase">Upload Animal Photo (Required)</span>
                  <div className="flex items-center justify-center gap-3">
                    <FileImage className="w-8 h-8 text-orange-400" />
                    <input
                      type="file"
                      required
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handlePhotoChange}
                      className="text-xs text-white/40 w-full"
                    />
                  </div>
                  {photoUploading && <div className="text-[10px] text-orange-400 font-bold">Uploading file locally...</div>}
                  {photoPreview && (
                    <img
                      src={photoPreview}
                      className="mx-auto w-full h-24 object-cover rounded-xl mt-2 border border-white/5"
                      alt="Preview"
                    />
                  )}
                </div>

                {/* Video upload */}
                <div className="border-2 border-dashed border-white/10 hover:border-orange-500/30 rounded-2xl p-4 text-center space-y-3 transition-colors relative">
                  <span className="block text-xs font-bold text-white/60 uppercase">Upload Animal Video (Required)</span>
                  <div className="flex items-center justify-center gap-3">
                    <Video className="w-8 h-8 text-orange-400" />
                    <input
                      type="file"
                      required
                      accept="video/mp4, video/mov"
                      onChange={handleVideoChange}
                      className="text-xs text-white/40 w-full"
                    />
                  </div>
                  {videoUploading && <div className="text-[10px] text-orange-400 font-bold">Uploading video file...</div>}
                  {videoPreview && (
                    <video
                      src={videoPreview}
                      controls
                      className="mx-auto w-full h-24 object-cover rounded-xl mt-2 border border-white/5 bg-black"
                    />
                  )}
                </div>
              </div>

              {/* Simulated Google Maps Pin Coordinates Selector */}
              <MapSelector onLocationSelect={handleLocationSelect} />

              {/* Case Description */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-white/60 uppercase">Incident Description</label>
                  <span className={`text-[10px] font-bold ${formData.description.length >= 20 ? "text-emerald-400" : "text-amber-400"}`}>
                    {formData.description.length} characters (Min 20)
                  </span>
                </div>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide precise details of the injury and any landmarks nearby to assist our medical ambulance team..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingTicket || photoUploading || videoUploading}
                className="w-full py-4 bg-gradient-to-r from-[#F15A24] to-[#FF8C00] disabled:bg-orange-500/50 text-white font-black rounded-xl shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmittingTicket ? "Registering Case..." : "Submit Incident Report (Dispatch Team)"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
