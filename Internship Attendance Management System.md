# **Internship Attendance Management System** 

# **1\. Tujuan Sistem**

Sistem ini merupakan aplikasi web untuk mengelola dan memonitor kehadiran peserta magang secara terpusat.

Peserta melakukan absensi melalui website dengan tiga validasi utama:

> **Identitas → Lokasi → Foto**

Sehingga ketika peserta melakukan absensi:

```
Login
  ↓
Pilih "Absen Masuk"
  ↓
Ambil lokasi GPS
  ↓
Validasi Geofencing
  ↓
Ambil foto selfie
  ↓
Validasi data
  ↓
Simpan absensi
  ↓
Berhasil
```

Mentor kemudian dapat melihat data tersebut melalui dashboard monitoring.

# **2\. Konsep Utama Sistem**

Ada 4 komponen utama:

```
│             ATTENDANCE SYSTEM                   
│                                                 
│  👤 Identity                                    
│  └── Login & User                                                                                │
│  📍 Location                                    
│  └── GPS + Geofencing                           
│                                                 
│  📷 Evidence                                    
│  └── Selfie saat absensi                        
│                                                
│  🕐 Attendance                                 
│  └── Check-in & Check-out                       	    
```

Jadi sistem bukan hanya mencatat:

> "Salsabila hadir."

Tetapi:

> "Salsabila melakukan check-in pukul 08:57, berada 43 meter dari lokasi kantor, dan mengirimkan foto selfie sebagai bukti."

# **3\. Role Pengguna**

Sistem memiliki dua role utama.

### 👨‍💻 Peserta Magang

Peserta dapat:

* Login  
* Melihat dashboard  
* Melakukan check-in  
* Melakukan check-out  
* Mengambil foto selfie  
* Menggunakan GPS  
* Melihat status absensi  
* Melihat riwayat kehadiran  
* Melihat total jam kerja  
* Melihat profil

### 👨‍💼 Mentor / Pegawai

Mentor dapat:

* Login  
* Melihat dashboard  
* Melihat peserta  
* Melihat kehadiran hari ini  
* Melihat detail absensi  
* Melihat foto bukti  
* Melihat lokasi absensi  
* Melihat riwayat  
* Filter berdasarkan tanggal/peserta/status  
* Melakukan koreksi absensi  
* Melihat rekap  
* Export laporan

# 4\. Arsitektur Sistem

Arsitektur utama:

```
                         INTERNET
                            │
                            ▼
                ┌──────────────────────┐
                │       NEXT.JS        │
                │      FRONTEND        │
                │                      │
                │ Dashboard            │
                │ Attendance           │
                │ Camera               │
                │ GPS                  │
                │ Mentor Dashboard     │
                └──────────┬───────────┘
                           │
                        REST API
                           │
                           ▼
                ┌──────────────────────┐
                │         GO           │
                │       BACKEND        │
                │                      │
                │ Authentication       │
                │ Attendance            │
                │ Geofencing            │
                │ User Management      │
                │ Reporting            │
                └──────────┬───────────┘
                           │
               ┌───────────┴───────────┐
               │                       │
               ▼                       ▼
      ┌─────────────────┐     ┌──────────────────┐
      │   PostgreSQL    │     │  Object Storage  │
      │                 │     │                  │
      │ Users           │     │ Selfie           │
      │ Interns         │     │ Attendance Photo │
      │ Attendance      │     │                  │
      │ Locations       │     │                  │
      └─────────────────┘     └──────────────────┘

```

# **5\. Kenapa Foto Tidak Disimpan di PostgreSQL?**

Ini bagian penting dari desain.

Jangan menyimpan file foto langsung di PostgreSQL sebagai BLOB untuk sistem seperti ini.

Gunakan:

```
Foto
 ↓
Object Storage
 ↓
URL foto
 ↓
PostgreSQL
```

Misalnya PostgreSQL hanya menyimpan:

```
photo_url:
https://storage.example.com/attendance/2026/08/28/abc123.jpg
```

Sedangkan file sebenarnya berada di object storage.

Keuntungannya:

* Database lebih ringan  
* Backup database lebih mudah  
* Foto dapat dikelola terpisah  
* Lebih mudah melakukan scaling  
* Lebih cocok untuk aplikasi production

Untuk development, kamu bisa menggunakan storage yang mendukung S3-compatible API, sehingga implementasinya di Go tidak terlalu terikat pada provider tertentu.

# **6\. Flow Check-In**

Ini merupakan flow paling penting.

