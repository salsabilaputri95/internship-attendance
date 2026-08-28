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
  const [step, setStep] = useState<"camera" | "notes" | "submitting" | "success">("notes");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
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

      if (photoFile) {
        formData.append("photo", photoFile);
      }

      const endpoint = isCheckIn ? "/attendance/check-in" : "/attendance/check-out";
      const res = await api.post(endpoint, formData);

      if (res.success) {
        setStep("success");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        throw new Error(res.message || "Gagal melakukan presensi");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat memproses presensi");
      setStep("notes");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-orange-200 rounded-3xl p-5 sm:p-6 shadow-2xl text-stone-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-orange-100 mb-4">
          <div>
            <span
              className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                isCheckIn
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-orange-50 text-orange-700 border border-orange-200"
              }`}
            >
              {isCheckIn ? "Check-In Cepat" : "Check-Out Cepat"}
            </span>
            <h2 className="text-base font-extrabold text-stone-900 mt-1">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-orange-50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Geofence Warning if Outside */}
        {isOutside && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-start gap-3 text-red-700">
            <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold text-red-800">Peringatan Lokasi:</span> Anda berada{" "}
              <strong className="text-stone-900">{distance?.toFixed(0)} meter</strong> dari kantor (maksimal{" "}
              {radius} meter). Presensi mungkin ditolak oleh sistem.
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Step: Instant Confirmation Screen */}
        {step === "notes" && (
          <div className="space-y-4">
            {/* Info Grid: Waktu Presensi & Jarak GPS */}
            <div className="grid grid-cols-2 gap-3">
              {/* Box Waktu Kehadiran */}
              <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-3.5 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-stone-600 text-xs font-semibold mb-1">
                  <Clock size={14} className="text-orange-500" />
                  <span>Waktu Presensi</span>
                </div>
                <div className="font-mono font-black text-sm text-stone-900">
                  {currentTime || "--:--:--"} <span className="text-[10px] text-stone-500 font-sans font-semibold">WITA</span>
                </div>
              </div>

              {/* Box Jarak GPS */}
              <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-3.5 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-stone-600 text-xs font-semibold mb-1">
                  <MapPin size={14} className="text-orange-500" />
                  <span>Jarak ke Kantor</span>
                </div>
                <div className="font-black text-sm text-orange-600">
                  {distance !== null ? `${distance.toFixed(0)} meter` : "--"}
                </div>
              </div>
            </div>

            {/* KONDISI: Catatan hanya muncul jika Absen Masuk dan lewat dari jam 07:30 WITA */}
            {isCheckIn && isPast730 && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold">
                  <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                  <span>Alasan Keterlambatan (&gt; 07:30 WITA)</span>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tuliskan alasan/keterangan keterlambatan Anda..."
                  rows={2}
                  className="w-full bg-amber-50/30 border border-amber-300 rounded-xl p-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>
            )}

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-orange-50 hover:bg-orange-100 text-stone-700 text-xs font-bold transition-colors border border-orange-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/25 active:scale-[0.98] bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                <Send size={14} />
                <span>Konfirmasi {title}</span>
              </button>
            </div>
          </div>
        )}

        {/* Step: Submitting Loading */}
        {step === "submitting" && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full border-3 border-orange-200 border-t-orange-500 animate-spin" />
            <p className="text-sm font-extrabold text-stone-900">Menyimpan Presensi...</p>
            <p className="text-xs text-stone-500">Memvalidasi jam kehadiran dan koordinat GPS</p>
          </div>
        )}

        {/* Step: Success Screen */}
        {step === "success" && (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-200 flex items-center justify-center shadow-lg">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-lg font-black text-stone-900">Presensi Berhasil!</h3>
            <p className="text-xs text-stone-600">
              {isCheckIn
                ? "Absen masuk telah berhasil disimpan. Selamat bekerja!"
                : "Absen pulang telah berhasil disimpan. Selamat beristirahat!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
