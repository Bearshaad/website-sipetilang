import crypto from 'crypto'
import db from '../config/db.mjs'
import * as transaksiModel from '../models/transaksiModel.js'

const TAX_RATE = 0.11;

class BusinessError extends Error {}

export async function createTransaksi(req, res) {
    const id_petugas = req.user.id;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'items wajib diisi' });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        let subtotalTransaksi = 0;
        const itemsWithHarga = [];

        for (const item of items) {
            if (!item.id_tiket || !Number.isInteger(item.qty) || item.qty <= 0) {
                throw new BusinessError(`Jumlah tiket tidak valid untuk id ${item.id_tiket}`);
            }

            const tiket = await transaksiModel.getTiketForTransaksi(connection, item.id_tiket);

            if (!tiket) {
                throw new BusinessError(`Tiket dengan id ${item.id_tiket} tidak ditemukan`);
            }
            if (tiket.status_tiket !== 'Tersedia') {
                throw new BusinessError(`Tiket dengan id ${item.id_tiket} sedang tidak tersedia`);
            }

            const hargaSatuan = tiket.harga_tiket;
            const subtotalItem = hargaSatuan * item.qty;
            subtotalTransaksi += subtotalItem;

            itemsWithHarga.push({
                id_tiket: item.id_tiket,
                qty: item.qty,
                harga_tiket: hargaSatuan,
                subtotal_item: subtotalItem,
            });
        }

        const taxTransaksi = Math.round(subtotalTransaksi * TAX_RATE);
        const totalTransaksi = subtotalTransaksi + taxTransaksi;

        const idTransaksiBaru = await transaksiModel.createHeader(connection, {
            id_petugas,
            subtotal: subtotalTransaksi,
            tax: taxTransaksi,
            total: totalTransaksi,
        });

        for (const item of itemsWithHarga) {
            await transaksiModel.createDetailItem(connection, {
                id_transaksi: idTransaksiBaru,
                ...item,
            });
        }

        await connection.commit();

        res.status(201).json({
            id_transaksi: idTransaksiBaru,
            subtotal_transaksi: subtotalTransaksi,
            tax_transaksi: taxTransaksi,
            total_transaksi: totalTransaksi,
            status_transaksi: 'Pending',
            items: itemsWithHarga,
        });
        
    } catch (error) {
        await connection.rollback();
        if (error instanceof BusinessError) {
            return res.status(400).json({ message: error.message });
        }
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    } finally {
        connection.release();
    }
}

export async function getTransaksiById(req, res) {
    try {
        const { id } = req.params;
        const transaksi = await transaksiModel.findById(id);

        if (!transaksi) {
            return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        }

        const items = await transaksiModel.findItemsById(id);

        res.status(200).json({ ...transaksi, items });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
}

export async function updateStatusTransaksi(req, res) {
    const { id } = req.params;
    const { status_transaksi } = req.body;

    const statusValid = ['Pending', 'Selesai', 'Dibatalkan'];
    if (!statusValid.includes(status_transaksi)) {
        return res.status(400).json({ message: 'Status tidak valid' });
    }

    const STATUS_FINAL = ['Selesai', 'Dibatalkan'];

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const transaksiSaatIni = await transaksiModel.getByIdForUpdate(connection, id);

        if (!transaksiSaatIni) {
            await connection.rollback();
            return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        }

        // Kasus konfirmasi 'Selesai' yang diulang (idempotent) - kembalikan invoice yang sudah ada,
        // bukan error, karena ini kemungkinan besar cuma double-klik dari user.
        if (status_transaksi === 'Selesai' && transaksiSaatIni.status_transaksi === 'Selesai') {
            const invoiceLama = await transaksiModel.findInvoiceByTransaksiId(connection, id);
            await connection.commit();
            return res.status(200).json({
                message: 'Transaksi ini sudah dikonfirmasi sebelumnya',
                invoice: invoiceLama
                    ? {
                          id_invoice: invoiceLama.id_invoice,
                          kode_qr: invoiceLama.kode_qr,
                          tanggal_transaksi: invoiceLama.tanggal_transaksi,
                      }
                    : null,
            });
        }

        // Status final (Selesai / Dibatalkan) tidak boleh diubah lagi ke status APAPUN.
        if (STATUS_FINAL.includes(transaksiSaatIni.status_transaksi)) {
            await connection.rollback();
            return res.status(409).json({
                message: `Transaksi ini sudah berstatus '${transaksiSaatIni.status_transaksi}' dan tidak dapat diubah lagi`,
            });
        }

        const affectedRows = await transaksiModel.updateStatus(connection, id, status_transaksi);

        if (affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        }

        let invoiceData = null;

        if (status_transaksi === 'Selesai') {
            const transaksi = await transaksiModel.getByIdForUpdate(connection, id);
            const totalQty = await transaksiModel.sumQtyByTransaksiId(connection, id);

            const kodeQr = crypto.randomUUID();
            const idQrBaru = await transaksiModel.createQr(connection, kodeQr);

            const idInvoiceBaru = await transaksiModel.createInvoice(connection, {
                id_transaksi: id,
                id_qr: idQrBaru,
                qty_invoice: totalQty,
                invoice_subtotal: transaksi.subtotal_transaksi,
            });

            invoiceData = { id_invoice: idInvoiceBaru, kode_qr: kodeQr, tanggal_transaksi: transaksi.tanggal_transaksi };
        }

        await connection.commit();
        res.status(200).json({ message: 'Status transaksi berhasil diperbarui', invoice: invoiceData });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    } finally {
        connection.release();
    }
}