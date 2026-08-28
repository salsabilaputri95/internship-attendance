"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LogOut,
  Calendar,
  LayoutDashboard,
  Users,
  MapPin,
  ClipboardList,
  Download,
} from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const isMentor = user.role === "mentor" || user.role === "admin";

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-orange-200/80 text-stone-800 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href={isMentor ? "/mentor" : "/dashboard"} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-orange-500/10 group-hover:scale-105 transition-transform flex items-center justify-center bg-white p-1 border border-orange-200/80">
            <img
              src="/logo.webp"
              alt="Logo BPS Jeneponto"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-stone-900 leading-tight">
              BPS Jeneponto
            </h1>
            <p className="text-[11px] text-orange-600 font-bold">Presensi Magang</p>
          </div>
        </Link>

        {/* Navigation for Intern */}
        {!isMentor && (
          <nav className="hidden md:flex items-center gap-1.5 bg-orange-50/80 p-1 rounded-2xl border border-orange-200/60">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                pathname === "/dashboard"
                  ? "bg-orange-500 text-white shadow-sm shadow-orange-500/25"
                  : "text-stone-600 hover:text-orange-600 hover:bg-orange-100/60"
              }`}
            >
              <LayoutDashboard size={14} />
              Dashboard
            </Link>
            <Link
              href="/history"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                pathname === "/history"
                  ? "bg-orange-500 text-white shadow-sm shadow-orange-500/25"
                  : "text-stone-600 hover:text-orange-600 hover:bg-orange-100/60"
              }`}
            >
              <Calendar size={14} />
              Riwayat
            </Link>
          </nav>
        )}

        {/* Navigation for Mentor / Admin */}
        {isMentor && (
          <nav className="hidden md:flex items-center gap-1.5 bg-orange-50/80 p-1 rounded-2xl border border-orange-200/60">
            <Link
              href="/mentor"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                pathname === "/mentor"
                  ? "bg-orange-500 text-white shadow-sm shadow-orange-500/25"
                  : "text-stone-600 hover:text-orange-600 hover:bg-orange-100/60"
              }`}
            >
              <ClipboardList size={14} />
              Monitoring
            </Link>
            <Link
              href="/mentor/interns"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                pathname === "/mentor/interns"
                  ? "bg-orange-500 text-white shadow-sm shadow-orange-500/25"
                  : "text-stone-600 hover:text-orange-600 hover:bg-orange-100/60"
              }`}
            >
              <Users size={14} />
              Peserta Magang
            </Link>
            <Link
              href="/mentor/locations"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                pathname === "/mentor/locations"
                  ? "bg-orange-500 text-white shadow-sm shadow-orange-500/25"
                  : "text-stone-600 hover:text-orange-600 hover:bg-orange-100/60"
              }`}
            >
              <MapPin size={14} />
              Lokasi Kantor
            </Link>
            <Link
              href="/mentor/export"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                pathname === "/mentor/export"
                  ? "bg-orange-500 text-white shadow-sm shadow-orange-500/25"
                  : "text-stone-600 hover:text-orange-600 hover:bg-orange-100/60"
              }`}
            >
              <Download size={14} />
              Export CSV
            </Link>
          </nav>
        )}

        {/* User Info & Logout */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-stone-900">{user.name}</div>
            <div className="text-[10px] text-orange-600 uppercase tracking-wider font-extrabold">
              {isMentor ? "Mentor / Pembimbing" : "Peserta Magang"}
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-xl bg-orange-50 hover:bg-red-50 text-stone-600 hover:text-red-500 border border-orange-200/80 transition-colors"
            title="Keluar"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
