"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Calendar,
  Clock,
  MapPin,
  Image as ImageIcon,
  ArrowLeft,
  Search,
  Filter,
  X,
  LogIn,
  LogOut,
} from "lucide-react";

interface AttendanceRecord {
  id: string;
  attendance_date: string;
  check_in?: string;
  check_in_distance?: number;
  check_in_photo_url?: string;
  check_out?: string;
  check_out_distance?: number;
  check_out_photo_url?: string;
  status: string;
  notes?: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ history: AttendanceRecord[] }>("/attendance/history?limit=100");
      if (res.success && res.data) {
        setHistory(res.data.history || []);
      }
    } catch (err: any) {
      console.error("Gagal mengambil riwayat absensi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = history.filter((item) => {
    const matchQuery =
      item.attendance_date.includes(searchQuery) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStatus = statusFilter === "" || item.status === statusFilter;
    return matchQuery && matchStatus;
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Riwayat Kehadiran</h1>
            <p className="text-xs text-slate-500">Rekapitulasi catatan presensi harian Anda</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari tanggal (YYYY-MM-DD) atau catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500 transition-colors shadow-2xs cursor-pointer"
          >
            <option value="">Semua Status</option>
            <option value="HADIR">Hadir</option>
            <option value="TERLAMBAT">Terlambat</option>
            <option value="IZIN">Izin</option>
            <option value="ALPHA">Alpha</option>
          </select>
        </div>
      </div>

      {/* History List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-slate-400">
          <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
          <p className="text-xs font-medium">Memuat riwayat kehadiran...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-500 shadow-2xs">
          <Calendar size={32} className="mx-auto mb-2 text-slate-300" />
          <h3 className="text-sm font-semibold text-slate-700">Belum Ada Riwayat Presensi</h3>
          <p className="text-xs text-slate-400 mt-0.5">Data presensi harian Anda akan tercatat di sini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <Calendar size={13} className="text-indigo-600" />
                  <span>
                    {new Date(item.attendance_date).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    item.status === "HADIR"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : item.status === "TERLAMBAT"
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              {/* In & Out Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Check In */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                  <div className="flex items-center justify-between mb-1 text-slate-500 font-medium">
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <LogIn size={13} />
                      Masuk
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {item.check_in
                        ? new Date(item.check_in).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--:--"}
                    </span>
                  </div>
                  {item.check_in && (
                    <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="text-slate-400" />
                        {item.check_in_distance?.toFixed(0)}m
                      </span>
                      {item.check_in_photo_url && (
                        <button
                          onClick={() =>
                            setSelectedPhoto({
                              url: item.check_in_photo_url!,
                              title: `Foto Masuk — ${item.attendance_date}`,
                            })
                          }
                          className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                        >
                          <ImageIcon size={11} />
                          Foto
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Check Out */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                  <div className="flex items-center justify-between mb-1 text-slate-500 font-medium">
                    <span className="flex items-center gap-1 text-indigo-700 font-semibold">
                      <LogOut size={13} />
                      Pulang
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {item.check_out
                        ? new Date(item.check_out).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--:--"}
                    </span>
                  </div>
                  {item.check_out && (
                    <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="text-slate-400" />
                        {item.check_out_distance?.toFixed(0)}m
                      </span>
                      {item.check_out_photo_url && (
                        <button
                          onClick={() =>
                            setSelectedPhoto({
                              url: item.check_out_photo_url!,
                              title: `Foto Pulang — ${item.attendance_date}`,
                            })
                          }
                          className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                        >
                          <ImageIcon size={11} />
                          Foto
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {item.notes && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600 italic">
                  Catatan: &ldquo;{item.notes}&rdquo;
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative max-w-sm w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3.5 flex items-center justify-between border-b border-slate-100 text-slate-900">
              <h3 className="text-xs font-semibold truncate pr-2">{selectedPhoto.title}</h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-3 bg-black">
              <img
                src={selectedPhoto.url}
                alt="Selfie Evidence"
                className="w-full h-72 object-cover rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
