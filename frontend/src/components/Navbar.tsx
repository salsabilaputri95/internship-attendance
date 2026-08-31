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
  User as UserIcon,
} from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when pathname changes
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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-orange-200/80 text-stone-800 shadow-sm">
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

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 bg-orange-50/80 p-1 rounded-2xl border border-orange-200/60">
          {currentNavLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-orange-500 text-white shadow-sm shadow-orange-500/25"
                    : "text-stone-600 hover:text-orange-600 hover:bg-orange-100/60"
                }`}
              >
                <Icon size={14} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop User Info & Logout Button */}
        <div className="hidden md:flex items-center gap-3">
          <div className="text-right">
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

        {/* Mobile Hamburger Menu Button (Replaces logout icon on mobile) */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl bg-orange-50/80 hover:bg-orange-100 text-stone-700 hover:text-orange-600 border border-orange-200/80 transition-all active:scale-95 shadow-xs"
            aria-label="Menu Navigasi"
          >
            {mobileMenuOpen ? <X size={18} className="text-orange-600" /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-orange-100 bg-white/98 backdrop-blur-lg px-4 pt-3 pb-5 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-200">
          {/* User Profile Card on Mobile */}
          <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-black text-stone-900 leading-tight">{user.name}</div>
                <div className="text-[10px] text-orange-600 font-bold mt-0.5">
                  {isMentor ? "Mentor / Pembimbing" : "Peserta Magang"}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links for Mobile */}
          <div className="space-y-1">
            {currentNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/20"
                      : "text-stone-700 hover:text-orange-600 hover:bg-orange-50"
                  }`}
                >
                  <Icon size={16} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Logout Button */}
          <div className="pt-2 border-t border-orange-100">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 text-xs font-extrabold transition-colors active:scale-[0.99]"
            >
              <LogOut size={15} />
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