```
                 USER
                  │
                  ▼
           Klik "Absen Masuk"
                  │
                  ▼
          Request GPS Location
                  │
                  ▼
        ┌─────────────────────┐
        │ GPS Permission?     │
        └──────────┬──────────┘
                   │
              ┌────┴────┐
              │         │
             NO        YES
              │         │
              ▼         ▼
           Reject    Get Location
                        │
                        ▼
                 Send GPS → Go
                        │
                        ▼
                 Calculate Distance
                        │
                 ┌──────┴──────┐
                 │             │
              Outside        Inside
                 │             │
                 ▼             ▼
               Reject      Open Camera
                               │
                               ▼
                         Take Selfie
                               │
                               ▼
                       Compress Image
                               │
                               ▼
                         Upload Photo
                               │
                               ▼
                          Go Backend
                               │
                ┌──────────────┴─────────────┐
                │                            │
                ▼                            ▼
          Save Photo                  Save Attendance
          Storage                         PostgreSQL
                │                            │
                └──────────────┬─────────────┘
                               ▼
                         SUCCESS
```

# 7\. Geofencing

Misalnya lokasi kantor:

Office Location

Latitude  : \-5.xxxxx  
Longitude : 119.xxxxx  
Radius    : 100 meter

Ketika peserta melakukan absensi:

               OFFICE  
                  ●  
             ┌─────────┐  
           /             \\  
         /      100m      \\  
        │        ●         │  
         \\               /  
           \\           /  
             └─────────┘

Peserta:

Peserta A  
Distance \= 43m  
Status   \= VALID

Maka:

43m \< 100m  
      ↓  
ALLOW

Sedangkan:

Peserta B  
Distance \= 850m

Maka:

850m \> 100m  
       ↓  
REJECT

Perhitungan jarak sebaiknya dilakukan di backend Go, bukan hanya di frontend.

Frontend boleh melakukan pengecekan awal untuk UX, tetapi backend harus menjadi source of truth.

# **8\. Foto Selfie**

Flow foto:

User  
 │  
 ▼  
Camera Permission  
 │  
 ▼  
Front Camera  
 │  
 ▼  
Take Photo  
 │  
 ▼  
Client-side Compression  
 │  
 ▼  
Upload  
 │  
 ▼  
Go Backend  
 │  
 ▼  
Object Storage

Contohnya:

Foto asli  
3.8 MB  
   ↓  
Resize \+ Compression  
   ↓  
350 KB  
   ↓  
Upload

Dengan cara ini, sistem tidak akan terlalu berat.

Saya juga menyarankan foto dibatasi misalnya:

Maximum file size : 1 MB  
Format            : JPEG/WebP  
Resolution        : ±720p

Untuk kebutuhan bukti absensi, tidak perlu foto 4K.

# **9\. Check-Out**

Check-out memiliki konsep yang sama:

Klik "Absen Pulang"  
        ↓  
Get GPS  
        ↓  
Validasi Geofence  
        ↓  
Ambil Selfie  
        ↓  
Upload  
        ↓  
Simpan Check-Out

Sehingga satu hari memiliki:

┌──────────────────────────────────────┐  
│       ATTENDANCE \- 28 AUG 2026      │  
├──────────────────────────────────────┤  
│ Check In                             │  
│ 🕐 08:57                             │  
│ 📍 43 meter dari kantor              │  
│ 📷 Selfie                            │  
│                                      │  
│ Check Out                            │  
│ 🕐 16:04                             │  
│ 📍 51 meter dari kantor              │  
│ 📷 Selfie                            │  
└──────────────────────────────────────┘

# **10\. Status Kehadiran**

Sistem dapat menentukan status berdasarkan aturan yang dikonfigurasi.

Contoh:

08:00 \- 08:15  
      ↓  
    HADIR

\> 08:15  
      ↓  
  TERLAMBAT

Tidak melakukan absensi  
      ↓  
    ALPHA

Mendapat persetujuan  
      ↓  
     IZIN

Jangan hard-code jam tersebut di frontend.

Lebih baik disimpan sebagai attendance policy/settings, sehingga mentor/admin bisa mengubahnya.

# 11\. Database Concept

Struktur awal PostgreSQL:

users  
│  
├── id  
├── name  
├── email  
├── password\_hash  
├── role  
├── created\_at  
└── updated\_at

interns  
│  
├── id  
├── user\_id  
├── university  
├── major  
├── phone  
├── supervisor\_id  
├── start\_date  
├── end\_date  
└── status

attendance  
│  
├── id  
├── intern\_id  
├── attendance\_date  
│  
├── check\_in  
├── check\_in\_latitude  
├── check\_in\_longitude  
├── check\_in\_accuracy  
├── check\_in\_distance  
├── check\_in\_photo\_url  
│  
├── check\_out  
├── check\_out\_latitude  
├── check\_out\_longitude  
├── check\_out\_accuracy  
├── check\_out\_distance  
├── check\_out\_photo\_url  
│  
├── status  
├── notes  
├── created\_at  
└── updated\_at

