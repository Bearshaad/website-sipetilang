import axios from 'axios'

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
})

// Otomatis sisipkan token JWT ke setiap request, kalau user sudah login
apiClient.interceptors.request.use((config) => {
    const saved = localStorage.getItem('sipetilang_auth')
    if (saved) {
        const { token } = JSON.parse(saved)
        if (token) config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Ketika error 401 (token invalid/kadaluwarsa), otomatis logout
// dan lempar balik ke halaman login
// Untuk validasi tiket tetap akan masuk ke halaman validasi
apiClient.interceptors.response.use(
    (res) => res,
    (error) => {
        const isLoginRequest = error.config?.url?.includes('/auth/login')
        const isQrValidationRequest = error.config?.url?.includes('/qr/validasi')
        const alreadyOnLogin = window.location.pathname === '/login'

        if (error.response?.status === 401 && !isLoginRequest && !isQrValidationRequest && !alreadyOnLogin) {
            localStorage.removeItem('sipetilang_auth')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default apiClient