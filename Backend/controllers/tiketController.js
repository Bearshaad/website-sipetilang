import * as tiketModel from '../models/tiketModel.js'

export async function getAllTiket(req, res) {
    try {
        const { search } = req.query;
        const tiket = await tiketModel.findAll(search);
        res.status(200).json(tiket);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
}

export async function getTiketById(req, res) {
    try {
        const { id } = req.params;
        const tiket = await tiketModel.findById(id);

        if (!tiket) {
            return res.status(404).json({ message: 'Tiket tidak ditemukan' });
        }
        res.status(200).json(tiket);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
}

export async function createTiket(req, res) {
    try {
        const tiketId = await tiketModel.create(req.body);
        res.status(201).json({
            message: 'Tiket berhasil ditambahkan',
            tiketID: tiketId,
        });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
}

export async function updateTiket(req, res) {
    try {
        const { id } = req.params;
        const affectedRows = await tiketModel.update(id, req.body);

        if (affectedRows === 0) {
            return res.status(404).json({ message: 'Tiket tidak ditemukan' });
        }
        res.status(200).json({ message: 'Tiket berhasil diperbarui' });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
}

export async function deleteTiket(req, res) {
    try {
        const { id } = req.params;
        const affectedRows = await tiketModel.remove(id);

        if (affectedRows === 0) {
            return res.status(404).json({ message: 'Tiket tidak ditemukan' });
        }
        res.status(200).json({ message: 'Tiket berhasil dihapus' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(409).json({
                message: 'Tiket ini sudah pernah terjual, tidak bisa dihapus. Silahkan nonaktifkan dari menu kelola tiket.',
            });
        }
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
}