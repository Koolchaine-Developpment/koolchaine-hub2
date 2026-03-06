import React, { createContext, useContext, useState, useEffect } from 'react'
import authService from '../services/authService'
import { getToken, removeToken } from '../lib/auth'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkUser = async () => {
            const token = getToken()
            if (!token) {
                setLoading(false)
                return
            }

            try {
                const userData = await authService.getMe()
                setUser(userData)
            } catch (error) {
                console.error("Auth check failed", error)
                removeToken()
                setUser(null)
            } finally {
                setLoading(false)
            }
        }
        checkUser()
    }, [])

    const login = () => {
        window.location.href = '/api/v1/auth/google/login'
    }

    const logout = async () => {
        try {
            await authService.logout()
        } catch (error) {
            console.error("Failed to logout on server", error)
        } finally {
            removeToken()
            setUser(null)
            window.location.href = '/login'
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
