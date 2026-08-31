"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, Send, MapPin, Clock, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

interface AttendanceModalProps {
  isOpen: boolean;
  type: "in" | "out";
  onClose: () => void;
  onSuccess: () => void;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  distance: number | null;
  radius: number;
}

export function AttendanceModal({
  isOpen,
  type,
  onClose,
  onSuccess,
  latitude,
  longitude,
  accuracy,
  distance,
  radius,
}: AttendanceModalProps) {
  const [step, setStep] = useState<"notes" | "submitting" | "success">("notes");
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isPast730, setIsPast730] = useState<boolean>(false);

  // Live Digital Clock & 07:30 WITA Check
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );

      const hour = now.getHours();
      const minute = now.getMinutes();
      // Lewat dari jam 07:30 WITA
      setIsPast730(hour > 7 || (hour === 7 && minute > 30));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const isCheckIn = type === "in";
  const title = isCheckIn ? "Presensi Masuk" : "Presensi Pulang";
  const isOutside = distance !== null && distance > radius;

  const handleSubmit = async () => {
    if (latitude === null || longitude === null) {
      setErrorMessage("Koordinat GPS belum terdeteksi. Pastikan izin lokasi aktif.");
      return;
    }

    setStep("submitting");
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("latitude", latitude.toString());
      formData.append("longitude", longitude.toString());
      formData.append("accuracy", (accuracy || 5).toString());
      formData.append("notes", notes);

      const endpoint = isCheckIn ? "/attendance/check-in" : "/attendance/check-out";
      const res = await api.post(endpoint, formData);

      if (res.success) {
        setStep("success");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } else {
        throw new Error(res.message || "Gagal melakukan presensi");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat memproses presensi");
      setStep("notes");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xl text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
          <div>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isCheckIn
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-indigo-50 text-indigo-700 border border-indigo-200"
              }`}
            >
              {isCheckIn ? "Check-In" : "Check-Out"}
            </span>
            <h2 className="text-sm font-bold text-slate-900 mt-1">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Geofence Warning */}
        {isOutside && (
          <div className="mb-4 bg-rose-50 border border-rose-200/80 rounded-xl p-3 flex items-start gap-2 text-rose-700">
            <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-semibold text-rose-800">Peringatan:</span> Anda berada{" "}
              <strong>{distance?.toFixed(0)}m</strong> dari kantor (maks {radius}m).
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-3.5 bg-rose-50 border border-rose-200/80 rounded-xl p-2.5 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle size={15} className="text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Confirmation Screen */}
        {step === "notes" && (
          <div className="space-y-3.5">
            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
                  <Clock size={13} className="text-indigo-600" />
                  <span>Waktu Presensi</span>
                </div>
                <div className="font-mono font-bold text-sm text-slate-900">
                  {currentTime || "--:--:--"} <span className="text-[10px] text-slate-400 font-sans font-normal">WITA</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
                  <MapPin size={13} className="text-indigo-600" />
                  <span>Jarak ke Kantor</span>
                </div>
                <div className="font-bold text-sm text-slate-900">
                  {distance !== null ? `${distance.toFixed(0)} m` : "--"}
                </div>
              </div>
            </div>

            {/* Late Reason Note if > 07:30 WITA */}
            {isCheckIn && isPast730 && (
              <div className="space-y-1 animate-in fade-in duration-150">
                <div className="flex items-center gap-1 text-amber-800 text-xs font-semibold">
                  <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                  <span>Alasan Keterlambatan (&gt; 07:30 WITA)</span>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tuliskan keterangan keterlambatan Anda..."
                  rows={2}
                  className="w-full bg-slate-50 border border-amber-300/80 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all"
                />
              </div>
            )}

            <div className="pt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors border border-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-[0.99] bg-slate-900 hover:bg-slate-800"
              >
                <Send size={13} />
                <span>Konfirmasi {title}</span>
              </button>
            </div>
          </div>
        )}

        {/* Submitting Loading */}
        {step === "submitting" && (
          <div className="py-8 flex flex-col items-center justify-center gap-2.5 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
            <p className="text-xs font-bold text-slate-900">Menyimpan Presensi...</p>
            <p className="text-[11px] text-slate-400">Memvalidasi jam dan koordinat lokasi</p>
          </div>
        )}

        {/* Success Screen */}
        {step === "success" && (
          <div className="py-6 flex flex-col items-center justify-center gap-2.5 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-2xs">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Presensi Berhasil!</h3>
            <p className="text-xs text-slate-500">
              {isCheckIn
                ? "Absen masuk berhasil disimpan."
                : "Absen pulang berhasil disimpan."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
