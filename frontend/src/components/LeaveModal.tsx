"use client";

import React, { useState } from "react";
import { X, FileText, Send, AlertCircle, CheckCircle2, Calendar } from "lucide-react";
import { api } from "@/lib/api";

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LeaveModal({ isOpen, onClose, onSuccess }: LeaveModalProps) {
  const [category, setCategory] = useState("Sakit");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Alasan izin / keterangan wajib diisi");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.post("/attendance/leave", {
        date,
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
        throw new Error(res.message || "Gagal mengajukan izin");
      }
    } catch (err: any) {
      setError(err.message || "Gagal mengirim pengajuan izin");
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
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              Form Izin
            </span>
            <h2 className="text-sm font-bold text-slate-900 mt-1">
              Pengajuan Izin / Keterangan
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
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
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-2xs">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Izin Berhasil Dicatat!</h3>
            <p className="text-xs text-slate-500">
              Status kehadiran hari ini telah diperbarui menjadi <strong>IZIN</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar size={13} className="text-indigo-600" />
                Tanggal Izin
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
                Kategori Izin
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="Sakit">Sakit / Berobat</option>
                <option value="Urusan Kampus/Akademik">Urusan Kampus / Bimbingan Skripsi / Ujian</option>
                <option value="Dinas Luar">Tugas / Dinas Luar BPS</option>
                <option value="Keperluan Keluarga">Keperluan Keluarga Mendesak</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <FileText size={13} className="text-indigo-600" />
                Alasan &amp; Keterangan <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Mengikuti ujian skripsi di kampus..."
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
                className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
              >
                <Send size={13} />
                <span>{submitting ? "Mengirim..." : "Kirim Pengajuan"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
