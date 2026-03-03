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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>

            {/* Tab bar */}
            <div style={{
                display: 'flex',
                gap: 0,
                borderBottom: '1px solid #E8E4DF',
                backgroundColor: '#FFFFFF',
                borderRadius: '10px 10px 0 0',
                padding: '0 4px',
                flexShrink: 0,
            }}>
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.name}
                        to={tab.path}
                        end={tab.path === '/shopify'}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                            padding: '14px 18px',
                            fontSize: '13px',
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 500,
                            color: isActive ? '#F5395A' : '#6B6560',
                            borderBottom: isActive ? '3px solid #F5395A' : '3px solid transparent',
                            textDecoration: 'none',
                            transition: 'all 0.15s ease',
                            whiteSpace: 'nowrap',
                        })}
                    >
                        <tab.icon size={15} />
                        {tab.name}
                    </NavLink>
                ))}
            </div>

            {/* Content card */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                backgroundColor: '#FFFFFF',
                borderRadius: '0 0 10px 10px',
                borderLeft: '1px solid #E8E4DF',
                borderRight: '1px solid #E8E4DF',
                borderBottom: '1px solid #E8E4DF',
                padding: '28px',
            }}>
                <Outlet />
            </div>
        </div>
    )
}

export default ShopifyLayout
