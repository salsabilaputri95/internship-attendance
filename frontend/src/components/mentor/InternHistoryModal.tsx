"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Image as ImageIcon,
  LogIn,
  LogOut,
  User,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  Filter,
} from "lucide-react";
import { api } from "@/lib/api";

interface AttendanceRecord {
  id: string;
  intern_id: string;
  attendance_date: string;
  check_in?: string;
  check_in_latitude?: number;
  check_in_longitude?: number;
  check_in_accuracy?: number;
  check_in_distance?: number;
  check_in_photo_url?: string;
  check_out?: string;
  check_out_latitude?: number;
  check_out_longitude?: number;
  check_out_accuracy?: number;
  check_out_distance?: number;
  check_out_photo_url?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface InternProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  university: string;
  major: string;
  phone?: string;
  start_date: string;
  end_date: string;
  status: string;
  attendance_summary?: {
    hadir: number;
    terlambat: number;
    izin: number;
    alpha: number;
    total_working_days: number;
    attendance_rate: number;
  };
}

interface InternHistoryModalProps {
  isOpen: boolean;
  internId: string | null;
  onClose: () => void;
  initialFilter?: string; // "ALL" | "HADIR" | "IZIN"
}

export function InternHistoryModal({
  isOpen,
  internId,
  onClose,
  initialFilter = "ALL",
}: InternHistoryModalProps) {
  const [intern, setIntern] = useState<InternProfile | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);
  const [searchQuery, setSearchQuery] = useState("");

  // Photo Lightbox
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (isOpen && internId) {
      setStatusFilter(initialFilter);
      fetchInternHistory(internId);
    } else {
      setIntern(null);
      setHistory([]);
      setLoading(false);
    }
  }, [isOpen, internId, initialFilter]);

  const fetchInternHistory = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{
        intern: InternProfile;
        history: AttendanceRecord[];
      }>(`/mentor/interns/${id}/history`);

      if (res.success && res.data) {
        setIntern(res.data.intern);
        setHistory(res.data.history || []);
      } else {
        throw new Error(res.message || "Gagal memuat riwayat presensi");
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat riwayat presensi peserta");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Filter logic
  const filteredHistory = history.filter((item) => {
    // Status Filter: ALL, HADIR, TERLAMBAT, IZIN, ALPHA
    let matchStatus = true;
    if (statusFilter === "HADIR") {
      matchStatus = item.status === "HADIR";
    } else if (statusFilter === "TERLAMBAT") {
      matchStatus = item.status === "TERLAMBAT";
    } else if (statusFilter === "IZIN") {
      matchStatus = item.status === "IZIN";
    } else if (statusFilter === "ALPHA") {
      matchStatus = item.status === "ALPHA";
    }

    // Search query
    const matchQuery =
      searchQuery === "" ||
      item.attendance_date.includes(searchQuery) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchStatus && matchQuery;
  });

  const summary = intern?.attendance_summary || {
    hadir: 0,
    terlambat: 0,
    izin: 0,
    alpha: 0,
    total_working_days: 0,
    attendance_rate: 0,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl text-slate-900 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center text-white font-extrabold text-sm shadow-xs shrink-0">
              {intern?.name ? intern.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  Riwayat Presensi Peserta
                </span>
                {intern?.status && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                    {intern.status}
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                {intern?.name || "Riwayat Kehadiran"}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {intern?.university} • {intern?.major}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick Summary Strip */}
        {intern && (
          <div className="px-4 sm:px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar size={13} className="text-slate-400" />
              <span>
                Periode: <strong className="text-slate-800 font-semibold">{intern.start_date || "2026-08-10"} s/d {intern.end_date || "2027-02-09"}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-[11px] font-bold text-emerald-700 shadow-2xs">
                {summary.hadir} Hadir
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-amber-200 text-[11px] font-bold text-amber-700 shadow-2xs">
                {summary.terlambat} Telat
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-[11px] font-bold text-indigo-700 shadow-2xs">
                {summary.izin} Izin
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-rose-200 text-[11px] font-bold text-rose-700 shadow-2xs">
                {summary.alpha} Alpha
              </span>
            </div>
          </div>
        )}

        {/* Filter Toolbar (Semua, Hadir, Terlambat, Izin, Alpha) + Search */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center p-1 bg-slate-100 rounded-xl w-full sm:w-auto gap-0.5">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "ALL"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter("HADIR")}
              className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "HADIR"
                  ? "bg-white text-emerald-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Hadir
            </button>
            <button
              onClick={() => setStatusFilter("TERLAMBAT")}
              className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "TERLAMBAT"
                  ? "bg-white text-amber-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Terlambat
            </button>
            <button
              onClick={() => setStatusFilter("IZIN")}
              className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "IZIN"
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Izin
            </button>
            <button
              onClick={() => setStatusFilter("ALPHA")}
              className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "ALPHA"
                  ? "bg-white text-rose-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Alpha
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-56">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari tanggal / catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Modal Body: Daily Attendance History */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          {error && (
            <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-2.5 flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle size={15} className="text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-slate-400">
              <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
              <p className="text-xs font-medium">Memuat riwayat kehadiran...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-slate-100 p-6">
              <Calendar size={28} className="mx-auto mb-2 text-slate-300" />
              <p className="text-slate-600 font-semibold">Tidak ada data kehadiran yang sesuai filter.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Coba pilih filter status &ldquo;Semua&rdquo; atau ubah kata kunci pencarian.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredHistory.map((item) => {
                const dateObj = new Date(item.attendance_date);
                const dayName = dateObj.toLocaleDateString("id-ID", { weekday: "long" });
                const formattedDate = dateObj.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });

                return (
                  <div
                    key={item.attendance_date}
                    className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-all space-y-2.5"
                  >
                    {/* Top Date & Status Row */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar size={13} className="text-indigo-600 shrink-0" />
                        <span className="font-bold text-slate-900">
                          {dayName}, {formattedDate}
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === "HADIR"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : item.status === "TERLAMBAT"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : item.status === "IZIN"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : item.status === "ALPHA"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {/* In / Out Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      {/* Masuk */}
                      <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/70 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-500 font-medium mb-1">
                          <span className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                            <LogIn size={12} className="text-emerald-600" />
                            Masuk
                          </span>
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {item.check_in
                              ? new Date(item.check_in).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }) + " WITA"
                              : "--:--"}
                          </span>
                        </div>

                        {item.check_in && (
                          <div className="flex items-center justify-between text-[10px] pt-1 text-slate-500 border-t border-slate-200/50">
                            <span className="flex items-center gap-1">
                              <MapPin size={10} className="text-slate-400" />
                              {item.check_in_distance?.toFixed(0)}m dari kantor
                            </span>
                            {item.check_in_photo_url && (
                              <button
                                onClick={() =>
                                  setSelectedPhoto({
                                    url: item.check_in_photo_url!,
                                    title: `Foto Masuk — ${formattedDate}`,
                                  })
                                }
                                className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                              >
                                <ImageIcon size={10} />
                                Foto
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Pulang */}
                      <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/70 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-500 font-medium mb-1">
                          <span className="flex items-center gap-1 text-indigo-700 font-semibold text-[11px]">
                            <LogOut size={12} className="text-indigo-600" />
                            Pulang
                          </span>
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {item.check_out
                              ? new Date(item.check_out).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }) + " WITA"
                              : "--:--"}
                          </span>
                        </div>

                        {item.check_out && (
                          <div className="flex items-center justify-between text-[10px] pt-1 text-slate-500 border-t border-slate-200/50">
                            <span className="flex items-center gap-1">
                              <MapPin size={10} className="text-slate-400" />
                              {item.check_out_distance?.toFixed(0)}m dari kantor
                            </span>
                            {item.check_out_photo_url && (
                              <button
                                onClick={() =>
                                  setSelectedPhoto({
                                    url: item.check_out_photo_url!,
                                    title: `Foto Pulang — ${formattedDate}`,
                                  })
                                }
                                className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                              >
                                <ImageIcon size={10} />
                                Foto
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Catatan / Alasan jika ada */}
                    {item.notes && (
                      <div className="pt-1.5 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-600">
                        <FileText size={12} className="text-slate-400 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-slate-700 font-semibold">Catatan:</strong> &ldquo;{item.notes}&rdquo;
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 px-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Total {filteredHistory.length} catatan kehadiran ditampilkan</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Photo Lightbox Popup */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="relative max-w-sm w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-3.5 flex items-center justify-between border-b border-slate-100 text-slate-900">
              <h3 className="text-xs font-bold truncate pr-2">{selectedPhoto.title}</h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-3 bg-black flex items-center justify-center">
              <img
                src={selectedPhoto.url}
                alt="Foto Selfie Presensi"
                className="w-full h-80 object-cover rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
