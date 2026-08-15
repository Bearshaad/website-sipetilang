import db from '../config/db.mjs'

export async function getTiketForTransaksi(connection, id_tiket) {
    const [rows] = await connection.execute(
        'SELECT harga_tiket, status_tiket FROM jenisTiket WHERE id_tiket = ?',
        [id_tiket]
    );
    return rows[0];
}

// Insert baris HEADER ke tabel transaksi"
export async function createHeader(connection, { id_petugas, subtotal, tax, total }) {
    const [result] = await connection.execute(
        `INSERT INTO transaksi (id_petugas, subtotal_transaksi, tax_transaksi, total_transaksi, status_transaksi)
         VALUES (?, ?, ?, ?, 'Pending')`,
        [id_petugas, subtotal, tax, total]
    );
    return result.insertId;
}

// Insert satu-satu baris RINCIAN ke detail_transaksi"
export async function createDetailItem(connection, { id_transaksi, id_tiket, qty, harga_tiket, subtotal_item }) {
    await connection.execute(
        `INSERT INTO detail_transaksi (id_transaksi, id_tiket, qty, harga_tiket, subtotal_item)
         VALUES (?, ?, ?, ?, ?)`,
        [id_transaksi, id_tiket, qty, harga_tiket, subtotal_item]
    );
}

export async function findById(id) {
    const [rows] = await db.execute('SELECT * FROM transaksi WHERE id_transaksi = ?', [id]);
    return rows[0];
}

export async function findItemsById(id) {
    const [rows] = await db.execute(
        `SELECT dt.id_tiket, jt.nama_tiket, dt.qty, dt.harga_tiket, dt.subtotal_item
         FROM detail_transaksi dt
         JOIN jenisTiket jt ON dt.id_tiket = jt.id_tiket
         WHERE dt.id_transaksi = ?`,
        [id]
    );
    return rows;
}

export async function updateStatus(connection, id, status) {
    const [result] = await connection.execute(
        'UPDATE transaksi SET status_transaksi = ? WHERE id_transaksi = ?',
        [status, id]
    );
    return result.affectedRows;
}

export async function getByIdForUpdate(connection, id) {
    const [rows] = await connection.execute('SELECT * FROM transaksi WHERE id_transaksi = ? FOR UPDATE', [id]);
    return rows[0];
}

export async function sumQtyByTransaksiId(connection, id) {
    const [rows] = await connection.execute(
        'SELECT SUM(qty) as total_qty FROM detail_transaksi WHERE id_transaksi = ?',
        [id]
    );
    return rows[0].total_qty;
}

// INSERT INTO QRTiket 
export async function createQr(connection, kodeQr) {
    const [result] = await connection.execute(
        'INSERT INTO QRTiket (kode_qr, status_qr) VALUES (?, TRUE)',
        [kodeQr]
    );
    return result.insertId;
}

// INSERT INTO invoice
export async function createInvoice(connection, { id_transaksi, id_qr, qty_invoice, invoice_subtotal }) {
    const [result] = await connection.execute(
        `INSERT INTO invoice (id_transaksi, id_qr, qty_invoice, invoice_subtotal)
         VALUES (?, ?, ?, ?)`,
        [id_transaksi, id_qr, qty_invoice, invoice_subtotal]
    );
    return result.insertId;
}

export async function findInvoiceByTransaksiId(connection, id_transaksi) {
    const [rows] = await connection.execute(
        `SELECT i.id_invoice, q.kode_qr, t.tanggal_transaksi
         FROM invoice i
         JOIN QRTiket q ON i.id_qr = q.id_qr
         JOIN transaksi t ON i.id_transaksi = t.id_transaksi
         WHERE i.id_transaksi = ?`,
        [id_transaksi]
    );
    return rows[0];
}