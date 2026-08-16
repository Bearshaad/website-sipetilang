import * as laporanModel from '../models/laporanModel.js'

const PAGE_SIZE = 5;
const PERIOD_VALID = ['daily', 'weekly', 'monthly', 'yearly'];

function buildDateCondition(period) {
    if (period === 'daily') return 'AND DATE(t.tanggal_transaksi) = CURDATE()';
    if (period === 'weekly') return 'AND YEARWEEK(t.tanggal_transaksi, 1) = YEARWEEK(CURDATE(), 1)';
    if (period === 'monthly') return 'AND MONTH(t.tanggal_transaksi) = MONTH(CURDATE()) AND YEAR(t.tanggal_transaksi) = YEAR(CURDATE())';
    if (period === 'yearly') return 'AND YEAR(t.tanggal_transaksi) = YEAR(CURDATE())';
    return '';
}

function buildSearchCondition(search) {
    if (!search || !search.trim()) {
        return { searchCondition: '', searchParam: null };
    }
    return {
        searchCondition: "AND DATE_FORMAT(t.tanggal_transaksi, '%d-%m-%Y') LIKE ?",
        searchParam: `%${search.trim()}%`,
    };
}

function buildTrendCondition(period) {
    if (period === 'daily') {
        return {
            dateCondition: "AND t.tanggal_transaksi >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND DATE(t.tanggal_transaksi) <= CURDATE()",
            groupByMonth: false,
        };
    }
    if (period === 'weekly') {
        return {
            dateCondition: buildDateCondition('weekly'),
            groupByMonth: false,
        };
    }
    if (period === 'monthly') {
        return {
            dateCondition: "AND t.tanggal_transaksi >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 5 MONTH)",
            groupByMonth: true,
        };
    }
    // yearly
    return {
        dateCondition: buildDateCondition('yearly'),
        groupByMonth: true,
    };
}

export async function getLaporan(req, res) {
    try {
        const { period, page, search } = req.query;

        if (!PERIOD_VALID.includes(period)) {
            return res.status(400).json({ message: 'Periode tidak valid' });
        }

        const currentPage = Math.max(1, parseInt(page) || 1);
        const offset = (currentPage - 1) * PAGE_SIZE;

        const dateCondition = buildDateCondition(period);
        const { searchCondition, searchParam } = buildSearchCondition(search);

        const ringkasan = await laporanModel.getRingkasan(dateCondition);
        const totalTiketTerjual = await laporanModel.getTotalTiketTerjual(dateCondition);
        const totalTransaksi = await laporanModel.countTransaksi(dateCondition, searchCondition, searchParam);
        const transaksi = await laporanModel.getTransaksiTerbaru(dateCondition, searchCondition, searchParam, PAGE_SIZE, offset);

        res.status(200).json({
            pendapatan: ringkasan.pendapatan,
            jumlahTransaksi: ringkasan.jumlahTransaksi,
            totalTiketTerjual,
            transaksi,
            currentPage,
            totalPages: Math.max(1, Math.ceil(totalTransaksi / PAGE_SIZE)),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
}

export async function getLaporanExport(req, res) {
    try {
        const { period, search } = req.query;

        if (!PERIOD_VALID.includes(period)) {
            return res.status(400).json({ message: 'Periode tidak valid' });
        }

        const dateCondition = buildDateCondition(period);
        const { searchCondition, searchParam } = buildSearchCondition(search);

        const transaksi = await laporanModel.getAllTransaksi(dateCondition, searchCondition, searchParam);

        res.status(200).json({ transaksi });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
}

export async function getStatistik(req, res) {
    try {
        const { period } = req.query;

        if (!PERIOD_VALID.includes(period)) {
            return res.status(400).json({ message: 'Periode tidak valid' });
        }

        const { dateCondition: trendCondition, groupByMonth } = buildTrendCondition(period);
        const tiketDateCondition = buildDateCondition(period);

        const tren = await laporanModel.getTrenPendapatan(trendCondition, groupByMonth);
        const tiketTerlaris = await laporanModel.getTiketTerlaris(tiketDateCondition, 5);

        res.status(200).json({ tren, tiketTerlaris });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
}