"use client";

import { useState, useEffect, useCallback } from "react";

export interface GeoLocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeoLocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
  });

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Browser Anda tidak mendukung fitur Geolocation GPS",
        loading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
          error: null,
          loading: false,
        });
      },
      (error) => {
        let errorMsg = "Gagal mengambil lokasi GPS";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "Izin akses lokasi (GPS) ditolak. Mohon aktifkan izin lokasi di browser.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "Informasi lokasi GPS tidak tersedia pada perangkat Anda.";
            break;
          case error.TIMEOUT:
            errorMsg = "Waktu permintaan lokasi habis (GPS timeout).";
            break;
        }
        setState((prev) => ({
          ...prev,
          error: errorMsg,
          loading: false,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  // Client-side Haversine helper for real-time live preview
  const getDistanceTo = useCallback(
    (targetLat: number, targetLon: number): number | null => {
      if (state.latitude === null || state.longitude === null) return null;

      const R = 6371000; // meters
      const dLat = (targetLat - state.latitude) * (Math.PI / 180);
      const dLon = (targetLon - state.longitude) * (Math.PI / 180);
      const lat1 = state.latitude * (Math.PI / 180);
      const lat2 = targetLat * (Math.PI / 180);

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.round(R * c * 10) / 10;
    },
    [state.latitude, state.longitude]
  );

  return {
    ...state,
    refresh: getLocation,
    getDistanceTo,
  };
}
