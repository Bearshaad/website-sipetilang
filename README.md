# SIPETILANG — Sistem Pembelian Tiket Kolam Renang

Aplikasi web untuk penjualan dan pengelolaan tiket kolam renang, dikembangkan sebagai proyek akhir (skripsi/tugas akhir) berbasis dokumen SRS awal yang telah mengalami banyak perubahan dan penyempurnaan selama proses implementasi.

> Untuk memahami *kenapa* kode ditulis seperti sekarang (bukan sekadar *apa* yang berubah), baca juga [`CATATAN_PENGEMBANG.md`](./CATATAN_PENGEMBANG.md). Untuk riwayat perubahan lengkap dari SRS awal sampai kondisi terkini, baca [`CHANGELOG.md`](./CHANGELOG.md).

---

## 1. Gambaran Umum

SIPETILANG membantu proses penjualan tiket kolam renang secara langsung di loket (on-the-spot), mencakup:

- **Penjualan** — pencarian tiket, keranjang multi-jenis tiket, perhitungan subtotal/pajak/total otomatis
- **Pembayaran** — Tunai maupun **QRIS** (integrasi sungguhan via Midtrans Core API, mode sandbox)
- **Invoice & QR Tiket** — setiap transaksi selesai menghasilkan invoice dengan kode QR unik sebagai bukti masuk
- **Validasi Tiket** — endpoint terpisah untuk perangkat scanner di pintu masuk (autentikasi via device key, bukan akun user)
- **Kelola Tiket** — CRUD jenis tiket, aktif/nonaktifkan tanpa menghapus data historis
- **Kelola Petugas** — Owner mengelola akun petugas loket, termasuk status online real-time (heartbeat)
- **Laporan Penjualan** — filter periode (harian/mingguan/bulanan/tahunan) + pemilih tahun, pencarian tanggal, export Excel, pagination server-side
- **Statistik (khusus Owner)** — grafik tren pendapatan dan ranking tiket terlaris

## 2. Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Router, Context API, Axios |
| Backend | Node.js, Express.js (ES Modules), JWT, bcrypt |
| Database | MySQL (`mysql2`) |
| Pembayaran | Midtrans Core API (`midtrans-client`) — mode Sandbox |
| Testing manual | VS Code REST Client (`.rest` files), MySQL Workbench |

Grafik/chart dibuat murni dengan SVG + Tailwind (tidak ada library chart pihak ketiga) — lihat `CATATAN_PENGEMBANG.md` untuk alasannya.

## 3. Struktur Folder

```
Backend/
├── config/          # koneksi database, konfigurasi Midtrans
├── controllers/      # logic request/response, validasi input
├── models/           # query database (tidak boleh bergantung ke req/res)
├── routes/            # definisi endpoint + middleware
├── middlewares/       # auth JWT, auth device key
└── index.mjs          # entry point, login/logout, mount semua routes

Frontend/src/
├── components/       # UI components, dikelompokkan per domain (laporan, petugas, tickets, ui)
├── context/          # state management global (Auth, Transaction, TicketCatalog, Toast, Confirm)
├── pages/             # 1 file per halaman/route
├── services/          # semua pemanggilan API dikumpulkan di sini
└── utils/              # helper murni (format currency, tanggal)
```

## 4. Environment Variables

### Backend (`.env`)

```
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=sipetilang
JWT_SECRET=
DEVICE_API_KEY=
FRONTEND_URL=http://localhost:5173
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=false
```

- `DEVICE_API_KEY` — dipakai oleh perangkat scanner QR di pintu masuk (header `x-device-key`), terpisah dari autentikasi JWT biasa.
- `FRONTEND_URL` — membatasi CORS hanya ke origin frontend yang sah (bisa lebih dari 1, dipisah koma).
- `MIDTRANS_SERVER_KEY` — didapat dari dashboard Sandbox Midtrans (**Settings → Access Keys**). Lihat `CATATAN_PENGEMBANG.md` untuk panduan lengkap setup Midtrans.

### Frontend (`.env`)

```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_DEVICE_API_KEY=
```

## 5. Setup & Instalasi

### Database

1. Jalankan `console.sql` di MySQL Workbench untuk membuat schema dari nol.
2. **Buat akun Owner pertama secara manual** (tidak ada endpoint publik untuk ini, disengaja — lihat `CATATAN_PENGEMBANG.md` bagian "Bootstrap Owner Pertama"):

```sql
-- Generate hash password dulu lewat Node REPL:
-- node -e "require('bcrypt').hash('passwordAnda', 10).then(console.log)"

INSERT INTO owner (nama_owner, username_owner, password_owner, email_owner, no_hp_owner)
VALUES ('Nama Owner', 'username', '<hasil_hash_bcrypt>', 'email@contoh.com', '081234567890');
```

### Backend

```bash
cd Backend
npm install
# isi .env sesuai bagian 4
npm run dev
```

### Frontend

```bash
cd Frontend
npm install
# isi .env sesuai bagian 4
npm run dev
```

## 6. Testing Manual

- Gunakan `test_api.rest` (VS Code REST Client) untuk menguji endpoint backend tanpa lewat UI.
- Untuk QRIS, gunakan **Midtrans Payment Simulator** (https://simulator.sandbox.midtrans.com/qris/index) — masukkan **QR Code Image URL** (dari field `actions[].url` pada response charge, bukan `qr_string`) untuk mensimulasikan pembayaran berhasil.

## 7. Batasan yang Diketahui Saat Ini

Lihat bagian "Keterbatasan yang Diketahui" di `CATATAN_PENGEMBANG.md` untuk daftar lengkap — termasuk hal-hal yang sengaja belum diimplementasikan (misal `npm audit`, automated testing, dual-screen display untuk QRIS) beserta alasannya.
