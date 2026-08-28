"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Lock, Mail, ArrowRight, AlertCircle, UserPlus, HelpCircle } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email dan password wajib diisi");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Email atau password salah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-6">
      <div className="w-full max-w-md">
        {/* Branding Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white p-2 border border-orange-200/80 shadow-xl shadow-orange-500/10 mb-4">
            <img
              src="/logo.webp"
              alt="Logo BPS Jeneponto"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            Presensi Magang
          </h1>
          <p className="text-xs text-orange-600 font-bold mt-1">
            Badan Pusat Statistik Kabupaten Jeneponto
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white border border-orange-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-orange-500/5">
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-center gap-3 text-red-700 text-xs animate-in fade-in">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Alamat Email
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
                  placeholder="nama@bps.go.id"
                  className="w-full bg-orange-50/40 border border-orange-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-stone-700">
                  Kata Sandi
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline"
                >
                  Lupa Kata Sandi?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-orange-50/40 border border-orange-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Registration Link */}
          <div className="mt-6 pt-6 border-t border-orange-100 text-center">
            <p className="text-xs text-stone-600">
              Belum punya akun pemagang?{" "}
              <Link
                href="/register"
                className="font-extrabold text-orange-600 hover:text-orange-700 hover:underline inline-flex items-center gap-1"
              >
                <span>Daftar Sekarang</span>
                <ArrowRight size={12} />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
