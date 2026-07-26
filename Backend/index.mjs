import express from 'express';
import db from './config/db.mjs';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import tiketRoutes from './routes/tiketRoutes.js'
import petugasRoutes from './routes/petugasRoutes.js'
import ownerRoutes from './routes/ownerRoutes.js'
import transaksiRoutes from './routes/transaksiRoutes.js'
import laporanRoutes from './routes/laporanRoutes.js'
import qrRoutes from './routes/qrRoutes.js'

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());
dotenv.config();
app.use('/api/qr', qrRoutes)


//=============================
// Autentikasi Login
//=============================

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username dan password wajib diisi' });
        }

        let role = 'petugas';
        let query = 'SELECT * FROM petugasLoket WHERE username_petugas = ?';
        let [rows] = await db.execute(query, [username]);
        let user = rows[0];

        if (!user) {
            role = 'owner';
            query = 'SELECT * FROM owner WHERE username_owner = ?';
            [rows] = await db.execute(query, [username]);
            user = rows[0];
        }

        if (!user) {
            return res.status(401).json({ message: 'Username atau password salah' });
        }

        if (role === 'petugas' && user.status_petugas === 'Resign') {
            return res.status(403).json({ message: 'Akun petugas ini sudah tidak aktif' });
        }

        const hashedPassword =
            role === 'owner' ? user.password_owner : user.password_petugas;

        const isValid = await bcrypt.compare(password, hashedPassword);

        if (!isValid) {
            return res.status(401).json({ message: 'Username atau password salah' });
        }

        const userId =
            role === 'owner' ? user.id_owner : user.id_petugas;

        const nama =
            role === 'owner' ? user.nama_owner : user.nama_petugas;

        const usernameFinal =
            role === 'owner' ? user.username_owner : user.username_petugas;

        const token = jwt.sign(
            { id: userId, role },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.status(200).json({
            token,
            user: {
                id: userId,
                nama,
                username: usernameFinal,
                role,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
});

//=============================
// Routes
//=============================
app.use('/api/tiket', tiketRoutes)
app.use('/api/petugas', petugasRoutes)
app.use('/api/owner', ownerRoutes)
app.use('/api/transaksi', transaksiRoutes)
app.use('/api/laporan', laporanRoutes)

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on http://localhost:${port}`)
})