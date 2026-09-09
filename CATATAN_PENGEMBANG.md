# Catatan untuk Developer Selanjutnya

Dokumen ini untuk siapa pun yang melanjutkan pengembangan SIPETILANG setelah developer awal berhenti terlibat. Isinya bukan pengulangan dari `CHANGELOG.md` (itu mencatat *apa* yang berubah) — dokumen ini fokus pada *kenapa* beberapa bagian kode ditulis dengan cara tertentu, apa yang sengaja belum dikerjakan, dan ke mana sebaiknya pengembangan lanjutan diarahkan.

---

## 1. Bootstrap Owner Pertama — Kenapa Manual, Bukan Endpoint

`POST /api/owner` mewajibkan role `owner` yang sudah login (`requireRole('owner')`). Ini artinya untuk membuat owner pertama kali, tidak ada cara lewat aplikasi — sengaja dibuat manual lewat SQL (lihat `README.md` bagian 5).

**Kenapa tidak dibuka aksesnya "kalau tabel owner kosong"?** Itu opsi yang sempat dipertimbangkan, tapi ditolak karena menambah kompleksitas permanen (logic kondisional yang harus terus dijaga) untuk kebutuhan yang cuma terjadi sekali (saat setup awal). Kalau nanti project ini benar-benar akan di-deploy berulang kali ke instance baru (multi-tenant, dsb), opsi itu layak dipertimbangkan ulang.

## 2. `id_petugas` dan `id_owner` Selalu dari JWT, Bukan dari Body

Aturan yang dipegang konsisten di seluruh backend: apa pun yang berkaitan dengan "siapa yang melakukan aksi ini" **wajib** diambil dari `req.user` (hasil decode token JWT yang sudah diverifikasi tanda tangannya), bukan dari `req.body`. Body/query bisa diisi bebas oleh siapa pun yang mengirim request, token tidak bisa dipalsukan tanpa `JWT_SECRET`.

Kalau menambah endpoint baru yang butuh tahu "siapa user yang login", ikuti pola ini — jangan tergoda menerima `id_petugas`/`id_owner` dari body meski terlihat lebih praktis.

## 3. `LIMIT`/`OFFSET` Disuntik Langsung ke String SQL, Bukan Lewat Placeholder `?`

Di `laporanModel.js`, nilai `LIMIT` dan `OFFSET` ditulis langsung ke string query (bukan `LIMIT ? OFFSET ?`). Ini **bukan** kelalaian keamanan — beberapa versi driver `mysql2` punya keterbatasan menerima kombinasi `LIMIT ?/OFFSET ?` lewat prepared statement (pernah menyebabkan error 500 di tengah development fitur pagination). Karena nilai `limit`/`offset` sudah dipastikan berupa `Number.isInteger()` sebelum disuntikkan (tidak pernah teks mentah dari user), ini tetap aman dari SQL injection.

**Jangan tiru pola ini untuk nilai yang benar-benar berasal dari input user** (misal `search`) — itu tetap wajib lewat placeholder `?` seperti biasa.

## 4. Kenapa Grafik Statistik Tidak Pakai Library Chart

`RevenueTrendChart.jsx` dan `TopTicketsChart.jsx` dibuat murni pakai SVG + Tailwind, bukan Recharts/Chart.js/dsb. Ini keputusan sadar mengikuti prinsip *simplicity* project — chart yang dibutuhkan (line chart sederhana, bar ranking) tidak butuh fitur kompleks yang baru bisa didapat dari library besar. Kalau kebutuhan chart ke depan jadi jauh lebih rumit (zoom, multi-axis, chart interaktif tingkat lanjut), itu titik yang wajar untuk mempertimbangkan ulang keputusan ini.

## 5. QRIS: Polling, Bukan Webhook — dan Ini Perlu Diubah Sebelum Production

Deteksi status pembayaran QRIS sekarang pakai **polling** (frontend nanya ke backend tiap 3 detik, backend nanya ke Midtrans). Ini dipilih karena development berjalan di `localhost`, yang tidak bisa menerima webhook dari internet luar tanpa tunnel tambahan (ngrok, dsb).

