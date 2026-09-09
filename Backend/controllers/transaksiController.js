import crypto from 'crypto'
import db from '../config/db.mjs'
import coreApi from '../config/midtransClient.js'
import * as transaksiModel from '../models/transaksiModel.js'

const TAX_RATE = 0.11;
const QRIS_EXPIRY_MINUTES = 30;

class BusinessError extends Error {}

// Dipakai bersama oleh alur Tunai (manual) dan QRIS (otomatis via polling),
// supaya logika "tandai selesai + buat invoice + buat QR tiket" cuma ada di 1 tempat.
async function finalizeSelesai(connection, id) {
    const affectedRows = await transaksiModel.updateStatus(connection, id, 'Selesai');
    if (affectedRows === 0) return null;

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

    return { id_invoice: idInvoiceBaru, kode_qr: kodeQr, tanggal_transaksi: transaksi.tanggal_transaksi };
}

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

        if (STATUS_FINAL.includes(transaksiSaatIni.status_transaksi)) {
            await connection.rollback();
            return res.status(409).json({
                message: `Transaksi ini sudah berstatus '${transaksiSaatIni.status_transaksi}' dan tidak dapat diubah lagi`,
            });
        }

        let invoiceData = null;

        if (status_transaksi === 'Selesai') {
            invoiceData = await finalizeSelesai(connection, id);
        } else {
            await transaksiModel.updateStatus(connection, id, status_transaksi);
        }

        await connection.commit();
        res.status(200).json({ message: 'Status transaksi berhasil diperbarui', invoice: invoiceData });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    } finally {
        connection.release();
    }
}

export async function createQrisPayment(req, res) {
    const { id } = req.params;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const transaksi = await transaksiModel.getByIdForUpdate(connection, id);

        if (!transaksi) {
            await connection.rollback();
            return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        }
        if (transaksi.status_transaksi !== 'Pending') {
            await connection.rollback();
            return res.status(409).json({ message: `Transaksi ini sudah berstatus '${transaksi.status_transaksi}'` });
        }

        const orderId = `SIPETILANG-${id}-${Date.now()}`;
        const grossAmount = Math.round(Number(transaksi.total_transaksi));

        const chargeResponse = await coreApi.charge({
            payment_type: 'qris',
            transaction_details: {
                order_id: orderId,
                gross_amount: grossAmount,
            },
        });

        console.log(chargeResponse);

        const expiredAt = new Date(Date.now() + QRIS_EXPIRY_MINUTES * 60 * 1000);
        await transaksiModel.saveQrisOrder(connection, id, orderId, expiredAt);

        await connection.commit();

        res.status(200).json({
            qr_string: chargeResponse.qr_string,
            order_id: orderId,
            expired_at: expiredAt,
        });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Gagal membuat pembayaran QRIS' });
    } finally {
        connection.release();
    }
}

export async function checkQrisStatus(req, res) {
    const { id } = req.params;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const transaksi = await transaksiModel.getByIdForUpdate(connection, id);

        if (!transaksi) {
            await connection.rollback();
            return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        }

        if (transaksi.status_transaksi === 'Selesai') {
            const invoice = await transaksiModel.findInvoiceByTransaksiId(connection, id);
            await connection.commit();
            return res.status(200).json({
                status: 'settlement',
                invoice: invoice
                    ? { id_invoice: invoice.id_invoice, kode_qr: invoice.kode_qr, tanggal_transaksi: invoice.tanggal_transaksi }
                    : null,
            });
        }

        if (!transaksi.qris_order_id) {
            await connection.rollback();
            return res.status(400).json({ message: 'Transaksi ini belum menggunakan metode QRIS' });
        }

        if (transaksi.qris_expired_at && new Date(transaksi.qris_expired_at) < new Date()) {
            await transaksiModel.updateStatus(connection, id, 'Dibatalkan');
            await connection.commit();
            return res.status(200).json({ status: 'expired' });
        }

        const statusResponse = await coreApi.transaction.status(transaksi.qris_order_id);

        if (statusResponse.transaction_status === 'settlement' || statusResponse.transaction_status === 'capture') {
            const invoiceData = await finalizeSelesai(connection, id);
            await connection.commit();
            return res.status(200).json({ status: 'settlement', invoice: invoiceData });
        }

        if (['deny', 'cancel', 'expire', 'failure'].includes(statusResponse.transaction_status)) {
            await transaksiModel.updateStatus(connection, id, 'Dibatalkan');
            await connection.commit();
            return res.status(200).json({ status: statusResponse.transaction_status });
        }

        await connection.rollback();
        res.status(200).json({ status: 'pending' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Gagal mengecek status pembayaran' });
    } finally {
        connection.release();
    }
}