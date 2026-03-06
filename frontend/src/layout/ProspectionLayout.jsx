import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Building2, Users, Send } from 'lucide-react'

const tabs = [
    { name: 'Vue globale', path: '/prospection', icon: LayoutDashboard },
    { name: 'Sociétés', path: '/prospection/companies', icon: Building2 },
    { name: 'Contacts', path: '/prospection/contacts', icon: Users },
    { name: 'Campagnes', path: '/prospection/campaigns', icon: Send },
    { name: 'Séquences', path: '/prospection/sequences', icon: Send },
    { name: 'Templates', path: '/prospection/templates', icon: Send },
]

const ProspectionLayout = () => {
    return (
        <div className="flex flex-col h-full">
            {/* Tab bar */}
            <div className="sub-nav" style={{ margin: '-32px -32px 32px -32px' }}>
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.name}
                        to={tab.path}
                        end={tab.path === '/prospection'}
                        className={({ isActive }) => isActive ? 'sub-nav-item active flex items-center gap-2' : 'sub-nav-item flex items-center gap-2'}
                    >
                        <tab.icon size={15} />
                        {tab.name}
                    </NavLink>
                ))}
            </div>

            {/* Content area */}
            <div className="flex-1 animate-fade-in">
                <Outlet />
            </div>
        </div>
    )
}

export default ProspectionLayout
