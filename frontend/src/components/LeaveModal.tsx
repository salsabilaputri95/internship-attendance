"use client";

import React, { useState, useEffect } from "react";
import { X, FileText, Send, AlertCircle, CheckCircle2, Calendar, Stethoscope, HeartPulse } from "lucide-react";
import { api } from "@/lib/api";

interface LeaveModalProps {
  isOpen: boolean;
  initialType?: "izin" | "sakit";
  onClose: () => void;
  onSuccess: () => void;
}

export function LeaveModal({ isOpen, initialType = "izin", onClose, onSuccess }: LeaveModalProps) {
  const [activeTab, setActiveTab] = useState<"izin" | "sakit">(initialType);
  const [category, setCategory] = useState("Sakit (Rawat Jalan)");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialType);
      if (initialType === "sakit") {
        setCategory("Sakit (Rawat Jalan)");
      } else {
        setCategory("Urusan Kampus / Akademik");
      }
      setError(null);
      setIsSuccess(false);
    }
  }, [isOpen, initialType]);

  const handleTabChange = (tab: "izin" | "sakit") => {
    setActiveTab(tab);
    if (tab === "sakit") {
      setCategory("Sakit (Rawat Jalan)");
    } else {
      setCategory("Urusan Kampus / Akademik");
    }
    setError(null);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError(`Alasan ${activeTab === "sakit" ? "sakit" : "izin"} wajib diisi`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.post("/attendance/leave", {
        date,
        type: activeTab === "sakit" ? "SAKIT" : "IZIN",
        category,
        reason: reason.trim(),
      });

      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setReason("");
          onSuccess();
          onClose();
        }, 1200);
      } else {
        throw new Error(res.message || `Gagal mengajukan ${activeTab === "sakit" ? "sakit" : "izin"}`);
      }
    } catch (err: any) {
      setError(err.message || `Gagal mengirim pengajuan ${activeTab === "sakit" ? "sakit" : "izin"}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xl text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
          <div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                activeTab === "sakit"
                  ? "bg-purple-100 text-purple-700 border border-purple-200"
                  : "bg-indigo-50 text-indigo-700 border border-indigo-200"
              }`}
            >
              {activeTab === "sakit" ? "Form Keterangan Sakit" : "Form Izin Tidak Hadir"}
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              {activeTab === "sakit" ? "Pengajuan Keterangan Sakit" : "Pengajuan Izin Kegiatan"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => handleTabChange("izin")}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "izin"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText size={13} />
            <span>Ajukan Izin</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("sakit")}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "sakit"
                ? "bg-white text-purple-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Stethoscope size={13} />
            <span>Keterangan Sakit</span>
          </button>
        </div>

        {error && (
          <div className="mb-3.5 bg-rose-50 border border-rose-200/80 rounded-xl p-2.5 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle size={15} className="text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="py-6 flex flex-col items-center justify-center gap-2.5 text-center animate-in zoom-in-95">
            <div className={`w-12 h-12 rounded-full ${activeTab === "sakit" ? "bg-purple-50 text-purple-600 border border-purple-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"} flex items-center justify-center shadow-2xs`}>
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {activeTab === "sakit" ? "Keterangan Sakit Berhasil Dicatat!" : "Pengajuan Izin Berhasil Dicatat!"}
            </h3>
            <p className="text-xs text-slate-500">
              Status kehadiran Anda telah diperbarui menjadi <strong>{activeTab === "sakit" ? "SAKIT" : "IZIN"}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar size={13} className={activeTab === "sakit" ? "text-purple-600" : "text-indigo-600"} />
                Tanggal {activeTab === "sakit" ? "Sakit" : "Izin"}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 font-medium transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori {activeTab === "sakit" ? "Sakit" : "Izin"}
              </label>
              {activeTab === "sakit" ? (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-purple-500 transition-all cursor-pointer"
                >
                  <option value="Sakit (Rawat Jalan)">Sakit (Rawat Jalan / Istirahat di Rumah)</option>
                  <option value="Sakit (Rawat Inap / RS)">Sakit (Rawat Inap / Rumah Sakit)</option>
                  <option value="Demam / Flu / Fisik">Demam / Flu / Sakit Fisik</option>
                  <option value="Kontrol Dokter / Berobat">Kontrol Dokter / Jadwal Berobat</option>
                  <option value="Lainnya">Lainnya (Surat Dokter Menyusul)</option>
                </select>
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="Urusan Kampus / Akademik">Urusan Kampus / Bimbingan Skripsi / Ujian</option>
                  <option value="Tugas / Dinas Luar">Tugas / Dinas Luar BPS</option>
                  <option value="Keperluan Keluarga">Keperluan Keluarga Mendesak</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <FileText size={13} className={activeTab === "sakit" ? "text-purple-600" : "text-indigo-600"} />
                Alasan &amp; Keterangan <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  activeTab === "sakit"
                    ? "Jelaskan kondisi sakit / diagnosa singkat (surat dokter dapat diserahkan ke pembimbing)..."
                    : "Contoh: Mengikuti ujian skripsi / seminar di kampus..."
                }
                rows={3}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors border border-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`py-2 px-4 rounded-xl text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 ${
                  activeTab === "sakit" ? "bg-purple-700 hover:bg-purple-800" : "bg-slate-900 hover:bg-slate-800"
                }`}
              >
                <Send size={13} />
                <span>{submitting ? "Mengirim..." : `Kirim Pengajuan ${activeTab === "sakit" ? "Sakit" : "Izin"}`}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
