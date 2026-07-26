import apiClient from './apiClient'

export async function loginRequest(username, password) {
    try {
        const res = await apiClient.post('/auth/login', { username, password })
        return res.data
    } catch (error) {
        const message = error.response?.data?.message || 'Terjadi kesalahan, silakan coba lagi'
        throw new Error(message)
    }
}