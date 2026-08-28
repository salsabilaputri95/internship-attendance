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
        }, 1500);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white border border-orange-200 rounded-3xl p-6 shadow-2xl text-stone-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-orange-100 mb-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-200">
              Form Izin
            </span>
            <h2 className="text-base font-extrabold text-stone-900 mt-1">
              Pengajuan Izin / Keterangan
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-orange-50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl p-3 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-center animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-200 flex items-center justify-center shadow-lg">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-base font-black text-stone-900">Izin Berhasil Dicatat!</h3>
            <p className="text-xs text-stone-600">
              Status kehadiran Anda hari ini telah diperbarui menjadi <strong>IZIN</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Calendar size={13} className="text-orange-500" />
                Tanggal Izin
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-orange-50/30 border border-orange-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-orange-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Kategori Izin
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-orange-50/30 border border-orange-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 font-semibold focus:outline-none focus:border-orange-500"
              >
                <option value="Sakit">Sakit / Berobat</option>
                <option value="Urusan Kampus/Akademik">Urusan Kampus / Bimbingan Skripsi / Ujian</option>
                <option value="Dinas Luar">Tugas / Dinas Luar BPS</option>
                <option value="Keperluan Keluarga">Keperluan Keluarga Mendesak</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <FileText size={13} className="text-orange-500" />
                Alasan &amp; Keterangan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Mengikuti ujian proposal skripsi di kampus Universitas Hasanuddin..."
                rows={3}
                required
                className="w-full bg-orange-50/30 border border-orange-200 rounded-xl p-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
              >
                <Send size={14} />
                <span>{submitting ? "Mengirim..." : "Kirim Pengajuan Izin"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
