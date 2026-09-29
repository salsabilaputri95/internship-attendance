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
  History,
  ShieldCheck,
  AlertCircle,
  FileText,
} from "lucide-react";
import { api } from "@/lib/api";

interface AttendanceDetail {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  category: string;
  university?: string;
  major?: string;
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

interface CorrectionLog {
  id: string;
  attendance_id: string;
  corrected_by: string;
  mentor_name: string;
  mentor_email: string;
  old_value: any;
  new_value: any;
  reason: string;
  created_at: string;
}

interface AdminDetailModalProps {
  isOpen: boolean;
  attendanceId: string | null;
  onClose: () => void;
}

export function AdminDetailModal({
  isOpen,
  attendanceId,
  onClose,
}: AdminDetailModalProps) {
  const [data, setData] = useState<AttendanceDetail | null>(null);
  const [corrections, setCorrections] = useState<CorrectionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (isOpen && attendanceId) {
      fetchDetail(attendanceId);
    } else {
      setData(null);
      setCorrections([]);
      setLoading(false);
    }
  }, [isOpen, attendanceId]);

  const fetchDetail = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{
        attendance: AttendanceDetail;
        corrections: CorrectionLog[];
      }>(`/admin/attendance/${id}`);

      if (res.success && res.data) {
        setData(res.data.attendance);
        setCorrections(res.data.corrections || []);
      } else {
        throw new Error(res.message || "Gagal memuat detail data absensi");
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memuat detail");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "-";
    const d = new Date(timeStr);
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Makassar",
    }) + " WITA";
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "HADIR":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">✅ Hadir Tepat Waktu</span>;
      case "TERLAMBAT":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">⏰ Terlambat</span>;
      case "IZIN":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">📝 Izin</span>;
      case "SAKIT":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">🏥 Sakit</span>;
      case "ALPHA":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">❌ Alpha (Tidak Hadir)</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">{status || "-"}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl text-slate-900 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Detail Rekam Absensi</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                  Super Admin View
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Informasi GPS, waktu presisi, foto bukti, dan riwayat jejak audit
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-slate-400">
              <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
              <p className="text-xs font-medium">Memuat detail absensi...</p>
            </div>
          ) : data ? (
            <>
              {/* User Profile Banner */}
              <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
                    {data.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{data.user_name}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        data.user_role === "mentor"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                      }`}>
                        {data.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{data.user_email}</p>
                    {data.university && (
                      <p className="text-[11px] text-slate-500">{data.university} • {data.major}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                    <Calendar size={13} className="text-slate-400" />
                    <span>{data.attendance_date}</span>
                  </div>
                  <div>{getStatusBadge(data.status)}</div>
                </div>
              </div>

              {/* Check-In & Check-Out Detail Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Check In */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <LogIn size={14} className="text-emerald-600" />
                      Presensi Masuk
                    </span>
                    <span className="text-xs font-bold text-emerald-600">{formatTime(data.check_in)}</span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Jarak ke Kantor:</span>
                      <strong className="text-slate-800 font-semibold">
                        {data.check_in_distance !== undefined && data.check_in_distance !== null
                          ? `${data.check_in_distance.toFixed(1)} meter`
                          : "-"}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Akurasi GPS:</span>
                      <span className="text-slate-700">
                        {data.check_in_accuracy ? `±${data.check_in_accuracy.toFixed(0)}m` : "-"}
                      </span>
                    </div>

                    {data.check_in_latitude && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Koordinat:</span>
                        <span className="text-slate-500 font-mono">
                          {data.check_in_latitude.toFixed(5)}, {data.check_in_longitude?.toFixed(5)}
                        </span>
                      </div>
                    )}
                  </div>

                  {data.check_in_photo_url && (
                    <button
                      onClick={() => setSelectedPhoto({ url: data.check_in_photo_url!, title: `Foto Masuk - ${data.user_name}` })}
                      className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-emerald-50 text-emerald-700 border border-slate-200 hover:border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ImageIcon size={13} />
                      <span>Lihat Foto Selfie Masuk</span>
                    </button>
                  )}
                </div>

                {/* Check Out */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <LogOut size={14} className="text-indigo-600" />
                      Presensi Pulang
                    </span>
                    <span className="text-xs font-bold text-indigo-600">{formatTime(data.check_out)}</span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Jarak ke Kantor:</span>
                      <strong className="text-slate-800 font-semibold">
                        {data.check_out_distance !== undefined && data.check_out_distance !== null
                          ? `${data.check_out_distance.toFixed(1)} meter`
                          : "-"}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Akurasi GPS:</span>
                      <span className="text-slate-700">
                        {data.check_out_accuracy ? `±${data.check_out_accuracy.toFixed(0)}m` : "-"}
                      </span>
                    </div>

                    {data.check_out_latitude && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Koordinat:</span>
                        <span className="text-slate-500 font-mono">
                          {data.check_out_latitude.toFixed(5)}, {data.check_out_longitude?.toFixed(5)}
                        </span>
                      </div>
                    )}
                  </div>

                  {data.check_out_photo_url && (
                    <button
                      onClick={() => setSelectedPhoto({ url: data.check_out_photo_url!, title: `Foto Pulang - ${data.user_name}` })}
                      className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ImageIcon size={13} />
                      <span>Lihat Foto Selfie Pulang</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Notes */}
              {data.notes && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
                  <div className="text-[11px] font-bold text-slate-500">Catatan / Keterangan:</div>
                  <p className="text-xs text-slate-800 font-medium">{data.notes}</p>
                </div>
              )}

              {/* Audit Log / Riwayat Koreksi */}
              {corrections.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <History size={14} className="text-purple-600" />
                    <span>Riwayat Jejak Audit Koreksi ({corrections.length})</span>
                  </div>

                  <div className="space-y-2">
                    {corrections.map((c) => (
                      <div key={c.id} className="p-3 bg-purple-50/40 border border-purple-200/70 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-purple-900">
                            Diubah oleh: {c.mentor_name || "Super Admin"}
                          </span>
                          <span className="text-[10px] text-purple-600">
                            {new Date(c.created_at).toLocaleString("id-ID", { timeZone: "Asia/Makassar" })} WITA
                          </span>
                        </div>
                        <p className="text-slate-700 text-[11px]">
                          <strong>Alasan:</strong> {c.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-4 space-y-3">
            <div className="flex items-center justify-between text-white pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold truncate">{selectedPhoto.title}</h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <img
                src={selectedPhoto.url}
                alt="Foto Selfie"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
