import db from '../config/db.mjs'
import * as qrModel from '../models/qrModel.js'

export async function validateQr(req, res) {
    const { kode_qr } = req.body;

    if (!kode_qr) {
        return res.status(400).json({ message: 'Kode QR wajib diisi' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const qr = await qrModel.findByKodeForUpdate(connection, kode_qr);

        if (!qr) {
            await connection.rollback();
            return res.status(404).json({ message: 'QR Tiket tidak ditemukan / tidak valid' });
        }

        if (!qr.status_qr) {
            await connection.rollback();
            return res.status(409).json({ message: 'QR Tiket ini sudah pernah digunakan' });
        }

        await qrModel.markAsUsed(connection, qr.id_qr);

        await connection.commit();
        res.status(200).json({ message: 'Tiket valid, silakan masuk' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    } finally {
        connection.release();
    }
}