**Sebelum project ini benar-benar dipakai produksi**, sebaiknya migrasi ke webhook Midtrans (`POST /api/transaksi/qris/notification` — endpoint ini belum dibuat) supaya konfirmasi pembayaran lebih instan dan tidak membebani server dengan request polling berulang dari banyak transaksi sekaligus.

## 6. Kenapa Tiket & Petugas Tetap Client-Side Pagination, Cuma Laporan yang Server-Side

Data jenis tiket dan daftar petugas itu **secara alami** tetap kecil (realistis belasan/puluhan baris — jarang sekali kolam renang punya ratusan jenis tiket atau ratusan petugas). Data transaksi **tumbuh tanpa batas** setiap hari operasional berjalan. Server-side pagination cuma diterapkan di tempat yang benar-benar akan terasa dampaknya — menghindari kompleksitas yang tidak perlu di tempat lain.

## 7. Setup Midtrans Sandbox

1. Daftar di dashboard.midtrans.com (mode Sandbox, tidak perlu verifikasi bisnis).
2. Buka **Settings → Access Keys**, salin **Server Key** (`SB-Mid-server-...`).
3. Isi ke `.env` backend: `MIDTRANS_SERVER_KEY` dan `MIDTRANS_IS_PRODUCTION=false`.
4. Untuk testing pembayaran tanpa e-wallet sungguhan, pakai **Midtrans Payment Simulator**: https://simulator.sandbox.midtrans.com/qris/index — perlu **QR Code Image URL**, yaitu field `actions[].url` dari response `charge()` (bukan `qr_string`, yang itu untuk dirender sendiri sebagai QR image di aplikasi kita).

## 8. Keterbatasan yang Diketahui (Belum Dikerjakan, Sadar Ditunda)

| Item | Kenapa Ditunda |
|---|---|
| `npm audit` belum pernah dijalankan | Butuh koneksi internet yang tidak tersedia di lingkungan asisten AI saat sesi pengembangan; perlu dijalankan manual oleh developer |
| Tidak ada automated testing (unit/integration test) | Belum sempat, investasi waktu besar; validasi selama ini murni manual via REST Client + testing UI langsung |
| Index database belum dioptimasi | Baru relevan kalau volume data sudah signifikan; kandidat pertama: index pada `tanggal_transaksi` dan `status_transaksi` di tabel `transaksi` |
| Aksesibilitas (a11y) belum direview | Tidak ada requirement eksplisit di SRS; kontras warna, navigasi keyboard, screen reader belum diaudit |
| QRIS hanya 1 layar (petugas memutar layar ke pelanggan) | Solusi dual-screen (layar depan-belakang) direncanakan sebagai pengembangan lanjutan, belum diimplementasikan |
| Status "Online" petugas tidak instan mendeteksi tab ditutup paksa | Threshold heartbeat 5 menit berarti ada jeda maksimal 5 menit sebelum status berubah jadi offline setelah tab ditutup tanpa logout resmi — trade-off sadar demi kesederhanaan (dibanding WebSocket/realtime presence) |
| Promo "beli 2 gratis 1" belum ada | Sempat didiskusikan; disimpulkan beda scope dari sekadar "izinkan harga tiket Rp 0" (yang sudah didukung) — butuh perancangan aturan promo tersendiri |

## 9. Cara Membuat Data Dummy untuk Testing Laporan/Statistik

Kalau butuh data transaksi dalam jumlah banyak untuk testing (pagination, grafik tren, dsb), ada stored procedure sementara yang pernah dipakai selama development (generate transaksi acak dalam rentang tanggal tertentu, memakai data petugas/tiket yang sudah ada di database). Procedure ini **tidak** disertakan permanen di `console.sql` (murni alat bantu testing) — kalau butuh lagi, minta referensi ke riwayat percakapan pengembangan, atau tulis ulang dengan pola serupa: loop per hari, `INSERT` 1-3 transaksi acak per hari dengan `id_petugas`/`id_tiket` dipilih `ORDER BY RAND() LIMIT 1` dari data yang sudah ada.

**Selalu bersihkan data dummy setelah testing** (`DELETE ... WHERE id_transaksi > <batas_sebelum_dummy>`), dan **jangan pernah** jalankan generator semacam ini di database production.
