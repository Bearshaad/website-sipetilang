import db from '../config/db.mjs'

const ONLINE_THRESHOLD_MINUTES = 5;

export async function findAll(search) {
    let query = `
        SELECT id_petugas, nama_petugas, username_petugas, email_petugas, no_hp_petugas, status_petugas,
            (status_online = 1 AND last_active IS NOT NULL AND last_active >= (NOW() - INTERVAL ? MINUTE)) AS status_online
        FROM petugasLoket
    `;
    let params = [ONLINE_THRESHOLD_MINUTES];

    if (search) {
        query += ' WHERE nama_petugas LIKE ?';
        params.push(`%${search}%`);
    }

    const [rows] = await db.execute(query, params);
    return rows;
}

export async function findById(id) {
    const query = `
        SELECT id_petugas, nama_petugas, username_petugas, email_petugas, no_hp_petugas, status_petugas,
            (status_online = 1 AND last_active IS NOT NULL AND last_active >= (NOW() - INTERVAL ? MINUTE)) AS status_online
        FROM petugasLoket
        WHERE id_petugas = ?
    `;
    const [rows] = await db.execute(query, [ONLINE_THRESHOLD_MINUTES, id]);
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

export async function setOnlineStatus(id, isOnline) {
    const query = isOnline
        ? 'UPDATE petugasLoket SET status_online = ?, last_active = NOW() WHERE id_petugas = ?'
        : 'UPDATE petugasLoket SET status_online = ? WHERE id_petugas = ?';
    const [result] = await db.execute(query, [isOnline, id]);
    return result.affectedRows;
}

export async function updateLastActive(id) {
    const query = 'UPDATE petugasLoket SET last_active = NOW() WHERE id_petugas = ?';
    const [result] = await db.execute(query, [id]);
    return result.affectedRows;
}