locations  
│  
├── id  
├── name  
├── latitude  
├── longitude  
├── radius  
└── status

attendance\_corrections  
│  
├── id  
├── attendance\_id  
├── corrected\_by  
├── old\_value  
├── new\_value  
├── reason  
└── created\_at

# 12\. Relasi Database

Secara konsep:

                   USERS  
                      │  
              ┌───────┴────────┐  
              │                │  
              ▼                ▼  
           INTERNS           MENTORS  
              │  
              │ 1  
              │  
              │ N  
              ▼  
         ATTENDANCE  
              │  
       ┌──────┴──────┐  
       │             │  
       ▼             ▼  
   CHECK-IN      CHECK-OUT  
       │             │  
       ▼             ▼  
     PHOTO         PHOTO

Sedangkan:

LOCATIONS  
    │  
    │ digunakan untuk  
    ▼  
GEOFENCING  
    │  
    ▼  
ATTENDANCE

# **13\. Dashboard Peserta**

Konsep UI:

┌────────────────────────────────────────────┐  
│ Internship Attendance                     │  
├────────────────────────────────────────────┤  
│                                            │  
│ Selamat datang, Salsabila 👋              │  
│ Jumat, 28 Agustus 2026                     │  
│                                            │  
│ ┌────────────────────────────────────────┐ │  
│ │ STATUS HARI INI                        │ │  
│ │                                        │ │  
│ │ 🟢 Sudah Check-In                      │ │  
│ │                                        │ │  
│ │ 08:57                                  │ │  
│ │                                        │ │  
│ │ 📍 43 meter dari lokasi                │ │  
│ │                                        │ │  
│ │ \[ ABSEN PULANG \]                       │ │  
│ └────────────────────────────────────────┘ │  
│                                            │  
│ Kehadiran Bulan Ini                        │  
│                                            │  
│ Hadir       Terlambat      Izin     Alpha │  
│   18           2             1        0   │  
│                                            │  
│ \[ Lihat Riwayat \]                          │  
└────────────────────────────────────────────┘

# **14\. Dashboard Mentor**

Mentor lebih membutuhkan informasi agregat.

┌────────────────────────────────────────────────┐  
│ Mentor Dashboard                               │  
├────────────────────────────────────────────────┤  
│                                                │  
│ 25             21             3          1     │  
│ Peserta       Hadir       Terlambat     Izin   │  
│                                                │  
├────────────────────────────────────────────────┤  
│ Kehadiran Hari Ini                             │  
│                                                │  
│ Search: \[\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\]                 │  
│                                                │  
│ Nama       Check In  Check Out   Status        │  
│ ────────────────────────────────────────────── │  
│ Andi       07:58     16:03       Hadir         │  
│ Salsabila  08:57     \--          Aktif         │  
│ Budi       09:17     16:02       Terlambat     │  
│ Citra      \--        \--          Belum Hadir   │  
│                                                │  
└────────────────────────────────────────────────┘

Mentor kemudian dapat klik:

Salsabila → Detail Absensi

dan melihat:

Tanggal       : 28 Agustus 2026  
Check-in     : 08:57  
Check-out    : 16:04  
Status       : Hadir

Lokasi:  
Distance     : 43 meter  
Accuracy     : 12 meter

Foto Check-in:  
\[ SELFIE \]

Foto Check-out:  
\[ SELFIE \]

# 15\. API Concept

Go akan menjadi REST API.

Contoh endpoint:

AUTH  
POST   /api/auth/login  
POST   /api/auth/logout  
GET    /api/auth/me

ATTENDANCE  
POST   /api/attendance/check-in  
POST   /api/attendance/check-out  
GET    /api/attendance/today  
GET    /api/attendance/history  
GET    /api/attendance/:id

MENTOR  
GET    /api/mentor/dashboard  
GET    /api/mentor/attendance  
GET    /api/mentor/interns  
GET    /api/mentor/interns/:id

LOCATION  
GET    /api/locations  
POST   /api/locations  
PUT    /api/locations/:id

REPORT  
GET    /api/reports/attendance  
GET    /api/reports/attendance/export

# **16\. Security Concept**

Karena ini menyimpan foto dan lokasi peserta, security harus diperhatikan sejak awal.

Minimal:

HTTPS  
  ↓  
Authentication  
  ↓  
Authorization / Role  
  ↓  
Input Validation  
  ↓  
Backend Geofencing  
  ↓  
File Validation  
  ↓  
Secure Photo Storage

Untuk foto:

