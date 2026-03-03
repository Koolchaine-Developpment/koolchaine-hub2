import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
    Users,
    ShoppingBag,
    Instagram,
    BarChart3,
    LogOut,
    User as UserIcon,
    Menu,
    X
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
    { name: 'Prospection', path: '/prospection', icon: Users },
    { name: 'Shopify', path: '/shopify', icon: ShoppingBag },
    { name: 'Réseaux sociaux', path: '/social', icon: Instagram },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
]

const pageTitles = {
    '/prospection': 'Prospection B2B',
    '/shopify': 'Gestion Shopify',
    '/social': 'Réseaux Sociaux',
    '/analytics': 'Analytics',
}

const DashboardLayout = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    // Determine page title from current path
    const pageTitle = Object.entries(pageTitles).find(([key]) =>
        location.pathname.startsWith(key)
    )?.[1] || 'Koolchaine Hub'

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', backgroundColor: 'var(--bg)' }}>

            {/* ── Sidebar ── */}
            <aside style={{
                width: '220px',
                minWidth: '220px',
                backgroundColor: '#2D2830',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                zIndex: 40,
                position: 'relative',
            }}
                className={`${isMobileMenuOpen ? '' : 'max-md:hidden'}`}
            >
                {/* Logo */}
                <div style={{
                    padding: '24px 24px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}>
                    <span style={{
                        fontFamily: '"Archivo Black", sans-serif',
                        fontSize: '18px',
                        color: '#FFFFFF',
                        letterSpacing: '0.02em',
                        display: 'block',
                    }}>
                        KOOLCHAINE
                    </span>
                    <span style={{
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.4)',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                    }}>
                        HUB
                    </span>
                </div>

                {/* Nav items */}
                <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '11px 24px',
                                fontSize: '14px',
                                fontFamily: 'Poppins, sans-serif',
                                fontWeight: 500,
                                color: isActive ? '#F5395A' : 'rgba(255,255,255,0.7)',
                                borderLeft: isActive ? '3px solid #F5395A' : '3px solid transparent',
                                backgroundColor: isActive ? 'rgba(245,57,90,0.08)' : 'transparent',
                                textDecoration: 'none',
                                transition: 'all 0.15s ease',
                            })}
                        >
                            <item.icon size={18} />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

                {/* User section */}
                <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        marginBottom: '8px',
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(245,57,90,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <UserIcon size={16} color="#F5395A" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{
                                fontFamily: 'Poppins, sans-serif',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: '#fff',
                                margin: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {user?.full_name || 'Admin'}
                            </p>
                            <p style={{
                                fontFamily: 'Poppins, sans-serif',
                                fontSize: '11px',
                                color: 'rgba(255,255,255,0.4)',
                                margin: 0,
                                textTransform: 'capitalize',
                            }}>
                                {user?.role || 'admin'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: '13px',
                            fontFamily: 'Poppins, sans-serif',
                            color: 'rgba(255,255,255,0.5)',
                            background: 'none',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.color = '#F5395A'
                            e.currentTarget.style.backgroundColor = 'rgba(245,57,90,0.1)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
                            e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                    >
                        <LogOut size={15} />
                        Déconnexion
                    </button>
                </div>
            </aside>

            {/* Mobile overlay */}
            {isMobileMenuOpen && (
                <div
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 39,
                    }}
                />
            )}

            {/* ── Main area (topbar + content) ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

                {/* Topbar */}
                <header style={{
                    height: '56px',
                    minHeight: '56px',
                    backgroundColor: '#FFFFFF',
                    borderBottom: '1px solid #E8E4DF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 24px',
                    zIndex: 10,
                }}>
                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            marginRight: '12px',
                            color: '#2D2830',
                        }}
                    >
                        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>

                    <span style={{
                        fontFamily: '"Archivo Black", sans-serif',
                        fontSize: '16px',
                        color: '#2D2830',
                        flex: 1,
                    }}>
                        {pageTitle}
                    </span>

                    {/* User avatar */}
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#F5395A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                    }}>
                        <UserIcon size={18} color="#fff" />
                    </div>
                </header>

                {/* Page content */}
                <main style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '32px',
                    backgroundColor: 'var(--bg)',
                }}>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default DashboardLayout
