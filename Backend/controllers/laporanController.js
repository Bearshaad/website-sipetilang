import * as laporanModel from '../models/laporanModel.js'

export async function getLaporan(req, res) {
    try {
        const { period } = req.query;
        const periodValid = ['daily', 'weekly', 'monthly', 'yearly'];

        if (!periodValid.includes(period)) {
            return res.status(400).json({ message: 'Periode tidak valid' });
        }

        let dateCondition = '';
        if (period === 'daily') {
            dateCondition = 'AND DATE(t.tanggal_transaksi) = CURDATE()';
        } else if (period === 'weekly') {
            dateCondition = 'AND YEARWEEK(t.tanggal_transaksi, 1) = YEARWEEK(CURDATE(), 1)';
        } else if (period === 'monthly') {
            dateCondition = 'AND MONTH(t.tanggal_transaksi) = MONTH(CURDATE()) AND YEAR(t.tanggal_transaksi) = YEAR(CURDATE())';
        } else if (period === 'yearly') {
            dateCondition = 'AND YEAR(t.tanggal_transaksi) = YEAR(CURDATE())';
        }

        const ringkasan = await laporanModel.getRingkasan(dateCondition);
        const transaksi = await laporanModel.getTransaksiTerbaru(dateCondition);
        const totalTiketTerjual = await laporanModel.getTotalTiketTerjual(dateCondition);

        res.status(200).json({
            pendapatan: ringkasan.pendapatan,
            jumlahTransaksi: ringkasan.jumlahTransaksi,
            totalTiketTerjual,
            transaksi,
        });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
}