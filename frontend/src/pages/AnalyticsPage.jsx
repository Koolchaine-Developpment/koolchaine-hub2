import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '../layout/DashboardLayout';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { apiFetch } from '../lib/api';

const AnalyticsPage = () => {
    const [stats, setStats] = useState({
        revenus_mois: null,
        variation_revenus: null,
        commandes_attente: 0,
        prospects_semaine: 0,
        posts_mois: 0,
        engagement_mois: null,
    });
    const [revenusData, setRevenusData] = useState([]);
    const [tunnel, setTunnel] = useState({ scraping: 0, enrichissement: 0, contactes: 0, reponses: 0 });
    const [recent, setRecent] = useState({ commandes: [], contacts: [], posts: [] });

    const [periode, setPeriode] = useState(30);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [resSummary, resRevenus, resTunnel, resRecent] = await Promise.all([
                apiFetch('/api/v1/analytics/overview'),
                apiFetch(`/api/v1/analytics/revenus?periode=${periode}`),
                apiFetch('/api/v1/analytics/tunnel-prospection'),
                apiFetch('/api/v1/analytics/recent')
            ]);

            if (!resSummary.ok || !resRevenus.ok || !resTunnel.ok || !resRecent.ok) {
                throw new Error("Erreur de communication avec le serveur principal (HTTP Error).");
            }

            const dataSummary = await resSummary.json();
            const dataRevenus = await resRevenus.json();
            const dataTunnel = await resTunnel.json();
            const dataRecent = await resRecent.json();

            setStats(dataSummary);
            setRevenusData(dataRevenus);
            setTunnel(dataTunnel);
            setRecent(dataRecent);
        } catch (err) {
            console.error('Analytics load error:', err);
            setError(err.message || 'Une erreur inattendue s\'est produite lors du chargement des données.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [periode]); // Re-fetch quand la période change

    // Composant Helper pour les Statuts de badges mapping générique
    const mapStatus = (statusStr) => {
        if (!statusStr) return { type: 'nouveau', label: 'Nouveau' };
        const s = statusStr.toLowerCase();
        if (s.includes('valide')) return { type: 'valide', label: 'Validé' };
        if (s.includes('contact')) return { type: 'envoye', label: 'Contacté' };
        if (s.includes('envoy')) return { type: 'envoye', label: 'Envoyé' };
        if (s.includes('répon') || s.includes('repon')) return { type: 'repondu', label: 'Répondu' };
        if (s.includes('programmé')) return { type: 'actif', label: 'Programmé' };
        if (s.includes('actif')) return { type: 'actif', label: 'Actif' };
        if (s.includes('pause')) return { type: 'pause', label: 'Pause' };
        return { type: 'nouveau', label: statusStr };
    };

    // --- RENDU ERREUR OU CHARGEMENT GLOBAL ---
    // S'il y a une erreur critique et pas de données pour masquer ça: on affiche juste l'erreur
    if (error && Object.keys(stats).length === 0) {
        return (
            <DashboardLayout>
                <div style={{ padding: '32px', color: 'var(--gray)', textAlign: 'center', marginTop: '10vh' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--dark)' }}>Erreur de chargement Analytics</div>
                    <div style={{ fontSize: '14px', marginTop: '8px', maxWidth: '400px', margin: '8px auto' }}>{error}</div>
                    <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={loadData}>Réessayer</button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>

                {/* 3.1 HEADER */}
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                    <div>
                        <div className="page-title">Analytics</div>
                        <div className="page-subtitle">Vue consolidée de toute l'activité Koolchaine</div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <select className="field-input" style={{ width: 'auto', fontSize: '13px', padding: '8px 12px' }}
                            value={periode} onChange={e => setPeriode(Number(e.target.value))} disabled={loading}>
                            <option value={7}>7 derniers jours</option>
                            <option value={30}>30 derniers jours</option>
                            <option value={90}>3 derniers mois</option>
                        </select>
                        <button className="btn" style={{ background: 'var(--surface-2)', color: 'var(--dark)', border: 'none' }} onClick={loadData}>
                            {loading ? '...' : 'Actualiser'}
                        </button>
                    </div>
                </div>

                {/* ALERTE ERREUR NON-BLOQUANTE (si on a des vieilles data mais fetch échoué) */}
                {error && (
                    <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', color: '#D32F2F', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '13px' }}>
                        <strong>Attention :</strong> Impossible d'actualiser les données récentes. ({error})
                    </div>
                )}

                {/* 3.2 METRIC CARDS (ROW 1) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    {/* Revenus */}
                    <div style={{ background: 'var(--pink)', borderRadius: 'var(--radius-lg)', padding: '24px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', opacity: 0.8 }}>REVENUS CE MOIS</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', marginTop: '12px', lineHeight: 1 }}>
                            {stats.revenus_mois?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) ?? '— €'}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px', fontWeight: 500 }}>
                            {stats.variation_revenus != null
                                ? `${stats.variation_revenus > 0 ? '+' : ''}${stats.variation_revenus}% vs mois dernier`
                                : '—'}
                        </div>
                    </div>

                    {/* Commandes */}
                    <div style={{ background: 'var(--dark)', borderRadius: 'var(--radius-lg)', padding: '24px', color: 'white' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', opacity: 0.6 }}>COMMANDES EN ATTENTE</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', marginTop: '12px', lineHeight: 1 }}>{stats.commandes_attente ?? 0}</div>
                        <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '8px', fontWeight: 500 }}>
                            {stats.commandes_attente === 0 ? '0 à expédier aujourd\'hui' : `${stats.commandes_attente} à traiter aujourd'hui`}
                        </div>
                    </div>

                    {/* Prospects */}
                    <div style={{ background: 'var(--pink)', borderRadius: 'var(--radius-lg)', padding: '24px', color: 'white' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', opacity: 0.8 }}>PROSPECTS CONTACTÉS</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', marginTop: '12px', lineHeight: 1 }}>{stats.prospects_semaine ?? 0}</div>
                        <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px', fontWeight: 500 }}>Cette semaine</div>
                    </div>

                    {/* Posts */}
                    <div style={{ background: 'var(--green)', borderRadius: 'var(--radius-lg)', padding: '24px', color: 'white' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', opacity: 0.8 }}>POSTS PUBLIÉS</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', marginTop: '12px', lineHeight: 1 }}>{stats.posts_mois ?? 0}</div>
                        <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px', fontWeight: 500 }}>
                            Ce mois — {stats.engagement_mois ?? '—'}% engagement
                        </div>
                    </div>
                </div>

                {/* 3.3 GRAPHIQUES (ROW 2) */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>

                    {/* Graphique évolution revenus */}
                    <div className="card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--dark)' }}>Évolution des revenus</div>
                            <span style={{ fontSize: '12px', color: 'var(--gray)', fontWeight: 500 }}>{periode} derniers jours</span>
                        </div>
                        {revenusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={revenusData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenu" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--pink)" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="var(--pink)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 11, fill: 'var(--gray)' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={v => {
                                            if (!v) return '';
                                            const parts = v.split('-');
                                            return `${parts[2]}/${parts[1]}`;
                                        }}
                                        minTickGap={20}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: 'var(--gray)' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={v => `${v}€`}
                                        width={50}
                                    />
                                    <Tooltip
                                        contentStyle={{ background: 'var(--dark)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        labelFormatter={v => {
                                            if (!v) return '';
                                            const parts = v.split('-');
                                            return `${parts[2]}/${parts[1]}/${parts[0]}`;
                                        }}
                                        formatter={v => [`${v} €`, 'Revenus']}
                                        itemStyle={{ color: 'var(--pink)', fontWeight: 600 }}
                                    />
                                    <Area type="monotone" dataKey="montant" stroke="var(--pink)" strokeWidth={3}
                                        fill="url(#colorRevenu)" dot={false} activeDot={{ r: 5, fill: 'var(--pink)', stroke: '#fff', strokeWidth: 2 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <EmptyState icon="📈" title="Pas encore de données" description="Les revenus apparaîtront ici une fois les premières commandes enregistrées" />
                            </div>
                        )}
                    </div>

                    {/* Tunnel prospection */}
                    <div className="card" style={{ padding: '24px' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--dark)', marginBottom: '32px' }}>Tunnel prospection global</div>
                        <div style={{ padding: '0 8px' }}>
                            {[
                                { label: 'Scraping', value: tunnel.scraping, color: 'var(--surface-2)' }, // Background color is enough for the bar base, we will fill
                                { label: 'Enrichissement', value: tunnel.enrichissement, color: '#CABFBD' },
                                { label: 'Contactés', value: tunnel.contactes, color: 'var(--dark)' },
                                { label: 'Réponses', value: tunnel.reponses, color: 'var(--pink)' },
                            ].map((step, i) => {
                                const max = Math.max(tunnel.scraping || 1, 1);
                                const pct = Math.round(((step.value || 0) / max) * 100);
                                return (
                                    <div key={i} style={{ marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--gray)' }}>{step.label}</span>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dark)' }}>{step.value || 0}</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'var(--surface-2)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pct}%`, background: step.color === 'var(--surface-2)' ? 'var(--gray)' : step.color, borderRadius: '4px', transition: 'width 600ms ease' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* 3.4 COMMANDES + CONTACTS (ROW 3) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

                    {/* Dernières commandes Shopify */}
                    <div className="card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div className="section-label" style={{ marginBottom: 0 }}>Shopify — Dernières commandes</div>
                            <a href="/shopify" style={{ fontSize: '12px', color: 'var(--pink)', textDecoration: 'none', fontWeight: 500 }}>Voir tout →</a>
                        </div>
                        {recent.commandes?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                {recent.commandes.map((cmd, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < recent.commandes.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dark)', marginBottom: '2px' }}>{cmd.client}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--gray)' }}>{cmd.produit} · {cmd.date}</div>
                                        </div>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dark)' }}>{cmd.montant.toLocaleString('fr-FR')} €</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '20px 0' }}>
                                <EmptyState icon="🛍️" title="Aucune commande" description="Aucune commande récente." />
                            </div>
                        )}
                    </div>

                    {/* Derniers contacts Prospection */}
                    <div className="card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div className="section-label" style={{ marginBottom: 0 }}>Prospection — Derniers contacts</div>
                            <a href="/prospection" style={{ fontSize: '12px', color: 'var(--pink)', textDecoration: 'none', fontWeight: 500 }}>Voir tout →</a>
                        </div>
                        {recent.contacts?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                {recent.contacts.map((contact, i) => {
                                    const st = mapStatus(contact.statut);
                                    return (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < recent.contacts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                            <div style={{ flex: 1, minWidth: 0, paddingRight: '16px' }}>
                                                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dark)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.prenom} {contact.nom}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--gray)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.societe} · {contact.date}</div>
                                            </div>
                                            <Badge type={st.type} label={st.label} />
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div style={{ padding: '20px 0' }}>
                                <EmptyState icon="👥" title="Aucun contact récent" description="La liste des contacts est vide." />
                            </div>
                        )}
                    </div>

                </div>

                {/* 3.5 PROCHAINS POSTS SOCIAL (ROW 4) */}
                <div className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div className="section-label" style={{ marginBottom: 0 }}>Social — Prochains posts programmés</div>
                        <a href="/social" style={{ fontSize: '12px', color: 'var(--pink)', textDecoration: 'none', fontWeight: 500 }}>Voir tout →</a>
                    </div>
                    {recent.posts?.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                            {recent.posts.map((post, i) => {
                                const st = mapStatus(post.statut);
                                return (
                                    <div key={i} style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontSize: '12px', color: 'var(--gray)', fontWeight: 500 }}>{post.date_programmee}</div>
                                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--dark)', opacity: 0.6, background: '#EAE5E0', padding: '2px 8px', borderRadius: '4px' }}>{post.persona}</div>
                                        </div>
                                        <div style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--dark)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            "{post.contenu}"
                                        </div>
                                        <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                                            <Badge type={st.type} label={st.label} dot={false} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div style={{ padding: '32px 0' }}>
                            <EmptyState icon="📱" title="Aucun post programmé" description="Crée ton premier post dans le module Social pour le programmer ici." />
                        </div>
                    )}
                </div>

            </div>
        </DashboardLayout>
    );
};

export default AnalyticsPage;
