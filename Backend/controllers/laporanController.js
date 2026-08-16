import * as laporanModel from '../models/laporanModel.js'

const PAGE_SIZE = 5;
const PERIOD_VALID = ['daily', 'weekly', 'monthly', 'yearly'];

// Kondisi tanggal sekarang berdasarkan TAHUN PILIHAN, tapi bulan/tanggal/minggu
// acuannya tetap ikut hari ini. Contoh: hari ini 17 Agustus 2026, pilih tahun 2025
// -> Daily akan mencari transaksi tanggal 17 Agustus 2025.
function buildDateCondition(period, tahun) {
    if (period === 'daily') {
        return {
            sql: 'AND MONTH(t.tanggal_transaksi) = MONTH(CURDATE()) AND DAY(t.tanggal_transaksi) = DAY(CURDATE()) AND YEAR(t.tanggal_transaksi) = ?',
            params: [tahun],
        };
    }
    if (period === 'weekly') {
        return {
            sql: 'AND WEEK(t.tanggal_transaksi, 1) = WEEK(CURDATE(), 1) AND YEAR(t.tanggal_transaksi) = ?',
            params: [tahun],
        };
    }
    if (period === 'monthly') {
        return {
            sql: 'AND MONTH(t.tanggal_transaksi) = MONTH(CURDATE()) AND YEAR(t.tanggal_transaksi) = ?',
            params: [tahun],
        };
    }
    // yearly
    return {
        sql: 'AND YEAR(t.tanggal_transaksi) = ?',
        params: [tahun],
    };
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

// Rentang waktu khusus untuk grafik tren (Owner) - butuh jendela waktu lebih
// panjang dibanding filter ringkasan biasa, supaya "tren"-nya bermakna.
function buildTrendCondition(period, tahun) {
    if (period === 'daily') {
        return {
            sql: `AND t.tanggal_transaksi >= STR_TO_DATE(CONCAT(?, '-', MONTH(CURDATE()), '-01'), '%Y-%m-%d')
                  AND t.tanggal_transaksi <= STR_TO_DATE(CONCAT(?, '-', MONTH(CURDATE()), '-', DAY(CURDATE())), '%Y-%m-%d')`,
            params: [tahun, tahun],
            groupByMonth: false,
        };
    }
    if (period === 'weekly') {
        const { sql, params } = buildDateCondition('weekly', tahun);
        return { sql, params, groupByMonth: false };
    }
    if (period === 'monthly') {
        return {
            sql: `AND t.tanggal_transaksi >= DATE_SUB(STR_TO_DATE(CONCAT(?, '-', MONTH(CURDATE()), '-01'), '%Y-%m-%d'), INTERVAL 5 MONTH)
                  AND t.tanggal_transaksi < DATE_ADD(STR_TO_DATE(CONCAT(?, '-', MONTH(CURDATE()), '-01'), '%Y-%m-%d'), INTERVAL 1 MONTH)`,
            params: [tahun, tahun],
            groupByMonth: true,
        };
    }
    // yearly
    return {
        sql: 'AND YEAR(t.tanggal_transaksi) = ?',
        params: [tahun],
        groupByMonth: true,
    };
}

function resolveTahun(rawYear) {
    const parsed = parseInt(rawYear);
    return Number.isInteger(parsed) ? parsed : new Date().getFullYear();
}

export async function getLaporan(req, res) {
    try {
        const { period, page, search, year } = req.query;

        if (!PERIOD_VALID.includes(period)) {
            return res.status(400).json({ message: 'Periode tidak valid' });
        }

        const currentPage = Math.max(1, parseInt(page) || 1);
        const offset = (currentPage - 1) * PAGE_SIZE;
        const tahun = resolveTahun(year);

        const { sql: dateConditionSql, params: dateParams } = buildDateCondition(period, tahun);
        const { searchCondition, searchParam } = buildSearchCondition(search);

        const ringkasan = await laporanModel.getRingkasan(dateConditionSql, dateParams);
        const totalTiketTerjual = await laporanModel.getTotalTiketTerjual(dateConditionSql, dateParams);
        const totalTransaksi = await laporanModel.countTransaksi(dateConditionSql, dateParams, searchCondition, searchParam);
        const transaksi = await laporanModel.getTransaksiTerbaru(dateConditionSql, dateParams, searchCondition, searchParam, PAGE_SIZE, offset);

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
        const { period, search, year } = req.query;

        if (!PERIOD_VALID.includes(period)) {
            return res.status(400).json({ message: 'Periode tidak valid' });
        }

        const tahun = resolveTahun(year);
        const { sql: dateConditionSql, params: dateParams } = buildDateCondition(period, tahun);
        const { searchCondition, searchParam } = buildSearchCondition(search);

        const transaksi = await laporanModel.getAllTransaksi(dateConditionSql, dateParams, searchCondition, searchParam);

        res.status(200).json({ transaksi });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
}

export async function getStatistik(req, res) {
    try {
        const { period, year } = req.query;

        if (!PERIOD_VALID.includes(period)) {
            return res.status(400).json({ message: 'Periode tidak valid' });
        }

        const tahun = resolveTahun(year);
        const { sql: trendSql, params: trendParams, groupByMonth } = buildTrendCondition(period, tahun);
        const { sql: tiketSql, params: tiketParams } = buildDateCondition(period, tahun);

        const tren = await laporanModel.getTrenPendapatan(trendSql, trendParams, groupByMonth);
        const tiketTerlaris = await laporanModel.getTiketTerlaris(tiketSql, tiketParams, 5);

        res.status(200).json({ tren, tiketTerlaris });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
}

export async function getTahunTersedia(req, res) {
    try {
        const tahun = await laporanModel.getAvailableYears();
        const currentYear = new Date().getFullYear();
        if (!tahun.includes(currentYear)) {
            tahun.unshift(currentYear);
        }
        res.status(200).json({ tahun });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
}