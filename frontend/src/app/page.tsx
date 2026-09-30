"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user.role === "admin") {
        router.push("/admin");
      } else if (user.role === "mentor") {
        router.push("/mentor");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-full border-3 border-teal-500/30 border-t-teal-400 animate-spin" />
      <p className="text-xs text-slate-400 font-medium">Memuat Presensi Magang BPS Jeneponto...</p>
    </div>
  );
}
