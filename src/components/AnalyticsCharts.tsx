"use client";

import React, { useState } from "react";
import { TrendingUp, Landmark, Heart, ShieldCheck } from "lucide-react";

// Shared Data sets
const donationData = [
  { month: "Jan", amount: 45000, label: "₹45,000" },
  { month: "Feb", amount: 62000, label: "₹62,000" },
  { month: "Mar", amount: 55000, label: "₹55,000" },
  { month: "Apr", amount: 78000, label: "₹78,000" },
  { month: "May", amount: 95000, label: "₹95,000" },
  { month: "Jun", amount: 120000, label: "₹120,000" },
];

const caseData = [
  { month: "Jan", cases: 28 },
  { month: "Feb", cases: 42 },
  { month: "Mar", cases: 35 },
  { month: "Apr", cases: 64 },
  { month: "May", cases: 88 },
  { month: "Jun", cases: 112 },
];

const categoryData = [
  { name: "Cow", count: 48, pct: 40, color: "from-[#F15A24] to-[#FF8C00]" },
  { name: "Dog", count: 36, pct: 30, color: "from-blue-500 to-cyan-400" },
  { name: "Bird", count: 18, pct: 15, color: "from-emerald-500 to-teal-400" },
  { name: "Cat", count: 12, pct: 10, color: "from-purple-500 to-pink-400" },
  { name: "Monkey", count: 6, pct: 5, color: "from-amber-500 to-yellow-400" },
];

export function DonationsLedgerChart() {
  const [activeDonationIndex, setActiveDonationIndex] = useState<number | null>(null);

  // Helper values for donation line chart path
  const maxDonation = 130000;
  const chartHeight = 140;
  const chartWidth = 500;
  
  const getCoordinates = () => {
    return donationData.map((d, index) => {
      const x = (index / (donationData.length - 1)) * chartWidth;
      const y = chartHeight - (d.amount / maxDonation) * chartHeight;
      return { x, y };
    });
  };

  const coords = getCoordinates();
  const pathD = coords.reduce(
    (acc, c, index) => (index === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`),
    ""
  );

  // Gradient area path
  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${chartHeight} L ${coords[0].x} ${chartHeight} Z`;

  return (
    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Donations Ledger</span>
          <h3 className="text-lg font-black text-white flex items-center gap-2 mt-1">
            <Landmark className="w-5 h-5 text-orange-400" />
            Donation Inflow (Monthly)
          </h3>
        </div>
        <div className="bg-orange-500/10 text-orange-400 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" />
          +45% this Q
        </div>
      </div>

      {/* Line SVG Graph */}
      <div className="relative mt-8 h-40 w-full select-none">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="donationGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F15A24" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#F15A24" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          <line x1="0" y1="0" x2={chartWidth} y2="0" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
          <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
          <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="rgba(255,255,255,0.1)" />

          {/* Gradient Area under line */}
          <path d={areaD} fill="url(#donationGlow)" />

          {/* Main Path Line */}
          <path d={pathD} fill="none" stroke="#F15A24" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

          {/* Interaction Circles */}
          {coords.map((c, idx) => (
            <g key={idx}>
              <circle
                cx={c.x}
                cy={c.y}
                r={activeDonationIndex === idx ? 8 : 4}
                fill={activeDonationIndex === idx ? "#FF8C00" : "#F15A24"}
                stroke="#1E293B"
                strokeWidth="2"
                className="transition-all duration-150 cursor-pointer"
                onMouseEnter={() => setActiveDonationIndex(idx)}
                onMouseLeave={() => setActiveDonationIndex(null)}
              />
            </g>
          ))}
        </svg>

        {/* Interactive Tooltip Overlay */}
        {activeDonationIndex !== null && (
          <div
            style={{
              left: `${(activeDonationIndex / (donationData.length - 1)) * 85}%`,
              top: "10px",
            }}
            className="absolute bg-orange-500 text-white text-xs font-black px-3 py-1.5 rounded-lg shadow-lg border border-orange-400 z-10 animate-fade-in whitespace-nowrap pointer-events-none"
          >
            {donationData[activeDonationIndex].month}: {donationData[activeDonationIndex].label}
          </div>
        )}
      </div>

      {/* X-Axis labels */}
      <div className="flex justify-between px-1 text-[10px] font-bold text-white/40 mt-3">
        {donationData.map((d, i) => (
          <span key={i} className={activeDonationIndex === i ? "text-orange-400" : ""}>
            {d.month}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AnimalCategoryReports() {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-xl w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Species Distribution</span>
          <h3 className="text-lg font-black text-white flex items-center gap-2 mt-1">
            <Heart className="w-5 h-5 text-orange-400" />
            Animal Category Reports
          </h3>
        </div>
        <span className="text-xs bg-white/5 px-3 py-1 rounded-full text-white/60 font-medium">Total Cases: 120</span>
      </div>

      {/* Premium Progress Bar Suite */}
      <div className="space-y-4">
        {categoryData.map((cat, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-white/80">{cat.name} Rescue Operations</span>
              <div className="flex gap-2">
                <span className="text-orange-400">{cat.count} cases</span>
                <span className="text-white/40">({cat.pct}%)</span>
              </div>
            </div>
            
            {/* Progress Slider Track */}
            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div
                style={{ width: `${cat.pct}%` }}
                className={`h-full rounded-full bg-gradient-to-r ${cat.color} transition-all duration-1000 delay-100`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsCharts() {
  const [activeCaseIndex, setActiveCaseIndex] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <DonationsLedgerChart />

      {/* Rescue Cases Monthly Bar Chart */}
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Rescue Operations</span>
            <h3 className="text-lg font-black text-white flex items-center gap-2 mt-1">
              <ShieldCheck className="w-5 h-5 text-orange-400" />
              Monthly Rescue Cases
            </h3>
          </div>
          <div className="text-white/40 text-xs font-semibold">Year: 2026</div>
        </div>

        {/* Bar chart container */}
        <div className="flex justify-between items-end h-40 w-full mt-8 px-2 border-b border-white/10">
          {caseData.map((item, idx) => {
            const pct = (item.cases / 120) * 100;
            return (
              <div key={idx} className="flex flex-col items-center w-1/8 group">
                {/* Cases Tooltip */}
                <span className="text-[10px] font-extrabold text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mb-1">
                  {item.cases}
                </span>
                
                {/* Dynamic Bar */}
                <div
                  style={{ height: `${pct}%` }}
                  className="w-8 rounded-t-lg bg-gradient-to-t from-orange-600 to-orange-400 hover:from-orange-500 hover:to-orange-300 shadow-md shadow-orange-500/10 transition-all duration-300 relative cursor-pointer"
                  onMouseEnter={() => setActiveCaseIndex(idx)}
                  onMouseLeave={() => setActiveCaseIndex(null)}
                />
                
                <span className="text-[10px] text-white/40 font-bold mt-2.5">
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-2">
        <AnimalCategoryReports />
      </div>
    </div>
  );
}
