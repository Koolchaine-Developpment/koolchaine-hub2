import { apiFetch } from '../lib/api'

const API_URL = '/api/v1/auth'

const authService = {
    logout: async () => {
        const response = await apiFetch(`${API_URL}/logout`, { method: 'POST' })
        return response.json()
    },

    getMe: async () => {
        const response = await apiFetch(`${API_URL}/me`)
        if (!response.ok) throw new Error("Could not fetch user")
        return response.json()
    }
}

export default authService
