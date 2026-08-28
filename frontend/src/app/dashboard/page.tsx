"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useGeolocation } from "@/hooks/useGeolocation";
import { GeofenceStatus } from "@/components/GeofenceStatus";
import { AttendanceModal } from "@/components/AttendanceModal";
import { LeaveModal } from "@/components/LeaveModal";
import { api } from "@/lib/api";
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
  ChevronRight,
  Sparkles,
  MapPin,
  Image as ImageIcon,
  FileText,
} from "lucide-react";

interface TodayData {
  attendance: {
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
  } | null;
  office_location: {
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
  };
  summary: {
    hadir: number;
    terlambat: number;
    izin: number;
    alpha: number;
    total_absen: number;
  };
}

export default function InternDashboard() {
  const { user } = useAuth();
  const geo = useGeolocation();

  const [todayData, setTodayData] = useState<TodayData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"in" | "out">("in");
  const [currentTime, setCurrentTime] = useState<string>("");

  // Live Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTodayData = useCallback(async () => {
    try {
      setLoadingData(true);
      const res = await api.get<TodayData>("/attendance/today");
      if (res.success && res.data) {
        setTodayData(res.data);
      }
    } catch (err: any) {
      console.error("Gagal mengambil data kehadiran hari ini:", err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayData();
  }, [fetchTodayData]);

  const officeLat = todayData?.office_location?.latitude || -5.6783321;
  const officeLon = todayData?.office_location?.longitude || 119.7498101;
  const officeRadius = todayData?.office_location?.radius || 150;
  const officeName = todayData?.office_location?.name || "Kantor BPS Kabupaten Jeneponto";

  const liveDistance = geo.getDistanceTo(officeLat, officeLon);

  const handleOpenAttendance = (type: "in" | "out") => {
    setModalType(type);
    setModalOpen(true);
  };

  const attendance = todayData?.attendance;
  const isLeave = attendance?.status === "IZIN";
  const hasCheckedIn = !!attendance?.check_in;
  const hasCheckedOut = !!attendance?.check_out;

  const todayDateFormatted = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 rounded-3xl p-6 shadow-xl shadow-orange-500/15 text-white">
        <div>
          <div className="flex items-center gap-2 text-orange-100 text-xs font-extrabold mb-1">
            <Sparkles size={14} className="text-amber-200" />
            <span>Presensi Magang BPS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            Selamat datang, {user?.name} 👋
          </h2>
          <p className="text-xs text-orange-100 mt-1 flex items-center gap-1.5 font-medium">
            <Calendar size={13} className="text-orange-200" />
            <span>{todayDateFormatted}</span>
          </p>
        </div>

        {/* Digital Clock Badge */}
        <div className="shrink-0 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl px-4 py-2.5 flex items-center gap-3">
          <Clock size={20} className="text-white animate-pulse" />
          <div>
            <div className="text-lg font-black text-white font-mono tracking-wider">
              {currentTime || "--:--:--"}
            </div>
            <div className="text-[10px] text-orange-100 font-semibold">WITA (Jeneponto)</div>
          </div>
        </div>
      </div>

      {/* Geofence Status Component */}
      <GeofenceStatus
        distance={liveDistance}
        radius={officeRadius}
        officeName={officeName}
        loading={geo.loading}
        error={geo.error}
        onRefresh={geo.refresh}
      />

      {/* Main Today Attendance Card */}
      <div className="bg-white border border-orange-200/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-orange-500/5">
        <div className="flex items-center justify-between pb-4 border-b border-orange-100 mb-5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
            <h3 className="text-xs font-black text-stone-800 uppercase tracking-wider">
              STATUS KEHADIRAN HARI INI
            </h3>
          </div>
          {attendance?.status && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-black ${
                attendance.status === "HADIR"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : attendance.status === "TERLAMBAT"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : attendance.status === "IZIN"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {attendance.status}
            </span>
          )}
        </div>

        {loadingData ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-stone-500">
            <div className="w-8 h-8 rounded-full border-3 border-orange-200 border-t-orange-500 animate-spin" />
            <p className="text-xs font-semibold">Memuat status presensi...</p>
          </div>
        ) : isLeave ? (
          /* State: Intern is on Leave */
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-3 bg-blue-50/50 border border-blue-200/80 rounded-2xl p-5">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shadow-sm">
              <FileText size={24} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-blue-900">
                Pengajuan Izin Hari Ini Tercatat
              </h4>
              <p className="text-xs text-blue-700 mt-1 max-w-md">
                Keterangan: <span className="font-semibold">&ldquo;{attendance?.notes || "Izin"}&rdquo;</span>
              </p>
            </div>
          </div>
        ) : (
          <div>
            {/* Grid Check In & Check Out info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Check In Box */}
              <div
                className={`rounded-2xl p-4 border transition-all ${
                  hasCheckedIn
                    ? "bg-emerald-50/60 border-emerald-200"
                    : "bg-orange-50/40 border-orange-200/60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-stone-700 flex items-center gap-1.5">
                    <LogIn size={14} className="text-emerald-600" />
                    Absen Masuk
                  </span>
                  {hasCheckedIn ? (
                    <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                      Tercatat
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-400 font-semibold">Belum Absen</span>
                  )}
                </div>

                <div className="text-2xl font-black text-stone-900 font-mono">
                  {hasCheckedIn && attendance?.check_in
                    ? new Date(attendance.check_in).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--:--"}
                </div>

                {hasCheckedIn && (
                  <div className="mt-3 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-xs">
                    <span className="text-stone-500 text-[11px] flex items-center gap-1 font-semibold">
                      <MapPin size={11} className="text-orange-500" />
                      {attendance?.check_in_distance?.toFixed(0)}m dari kantor
                    </span>
                    {attendance?.check_in_photo_url && (
                      <a
                        href={attendance.check_in_photo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-orange-600 hover:text-orange-700 font-bold text-[11px] flex items-center gap-1"
                      >
                        <ImageIcon size={11} />
                        Lihat Foto
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Check Out Box */}
              <div
                className={`rounded-2xl p-4 border transition-all ${
                  hasCheckedOut
                    ? "bg-orange-50 border-orange-200"
                    : "bg-orange-50/40 border-orange-200/60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-stone-700 flex items-center gap-1.5">
                    <LogOut size={14} className="text-orange-600" />
                    Absen Pulang
                  </span>
                  {hasCheckedOut ? (
                    <span className="text-[10px] text-orange-700 font-extrabold bg-orange-100 px-2 py-0.5 rounded-md border border-orange-200">
                      Tercatat
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-400 font-semibold">Belum Absen</span>
                  )}
                </div>

                <div className="text-2xl font-black text-stone-900 font-mono">
                  {hasCheckedOut && attendance?.check_out
                    ? new Date(attendance.check_out).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--:--"}
                </div>

                {hasCheckedOut && (
                  <div className="mt-3 pt-3 border-t border-orange-200 flex items-center justify-between text-xs">
                    <span className="text-stone-500 text-[11px] flex items-center gap-1 font-semibold">
                      <MapPin size={11} className="text-orange-500" />
                      {attendance?.check_out_distance?.toFixed(0)}m dari kantor
                    </span>
                    {attendance?.check_out_photo_url && (
                      <a
                        href={attendance.check_out_photo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-orange-600 hover:text-orange-700 font-bold text-[11px] flex items-center gap-1"
                      >
                        <ImageIcon size={11} />
                        Lihat Foto
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons & Leave Submission */}
            <div className="space-y-3">
              {!hasCheckedIn ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleOpenAttendance("in")}
                    className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-orange-500/25 transition-all active:scale-[0.99]"
                  >
                    <LogIn size={18} />
                    <span>Lakukan Absen Masuk Sekarang</span>
                  </button>

                  <button
                    onClick={() => setLeaveModalOpen(true)}
                    className="py-4 px-5 rounded-2xl bg-orange-100/70 hover:bg-orange-200/80 border border-orange-300/80 text-orange-900 font-extrabold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <FileText size={16} />
                    <span>Ajukan Izin / Sakit</span>
                  </button>
                </div>
              ) : !hasCheckedOut ? (
                <button
                  onClick={() => handleOpenAttendance("out")}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-orange-500/25 transition-all active:scale-[0.99]"
                >
                  <LogOut size={18} />
                  <span>Lakukan Absen Pulang Sekarang</span>
                </button>
              ) : (
                <div className="w-full py-3.5 px-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Presensi hari ini telah lengkap. Terima kasih atas dedikasi Anda!</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Monthly Attendance Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-black text-stone-600 uppercase tracking-wider">
            Rekap Kehadiran Bulan Ini
          </h3>
          <Link
            href="/history"
            className="text-xs font-extrabold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
          >
            <span>Lihat Semua Riwayat</span>
            <ChevronRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-emerald-100 rounded-3xl p-4 shadow-sm">
            <div className="text-[11px] font-bold text-stone-500">Hadir</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {todayData?.summary.hadir || 0}
            </div>
            <div className="text-[10px] text-stone-400 font-medium mt-0.5">Tepat Waktu</div>
          </div>

          <div className="bg-white border border-amber-100 rounded-3xl p-4 shadow-sm">
            <div className="text-[11px] font-bold text-stone-500">Terlambat</div>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {todayData?.summary.terlambat || 0}
            </div>
            <div className="text-[10px] text-stone-400 font-medium mt-0.5">&gt; 08:15 WITA</div>
          </div>

          <div className="bg-white border border-blue-100 rounded-3xl p-4 shadow-sm">
            <div className="text-[11px] font-bold text-stone-500">Izin</div>
            <div className="text-2xl font-black text-blue-600 mt-1">
              {todayData?.summary.izin || 0}
            </div>
            <div className="text-[10px] text-stone-400 font-medium mt-0.5">Disetujui</div>
          </div>

          <div className="bg-white border border-red-100 rounded-3xl p-4 shadow-sm">
            <div className="text-[11px] font-bold text-stone-500">Alpha</div>
            <div className="text-2xl font-black text-red-600 mt-1">
              {todayData?.summary.alpha || 0}
            </div>
            <div className="text-[10px] text-stone-400 font-medium mt-0.5">Tanpa Keterangan</div>
          </div>
        </div>
      </div>

      {/* Attendance Flow Modal */}
      <AttendanceModal
        isOpen={modalOpen}
        type={modalType}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          fetchTodayData();
          geo.refresh();
        }}
        latitude={geo.latitude}
        longitude={geo.longitude}
        accuracy={geo.accuracy}
        distance={liveDistance}
        radius={officeRadius}
      />

      {/* Leave Submission Modal */}
      <LeaveModal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        onSuccess={() => {
          fetchTodayData();
        }}
      />
    </div>
  );
}
