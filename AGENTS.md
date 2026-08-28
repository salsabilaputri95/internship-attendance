# 🤖 AI Agent Workflow Guide & Execution Standards
## Internship Attendance Management System — BPS Jeneponto

Dokumen ini adalah **panduan baku (standard operating procedure)** bagi AI Agent yang bekerja pada repositori *Internship Attendance Management System*. Setiap AI Agent yang melanjutkan atau berkontribusi pada proyek ini **wajib** mematuhi seluruh aturan, tahapan, validasi, dan batasan cakupan (*scope boundaries*) yang didefinisikan di bawah ini.

---

## 1. Prinsip Utama & Filosofi Kerja Agent

1. **Single Source of Truth**: Dokumen [`Internship Attendance Management System.md`](file:///c:/Users/salsa/Documents/BPS%20Jeneponto/Presensi%20Magang%20BPS/Internship%20Attendance%20Management%20System.md) adalah referensi spesifikasi teknis dan fungsional tertinggi. Tidak boleh membuat asumsi yang bertentangan dengan dokumen tersebut.
2. **Backend sebagai Source of Truth Validasi**: Semua validasi kritis (Geofencing Haversine, token authorization, status jam kehadiran, ukuran/tipe file) **wajib dieksekusi di backend Go**. Frontend hanya bertindak sebagai fasilitator UX.
3. **Pemisahan Penyimpanan Foto & Data**: Dilarang keras menyimpan file binary foto (BLOB/Base64 langsung) di PostgreSQL. Foto wajib dialirkan ke S3-compatible Object Storage (MinIO / AWS S3 / Cloudflare R2), dan PostgreSQL hanya menyimpan metadata serta string `photo_url`.
4. **Auditability**: Setiap perubahan data absensi oleh Mentor/Admin wajib mencatat rekam jejak (*audit log* pada tabel `attendance_corrections`).

---

## 2. Aturan Kerja & Larangan Ketat (*Strict Constraints*)

### ⛔ Larangan (Anti-Patterns & Restrictions)
- ❌ **Dilarang Menggunakan Docker untuk Saat Ini**: Seluruh pengembangan, database PostgreSQL, backend Go, dan frontend Next.js dijalankan secara **native/lokal** di komputer pengguna. Jangan membuat atau mewajibkan `docker-compose` sampai ada persetujuan/instruksi khusus dari pengguna.
- ❌ **Dilarang Mengubah/Memperluas Scope Sembarangan**: Jangan menambahkan fitur di luar scope MVP (misalnya: integrasi AI Face Recognition, penggajian/payroll otomatis, multi-tenant kompleks, atau push notification rumit) tanpa persetujuan eksplisit dari pengguna.
- ❌ **Dilarang Hardcode Nilai Konfigurasi**: Jam kerja (toleransi terlambat), koordinat kantor default, radius geofence, kredensial DB/S3/Local Storage, dan JWT secret tidak boleh di-hardcode di kode. Gunakan environment variables (`.env`) atau tabel konfigurasi `locations`.
- ❌ **Dilarang Menyimpan Secret di Source Code**: Password, secret key, atau API token harus selalu dimuat via environment configuration.
- ❌ **Dilarang Menghapus atau Mengubah File Spesifikasi Utama**: File `Internship Attendance Management System.md` tidak boleh diubah kecuali ada instruksi revisi langsung dari pengguna.
- ❌ **Dilarang Bypass Error Handling**: Setiap query database, validasi HTTP, atau integrasi storage harus memiliki penanganan error yang eksplisit, aman, dan informatif.

### ✅ Standar Kualitas Kode & Arsitektur
- **Backend (Go)**:
  - Gunakan Clean Architecture / Layered Architecture (`handler/controller` → `service/usecase` → `repository` → `model/entity`).
  - Gunakan framework HTTP yang stabil dan cepat (misal: Chi, Gin, atau Fiber) dengan Go modules standar.
  - Logging terstruktur untuk request error dan database failure.
  - Storage adapter: Mendukung S3-compatible storage ataupun local filesystem storage yang diserve via static/protected route untuk kemudahan pengembangan lokal tanpa Docker.
- **Frontend (Next.js & Tailwind CSS)**:
  - Gunakan Next.js App Router dengan TypeScript.
  - Desain responsif (Mobile-first untuk halaman absensi peserta, Desktop-friendly untuk Mentor Dashboard).
  - Implementasi kompresi gambar di sisi browser sebelum file di-upload ke backend.

---

## 3. Urutan Fase & Roadmap Eksekusi

Setiap fase harus diselesaikan dan diverifikasi sebelum melanjutkan ke fase berikutnya.

```
┌─────────────────────────────────────────────────────────────┐
│ FASE 0: Inisialisasi Workspace & Environment Setup (Lokal)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ FASE 1: Database Schema, Migrations, & Seed Data             │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ FASE 2: Go Backend Core API, Auth, Geofence & Storage        │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ FASE 3: Next.js Frontend — Intern Experience (Check-in/out)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ FASE 4: Next.js Frontend — Mentor Monitoring Dashboard       │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ FASE 5: Audit Log, Polish, Security Hardening & Review       │
└─────────────────────────────────────────────────────────────┘
```

---

### 📋 Detail Setiap Fase

#### **Fase 0: Inisialisasi Workspace & Environment Setup (Native / Non-Docker)**
- **Fokus**: Struktur direktori proyek monorepo/polyrepo teratur, inisialisasi Go Backend & Next.js Frontend di lokal.
- **Deliverables**:
  - Folder `backend/` dengan Go module (`go.mod`) dan struktur folder layered.
  - Folder `frontend/` dengan Next.js App Router + Tailwind CSS.
  - File `.env.example` untuk backend dan frontend (konfigurasi DB lokal, JWT, storage path/S3).
  - Dokumentasi panduan koneksi PostgreSQL lokal.
- **Kriteria Selesai (DoD)**:
  - Backend Go dapat dijalankan dengan `go run` dan Frontend dapat dijalankan dengan `npm run dev`.
  - Tidak ada dependensi yang error atau hilang.

---

#### **Fase 1: Database Schema, Migrations, & Seed Data**
- **Fokus**: Pembuatan skema relasional PostgreSQL sesuai arsitektur.
- **Deliverables**:
  - File migrasi SQL (atau script DDL) untuk tabel:
    1. `users` (id, name, email, password_hash, role, timestamps)
    2. `interns` (id, user_id, university, major, phone, supervisor_id, start_date, end_date, status)
    3. `locations` (id, name, latitude, longitude, radius, status)
    4. `attendance` (id, intern_id, attendance_date, check_in/out fields, status, notes, timestamps)
    5. `attendance_corrections` (id, attendance_id, corrected_by, old_value, new_value, reason, created_at)
  - Data Seeder untuk testing awal (1 admin/mentor, 2 intern, 1 lokasi kantor default BPS Jeneponto).
- **Kriteria Selesai (DoD)**:
  - Migrasi dapat dijalankan pada PostgreSQL lokal dengan sukses.
  - Relasi FK, indexing pada `attendance_date`, `intern_id`, dan `user_id` terpasang benar.

---

#### **Fase 2: Go Backend Core API, Auth, Geofence, & Storage**
- **Fokus**: REST API lengkap dengan proteksi JWT, business logic geofencing, dan handler storage.
- **Deliverables**:
  - **Module Auth**: Login, Logout, Me, Password hashing (bcrypt), JWT generation & middleware.
  - **Module Storage**: Adapter storage (S3-compatible / Local file serving) untuk upload selfie foto dengan naming UUID/timestamp unik dan validasi tipe MIME/size.
  - **Module Geofencing**: Formula Haversine distance calculator untuk membandingkan GPS peserta dengan titik kantor.
  - **Module Attendance**:
    - `POST /api/attendance/check-in` (validasi GPS, validasi foto, simpan check-in, set status HADIR / TERLAMBAT).
    - `POST /api/attendance/check-out` (validasi GPS, validasi foto, simpan check-out).
    - `GET /api/attendance/today` & `GET /api/attendance/history`.
  - **Module Mentor & Locations**:
    - `GET /api/mentor/dashboard`, `GET /api/mentor/attendance`, `POST /api/mentor/attendance/:id/correct`.
    - CRUD API untuk `/api/locations`.
- **Kriteria Selesai (DoD)**:
  - Unit test / API test untuk kalkulasi Haversine Geofencing (jarak < 100m diizinkan, > 100m ditolak).
  - Endpoint upload menyimpan foto dan mengembalikan URL valid.
  - Endpoint absensi menolak request jika koordinat berada di luar radius.

---

#### **Fase 3: Next.js Frontend — Intern Experience (Mobile First)**
- **Fokus**: Alur absensi peserta magang dengan interaksi kamera dan GPS yang mulus.
- **Deliverables**:
  - Halaman Login & Protected Route Peserta.
  - Dashboard Peserta (Kartu status absensi hari ini, tombol aksi dinamis, rekap bulanan).
  - Komponen Alur Absensi:
    1. Deteksi Geolocation via browser API + visual status jarak ke kantor.
    2. Modul Kamera Selfie depan via `MediaDevices.getUserMedia` dengan preview real-time.
    3. Kompresi gambar client-side (Canvas/WebP/JPEG, maks < 1MB).
    4. Feedback loading, sukses, atau alasan penolakan (misal: "Anda berada 450m di luar area").
  - Halaman Riwayat Kehadiran Peserta.
- **Kriteria Selesai (DoD)**:
  - Alur Check-in dan Check-out dapat dijalankan dari browser dengan izin GPS dan kamera.
  - Gambar selfie berhasil dikompresi sebelum dikirim ke backend.

---

#### **Fase 4: Next.js Frontend — Mentor Monitoring Dashboard**
- **Fokus**: Dashboard monitoring real-time, evaluasi kehadiran, dan audit koreksi absensi.
- **Deliverables**:
  - Dashboard Ringkasan: Statistik kartu (Total Peserta, Hadir, Terlambat, Izin/Alpha).
  - Tabel Monitoring Kehadiran Hari Ini (Filter berdasarkan tanggal, status, pencarian nama).
  - Modal/Halaman Detail Absensi:
    - Informasi waktu presisi check-in & check-out.
    - Informasi jarak GPS & akurasi radius.
    - Preview foto selfie masuk dan pulang.
  - Fitur Koreksi Absensi dengan form alasan wajib (*Reason*) untuk mencatat *Audit Log*.
  - Manajemen Lokasi Kantor / Geofence Settings (update koordinat & radius).
- **Kriteria Selesai (DoD)**:
  - Mentor dapat melihat seluruh presensi hari ini secara real-time.
  - Mentor dapat membuka foto selfie dan rincian GPS tiap peserta.
  - Setiap koreksi tersimpan ke database beserta catatan log pengubahnya.

---

#### **Fase 5: Audit Log, Security Hardening, Export & Final Verification**
- **Fokus**: Penyempurnaan, export laporan, hardening keamanan, dan pengujian end-to-end secara lokal.
- **Deliverables**:
  - Endpoint & UI Export Laporan (Format CSV / Excel / Printable HTML).
  - Security review: Sanitasi input, rate limiting pada login/upload, validasi payload max-size.
  - Dokumentasi instruksi menjalankan sistem di lingkungan lokal (`README.md`).
- **Kriteria Selesai (DoD)**:
  - Seluruh alur end-to-end (Peserta absen → Data tersimpan → Mentor verifikasi/koreksi → Export) berjalan lancar tanpa error di lingkungan lokal.

---

## 4. Definition of Done (DoD) Checklist untuk AI Agent

Sebelum menyelesaikan sebuah sesi atau tugas, AI Agent **wajib** memeriksa:
- [ ] Apakah kode yang dibuat mematuhi arsitektur yang ditentukan (Go backend + Next.js + Postgres + S3)?
- [ ] Apakah foto disimpan di Object Storage dan bukan di tabel database PostgreSQL?
- [ ] Apakah perhitungan jarak geofencing dilakukan di backend sebagai validator utama?
- [ ] Apakah terdapat error compile/build pada backend maupun frontend?
- [ ] Apakah file yang diubah terdokumentasi dengan baik?
- [ ] Apakah perubahan tetap berada dalam koridor scope MVP?

---

## 5. Panduan Laporan & Komunikasi ke Pengguna

1. **Jelaskan Status Berdasarkan Fase**: Selalu sebutkan fase mana yang sedang dikerjakan saat melaporkan progres.
2. **Konfirmasi Sebelum Perubahan Desain**: Jika ada perubahan struktur tabel, penambahan library eksternal baru, atau penyesuaian flow, jelaskan alasannya dan minta persetujuan pengguna terlebih dahulu.
3. **Sediakan File Links yang Jelas**: Setiap kali menyebutkan file yang dibuat atau diubah, gunakan markdown link standar.
