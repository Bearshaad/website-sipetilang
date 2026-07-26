import db from '../config/db.mjs'

export async function getRingkasan(dateCondition) {
    const [rows] = await db.execute(`
        SELECT
            COALESCE(SUM(total_transaksi), 0) as pendapatan,
            COUNT(*) as jumlahTransaksi
        FROM transaksi t
        WHERE status_transaksi = 'Selesai' ${dateCondition}
    `);
    return rows[0];
}

export async function getTransaksiTerbaru(dateCondition) {
    const [rows] = await db.execute(`
        SELECT
            t.id_transaksi,
            t.tanggal_transaksi,
            t.subtotal_transaksi,
            t.tax_transaksi,
            t.total_transaksi,
            t.status_transaksi,
            jt.nama_tiket,
            dt.qty,
            dt.harga_tiket,
            dt.subtotal_item
        FROM detail_transaksi dt
        JOIN transaksi t ON dt.id_transaksi = t.id_transaksi
        JOIN jenisTiket jt ON dt.id_tiket = jt.id_tiket
        WHERE t.status_transaksi IN ('Selesai', 'Dibatalkan') ${dateCondition}
        ORDER BY t.tanggal_transaksi DESC
    `);

    const map = new Map();
    for (const row of rows) {
        if (!map.has(row.id_transaksi)) {
            map.set(row.id_transaksi, {
                id_transaksi: row.id_transaksi,
                tanggal_transaksi: row.tanggal_transaksi,
                subtotal_transaksi: row.subtotal_transaksi,
                tax_transaksi: row.tax_transaksi,
                total_transaksi: row.total_transaksi,
                status_transaksi: row.status_transaksi,
                items: [],
            });
        }
        map.get(row.id_transaksi).items.push({
            nama_tiket: row.nama_tiket,
            qty: row.qty,
            harga_tiket: row.harga_tiket,
            subtotal_item: row.subtotal_item,
        });
    }

    return Array.from(map.values());
}

export async function getTotalTiketTerjual(dateCondition) {
    const [rows] = await db.execute(`
        SELECT COALESCE(SUM(dt.qty), 0) as totalTiketTerjual
        FROM detail_transaksi dt
        JOIN transaksi t ON dt.id_transaksi = t.id_transaksi
        WHERE t.status_transaksi = 'Selesai' ${dateCondition}
    `);
    return rows[0].totalTiketTerjual;
}