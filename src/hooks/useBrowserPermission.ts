import { useState, useEffect, useCallback } from "react";

export type PermissionStatus = "granted" | "prompt" | "denied" | "unknown";

export interface BrowserPermissions {
  location: PermissionStatus;
  camera: PermissionStatus;
}

export function useBrowserPermission() {
  const [permissions, setPermissions] = useState<BrowserPermissions>({
    location: "unknown",
    camera: "unknown",
  });

  const checkLocation = useCallback(async (): Promise<PermissionStatus> => {
    if (typeof window === "undefined" || !navigator.permissions) {
      return "unknown";
    }
    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      return result.state as PermissionStatus;
    } catch (e) {
      return "unknown";
    }
  }, []);

  const checkCamera = useCallback(async (): Promise<PermissionStatus> => {
    if (typeof window === "undefined") {
      return "unknown";
    }
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: "camera" as any });
        return result.state as PermissionStatus;
      } catch (e) {
        // Fallback for Safari/Firefox
      }
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      if (videoDevices.length === 0) {
        return "denied";
      }
      const hasLabels = videoDevices.some((device) => device.label !== "");
      if (hasLabels) {
        return "granted";
      }
      return "prompt";
    } catch (err) {
      return "unknown";
    }
  }, []);

  const checkAll = useCallback(async () => {
    const loc = await checkLocation();
    const cam = await checkCamera();
    setPermissions({
      location: loc,
      camera: cam,
    });
    return { location: loc, camera: cam };
  }, [checkLocation, checkCamera]);

  useEffect(() => {
    checkAll();

    let locListener: (() => void) | null = null;
    let camListener: (() => void) | null = null;

    const setupListeners = async () => {
      if (typeof window === "undefined" || !navigator.permissions) return;
      try {
        const locResult = await navigator.permissions.query({ name: "geolocation" });
        locListener = () => {
          setPermissions((prev) => ({ ...prev, location: locResult.state as PermissionStatus }));
        };
        locResult.addEventListener("change", locListener);
      } catch (e) {}

      try {
        const camResult = await navigator.permissions.query({ name: "camera" as any });
        camListener = () => {
          setPermissions((prev) => ({ ...prev, camera: camResult.state as PermissionStatus }));
        };
        camResult.addEventListener("change", camListener);
      } catch (e) {}
    };

    setupListeners();

    return () => {
      if (locListener && typeof window !== "undefined" && navigator.permissions) {
        navigator.permissions
          .query({ name: "geolocation" })
          .then((r) => {
            r.removeEventListener("change", locListener!);
          })
          .catch(() => {});
      }
      if (camListener && typeof window !== "undefined" && navigator.permissions) {
        navigator.permissions
          .query({ name: "camera" as any })
          .then((r) => {
            r.removeEventListener("change", camListener!);
          })
          .catch(() => {});
      }
    };
  }, [checkAll]);

  const requestLocation = useCallback(async (): Promise<PermissionStatus> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !navigator.geolocation) {
        setPermissions((prev) => ({ ...prev, location: "denied" }));
        resolve("denied");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        () => {
          setPermissions((prev) => ({ ...prev, location: "granted" }));
          resolve("granted");
        },
        (error) => {
          const status = error.code === error.PERMISSION_DENIED ? "denied" : "unknown";
          setPermissions((prev) => ({ ...prev, location: status }));
          resolve(status);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  }, []);

  const requestCamera = useCallback(async (): Promise<PermissionStatus> => {
    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setPermissions((prev) => ({ ...prev, camera: "denied" }));
      return "denied";
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermissions((prev) => ({ ...prev, camera: "granted" }));
      return "granted";
    } catch (error: any) {
      console.warn("Camera request error:", error);
      const isDenied = error.name === "NotAllowedError" || error.name === "PermissionDeniedError";
      const status = isDenied ? "denied" : "unknown";
      setPermissions((prev) => ({ ...prev, camera: status }));
      return status;
    }
  }, []);

  return {
    permissions,
    checkAll,
    requestLocation,
    requestCamera,
    checkLocation,
    checkCamera,
  };
}
