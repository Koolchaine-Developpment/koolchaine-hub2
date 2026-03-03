import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { ShoppingBag, Truck, AlertTriangle, TrendingUp } from 'lucide-react'

const StatCard = ({ title, value, icon: Icon, accentClass }) => (
    <div className={`bg-brand-surface p-6 rounded-[10px] border border-brand-border border-t-4 ${accentClass} shadow-sm hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow duration-200 flex items-start justify-between`}>
        <div>
            <p className="text-sm font-sans font-medium text-brand-text-secondary">{title}</p>
            <h3 className="text-[32px] font-heading text-brand-text-primary leading-none mt-3">{value}</h3>
        </div>
        <div className="p-3 rounded-lg bg-brand-bg text-brand-text-secondary">
            <Icon size={24} />
        </div>
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
                const ordersRes = await axios.get('/api/v1/shopify/orders?status=any&limit=100', { withCredentials: true })
                const stockRes = await axios.get('/api/v1/shopify/stock', { withCredentials: true })

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
        <div className="space-y-8 animate-fade-in font-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Commandes (Aujourd'hui)"
                    value={stats.orders_today}
                    icon={ShoppingBag}
                    accentClass="border-t-brand-dark"
                />
                <StatCard
                    title="À expédier"
                    value={stats.unfulfilled}
                    icon={Truck}
                    accentClass="border-t-accent-yellow"
                />
                <StatCard
                    title="Revenus (Auj.)"
                    value={`€${stats.revenue_today.toFixed(2)}`}
                    icon={TrendingUp}
                    accentClass="border-t-accent-green"
                />
                <StatCard
                    title="Alertes de stock"
                    value={stats.stock_alerts}
                    icon={AlertTriangle}
                    accentClass="border-t-accent-pink"
                />
            </div>

            <div className="bg-brand-surface p-12 rounded-[10px] border border-brand-border flex flex-col items-center justify-center gap-3">
                <ShoppingBag size={24} className="text-accent-pink opacity-80" />
                <p className="text-brand-text-secondary italic font-sans text-sm">Aperçu chronologique des commandes (à venir)</p>
            </div>
        </div>
    )
}

export default ShopifyDashboard
