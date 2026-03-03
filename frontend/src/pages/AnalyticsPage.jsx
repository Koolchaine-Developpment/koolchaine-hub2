import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts'
import { Download, TrendingUp, TrendingDown, Inbox, Users, Instagram } from 'lucide-react'
import html2pdf from 'html2pdf.js'

const AnalyticsPage = () => {
    const [overview, setOverview] = useState(null)
    const [revenueData, setRevenueData] = useState([])
    const [funnelData, setFunnelData] = useState([])
    const [recentData, setRecentData] = useState({ orders: [], contacts: [] })
    const [socialData, setSocialData] = useState({ next_posts: [] })
    const [loading, setLoading] = useState(true)

    const fetchAnalytics = async () => {
        try {
            const [ovRes, revRes, funRes, recentRes, socRes] = await Promise.all([
                axios.get('/api/v1/analytics/overview', { withCredentials: true }),
                axios.get('/api/v1/analytics/revenue', { withCredentials: true }),
                axios.get('/api/v1/analytics/prospection', { withCredentials: true }),
                axios.get('/api/v1/analytics/recent', { withCredentials: true }),
                axios.get('/api/v1/analytics/social', { withCredentials: true })
            ])

            setOverview(ovRes.data)

            // Format revenue dates slightly for chart X-axis
            const formattedRev = revRes.data.map(d => ({
                ...d,
                name: new Date(d.name).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
            }))
            setRevenueData(formattedRev)

            setFunnelData(funRes.data)
            setRecentData(recentRes.data)
            setSocialData(socRes.data)

        } catch (err) {
            console.error('Failed to fetch analytics', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAnalytics()
        const autoRefresh = setInterval(fetchAnalytics, 300000) // 5 mins
        return () => clearInterval(autoRefresh)
    }, [])

    const handlePdfExport = () => {
        const element = document.getElementById('analytics-report')
        const opt = {
            margin: 10,
            filename: `Rapport_Koolchaine_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }
        html2pdf().set(opt).from(element).save()
    }

    if (loading && !overview) {
        return <div className="flex h-64 items-center justify-center text-slate-500">Chargement des analytiques...</div>
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-brand-surface p-4 border border-brand-border shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-[10px] font-sans">
                    <p className="text-brand-text-secondary font-medium mb-1">{label}</p>
                    <p className="text-accent-pink font-heading text-lg">
                        {payload[0].name === "Revenus" ? `€${payload[0].value.toFixed(2)}` : payload[0].value}
                    </p>
                </div>
            )
        }
        return null
    }

    const COLORS = ['#F5395A', '#5B6FE8', '#00C896', '#F5D647']

    return (
        <div id="analytics-report" className="pb-12 animate-fade-in font-sans">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-[32px] font-heading text-brand-dark">Vue Globale Analytics</h2>
                    <p className="text-brand-text-secondary font-sans mt-1">Données consolidées en temps réel.</p>
                </div>
                <button
                    onClick={handlePdfExport}
                    data-html2canvas-ignore
                    className="flex items-center gap-2 bg-brand-surface border border-brand-border text-brand-text-primary hover:bg-brand-bg hover:text-accent-pink font-sans font-medium py-2 px-5 rounded-[6px] shadow-sm transition-colors active:scale-[0.98]"
                >
                    <Download size={18} /> Exporter le rapport
                </button>
            </header>

            {/* SECTION 1: GLOBAL KPIs */}
            <h3 className="text-xl font-heading text-brand-dark mb-5 border-b border-brand-border pb-2">Indicateurs Clés de Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-brand-surface p-6 rounded-[10px] border border-brand-border shadow-sm relative overflow-hidden group hover:border-accent-pink transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-accent-pink group-hover:scale-110 transition-transform"><Inbox size={64} /></div>
                    <p className="text-sm font-sans font-medium text-brand-text-secondary mb-2">Revenus du mois</p>
                    <p className="text-3xl font-heading text-brand-text-primary mb-3">€{overview?.revenue_month?.toFixed(2) || "0.00"}</p>
                    <div className={`flex items-center gap-1.5 text-sm font-sans font-medium ${overview?.revenue_change_pct >= 0 ? 'text-accent-green' : 'text-accent-pink'}`}>
                        {overview?.revenue_change_pct >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <span>{overview?.revenue_change_pct > 0 ? "+" : ""}{overview?.revenue_change_pct || 0}% vs mois dernier</span>
                    </div>
                </div>

                <div className="bg-brand-surface p-6 rounded-[10px] border border-brand-border shadow-sm relative overflow-hidden group hover:border-accent-yellow transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-accent-yellow group-hover:scale-110 transition-transform"><Inbox size={64} /></div>
                    <p className="text-sm font-sans font-medium text-brand-text-secondary mb-2">Commandes en attente</p>
                    <p className="text-3xl font-heading text-brand-text-primary mb-3">{overview?.unfulfilled_orders || 0}</p>
                    <p className="text-sm font-sans text-brand-text-secondary">Prêtes à être expédiées</p>
                </div>

                <div className="bg-brand-surface p-6 rounded-[10px] border border-brand-border shadow-sm relative overflow-hidden group hover:border-accent-blue transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-accent-blue group-hover:scale-110 transition-transform"><Users size={64} /></div>
                    <p className="text-sm font-sans font-medium text-brand-text-secondary mb-2">Prospects (7j)</p>
                    <p className="text-3xl font-heading text-brand-text-primary mb-3">{overview?.contacted_week || 0}</p>
                    <p className="text-sm font-sans text-brand-text-secondary">Contactés cette semaine</p>
                </div>

                <div className="bg-brand-surface p-6 rounded-[10px] border border-brand-border shadow-sm relative overflow-hidden group hover:border-accent-pink transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-accent-pink group-hover:scale-110 transition-transform"><Instagram size={64} /></div>
                    <p className="text-sm font-sans font-medium text-brand-text-secondary mb-2">Posts Insta (Mois)</p>
                    <p className="text-3xl font-heading text-brand-text-primary mb-3">{overview?.social_posts_month || 0}</p>
                    <p className="text-sm font-sans text-brand-text-secondary">Taux engag.: <span className="text-accent-pink font-semibold">{overview?.engagement_rate || 0}%</span></p>
                </div>
            </div>

            {/* SECTION 2: CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                {/* Revenue Line Chart */}
                <div className="bg-brand-surface p-6 rounded-[10px] border border-brand-border shadow-sm">
                    <h3 className="text-lg font-heading text-brand-dark mb-6">Évolution des revenus (30 Jours)</h3>
                    <div className="h-72 w-full font-sans">
                        {revenueData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E4DF" />
                                    <XAxis dataKey="name" tick={{ fill: '#6B6560', fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#6B6560', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `€${val}`} />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Line type="monotone" name="Revenus" dataKey="value" stroke="#F5395A" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#F5395A', stroke: '#fff', strokeWidth: 2 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-brand-text-secondary italic">Pas de données de revenus suffisantes.</div>
                        )}
                    </div>
                </div>

                {/* Prospection Funnel Bar Chart */}
                <div className="bg-brand-surface p-6 rounded-[10px] border border-brand-border shadow-sm">
                    <h3 className="text-lg font-heading text-brand-dark mb-6">Pipeline de Prospection</h3>
                    <div className="h-72 w-full font-sans">
                        {funnelData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8E4DF" />
                                    <XAxis type="number" tick={{ fill: '#6B6560', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis dataKey="name" type="category" tick={{ fill: '#2D2830', fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#F7F5F2' }} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                                        {funnelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-brand-text-secondary italic">Pas de données de prospection.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* SECTION 3: RECENT ACTIVITIES */}
            <h3 className="text-xl font-heading text-brand-dark mb-5 border-b border-brand-border pb-2">Activité Récente</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
                {/* Module Shopify */}
                <div className="bg-brand-surface rounded-[10px] border border-brand-border shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-brand-bg px-5 py-4 border-b border-brand-border flex items-center gap-3">
                        <ShoppingBag className="text-accent-blue" size={20} />
                        <h4 className="font-heading text-brand-dark">Shopify (Dernières commandes)</h4>
                    </div>
                    <div className="p-0 flex-1 overflow-auto">
                        {recentData.orders.length > 0 ? (
                            <ul className="divide-y divide-brand-border">
                                {recentData.orders.map(o => (
                                    <li key={o.id} className="p-4 hover:bg-brand-bg transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium text-brand-text-primary">{o.number}</span>
                                            <span className="font-bold font-heading text-brand-dark">€{o.total.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-brand-text-secondary">
                                            <span>{o.customer}</span>
                                            <span>{o.date}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-8 text-center text-brand-text-secondary italic text-sm">Aucune commande récente.</div>
                        )}
                    </div>
                </div>

                {/* Module Prospection */}
                <div className="bg-brand-surface rounded-[10px] border border-brand-border shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-brand-bg px-5 py-4 border-b border-brand-border flex items-center gap-3">
                        <Users className="text-accent-green" size={20} />
                        <h4 className="font-heading text-brand-dark">Prospection (Derniers ajouts)</h4>
                    </div>
                    <div className="p-0 flex-1 overflow-auto">
                        {recentData.contacts.length > 0 ? (
                            <ul className="divide-y divide-brand-border">
                                {recentData.contacts.map(c => (
                                    <li key={c.id} className="p-4 hover:bg-brand-bg transition-colors">
                                        <div className="font-medium text-brand-text-primary mb-1">{c.name}</div>
                                        <div className="flex justify-between items-center text-xs text-brand-text-secondary">
                                            <span>{c.company}</span>
                                            <span>{c.date}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-8 text-center text-brand-text-secondary italic text-sm">Aucun prospect récent.</div>
                        )}
                    </div>
                </div>

                {/* Module Social */}
                <div className="bg-brand-surface rounded-[10px] border border-brand-border shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-brand-bg px-5 py-4 border-b border-brand-border flex items-center gap-3">
                        <Instagram className="text-accent-pink" size={20} />
                        <h4 className="font-heading text-brand-dark">Réseaux Sociaux (Prochains posts)</h4>
                    </div>
                    <div className="p-0 flex-1 overflow-auto">
                        {socialData.next_posts && socialData.next_posts.length > 0 ? (
                            <ul className="divide-y divide-brand-border">
                                {socialData.next_posts.map((p, i) => (
                                    <li key={i} className="p-4 hover:bg-brand-bg transition-colors">
                                        <div className="font-medium text-brand-text-primary text-sm mb-2 line-clamp-2" title={p.caption}>
                                            "{p.caption}"
                                        </div>
                                        <div className="flex justify-end text-xs font-semibold text-accent-pink">
                                            {p.date}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-8 text-center text-brand-text-secondary italic text-sm">Aucun post planifié.</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}

export default AnalyticsPage
