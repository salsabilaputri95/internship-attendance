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
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
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
            <h1 className="text-xl font-black text-stone-900">Pengaturan Geofencing</h1>
            <p className="text-xs text-orange-600 font-bold">
              Konfigurasi titik pusat dan radius absensi kantor BPS Jeneponto
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs animate-in fade-in ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-500">
          <div className="w-8 h-8 rounded-full border-3 border-orange-200 border-t-orange-500 animate-spin" />
          <p className="text-xs font-semibold">Memuat konfigurasi geofencing...</p>
        </div>
      ) : (
        <div className="bg-white border border-orange-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-orange-500/5 space-y-6">
          {/* Info Banner */}
          <div className="bg-orange-50/60 border border-orange-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-stone-700">
            <Shield size={18} className="text-orange-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-stone-900">Keamanan Validasi Geofence:</span> Setiap
              kali peserta magang menekan tombol Absen Masuk atau Pulang, koordinat GPS peserta akan
              dihitung jaraknya terhadap koordinat di bawah ini menggunakan formula Haversine di sisi
              backend Go.
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Nama Titik Lokasi Kantor
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kantor BPS Kabupaten Jeneponto"
                required
                className="w-full bg-orange-50/30 border border-orange-200 rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="-5.6987123"
                  required
                  className="w-full bg-orange-50/30 border border-orange-200 rounded-xl px-4 py-2.5 text-xs text-stone-900 font-mono focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="119.7289456"
                  required
                  className="w-full bg-orange-50/30 border border-orange-200 rounded-xl px-4 py-2.5 text-xs text-stone-900 font-mono focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
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
                  placeholder="100"
                  required
                  className="w-40 bg-orange-50/30 border border-orange-200 rounded-xl px-4 py-2.5 text-xs text-stone-900 font-mono focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
                <span className="text-xs text-stone-500">
                  (Default: <strong className="text-stone-800">100 meter</strong>)
                </span>
              </div>
            </div>

            {/* Quick GPS helper button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleUseMyGPS}
                className="py-2.5 px-4 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Navigation size={14} />
                <span>Gunakan Koordinat GPS Saya Saat Ini</span>
              </button>
            </div>

            <div className="pt-4 border-t border-orange-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50"
              >
                <Save size={15} />
                <span>{saving ? "Menyimpan..." : "Simpan Perubahan Geofence"}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
