"use client";

import React, { useState, useEffect } from "react";
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
  Menu,
  X,
} from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (!user) return null;

  const isMentor = user.role === "mentor" || user.role === "admin";

  const internNavLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/history", label: "Riwayat", icon: Calendar },
  ];

  const mentorNavLinks = [
    { href: "/mentor", label: "Monitoring", icon: ClipboardList },
    { href: "/mentor/interns", label: "Peserta Magang", icon: Users },
    { href: "/mentor/locations", label: "Lokasi Kantor", icon: MapPin },
    { href: "/mentor/export", label: "Export CSV", icon: Download },
  ];

  const currentNavLinks = isMentor ? mentorNavLinks : internNavLinks;

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 text-slate-900 shadow-2xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href={isMentor ? "/mentor" : "/dashboard"} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl overflow-hidden group-hover:scale-105 transition-transform flex items-center justify-center bg-white p-1 border border-slate-200 shadow-2xs">
            <img
              src="/logo.webp"
              alt="Logo BPS Jeneponto"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">
              BPS Jeneponto
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Presensi Magang</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70">
          {currentNavLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <Icon size={14} className={isActive ? "text-indigo-600" : "text-slate-500"} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop User Info & Logout */}
        <div className="hidden md:flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-900">{user.name}</div>
            <div className="text-[10px] text-indigo-600 uppercase tracking-wider font-semibold">
              {isMentor ? "Mentor" : "Peserta Magang"}
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-xl bg-slate-100/80 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200/80 transition-colors"
            title="Keluar"
          >
            <LogOut size={15} />
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 transition-all active:scale-95 shadow-2xs"
            aria-label="Menu Navigasi"
          >
            {mobileMenuOpen ? <X size={18} className="text-slate-900" /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/80 bg-white/98 backdrop-blur-lg px-4 pt-3 pb-5 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {/* User Info on Mobile */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 leading-tight">{user.name}</div>
                <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                  {isMentor ? "Mentor / Pembimbing" : "Peserta Magang"}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            {currentNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={15} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Logout Button */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 text-xs font-semibold transition-colors active:scale-[0.99]"
            >
              <LogOut size={14} />
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
