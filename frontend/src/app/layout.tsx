import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Presensi Magang — BPS Kabupaten Jeneponto",
  description: "Sistem Manajemen & Monitoring Presensi Peserta Magang BPS Kabupaten Jeneponto",
  icons: {
    icon: "/logo.webp",
    shortcut: "/logo.webp",
    apple: "/logo.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen antialiased flex flex-col selection:bg-indigo-100 selection:text-indigo-900`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6">
            {children}
          </main>
          
          {/* Footer minimal & elegan */}
          <footer className="mt-auto border-t border-slate-200/80 bg-white/80 backdrop-blur-md">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Left Side: Copyright */}
              <div className="text-center sm:text-left space-y-0.5">
                <p className="text-xs font-medium text-slate-600">
                  &copy; {new Date().getFullYear()} BPS Kabupaten Jeneponto. All rights reserved.
                </p>
                <p className="text-[11px] text-slate-400">
                  Sistem Presensi &amp; Monitoring Kehadiran Magang Real-Time
                </p>
              </div>

              {/* Right Side: GitHub Thinkerstone Badge */}
              <div className="shrink-0">
                <a
                  href="https://github.com/salsabilaputri95"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200 hover:border-slate-300 hover:bg-slate-200/80 transition-all shadow-2xs group"
                >
                  <div className="w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                    <svg
                      className="w-2.5 h-2.5 fill-current"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                  </div>
                  <span className="font-semibold text-xs text-slate-800 tracking-tight font-sans">
                    Thinkerstone
                  </span>
                </a>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
