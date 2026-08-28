"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  User,
  Mail,
  Lock,
  School,
  BookOpen,
  Phone,
  Briefcase,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

const POSISI_OPTIONS = [
  "Asisten Pengelola Keuangan",
  "Asisten Statistisi",
  "Asisten Pranata Komputer",
  "Asisten Pengelola BMN",
  "Asisten Publisitas dan Kehumasan",
  "Asisten Arsiparis",
  "Staf Umum",
];

export default function RegisterPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    university: "",
    major: "",
    position: "Asisten Statistisi",
    phone: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.university ||
      !formData.major ||
      !formData.position
    ) {
      setError("Semua kolom wajib diisi dengan lengkap");
      return;
    }

    if (formData.password.length < 6) {
      setError("Kata sandi minimal 6 karakter");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Combine major and position for seamless display across all views
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        university: formData.university.trim(),
        major: `${formData.major.trim()} (${formData.position})`,
        phone: formData.phone.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
      };

      const res = await api.post("/auth/register", payload);
      if (res.success && res.data) {
        api.setToken(res.data.token);
        await refreshProfile();
        router.push("/dashboard");
      } else {
        throw new Error(res.message || "Pendaftaran gagal");
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat mendaftar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-6">
      <div className="w-full max-w-lg">
        {/* Branding Card Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white p-1.5 border border-orange-200/80 shadow-lg shadow-orange-500/10 mb-3">
            <img
              src="/logo.webp"
              alt="Logo BPS Jeneponto"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            Pendaftaran Peserta Magang
          </h1>
          <p className="text-xs text-orange-600 font-bold mt-1">
            Buat akun baru untuk mulai melakukan presensi di BPS Jeneponto
          </p>
        </div>

        {/* Register Box */}
        <div className="bg-white border border-orange-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-orange-500/5">
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-center gap-3 text-red-700 text-xs animate-in fade-in">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Contoh: Salsabila Putri"
                  required
                  className="w-full bg-orange-50/30 border border-orange-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Alamat Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="nama@email.com"
                    required
                    className="w-full bg-orange-50/30 border border-orange-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Kata Sandi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 6 karakter"
                    required
                    minLength={6}
                    className="w-full bg-orange-50/30 border border-orange-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Universitas / Sekolah <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <School size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    placeholder="Contoh: Univ Hasanuddin"
                    required
                    className="w-full bg-orange-50/30 border border-orange-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Jurusan / Program Studi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <BookOpen size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    name="major"
                    value={formData.major}
                    onChange={handleChange}
                    placeholder="Contoh: Sistem Informasi"
                    required
                    className="w-full bg-orange-50/30 border border-orange-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Posisi Magang Dropdown */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                <Briefcase size={13} className="text-orange-500" />
                <span>Posisi / Penempatan Magang</span> <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  required
                  className="w-full bg-orange-50/30 border border-orange-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 font-semibold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 appearance-none cursor-pointer"
                >
                  {POSISI_OPTIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400 text-[10px]">
                  ▼
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Nomor WhatsApp / HP
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="081234567890"
                  className="w-full bg-orange-50/30 border border-orange-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-medium"
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
                  <span>Daftar Sekarang</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-5 pt-5 border-t border-orange-100 text-center">
            <p className="text-xs text-stone-600">
              Sudah memiliki akun?{" "}
              <Link
                href="/login"
                className="font-extrabold text-orange-600 hover:text-orange-700 hover:underline"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
