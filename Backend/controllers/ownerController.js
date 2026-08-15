import bcrypt from 'bcrypt'
import * as ownerModel from '../models/ownerModel.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function getAllOwner(req, res) {
    try {
        const { search } = req.query;
        const owner = await ownerModel.findAll(search);
        res.status(200).json(owner);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
}

export async function getOwnerById(req, res) {
    try {
        const { id } = req.params;
        const owner = await ownerModel.findById(id);

        if (!owner) {
            return res.status(404).json({ message: 'Data owner tidak ditemukan' });
        }
        res.status(200).json(owner);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
}

export async function createOwner(req, res) {
    try {
        const { nama_owner, username_owner, password_owner, email_owner, no_hp_owner } = req.body;

        if (!nama_owner || !username_owner || !password_owner || !email_owner || !no_hp_owner) {
            return res.status(400).json({ message: 'Semua field wajib diisi' });
        }
        if (!EMAIL_REGEX.test(email_owner)) {
            return res.status(400).json({ message: 'Format email tidak valid' });
        }

        const hashedPassword = await bcrypt.hash(password_owner, 10);

        const ownerId = await ownerModel.create({
            nama_owner,
            username_owner,
            password_owner: hashedPassword,
            email_owner,
            no_hp_owner,
        });

        res.status(201).json({ message: 'Owner berhasil didaftarkan', ownerID: ownerId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username atau email sudah digunakan' });
        }
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
}

export async function updateOwner(req, res) {
    try {
        const { id } = req.params;
        const { nama_owner, username_owner, password_owner, email_owner, no_hp_owner } = req.body;

        if (!nama_owner || !username_owner || !email_owner || !no_hp_owner) {
            return res.status(400).json({ message: 'Nama, username, email, dan no HP wajib diisi' });
        }
        if (!EMAIL_REGEX.test(email_owner)) {
            return res.status(400).json({ message: 'Format email tidak valid' });
        }

        let hashedPassword = null;
        if (password_owner) {
            hashedPassword = await bcrypt.hash(password_owner, 10);
        }

        const affectedRows = await ownerModel.update(id, {
            nama_owner,
            username_owner,
            password_owner: hashedPassword,
            email_owner,
            no_hp_owner,
        });

        if (affectedRows === 0) {
            return res.status(404).json({ message: 'Owner tidak ditemukan' });
        }
        res.status(200).json({ message: 'Data Owner berhasil diperbarui' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username atau email sudah digunakan' });
        }
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
}