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
    <div className="space-y-5 pb-12">
      {/* Top Banner (Clean Dark Slate Card) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xs">
        <div>
          <div className="flex items-center gap-1.5 text-indigo-300 text-xs font-semibold mb-1">
            <Sparkles size={13} className="text-indigo-400" />
            <span>Presensi Magang BPS</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            Selamat datang, {user?.name}
          </h2>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
            <Calendar size={13} className="text-slate-400" />
            <span>{todayDateFormatted}</span>
          </p>
        </div>

        {/* Digital Clock Badge */}
        <div className="shrink-0 bg-slate-800/90 border border-slate-700/80 rounded-xl px-4 py-2 flex items-center gap-3">
          <Clock size={18} className="text-indigo-400" />
          <div>
            <div className="text-base font-bold text-white font-mono tracking-wider">
              {currentTime || "--:--:--"}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">WITA (Jeneponto)</div>
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
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              STATUS KEHADIRAN HARI INI
            </h3>
          </div>
          {attendance?.status && (
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                attendance.status === "HADIR"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : attendance.status === "TERLAMBAT"
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : attendance.status === "IZIN"
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {attendance.status}
            </span>
          )}
        </div>

        {loadingData ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-slate-400">
            <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
            <p className="text-xs font-medium">Memuat status presensi...</p>
          </div>
        ) : isLeave ? (
          /* Intern on Leave */
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl p-5">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Pengajuan Izin Hari Ini Tercatat
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 max-w-md">
                Keterangan: <span className="font-semibold">&ldquo;{attendance?.notes || "Izin"}&rdquo;</span>
              </p>
            </div>
          </div>
        ) : (
          <div>
            {/* Grid Check In & Check Out info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
              {/* Check In Box */}
              <div
                className={`rounded-xl p-4 border transition-all ${
                  hasCheckedIn
                    ? "bg-emerald-50/50 border-emerald-200/80"
                    : "bg-slate-50 border-slate-200/80"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <LogIn size={14} className={hasCheckedIn ? "text-emerald-600" : "text-slate-400"} />
                    Absen Masuk
                  </span>
                  {hasCheckedIn ? (
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                      Tercatat
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">Belum Absen</span>
                  )}
                </div>

                <div className="text-2xl font-bold text-slate-900 font-mono">
                  {hasCheckedIn && attendance?.check_in
                    ? new Date(attendance.check_in).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--:--"}
                </div>

                {hasCheckedIn && (
                  <div className="mt-2.5 pt-2.5 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-emerald-600" />
                      {attendance?.check_in_distance?.toFixed(0)}m dari kantor
                    </span>
                  </div>
                )}
              </div>

              {/* Check Out Box */}
              <div
                className={`rounded-xl p-4 border transition-all ${
                  hasCheckedOut
                    ? "bg-indigo-50/50 border-indigo-200/80"
                    : "bg-slate-50 border-slate-200/80"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <LogOut size={14} className={hasCheckedOut ? "text-indigo-600" : "text-slate-400"} />
                    Absen Pulang
                  </span>
                  {hasCheckedOut ? (
                    <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-100/80 px-2 py-0.5 rounded-md border border-indigo-200">
                      Tercatat
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">Belum Absen</span>
                  )}
                </div>

                <div className="text-2xl font-bold text-slate-900 font-mono">
                  {hasCheckedOut && attendance?.check_out
                    ? new Date(attendance.check_out).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--:--"}
                </div>

                {hasCheckedOut && (
                  <div className="mt-2.5 pt-2.5 border-t border-indigo-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-indigo-600" />
                      {attendance?.check_out_distance?.toFixed(0)}m dari kantor
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons & Leave Submission */}
            <div className="space-y-2.5">
              {!hasCheckedIn ? (
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={() => handleOpenAttendance("in")}
                    className="flex-1 py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99]"
                  >
                    <LogIn size={15} />
                    <span>Lakukan Absen Masuk Sekarang</span>
                  </button>

                  <button
                    onClick={() => setLeaveModalOpen(true)}
                    className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <FileText size={14} />
                    <span>Ajukan Izin / Sakit</span>
                  </button>
                </div>
              ) : !hasCheckedOut ? (
                <button
                  onClick={() => handleOpenAttendance("out")}
                  className="w-full py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99]"
                >
                  <LogOut size={15} />
                  <span>Lakukan Absen Pulang Sekarang</span>
                </button>
              ) : (
                <div className="w-full py-3 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span>Presensi hari ini telah lengkap. Terima kasih atas dedikasi Anda!</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Monthly Attendance Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Rekap Kehadiran Bulan Ini
          </h3>
          <Link
            href="/history"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
          >
            <span>Lihat Riwayat</span>
            <ChevronRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500">Hadir</div>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">
              {todayData?.summary.hadir || 0}
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">Tepat Waktu</div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500">Terlambat</div>
            <div className="text-xl font-bold text-amber-600 mt-0.5">
              {todayData?.summary.terlambat || 0}
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">&gt; 07:30 WITA</div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500">Izin</div>
            <div className="text-xl font-bold text-indigo-600 mt-0.5">
              {todayData?.summary.izin || 0}
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">Disetujui</div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500">Alpha</div>
            <div className="text-xl font-bold text-rose-600 mt-0.5">
              {todayData?.summary.alpha || 0}
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">Tanpa Keterangan</div>
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
