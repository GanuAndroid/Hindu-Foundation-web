"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "@/lib/types";
import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | null;
  }
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  sendOtp: (mobile: string, role: UserRole) => Promise<boolean>;
  verifyOtp: (otp: string, name?: string) => Promise<User | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tempAuth, setTempAuth] = useState<{ mobile: string; role: UserRole } | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    // Check local storage for active session on boot
    const stored = localStorage.getItem("hf_session");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("hf_session");
      }
    }
    setLoading(false);
  }, []);

  const sendOtp = async (mobile: string, role: UserRole): Promise<boolean> => {
    setError(null);
    try {
      const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

      if (isLocal) {
        console.log(`[MOCK AUTH] Local environment detected. Bypassing real Firebase SMS OTP for mobile: ${mobile}`);
        setTempAuth({ mobile, role });
        // Set confirmationResult to a mock object that resolves locally.
        setConfirmationResult({
          confirm: async (code: string) => {
            if (code.trim() !== "123456") {
              throw { code: "auth/invalid-verification-code", message: "Invalid verification code." };
            }
            return {
              user: {
                getIdToken: async () => `mock-token-${mobile}-${role}`
              }
            };
          }
        } as any);
        return true;
      }

      // 0. Ensure Firebase is initialized
      if (!auth) {
        throw new Error("Firebase Authentication is not configured. Please supply valid NEXT_PUBLIC_FIREBASE_* keys in your .env.local file to activate real OTP verification.");
      }

      // 1. Format the 10-digit Indian mobile number to E.164 format automatically
      let formattedMobile = mobile.trim();
      if (!formattedMobile.startsWith("+")) {
        // Strip out any accidental dashes or spaces
        formattedMobile = `+91${formattedMobile.replace(/[-\s]/g, "")}`;
      }

      // 2. Clear old verifier if it exists to avoid DOM mount duplicate errors in hot-reloads
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.warn("Error clearing previous recaptcha verifier:", e);
        }
        window.recaptchaVerifier = null;
      }

      // 3. Initialize fresh invisible Recaptcha Verifier
      const recaptchaContainer = document.getElementById("recaptcha-container");
      if (!recaptchaContainer) {
        throw new Error("reCAPTCHA validation container div is missing in the page DOM.");
      }

      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          // reCAPTCHA solved, proceeding to send OTP
        },
        "expired-callback": () => {
          // Handle expired token, resetting the verifier
          if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
          }
        }
      });

      // 4. Trigger Firebase sign-in-with-phone-number
      const result = await signInWithPhoneNumber(auth, formattedMobile, window.recaptchaVerifier);

      setConfirmationResult(result);
      setTempAuth({ mobile, role });
      console.log(`[FIREBASE] Verification SMS successfully sent to mobile: ${formattedMobile}`);
      return true;
    } catch (err: any) {
      console.error("Firebase sendOtp failed:", err);
      // Clean, readable error translations for common Firebase issues
      let errMsg = err.message || "Failed to request OTP.";
      if (err.code === "auth/invalid-phone-number") {
        errMsg = "The phone number entered is invalid. Please supply a valid 10-digit number.";
      } else if (err.code === "auth/too-many-requests") {
        errMsg = "Too many OTP requests have been sent to this number recently. Please wait and try again later.";
      }
      setError(errMsg);
      return false;
    }
  };

  const verifyOtp = async (otp: string, name?: string): Promise<User | null> => {
    setError(null);
    if (!tempAuth) {
      setError("Session invalid or expired. Please enter your mobile number and request a new OTP code.");
      return null;
    }

    try {
      let idToken = "";
      const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

      if (isLocal) {
        if (otp.trim() !== "123456") {
          throw { code: "auth/invalid-verification-code", message: "Invalid verification code. Please enter the standard local developer code '123456'." };
        }
        idToken = `mock-token-${tempAuth.mobile}-${tempAuth.role}`;
        console.log("[MOCK AUTH] OTP verified successfully via local bypass.");
      } else {
        if (!confirmationResult) {
          setError("Session invalid or expired. Please enter your mobile number and request a new OTP code.");
          return null;
        }
        // 1. Confirm OTP code using the Firebase confirmation token
        await confirmationResult.confirm(otp.trim());
        console.log("[FIREBASE] OTP verification confirmed on client-side!");

        // Retrieve the cryptographically signed Firebase ID Token for backend validation
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {
          throw new Error("No authenticated user session found in Firebase.");
        }
        idToken = await firebaseUser.getIdToken();
      }

      // 2. Once verified with Firebase, authenticate or register the session in our local PostgreSQL database
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: idToken,
          role: tempAuth.role,
          name: name || "",
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Database authentication gateway failed");
      }

      const authenticatedUser = await res.json();
      setUser(authenticatedUser);
      localStorage.setItem("hf_session", JSON.stringify(authenticatedUser));
      
      // Reset transition states on successful auth
      setTempAuth(null);
      setConfirmationResult(null);
      
      return authenticatedUser;
    } catch (err: any) {
      console.error("Firebase verifyOtp failed:", err);
      let errMsg = err.message || "OTP verification failed.";
      if (err.code === "auth/invalid-verification-code") {
        errMsg = "Invalid verification code. Please enter the correct 6-digit OTP sent to your phone.";
      } else if (err.code === "auth/code-expired") {
        errMsg = "This verification code has expired. Please request a new OTP.";
      }
      setError(errMsg);
      return null;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("hf_session");
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, sendOtp, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
