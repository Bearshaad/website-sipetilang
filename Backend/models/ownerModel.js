import db from '../config/db.mjs'

export async function findAll(search) {
    let query = 'SELECT * FROM owner';
    let params = [];

    if (search) {
        query += ' WHERE nama_owner LIKE ?';
        params.push(`%${search}%`);
    }

    const [rows] = await db.execute(query, params);
    return rows;
}

export async function findById (id) {
    const query = 'SELECT * FROM owner WHERE id_owner = ?';
    const [rows] = await db.execute(query, [id]);
    return rows[0];
}

export async function create (data) {
    const {nama_owner,username_owner,password_owner,email_owner,no_hp_owner} = data;
    const query = 'INSERT INTO owner (nama_owner,username_owner,password_owner,email_owner,no_hp_owner) VALUES (?, ?, ?, ?, ?)';
    const [result] = await db.execute(query, [nama_owner,username_owner,password_owner,email_owner,no_hp_owner]);
    return result.insertId;
}

export async function update (id, data) {
    const { nama_owner,username_owner,password_owner,email_owner,no_hp_owner } = data;

    let query;
    let params;

    if (password_owner) {
        query = 'UPDATE owner SET nama_owner = ?,username_owner = ?,password_owner = ?,email_owner = ?,no_hp_owner = ? WHERE id_owner = ?';
        params = [nama_owner,username_owner,password_owner,email_owner,no_hp_owner, id];
    } else {
        query = 'UPDATE owner SET nama_owner = ?,username_owner = ?,email_owner = ?,no_hp_owner = ? WHERE id_owner = ?';
        params = [nama_owner,username_owner,email_owner,no_hp_owner, id];
    }

    const [result] = await db.execute(query, params);
    return result.affectedRows;
}