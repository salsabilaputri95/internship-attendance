"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Lock, Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !newPassword || !confirmPassword) {
      setError("Semua kolom wajib diisi");
      return;
    }

    if (newPassword.length < 6) {
      setError("Kata sandi baru minimal 6 karakter");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/auth/forgot-password", {
        email: email.trim(),
        new_password: newPassword,
      });

      if (res.success) {
        setSuccessMessage("Kata sandi Anda berhasil diperbarui! Silakan masuk kembali dengan kata sandi baru.");
      } else {
        throw new Error(res.message || "Gagal mengatur ulang kata sandi");
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memproses permintaan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-100 border border-orange-200 text-orange-600 mb-3 shadow-sm">
            <KeyRound size={24} />
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            Lupa Kata Sandi
          </h1>
          <p className="text-xs text-orange-600 font-bold mt-1">
            Atur ulang kata sandi akun presensi Anda
          </p>
        </div>

        {/* Box */}
        <div className="bg-white border border-orange-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-orange-500/5">
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-center gap-3 text-red-700 text-xs animate-in fade-in">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage ? (
            <div className="py-6 flex flex-col items-center justify-center gap-3 text-center animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-200 flex items-center justify-center shadow-lg">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-base font-black text-stone-900">Kata Sandi Diperbarui!</h3>
              <p className="text-xs text-stone-600 leading-relaxed max-w-xs">
                {successMessage}
              </p>
              <Link
                href="/login"
                className="mt-3 py-2.5 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all"
              >
                <span>Masuk Sekarang</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Alamat Email Terdaftar
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    className="w-full bg-orange-50/30 border border-orange-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 karakter"
                    required
                    minLength={6}
                    className="w-full bg-orange-50/30 border border-orange-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru"
                    required
                    minLength={6}
                    className="w-full bg-orange-50/30 border border-orange-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <span>Simpan Kata Sandi Baru</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-5 pt-5 border-t border-orange-100 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-orange-600 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Kembali ke Halaman Masuk</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
