# 📍 Sistem Manajemen & Monitoring Presensi Magang

Platform manajemen dan pemantauan kehadiran peserta magang berbasis **Geofencing GPS presisi**, validasi waktu kehadiran otomatis, audit log koreksi, dan pelaporan terintegrasi.

---

## 📋 Fitur Utama

| Fitur                                            | Deskripsi                                                                                                                     |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| ⚡**Presensi Masuk & Pulang Cepat**        | Pencatatan kehadiran instan dengan validasi koordinat GPS dan deteksi otomatis waktu kedatangan.                              |
| 📍**Validasi Geofencing Presisi**          | Backend Go memverifikasi jarak lokasi menggunakan formula*Haversine* terhadap radius kantor aktif.                          |
| 📝**Pengajuan Izin & Sakit Mandiri**       | Peserta dapat mengajukan izin sakit, urusan dinas, atau keperluan akademik dengan alasan tertulis tanpa batasan geofence.     |
| 📊**Dashboard Monitoring Real-Time**       | Panel pembimbing/mentor untuk memantau ringkasan statistik kehadiran, keterlambatan, dan izin harian secara*live*.          |
| 🔍**Inspeksi Presensi & Riwayat GPS**      | Pembimbing dapat melihat rincian koordinat, jarak meter GPS, waktu presisi, dan catatan tugas/keterlambatan peserta.          |
| 🛡️**Koreksi Presensi & Audit Log**       | Pembimbing dapat mengoreksi status kehadiran peserta dengan catatan alasan wajib yang tersimpan permanen di tabel audit log.  |
| 📑**Export Laporan CSV / Excel**           | Ekspor data rekapitulasi kehadiran berdasarkan rentang tanggal fleksibel dalam format CSV berstandar UTF-8 BOM.               |
| ⚙️**Manajemen Lokasi & Radius Geofence** | Pengaturan titik koordinat*latitude*, *longitude*, dan toleransi radius (meter) kantor yang dapat disesuaikan kapan saja. |
| 👤**Registrasi Mandiri & Lupa Kata Sandi** | Formulir pendaftaran peserta magang baru dengan pilihan posisi spesifik dan fasilitas reset kata sandi mandiri.               |
| 🔒**Security & Rate Limiting**             | Dilengkapi proteksi JWT Token, Role-Based Access Control (RBAC), serta*in-memory rate limiter* per alamat IP.               |

---

## 🛠️ Arsitektur & Teknologi

### Backend

- **Go (Golang v1.21+)** dengan **Chi v5 Router**
- **Clean / Layered Architecture**: Handler $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ Model
- **PostgreSQL (v14+)** sebagai database relasional utama (relasi FK, indexing performa tinggi)
- **Local File Storage Adapter** untuk penyimpanan file media tanpa ketergantungan *container cloud*

### Frontend

- **Next.js 16 (App Router)** dengan **TypeScript**
- **Tailwind CSS** (Tema modern bernuansa *Light Orange & Amber*)
- **Lucide Icons** untuk visual antarmuka modern
- **Browser APIs**: `Geolocation API` (deteksi GPS browser), `LocalStorage` (manajemen sesi JWT)

---

## 📁 Struktur Direktori

```
Presensi Magang/
├── backend/                    # Go REST API Backend
│   ├── cmd/
│   │   ├── api/main.go         # Entry point server API
│   │   └── migrate/main.go     # Migration & Database seeder runner
│   ├── internal/
│   │   ├── config/             # Environment configuration loader
│   │   ├── database/           # PostgreSQL connection pool
│   │   ├── handler/            # HTTP Request Handlers (Auth, Attendance, Mentor, Location)
│   │   ├── middleware/         # Auth JWT, RBAC Guard, Rate Limiter
│   │   ├── model/              # Entity Structs & Enums
│   │   ├── repository/         # Database Query & Transaction Layer
│   │   ├── service/            # Business Logic & Geofence Validator
│   │   ├── storage/            # Local Storage File Adapter
│   │   └── utils/              # Haversine Distance Calculator, JWT Helpers, JSON Responder
│   ├── migrations/             # SQL Schema & Initial Seed Data
│   ├── uploads/                # Direktori penyimpanan file media
│   ├── .env                    # Konfigurasi environment backend
│   ├── .env.example            # Contoh konfigurasi environment backend
│   └── go.mod
│
├── frontend/                   # Next.js Frontend
│   ├── src/
│   │   ├── app/                # Next.js App Router Pages
│   │   │   ├── login/          # Halaman Masuk
│   │   │   ├── register/       # Halaman Pendaftaran Peserta Magang
│   │   │   ├── forgot-password/# Halaman Reset Kata Sandi
│   │   │   ├── dashboard/      # Dashboard Utama Peserta Magang
│   │   │   ├── history/        # Riwayat Presensi & Log Absensi Peserta
│   │   │   └── mentor/         # Panel Monitoring Pembimbing / Mentor
│   │   │       ├── page.tsx    # Monitoring Presensi Harian
│   │   │       ├── interns/    # Direktori Profil Peserta Magang
│   │   │       ├── locations/  # Konfigurasi Titik Geofence Kantor
│   │   │       └── export/     # Generator & Export Laporan CSV
│   │   ├── components/         # Komponen UI (Navbar, Modal Presensi, Modal Izin, dll.)
│   │   ├── context/            # React AuthContext (Session & Route Guarding)
│   │   ├── hooks/              # useGeolocation Hook
│   │   └── lib/                # API Client & Utility Functions
│   ├── .env.local              # Konfigurasi environment frontend
│   └── package.json
│
├── .gitignore
├── .venv/                      # Python Virtual Environment
└── AGENTS.md                   # SOP & Panduan Kerja AI Agent
```

