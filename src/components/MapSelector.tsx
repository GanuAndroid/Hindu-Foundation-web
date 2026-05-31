"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Info } from "lucide-react";

interface MapSelectorProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
  readonly?: boolean;
}

export default function MapSelector({
  onLocationSelect,
  initialLat = 25.3176,
  initialLng = 82.9739,
  readonly = false,
}: MapSelectorProps) {
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [address, setAddress] = useState("Varanasi Cantt, Varanasi, Uttar Pradesh 221002");
  const [isDetecting, setIsDetecting] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Addresses mock mapping based on grid quadrant
  const getMockAddress = (xRatio: number, yRatio: number) => {
    const sectors = ["Viswanath Corridor", "Bypass highway", "Ghats road", "Assi Ghat sector", "Sarnath Wildlife periphery", "Godowlia Market district"];
    const landmarks = ["Shree Mandir Gate 3", "Toll Plaza Highway Km 12", "Ramnagar Fort outer crossing", "Cantonment Park side", "Sanskriti Bhawan"];
    
    const secIdx = Math.floor(xRatio * sectors.length);
    const lmkIdx = Math.floor(yRatio * landmarks.length);
    
    return `${landmarks[lmkIdx]}, ${sectors[secIdx]}, Varanasi, UP - ${221000 + Math.floor(1 + xRatio * 9)}`;
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readonly || !mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xRatio = Math.max(0, Math.min(1, x / rect.width));
    const yRatio = Math.max(0, Math.min(1, y / rect.height));

    // Map ratio to Varanasi boundary coordinates
    // Lat: ~25.28 to ~25.36
    // Lng: ~82.94 to ~83.03
    const calculatedLat = parseFloat((25.28 + (1 - yRatio) * 0.08).toFixed(6));
    const calculatedLng = parseFloat((82.94 + xRatio * 0.09).toFixed(6));
    const calculatedAddr = getMockAddress(xRatio, yRatio);

    setLat(calculatedLat);
    setLng(calculatedLng);
    setAddress(calculatedAddr);
    onLocationSelect(calculatedLat, calculatedLng, calculatedAddr);
  };

  const detectLocation = () => {
    if (readonly) return;
    setIsDetecting(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const calculatedLat = parseFloat(position.coords.latitude.toFixed(6));
          const calculatedLng = parseFloat(position.coords.longitude.toFixed(6));
          const mockAddr = `Captured Current Location (${calculatedLat}, ${calculatedLng}), Varanasi Central`;
          
          setLat(calculatedLat);
          setLng(calculatedLng);
          setAddress(mockAddr);
          onLocationSelect(calculatedLat, calculatedLng, mockAddr);
          setIsDetecting(false);
        },
        (error) => {
          console.warn("Geolocation permission blocked/failed, using mock gps", error);
          // Fallback to high quality mock GPS
          setTimeout(() => {
            const calculatedLat = 25.3112 + parseFloat((Math.random() * 0.02).toFixed(6));
            const calculatedLng = 83.0078 + parseFloat((Math.random() * 0.02).toFixed(6));
            const mockAddr = `Shree Kashi Temple outer peripheral grid ${Math.floor(1 + Math.random() * 9)}`;
            
            setLat(calculatedLat);
            setLng(calculatedLng);
            setAddress(mockAddr);
            onLocationSelect(calculatedLat, calculatedLng, mockAddr);
            setIsDetecting(false);
          }, 1200);
        }
      );
    } else {
      setIsDetecting(false);
    }
  };

  // Sync with prop changes if any
  useEffect(() => {
    if (initialLat !== lat || initialLng !== lng) {
      setLat(initialLat);
      setLng(initialLng);
    }
  }, [initialLat, initialLng]);

  // Convert lat/lng back to ratio to place the marker
  // Lat: ~25.28 to ~25.36 (8% diff)
  // Lng: ~82.94 to ~83.03 (9% diff)
  const markerY = Math.max(0, Math.min(100, (1 - (lat - 25.28) / 0.08) * 100));
  const markerX = Math.max(0, Math.min(100, ((lng - 82.94) / 0.09) * 100));

  return (
    <div className="flex flex-col gap-3 w-full bg-white dark:bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2 text-[#0B132B] dark:text-white">
          <MapPin className="w-5 h-5 text-orange-500" />
          <h4 className="font-bold text-sm">GPS Location Dispatcher</h4>
        </div>
        
        {!readonly && (
          <button
            type="button"
            onClick={detectLocation}
            disabled={isDetecting}
            className="flex items-center gap-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white px-3 py-1.5 rounded-lg shadow-sm transition-all"
          >
            <Navigation className={`w-3.5 h-3.5 ${isDetecting ? "animate-spin" : ""}`} />
            {isDetecting ? "Detecting GPS..." : "Auto Detect GPS"}
          </button>
        )}
      </div>

      {/* Simulated Interactive Map Grid */}
      <div
        ref={mapRef}
        onClick={handleMapClick}
        className={`relative h-60 w-full rounded-xl overflow-hidden border border-white/5 bg-slate-950 select-none ${
          readonly ? "cursor-default" : "cursor-crosshair"
        }`}
      >
        {/* Background Grid Pattern simulating maps */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        {/* Styled Vector Elements for Map Realism */}
        {/* Ganga River */}
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

        {/* HighWay Roads */}
        <div className="absolute top-1/2 left-0 w-full h-2 bg-slate-800 opacity-60 pointer-events-none -rotate-12" />
        <div className="absolute top-0 left-1/3 w-3 h-full bg-slate-800 opacity-60 pointer-events-none rotate-45" />

        {/* Varanasi Park Area */}
        <div className="absolute top-8 left-12 w-20 h-16 bg-emerald-700/30 rounded-full blur-md pointer-events-none" />
        <div className="absolute bottom-10 right-20 w-32 h-20 bg-emerald-700/20 rounded-full blur-lg pointer-events-none" />

        {/* Map City Labels */}
        <div className="absolute top-6 left-12 text-[10px] font-black text-emerald-400 opacity-60">Sarnath Wildlife Park</div>
        <div className="absolute bottom-12 right-24 text-[10px] font-black text-blue-400 opacity-60">Ganges River (Holy Ganga)</div>
        <div className="absolute top-1/2 left-1/3 text-[10px] font-black text-white/40">Varanasi Cantt Highway</div>

        {/* Map Marker Pin */}
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
            <div className="absolute -bottom-8 bg-[#0B132B] text-white text-[9px] px-1.5 py-0.5 rounded shadow border border-orange-500/30 whitespace-nowrap">
              INCIDENT MARKER
            </div>
          </div>
        </div>

        {/* Interactive hint */}
        {!readonly && (
          <div className="absolute bottom-2 left-2 bg-[#0B132B]/80 text-white/80 text-[10px] px-2 py-1 rounded-lg backdrop-blur-sm pointer-events-none flex items-center gap-1">
            <Info className="w-3 h-3 text-orange-400" />
            Click anywhere on grid to adjust location pin manually
          </div>
        )}
      </div>

      {/* Coordinate & Address Summary */}
      <div className="bg-orange-500/[0.03] border border-orange-500/10 rounded-xl p-3.5 grid grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
        <div>
          <span className="block text-[10px] uppercase font-bold text-white/50 mb-0.5">Latitude</span>
          <span className="font-mono text-white/95 font-bold">{lat}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-white/50 mb-0.5">Longitude</span>
          <span className="font-mono text-white/95 font-bold">{lng}</span>
        </div>
        <div className="col-span-2 md:col-span-1">
          <span className="block text-[10px] uppercase font-bold text-white/50 mb-0.5">Incident Locality Address</span>
          <span className="text-white/90 truncate block max-w-[200px]" title={address}>
            {address}
          </span>
        </div>
      </div>
    </div>
  );
}
