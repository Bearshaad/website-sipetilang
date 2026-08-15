#########################################################
## Ini Awal Dari DDL
#########################################################

DROP database IF EXISTS SIPETILANG;
CREATE database SIPETILANG;
USE SIPETILANG;

#########################################################
## Membuat Tabel Owner
#########################################################

CREATE TABLE owner (
id_owner INT AUTO_INCREMENT PRIMARY KEY,
nama_owner VARCHAR(50),
username_owner VARCHAR(10),
password_owner VARCHAR(60),
email_owner VARCHAR(50) UNIQUE,
no_hp_owner CHAR(13)
);

#########################################################
## Membuat Tabel Petugas Loket
#########################################################

CREATE TABLE petugasLoket (
id_petugas INT AUTO_INCREMENT PRIMARY KEY,
nama_petugas VARCHAR(50),
username_petugas VARCHAR(10),
password_petugas VARCHAR(60),
email_petugas VARCHAR(50) UNIQUE,
no_hp_petugas CHAR(13),
status_petugas ENUM('Aktif','Resign') DEFAULT 'Aktif',
status_online BOOLEAN DEFAULT FALSE
);

#########################################################
## Membuat Tabel Jenis Tiket
#########################################################

CREATE TABLE jenisTiket (
id_tiket INT AUTO_INCREMENT PRIMARY KEY,
nama_tiket VARCHAR(50),
harga_tiket FLOAT,
deskripsi_tiket TEXT,
status_tiket ENUM('Tersedia','Tidak Tersedia') DEFAULT 'Tersedia'
);

#########################################################
## Membuat Tabel Transaksi
#########################################################

CREATE TABLE transaksi (
id_transaksi INT AUTO_INCREMENT PRIMARY KEY,
id_petugas INT NOT NULL,
tanggal_transaksi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
subtotal_transaksi DECIMAL(12,2),
tax_transaksi DECIMAL(12,2),
total_transaksi DECIMAL(12,2),
status_transaksi ENUM('Pending','Selesai','Dibatalkan') DEFAULT 'Pending',

FOREIGN KEY(id_petugas) REFERENCES petugasLoket(id_petugas)
);

#########################################################
## Membuat Tabel Detail Transaksi
#########################################################

CREATE TABLE detail_transaksi (
id_detail INT AUTO_INCREMENT PRIMARY KEY,
id_transaksi INT NOT NULL,
id_tiket INT NOT NULL,
qty INT NOT NULL,
harga_tiket DECIMAL(12,2) NOT NULL,
subtotal_item DECIMAL(12,2) NOT NULL,

FOREIGN KEY(id_transaksi) REFERENCES transaksi(id_transaksi),
FOREIGN KEY(id_tiket) REFERENCES jenisTiket(id_tiket)
);

#########################################################
## Membuat Tabel QR Tiket
#########################################################

CREATE TABLE QRTiket (
id_qr INT AUTO_INCREMENT PRIMARY KEY,
kode_qr VARCHAR(500),
status_qr BOOLEAN DEFAULT TRUE
);

#########################################################
## Membuat Tabel Invoice
#########################################################

CREATE TABLE invoice (
id_invoice INT AUTO_INCREMENT PRIMARY KEY,
id_transaksi INT NOT NULL,
id_qr INT NOT NULL,
tanggal_invoice TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
qty_invoice INT,
invoice_subtotal DECIMAL(12,2),

FOREIGN KEY(id_transaksi) REFERENCES transaksi(id_transaksi),
FOREIGN KEY(id_qr) REFERENCES QRTiket(id_qr)
);

