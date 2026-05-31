import React from "react";
import Link from "next/link";
import { Heart, Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#060B18] text-white border-t border-orange-500/10">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-32 h-32 overflow-hidden rounded-full border border-orange-500/30 shadow-lg shadow-orange-500/10">
                <img
                  src="/logo.png"
                  alt="Hum Hai Hindu Foundation Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-2xl tracking-tight leading-tight">
                  HUM HAI
                </span>
                <span className="text-sm tracking-[0.2em] font-bold text-orange-500">
                  HINDU FOUNDATION
                </span>
              </div>
            </div>
            <p className="text-white/60 text-sm max-w-sm mb-6 leading-relaxed">
              Serving humanity through animal rescue, emergency medical assistance, ambulance services, shelter support, and volunteer coordination.
            </p>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 inline-flex items-center gap-3">
              <Phone className="w-5 h-5 text-orange-400 animate-bounce" />
              <div>
                <div className="text-[10px] tracking-wider text-orange-400 font-bold uppercase">Emergency 24x7 Helpline</div>
                <div className="text-sm font-black">+91-9899-317-003</div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-orange-400 tracking-wider uppercase mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/" className="hover:text-orange-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-orange-400 transition-colors">About Mission</Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-orange-400 transition-colors">How Rescue Works</Link>
              </li>
              <li>
                <Link href="/#donate" className="hover:text-orange-400 transition-colors">Support & Donate</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-bold text-orange-400 tracking-wider uppercase mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0 mt-1" />
                <span>163, Kakrola Housing Complex, Apt #8, Dwarka Mor, New Delhi – 110078, India</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <a href="mailto:rescue@hindufoundation.org" className="hover:text-orange-400">rescue@hindufoundation.org</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} Hum Hai Hindu Foundation. All Rights Reserved. Registered NGO.
          </p>
          <div className="flex gap-4 text-xs text-white/40">
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
