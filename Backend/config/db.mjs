import mysql from 'mysql2/promise'
import 'dotenv/config'

console.log('Menghubung ke database...');

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
});

console.log('Pool koneksi database MySQL siap!');

export default db;