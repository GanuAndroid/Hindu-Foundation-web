"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Info, Search } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

declare global {
  interface Window {
    google?: any;
    gm_authFailure?: any;
  }
}

interface MapSelectorProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
  readonly?: boolean;
  onPermissionDenied?: (type: "location" | "camera") => void;
}

// Gorgeous dark-themed map custom styles matching the deep navy/orange application aesthetics
const darkMapStyles = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#0B132B"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8ECFFB"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#0B132B"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#1A364A"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#64748B"
      }
    ]
  },
  {
    "featureType": "landscape.natural",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#0F172A"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#1E293B"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#F15A24"
      },
      {
        "opacity": 0.6
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#052E16"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#4ADE80"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#1E293B"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#F15A24"
      },
      {
        "weight": 1
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#FF8C00"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#334155"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#172554"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#60A5FA"
      }
    ]
  }
];
export default function MapSelector({
  onLocationSelect,
  initialLat = 28.6139,
  initialLng = 77.2090,
  readonly = false,
  onPermissionDenied,
}: MapSelectorProps) {
  const { language } = useLanguage();
  const isHindi = language === "hi";

  // Bilingual translation text
  const tLoc = {
    title: isHindi ? "जीपीएस स्थान प्रेषक" : "GPS Location Dispatcher",
    detect: isHindi ? "जीपीएस ऑटो डिटेक्ट करें" : "Auto Detect GPS",
    detecting: isHindi ? "जीपीएस खोज रहे हैं..." : "Detecting GPS...",
    searchPlaceholder: isHindi ? "इलाका, सड़क या स्थल खोजें..." : "Search locality, street or landmark...",
    latitude: isHindi ? "अक्षांश (Latitude)" : "Latitude",
    longitude: isHindi ? "रेखांश (Longitude)" : "Longitude",
    address: isHindi ? "घटना स्थल का पता" : "Incident Locality Address",
    hint: isHindi ? "लोकेशन पिन को मैन्युअल रूप से समायोजित करने के लिए खींचें या क्लिक करें" : "Drag or click anywhere on map to adjust location pin manually",
    marker: isHindi ? "घटना स्थल" : "INCIDENT MARKER",
  };

  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [address, setAddress] = useState("Connaught Place, New Delhi, Delhi 110001");
  const [isDetecting, setIsDetecting] = useState(false);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const mapTargetRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const googleMapInstRef = useRef<any>(null);
  const googleMarkerInstRef = useRef<any>(null);

  // Addresses mock mapping based on grid quadrant (for offline/no-api-key backup fallback)
  const getMockAddress = (xRatio: number, yRatio: number) => {
    const sectors = ["Connaught Place", "Karol Bagh", "Dwarka sector 6", "Chanakyapuri", "Rohini sector 3", "Chandni Chowk district"];
    const landmarks = ["Metro Station Gate 1", "Outer Ring Road Crossing", "Red Fort Outer crossing", "District Park Side", "Civic Center Building"];
    
    const secIdx = Math.max(0, Math.min(sectors.length - 1, Math.floor(xRatio * sectors.length)));
    const lmkIdx = Math.max(0, Math.min(landmarks.length - 1, Math.floor(yRatio * landmarks.length)));
    
    return `${landmarks[lmkIdx]}, ${sectors[secIdx]}, New Delhi, Delhi - ${110000 + Math.floor(1 + xRatio * 99)}`;
  };

  // Google Maps Dynamic Script Injector
  useEffect(() => {
    // Catch Google Maps API Authentication failures (like restricted keys or blocked targets)
    // and gracefully revert to the mock map immediately.
    window.gm_authFailure = () => {
      console.warn("Google Maps authentication failed (e.g. key restriction block). Falling back to mock map.");
      setLoadError(true);
    };

    if (window.google && window.google.maps) {
      setIsGoogleMapsLoaded(true);
      return;
    }

    const existingScript = document.getElementById("google-maps-script");
    if (existingScript) {
      const handleLoad = () => setIsGoogleMapsLoaded(true);
      existingScript.addEventListener("load", handleLoad);
      return () => {
        existingScript.removeEventListener("load", handleLoad);
      };
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsGoogleMapsLoaded(true);
    script.onerror = () => setLoadError(true);
    document.head.appendChild(script);

    return () => {
      // Clean up global handler on unmount
      if (window.gm_authFailure) {
        delete (window as any).gm_authFailure;
      }
    };
  }, []);

  // Reverse Geocode coordinates to address
  const reverseGeocode = (latitude: number, longitude: number) => {
    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results: any, status: any) => {
        let addr = `New Delhi Incident Grid (${latitude}, ${longitude})`;
        if (status === "OK" && results && results[0]) {
          addr = results[0].formatted_address;
        }
        setAddress(addr);
        onLocationSelect(latitude, longitude, addr);
      });
    } else {
      const xRatio = Math.max(0, Math.min(1, (longitude - 77.10) / 0.20));
      const yRatio = Math.max(0, Math.min(1, 1 - (latitude - 28.50) / 0.20));
      const addr = getMockAddress(xRatio, yRatio);
      setAddress(addr);
      onLocationSelect(latitude, longitude, addr);
    }
  };

  // Map Initialization on Script Load Success
  useEffect(() => {
    if (!isGoogleMapsLoaded || !mapTargetRef.current) return;
    if (googleMapInstRef.current) return; // Prevent double rendering

    const mapOptions = {
      center: { lat, lng },
      zoom: 14,
      styles: darkMapStyles,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
    };

    const map = new window.google.maps.Map(mapTargetRef.current, mapOptions);
    googleMapInstRef.current = map;

    const marker = new window.google.maps.Marker({
      position: { lat, lng },
      map: map,
      draggable: !readonly,
      animation: window.google.maps.Animation.DROP,
    });
    googleMarkerInstRef.current = marker;

    if (!readonly) {
      map.addListener("click", (e: any) => {
        const newLat = parseFloat(e.latLng.lat().toFixed(6));
        const newLng = parseFloat(e.latLng.lng().toFixed(6));
        
        setLat(newLat);
        setLng(newLng);
        marker.setPosition({ lat: newLat, lng: newLng });
        reverseGeocode(newLat, newLng);
      });

      marker.addListener("dragend", (e: any) => {
        const newLat = parseFloat(e.latLng.lat().toFixed(6));
        const newLng = parseFloat(e.latLng.lng().toFixed(6));
        
        setLat(newLat);
        setLng(newLng);
        reverseGeocode(newLat, newLng);
      });

      // Bind Places Autocomplete to search input box
      if (searchInputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
          types: ["geocode", "establishment"],
          componentRestrictions: { country: "in" } // Focus search in India
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) return;

          const newLat = parseFloat(place.geometry.location.lat().toFixed(6));
          const newLng = parseFloat(place.geometry.location.lng().toFixed(6));
          const newAddr = place.formatted_address || place.name || "";

          setLat(newLat);
          setLng(newLng);
          map.setCenter({ lat: newLat, lng: newLng });
          map.setZoom(16);
          marker.setPosition({ lat: newLat, lng: newLng });
          
          setAddress(newAddr);
          onLocationSelect(newLat, newLng, newAddr);
        });
      }
    }

    return () => {
      googleMapInstRef.current = null;
      googleMarkerInstRef.current = null;
    };
  }, [isGoogleMapsLoaded]);

  // Sync external coordinates (if updated outside the component)
  useEffect(() => {
    const newPos = { lat: initialLat, lng: initialLng };
    setLat(initialLat);
    setLng(initialLng);

    if (googleMapInstRef.current && googleMarkerInstRef.current) {
      const currentCenter = googleMapInstRef.current.getCenter();
      if (
        Math.abs(currentCenter.lat() - initialLat) > 0.0001 ||
        Math.abs(currentCenter.lng() - initialLng) > 0.0001
      ) {
        googleMapInstRef.current.setCenter(newPos);
        googleMarkerInstRef.current.setPosition(newPos);
      }
    }

    // Auto-update geocoded address text matching the current coordinates
    reverseGeocode(initialLat, initialLng);
  }, [initialLat, initialLng, isGoogleMapsLoaded]);

  // Fallback Mock Map Vector Grid click coordinates mapping
  const handleMockMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readonly || isGoogleMapsLoaded) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xRatio = Math.max(0, Math.min(1, x / rect.width));
    const yRatio = Math.max(0, Math.min(1, y / rect.height));

    const calculatedLat = parseFloat((28.50 + (1 - yRatio) * 0.20).toFixed(6));
    const calculatedLng = parseFloat((77.10 + xRatio * 0.20).toFixed(6));
    
    setLat(calculatedLat);
    setLng(calculatedLng);
    reverseGeocode(calculatedLat, calculatedLng);
  };
  const detectLocation = () => {
    if (readonly) return;
    setIsDetecting(true);
    
    if (!navigator.geolocation) {
      alert(
        isHindi
          ? "आपके ब्राउज़र में जीपीएस डिटेक्शन उपलब्ध नहीं है। कृपया सुनिश्चित करें कि आप सुरक्षित (HTTPS) कनेक्शन का उपयोग कर रहे हैं या फोन सेटिंग्स में स्थान सक्षम है।"
          : "Geolocation is not supported by your browser or requires a secure HTTPS connection. Please check your phone settings to enable location."
      );
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const calculatedLat = parseFloat(position.coords.latitude.toFixed(6));
        const calculatedLng = parseFloat(position.coords.longitude.toFixed(6));
        
        setLat(calculatedLat);
        setLng(calculatedLng);
        
        if (googleMapInstRef.current && googleMarkerInstRef.current) {
          const newPos = { lat: calculatedLat, lng: calculatedLng };
          googleMapInstRef.current.setCenter(newPos);
          googleMapInstRef.current.setZoom(16);
          googleMarkerInstRef.current.setPosition(newPos);
        }
        
        reverseGeocode(calculatedLat, calculatedLng);
        setIsDetecting(false);
      },
      (error) => {
        console.warn("Geolocation failed:", error);
        
        let errorMsg = isHindi
          ? "जीपीएस सक्रिय करने में विफल। कृपया सेटिंग्स में लोकेशन अनुमति सक्षम करें।"
          : "Failed to detect location. Please check your GPS settings and browser permissions.";
        
        let isPermissionDenied = false;

        if (error.code === error.PERMISSION_DENIED) {
          isPermissionDenied = true;
          errorMsg = isHindi
            ? "लोकेशन अनुमति अस्वीकार कर दी गई है। कृपया ब्राउज़र/फ़ोन सेटिंग्स में स्थान अनुमति सक्षम करें।"
            : "Location permission denied. Please allow location access in your browser/device settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = isHindi
            ? "स्थान अनुपलब्ध है। कृपया सुनिश्चित करें कि आपके फ़ोन का जीपीएस (GPS) चालू है।"
            : "Location services are unavailable. Please make sure your phone's GPS is turned on.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = isHindi
            ? "लोकेशन अनुरोध का समय समाप्त (Timeout) हो गया। कृपया पुन: प्रयास करें।"
            : "Location request timed out. Please try again.";
        }
        
        alert(errorMsg);

        if (isPermissionDenied) {
          if (onPermissionDenied) {
            onPermissionDenied("location");
          }
          // Fallback to high quality mock GPS coordinates in New Delhi (Connaught Place)
          const calculatedLat = parseFloat((28.6139 + Math.random() * 0.01).toFixed(6));
          const calculatedLng = parseFloat((77.2090 + Math.random() * 0.01).toFixed(6));
          
          setLat(calculatedLat);
          setLng(calculatedLng);
          
          if (googleMapInstRef.current && googleMarkerInstRef.current) {
            const newPos = { lat: calculatedLat, lng: calculatedLng };
            googleMapInstRef.current.setCenter(newPos);
            googleMapInstRef.current.setZoom(15);
            googleMarkerInstRef.current.setPosition(newPos);
          }
          
          reverseGeocode(calculatedLat, calculatedLng);
          setIsDetecting(false);
          return;
        }

        // Fallback to high quality mock GPS coordinates in New Delhi (Connaught Place)
        const calculatedLat = parseFloat((28.6139 + Math.random() * 0.01).toFixed(6));
        const calculatedLng = parseFloat((77.2090 + Math.random() * 0.01).toFixed(6));
        
        setLat(calculatedLat);
        setLng(calculatedLng);
        
        if (googleMapInstRef.current && googleMarkerInstRef.current) {
          const newPos = { lat: calculatedLat, lng: calculatedLng };
          googleMapInstRef.current.setCenter(newPos);
          googleMapInstRef.current.setZoom(15);
          googleMarkerInstRef.current.setPosition(newPos);
        }
        
        reverseGeocode(calculatedLat, calculatedLng);
        setIsDetecting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="flex flex-col gap-3 w-full bg-white dark:bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2 text-[#0B132B] dark:text-white">
          <MapPin className="w-5 h-5 text-orange-500" />
          <h4 className="font-bold text-sm">{tLoc.title}</h4>
        </div>
        
        {!readonly && (
          <button
            type="button"
            onClick={detectLocation}
            disabled={isDetecting}
            className="flex items-center gap-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Navigation className={`w-3.5 h-3.5 ${isDetecting ? "animate-spin" : ""}`} />
            {isDetecting ? tLoc.detecting : tLoc.detect}
          </button>
        )}
      </div>

      {/* Main Interactive Map Area Container */}
      <div className="relative h-64 w-full rounded-xl overflow-hidden border border-white/5 bg-slate-950 select-none">
        
        {/* Real Dynamic Google Map Interface */}
        {isGoogleMapsLoaded && !loadError ? (
          <div className="w-full h-full relative">
            {/* Embedded Floating Places Search Autocomplete Input */}
            {!readonly && (
              <div className="absolute top-3 left-3 z-10 w-72 max-w-[80vw] shadow-2xl flex items-center">
                <div className="relative w-full">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={tLoc.searchPlaceholder}
                    className="w-full bg-slate-900/95 border border-white/15 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-orange-500 shadow-2xl backdrop-blur-md"
                  />
                  <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}
            
            {/* The Google Map target div node */}
            <div ref={mapTargetRef} className="w-full h-full" />
          </div>
        ) : (
          /* High-Fidelity Vector Fallback Map Grid (Works perfectly offline/no-api-key) */
          <div
            onClick={handleMockMapClick}
            className={`w-full h-full relative ${readonly ? "cursor-default" : "cursor-crosshair"}`}
          >
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:24px_24px]" />
            
            {/* Styled Vector River Path */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
              <path
                d="M -20 280 Q 200 180, 240 120 T 520 -20"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="36"
                strokeLinecap="round"
                className="animate-pulse"
              />
            </svg>

            {/* Mock Roads */}
            <div className="absolute top-1/2 left-0 w-full h-2 bg-slate-800 opacity-60 pointer-events-none -rotate-12" />
            <div className="absolute top-0 left-1/3 w-3 h-full bg-slate-800 opacity-60 pointer-events-none rotate-45" />

            {/* Mock Vector Greenery */}
            <div className="absolute top-8 left-12 w-20 h-16 bg-emerald-700/30 rounded-full blur-md pointer-events-none" />
            <div className="absolute bottom-10 right-20 w-32 h-20 bg-emerald-700/20 rounded-full blur-lg pointer-events-none" />

            {/* Map Labels */}
            <div className="absolute top-6 left-12 text-[10px] font-black text-emerald-400 opacity-60">Asola Bhatti Wildlife Sanctuary</div>
            <div className="absolute bottom-12 right-24 text-[10px] font-black text-blue-400 opacity-60">Yamuna River</div>
            <div className="absolute top-1/2 left-1/3 text-[10px] font-black text-white/40">Delhi Cantt Highway</div>

            {/* Map Pin Marker */}
            {(() => {
              const markerY = Math.max(0, Math.min(100, (1 - (lat - 28.50) / 0.20) * 100));
              const markerX = Math.max(0, Math.min(100, ((lng - 77.10) / 0.20) * 100));
              return (
                <div
                  style={{
                    top: `${markerY}%`,
                    left: `${markerX}%`,
                    transform: "translate(-50%, -100%)",
                  }}
                  className="absolute z-10 transition-all duration-300 pointer-events-none"
                >
                  <div className="relative flex flex-col items-center">
                    <div className="bg-orange-500 p-1.5 rounded-full shadow-lg border-2 border-white animate-bounce">
                      <MapPin className="w-5 h-5 text-white fill-orange-300" />
                    </div>
                    <div className="absolute -bottom-8 bg-[#0B132B] text-white text-[9px] px-1.5 py-0.5 rounded shadow border border-orange-500/30 whitespace-nowrap uppercase tracking-wider font-extrabold">
                      {tLoc.marker}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Interactive Tooltip Helper Overlay */}
        {!readonly && (
          <div className="absolute bottom-3 left-3 bg-[#0B132B]/90 text-white/80 text-[10px] px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm pointer-events-none flex items-center gap-1.5 shadow-xl font-medium">
            <Info className="w-3.5 h-3.5 text-orange-400" />
            {tLoc.hint}
          </div>
        )}
      </div>

      {/* Lat/Lng Coordinate and Decoded Address summary panels */}
      <div className="bg-slate-950 border border-orange-500/30 rounded-2xl p-4 flex flex-wrap gap-4 text-xs font-bold shadow-inner">
        <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex-1 min-w-[140px]">
          <span className="block text-[10px] uppercase text-orange-400 font-extrabold tracking-wider mb-1">{tLoc.latitude}</span>
          <span className="font-mono text-white text-sm font-black select-all">{lat}</span>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex-1 min-w-[140px]">
          <span className="block text-[10px] uppercase text-orange-400 font-extrabold tracking-wider mb-1">{tLoc.longitude}</span>
          <span className="font-mono text-white text-sm font-black select-all">{lng}</span>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex-[2_2_0%] min-w-[280px]">
          <span className="block text-[10px] uppercase text-orange-400 font-extrabold tracking-wider mb-1">{tLoc.address}</span>
          <span className="text-white text-xs font-bold leading-normal block break-words" title={address}>
            {address}
          </span>
        </div>
      </div>
    </div>
  );
}
