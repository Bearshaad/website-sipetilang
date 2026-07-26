import db from "../config/db.mjs"

export async function findAll(search) {
    let query = 'SELECT * FROM jenisTiket';
    let params = [];

    if (search) {
        query += ' WHERE nama_tiket LIKE ? AND status_tiket = "Tersedia"';
        params.push(`%${search}%`);
    }

    const [rows] = await db.execute(query, params);
    return rows;
}

export async function findById(id) {
    const query = 'SELECT * FROM jenisTiket WHERE id_tiket = ?';
    const [rows] = await db.execute(query, [id]);
    return rows[0];
}

export async function create(data) {
    const {nama_tiket, harga_tiket, deskripsi_tiket, status_tiket} = data;
    const query = 'INSERT INTO jenisTiket (nama_tiket,harga_tiket,deskripsi_tiket,status_tiket) VALUES (?, ?, ?, ?)';
    const [result] = await db.execute(query, [nama_tiket, harga_tiket, deskripsi_tiket, status_tiket]);
    return result.insertId;
}

export async function update(id, data) {
    const { nama_tiket, harga_tiket, deskripsi_tiket, status_tiket } = data;
    const query = 'UPDATE jenisTiket SET nama_tiket = ?,harga_tiket = ?,deskripsi_tiket = ?, status_tiket = ? WHERE id_tiket = ?';
    const [result] = await db.execute(query, [nama_tiket, harga_tiket, deskripsi_tiket, status_tiket, id]);
    return result.affectedRows;
}

export async function remove(id) {
    const query = 'DELETE FROM jenisTiket WHERE id_tiket = ?';
    const [result] = await db.execute(query, [id]);
    return result.affectedRows;
}
