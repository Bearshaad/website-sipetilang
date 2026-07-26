import apiClient from './apiClient'

function mapPetugasFromApi(row) {
    return {
        id: row.id_petugas,
        nama: row.nama_petugas,
        username: row.username_petugas,
        email: row.email_petugas,
        no_hp: row.no_hp_petugas,
        active: row.status_petugas === 'Aktif',
        online: false,// belum ada mekanisme realtime
    }
}

function mapPetugasToApi(data) {
    const payload = {
        nama_petugas: data.nama,
        username_petugas: data.username,
        email_petugas: data.email,
        no_hp_petugas: data.no_hp,
        status_petugas: data.active ? 'Aktif' : 'Resign',
    }
    if (data.password) {
        payload.password_petugas = data.password
    }
    return payload
}

export async function getPetugas() {
    const res = await apiClient.get('/petugas')
    return res.data.map(mapPetugasFromApi)
}

export async function createPetugas(data) {
    const res = await apiClient.post('/petugas', mapPetugasToApi(data))
    return { id: res.data.petugasID, ...data }
}

export async function updatePetugas(id, data) {
    await apiClient.put(`/petugas/${id}`, mapPetugasToApi(data))
    return { id, ...data }
}