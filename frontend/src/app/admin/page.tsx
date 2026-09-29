"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldCheck,
  Users,
  Calendar,
  Clock,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  Layers,
  FileSpreadsheet,
  Building,
} from "lucide-react";
import { api } from "@/lib/api";
import { AdminAttendanceModal, UserOption, AttendanceItemToEdit } from "@/components/admin/AdminAttendanceModal";
import { AdminDetailModal } from "@/components/admin/AdminDetailModal";
import { AdminDeleteConfirmModal } from "@/components/admin/AdminDeleteConfirmModal";

interface AdminStats {
  total_attendance: number;
  total_hadir: number;
  total_terlambat: number;
  total_izin: number;
  total_sakit: number;
  total_alpha: number;
  total_belum_hadir: number;
  total_interns: number;
  total_mentors: number;
  attendance_rate: number;
}

interface AttendanceRow {
  id: string;
  user_id: string;
  intern_id?: string;
  user_name: string;
  user_email: string;
  user_role: string;
  category: string;
  university?: string;
  major?: string;
  attendance_date: string;
  check_in?: string;
  check_in_latitude?: number;
  check_in_longitude?: number;
  check_in_accuracy?: number;
  check_in_distance?: number;
  check_in_photo_url?: string;
  check_out?: string;
  check_out_latitude?: number;
  check_out_longitude?: number;
  check_out_accuracy?: number;
  check_out_distance?: number;
  check_out_photo_url?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function SuperAdminDashboardPage() {
  const { user } = useAuth();

  // Stats & Data state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [attendanceList, setAttendanceList] = useState<AttendanceRow[]>([]);
  const [usersList, setUsersList] = useState<UserOption[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL"); // ALL, intern, mentor
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(50);

  // Modals state
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [attendanceModalOpen, setAttendanceModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<AttendanceItemToEdit | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [selectedAttendanceId, setSelectedAttendanceId] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    user_name: string;
    category: string;
    attendance_date: string;
    status: string;
  } | null>(null);

  // Fetch Stats & Users List
  const fetchStatsAndUsers = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get<AdminStats>("/admin/dashboard-stats"),
        api.get<UserOption[]>("/admin/users-list"),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (usersRes.success && usersRes.data) {
        setUsersList(usersRes.data);
      }
    } catch (err) {
      console.error("Gagal memuat statistik Super Admin:", err);
    }
  };

