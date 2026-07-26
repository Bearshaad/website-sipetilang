import bcrypt from 'bcrypt'
import * as petugasModel from '../models/petugasModel.js'

export async function getAllPetugas(req, res) {
    try {
        const { search } = req.query;
        const petugas = await petugasModel.findAll(search);
        res.status(200).json(petugas);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
}

export async function getPetugasById(req, res) {
    try {
        const { id } = req.params;
        const petugas = await petugasModel.findById(id);
        if (!petugas) {
            return res.status(404).json({ message: 'Petugas tidak ditemukan' });
        }
        res.status(200).json(petugas);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
}

export async function createPetugas(req, res) {
    try {
        const { nama_petugas, username_petugas, password_petugas, email_petugas, no_hp_petugas, status_petugas } = req.body;
        const hashedPassword = await bcrypt.hash(password_petugas, 10);

        const petugasId = await petugasModel.create({
            nama_petugas,
            username_petugas,
            password_petugas: hashedPassword,
            email_petugas,
            no_hp_petugas,
            status_petugas,
        });

        res.status(201).json({ message: 'Petugas berhasil didaftarkan', petugasID: petugasId });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
}

export async function updatePetugas(req, res) {
    try {
        const { id } = req.params;
        const { nama_petugas, username_petugas, password_petugas, email_petugas, no_hp_petugas, status_petugas } = req.body;

        let hashedPassword = null;
        if (password_petugas) {
            hashedPassword = await bcrypt.hash(password_petugas, 10);
        }

        const affectedRows = await petugasModel.update(id, {
            nama_petugas,
            username_petugas,
            password_petugas: hashedPassword,
            email_petugas,
            no_hp_petugas,
            status_petugas,
        });

        if (affectedRows === 0) {
            return res.status(404).json({ message: 'Petugas tidak ditemukan' });
        }
        res.status(200).json({ message: 'Data Petugas berhasil diperbarui' });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
}