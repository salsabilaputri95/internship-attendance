"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Image as ImageIcon,
  Edit3,
  History,
  AlertCircle,
  CheckCircle2,
  Send,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { api } from "@/lib/api";

interface CorrectionLog {
  id: string;
  attendance_id: string;
  corrected_by: string;
  old_value: any;
  new_value: any;
  reason: string;
  created_at: string;
  mentor_name: string;
  mentor_email: string;
}

interface AttendanceDetail {
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
  intern_name: string;
  intern_university: string;
  intern_major: string;
  corrections?: CorrectionLog[];
}

interface AttendanceDetailModalProps {
  isOpen: boolean;
  attendanceId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AttendanceDetailModal({
  isOpen,
  attendanceId,
  onClose,
  onSuccess,
}: AttendanceDetailModalProps) {
  const [tab, setTab] = useState<"detail" | "correct" | "audit">("detail");
  const [detail, setDetail] = useState<AttendanceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Correction Form State
  const [newStatus, setNewStatus] = useState<string>("");
  const [newNotes, setNewNotes] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Photo Zoom Lightbox
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && attendanceId && attendanceId !== "00000000-0000-0000-0000-000000000000") {
      fetchDetail(attendanceId);
    } else {
      setDetail(null);
      setLoading(false);
    }
  }, [isOpen, attendanceId]);

  const fetchDetail = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<AttendanceDetail>(`/mentor/attendance/${id}`);
      if (res.success && res.data) {
        setDetail(res.data);
        setNewStatus(res.data.status);
        setNewNotes(res.data.notes || "");
      } else {
        throw new Error(res.message || "Gagal memuat detail kehadiran");
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat detail presensi");
    } finally {
      setLoading(false);
    }
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert("Alasan koreksi (Reason) wajib diisi untuk rekam Audit Log.");
      return;
    }

    if (!attendanceId) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post(`/mentor/attendance/${attendanceId}/correct`, {
        status: newStatus,
        notes: newNotes,
        reason: reason.trim(),
      });

      if (res.success) {
        setActionSuccess("Koreksi berhasil disimpan ke Audit Log!");
        setReason("");
        setTimeout(() => {
          setActionSuccess(null);
          fetchDetail(attendanceId);
          onSuccess();
          setTab("detail");
        }, 1200);
      } else {
        throw new Error(res.message || "Gagal melakukan koreksi");
      }
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan koreksi absensi");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white border border-orange-200 rounded-3xl overflow-hidden shadow-2xl text-stone-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-orange-100 flex items-center justify-between bg-orange-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-700 border border-orange-200">
                Inspeksi Absensi
              </span>
              {detail && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    detail.status === "HADIR"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : detail.status === "TERLAMBAT"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}
                >
                  {detail.status}
                </span>
              )}
            </div>
            <h2 className="text-base font-extrabold text-stone-900 mt-1">
              {detail?.intern_name || "Detail Presensi Peserta"}
            </h2>
            <p className="text-xs text-stone-500 font-medium">
              {detail?.intern_university} • {detail?.intern_major}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-orange-100/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-orange-100 bg-orange-50/20 px-5 pt-2 gap-2">
          <button
            onClick={() => setTab("detail")}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${
              tab === "detail"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <Clock size={14} />
            Rincian & GPS
          </button>
          <button
            onClick={() => setTab("correct")}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${
              tab === "correct"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <Edit3 size={14} />
            Koreksi Presensi
          </button>
          <button
            onClick={() => setTab("audit")}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${
              tab === "audit"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <History size={14} />
            Audit Trail ({detail?.corrections?.length || 0})
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-center gap-3 text-red-700 text-xs">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3 text-emerald-700 text-xs animate-in zoom-in-95">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-stone-500">
              <div className="w-8 h-8 rounded-full border-3 border-orange-200 border-t-orange-500 animate-spin" />
              <p className="text-xs font-semibold">Memuat data presensi...</p>
            </div>
          ) : !detail ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              Peserta belum melakukan presensi pada tanggal ini.
            </div>
          ) : (
            <>
              {/* TAB 1: DETAIL & GPS (Foto Dikomentari Sementara) */}
              {tab === "detail" && (
                <div className="space-y-4">
                  {/* Side-by-Side Check In & Check Out Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Check In Card */}
                    <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-2xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-extrabold text-emerald-800 flex items-center gap-1.5">
                            <LogIn size={15} className="text-emerald-600" />
                            Absen Masuk
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                            {detail.check_in ? "Tercatat" : "Belum Absen"}
                          </span>
                        </div>

                        <div className="text-2xl font-black text-stone-900 font-mono my-2">
                          {detail.check_in
                            ? new Date(detail.check_in).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              }) + " WITA"
                            : "--:--"}
                        </div>

                        {/* [KOMENTAR FITUR FOTO]: Foto selfie dinonaktifkan sementara
                        {detail.check_in_photo_url && (
                          <div
                            onClick={() => setZoomedPhoto(detail.check_in_photo_url!)}
                            className="relative w-full h-36 rounded-xl overflow-hidden cursor-pointer group bg-black border border-orange-200 shadow-sm mt-2"
                          >
                            <img
                              src={detail.check_in_photo_url}
                              alt="Selfie Check In"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                        )}
                        */}
                      </div>

                      {detail.check_in && (
                        <div className="mt-3 pt-3 border-t border-emerald-200/80 text-xs text-stone-600 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-stone-500 font-medium">
                              <MapPin size={13} className="text-emerald-600" />
                              Jarak ke Kantor:
                            </span>
                            <span className="font-bold text-stone-900">
                              {detail.check_in_distance?.toFixed(0)} meter
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-stone-500">
                            <span>Akurasi GPS:</span>
                            <span>±{detail.check_in_accuracy?.toFixed(0)} meter</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Check Out Card */}
                    <div className="bg-orange-50/40 border border-orange-200/80 rounded-2xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-extrabold text-orange-800 flex items-center gap-1.5">
                            <LogOut size={15} className="text-orange-600" />
                            Absen Pulang
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100/80 text-orange-800 border border-orange-200">
                            {detail.check_out ? "Tercatat" : "Belum Absen"}
                          </span>
                        </div>

                        <div className="text-2xl font-black text-stone-900 font-mono my-2">
                          {detail.check_out
                            ? new Date(detail.check_out).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              }) + " WITA"
                            : "--:--"}
                        </div>

                        {/* [KOMENTAR FITUR FOTO]: Foto selfie dinonaktifkan sementara
                        {detail.check_out_photo_url && (
                          <div
                            onClick={() => setZoomedPhoto(detail.check_out_photo_url!)}
                            className="relative w-full h-36 rounded-xl overflow-hidden cursor-pointer group bg-black border border-orange-200 shadow-sm mt-2"
                          >
                            <img
                              src={detail.check_out_photo_url}
                              alt="Selfie Check Out"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                        )}
                        */}
                      </div>

                      {detail.check_out && (
                        <div className="mt-3 pt-3 border-t border-orange-200/80 text-xs text-stone-600 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-stone-500 font-medium">
                              <MapPin size={13} className="text-orange-600" />
                              Jarak ke Kantor:
                            </span>
                            <span className="font-bold text-stone-900">
                              {detail.check_out_distance?.toFixed(0)} meter
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-stone-500">
                            <span>Akurasi GPS:</span>
                            <span>±{detail.check_out_accuracy?.toFixed(0)} meter</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes info */}
                  {detail.notes && (
                    <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 text-xs text-stone-800">
                      <div className="text-amber-800 font-bold mb-1 flex items-center gap-1.5">
                        <AlertCircle size={14} className="text-amber-600" />
                        Catatan / Alasan Peserta:
                      </div>
                      <p className="text-stone-700 italic bg-white/70 p-2.5 rounded-xl border border-amber-200/60">
                        &ldquo;{detail.notes}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: FORM KOREKSI */}
              {tab === "correct" && (
                <form onSubmit={handleCorrectionSubmit} className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-amber-900 text-xs flex items-start gap-2.5">
                    <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-800">Audit Trail Aktif:</span> Setiap
                      perubahan data akan dicatat permanen dalam rekam log audit beserta identitas
                      Anda sebagai mentor penanggung jawab.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Status Kehadiran
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full bg-orange-50/30 border border-orange-200 rounded-xl px-3 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-orange-500 font-semibold"
                    >
                      <option value="HADIR">HADIR (Tepat Waktu)</option>
                      <option value="TERLAMBAT">TERLAMBAT</option>
                      <option value="IZIN">IZIN</option>
                      <option value="ALPHA">ALPHA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Catatan Tambahan
                    </label>
                    <textarea
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Catatan penugasan / dispensasi khusus..."
                      rows={2}
                      className="w-full bg-orange-50/30 border border-orange-200 rounded-xl p-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Alasan Koreksi <span className="text-red-500">* (Wajib untuk Audit Log)</span>
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Contoh: Peserta sedang dinas luar / konfirmasi langsung dengan mentor..."
                      rows={2}
                      required
                      className="w-full bg-orange-50/30 border border-orange-400 rounded-xl p-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="py-2.5 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs flex items-center gap-2 transition-colors disabled:opacity-50 shadow-md shadow-orange-500/20"
                    >
                      <Send size={14} />
                      <span>{submitting ? "Menyimpan Log..." : "Simpan Koreksi & Audit Log"}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: AUDIT LOG */}
              {tab === "audit" && (
                <div className="space-y-3">
                  {!detail.corrections || detail.corrections.length === 0 ? (
                    <div className="py-12 text-center text-stone-400 text-xs">
                      Belum ada catatan koreksi untuk data presensi ini.
                    </div>
                  ) : (
                    detail.corrections.map((log) => (
                      <div
                        key={log.id}
                        className="bg-orange-50/30 border border-orange-200 rounded-2xl p-4 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between text-stone-500 pb-2 border-b border-orange-100">
                          <span className="font-bold text-orange-600 flex items-center gap-1.5">
                            <User size={13} />
                            {log.mentor_name}
                          </span>
                          <span className="text-[11px] font-mono">
                            {new Date(log.created_at).toLocaleString("id-ID")}
                          </span>
                        </div>

                        <div className="text-stone-700">
                          <span className="text-stone-500 font-semibold">Alasan: </span>
                          <span className="font-bold text-stone-900">
                            &ldquo;{log.reason}&rdquo;
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                          <div className="bg-white p-2.5 rounded-xl border border-red-100">
                            <span className="text-red-600 block font-bold">Status Lama:</span>
                            <span className="font-semibold text-stone-800">{log.old_value?.status || "--"}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                            <span className="text-emerald-600 block font-bold">Status Baru:</span>
                            <span className="font-semibold text-stone-800">{log.new_value?.status || "--"}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lightbox Zoom */}
      {zoomedPhoto && (
        <div
          onClick={() => setZoomedPhoto(null)}
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
        >
          <img
            src={zoomedPhoto}
            alt="Zoomed Photo"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
