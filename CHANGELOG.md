# Changelog SIPETILANG

Dokumen ini mencatat perjalanan SIPETILANG dari dokumen SRS awal hingga kondisi implementasi saat ini. Tujuannya dua: (1) jadi bahan revisi SRS, dan (2) membantu developer baru memahami *kenapa* sistem berbentuk seperti sekarang, bukan cuma *apa* yang ada.

---

## Bagian 1 — Perbedaan Besar dari SRS Awal

SRS awal disusun saat penulis masih dalam masa pelatihan, dan cukup banyak berubah selama implementasi nyata.

| Aspek | SRS Awal | Implementasi Aktual | Alasan |
|---|---|---|---|
| Platform | Desktop app (C# + .NET) | Web app (React + Vite + Express.js) | Perubahan arah teknis di tengah pengembangan |
| Aktor | 3 aktor: Owner, Petugas Loket, Petugas Pintu Masuk (masing-masing login) | 2 role login (`owner`, `petugas`) + validasi QR via device key (bukan akun user) | Petugas pintu masuk secara praktik lebih tepat sebagai "perangkat scanner", bukan akun manusia yang login |
| Skema Transaksi | 1 transaksi = 1 jenis tiket | 1 transaksi (header) → banyak baris `detail_transaksi` (model keranjang belanja) | Mendukung pembelian beberapa jenis tiket sekaligus dalam 1 transaksi |
| Pajak | Tidak disebut di SRS | PPN 11% dihitung otomatis (`tax_transaksi`) | Kebutuhan bisnis nyata yang muncul saat implementasi |
| Metode Pembayaran | Hanya tunai di loket, SRS eksplisit menyebut "tidak mendukung pembayaran online" | Tunai **dan** QRIS (integrasi Midtrans, sandbox) | Lihat diskusi Bagian 3 — perlu direview ulang di SRS revisi apakah QRIS on-the-spot termasuk "pembayaran online" yang dimaksud |
| Status data | Tidak ada konsep status eksplisit | `status_transaksi` (Pending/Selesai/Dibatalkan), `status_tiket` (Tersedia/Tidak Tersedia), `status_petugas` (Aktif/Resign), `status_online` (real-time) | Kebutuhan operasional yang muncul selama development |

**Rekomendasi:** SRS revisi perlu memperbarui bagian Batasan, Antarmuka Perangkat Lunak, ERD, dan Functional Requirement agar sesuai kondisi aktual di atas.

---

## Bagian 2 — Perbaikan Keamanan & Integritas Data

Dikelompokkan berdasarkan area, bukan kronologis murni, supaya lebih mudah dijadikan referensi.

### Race Condition & Duplikasi Data
- **Double invoice/QR saat konfirmasi pembayaran** — endpoint `PUT /transaksi/:id/status` sebelumnya bisa dipanggil dua kali (misal double-klik) dan membuat invoice+QR ganda. Diperbaiki dengan `SELECT ... FOR UPDATE` (row-level locking) + pengecekan idempotency.
- **State transisi status transaksi tidak dibatasi** — transaksi berstatus `Selesai`/`Dibatalkan` sebelumnya bisa diubah lagi ke status apapun, berpotensi membuka kembali celah duplikasi invoice. Ditambahkan aturan: kedua status itu bersifat final, tidak bisa diubah lagi.
- **Race condition validasi QR tiket** — dua scan QR yang sama nyaris bersamaan berpotensi sama-sama lolos. Diperbaiki dengan pola locking yang sama seperti di atas.

### Autentikasi & Otorisasi
- **`id_petugas` rentan dipalsukan** — sebelumnya diambil dari `req.body` (bisa diisi bebas oleh client), sekarang diambil dari `req.user.id` hasil decode JWT yang sudah terverifikasi.
- **Owner bisa mengedit akun Owner lain tanpa batas** — ditambahkan pengecekan `Number(id) !== req.user.id` di endpoint update owner.
- **Username petugas & owner tidak `UNIQUE`** — bisa menyebabkan 2 akun bertabrakan username, salah satu tidak pernah bisa login. Ditambahkan constraint `UNIQUE` di database.
- **Password hash ikut terkirim ke client** — endpoint list petugas/owner sebelumnya pakai `SELECT *` (termasuk kolom password). Diganti jadi eksplisit menyebut kolom yang aman dikirim.

### Validasi Input
- Ditambahkan validasi field wajib + format email (regex) di endpoint tiket, petugas, dan owner.
- Ditambahkan validasi `qty` transaksi harus bilangan bulat positif (mencegah qty 0/negatif lolos ke database).
- Ditambahkan validasi harga tiket tidak boleh negatif (`Number(harga_tiket) < 0` ditolak), sekaligus **mengizinkan harga 0** (tiket gratis/promo) — sebelumnya tertolak keliru karena validasi lama memakai truthy-check (`!harga_tiket`, di mana `0` dianggap "kosong").
- Ditambahkan validasi `period` di endpoint laporan — nilai selain `daily/weekly/monthly/yearly` sebelumnya diam-diam mengembalikan seluruh data tanpa filter.

### Penanganan Error
- Pesan error mentah dari database (misal detail foreign key constraint) berpotensi bocor ke client lewat `error.message`. Dipisahkan lewat class `BusinessError` — error yang sengaja dilempar sendiri (aman ditampilkan) vs error tak terduga dari sistem (diganti pesan generic, detail asli tetap dicatat lewat `console.error` untuk debugging).
- CORS sebelumnya terbuka untuk semua origin (`cors()` tanpa opsi). Dibatasi ke origin yang terdaftar di `FRONTEND_URL`.

---

## Bagian 3 — Bug Perilaku & UX

- **Parsing nama bulan Indonesia** (`date.js`) — singkatan bulan untuk Mei/Agustus/Oktober/Desember salah (memakai singkatan Inggris `may/aug/oct/dec`, padahal `toLocaleDateString('id-ID')` menghasilkan singkatan Indonesia). *(Catatan: fungsi ini kemudian jadi tidak terpakai lagi setelah pencarian laporan dipindah ke server-side, lihat Bagian 4.)*
- **Pembatalan transaksi gagal secara senyap** — `clearTransaction()` dan redirect sebelumnya tetap jalan meski request pembatalan ke backend gagal. Dipindahkan ke dalam blok `try` (hanya jalan jika sukses), ditambahkan toast error untuk kasus gagal.
- **Popup tidak bisa ditutup dengan klik di luar modal** — backdrop tidak punya `onClick`, walau ada `stopPropagation()` yang seakan mengantisipasinya.
- **Layar kosong saat cek status login** — diganti dengan spinner.
- **Token JWT kedaluwarsa tidak dicek saat aplikasi dibuka** — sekarang dicek langsung dari payload token (`exp`) sebelum dipercaya, tanpa perlu round-trip ke server.
- **Halaman Login tidak redirect user yang sudah login** — ditambahkan pengecekan `isAuthenticated`, sekaligus memperbaiki bug urutan React Hooks (early return sebelum semua `useState` dipanggil).
- **Badge status Online berkedip/salah setelah edit data petugas** — penyebabnya `updatePetugas`/`createPetugas` mengembalikan object hasil susunan manual (tidak menyertakan field `online`). Diperbaiki dengan refetch penuh dari server setelah create/update, bukan menyusun object secara manual di frontend.
- **`TicketCatalogContext` memicu request 403 untuk role Owner** — context ini dipasang global tapi hanya relevan untuk role `petugas`. Ditambahkan pengecekan role sebelum fetch.
- **Pagination pecah untuk data banyak halaman** — `Pagination.jsx` sebelumnya merender *semua* nomor halaman tanpa batas (bisa 100+ tombol berjejer). Diganti pola *windowed pagination* dengan tanda `...`, otomatis berlaku di semua halaman yang memakai komponen ini (Kelola Tiket, Akun, Laporan).

---

## Bagian 4 — Fitur Baru

### Status Online Petugas (Heartbeat)
- Awalnya toggle sederhana (`status_online` di-set saat login/logout).
- Disempurnakan jadi mekanisme **heartbeat**: frontend mengirim "ping" tiap 2 menit selagi petugas login, kolom `last_active` di-update tiap ping. Status "Online" dihitung dari kombinasi `status_online = true DAN last_active dalam 5 menit terakhir` — menutup celah "tab ditutup tanpa logout" yang tidak tertangani toggle manual saja.
- Halaman Akun melakukan polling tiap 30 detik untuk menampilkan perubahan status tanpa perlu refresh manual.

### Laporan Penjualan — Server-Side Pagination & Pencarian
- Data transaksi (yang tumbuh tanpa batas seiring waktu, beda sifatnya dari data tiket/petugas yang relatif tetap kecil) dipindah dari client-side pagination ke server-side (`LIMIT`/`OFFSET` di query, query 2-langkah karena 1 transaksi bisa punya banyak baris `detail_transaksi`).
- Pencarian tanggal disederhanakan (`LIKE` terhadap format `DD-MM-YYYY`) dan dipindah ke server, dengan debounce 500ms di frontend untuk mengurangi jumlah request.
- Ditambahkan mekanisme `requestId` untuk mencegah response yang datang belakangan menimpa hasil yang lebih baru (race condition saat pindah halaman/ganti pencarian cepat).
- Ditambahkan endpoint export terpisah (`GET /laporan/export`) yang tidak terbatas `LIMIT`, khusus untuk fitur Unduh Laporan Excel.
- Ditambahkan pemilih tahun — laporan tidak lagi otomatis terbatas ke "tahun sekarang"; bisa melihat riwayat tahun-tahun sebelumnya untuk semua filter periode (Daily/Weekly/Monthly/Yearly), dengan bulan/tanggal acuan tetap mengikuti hari ini.

### Dashboard Statistik (khusus Owner)
- Grafik tren pendapatan (SVG line chart custom, tanpa library chart) dengan interaksi hover (tooltip custom + titik yang mengikuti kursor).
- Jendela waktu tren disesuaikan per periode: Daily → bulan berjalan (tanggal 1 s/d hari ini), Weekly → hari-hari dalam minggu ini, Monthly → 6 bulan terakhir, Yearly → bulan-bulan dalam tahun berjalan.
- Ranking Tiket Terlaris (top 5, agregasi `SUM(qty)` per jenis tiket).
- Endpoint dan data ini dibatasi khusus role `owner` baik di frontend maupun backend (defense in depth).

### Pembayaran QRIS (Integrasi Midtrans Sandbox)
- Petugas bisa memilih metode Tunai atau QRIS saat konfirmasi pembayaran.
- QRIS memanggil Midtrans Core API (`charge`) untuk membuat tagihan, menampilkan QR code (`qrcode.react`) langsung di UI aplikasi (bukan redirect ke halaman Midtrans).
- Status pembayaran dicek lewat **polling** (tiap 3 detik) ke Midtrans — dipilih dibanding webhook karena aplikasi berjalan di `localhost` saat development (webhook butuh URL publik).
- QR kedaluwarsa otomatis setelah 30 menit, dengan opsi generate ulang.
- Struk (`Receipt.jsx`) mencantumkan metode pembayaran yang dipakai.

### Lain-lain
- Dialog konfirmasi ditambahkan untuk aksi Logout (konsisten dengan pola konfirmasi di aksi lain seperti hapus tiket/batalkan transaksi).
- `ConfirmContext` diperkuat agar tidak ada Promise yang menggantung jika `confirm()` dipanggil dua kali sebelum yang pertama dijawab.

---

## Bagian 5 — Perubahan Skema Database

| Tabel | Perubahan |
|---|---|
| `petugasLoket` | + `status_online BOOLEAN`, + `last_active TIMESTAMP`, `username_petugas` jadi `UNIQUE` |
| `owner` | `username_owner` jadi `UNIQUE` |
| `transaksi` | + `metode_pembayaran ENUM('Tunai','QRIS')`, + `qris_order_id VARCHAR(100)`, + `qris_expired_at TIMESTAMP` |

Seluruh perubahan ini sudah disinkronkan ke `console.sql` sebagai sumber kebenaran skema.

## Bagian 6 — Dependency Baru

| Package | Lokasi | Alasan |
|---|---|---|
| `midtrans-client` | Backend | Library resmi Midtrans untuk komunikasi dengan Core API (autentikasi & format request pembayaran) |

Tidak ada library chart/visualisasi baru yang ditambahkan — seluruh grafik statistik dibuat dengan SVG native + Tailwind, lihat `CATATAN_PENGEMBANG.md`.
