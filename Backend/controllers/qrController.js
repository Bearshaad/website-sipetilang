import * as qrModel from '../models/qrModel.js'

export async function validateQr(req, res) {
    try {
        const { kode_qr } = req.body;

        if (!kode_qr) {
            return res.status(400).json({ message: 'Kode QR wajib diisi' });
        }

        const qr = await qrModel.findByKode(kode_qr);

        if (!qr) {
            return res.status(404).json({ message: 'QR Tiket tidak ditemukan / tidak valid' });
        }

        if (!qr.status_qr) {
            return res.status(409).json({ message: 'QR Tiket ini sudah pernah digunakan' });
        }

        await qrModel.markAsUsed(qr.id_qr);

        res.status(200).json({ message: 'Tiket valid, silakan masuk' });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
}