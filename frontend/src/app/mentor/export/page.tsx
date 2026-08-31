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

      const url = `/api/export/csv?${params.toString()}`;

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

      setMessage({ type: "success", text: "Laporan berhasil diunduh! File CSV sudah tersimpan di komputer Anda." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Gagal mengunduh file laporan" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 pb-12 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/mentor"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Export Laporan Presensi</h1>
          <p className="text-xs text-slate-500">
            Unduh data presensi magang dalam format CSV (Microsoft Excel ready)
          </p>
        </div>
      </div>

      {/* Feedback Message */}
      {message && (
        <div
          className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-xs animate-in fade-in ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200/80 text-rose-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Export Form Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        {/* Info Banner */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
          <FileText size={16} className="text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-900">Format Laporan CSV:</span> File CSV yang
            diunduh berisi kolom Nama Peserta, Universitas, Jurusan, Tanggal, Status, Jam Masuk,
            Jam Pulang, Jarak GPS, dan Catatan (UTF-8 BOM).
          </div>
        </div>

        {/* Form Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar size={13} className="text-indigo-600" />
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 font-medium transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar size={13} className="text-indigo-600" />
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 font-medium transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Users size={13} className="text-indigo-600" />
            Filter Peserta Magang (Opsional)
          </label>
          <div className="relative">
            <Filter size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedIntern}
              onChange={(e) => setSelectedIntern(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-indigo-500 appearance-none cursor-pointer transition-all"
            >
              <option value="">Semua Peserta Magang</option>
              {interns.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} — {i.university}
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
              ▼
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleExportCSV}
            disabled={loading}
            className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 active:scale-[0.99]"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
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
