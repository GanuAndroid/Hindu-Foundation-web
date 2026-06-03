"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { AlertTriangle, MapPin, Camera, RefreshCw, X, Lock, HelpCircle } from "lucide-react";
import { useBrowserPermission } from "@/hooks/useBrowserPermission";

interface PermissionDeniedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: "location" | "camera";
  onPermissionGranted?: () => void;
}

export default function PermissionDeniedDialog({
  isOpen,
  onClose,
  type,
  onPermissionGranted,
}: PermissionDeniedDialogProps) {
  const { t } = useLanguage();
  const { checkLocation, checkCamera } = useBrowserPermission();
  const [detectedBrowser, setDetectedBrowser] = useState<"chrome-desktop" | "chrome-android" | "safari-ios" | "generic">("generic");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent;
    const isAndroid = /Android/i.test(ua);
    const isIos = /iPhone|iPad|iPod/i.test(ua);
    const isChrome = /Chrome|CriOS/i.test(ua);
    const isSafari = /Safari/i.test(ua) && !isChrome;

    if (isAndroid && isChrome) {
      setDetectedBrowser("chrome-android");
    } else if (isIos && isSafari) {
      setDetectedBrowser("safari-ios");
    } else if (!isAndroid && !isIos && isChrome) {
      setDetectedBrowser("chrome-desktop");
    } else {
      setDetectedBrowser("generic");
    }
  }, []);

  // Show a self-dismissing toast inside the modal
  const showToast = (message: string, toastType: "success" | "error") => {
    setToast({ message, type: toastType });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    let isGranted = false;

    if (type === "location") {
      // Prompt GPS or check permission query state
      if (navigator.geolocation) {
        // Try requesting location directly to see if user has allowed it
        isGranted = await new Promise<boolean>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false),
            { enableHighAccuracy: true, timeout: 3000, maximumAge: 0 }
          );
        });
      }
    } else {
      // Try accessing camera stream to check if user has allowed it
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach((track) => track.stop());
          isGranted = true;
        } catch (e) {
          isGranted = false;
        }
      }
    }

    setIsVerifying(false);

    if (isGranted) {
      showToast(t("permissions.successToast"), "success");
      setTimeout(() => {
        onClose();
        if (onPermissionGranted) {
          onPermissionGranted();
        }
      }, 1000);
    } else {
      showToast(t("permissions.errorToast"), "error");
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (!isOpen) return null;

  // Retrieve steps based on detected browser
  let steps: string[] = [];
  if (detectedBrowser === "chrome-android") {
    steps = [
      t("permissions.stepChromeAndroid1"),
      t("permissions.stepChromeAndroid2"),
      t("permissions.stepChromeAndroid3"),
      t("permissions.stepChromeAndroid4"),
      t("permissions.stepChromeAndroid5"),
      t("permissions.stepChromeAndroid6"),
    ];
  } else if (detectedBrowser === "chrome-desktop") {
    steps = [
      t("permissions.stepChromeDesktop1"),
      t("permissions.stepChromeDesktop2"),
      t("permissions.stepChromeDesktop3"),
      t("permissions.stepChromeDesktop4"),
    ];
  } else if (detectedBrowser === "safari-ios") {
    steps = [
      t("permissions.stepSafariiOS1"),
      t("permissions.stepSafariiOS2"),
      t("permissions.stepSafariiOS3"),
      t("permissions.stepSafariiOS4"),
    ];
  } else {
    steps = [
      t("permissions.stepGeneric1"),
      t("permissions.stepGeneric2"),
      t("permissions.stepGeneric3"),
    ];
  }

  // Filter out any empty steps (fallback check)
  steps = steps.filter((step) => step && step.trim() !== "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Section */}
        <div className="flex flex-col items-center text-center mt-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 mb-4 border border-orange-500/20">
            {type === "location" ? (
              <MapPin className="h-6 w-6 animate-pulse" />
            ) : (
              <Camera className="h-6 w-6 animate-pulse" />
            )}
          </div>
          <h3 className="text-xl font-semibold text-white">
            {type === "location"
              ? t("permissions.locationTitle")
              : t("permissions.cameraTitle")}
          </h3>
          <p className="mt-2 text-sm text-neutral-400 max-w-sm">
            {type === "location"
              ? t("permissions.locationMessage")
              : t("permissions.cameraMessage")}
          </p>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="mt-6 rounded-xl border border-neutral-900 bg-neutral-900/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="h-4 w-4 text-orange-500" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-orange-500">
              {t("permissions.instructionsTitle")}
            </h4>
          </div>
          <ul className="space-y-3">
            {steps.map((step, idx) => (
              <li key={idx} className="flex items-start text-sm text-neutral-300">
                <span className="flex-shrink-0 mt-0.5 leading-relaxed font-medium">
                  {step}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Buttons / Actions */}
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-500 active:bg-orange-700 disabled:opacity-50 transition-colors shadow-lg shadow-orange-950/20"
          >
            {isVerifying && <RefreshCw className="h-4 w-4 animate-spin" />}
            {t("permissions.btnEnabled")}
          </button>
          
          <button
            onClick={handleRefresh}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/30 px-4 py-3 text-sm font-semibold text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            {t("permissions.btnRefresh")}
          </button>
        </div>

        {/* Inline Toast Indicator */}
        {toast && (
          <div
            className={`absolute bottom-4 left-4 right-4 flex items-center gap-2 rounded-lg p-3 text-xs font-semibold shadow-lg border transition-all animate-in fade-in slide-in-from-bottom-2 ${
              toast.type === "success"
                ? "bg-green-950/90 text-green-400 border-green-800"
                : "bg-red-950/90 text-red-400 border-red-800"
            }`}
          >
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
