"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import MapSelector from "@/components/MapSelector";
import { useBrowserPermission } from "@/hooks/useBrowserPermission";
import PermissionDeniedDialog from "@/components/PermissionDeniedDialog";
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
  MapPin,
  Info
} from "lucide-react";
import { Ticket } from "@/lib/types";

export default function UserDashboard() {
  const { user, loading } = useAuth();
  const { t, language } = useLanguage();
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

  // Browser permissions management
  const { permissions, checkAll } = useBrowserPermission();
  const [permissionDialog, setPermissionDialog] = useState<{
    isOpen: boolean;
    type: "location" | "camera";
  }>({
    isOpen: false,
    type: "location",
  });

  // Premium media lightbox states
  const [activeLightbox, setActiveLightbox] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  
  // Media uploads helper
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [videoPreview, setVideoPreview] = useState<string>("");
  
  const [photoUploading, setPhotoUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);

  const [formData, setFormData] = useState({
    eventId: "",
    animalType: "Cow",
    customAnimalType: "",
    description: "",
    imageUrl: "",
    videoUrl: "",
    latitude: 28.6139,
    longitude: 77.2090,
    address: "New Delhi, Delhi",
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

  // Upload Photo
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 5MB max
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_IMAGE_SIZE) {
      setFormError(
        language === "hi"
          ? "फ़ोटो का आकार 5MB से अधिक नहीं होना चाहिए।"
          : "Photo file size must not exceed 5MB."
      );
      e.target.value = "";
      return;
    }

    setFormError(null);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    
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

  // Upload Video
  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 25MB max
    const MAX_VIDEO_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_VIDEO_SIZE) {
      setFormError(
        language === "hi"
          ? "वीडियो का आकार 25MB से अधिक नहीं होना चाहिए।"
          : "Video file size must not exceed 25MB."
      );
      e.target.value = "";
      return;
    }

    setFormError(null);
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));

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

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview("");
    setFormData(prev => ({ ...prev, imageUrl: "" }));
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setVideoPreview("");
    setFormData(prev => ({ ...prev, videoUrl: "" }));
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
    if (!formData.eventId.trim()) {
      setFormError(t("user.emptyEventIdError"));
      return;
    }

    // Query current permission states on submit
    const currentPerms = await checkAll();

    // 1. Enforce location permission check
    if (currentPerms.location === "denied") {
      setPermissionDialog({ isOpen: true, type: "location" });
      return;
    }

    // 2. Enforce photo proof check
    if (!formData.imageUrl) {
      if (currentPerms.camera === "denied") {
        setPermissionDialog({ isOpen: true, type: "camera" });
      } else {
        setFormError(
          language === "hi"
            ? "कृपया कम से कम एक फ़ोटो प्रमाण अपलोड करें।"
            : "Please upload at least one photo proof."
        );
      }
      return;
    }

    // 3. Enforce video proof check
    if (!formData.videoUrl) {
      setFormError(
        language === "hi"
          ? "कृपया कम से कम एक वीडियो प्रमाण अपलोड करें।"
          : "Please upload a video proof."
      );
      return;
    }
    if (!formData.description || formData.description === "") {
      setFormError(
        language === "hi"
          ? "कृपया चोट का प्रकार (Accidental या Illness) चुनें।"
          : "Please select an injury type (Accidental or Illness)."
      );
      return;
    }

    if (formData.animalType === "Other" && !formData.customAnimalType) {
      setFormError(
        language === "hi"
          ? "कृपया पशु का प्रकार निर्दिष्ट करें।"
          : "Please specify the custom animal type."
      );
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
          creatorMobile: user?.mobile || "",
        }),
      });

      if (res.ok) {
        const createdTicket = await res.json();
        setShowCreateModal(false);
        setFormData({
          eventId: "",
          animalType: "Cow",
          customAnimalType: "",
          description: "",
          imageUrl: "",
          videoUrl: "",
          latitude: 28.6139,
          longitude: 77.2090,
          address: "New Delhi, Delhi",
        });
        setPhotoFile(null);
        setVideoFile(null);
        setPhotoPreview("");
        setVideoPreview("");
        
        // Auto-select the newly created ticket to display details, photo, video, and map instantly
        setActiveTicket(createdTicket);
        setTicketHistory([
          {
            id: `H-temp-${Date.now()}`,
            ticketId: createdTicket.id,
            status: "Pending",
            remarks: `Emergency Rescue case reported for ${getAnimalTypeTranslation(createdTicket.animalType)}. Event ID: 112.`,
            updatedBy: createdTicket.createdBy,
            createdAt: createdTicket.createdAt,
          }
        ]);
        
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
          <span className="text-[#F15A24] font-black text-xs uppercase tracking-widest block">{t("user.dashboardTitle")}</span>
          <h1 className="text-3xl font-black mt-1">{language === "hi" ? "नमस्ते" : "Welcome"}, {user.name}</h1>
          <p className="text-xs text-white/50">Report stray animal emergencies and monitor operational updates.</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#F15A24] to-[#FF8C00] text-white font-extrabold rounded-2xl shadow-lg shadow-orange-500/10 hover:scale-105 transition-transform cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          {t("user.createTicket")} (Case ID 112)
        </button>
      </div>

      {/* DASHBOARD STATISTICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Cases Created", val: total, color: "border-white/10 text-white/80" },
          { label: t("user.pending"), val: pending, color: "border-amber-500/20 text-amber-400" },
          { label: t("user.accepted"), val: accepted, color: "border-blue-500/20 text-blue-400" },
          { label: t("user.closed"), val: closed, color: "border-emerald-500/20 text-emerald-400" },
        ].map((item, idx) => (
          <div key={idx} className={`bg-white/[0.01] border p-5 rounded-2xl space-y-1 ${item.color}`}>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">{item.label}</span>
            <div className="text-3xl font-black">{item.val}</div>
          </div>
        ))}
      </div>

      {/* TICKET LIST AND TRACKING DETAIL PANELS */}
      <div className="space-y-4">
        
        {/* Ticket List (Full Width) */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-lg flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-orange-400" />
            {t("user.caseHistory")}
          </h3>

          {isLoadingTickets ? (
            <div className="py-20 text-center text-white/40 text-xs">Loading rescue tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-12 text-center space-y-4">
              <Compass className="w-12 h-12 text-orange-500/30 mx-auto" />
              <p className="text-white/50 text-sm font-semibold">No cases reported yet.</p>
              <p className="text-white/40 text-xs max-w-sm mx-auto">{t("user.emptyTickets")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((tItem) => (
                <div
                  key={tItem.id}
                  onClick={() => handleViewTicket(tItem)}
                  className={`bg-white/[0.01] border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors relative overflow-hidden ${
                    activeTicket?.id === tItem.id ? "border-orange-500/30 bg-orange-500/[0.02]" : ""
                  }`}
                >
                  <div className="flex gap-4">
                    <img
                      src={tItem.imageUrl}
                      alt={tItem.animalType}
                      className="w-16 h-16 rounded-xl object-cover border border-white/10"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-sm">{tItem.id}</span>
                        <span className="text-xs text-white/50">({getAnimalTypeTranslation(tItem.animalType)})</span>
                      </div>
                      <p className="text-xs text-white/60 line-clamp-1 mt-1 max-w-xs">{tItem.description}</p>
                      <span className="text-[10px] text-white/40 block mt-1.5">
                        Created: {new Date(tItem.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                        tItem.status === "Closed"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : tItem.status === "Accepted"
                          ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      }`}
                    >
                      {getStatusTranslation(tItem.status)}
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
      </div>

      {/* CREATE RESCUE TICKET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-4 pt-12 pb-12 flex justify-center items-start md:p-8 animate-fade-in">
          <div className="bg-slate-900 border border-white/20 max-w-2xl w-full rounded-3xl p-6 shadow-2xl relative mx-auto my-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 text-white/40 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-black mb-6 text-white flex items-center gap-2 border-b border-white/5 pb-4">
              <Plus className="w-6 h-6 text-orange-400" />
              {t("user.createTicket")} (Case ID 112)
            </h3>

            {formError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateTicketSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <label className="block text-xs font-bold text-white/60 uppercase leading-none">
                      {t("user.eventIdLabel")}
                    </label>
                    <div className="group relative cursor-help">
                      <Info className="w-3.5 h-3.5 text-orange-400 hover:text-orange-300 transition-colors" />
                      
                      {/* Premium Floating Tooltip Box */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-slate-900 border border-white/10 p-3 rounded-xl shadow-2xl text-[10px] text-white/80 font-semibold normal-case leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300 z-50">
                        <div className="text-orange-400 font-extrabold mb-1 uppercase tracking-wider text-[9px]">
                          {language === "hi" ? "केस आईडी निर्देश" : "Case ID Instructions"}
                        </div>
                        {language === "hi" 
                          ? "बचाव टिकट दर्ज करने के लिए पुलिस (112) द्वारा प्रदान की गई केस आईडी दर्ज करना आवश्यक है। पहले पुलिस को कॉल करें!" 
                          : "Call 112 first. The police will provide you with a case reference ID, which must be entered here to register a rescue ticket."}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-[5px] border-transparent border-t-slate-900"></div>
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder={t("user.eventIdPlaceholder")}
                    value={formData.eventId}
                    onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">{t("user.animalType")}</label>
                  <select
                    value={formData.animalType}
                    onChange={(e) => setFormData({ ...formData, animalType: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    {["Cow", "Dog", "Monkey", "Cat", "Bird", "Snake", "Other"].map((tItem) => (
                      <option key={tItem} value={tItem}>
                        {getAnimalTypeTranslation(tItem)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.animalType === "Other" && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">{t("user.customAnimalType")}</label>
                  <input
                    type="text"
                    required
                    placeholder={t("user.placeholderCustomAnimal")}
                    value={formData.customAnimalType}
                    onChange={(e) => setFormData({ ...formData, customAnimalType: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                  />
                </div>
              )}

              {/* Photo & Video Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-white/10 hover:border-orange-500/30 rounded-2xl p-4 text-center space-y-3 transition-colors relative">
                  <span className="block text-xs font-bold text-white/60 uppercase">{t("user.uploadPhoto")}</span>
                  <div className="flex items-center justify-center gap-3">
                    <FileImage className="w-8 h-8 text-orange-400" />
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handlePhotoChange}
                      className="text-xs text-white/40 w-full"
                    />
                  </div>
                  {photoUploading && <div className="text-[10px] text-orange-400 font-bold">Uploading file...</div>}
                  {photoPreview && (
                    <div className="space-y-2">
                      <img
                        src={photoPreview}
                        className="mx-auto w-full h-24 object-cover rounded-xl mt-2 border border-white/5"
                        alt="Preview"
                      />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg text-[10px] uppercase transition-colors"
                      >
                        Remove Photo
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-2 border-dashed border-white/10 hover:border-orange-500/30 rounded-2xl p-4 text-center space-y-3 transition-colors relative">
                  <span className="block text-xs font-bold text-white/60 uppercase">{t("user.uploadVideo")}</span>
                  <div className="flex items-center justify-center gap-3">
                    <Video className="w-8 h-8 text-orange-400" />
                    <input
                      type="file"
                      accept="video/mp4, video/mov"
                      onChange={handleVideoChange}
                      className="text-xs text-white/40 w-full"
                    />
                  </div>
                  {videoUploading && <div className="text-[10px] text-orange-400 font-bold">Uploading video...</div>}
                  {videoPreview && (
                    <div className="space-y-2">
                      <video
                        src={videoPreview}
                        controls
                        className="mx-auto w-full h-24 object-cover rounded-xl mt-2 border border-white/5 bg-black"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveVideo}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg text-[10px] uppercase transition-colors"
                      >
                        Remove Video
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Simulated Google Maps Pin Coordinates Selector */}
              <MapSelector
                onLocationSelect={handleLocationSelect}
                onPermissionDenied={(type) => {
                  setPermissionDialog({ isOpen: true, type });
                }}
              />

              {/* Case Description */}
              <div>
                <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">{t("user.description")}</label>
                <select
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
                >
                  <option value="">{language === "hi" ? "-- चुनें (Select) --" : "-- Select --"}</option>
                  <option value="Accidental">{language === "hi" ? "दुर्घटना (Accidental)" : "Accidental"}</option>
                  <option value="Illness">{language === "hi" ? "बीमारी (Illness)" : "Illness"}</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmittingTicket || photoUploading || videoUploading}
                className="w-full py-4 bg-gradient-to-r from-[#F15A24] to-[#FF8C00] disabled:bg-orange-500/50 text-white font-black rounded-xl shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmittingTicket ? t("home.submitting") : t("user.submitTicket")}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* TICKET DETAILS DIALOG MODAL */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex justify-center items-start bg-black/85 backdrop-blur-sm p-4 overflow-y-auto pt-10 pb-10 animate-fade-in">
          <div className="bg-slate-900 border border-white/20 max-w-4xl w-full rounded-3xl p-6 shadow-2xl relative mx-auto my-auto space-y-6 font-sans text-white">
            
            {/* Header control toolbar */}
            <div className="flex justify-between items-start border-b border-white/5 pb-4">
              <div>
                <span className="text-[#F15A24] font-black text-[10px] uppercase tracking-widest block">Incident Rescue Details</span>
                <h3 className="text-xl font-black mt-1 text-white flex items-center gap-2">
                  {activeTicket.id}
                  <span className="text-xs text-white/50">({getAnimalTypeTranslation(activeTicket.animalType)})</span>
                </h3>
                <span className="text-[10px] text-white/40 block mt-0.5">Reported On: {new Date(activeTicket.createdAt).toLocaleString()}</span>
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
                      {ticketHistory.map((h) => (
                        <div key={h.id} className="relative">
                          <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-orange-500 border border-slate-900" />
                          <div className="font-black text-white/90 text-[11px]">{getStatusTranslation(h.status)}</div>
                          <p className="text-white/60 text-[10px] leading-relaxed mt-0.5">{h.remarks}</p>
                          <span className="text-[9px] text-white/40 block mt-0.5">
                            {new Date(h.createdAt).toLocaleString()} | By: {h.updatedBy}
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

      <PermissionDeniedDialog
        isOpen={permissionDialog.isOpen}
        type={permissionDialog.type}
        onClose={() => setPermissionDialog(prev => ({ ...prev, isOpen: false }))}
        onPermissionGranted={() => {
          checkAll();
        }}
      />
    </div>
  );
}
