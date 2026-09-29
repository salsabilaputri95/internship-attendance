"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";

interface AdminDeleteConfirmModalProps {
  isOpen: boolean;
  item: {
    id: string;
    user_name: string;
    category: string;
    attendance_date: string;
    status: string;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminDeleteConfirmModal({
  isOpen,
  item,
  onClose,
  onSuccess,
}: AdminDeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.delete(`/admin/attendance/${item.id}`);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error(res.message || "Gagal menghapus data absensi");
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menghapus data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl text-slate-900 flex flex-col">
        {/* Header */}
        <div className="p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Presensi</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Apakah Anda yakin ingin menghapus data presensi ini secara permanen? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
        </div>

        {/* Item Summary Box */}
        <div className="px-5 py-3 mx-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Nama Pengguna:</span>
            <strong className="text-slate-900 font-bold">{item.user_name}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Kategori:</span>
            <span className="text-slate-700 font-semibold">{item.category}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Tanggal:</span>
            <span className="text-slate-700 font-mono">{item.attendance_date}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Status:</span>
            <span className="font-bold text-slate-800">{item.status}</span>
          </div>
        </div>

        {error && (
          <div className="px-5 pt-3">
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs">
              {error}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-5 flex items-center justify-end gap-2.5 mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs hover:shadow-rose-600/20 active:scale-[0.98] transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 size={14} />
            <span>{loading ? "Menghapus..." : "Ya, Hapus Data"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
