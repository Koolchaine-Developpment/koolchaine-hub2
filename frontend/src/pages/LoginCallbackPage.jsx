import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { setToken } from '../lib/auth'

const LoginCallbackPage = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    useEffect(() => {
        const token = searchParams.get('token')
        if (token) {
            setToken(token)
            // On redirige vers la page par défaut après login
            navigate('/prospection')
        } else {
            console.error("No token found in callback URL")
            navigate('/login?error=no_token')
        }
    }, [searchParams, navigate])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
                <p>Connexion en cours...</p>
            </div>
        </div>
    )
}

export default LoginCallbackPage
