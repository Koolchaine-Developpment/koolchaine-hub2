import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'

export default function SocialLayout() {
    const tabs = [
        { path: '/social/sandbox', label: 'Sandbox' },
        { path: '/social/validation', label: 'Validation' },
        { path: '/social/planner', label: 'Planification' },
    ]

    return (
        <div style={{ minHeight: '100vh', background: 'var(--cream)', margin: '-32px' }}>
            {/* Sub-nav */}
            <div style={{
                background: 'white',
                borderBottom: '1px solid var(--border)',
                padding: '0 32px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
            }}>
                <span style={{
                    fontFamily: 'Archivo Black',
                    fontSize: '15px',
                    color: 'var(--dark)',
                    marginRight: '24px',
                    padding: '16px 0'
                }}>Social</span>
                {tabs.map(tab => (
                    <NavLink
                        key={tab.path}
                        to={tab.path}
                        style={({ isActive }) => ({
                            padding: '16px 16px',
                            fontSize: '13px',
                            fontWeight: isActive ? 600 : 500,
                            color: isActive ? 'var(--pink)' : 'var(--gray)',
                            borderBottom: isActive ? '2px solid var(--pink)' : '2px solid transparent',
                            textDecoration: 'none',
                            transition: 'all 150ms'
                        })}
                    >
                        {tab.label}
                    </NavLink>
                ))}
            </div>

            <div style={{ height: 'calc(100vh - 57px)' }}>
                <Outlet />
            </div>
        </div>
    )
}
