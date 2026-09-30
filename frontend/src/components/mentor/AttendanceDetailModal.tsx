"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Image as ImageIcon,
  Edit3,
  AlertCircle,
  CheckCircle2,
  Send,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { api } from "@/lib/api";

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
  const [tab, setTab] = useState<"detail" | "correct">("detail");
  const [detail, setDetail] = useState<AttendanceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Correction Form State
  const [newStatus, setNewStatus] = useState<string>("");
  const [checkInTime, setCheckInTime] = useState<string>("");
  const [checkOutTime, setCheckOutTime] = useState<string>("");
  const [newNotes, setNewNotes] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);

  // Auto-adjust status based on check-in time
  const handleCheckInTimeChange = (timeVal: string) => {
    setCheckInTime(timeVal);
    if (!timeVal.trim()) {
      if (newStatus === "HADIR" || newStatus === "TERLAMBAT") {
        setNewStatus("ALPHA");
      }
    } else {
      if (timeVal <= "07:30") {
        setNewStatus("HADIR");
      } else {
        setNewStatus("TERLAMBAT");
      }
    }
  };

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

        if (res.data.check_in) {
          const d = new Date(res.data.check_in);
          const hh = String(d.getHours()).padStart(2, "0");
          const mm = String(d.getMinutes()).padStart(2, "0");
          setCheckInTime(`${hh}:${mm}`);
        } else {
          setCheckInTime("");
        }

        if (res.data.check_out) {
          const d = new Date(res.data.check_out);
          const hh = String(d.getHours()).padStart(2, "0");
          const mm = String(d.getMinutes()).padStart(2, "0");
          setCheckOutTime(`${hh}:${mm}`);
        } else {
          setCheckOutTime("");
        }
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
        check_in: checkInTime ? checkInTime : "",
        check_out: checkOutTime ? checkOutTime : "",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl text-slate-900 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                Inspeksi Presensi
              </span>
              {detail && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    detail.status === "HADIR"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : detail.status === "TERLAMBAT"
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : detail.status === "IZIN"
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {detail.status}
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              {detail?.intern_name || "Detail Presensi Peserta"}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {detail?.intern_university} • {detail?.intern_major}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-100 bg-slate-50/40 px-4 pt-1.5 gap-1.5">
          <button
            onClick={() => setTab("detail")}
            className={`flex items-center gap-1.5 pb-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
              tab === "detail"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Clock size={13} />
            Rincian & GPS
          </button>
          <button
            onClick={() => setTab("correct")}
            className={`flex items-center gap-1.5 pb-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
              tab === "correct"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Edit3 size={13} />
            Koreksi Presensi
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-2.5 flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle size={15} className="text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2 text-emerald-700 text-xs animate-in zoom-in-95">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {loading ? (
            <div className="py-14 flex flex-col items-center justify-center gap-2 text-slate-400">
              <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
              <p className="text-xs font-medium">Memuat data presensi...</p>
            </div>
          ) : !detail ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              Peserta belum melakukan presensi pada tanggal ini.
            </div>
          ) : (
            <>
              {/* TAB 1: DETAIL & GPS */}
              {tab === "detail" && (
                <div className="space-y-3.5">
                  {/* Side-by-Side Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Check In Card */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                            <LogIn size={14} className="text-emerald-600" />
                            Absen Masuk
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                            {detail.check_in ? "Tercatat" : "Belum Absen"}
                          </span>
                        </div>

                        <div className="text-xl font-bold text-slate-900 font-mono my-1">
                          {detail.check_in
                            ? new Date(detail.check_in).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              }) + " WITA"
                            : "--:--"}
                        </div>
                      </div>

                      {detail.check_in && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 text-xs text-slate-600 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-slate-400 font-medium">
                              <MapPin size={12} className="text-emerald-600" />
                              Jarak ke Kantor:
                            </span>
                            <span className="font-semibold text-slate-900">
                              {detail.check_in_distance?.toFixed(0)} meter
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>Akurasi GPS:</span>
                            <span>±{detail.check_in_accuracy?.toFixed(0)} meter</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Check Out Card */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-indigo-800 flex items-center gap-1.5">
                            <LogOut size={14} className="text-indigo-600" />
                            Absen Pulang
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100/80 text-indigo-800 border border-indigo-200">
                            {detail.check_out ? "Tercatat" : "Belum Absen"}
                          </span>
                        </div>

                        <div className="text-xl font-bold text-slate-900 font-mono my-1">
                          {detail.check_out
                            ? new Date(detail.check_out).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              }) + " WITA"
                            : "--:--"}
                        </div>
                      </div>

                      {detail.check_out && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 text-xs text-slate-600 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-slate-400 font-medium">
                              <MapPin size={12} className="text-indigo-600" />
                              Jarak ke Kantor:
                            </span>
                            <span className="font-semibold text-slate-900">
                              {detail.check_out_distance?.toFixed(0)} meter
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>Akurasi GPS:</span>
                            <span>±{detail.check_out_accuracy?.toFixed(0)} meter</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes info */}
                  {detail.notes && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-800">
                      <div className="text-slate-500 font-semibold mb-1 flex items-center gap-1.5">
                        <AlertCircle size={13} className="text-amber-600" />
                        Catatan / Alasan Peserta:
                      </div>
                      <p className="text-slate-700 italic bg-white p-2 rounded-lg border border-slate-200">
                        &ldquo;{detail.notes}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: FORM KOREKSI */}
              {tab === "correct" && (
                <form onSubmit={handleCorrectionSubmit} className="space-y-3.5">
                  <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-amber-900 text-xs flex items-start gap-2">
                    <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-amber-900">Perhatian:</span> Perubahan
                      data presensi akan langsung diperbarui pada sistem.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status Kehadiran
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewStatus(val);
                        if (val === "IZIN" || val === "SAKIT" || val === "ALPHA") {
                          setCheckInTime("");
                          setCheckOutTime("");
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 font-bold transition-all"
                    >
                      <option value="HADIR">✅ HADIR (Tepat Waktu)</option>
                      <option value="TERLAMBAT">⏰ TERLAMBAT (&gt; 07:30 WITA)</option>
                      <option value="IZIN">📝 IZIN</option>
                      <option value="SAKIT">🏥 SAKIT</option>
                      <option value="ALPHA">❌ ALPHA (Tidak Hadir)</option>
                    </select>
                  </div>

                  {/* Jam Masuk & Jam Pulang - Only for HADIR or TERLAMBAT */}
                  {(newStatus === "HADIR" || newStatus === "TERLAMBAT") && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 animate-in fade-in duration-150">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                            <Clock size={12} className="text-emerald-600" />
                            Jam Masuk (WITA)
                          </label>
                          {checkInTime && (
                            <button
                              type="button"
                              onClick={() => handleCheckInTimeChange("")}
                              className="text-[10px] text-slate-400 hover:text-rose-600"
                            >
                              Kosongkan
                            </button>
                          )}
                        </div>
                        <input
                          type="time"
                          value={checkInTime}
                          onChange={(e) => handleCheckInTimeChange(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                        />
                        {checkInTime ? (
                          <p className="text-[10px] mt-1 font-medium text-slate-500">
                            {checkInTime <= "07:30" ? (
                              <span className="text-emerald-600">⚡ ≤ 07:30 WITA → Status: <b>HADIR</b></span>
                            ) : (
                              <span className="text-amber-600">⚡ &gt; 07:30 WITA → Status: <b>TERLAMBAT</b></span>
                            )}
                          </p>
                        ) : null}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                            <Clock size={12} className="text-indigo-600" />
                            Jam Pulang (WITA)
                          </label>
                          {checkOutTime && (
                            <button
                              type="button"
                              onClick={() => setCheckOutTime("")}
                              className="text-[10px] text-slate-400 hover:text-rose-600"
                            >
                              Kosongkan
                            </button>
                          )}
                        </div>
                        <input
                          type="time"
                          value={checkOutTime}
                          onChange={(e) => setCheckOutTime(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Catatan / Keterangan
                    </label>
                    <textarea
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Catatan penugasan / dispensasi khusus / alasan..."
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alasan Perubahan <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Contoh: Peserta dinas luar / konfirmasi via telepon..."
                      rows={2}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 active:scale-[0.99]"
                    >
                      <Send size={13} />
                      <span>{submitting ? "Menyimpan..." : "Simpan Perubahan Presensi"}</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
