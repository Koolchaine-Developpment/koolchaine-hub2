import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, Legend
} from 'recharts';
import { TrendingUp, ShoppingBag, Users, Instagram, Clock, CheckCircle, ArrowRight } from 'lucide-react';

const AnalyticsPage = () => {
    const [overview, setOverview] = useState(null);
    const [revenueData, setRevenueData] = useState([]);
    const [prospectionData, setProspectionData] = useState([]);
    const [recent, setRecent] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [ovRes, revRes, prosRes, recRes] = await Promise.all([
                fetch('/api/v1/analytics/overview'),
                fetch('/api/v1/analytics/revenue'),
                fetch('/api/v1/analytics/prospection'),
                fetch('/api/v1/analytics/recent')
            ]);

            const ov = await ovRes.json();
            const rev = await revRes.json();
            const pros = await prosRes.json();
            const rec = await recRes.json();

            setOverview(ov);
            setRevenueData(rev);
            setProspectionData(pros);
            setRecent(rec);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching analytics:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5 * 60 * 1000); // 5 mins
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#FDFCFB]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F5395A]"></div>
            </div>
        );
    }

    const EmptyState = ({ message }) => (
        <div className="flex flex-col items-center justify-center p-8 text-center h-48">
            <p className="text-[#8B837E] italic font-poppins">{message || "Aucune donnée disponible pour le moment."}</p>
        </div>
    );

    return (
        <div className="p-8 bg-[#FDFCFB] min-h-screen space-y-8 font-poppins">
            {/* --- Section 1: KPI Cards --- */}
            <h1 className="text-3xl font-archivo font-black text-[#2D2830] mb-6 tracking-tight uppercase">Tableau de Bord Analytics</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Revenus du mois"
                    value={`${overview?.revenue_month?.toLocaleString() || 0} €`}
                    trend={`${overview?.revenue_change_pct > 0 ? '+' : ''}${overview?.revenue_change_pct}% vs mois dernier`}
                    icon={<TrendingUp className="text-[#F5395A]" />}
                    color="pink"
                />
                <KPICard
                    title="Commandes en attente"
                    value={overview?.unfulfilled_orders || 0}
                    icon={<ShoppingBag className="text-[#8B837E]" />}
                    color="gray"
                />
                <KPICard
                    title="Prospects contactés"
                    value={overview?.contacted_week || 0}
                    trend="Cette semaine"
                    icon={<Users className="text-[#F5395A]" />}
                    color="pink"
                />
                <KPICard
                    title="Posts Instagram"
                    value={overview?.social_posts_month || 0}
                    trend="Mois en cours"
                    icon={<Instagram className="text-[#8B837E]" />}
                    color="gray"
                />
            </div>

            {/* --- Section 2: Charts --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                {/* Revenue Chart */}
                <div className="bg-white p-6 rounded-xl border border-[#E8E4DF] shadow-sm">
                    <h2 className="text-lg font-archivo font-bold text-[#2D2830] mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-[#F5395A]" />
                        Évolution des Revenus (30j)
                    </h2>
                    <div className="h-72 w-full">
                        {revenueData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EDE9" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#8B837E', fontSize: 12 }}
                                        tickFormatter={(val) => val.split('-').reverse().slice(0, 2).join('/')}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#8B837E', fontSize: 12 }}
                                        tickFormatter={(val) => `${val}€`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #E8E4DF', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        labelFormatter={(val) => val.split('-').reverse().join('/')}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#F5395A"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#F5395A', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState message="Pas de revenus enregistrés sur les 30 derniers jours." />
                        )}
                    </div>
                </div>

                {/* Prospection Funnel */}
                <div className="bg-white p-6 rounded-xl border border-[#E8E4DF] shadow-sm">
                    <h2 className="text-lg font-archivo font-bold text-[#2D2830] mb-6 flex items-center gap-2">
                        <Users size={20} className="text-[#F5395A]" />
                        Tunnel de Prospection
                    </h2>
                    <div className="h-72 w-full">
                        {prospectionData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={prospectionData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F0EDE9" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="step"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#2D2830', fontWeight: 600, fontSize: 13 }}
                                        width={100}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#FDFCFB' }}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #E8E4DF' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {prospectionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === prospectionData.length - 1 ? '#F5395A' : '#CABFBD'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState message="Aucun contact dans le tunnel de prospection." />
                        )}
                    </div>
                </div>
            </div>

            {/* --- Section 3: Summaries --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8">
                {/* Shopify Recent */}
                <div className="bg-white rounded-xl border border-[#E8E4DF] shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 bg-[#FDFCFB] border-bottom border-[#E8E4DF] flex justify-between items-center">
                        <h3 className="font-archivo font-bold text-[#2D2830] uppercase text-xs tracking-wider">Shopify : Dernières Commandes</h3>
                        <ShoppingBag size={16} className="text-[#8B837E]" />
                    </div>
                    <div className="flex-1">
                        {recent?.orders?.length > 0 ? (
                            <div className="divide-y divide-[#F0EDE9]">
                                {recent.orders.map(order => (
                                    <div key={order.id} className="p-4 flex justify-between items-center hover:bg-[#FDFCFB] transition-colors">
                                        <div>
                                            <p className="font-semibold text-sm text-[#2D2830]">#{order.number}</p>
                                            <p className="text-xs text-[#8B837E]">{order.customer}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm text-[#F5395A]">{order.total} €</p>
                                            <p className="text-[10px] text-[#8B837E]">{order.date}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState message="Aucune commande récente." />
                        )}
                    </div>
                </div>

                {/* Prospection Recent */}
                <div className="bg-white rounded-xl border border-[#E8E4DF] shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 bg-[#FDFCFB] border-bottom border-[#E8E4DF] flex justify-between items-center">
                        <h3 className="font-archivo font-bold text-[#2D2830] uppercase text-xs tracking-wider">Prospection : Derniers Contacts</h3>
                        <Users size={16} className="text-[#8B837E]" />
                    </div>
                    <div className="flex-1">
                        {recent?.contacts?.length > 0 ? (
                            <div className="divide-y divide-[#F0EDE9]">
                                {recent.contacts.map(contact => (
                                    <div key={contact.id} className="p-4 flex justify-between items-center hover:bg-[#FDFCFB] transition-colors">
                                        <div>
                                            <p className="font-semibold text-sm text-[#2D2830]">{contact.name}</p>
                                            <p className="text-xs text-[#8B837E] truncate w-32">{contact.company}</p>
                                        </div>
                                        <div className="text-right">
                                            <StatusBadge status={contact.status} />
                                            <p className="text-[10px] text-[#8B837E] mt-1">{contact.date}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState message="Aucun contact récent." />
                        )}
                    </div>
                </div>

                {/* Social Next */}
                <div className="bg-white rounded-xl border border-[#E8E4DF] shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 bg-[#FDFCFB] border-bottom border-[#E8E4DF] flex justify-between items-center">
                        <h3 className="font-archivo font-bold text-[#2D2830] uppercase text-xs tracking-wider">Social : Prochains Posts</h3>
                        <Instagram size={16} className="text-[#8B837E]" />
                    </div>
                    <div className="flex-1">
                        {recent?.social?.length > 0 ? (
                            <div className="divide-y divide-[#F0EDE9]">
                                {recent.social.map(post => (
                                    <div key={post.id} className="p-4 hover:bg-[#FDFCFB] transition-colors">
                                        <p className="text-sm text-[#2D2830] line-clamp-2 leading-relaxed mb-2 italic">"{post.caption}"</p>
                                        <div className="flex items-center gap-1.5 text-[#8B837E]">
                                            <Clock size={12} />
                                            <p className="text-[10px] font-semibold">{post.datetime}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState message="Aucun post programmé." />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const KPICard = ({ title, value, trend, icon, color }) => (
    <div className="bg-white p-6 rounded-xl border border-[#E8E4DF] shadow-sm">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-lg ${color === 'pink' ? 'bg-[#FFF0F2]' : 'bg-[#FDFCFB]'}`}>
                {icon}
            </div>
            {trend && (
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${trend.includes('+') || trend.includes('semaine') ? 'bg-[#E8F8EE] text-[#0A8738]' : 'bg-[#FDFCFB] text-[#8B837E]'}`}>
                    {trend}
                </span>
            )}
        </div>
        <div>
            <p className="text-xs font-bold text-[#8B837E] uppercase tracking-wider mb-1 font-archivo">{title}</p>
            <p className="text-2xl font-black text-[#2D2830] font-archivo">{value}</p>
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    const config = {
        new: { label: 'Nouveau', bg: 'bg-[#F0EDE9]', text: 'text-[#8B837E]' },
        contacted: { label: 'Contacté', bg: 'bg-[#FFF0F2]', text: 'text-[#F5395A]' },
        replied: { label: 'Répondu', bg: 'bg-[#E8F8EE]', text: 'text-[#0A8738]' }
    };
    const { label, bg, text } = config[status] || config.new;
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bg} ${text}`}>
            {label}
        </span>
    );
};

export default AnalyticsPage;
