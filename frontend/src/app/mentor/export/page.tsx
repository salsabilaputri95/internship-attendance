"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Download,
  Calendar,
  Users,
  FileText,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface InternOption {
  id: string;
  name: string;
  university: string;
}

export default function ExportPage() {
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = `${today.slice(0, 7)}-01`;

  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [selectedIntern, setSelectedIntern] = useState("");
  const [interns, setInterns] = useState<InternOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchInterns = async () => {
      try {
        const res = await api.get<InternOption[]>("/mentor/interns");
        if (res.success && res.data) {
          setInterns(res.data);
        }
      } catch (err) {
        console.error("Gagal mengambil daftar peserta untuk filter export:", err);
      }
    };
    fetchInterns();
  }, []);

  const handleExportCSV = async () => {
    if (!startDate || !endDate) {
      setMessage({ type: "error", text: "Tanggal mulai dan akhir wajib diisi." });
      return;
    }
    if (startDate > endDate) {
      setMessage({ type: "error", text: "Tanggal mulai tidak boleh lebih besar dari tanggal akhir." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const token = api.getToken();
      const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
      if (selectedIntern) params.append("intern_id", selectedIntern);

      const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"}/export/csv?${params.toString()}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Gagal mengunduh laporan");
      }

      // Trigger browser download
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = `presensi-magang-bps_${startDate}_sd_${endDate}.csv`;
      anchor.click();
      URL.revokeObjectURL(downloadUrl);

      setMessage({ type: "success", text: "Laporan berhasil diunduh! File CSV sudah tersimpan di folder Downloads Anda." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Gagal mengunduh file laporan" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/mentor"
          className="p-2.5 rounded-2xl bg-white border border-orange-200 text-stone-700 hover:text-orange-600 transition-colors shadow-sm"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-black text-stone-900">Export Laporan Presensi</h1>
          <p className="text-xs text-orange-600 font-bold">
            Unduh data presensi magang dalam format CSV (kompatibel Microsoft Excel)
          </p>
        </div>
      </div>

      {/* Feedback Message */}
      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl border text-xs animate-in fade-in ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Export Form Card */}
      <div className="bg-white border border-orange-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-orange-500/5 space-y-6">
        {/* Info Banner */}
        <div className="bg-orange-50/60 border border-orange-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-stone-700">
          <FileText size={18} className="text-orange-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-stone-900">Format Laporan CSV:</span> File CSV yang
            diunduh berisi kolom: Nama Peserta, Universitas, Jurusan, Tanggal, Status, Jam Masuk,
            Jam Pulang, Jarak GPS Masuk, Jarak GPS Pulang, dan Catatan. File menggunakan encoding
            UTF-8 BOM agar terbaca langsung di Microsoft Excel.
          </div>
        </div>

        {/* Form Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Calendar size={13} className="text-orange-500" />
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-orange-50/30 border border-orange-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Calendar size={13} className="text-orange-500" />
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-orange-50/30 border border-orange-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-semibold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
            <Users size={13} className="text-orange-500" />
            Filter Peserta Magang (Opsional)
          </label>
          <div className="relative">
            <Filter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <select
              value={selectedIntern}
              onChange={(e) => setSelectedIntern(e.target.value)}
              className="w-full bg-orange-50/30 border border-orange-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-800 font-semibold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all appearance-none"
            >
              <option value="">Semua Peserta Magang</option>
              {interns.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} — {i.university}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-orange-100 flex justify-end">
          <button
            onClick={handleExportCSV}
            disabled={loading}
            className="py-3 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs flex items-center gap-2.5 shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            <span>
              {loading ? "Menyiapkan File CSV..." : "Unduh Laporan CSV (.csv)"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
