import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, ShoppingBag, Instagram, Send, UserCheck, Clock, CheckCircle } from 'lucide-react'
import { apiFetch } from '../lib/api'

export default function DashboardPage() {
    const navigate = useNavigate()

    const [stats, setStats] = useState({})
    const [pipeline, setPipeline] = useState({})
    const [activite, setActivite] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAll = async () => {
            try {
                // Fetch stats from specific modules
                const [shopRes, prosRes, ovRes, recRes] = await Promise.allSettled([
                    apiFetch('/api/v1/shopify/stats'),
                    apiFetch('/api/v1/prospection/stats'),
                    apiFetch('/api/v1/analytics/overview'),
                    apiFetch('/api/v1/analytics/recent')
                ])

                const shopData = shopRes.status === 'fulfilled' && shopRes.value.ok ? await shopRes.value.json() : {}
                const prosData = prosRes.status === 'fulfilled' && prosRes.value.ok ? await prosRes.value.json() : {}
                const ovData = ovRes.status === 'fulfilled' && ovRes.value.ok ? await ovRes.value.json() : {}
                const recData = recRes.status === 'fulfilled' && recRes.value.ok ? await recRes.value.json() : {}

                setStats({
                    revenus: shopData.revenue_month ?? ovData.revenue_month ?? null,
                    revenusChange: ovData.revenue_change_pct ?? null,
                    prospects: prosData.contacted_week ?? ovData.contacted_week ?? null,
                    contacted: prosData.contacted ?? null,
                    replied: prosData.replied ?? null,
                    conversionRate: prosData.conversion_rate ?? null,
                    commandes: shopData.pending_orders ?? ovData.unfulfilled_orders ?? null,
                    aExpedier: shopData.to_ship_today ?? shopData.pending_orders ?? null,
                    posts: null, // Social not yet available
                    engagement: null,
                })

                setPipeline({
                    scraping: prosData.total_scraped ?? 0,
                    scrapingPct: prosData.scraping_pct ?? 0,
                    enriched: prosData.emails_found ?? 0,
                    enrichPct: prosData.enrichment_pct ?? 0,
                    contactes: prosData.emails_sent ?? 0,
                    contactesPct: prosData.contacted_pct ?? 0,
                    reponses: prosData.replied ?? 0,
                    reponsesPct: prosData.reply_pct ?? 0,
                    secteurs: prosData.active_sectors ?? ['Événementiel', 'EHPAD', 'Hôtels'],
                })

                // Build activity feed from recent data
                const feed = []
                if (recData.orders) {
                    recData.orders.slice(0, 2).forEach(o => {
                        feed.push({
                            icon: '📦',
                            bgColor: 'rgba(245,57,90,0.08)',
                            title: `Commande ${o.number || o.id || '#'}`,
                            time: o.date || '',
                            module: 'Shopify',
                            badgeColor: 'pink',
                            link: '/shopify/orders'
                        })
                    })
                }
                if (recData.contacts) {
                    recData.contacts.slice(0, 2).forEach(c => {
                        feed.push({
                            icon: '👤',
                            bgColor: 'rgba(91,111,232,0.08)',
                            title: `${c.name || ''} — ${c.company || ''}`.trim(),
                            time: c.date || '',
                            module: 'Prospection',
                            badgeColor: 'blue',
                            link: '/prospection/contacts'
                        })
                    })
                }

                // Sort feed by time if possible, or just interleave them as they are
                setActivite(feed)
            } catch (e) {
                console.error('Dashboard fetch error:', e)
            } finally {
                setLoading(false)
            }
        }

        fetchAll()
        const interval = setInterval(fetchAll, 60000) // update every 60s
        return () => clearInterval(interval)
    }, [])

    const today = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })

    return (
        <div className="animate-fade-in">
            {/* HEADER */}
            <div className="page-header">
                <div>
                    <div className="page-title">Dashboard</div>
                    <div className="page-subtitle" style={{ textTransform: 'capitalize' }}>{today}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost">Exporter</button>
                    <button className="btn btn-pink" onClick={() => navigate('/prospection/campaigns?new=true')}>+ Nouvelle campagne</button>
                </div>
            </div>

            {/* ROW 1 — KPI BENTO */}
            <div className="bento">

                {/* Revenus */}
                <div className="card card-pink" onClick={() => navigate('/shopify')} style={{ cursor: 'pointer' }}>
                    <div className="card-deco" />
                    <div className="card-deco-2" />
                    <div className="card-label">Revenus ce mois</div>
                    <div className="card-value">
                        {loading ? (
                            <div className="skeleton" style={{ width: '80px', height: '36px', borderRadius: '6px' }} />
                        ) : (
                            stats.revenus != null ? `${stats.revenus.toFixed(2)}€` : '—'
                        )}
                    </div>
                    {!loading && <div className="card-meta">
                        {stats.revenusChange != null ? (
                            `${stats.revenusChange > 0 ? '↑ (+)' : '↓ '}${stats.revenusChange}% vs mois dernier`
                        ) : (
                            'vs mois dernier'
                        )}
                    </div>}
                </div>

                {/* Prospects */}
                <div className="card" onClick={() => navigate('/prospection')} style={{ cursor: 'pointer' }}>
                    <div className="card-label">Prospects contactés</div>
                    <div className="card-value">
                        {loading ? (
                            <div className="skeleton" style={{ width: '80px', height: '36px', borderRadius: '6px' }} />
                        ) : (
                            stats.prospects != null ? stats.prospects : '—'
                        )}
                    </div>
                    {!loading && <div className="card-meta">Cette semaine</div>}
                    <div className="mini-chart">
                        {[30, 55, 40, 70, 85, 60, 100].map((h, i, arr) => (
                            <div
                                key={i}
                                className="bar"
                                style={{
                                    height: `${h}%`,
                                    background: i === arr.length - 1 ? 'var(--pink)' : i >= arr.length - 4 ? 'var(--blue)' : 'var(--border)',
                                    opacity: 0.9
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Commandes */}
                <div className="card card-dark" onClick={() => navigate('/shopify/orders')} style={{ cursor: 'pointer' }}>
                    <div className="card-deco" />
                    <div className="card-deco-2" />
                    <div className="card-label">Commandes en attente</div>
                    <div className="card-value">
                        {loading ? (
                            <div className="skeleton" style={{ width: '80px', height: '36px', borderRadius: '6px' }} />
                        ) : (
                            stats.commandes != null ? stats.commandes : '—'
                        )}
                    </div>
                    {!loading && <div className="card-meta">{stats.aExpedier ?? '—'} à expédier aujourd'hui</div>}
                </div>

                {/* Posts */}
                <div className="card card-green" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                    <div className="card-deco" />
                    <div className="card-deco-2" />
                    <div className="card-label">Posts publiés</div>
                    <div className="card-value">
                        {loading ? (
                            <div className="skeleton" style={{ width: '80px', height: '36px', borderRadius: '6px' }} />
                        ) : (
                            stats.posts != null ? stats.posts : '—'
                        )}
                    </div>
                    {!loading && <div className="card-meta">Ce mois — {stats.engagement ?? '—'}% engagement</div>}
                </div>

            </div>

            {/* ROW 2 — Pipeline + Activité */}
            <div className="bento-3">

                {/* Pipeline prospection */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div className="section-title" style={{ margin: 0 }}>Pipeline prospection</div>
                        <span
                            onClick={() => navigate('/prospection')}
                            style={{ fontSize: '12px', color: 'var(--pink)', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Voir tout →
                        </span>
                    </div>

                    <div className="progress-row">
                        <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${pipeline.scrapingPct ?? 0}%`, background: 'var(--blue)' }}>
                                <span className="progress-fill-label">Scraping</span>
                                <span className="progress-fill-val">{loading ? '-' : pipeline.scraping ?? 0} entreprises</span>
                            </div>
                        </div>
                    </div>

                    <div className="progress-row">
                        <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${pipeline.enrichPct ?? 0}%`, background: 'var(--pink)' }}>
                                <span className="progress-fill-label">Enrichissement</span>
                                <span className="progress-fill-val">{loading ? '-' : pipeline.enriched ?? 0} emails</span>
                            </div>
                            <span className="progress-track-label">{loading ? '-' : pipeline.enriched ?? 0} trouvés</span>
                        </div>
                    </div>

                    <div className="progress-row">
                        <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${pipeline.contactesPct ?? 0}%`, background: 'var(--green)' }}>
                                <span className="progress-fill-label">Contactés</span>
                                <span className="progress-fill-val">{loading ? '-' : pipeline.contactes ?? 0} envoyés</span>
                            </div>
                            <span className="progress-track-label">{loading ? '-' : pipeline.contactes ?? 0} emails</span>
                        </div>
                    </div>

                    <div className="progress-row" style={{ marginBottom: 0 }}>
                        <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${Math.max(pipeline.reponsesPct ?? 0, 8)}%`, background: 'var(--yellow)', minWidth: '80px' }}>
                                <span className="progress-fill-label" style={{ color: 'var(--dark)' }}>Réponses</span>
                            </div>
                            <span className="progress-track-label">{loading ? '-' : pipeline.reponses ?? 0} retours</span>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {(pipeline.secteurs ?? []).map((s, i) => (
                            <span key={i} className={`badge ${i === 0 ? 'badge-blue' : i === 1 ? 'badge-dark' : 'badge-outline-pink'}`}>{s}</span>
                        ))}
                    </div>
                </div>

                {/* Activité récente */}
                <div className="card">
                    <div className="section-title">Activité récente</div>

                    {loading ? (
                        <div style={{ padding: '20px 0' }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} className="list-item">
                                    <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '8px', marginRight: '16px' }} />
                                    <div style={{ flex: 1 }}>
                                        <div className="skeleton" style={{ width: '60%', height: '14px', marginBottom: '8px' }} />
                                        <div className="skeleton" style={{ width: '40%', height: '12px' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activite.length > 0 ? (
                        activite.slice(0, 4).map((item, i) => (
                            <div
                                key={i}
                                className="list-item"
                                onClick={() => item.link && navigate(item.link)}
                                style={{ cursor: item.link ? 'pointer' : 'default' }}
                            >
                                <div className="list-thumb" style={{ background: item.bgColor }}>{item.icon}</div>
                                <div style={{ flex: 1 }}>
                                    <div className="list-title">{item.title}</div>
                                    <div className="list-sub">
                                        {item.time}
                                        <span className={`badge badge-${item.badgeColor}`} style={{ padding: '2px 7px', fontSize: '10px', marginLeft: '4px' }}>
                                            {item.module}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ fontSize: '13px', color: 'var(--gray)', textAlign: 'center', padding: '20px 0' }}>
                            Aucune activité récente
                        </div>
                    )}
                </div>

            </div>

            {/* ROW 3 — Agents status */}
            <div className="bento">

                <div className="card" style={{ padding: '16px 20px', opacity: 0.6, cursor: 'not-allowed' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div className="card-label" style={{ margin: 0 }}>Agent Social</div>
                        <span className="badge badge-green"><span className="badge-dot" />Actif</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Prochain post programmé</div>
                    <div className="tags">
                        <span className="tag">Instagram</span>
                        <span className="tag">@koolchaine</span>
                    </div>
                </div>

                <div className="card" onClick={() => navigate('/prospection')} style={{ padding: '16px 20px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div className="card-label" style={{ margin: 0 }}>Agent Prospection</div>
                        <span className={`badge ${(stats.contacted ?? 0) > 0 ? 'badge-green' : 'badge-yellow'}`}>
                            <span className="badge-dot" />
                            {(stats.contacted ?? 0) > 0 ? 'Actif' : 'Pause'}
                        </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
                        {loading ? '-' : stats.prospects ?? 0} prospects contactés
                    </div>
                    <div className="tags">
                        <span className="tag">{(pipeline.secteurs?.length) ?? 0} secteurs</span>
                        <span className="tag">FR</span>
                    </div>
                </div>

                <div className="card" onClick={() => navigate('/shopify')} style={{ padding: '16px 20px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div className="card-label" style={{ margin: 0 }}>Agent Shopify</div>
                        <span className="badge badge-yellow"><span className="badge-dot" />Sync</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Sync toutes les 30 min</div>
                    <div className="tags">
                        <span className="tag">{loading ? '-' : stats.commandes ?? 0} commandes</span>
                        <span className="tag">Stock OK</span>
                    </div>
                </div>

                <div className="card" style={{ padding: '16px 20px', opacity: 0.6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div className="card-label" style={{ margin: 0 }}>Méta-Agent</div>
                        <span className="badge badge-dark">Bientôt</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Superviseur multi-agents</div>
                    <div className="tags">
                        <span className="tag">Phase 6</span>
                    </div>
                </div>

            </div>

        </div>
    )
}