* Jangan percaya MIME type dari frontend saja.  
* Batasi ukuran file.  
* Validasi ekstensi/content.  
* Generate nama file sendiri.  
* Jangan gunakan nama file dari user.  
* Storage sebaiknya tidak membuat semua foto menjadi public.  
* Akses foto sebaiknya melalui URL yang aman/signed URL atau endpoint yang terproteksi.

# **17\. Audit Log**

Saya sangat menyarankan fitur ini.

Misalnya mentor mengubah:

Check-in:  
09:15 → 08:15

Sistem menyimpan:

Changed by : Mentor A  
Old value  : 09:15  
New value  : 08:15  
Reason     : Koreksi absensi  
Time       : 28 Aug 2026 10:32

Jadi tidak ada perubahan data yang "diam-diam".

# 18\. Struktur Teknologi

Saya akan menggunakan:

| Layer | Teknologi |
| ----- | ----- |
| Frontend | Next.js |
| UI | Tailwind CSS |
| Backend | Go |
| API | REST |
| Database | PostgreSQL |
| Authentication | JWT / Secure Cookie |
| Location | Browser Geolocation API |
| Geofencing | Haversine Distance |
| Camera | Browser MediaDevices API |
| Image Processing | Client-side compression |
| File Storage | S3-compatible Object Storage |
| Deployment | Docker |
| Reverse Proxy | Nginx / Caddy |

Untuk Next.js, kita bisa menggunakan App Router.

# 19\. Deployment Concept

Ketika sudah production:

                   INTERNET  
                       │  
                       ▼  
                 ┌─────────────┐  
                 │   NGINX     │  
                 │ Reverse Proxy│  
                 └──────┬──────┘  
                        │  
             ┌──────────┴──────────┐  
             │                     │  
             ▼                     ▼  
       ┌────────────┐        ┌────────────┐  
       │  Next.js   │        │     Go     │  
       │  Frontend  │        │   Backend  │  
       └────────────┘        └─────┬──────┘  
                                   │  
                           ┌───────┴────────┐  
                           │                │  
                           ▼                ▼  
                     PostgreSQL       Object Storage

Semuanya bisa dijalankan menggunakan Docker Compose untuk development maupun deployment awal.

---

# 20\. Alur Sistem Secara Keseluruhan

Ini yang menurut saya paling tepat menjadi core concept proyekmu:

                        ┌───────────────┐  
                         │     USER      │  
                         └───────┬───────┘  
                                 │  
                                 ▼  
                         ┌───────────────┐  
                         │    LOGIN      │  
                         └───────┬───────┘  
                                 │  
                    ┌────────────┴────────────┐  
                    │                         │  
                    ▼                         ▼  
              PESERTA MAGANG              MENTOR  
                    │                         │  
                    ▼                         ▼  
               DASHBOARD                DASHBOARD  
                    │                         │  
                    ▼                         ├── Monitoring  
              CHECK-IN / OUT                 ├── Peserta  
                    │                        ├── Riwayat  
          ┌─────────┼─────────┐              ├── Rekap  
          │         │         │              └── Laporan  
          ▼         ▼         ▼  
         GPS      SELFIE    TIME  
          │         │         │  
          └─────────┼─────────┘  
                    │  
                    ▼  
              GO BACKEND  
                    │  
          ┌─────────┴─────────┐  
          │                   │  
          ▼                   ▼  
    GEOFENCING             VALIDATION  
          │                   │  
          └─────────┬─────────┘  
                    │  
                    ▼  
             SAVE ATTENDANCE  
                    │  
             ┌──────┴───────┐  
             ▼              ▼  
        PostgreSQL       Object Storage  
             │              │  
             │           Selfie  
             │  
             └──────┬───────┘  
                    ▼  
             MENTOR DASHBOARD

# 21\. Scope MVP yang Saya Rekomendasikan

Supaya proyeknya tidak melebar, versi pertama cukup:

### Peserta

* Login  
* Dashboard  
* Check-in  
* Check-out  
* GPS  
* Geofencing  
* Selfie  
* Riwayat absensi  
* Profil

### Mentor

* Login  
* Dashboard  
* Daftar peserta  
* Monitoring absensi  
* Detail absensi  
* Melihat selfie  
* Melihat lokasi  
* Filter absensi  
* Rekap

### Backend

* Authentication  
* Role & authorization  
* Attendance API  
* Geofencing  
* Image upload  
* PostgreSQL  
* Object storage  
* Audit log

### Setelah MVP

Baru tambahkan:

                   MVP  
                     │  
          ┌──────────┼──────────┐  
          ▼          ▼          ▼  
       Reports     Export     Analytics  
                                  │  
                                  ▼  
                            Attendance  
                             Statistics  
