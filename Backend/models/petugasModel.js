import db from '../config/db.mjs'

export async function findAll(search) {
    let query = 'SELECT * FROM petugasLoket';
    let params = [];

    if (search) {
        query += ' WHERE nama_petugas LIKE ?';
        params.push(`%${search}%`);
    }

    const [rows] = await db.execute(query, params);
    return rows;
}

export async function findById(id) {
    const query = 'SELECT * FROM petugasLoket WHERE id_petugas = ?';
    const [rows] = await db.execute(query, [id]);
    return rows[0];
}

export async function create(data) {
    const {nama_petugas,username_petugas,password_petugas,email_petugas,no_hp_petugas,status_petugas} = data;
    const query = 'INSERT INTO petugasLoket (nama_petugas,username_petugas,password_petugas,email_petugas,no_hp_petugas,status_petugas) VALUES (?, ?, ?, ?, ?, ?)';
    const [result] = await db.execute(query, [nama_petugas,username_petugas,password_petugas,email_petugas,no_hp_petugas,status_petugas]);
    return result.insertId;
}

export async function update(id, data) {
    const { nama_petugas, username_petugas, password_petugas, email_petugas, no_hp_petugas, status_petugas } = data;

    let query;
    let params;

    if (password_petugas) {
        query = 'UPDATE petugasLoket SET nama_petugas = ?,username_petugas = ?,password_petugas = ?,email_petugas = ?,no_hp_petugas = ?, status_petugas = ? WHERE id_petugas = ?';
        params = [nama_petugas, username_petugas, password_petugas, email_petugas, no_hp_petugas, status_petugas, id];
    } else {
        query = 'UPDATE petugasLoket SET nama_petugas = ?,username_petugas = ?,email_petugas = ?,no_hp_petugas = ?, status_petugas = ? WHERE id_petugas = ?';
        params = [nama_petugas, username_petugas, email_petugas, no_hp_petugas, status_petugas, id];
    }

    const [result] = await db.execute(query, params);
    return result.affectedRows;
}