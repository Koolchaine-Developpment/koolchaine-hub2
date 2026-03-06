import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
    Users,
    ShoppingBag,
    BarChart3,
    LogOut,
    Menu,
    X,
    Calculator,
    Settings,
    LayoutDashboard
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Prospection', path: '/prospection', icon: Users },
    { name: 'Shopify', path: '/shopify', icon: ShoppingBag },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Social', path: '/social', icon: Settings }, // Using Settings temporarily, ideally Instagram icon
    { name: 'Simulateur', path: '/simulateur', icon: Calculator },
]

const pageTitles = {
    '/prospection': 'Prospection B2B',
    '/shopify': 'Gestion Shopify',
    '/analytics': 'Analytics',
    '/social': 'Social Studio',
    '/simulateur': 'Simulateur de Devis',
    '/settings/agents/social': 'Tone of Voice (Social)',
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

    // Get initials for avatar
    const getInitials = (name) => {
        if (!name) return 'U';
        return name.substring(0, 2).toUpperCase();
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
            {/* ── Sidebar ── */}
            <aside className={`sidebar ${isMobileMenuOpen ? '' : 'max-md:hidden'}`} style={isMobileMenuOpen ? { zIndex: 50, position: 'fixed', left: 0, top: 0, bottom: 0 } : {}}>
                {/* Logo */}
                <div className="sidebar-logo">
                    <span>KOOLCHAINE</span>
                </div>

                {/* Nav items */}
                <div className="sidebar-section">Menu</div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                            style={{ textDecoration: 'none' }}
                        >
                            <item.icon className="nav-icon" />
                            {item.name}
                        </NavLink>
                    ))}
                    {/* Settings / Logout */}
                    <div className="sidebar-section" style={{ marginTop: '20px' }}>Paramètres</div>
                    <NavLink
                        to="/settings/agents/social"
                        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                        style={{ textDecoration: 'none' }}
                    >
                        <Settings className="nav-icon" />
                        Tone of Voice
                    </NavLink>

                    <div className="sidebar-section" style={{ marginTop: '20px' }}>Système</div>
                    <div className="nav-item" onClick={handleLogout} style={{ marginTop: 'auto' }}>
                        <LogOut className="nav-icon" />
                        Déconnexion
                    </div>
                </div>

                {/* User section */}
                <div className="sidebar-bottom">
                    <div className="avatar">{getInitials(user?.full_name)}</div>
                    <div>
                        <div className="avatar-name">{user?.full_name || 'Admin'}</div>
                        <div className="avatar-role" style={{ textTransform: 'capitalize' }}>{user?.role || 'admin'}</div>
                    </div>
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
                        zIndex: 40,
                    }}
                />
            )}

            {/* ── Main area ── */}
            <main className="main" style={isMobileMenuOpen ? { marginLeft: 0 } : {}}>
                {/* Mobile Hamburger Header (Visible only on mobile) */}
                <div className="md:hidden flex items-center mb-6 gap-4">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--dark)' }}
                    >
                        <Menu size={24} />
                    </button>
                    {/* Mobile page titles are handled by the pages themselves or we can just leave the hamburger here */}
                </div>

                <Outlet />
            </main>
        </div>
    )
}

export default DashboardLayout
