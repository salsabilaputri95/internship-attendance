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
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/mentor"
            className="p-2.5 rounded-2xl bg-white border border-orange-200 text-stone-700 hover:text-orange-600 transition-colors shadow-sm"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-stone-900">Daftar Peserta Magang</h1>
            <p className="text-xs text-orange-600 font-bold">
              Data induk peserta magang aktif di BPS Kabupaten Jeneponto
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Cari nama peserta, universitas, atau jurusan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-orange-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={15} className="text-stone-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-orange-200 rounded-2xl px-3 py-2.5 text-xs text-stone-700 font-semibold focus:outline-none focus:border-orange-500 shadow-sm"
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
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-500">
          <div className="w-8 h-8 rounded-full border-3 border-orange-200 border-t-orange-500 animate-spin" />
          <p className="text-xs font-semibold">Memuat data peserta magang...</p>
        </div>
      ) : filteredInterns.length === 0 ? (
        <div className="bg-white border border-orange-200 rounded-3xl p-8 text-center text-stone-400 text-xs shadow-sm">
          Tidak ada data peserta magang yang ditemukan.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredInterns.map((intern) => (
            <div
              key={intern.id}
              className="bg-white border border-orange-200/80 rounded-3xl p-5 shadow-md shadow-orange-500/5 flex flex-col justify-between hover:border-orange-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 border border-orange-300 flex items-center justify-center text-white font-black text-base shadow-sm">
                      {intern.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-stone-900">{intern.name}</h3>
                      <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5 font-medium">
                        <Mail size={11} className="text-orange-500" />
                        {intern.email}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black capitalize ${
                      intern.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {intern.status}
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-orange-100 text-xs text-stone-600">
                  <div className="flex items-center gap-2">
                    <School size={13} className="text-orange-500 shrink-0" />
                    <span>
                      {intern.university} —{" "}
                      <strong className="text-stone-800 font-bold">{intern.major}</strong>
                    </span>
                  </div>

                  {intern.phone && (
                    <div className="flex items-center gap-2 text-stone-500">
                      <Phone size={13} className="text-orange-500 shrink-0" />
                      <span>{intern.phone}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-stone-500">
                    <Calendar size={13} className="text-orange-500 shrink-0" />
                    <span>
                      Periode: {intern.start_date} s/d {intern.end_date}
                    </span>
                  </div>

                  {intern.supervisor_name && (
                    <div className="flex items-center gap-2 text-stone-500 pt-1">
                      <UserCheck size={13} className="text-orange-600 shrink-0" />
                      <span>Pembimbing: <strong className="text-stone-700">{intern.supervisor_name}</strong></span>
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
