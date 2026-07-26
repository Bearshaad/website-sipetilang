import db from '../config/db.mjs'

export async function findByKode(kodeQr) {
    const [rows] = await db.execute(
        'SELECT * FROM QRTiket WHERE kode_qr = ?',
        [kodeQr]
    );
    return rows[0];
}

export async function markAsUsed(idQr) {
    const [result] = await db.execute(
        'UPDATE QRTiket SET status_qr = FALSE WHERE id_qr = ?',
        [idQr]
    );
    return result.affectedRows;
}