import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'

const LoginPage = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            await login({ email, password })
            navigate('/prospection')
        } catch (err) {
            setError('Email ou mot de passe incorrect.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-screen flex items-center justify-center bg-brand-dark p-4 animate-fade-in font-sans">
            <div className="w-full max-w-md">
                {/* Logo/Title */}
                <div className="text-center mb-10">
                    <h1 className="text-[32px] font-heading text-accent-pink tracking-wider">
                        KOOLCHAINE HUB
                    </h1>
                    <p className="text-white/60 mt-2 font-sans">Connectez-vous pour accéder au dashboard</p>
                </div>

                {/* Card */}
                <div className="bg-brand-surface rounded-[10px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-brand-border p-8 transition-transform hover:-translate-y-1 duration-300">
                    {error && (
                        <div className="mb-6 p-4 bg-accent-pink/10 border border-accent-pink/20 rounded-[6px] flex items-center gap-3 text-accent-pink text-sm font-medium">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-brand-text-primary ml-1">Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-text-secondary group-focus-within:text-accent-pink transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 bg-brand-bg border border-brand-border rounded-[6px] text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent-pink/20 focus:border-accent-pink transition-all"
                                    placeholder="nom@exemple.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-medium text-brand-text-primary">Mot de passe</label>
                                <a href="#" className="text-xs font-medium text-accent-blue hover:text-accent-blue/80 transition-colors">Oublié ?</a>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-text-secondary group-focus-within:text-accent-pink transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 bg-brand-bg border border-brand-border rounded-[6px] text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent-pink/20 focus:border-accent-pink transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-accent-pink hover:bg-accent-pink/90 text-white font-medium py-3 rounded-[6px] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    Se connecter
                                    <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-brand-border text-center">
                        <p className="text-sm font-sans text-brand-text-secondary">
                            Pas encore de compte ?{' '}
                            <Link to="/register" className="font-medium text-accent-blue hover:text-accent-blue/80 transition-colors">
                                Créer un compte
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
