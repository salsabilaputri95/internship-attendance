"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { InternHistoryModal } from "@/components/mentor/InternHistoryModal";
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
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  TrendingUp,
  Award,
  History,
  ChevronRight,
} from "lucide-react";

interface AttendanceSummary {
  hadir: number;
  terlambat: number;
  izin: number;
  alpha: number;
  total_working_days: number;
  attendance_rate: number;
}

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
  attendance_summary?: AttendanceSummary;
}

export default function InternsDirectoryPage() {
  const [interns, setInterns] = useState<InternItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // History Modal State
  const [selectedInternId, setSelectedInternId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialFilter, setModalInitialFilter] = useState<string>("ALL");

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

  const handleOpenHistory = (internId: string, filter: string = "ALL") => {
    setSelectedInternId(internId);
    setModalInitialFilter(filter);
    setModalOpen(true);
  };

  const filteredInterns = interns.filter((i) => {
    const matchSearch =
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.major.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "" || i.status === statusFilter;

    return matchSearch && matchStatus;
  });

  // Calculate overall statistics
  const totalInterns = interns.length;
  const activeInterns = interns.filter((i) => i.status === "active").length;
  const maxWorkingDays = interns.length > 0 
    ? Math.max(...interns.map((i) => i.attendance_summary?.total_working_days || 0)) 
    : 0;
  
  const avgAttendanceRate = interns.length > 0
    ? (interns.reduce((acc, i) => acc + (i.attendance_summary?.attendance_rate || 0), 0) / interns.length).toFixed(1)
    : "0.0";

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
              Data induk & rekapitulasi kehadiran peserta magang BPS Kabupaten Jeneponto
            </p>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-0.5">
            <span className="text-[11px] font-semibold">Total Peserta</span>
            <Users size={13} className="text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900">{totalInterns}</div>
          <div className="text-[10px] text-slate-400 font-medium">{activeInterns} Peserta Aktif</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-0.5">
            <span className="text-[11px] font-semibold">Periode Magang</span>
            <Calendar size={13} className="text-slate-400" />
          </div>
          <div className="text-xs font-bold text-slate-900 mt-1">2026-08-10 s/d 2027-02-09</div>
          <div className="text-[10px] text-slate-400 font-medium">10 Agt 2026 – 9 Feb 2027</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-600 mb-0.5">
            <span className="text-[11px] font-semibold">Hari Kerja Berjalan</span>
            <TrendingUp size={13} className="text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-800">{maxWorkingDays} <span className="text-xs font-normal text-slate-400">Hari</span></div>
          <div className="text-[10px] text-slate-400 font-medium">Senin – Jumat (Mulai 1 Sep)</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 mb-0.5">
            <span className="text-[11px] font-semibold">Rata-rata Kehadiran</span>
            <Award size={13} className="text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-600">{avgAttendanceRate}%</div>
          <div className="text-[10px] text-slate-400 font-medium">Tingkat Disiplin</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama peserta, universitas, atau jurusan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 shadow-2xs transition-all"
          />
        </div>

        {/* Status Magang Dropdown */}
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

      {/* Grid of Intern Cards with Attendance Rekap */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-slate-400">
          <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
          <p className="text-xs font-medium">Memuat data peserta magang...</p>
        </div>
      ) : filteredInterns.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-400 text-xs shadow-2xs">
          Tidak ada data peserta magang yang sesuai dengan filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredInterns.map((intern) => {
            const summary = intern.attendance_summary || {
              hadir: 0,
              terlambat: 0,
              izin: 0,
              alpha: 0,
              total_working_days: 0,
              attendance_rate: 0,
            };

            const periodDisplay = intern.start_date && intern.end_date
              ? `${intern.start_date} s/d ${intern.end_date}`
              : "2026-08-10 s/d 2027-02-09";

            return (
              <div
                key={intern.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-slate-300/90 hover:shadow-xs transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  {/* Top Row: User Avatar, Name, Email, Status */}
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center text-white font-extrabold text-sm shadow-2xs shrink-0">
                        {intern.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 truncate">{intern.name}</h3>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-medium truncate">
                          <Mail size={11} className="text-slate-400 shrink-0" />
                          <span className="truncate">{intern.email}</span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize shrink-0 ${
                        intern.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {intern.status}
                    </span>
                  </div>

                  {/* Info Metadata */}
                  <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <School size={13} className="text-indigo-600 shrink-0" />
                      <span className="truncate">
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
                        Periode: <strong className="text-slate-800 font-semibold">{periodDisplay}</strong>
                      </span>
                    </div>

                    {intern.supervisor_name && (
                      <div className="flex items-center gap-2 text-slate-500 pt-0.5">
                        <UserCheck size={13} className="text-indigo-600 shrink-0" />
                        <span>Pembimbing: <strong className="text-slate-700 font-semibold">{intern.supervisor_name}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rekapitulasi Kehadiran Premium Container (Clickable to open Detail History Modal) */}
                <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 space-y-3.5 shadow-xs transition-all">
                  {/* Header Row */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleOpenHistory(intern.id, "ALL")}
                      className="flex items-center gap-2 text-left group hover:text-indigo-600 transition-colors"
                      title="Klik untuk melihat riwayat kehadiran lengkap"
                    >
                      <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 tracking-tight flex items-center gap-1">
                        Rekap Kehadiran
                        <ChevronRight size={13} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-600 shadow-2xs">
                        {summary.total_working_days} Hari Kerja
                      </span>
                    </button>

                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-extrabold shadow-2xs">
                      <span>{summary.attendance_rate.toFixed(1)}%</span>
                      <span className="text-[10px] font-semibold text-indigo-500">Hadir</span>
                    </div>
                  </div>

                  {/* 4 Stat Tiles Grid (Clickable to Filter Modal) */}
                  <div className="grid grid-cols-4 gap-2">
                    {/* Hadir */}
                    <button
                      onClick={() => handleOpenHistory(intern.id, "HADIR")}
                      className="bg-white border border-emerald-200/80 rounded-xl py-1.5 px-2 flex flex-col items-center justify-center text-center shadow-2xs hover:border-emerald-300 hover:bg-emerald-50/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                      title="Lihat riwayat Hadir"
                    >
                      <div className="text-[10px] font-medium text-emerald-700">
                        Hadir
                      </div>
                      <div className="text-sm font-bold text-emerald-600 tracking-tight">
                        {summary.hadir}
                      </div>
                    </button>

                    {/* Terlambat */}
                    <button
                      onClick={() => handleOpenHistory(intern.id, "TERLAMBAT")}
                      className="bg-white border border-amber-200/80 rounded-xl py-1.5 px-2 flex flex-col items-center justify-center text-center shadow-2xs hover:border-amber-300 hover:bg-amber-50/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                      title="Lihat riwayat Terlambat"
                    >
                      <div className="text-[10px] font-medium text-amber-800">
                        Telat
                      </div>
                      <div className="text-sm font-bold text-amber-600 tracking-tight">
                        {summary.terlambat}
                      </div>
                    </button>

                    {/* Izin */}
                    <button
                      onClick={() => handleOpenHistory(intern.id, "IZIN")}
                      className="bg-white border border-indigo-200/80 rounded-xl py-1.5 px-2 flex flex-col items-center justify-center text-center shadow-2xs hover:border-indigo-300 hover:bg-indigo-50/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                      title="Lihat riwayat Izin"
                    >
                      <div className="text-[10px] font-medium text-indigo-700">
                        Izin
                      </div>
                      <div className="text-sm font-bold text-indigo-600 tracking-tight">
                        {summary.izin}
                      </div>
                    </button>

                    {/* Alpha */}
                    <button
                      onClick={() => handleOpenHistory(intern.id, "ALPHA")}
                      className="bg-white border border-rose-200/80 rounded-xl py-1.5 px-2 flex flex-col items-center justify-center text-center shadow-2xs hover:border-rose-300 hover:bg-rose-50/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                      title="Lihat riwayat Alpha"
                    >
                      <div className="text-[10px] font-medium text-rose-700">
                        Alpha
                      </div>
                      <div className="text-sm font-bold text-rose-600 tracking-tight">
                        {summary.alpha}
                      </div>
                    </button>
                  </div>

                  {/* Multi-Segment Composition Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden flex p-0.5 gap-0.5 shadow-inner">
                      {summary.total_working_days > 0 ? (
                        <>
                          {summary.hadir > 0 && (
                            <div
                              title={`Hadir: ${summary.hadir} hari`}
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${(summary.hadir / summary.total_working_days) * 100}%`,
                              }}
                            />
                          )}
                          {summary.terlambat > 0 && (
                            <div
                              title={`Terlambat: ${summary.terlambat} hari`}
                              className="bg-amber-400 h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${(summary.terlambat / summary.total_working_days) * 100}%`,
                              }}
                            />
                          )}
                          {summary.izin > 0 && (
                            <div
                              title={`Izin: ${summary.izin} hari`}
                              className="bg-indigo-400 h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${(summary.izin / summary.total_working_days) * 100}%`,
                              }}
                            />
                          )}
                          {summary.alpha > 0 && (
                            <div
                              title={`Alpha: ${summary.alpha} hari`}
                              className="bg-rose-400 h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${(summary.alpha / summary.total_working_days) * 100}%`,
                              }}
                            />
                          )}
                        </>
                      ) : (
                        <div className="w-full bg-slate-200 h-full rounded-full" />
                      )}
                    </div>

                    {/* Progress Bar Micro Legend & Action Link */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-0.5 pt-0.5">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          Hadir
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                          Telat
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
                          Izin
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
                          Alpha
                        </span>
                      </div>
                      
                      <button
                        onClick={() => handleOpenHistory(intern.id, "ALL")}
                        className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-0.5 hover:underline"
                      >
                        <History size={11} />
                        Lihat Riwayat
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Intern Attendance History Modal */}
      <InternHistoryModal
        isOpen={modalOpen}
        internId={selectedInternId}
        onClose={() => setModalOpen(false)}
        initialFilter={modalInitialFilter}
      />
    </div>
  );
}
