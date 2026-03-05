import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Store, ShoppingCart, Printer, Package } from 'lucide-react'

const tabs = [
    { name: 'Vue globale', path: '/shopify', icon: Store },
    { name: 'Commandes', path: '/shopify/orders', icon: ShoppingCart },
    { name: 'Bordereau (PDF)', path: '/shopify/packing-list', icon: Printer },
    { name: 'Stocks', path: '/shopify/stock', icon: Package },
]

const ShopifyLayout = () => {
    return (
        <div className="flex flex-col h-full">
            {/* Tab bar */}
            <div className="sub-nav" style={{ margin: '-32px -32px 32px -32px' }}>
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.name}
                        to={tab.path}
                        end={tab.path === '/shopify'}
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

export default ShopifyLayout
