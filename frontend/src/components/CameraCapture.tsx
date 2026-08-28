"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Camera, RefreshCw, Check, FlipHorizontal, AlertCircle } from "lucide-react";
import { compressImage } from "@/lib/imageCompression";

interface CameraCaptureProps {
  onPhotoCaptured: (photoFile: File, previewUrl: string) => void;
  onRetake?: () => void;
}

export function CameraCapture({ onPhotoCaptured, onRetake }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      let msg = "Gagal mengakses kamera";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Izin kamera ditolak. Mohon aktifkan izin kamera di pengaturan browser.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "Perangkat kamera tidak ditemukan.";
      }
      setCameraError(msg);
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    setIsCapturing(true);
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Gagal menginisialisasi canvas");

      // Flip horizontal if front camera for natural mirror reflection
      if (facingMode === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

      setPreviewUrl(dataUrl);

      // Stop camera stream while previewing
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      // Compress client-side
      setCompressing(true);
      const compressedFile = await compressImage(dataUrl, 1080, 1080, 0.82);
      setCompressing(false);

      onPhotoCaptured(compressedFile, dataUrl);
    } catch (err: any) {
      alert("Gagal mengambil foto: " + err.message);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setPreviewUrl(null);
    if (onRetake) onRetake();
    startCamera();
  };

  return (
    <div className="flex flex-col items-center">
      {cameraError ? (
        <div className="w-full bg-red-50 border border-red-200 rounded-2xl p-4 text-center text-red-700">
          <AlertCircle size={24} className="mx-auto mb-2 text-red-500" />
          <p className="text-xs font-bold">{cameraError}</p>
          <button
            onClick={startCamera}
            className="mt-3 px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      ) : previewUrl ? (
        /* Preview Captured Photo */
        <div className="relative w-full max-w-sm rounded-3xl overflow-hidden border-2 border-orange-500 shadow-2xl bg-black">
          <img
            src={previewUrl}
            alt="Selfie Preview"
            className="w-full h-72 sm:h-80 object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex items-center justify-between">
            <button
              onClick={handleRetake}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/90 text-stone-900 text-xs font-bold hover:bg-white transition-colors shadow-md"
            >
              <RefreshCw size={14} />
              Foto Ulang
            </button>
            <div className="flex items-center gap-1.5 text-xs text-orange-400 font-extrabold bg-black/60 px-3 py-1.5 rounded-xl border border-orange-500/40">
              <Check size={14} />
              {compressing ? "Mengompres..." : "Foto Siap"}
            </div>
          </div>
        </div>
      ) : (
        /* Live Camera Stream */
        <div className="relative w-full max-w-sm rounded-3xl overflow-hidden border-2 border-orange-200 shadow-xl bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-72 sm:h-80 object-cover ${
              facingMode === "user" ? "scale-x-[-1]" : ""
            }`}
          />

          {/* Oval Face Guide Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-48 h-60 rounded-[45%] border-2 border-orange-400/60 border-dashed animate-pulse" />
          </div>

          {/* Top Controls (Flip Camera) */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              onClick={toggleFacingMode}
              className="p-2.5 rounded-full bg-white/80 backdrop-blur-md text-stone-800 border border-white/50 hover:bg-white transition-colors shadow-sm"
              title="Ganti Kamera"
            >
              <FlipHorizontal size={16} />
            </button>
          </div>

          {/* Bottom Shutter Button */}
          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center">
            <button
              onClick={capturePhoto}
              disabled={isCapturing}
              className="relative group p-1.5 rounded-full bg-white/40 backdrop-blur-md border border-white/60 transition-transform active:scale-95 shadow-lg"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-lg group-hover:brightness-105 transition-all">
                <Camera size={24} className="text-white" />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
