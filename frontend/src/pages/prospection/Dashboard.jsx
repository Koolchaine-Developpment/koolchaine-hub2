import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Users, UserCheck, MessageCircleReply, Target } from 'lucide-react'

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

const Dashboard = () => {
    const [stats, setStats] = useState({
        total_prospects: 0,
        contacted: 0,
        replied: 0,
        conversion_rate: 0
    })

    useEffect(() => {
        axios.get('/api/v1/prospection/stats', { withCredentials: true })
            .then(res => setStats(res.data))
            .catch(err => console.error(err))
    }, [])

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Prospects"
                    value={stats.total_prospects}
                    icon={Users}
                    accentClass="border-t-brand-dark"
                />
                <StatCard
                    title="Contactés"
                    value={stats.contacted}
                    icon={UserCheck}
                    accentClass="border-t-accent-blue"
                />
                <StatCard
                    title="Réponses"
                    value={stats.replied}
                    icon={MessageCircleReply}
                    accentClass="border-t-accent-green"
                />
                <StatCard
                    title="Taux de Conversion"
                    value={`${stats.conversion_rate}%`}
                    icon={Target}
                    accentClass="border-t-accent-yellow"
                />
            </div>

            {/* Placeholder for future charts or recent activity */}
            <div className="bg-brand-surface p-12 rounded-[10px] border border-brand-border flex flex-col items-center justify-center gap-3">
                <Target size={24} className="text-accent-pink opacity-80" />
                <p className="text-brand-text-secondary italic font-sans text-sm">Flux d'activité récent (à venir)</p>
            </div>
        </div>
    )
}

export default Dashboard
