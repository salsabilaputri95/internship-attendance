"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { AttendanceDetailModal } from "@/components/mentor/AttendanceDetailModal";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  Calendar,
  Eye,
  RefreshCw,
  MapPin,
  Sparkles,
  HeartPulse,
} from "lucide-react";

interface TodayStats {
  total_interns: number;
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  alpha: number;
  belum_hadir: number;
}

interface AttendanceItem {
  id: string;
  intern_id: string;
  attendance_date: string;
  check_in?: string;
  check_in_distance?: number;
  check_in_photo_url?: string;
  check_out?: string;
  check_out_distance?: number;
  check_out_photo_url?: string;
  status: string;
  notes?: string;
  intern_name: string;
  intern_university: string;
  intern_major: string;
}

interface DashboardResponse {
  date: string;
  stats: TodayStats;
  attendances: AttendanceItem[];
}

export default function MentorDashboardPage() {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAttendanceId, setSelectedAttendanceId] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<DashboardResponse>(`/mentor/dashboard?date=${selectedDate}`);
      if (res.success && res.data) {
        setDashboardData(res.data);
      }
    } catch (err: any) {
      console.error("Gagal mengambil data dashboard mentor:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleOpenDetail = (item: AttendanceItem) => {
    if (item.id && item.id !== "00000000-0000-0000-0000-000000000000") {
      setSelectedAttendanceId(item.id);
      setDetailModalOpen(true);
    } else {
      alert("Peserta belum melakukan absensi pada tanggal ini.");
    }
  };

  const filteredAttendances = (dashboardData?.attendances || []).filter((item) => {
    const matchSearch =
      item.intern_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.intern_university.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "" || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = dashboardData?.stats;

  return (
    <div className="space-y-5 pb-12">
      {/* Top Banner (Clean Dark Slate Card) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xs">
        <div>
          <div className="flex items-center gap-1.5 text-indigo-300 text-xs font-semibold mb-1">
            <Sparkles size={13} className="text-indigo-400" />
            <span>Panel Pengawasan Mentor BPS Jeneponto</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">
            Monitoring Presensi Magang
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluasi kehadiran real-time, inspeksi GPS, dan audit koreksi presensi.
          </p>
        </div>

        {/* Date Selector & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-1.5 text-white">
            <Calendar size={14} className="text-indigo-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>

          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700/80 text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-0.5">
            <span className="text-[11px] font-semibold">Total Peserta</span>
            <Users size={13} className="text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {stats?.total_interns || 0}
          </div>
          <div className="text-[10px] text-slate-400 font-medium">Peserta Aktif</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 mb-0.5">
            <span className="text-[11px] font-semibold">Hadir</span>
            <CheckCircle2 size={13} className="text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-600">
            {stats?.hadir || 0}
          </div>
          <div className="text-[10px] text-slate-400 font-medium">Tepat Waktu</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 mb-0.5">
            <span className="text-[11px] font-semibold">Terlambat</span>
            <Clock size={13} className="text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-600">
            {stats?.terlambat || 0}
          </div>
          <div className="text-[10px] text-slate-400 font-medium">&gt; 07:30 WITA</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-700 mb-0.5">
            <span className="text-[11px] font-semibold">Izin</span>
            <AlertCircle size={13} className="text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-indigo-600">
            {stats?.izin || 0}
          </div>
          <div className="text-[10px] text-slate-400 font-medium">Disetujui</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-rose-700 mb-0.5">
            <span className="text-[11px] font-semibold">Alpha</span>
            <XCircle size={13} className="text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-600">
            {stats?.alpha || 0}
          </div>
          <div className="text-[10px] text-slate-400 font-medium">Tanpa Keterangan</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-purple-700 mb-0.5">
            <span className="text-[11px] font-semibold">Sakit</span>
            <HeartPulse size={13} className="text-purple-600" />
          </div>
          <div className="text-xl font-bold text-purple-600">
            {stats?.sakit || 0}
          </div>
          <div className="text-[10px] text-slate-400 font-medium">Keterangan Sakit</div>
        </div>
      </div>

      {/* Monitoring Table Container */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
        {/* Table Filters (Search, Date Picker, Status) */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-2.5 pb-4 border-b border-slate-100 mb-4">
          <div className="relative w-full md:w-72">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama peserta / universitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start sm:justify-end">
            {/* Tanggal Presensi Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700">
              <Calendar size={13} className="text-indigo-600 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer"
              />
            </div>

            {/* Status Dropdown */}
            <div className="flex items-center gap-1.5">
              <Filter size={13} className="text-slate-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:bg-white focus:border-indigo-500 cursor-pointer"
              >
                <option value="">Semua Status</option>
                <option value="HADIR">Hadir</option>
                <option value="TERLAMBAT">Terlambat</option>
                <option value="IZIN">Izin</option>
                <option value="SAKIT">Sakit</option>
                <option value="ALPHA">Alpha</option>
                <option value="BELUM_HADIR">Belum Hadir</option>
              </select>
            </div>
          </div>
        </div>

        {/* Real-time Table */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-slate-400">
            <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
            <p className="text-xs font-medium">Memuat data presensi peserta...</p>
          </div>
        ) : filteredAttendances.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-medium">
            Tidak ada data presensi yang sesuai dengan filter pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                  <th className="pb-3 px-2">Peserta Magang</th>
                  <th className="pb-3 px-2">Masuk (GPS)</th>
                  <th className="pb-3 px-2">Pulang (GPS)</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendances.map((item) => {
                  const isRecorded = item.id && item.id !== "00000000-0000-0000-0000-000000000000";

                  return (
                    <tr key={item.intern_id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Intern Info */}
                      <td className="py-3.5 px-2">
                        <div className="font-semibold text-slate-900">{item.intern_name}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                          {item.intern_university} • {item.intern_major}
                        </div>
                      </td>

                      {/* Check In */}
                      <td className="py-3.5 px-2">
                        <div className="font-mono font-bold text-slate-900">
                          {item.check_in
                            ? new Date(item.check_in).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "--:--"}
                        </div>
                        {item.check_in && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <MapPin size={10} className="text-slate-400" />
                            {item.check_in_distance?.toFixed(0)}m
                          </div>
                        )}
                      </td>

                      {/* Check Out */}
                      <td className="py-3.5 px-2">
                        <div className="font-mono font-bold text-slate-900">
                          {item.check_out
                            ? new Date(item.check_out).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "--:--"}
                        </div>
                        {item.check_out && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <MapPin size={10} className="text-slate-400" />
                            {item.check_out_distance?.toFixed(0)}m
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-2">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.status === "HADIR"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : item.status === "TERLAMBAT"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : item.status === "IZIN"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : item.status === "SAKIT"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : item.status === "ALPHA"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-2 text-right">
                        {isRecorded ? (
                          <button
                            onClick={() => handleOpenDetail(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 font-medium text-[11px] transition-colors"
                          >
                            <Eye size={12} />
                            <span>Detail</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Belum Ada Data</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Attendance Detail & Correction Modal */}
      <AttendanceDetailModal
        isOpen={detailModalOpen}
        attendanceId={selectedAttendanceId}
        onClose={() => setDetailModalOpen(false)}
        onSuccess={fetchDashboard}
      />
    </div>
  );
}
