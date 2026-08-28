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
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2.5 rounded-2xl bg-white border border-orange-200 text-stone-700 hover:text-orange-600 hover:border-orange-300 transition-colors shadow-sm"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-stone-900">Riwayat Kehadiran</h1>
            <p className="text-xs text-orange-600 font-bold">Rekap presensi dan bukti foto selfie</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Cari tanggal (YYYY-MM-DD) atau catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-orange-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={15} className="text-stone-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-orange-200 rounded-2xl px-3 py-2.5 text-xs text-stone-700 font-semibold focus:outline-none focus:border-orange-500 transition-colors shadow-sm"
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
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-stone-500">
          <div className="w-8 h-8 rounded-full border-3 border-orange-200 border-t-orange-500 animate-spin" />
          <p className="text-xs font-semibold">Memuat riwayat kehadiran...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="bg-white border border-orange-200 rounded-3xl p-8 text-center text-stone-500 shadow-sm">
          <Calendar size={36} className="mx-auto mb-2 text-stone-300" />
          <h3 className="text-sm font-bold text-stone-700">Belum Ada Riwayat Presensi</h3>
          <p className="text-xs text-stone-400 mt-1">Data presensi harian Anda akan muncul di sini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-orange-200/80 rounded-3xl p-4 sm:p-5 shadow-md shadow-orange-500/5 hover:border-orange-300 transition-colors"
            >
              <div className="flex items-center justify-between pb-3 border-b border-orange-100 mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                  <Calendar size={14} className="text-orange-500" />
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
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                    item.status === "HADIR"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : item.status === "TERLAMBAT"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              {/* In & Out Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Check In */}
                <div className="bg-orange-50/40 rounded-2xl p-3 border border-orange-200/60">
                  <div className="flex items-center justify-between mb-1.5 text-stone-500 font-semibold">
                    <span className="flex items-center gap-1 font-bold text-emerald-700">
                      <LogIn size={13} />
                      Masuk
                    </span>
                    <span className="font-mono font-bold text-stone-900">
                      {item.check_in
                        ? new Date(item.check_in).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--:--"}
                    </span>
                  </div>
                  {item.check_in && (
                    <div className="flex items-center justify-between text-[11px] pt-1 text-stone-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="text-orange-500" />
                        {item.check_in_distance?.toFixed(0)}m
                      </span>
                      {item.check_in_photo_url && (
                        <button
                          onClick={() =>
                            setSelectedPhoto({
                              url: item.check_in_photo_url!,
                              title: `Foto Selfie Masuk — ${item.attendance_date}`,
                            })
                          }
                          className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1"
                        >
                          <ImageIcon size={11} />
                          Foto Masuk
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Check Out */}
                <div className="bg-orange-50/40 rounded-2xl p-3 border border-orange-200/60">
                  <div className="flex items-center justify-between mb-1.5 text-stone-500 font-semibold">
                    <span className="flex items-center gap-1 font-bold text-orange-700">
                      <LogOut size={13} />
                      Pulang
                    </span>
                    <span className="font-mono font-bold text-stone-900">
                      {item.check_out
                        ? new Date(item.check_out).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--:--"}
                    </span>
                  </div>
                  {item.check_out && (
                    <div className="flex items-center justify-between text-[11px] pt-1 text-stone-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="text-orange-500" />
                        {item.check_out_distance?.toFixed(0)}m
                      </span>
                      {item.check_out_photo_url && (
                        <button
                          onClick={() =>
                            setSelectedPhoto({
                              url: item.check_out_photo_url!,
                              title: `Foto Selfie Pulang — ${item.attendance_date}`,
                            })
                          }
                          className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1"
                        >
                          <ImageIcon size={11} />
                          Foto Pulang
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {item.notes && (
                <div className="mt-2.5 pt-2 border-t border-orange-100 text-[11px] text-stone-600 italic">
                  Catatan: &ldquo;{item.notes}&rdquo;
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-sm w-full bg-white border border-orange-200 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 flex items-center justify-between border-b border-orange-100 text-stone-900">
              <h3 className="text-xs font-bold truncate pr-2">{selectedPhoto.title}</h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-orange-50"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-3 bg-black">
              <img
                src={selectedPhoto.url}
                alt="Selfie Evidence"
                className="w-full h-80 object-cover rounded-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
