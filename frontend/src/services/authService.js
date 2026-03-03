import axios from 'axios'

const API_URL = '/api/v1/auth'

const authService = {
    register: async (userData) => {
        const response = await axios.post(`${API_URL}/register`, userData)
        return response.data
    },

    login: async (credentials) => {
        const formData = new FormData()
        formData.append('username', credentials.email)
        formData.append('password', credentials.password)

        const response = await axios.post(`${API_URL}/login`, formData)
        return response.data
    },

    logout: async () => {
        const response = await axios.post(`${API_URL}/logout`)
        return response.data
    },

    getMe: async () => {
        const response = await axios.get(`${API_URL}/me`)
        return response.data
    }
}

export default authService