  // Fetch Attendance Records
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedDate) params.append("date", selectedDate);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      if (selectedCategory !== "ALL") params.append("category", selectedCategory);
      params.append("page", String(page));
      params.append("limit", String(limit));

      const res = await api.get<{
        items: AttendanceRow[];
        total_rows: number;
        page: number;
        total_pages: number;
      }>(`/admin/attendance?${params.toString()}`);

      if (res.success && res.data) {
        setAttendanceList(res.data.items || []);
        setTotalRows(res.data.total_rows || 0);
      }
    } catch (err) {
      console.error("Gagal memuat data presensi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndUsers();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [searchQuery, selectedDate, selectedStatus, selectedCategory, page]);

  // Handler open create modal
  const handleOpenCreate = () => {
    setModalMode("create");
    setEditingItem(null);
    setAttendanceModalOpen(true);
  };

  // Handler open edit modal
  const handleOpenEdit = (item: AttendanceRow) => {
    setModalMode("edit");
    setEditingItem({
      id: item.id,
      user_id: item.user_id,
      user_name: item.user_name,
      user_role: item.user_role,
      category: item.category,
      attendance_date: item.attendance_date,
      check_in: item.check_in,
      check_in_distance: item.check_in_distance,
      check_out: item.check_out,
      check_out_distance: item.check_out_distance,
      status: item.status,
      notes: item.notes,
    });
    setAttendanceModalOpen(true);
  };

  // Handler open detail modal
  const handleOpenDetail = (id: string) => {
    setSelectedAttendanceId(id);
    setDetailModalOpen(true);
  };

  // Handler open delete confirmation modal
  const handleOpenDelete = (item: AttendanceRow) => {
    setItemToDelete({
      id: item.id,
      user_name: item.user_name,
      category: item.category,
      attendance_date: item.attendance_date,
      status: item.status,
    });
    setDeleteModalOpen(true);
  };

  const handleRefresh = () => {
    fetchStatsAndUsers();
    fetchAttendance();
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "-";
    const d = new Date(timeStr);
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Makassar",
    }) + " WITA";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "HADIR":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Hadir</span>;
      case "TERLAMBAT":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Terlambat</span>;
      case "IZIN":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Izin</span>;
      case "SAKIT":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Sakit</span>;
      case "ALPHA":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Alpha</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-purple-300 shadow-inner">
            <ShieldCheck size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">Dashboard Super Admin</h1>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-extrabold border border-purple-400/30 uppercase">
                Akses Penuh
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Manajemen komprehensif seluruh data kehadiran peserta magang dan mentor BPS Jeneponto
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
            title="Refresh Data"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md hover:shadow-purple-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            <span>Tambah Data Absensi</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Absensi */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Total Absensi</span>
            <Layers size={13} className="text-slate-400" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">{stats?.total_attendance ?? 0}</div>
          <div className="text-[10px] text-slate-400 font-medium">Rekor Terdata</div>
        </div>

        {/* Hadir */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[11px] font-semibold">Hadir</span>
            <CheckCircle2 size={13} className="text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-emerald-600">{stats?.total_hadir ?? 0}</div>
          <div className="text-[10px] text-emerald-600/70 font-medium">Tepat Waktu</div>
        </div>

        {/* Terlambat */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[11px] font-semibold">Terlambat</span>
            <Clock size={13} className="text-amber-600" />
          </div>
          <div className="text-xl font-extrabold text-amber-600">{stats?.total_terlambat ?? 0}</div>
          <div className="text-[10px] text-amber-600/70 font-medium">&gt; 07:30 WITA</div>
        </div>

        {/* Izin */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-700 mb-1">
            <span className="text-[11px] font-semibold">Izin</span>
            <Calendar size={13} className="text-indigo-600" />
          </div>
          <div className="text-xl font-extrabold text-indigo-600">{stats?.total_izin ?? 0}</div>
          <div className="text-[10px] text-indigo-600/70 font-medium">Tercatat</div>
        </div>

        {/* Sakit */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-purple-700 mb-1">
            <span className="text-[11px] font-semibold">Sakit</span>
            <Award size={13} className="text-purple-600" />
          </div>
          <div className="text-xl font-extrabold text-purple-600">{stats?.total_sakit ?? 0}</div>
          <div className="text-[10px] text-purple-600/70 font-medium">Surat Dokter</div>
        </div>

        {/* Alpha */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-[11px] font-semibold">Tidak Hadir</span>
            <AlertCircle size={13} className="text-rose-600" />
          </div>
          <div className="text-xl font-extrabold text-rose-600">{stats?.total_alpha ?? 0}</div>
          <div className="text-[10px] text-rose-600/70 font-medium">Alpha / Tanpa Ket.</div>
        </div>
      </div>

      {/* Secondary Overview Strip: User Counts & Discipline Rate */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-700">
            <Users size={14} className="text-indigo-600" />
            <span>Total Pengguna:</span>
            <strong className="text-slate-900 font-bold">
              {(stats?.total_interns ?? 0) + (stats?.total_mentors ?? 0)} Orang
            </strong>
          </div>

          <span className="text-slate-300">|</span>

          <div className="flex items-center gap-2 text-slate-600">
            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[11px]">
              {stats?.total_interns ?? 0} Peserta Magang
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[11px]">
              {stats?.total_mentors ?? 0} Mentor
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">Tingkat Kehadiran Sistem:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold">
            {stats?.attendance_rate ? stats.attendance_rate.toFixed(1) : "0.0"}%
          </span>
        </div>
      </div>

      {/* Multi-filter Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3.5">
        {/* Row 1: Search & Date & Reset */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama peserta / mentor, email, jurusan, catatan..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/15 transition-all"
            />
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-purple-500"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate("")}
                className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold shrink-0"
                title="Reset Tanggal"
              >
                Semua Tgl
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Category Filter Tabs & Status Filter Buttons */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Category Tabs (Semua, Peserta Magang, Mentor) */}
          <div className="flex items-center gap-1.5 w-full lg:w-auto">
            <span className="text-xs font-bold text-slate-500 mr-1 shrink-0">Kategori:</span>
            <div className="flex items-center p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => { setSelectedCategory("ALL"); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedCategory === "ALL"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => { setSelectedCategory("intern"); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedCategory === "intern"
                    ? "bg-white text-indigo-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Peserta Magang
              </button>
              <button
                onClick={() => { setSelectedCategory("mentor"); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedCategory === "mentor"
                    ? "bg-white text-amber-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Mentor
              </button>
            </div>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1 w-full lg:w-auto">
            <span className="text-xs font-bold text-slate-500 mr-1 shrink-0">Status:</span>
            {[
              { key: "ALL", label: "Semua", activeColor: "bg-slate-900 text-white" },
              { key: "HADIR", label: "Hadir", activeColor: "bg-emerald-600 text-white" },
              { key: "TERLAMBAT", label: "Terlambat", activeColor: "bg-amber-600 text-white" },
              { key: "IZIN", label: "Izin", activeColor: "bg-indigo-600 text-white" },
              { key: "SAKIT", label: "Sakit", activeColor: "bg-purple-600 text-white" },
              { key: "ALPHA", label: "Alpha", activeColor: "bg-rose-600 text-white" },
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={() => { setSelectedStatus(btn.key); setPage(1); }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedStatus === btn.key
                    ? `${btn.activeColor} shadow-2xs`
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Attendance Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <span>Daftar Data Presensi</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 text-[10px]">
              {totalRows} Rekor
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2.5 text-slate-400">
            <div className="w-7 h-7 rounded-full border-2 border-slate-200 border-t-purple-600 animate-spin" />
            <p className="text-xs font-medium">Memuat data presensi...</p>
          </div>
        ) : attendanceList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <AlertCircle size={24} className="mx-auto text-slate-300" />
            <p>Tidak ada data absensi yang sesuai dengan filter atau kriteria pencarian.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Pengguna & Kategori</th>
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">Jam Masuk</th>
                  <th className="py-3 px-3">Jam Pulang</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Catatan</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* User Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white font-extrabold text-xs flex items-center justify-center shadow-2xs shrink-0">
                          {item.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 truncate">{item.user_name}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${
                              item.user_role === "mentor"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-indigo-100 text-indigo-800"
                            }`}>
                              {item.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{item.user_email}</p>
                          {item.university && (
                            <p className="text-[10px] text-slate-500 truncate">{item.university}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Tanggal */}
                    <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                      {item.attendance_date}
                    </td>

                    {/* Jam Masuk */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div>
                        <span className="font-bold text-emerald-700">{formatTime(item.check_in)}</span>
                        {item.check_in_distance !== undefined && item.check_in_distance !== null && (
                          <div className="text-[10px] text-slate-400">
                            {item.check_in_distance.toFixed(1)}m dari kantor
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Jam Pulang */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div>
                        <span className="font-bold text-indigo-700">{formatTime(item.check_out)}</span>
                        {item.check_out_distance !== undefined && item.check_out_distance !== null && (
                          <div className="text-[10px] text-slate-400">
                            {item.check_out_distance.toFixed(1)}m dari kantor
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Catatan */}
                    <td className="py-3 px-3 max-w-xs truncate text-[11px] text-slate-600">
                      {item.notes || "-"}
                    </td>

                    {/* Aksi Buttons */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Detail */}
                        <button
                          onClick={() => handleOpenDetail(item.id)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors"
                          title="Lihat Detail Presensi"
                        >
                          <Eye size={14} />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-600 transition-colors"
                          title="Edit Presensi"
                        >
                          <Edit2 size={14} />
                        </button>

                        {/* Hapus */}
                        <button
                          onClick={() => handleOpenDelete(item)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors"
                          title="Hapus Presensi"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AdminAttendanceModal
        isOpen={attendanceModalOpen}
        mode={modalMode}
        attendanceData={editingItem}
        usersList={usersList}
        onClose={() => setAttendanceModalOpen(false)}
        onSuccess={handleRefresh}
      />

      <AdminDetailModal
        isOpen={detailModalOpen}
        attendanceId={selectedAttendanceId}
        onClose={() => setDetailModalOpen(false)}
      />

      <AdminDeleteConfirmModal
        isOpen={deleteModalOpen}
        item={itemToDelete}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
