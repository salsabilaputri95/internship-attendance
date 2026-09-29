"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  FileText,
  User,
  ShieldCheck,
  Users,
  AlertCircle,
  Save,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";

export interface UserOption {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  category: string;
  university?: string;
  major?: string;
}

export interface AttendanceItemToEdit {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  category: string;
  attendance_date: string;
  check_in?: string;
  check_in_distance?: number;
  check_out?: string;
  check_out_distance?: number;
  status: string;
  notes?: string;
}

interface AdminAttendanceModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  attendanceData?: AttendanceItemToEdit | null;
  usersList: UserOption[];
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminAttendanceModal({
  isOpen,
  mode,
  attendanceData,
  usersList,
  onClose,
  onSuccess,
}: AdminAttendanceModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState<string>("");
  const [checkInTime, setCheckInTime] = useState<string>("");
  const [checkOutTime, setCheckOutTime] = useState<string>("");
  const [distanceIn, setDistanceIn] = useState<string>("5");
  const [distanceOut, setDistanceOut] = useState<string>("5");
  const [status, setStatus] = useState<string>("HADIR");
  const [notes, setNotes] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (mode === "edit" && attendanceData) {
        setSelectedUserId(attendanceData.user_id);
        setAttendanceDate(attendanceData.attendance_date || "");
        
        // Format check-in & check-out to HH:MM if available
        if (attendanceData.check_in) {
          const d = new Date(attendanceData.check_in);
          const hh = String(d.getHours()).padStart(2, "0");
          const mm = String(d.getMinutes()).padStart(2, "0");
          setCheckInTime(`${hh}:${mm}`);
        } else {
          setCheckInTime("");
        }

        if (attendanceData.check_out) {
          const d = new Date(attendanceData.check_out);
          const hh = String(d.getHours()).padStart(2, "0");
          const mm = String(d.getMinutes()).padStart(2, "0");
          setCheckOutTime(`${hh}:${mm}`);
        } else {
          setCheckOutTime("");
        }

        setDistanceIn(
          attendanceData.check_in_distance !== undefined && attendanceData.check_in_distance !== null
            ? String(attendanceData.check_in_distance)
            : "5"
        );
        setDistanceOut(
          attendanceData.check_out_distance !== undefined && attendanceData.check_out_distance !== null
            ? String(attendanceData.check_out_distance)
            : "5"
        );
        setStatus(attendanceData.status || "HADIR");
        setNotes(attendanceData.notes || "");
        setReason("");
      } else {
        // Create mode defaults
        const today = new Date().toISOString().split("T")[0];
        setSelectedUserId(usersList.length > 0 ? usersList[0].user_id : "");
        setAttendanceDate(today);
        setCheckInTime("07:25");
        setCheckOutTime("16:00");
        setDistanceIn("5");
        setDistanceOut("5");
        setStatus("HADIR");
        setNotes("");
        setReason("");
      }
    }
  }, [isOpen, mode, attendanceData, usersList]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "create" && !selectedUserId) {
      setError("Silakan pilih peserta atau mentor terlebih dahulu.");
      return;
    }

    if (!attendanceDate) {
      setError("Tanggal absensi wajib diisi.");
      return;
    }

    if (mode === "edit" && !reason.trim()) {
      setError("Alasan koreksi/perubahan wajib diisi untuk rekam jejak audit.");
      return;
    }

    try {
      setLoading(true);

      const payloadDistIn = distanceIn ? parseFloat(distanceIn) : undefined;
      const payloadDistOut = distanceOut ? parseFloat(distanceOut) : undefined;

      if (mode === "create") {
        const res = await api.post("/admin/attendance", {
          user_id: selectedUserId,
          attendance_date: attendanceDate,
          check_in_time: checkInTime ? checkInTime : undefined,
          check_out_time: checkOutTime ? checkOutTime : undefined,
          distance_in: payloadDistIn,
          distance_out: payloadDistOut,
          status: status,
          notes: notes ? notes : undefined,
        });

        if (!res.success) {
          throw new Error(res.message || "Gagal menambahkan data absensi");
        }
      } else if (mode === "edit" && attendanceData) {
        const res = await api.put(`/admin/attendance/${attendanceData.id}`, {
          attendance_date: attendanceDate,
          check_in_time: checkInTime ? checkInTime : undefined,
          check_out_time: checkOutTime ? checkOutTime : undefined,
          distance_in: payloadDistIn,
          distance_out: payloadDistOut,
          status: status,
          notes: notes ? notes : undefined,
          reason: reason,
        });

        if (!res.success) {
          throw new Error(res.message || "Gagal memperbarui data absensi");
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const selectedUserObj = usersList.find((u) => u.user_id === selectedUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl text-slate-900 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-xs ${
              mode === "create" ? "bg-gradient-to-br from-indigo-600 to-indigo-800" : "bg-gradient-to-br from-purple-600 to-indigo-900"
            }`}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {mode === "create" ? "Tambah Data Presensi Manual" : "Edit Data Presensi"}
              </h2>
              <p className="text-xs text-slate-500">
                {mode === "create"
                  ? "Input absensi untuk Peserta Magang atau Mentor"
                  : `Koreksi data presensi ${attendanceData?.user_name || ""}`}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* User Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Pilih Pengguna (Peserta / Mentor) <span className="text-rose-500">*</span>
            </label>
            {mode === "create" ? (
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all"
              >
                <option value="" disabled>-- Pilih Peserta Magang atau Mentor --</option>
                <optgroup label="Peserta Magang">
                  {usersList
                    .filter((u) => u.role === "intern")
                    .map((u) => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.name} — {u.university || "BPS Jeneponto"} ({u.email})
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Mentor / Pembimbing">
                  {usersList
                    .filter((u) => u.role === "mentor")
                    .map((u) => (
                      <option key={u.user_id} value={u.user_id}>
                        [MENTOR] {u.name} ({u.email})
                      </option>
                    ))}
                </optgroup>
              </select>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{attendanceData?.user_name}</div>
                  <div className="text-[11px] text-slate-500">{attendanceData?.category}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  attendanceData?.user_role === "mentor"
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                }`}>
                  {attendanceData?.category}
                </span>
              </div>
            )}
          </div>

          {/* Date & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tanggal Absensi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Status Kehadiran <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
              >
                <option value="HADIR">✅ Hadir (Tepat Waktu)</option>
                <option value="TERLAMBAT">⏰ Terlambat</option>
                <option value="IZIN">📝 Izin</option>
                <option value="SAKIT">🏥 Sakit</option>
                <option value="ALPHA">❌ Alpha (Tidak Hadir)</option>
              </select>
            </div>
          </div>

          {/* Time Fields (Check In & Check Out) */}
          {(status === "HADIR" || status === "TERLAMBAT") && (
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 space-y-3">
              <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Clock size={13} className="text-indigo-600" />
                <span>Waktu & Jarak Presensi</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Jam Masuk */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Jam Masuk (WITA)
                  </label>
                  <input
                    type="time"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Jarak Masuk */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Jarak Masuk (meter)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={distanceIn}
                    onChange={(e) => setDistanceIn(e.target.value)}
                    placeholder="misal: 5"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Jam Pulang */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Jam Pulang (WITA)
                  </label>
                  <input
                    type="time"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Jarak Pulang */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Jarak Pulang (meter)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={distanceOut}
                    onChange={(e) => setDistanceOut(e.target.value)}
                    placeholder="misal: 5"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Catatan / Keterangan
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Surat dokter terlampir / Input manual sistem..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 resize-none transition-all"
            />
          </div>

          {/* Reason (Required for Edit audit trail) */}
          {mode === "edit" && (
            <div>
              <label className="block text-xs font-bold text-purple-900 mb-1.5">
                Alasan Koreksi (Audit Log) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Peserta lupa absen pulang karena server offline..."
                className="w-full bg-purple-50/50 border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-purple-400 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/15 transition-all"
              />
              <p className="text-[10px] text-purple-600 mt-1">
                Alasan ini akan disimpan secara permanen pada log riwayat perubahan absensi.
              </p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save size={14} />
              <span>{loading ? "Menyimpan..." : mode === "create" ? "Simpan Data Absensi" : "Perbarui Data"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
