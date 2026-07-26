import apiClient from './apiClient'

// ubah nama field & nilai status dari backend ke frontend
function mapTiketFromApi(row) {
    return {
        id: row.id_tiket,
        nama: row.nama_tiket,
        harga: row.harga_tiket,
        deskripsi: row.deskripsi_tiket,
        status: row.status_tiket === 'Tersedia' ? 'active' : 'inactive',
    }
}

// ubah nama field & nilai status dari frontend ke backend untuk create dan update
function mapTiketToApi(data) {
    return {
        nama_tiket: data.nama,
        harga_tiket: data.harga,
        deskripsi_tiket: data.deskripsi,
        status_tiket: data.status === 'active' ? 'Tersedia' : 'Tidak Tersedia',
    }
}

export async function getTickets() {
    const res = await apiClient.get('/tiket')
    return res.data.map(mapTiketFromApi)
}

export async function searchTickets(query) {
    if (!query.trim()) return []
    const res = await apiClient.get('/tiket', { params: { search: query } })
    return res.data.map(mapTiketFromApi)
}

export async function createTicket(data) {
    const res = await apiClient.post('/tiket', mapTiketToApi(data))
    // menyusun ulang objek dikarenakan backend hanya membalikan {message, ticketID}, bukan objek tiket lengkap
    return { id: res.data.tiketID, ...data }
}

export async function updateTicket(id, data) {
    await apiClient.put(`/tiket/${id}`, mapTiketToApi(data))
    return { id, ...data }
}

export async function deleteTicket(id) {
    await apiClient.delete(`/tiket/${id}`)
    return true
}
