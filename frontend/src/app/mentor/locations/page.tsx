"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useGeolocation } from "@/hooks/useGeolocation";
import {
  MapPin,
  Save,
  Navigation,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Shield,
} from "lucide-react";

interface LocationData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  status: string;
}

export default function LocationSettingsPage() {
  const geo = useGeolocation();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState<number | string>("");
  const [longitude, setLongitude] = useState<number | string>("");
  const [radius, setRadius] = useState<number | string>(100);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchLocation = async () => {
    try {
      setLoading(true);
      const res = await api.get<LocationData>("/locations");
      if (res.success && res.data) {
        setLocation(res.data);
        setName(res.data.name);
        setLatitude(res.data.latitude);
        setLongitude(res.data.longitude);
        setRadius(res.data.radius);
      }
    } catch (err: any) {
      console.error("Gagal mengambil data lokasi:", err);
      setMessage({ type: "error", text: "Gagal memuat konfigurasi lokasi kantor" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  const handleUseMyGPS = () => {
    if (geo.latitude !== null && geo.longitude !== null) {
      setLatitude(geo.latitude);
      setLongitude(geo.longitude);
      setMessage({
        type: "success",
        text: `Koordinat GPS saat ini berhasil diterapkan (Akurasi: ±${geo.accuracy}m)`,
      });
    } else {
      alert("GPS belum terdeteksi. Pastikan izin lokasi aktif.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await api.put(`/locations/${location.id}`, {
        name,
        latitude: parseFloat(latitude.toString()),
        longitude: parseFloat(longitude.toString()),
        radius: parseFloat(radius.toString()),
        status: "active",
      });

      if (res.success) {
        setMessage({
          type: "success",
          text: "Konfigurasi titik lokasi & radius kantor berhasil diperbarui!",
        });
        fetchLocation();
      } else {
        throw new Error(res.message || "Gagal menyimpan lokasi");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Gagal memperbarui lokasi" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-12 max-w-2xl mx-auto">
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
            <h1 className="text-lg font-bold text-slate-900">Pengaturan Geofencing</h1>
            <p className="text-xs text-slate-500">
              Konfigurasi titik koordinat dan batas radius absensi kantor
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs animate-in fade-in ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200/80 text-rose-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-slate-400">
          <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
          <p className="text-xs font-medium">Memuat konfigurasi geofencing...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
          {/* Info Banner */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
            <Shield size={16} className="text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900">Keamanan Validasi Geofence:</span> Setiap
              kali peserta magang melakukan absensi, backend menghitung jarak GPS secara otomatis
              terhadap titik koordinat di bawah menggunakan formula Haversine.
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Titik Lokasi Kantor
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kantor BPS Kabupaten Jeneponto"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 font-medium transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="-5.6783321"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="119.7498101"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Radius Toleransi Geofencing (Meter)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="any"
                  min="10"
                  max="1000"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  placeholder="150"
                  required
                  className="w-36 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all"
                />
                <span className="text-xs text-slate-400">
                  (Default: <strong className="text-slate-700 font-medium">150 meter</strong>)
                </span>
              </div>
            </div>

            {/* Quick GPS helper button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleUseMyGPS}
                className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 text-xs font-medium flex items-center gap-2 transition-colors"
              >
                <Navigation size={13} className="text-indigo-600" />
                <span>Gunakan Koordinat GPS Saya Saat Ini</span>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 active:scale-[0.99]"
              >
                <Save size={14} />
                <span>{saving ? "Menyimpan..." : "Simpan Perubahan Geofence"}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
