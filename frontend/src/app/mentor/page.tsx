"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { AttendanceDetailModal } from "@/components/mentor/AttendanceDetailModal";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Calendar,
  Eye,
  RefreshCw,
  MapPin,
  Sparkles,
} from "lucide-react";

interface TodayStats {
  total_interns: number;
  hadir: number;
  terlambat: number;
  izin: number;
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
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 rounded-3xl p-6 shadow-xl shadow-orange-500/15 text-white">
        <div>
          <div className="flex items-center gap-2 text-orange-100 text-xs font-extrabold mb-1">
            <Sparkles size={14} className="text-amber-200" />
            <span>Panel Pengawasan Mentor BPS Jeneponto</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">
            Monitoring Presensi Magang
          </h1>
          <p className="text-xs text-orange-100 mt-1 font-medium">
            Evaluasi kehadiran real-time, inspeksi GPS, dan audit koreksi presensi.
          </p>
        </div>

        {/* Date Selector & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl px-3.5 py-2 text-white">
            <Calendar size={15} className="text-white" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>

          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-orange-100 rounded-3xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold">Total Peserta</span>
            <Users size={14} className="text-orange-500" />
          </div>
          <div className="text-2xl font-black text-stone-900">
            {stats?.total_interns || 0}
          </div>
          <div className="text-[10px] text-stone-400 font-medium mt-0.5">Peserta Aktif</div>
        </div>

        <div className="bg-white border border-emerald-100 rounded-3xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[11px] font-bold">Hadir</span>
            <CheckCircle2 size={14} />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {stats?.hadir || 0}
          </div>
          <div className="text-[10px] text-stone-400 font-medium mt-0.5">Tepat Waktu</div>
        </div>

        <div className="bg-white border border-amber-100 rounded-3xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[11px] font-bold">Terlambat</span>
            <Clock size={14} />
          </div>
          <div className="text-2xl font-black text-amber-600">
            {stats?.terlambat || 0}
          </div>
          <div className="text-[10px] text-stone-400 font-medium mt-0.5">&gt; 08:15 WITA</div>
        </div>

        <div className="bg-white border border-blue-100 rounded-3xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <span className="text-[11px] font-bold">Izin</span>
            <AlertCircle size={14} />
          </div>
          <div className="text-2xl font-black text-blue-600">
            {stats?.izin || 0}
          </div>
          <div className="text-[10px] text-stone-400 font-medium mt-0.5">Disetujui</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold">Belum Hadir</span>
            <Clock size={14} />
          </div>
          <div className="text-2xl font-black text-stone-700">
            {stats?.belum_hadir || 0}
          </div>
          <div className="text-[10px] text-stone-400 font-medium mt-0.5">Belum Absen</div>
        </div>
      </div>

      {/* Monitoring Table Container */}
      <div className="bg-white border border-orange-200/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-orange-500/5">
        {/* Table Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-5 border-b border-orange-100 mb-5">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Cari nama peserta / universitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-orange-50/30 border border-orange-200 rounded-2xl pl-10 pr-4 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={15} className="text-stone-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto bg-orange-50/30 border border-orange-200 rounded-2xl px-3 py-2 text-xs text-stone-700 font-semibold focus:outline-none focus:border-orange-500"
            >
              <option value="">Semua Status</option>
              <option value="HADIR">Hadir</option>
              <option value="TERLAMBAT">Terlambat</option>
              <option value="IZIN">Izin</option>
              <option value="BELUM_HADIR">Belum Hadir</option>
            </select>
          </div>
        </div>

        {/* Real-time Table */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-500">
            <div className="w-8 h-8 rounded-full border-3 border-orange-200 border-t-orange-500 animate-spin" />
            <p className="text-xs font-semibold">Memuat data presensi peserta...</p>
          </div>
        ) : filteredAttendances.length === 0 ? (
          <div className="py-16 text-center text-stone-400 text-xs font-medium">
            Tidak ada data presensi yang sesuai dengan filter pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-orange-100 text-stone-500 font-extrabold">
                  <th className="pb-3 px-2">Peserta Magang</th>
                  <th className="pb-3 px-2">Masuk (GPS)</th>
                  <th className="pb-3 px-2">Pulang (GPS)</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {filteredAttendances.map((item) => {
                  const isRecorded = item.id && item.id !== "00000000-0000-0000-0000-000000000000";

                  return (
                    <tr key={item.intern_id} className="hover:bg-orange-50/50 transition-colors">
                      {/* Intern Info */}
                      <td className="py-4 px-2">
                        <div className="font-extrabold text-stone-900">{item.intern_name}</div>
                        <div className="text-[11px] text-stone-500 truncate max-w-[200px] font-medium">
                          {item.intern_university} • {item.intern_major}
                        </div>
                      </td>

                      {/* Check In */}
                      <td className="py-4 px-2">
                        <div className="font-mono font-bold text-stone-900">
                          {item.check_in
                            ? new Date(item.check_in).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "--:--"}
                        </div>
                        {item.check_in && (
                          <div className="text-[10px] text-orange-600 flex items-center gap-1 font-semibold">
                            <MapPin size={10} />
                            {item.check_in_distance?.toFixed(0)}m
                          </div>
                        )}
                      </td>

                      {/* Check Out */}
                      <td className="py-4 px-2">
                        <div className="font-mono font-bold text-stone-900">
                          {item.check_out
                            ? new Date(item.check_out).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "--:--"}
                        </div>
                        {item.check_out && (
                          <div className="text-[10px] text-orange-600 flex items-center gap-1 font-semibold">
                            <MapPin size={10} />
                            {item.check_out_distance?.toFixed(0)}m
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-2">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            item.status === "HADIR"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : item.status === "TERLAMBAT"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : item.status === "IZIN"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-stone-100 text-stone-600 border border-stone-200"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-2 text-right">
                        {isRecorded ? (
                          <button
                            onClick={() => handleOpenDetail(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 font-extrabold text-[11px] transition-colors shadow-sm"
                          >
                            <Eye size={12} />
                            <span>Detail</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-stone-400 italic">Belum Ada Data</span>
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
