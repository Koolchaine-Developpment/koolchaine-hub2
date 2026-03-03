import React, { createContext, useContext, useState, useEffect } from 'react'
import authService from '../services/authService'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState({ full_name: 'Admin (Bypass)', role: 'admin', email: 'admin@koolchaine.com' })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        // TEMPORARY BYPASS: Auto-login
        setLoading(false)
    }, [])

    const login = async (credentials) => {
        await authService.login(credentials)
        const userData = await authService.getMe()
        setUser(userData)
    }

    const register = async (userData) => {
        await authService.register(userData)
        // Optional: auto-login after register
    }

    const logout = async () => {
        await authService.logout()
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
