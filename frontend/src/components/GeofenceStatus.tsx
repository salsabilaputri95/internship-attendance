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
    <div className="rounded-3xl bg-white border border-orange-200/80 p-5 shadow-lg shadow-orange-500/5 text-stone-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-orange-600">
          <Navigation size={14} className="text-orange-500" />
          <span>LOKASI PRESENSI GPS</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-50 hover:bg-orange-100 text-[11px] text-orange-700 font-bold border border-orange-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          <span>Refresh GPS</span>
        </button>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-start gap-3 text-red-700">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-red-800">Akses Lokasi Diperlukan</p>
            <p className="text-[11px] text-red-600 mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      ) : loading ? (
        <div className="py-4 flex flex-col items-center justify-center gap-2 text-stone-500">
          <div className="w-8 h-8 rounded-full border-3 border-orange-200 border-t-orange-500 animate-spin" />
          <p className="text-xs font-semibold">Mendeteksi koordinat GPS presisi...</p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Pulsing radar icon */}
            <div className="relative flex items-center justify-center">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  isWithin
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-red-50 text-red-600 border border-red-200"
                }`}
              >
                <MapPin size={22} />
              </div>
              <span
                className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                  isWithin ? "bg-emerald-400 animate-ping" : "bg-red-400 animate-ping"
                }`}
              />
              <span
                className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                  isWithin ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-stone-900">
                  {distance !== null ? `${distance.toFixed(0)} m` : "-- m"}
                </span>
                <span className="text-[11px] text-stone-500 font-semibold">dari kantor</span>
              </div>
              <p className="text-xs text-stone-700 truncate max-w-[200px] sm:max-w-xs font-semibold">
                {officeName}
              </p>
              <p className="text-[10px] text-stone-500">
                Radius maksimal: <span className="text-stone-800 font-bold">{radius} m</span>
              </p>
            </div>
          </div>

          {/* Status Pill */}
          <div className="text-right shrink-0">
            {isWithin ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold shadow-sm">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Dalam Area</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-extrabold shadow-sm">
                <AlertCircle size={14} className="text-red-600" />
                <span>Di Luar Area</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
