import { getToken, removeToken } from './auth'

export const apiFetch = async (url, options = {}) => {
    const token = getToken()
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    }

    // Si on passe une FormData, on ne veut pas de Content-Type: application/json
    if (options.body instanceof FormData) {
        delete headers['Content-Type']
    }

    const res = await fetch(url, { ...options, headers })

    if (res.status === 401) {
        // Si on n'est pas déjà sur la page de login
        if (!window.location.pathname.startsWith('/login')) {
            removeToken()
            window.location.href = '/login'
        }
    }

    return res
}
