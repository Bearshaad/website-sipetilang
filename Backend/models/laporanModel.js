import db from '../config/db.mjs'

export async function getRingkasan(dateCondition, dateParams) {
    const [rows] = await db.execute(`
        SELECT
            COALESCE(SUM(total_transaksi), 0) as pendapatan,
            COUNT(*) as jumlahTransaksi
        FROM transaksi t
        WHERE status_transaksi = 'Selesai' ${dateCondition}
    `, dateParams);
    return rows[0];
}

export async function getTotalTiketTerjual(dateCondition, dateParams) {
    const [rows] = await db.execute(`
        SELECT COALESCE(SUM(dt.qty), 0) as totalTiketTerjual
        FROM detail_transaksi dt
        JOIN transaksi t ON dt.id_transaksi = t.id_transaksi
        WHERE t.status_transaksi = 'Selesai' ${dateCondition}
    `, dateParams);
    return rows[0].totalTiketTerjual;
}

export async function countTransaksi(dateCondition, dateParams, searchCondition, searchParam) {
    const params = searchParam ? [...dateParams, searchParam] : [...dateParams];
    const [rows] = await db.execute(`
        SELECT COUNT(*) as total
        FROM transaksi t
        WHERE t.status_transaksi IN ('Selesai', 'Dibatalkan') ${dateCondition} ${searchCondition}
    `, params);
    return rows[0].total;
}

async function attachItems(transaksiRows) {
    if (transaksiRows.length === 0) return [];

    const ids = transaksiRows.map((row) => row.id_transaksi);
    const placeholders = ids.map(() => '?').join(',');

    const [itemRows] = await db.execute(`
        SELECT dt.id_transaksi, jt.nama_tiket, dt.qty, dt.harga_tiket, dt.subtotal_item
        FROM detail_transaksi dt
        JOIN jenisTiket jt ON dt.id_tiket = jt.id_tiket
        WHERE dt.id_transaksi IN (${placeholders})
    `, ids);

    const itemsByTransaksi = new Map();
    for (const row of itemRows) {
        if (!itemsByTransaksi.has(row.id_transaksi)) {
            itemsByTransaksi.set(row.id_transaksi, []);
        }
        itemsByTransaksi.get(row.id_transaksi).push({
            nama_tiket: row.nama_tiket,
            qty: row.qty,
            harga_tiket: row.harga_tiket,
            subtotal_item: row.subtotal_item,
        });
    }

    return transaksiRows.map((t) => ({
        id_transaksi: t.id_transaksi,
        tanggal_transaksi: t.tanggal_transaksi,
        subtotal_transaksi: t.subtotal_transaksi,
        tax_transaksi: t.tax_transaksi,
        total_transaksi: t.total_transaksi,
        status_transaksi: t.status_transaksi,
        items: itemsByTransaksi.get(t.id_transaksi) || [],
    }));
}

export async function getTransaksiTerbaru(dateCondition, dateParams, searchCondition, searchParam, limit, offset) {
    const safeLimit = Number.isInteger(limit) ? limit : 5;
    const safeOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;

    const params = searchParam ? [...dateParams, searchParam] : [...dateParams];
    const [transaksiRows] = await db.execute(`
        SELECT t.id_transaksi, t.tanggal_transaksi, t.subtotal_transaksi, t.tax_transaksi, t.total_transaksi, t.status_transaksi
        FROM transaksi t
        WHERE t.status_transaksi IN ('Selesai', 'Dibatalkan') ${dateCondition} ${searchCondition}
        ORDER BY t.tanggal_transaksi DESC
        LIMIT ${safeLimit} OFFSET ${safeOffset}
    `, params);

    return attachItems(transaksiRows);
}

export async function getAllTransaksi(dateCondition, dateParams, searchCondition, searchParam) {
    const params = searchParam ? [...dateParams, searchParam] : [...dateParams];
    const [transaksiRows] = await db.execute(`
        SELECT t.id_transaksi, t.tanggal_transaksi, t.subtotal_transaksi, t.tax_transaksi, t.total_transaksi, t.status_transaksi
        FROM transaksi t
        WHERE t.status_transaksi IN ('Selesai', 'Dibatalkan') ${dateCondition} ${searchCondition}
        ORDER BY t.tanggal_transaksi DESC
    `, params);

    return attachItems(transaksiRows);
}

export async function getTrenPendapatan(dateCondition, dateParams, groupByMonth) {
    const groupFormat = groupByMonth ? '%Y-%m' : '%Y-%m-%d';
    const [rows] = await db.execute(`
        SELECT DATE_FORMAT(t.tanggal_transaksi, '${groupFormat}') as label,
               COALESCE(SUM(t.total_transaksi), 0) as pendapatan
        FROM transaksi t
        WHERE t.status_transaksi = 'Selesai' ${dateCondition}
        GROUP BY label
        ORDER BY label ASC
    `, dateParams);
    return rows;
}

export async function getTiketTerlaris(dateCondition, dateParams, limit) {
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 5;
    const [rows] = await db.execute(`
        SELECT jt.nama_tiket, SUM(dt.qty) as totalTerjual
        FROM detail_transaksi dt
        JOIN transaksi t ON dt.id_transaksi = t.id_transaksi
        JOIN jenisTiket jt ON dt.id_tiket = jt.id_tiket
        WHERE t.status_transaksi = 'Selesai' ${dateCondition}
        GROUP BY jt.id_tiket, jt.nama_tiket
        ORDER BY totalTerjual DESC
        LIMIT ${safeLimit}
    `, dateParams);
    return rows;
}

export async function getAvailableYears() {
    const [rows] = await db.execute(`
        SELECT DISTINCT YEAR(tanggal_transaksi) as tahun
        FROM transaksi
        ORDER BY tahun DESC
    `);
    return rows.map((r) => r.tahun);
}