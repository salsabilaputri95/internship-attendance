"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Users,
  School,
  Phone,
  Mail,
  Calendar,
  Search,
  Filter,
  ArrowLeft,
  UserCheck,
} from "lucide-react";

interface InternItem {
  id: string;
  user_id: string;
  name: string;
  email: string;
  university: string;
  major: string;
  phone?: string;
  supervisor_name?: string;
  start_date: string;
  end_date: string;
  status: string;
}

export default function InternsDirectoryPage() {
  const [interns, setInterns] = useState<InternItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchInterns = async () => {
    try {
      setLoading(true);
      const res = await api.get<InternItem[]>("/mentor/interns");
      if (res.success && res.data) {
        setInterns(res.data);
      }
    } catch (err: any) {
      console.error("Gagal memuat daftar peserta magang:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterns();
  }, []);

  const filteredInterns = interns.filter((i) => {
    const matchSearch =
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.major.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/mentor"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Daftar Peserta Magang</h1>
            <p className="text-xs text-slate-500">
              Data induk seluruh peserta magang di BPS Kabupaten Jeneponto
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama peserta, universitas, atau posisi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 shadow-2xs transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500 shadow-2xs cursor-pointer"
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="completed">Selesai Magang</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Grid of Intern Cards */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-slate-400">
          <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
          <p className="text-xs font-medium">Memuat data peserta magang...</p>
        </div>
      ) : filteredInterns.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-400 text-xs shadow-2xs">
          Tidak ada data peserta magang yang ditemukan.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredInterns.map((intern) => (
            <div
              key={intern.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-sm">
                      {intern.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{intern.name}</h3>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                        <Mail size={11} className="text-slate-400" />
                        {intern.email}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                      intern.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {intern.status}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2.5 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <School size={13} className="text-indigo-600 shrink-0" />
                    <span>
                      {intern.university} —{" "}
                      <strong className="text-slate-800 font-semibold">{intern.major}</strong>
                    </span>
                  </div>

                  {intern.phone && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span>{intern.phone}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar size={13} className="text-slate-400 shrink-0" />
                    <span>
                      Periode: {intern.start_date} s/d {intern.end_date}
                    </span>
                  </div>

                  {intern.supervisor_name && (
                    <div className="flex items-center gap-2 text-slate-500 pt-0.5">
                      <UserCheck size={13} className="text-indigo-600 shrink-0" />
                      <span>Pembimbing: <strong className="text-slate-700">{intern.supervisor_name}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
