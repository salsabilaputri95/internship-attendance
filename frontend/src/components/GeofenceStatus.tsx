"use client";

import React from "react";
import { MapPin, Navigation, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

interface GeofenceStatusProps {
  distance: number | null;
  radius: number;
  officeName: string;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function GeofenceStatus({
  distance,
  radius,
  officeName,
  loading,
  error,
  onRefresh,
}: GeofenceStatusProps) {
  const isWithin = distance !== null && distance <= radius;

  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-xs text-slate-900">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Navigation size={13} className="text-indigo-600" />
          <span>RADAR GPS LOKASI KANTOR</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-[11px] text-slate-700 font-medium border border-slate-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
          <span>Perbarui GPS</span>
        </button>
      </div>

      {error ? (
        <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-3 flex items-start gap-2.5 text-rose-700">
          <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-rose-800">Akses Lokasi Diperlukan</p>
            <p className="text-[11px] text-rose-600 mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      ) : loading ? (
        <div className="py-3 flex flex-col items-center justify-center gap-2 text-slate-400">
          <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
          <p className="text-xs font-medium">Mendeteksi koordinat GPS presisi...</p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Minimal Location Icon */}
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isWithin
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  : "bg-rose-50 text-rose-600 border border-rose-200"
              }`}
            >
              <MapPin size={18} />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold text-slate-900 font-mono">
                  {distance !== null ? `${distance.toFixed(0)} m` : "-- m"}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">dari titik kantor</span>
              </div>
              <p className="text-xs text-slate-700 truncate max-w-[200px] sm:max-w-xs font-medium">
                {officeName}
              </p>
              <p className="text-[10px] text-slate-400">
                Batas radius: <span className="text-slate-600 font-semibold">{radius} meter</span>
              </p>
            </div>
          </div>

          {/* Status Pill */}
          <div className="text-right shrink-0">
            {isWithin ? (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>Dalam Area</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                <AlertCircle size={13} className="text-rose-600" />
                <span>Di Luar Area</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
