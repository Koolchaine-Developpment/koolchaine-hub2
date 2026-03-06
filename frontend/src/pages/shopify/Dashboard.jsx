import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { ShoppingBag, Truck, AlertTriangle, TrendingUp } from 'lucide-react'

const StatCard = ({ title, value, icon: Icon, cardClass = '' }) => (
    <div className={`card ${cardClass} flex flex-col justify-between`} style={{ padding: '24px' }}>
        <div className="flex justify-between items-start">
            <span className="card-label">{title}</span>
            <div className={`p-2 rounded-xl flex items-center justify-center`} style={{ backgroundColor: cardClass === 'card-dark' ? 'rgba(255,255,255,0.1)' : cardClass === 'card-pink' ? 'rgba(255,255,255,0.2)' : cardClass === 'card-green' ? 'var(--green)' : 'var(--surface-2)', color: (cardClass === 'card-dark' || cardClass === 'card-pink' || cardClass === 'card-green') ? '#FFF' : 'var(--dark)' }}>
                <Icon size={20} />
            </div>
        </div>
        <div className="card-value mt-4">{value}</div>
    </div>
)

const ShopifyDashboard = () => {
    const [stats, setStats] = useState({
        orders_today: 0,
        unfulfilled: 0,
        revenue_today: 0,
        stock_alerts: 0
    })

    // Since we don't have a dedicated stat endpoint yet, we'll calculate on the fly for demo purposes, 
    // or just fetch orders and calculate.
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const ordersRes = await axios.get('/api/v1/shopify/orders?status=any&limit=100')
                const stockRes = await axios.get('/api/v1/shopify/stock')

                const orders = ordersRes.data
                const today = new Date().toDateString()

                const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today)
                const unfulfilled = orders.filter(o => o.status === 'unfulfilled').length
                const revenue = todayOrders.reduce((sum, o) => sum + o.total_price, 0)

                const alerts = stockRes.data.filter(s => s.current_stock <= s.threshold).length

                setStats({
                    orders_today: todayOrders.length,
                    unfulfilled,
                    revenue_today: revenue,
                    stock_alerts: alerts
                })
            } catch (err) {
                console.error(err)
            }
        }
        fetchStats()
    }, [])

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bento">
                <StatCard
                    title="Commandes (Aujourd'hui)"
                    value={stats.orders_today}
                    icon={ShoppingBag}
                    cardClass="card-dark"
                />
                <StatCard
                    title="À expédier"
                    value={stats.unfulfilled}
                    icon={Truck}
                    cardClass=""
                />
                <StatCard
                    title="Revenus (Auj.)"
                    value={`€${parseFloat(stats.revenue_today).toFixed(2)}`}
                    icon={TrendingUp}
                    cardClass="card-green"
                />
                <StatCard
                    title="Alertes de stock"
                    value={stats.stock_alerts}
                    icon={AlertTriangle}
                    cardClass="card-pink"
                />
            </div>

            <div className="card flex flex-col items-center justify-center gap-3" style={{ padding: '48px' }}>
                <ShoppingBag size={24} style={{ color: 'var(--pink)', opacity: 0.8 }} />
                <p style={{ color: 'var(--gray)', fontStyle: 'italic', fontSize: '14px' }}>Aperçu chronologique des commandes (à venir)</p>
            </div>
        </div>
    )
}

export default ShopifyDashboard
