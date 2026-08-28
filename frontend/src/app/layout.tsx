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
      <body className={`${inter.className} bg-orange-50/50 text-stone-800 min-h-screen antialiased flex flex-col selection:bg-orange-200 selection:text-orange-950`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6">
            {children}
          </main>
          
          {/* Footer layout matching the reference design */}
          <footer className="mt-auto border-t border-orange-200/80 bg-white/90 backdrop-blur-md">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Left Side: Copyright & Tagline */}
              <div className="text-center sm:text-left space-y-1">
                <p className="text-xs font-semibold text-stone-700">
                  &copy; {new Date().getFullYear()} BPS Kabupaten Jeneponto. Hak Cipta Dilindungi Undang-Undang.
                </p>
                <p className="text-[11px] text-stone-500 italic">
                  Presensi Magang: <span className="text-orange-600 font-medium not-italic">Monitoring &amp; Manajemen Kehadiran Real-time</span>
                </p>
              </div>

              {/* Right Side: GitHub Thinkerstone Badge */}
              <div className="shrink-0">
                <a
                  href="https://github.com/salsabilaputri95"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-orange-100/60 border border-orange-300/80 hover:border-orange-400 hover:bg-orange-200/70 transition-all shadow-xs group"
                >
                  {/* Circular GitHub Icon */}
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center text-white group-hover:rotate-12 transition-transform shadow-xs">
                    <svg
                      className="w-3.5 h-3.5 fill-current"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                  </div>
                  <span className="font-bold text-xs text-orange-700 tracking-wide font-sans">
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