---

## ⚡ Prasyarat Sistem

Sebelum menjalankan aplikasi, pastikan *software* berikut telah terpasang pada komputer Anda:

| Komponen             | Versi Minimal        | Keterangan                 |
| -------------------- | -------------------- | -------------------------- |
| **Go**         | 1.21+                | Runtime backend            |
| **Node.js**    | 18+ (disarankan 20+) | Runtime frontend           |
| **PostgreSQL** | 14+                  | Relational database server |

---

## 🚀 Panduan Menjalankan Sistem (Lokal / Native)

### 1. Inisialisasi Database PostgreSQL

Pastikan layanan PostgreSQL aktif pada port default (`5432`). Kemudian jalankan *migration runner*:

```bash
cd backend

# Salin file konfigurasi environment
copy .env.example .env

# Jalankan migrasi schema dan seeder awal
go run ./cmd/migrate fresh
```

---

### 2. Menjalankan Backend API

Buka terminal dan jalankan server backend Go:

```bash
cd backend
go run ./cmd/api
```

Server REST API akan berjalan pada **`http://localhost:8080`**.
Uji koneksi melalui endpoint kesehatan: `GET http://localhost:8080/health`.

---

### 3. Menjalankan Frontend Next.js

Buka terminal baru dan jalankan server frontend:

```bash
cd frontend

# Install dependensi (pertama kali)
npm install

# Jalankan development server
npm run dev
```

Buka antarmuka aplikasi di peramban: **`http://localhost:3000`**.

---

## 🔑 Konfigurasi Environment

### `backend/.env`

```env
# Application
APP_ENV=development
APP_PORT=8080
APP_BASE_URL=http://localhost:8080

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bps_attendance
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSLMODE=disable

# JWT Authentication
JWT_SECRET=super-secure-jwt-secret-key-change-in-production

# Local File Storage
LOCAL_STORAGE_PATH=./uploads
```

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

---

## 🌐 Ringkasan API Endpoints

### 🔓 Publik / Autentikasi

- `POST /api/auth/register` — Pendaftaran akun peserta magang baru
- `POST /api/auth/login` — Autentikasi dan penerbitan token JWT
- `POST /api/auth/forgot-password` — Reset kata sandi akun
- `GET /api/locations` — Memuat titik koordinat dan radius kantor aktif

### 👤 Peserta Magang (Memerlukan Token JWT, Role: `intern`)

- `GET /api/auth/me` — Memuat profil pengguna aktif
- `POST /api/attendance/check-in` — Melakukan presensi masuk (koordinat GPS + catatan)
- `POST /api/attendance/check-out` — Melakukan presensi pulang (koordinat GPS)
- `POST /api/attendance/leave` — Mengajukan izin / sakit / urusan kedinasan
- `GET /api/attendance/today` — Memuat status kehadiran hari ini dan rekapitulasi bulanan
- `GET /api/attendance/history` — Memuat riwayat seluruh daftar presensi peserta

### 🛡️ Pembimbing / Mentor (Memerlukan Token JWT, Role: `mentor`)

- `GET /api/mentor/dashboard?date=YYYY-MM-DD` — Ringkasan statistik & tabel presensi harian
- `GET /api/mentor/attendance/{id}` — Detail inspeksi catatan presensi & GPS peserta
- `POST /api/mentor/attendance/{id}/correct` — Koreksi status kehadiran dengan catatan audit log
- `GET /api/mentor/interns` — Direktori seluruh peserta magang aktif
- `GET /api/export/csv?start_date=&end_date=` — Export data kehadiran ke format CSV
- `GET /api/locations/all` — Memuat daftar seluruh konfigurasi lokasi kantor
- `PUT /api/locations/{id}` — Memperbarui titik koordinat *latitude*, *longitude*, dan radius kantor

---

## 🔐 Standar Keamanan Sistem

1. **Backend sebagai Validator Tunggal**: Perhitungan jarak *Haversine* dan jam kehadiran dievaluasi di server backend Go, mencegah manipulasi data dari sisi peramban (*client-side*).
2. **Role-Based Access Control (RBAC)**: Pemisahan hak akses ketat antara hak istimewa *mentor* dan akun *intern*.
3. **Audit Trail**: Setiap perubahan atau koreksi data absensi dicatat lengkap dengan identitas pengubah (*corrected_by*), nilai sebelum/sesudah, dan alasan perubahan.
4. **Rate Limiting**: Pembatasan request per IP address untuk melindungi endpoint login dan pengiriman data dari serangan *brute force*.

---

## 🧪 Pengujian Unit Test

Jalankan pengujian formula geofencing Haversine pada backend:

```bash
cd backend
go test ./internal/utils/... -v
```

---

## 📄 Lisensi & Pembuat

Dibuat dan dikembangkan oleh:
GitHub: [Thinkerstone](https://github.com/salsabilaputri95)
