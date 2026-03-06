import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Users, UserCheck, MessageCircleReply, Target, Zap, Clock, CheckCircle, AlertCircle, Play, Terminal } from 'lucide-react'
import { apiFetch } from '../../lib/api'

const StatCard = ({ title, value, icon: Icon, cardClass = "card", meta }) => (
    <div className={`card ${cardClass}`}>
        <div className="card-label flex items-center justify-between">
            <span>{title}</span>
            <Icon size={16} style={{ opacity: 0.6 }} />
        </div>
        <div className="card-value">{value}</div>
        <div className="card-meta">{meta || 'Metric tracking'}</div>
        <div className="card-deco"></div>
    </div>
)

const Dashboard = () => {
    const [stats, setStats] = useState({
        total_prospects: 0,
        contacted: 0,
        replied: 0,
        a_valider: 0,
        conversion_rate: 0,
        last_job: null,
    })
    const [running, setRunning] = useState(false)
    const [jobLogs, setJobLogs] = useState([])
    const [jobProgress, setJobProgress] = useState({ societes: 0, contacts: 0, emails: 0 })
    const [jobStatus, setJobStatus] = useState(null)
    const logsEndRef = useRef(null)

    const fetchStats = () => {
        axios.get('/api/v1/prospection/stats')
            .then(res => setStats(res.data))
            .catch(err => console.error(err))
    }

    useEffect(() => {
        fetchStats()
        const interval = setInterval(fetchStats, 10000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [jobLogs])

    const launchPipeline = async () => {
        setRunning(true)
        setJobLogs([])
        setJobProgress({ societes: 0, contacts: 0, emails: 0 })
        setJobStatus('running')

        try {
            const res = await apiFetch('/api/v1/prospection/jobs/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    secteurs: ['evenementiel', 'mode', 'com', 'hotel', 'ehpad'],
                    effectifs_min: 200,
                }),
            })
            const data = await res.json()
            const jobId = data.job_id

            // Polling toutes les 3 secondes
            const interval = setInterval(async () => {
                try {
                    const logsRes = await apiFetch(`/api/v1/prospection/jobs/${jobId}/logs`)
                    const logsData = await logsRes.json()

                    setJobLogs(logsData.log || [])
                    setJobProgress({
                        societes: logsData.nb_societes_trouvees || 0,
                        contacts: logsData.nb_contacts_enrichis || 0,
                        emails: logsData.nb_emails_generes || 0
                    })
                    setJobStatus(logsData.status)

                    if (logsData.status === 'done' || logsData.status === 'error') {
                        clearInterval(interval)
                        setRunning(false)
                        fetchStats()
                    }
                } catch (err) {
                    console.error('Polling error:', err)
                    clearInterval(interval)
                    setRunning(false)
                }
            }, 3000)
        } catch (err) {
            console.error(err)
            setRunning(false)
        }
    }

    const lastJob = stats.last_job

    const getJobStatusBadge = (status) => {
        switch (status) {
            case 'done': return <span className="badge badge-green"><CheckCircle size={12} /> Terminé</span>
            case 'running': return <span className="badge badge-pink"><Clock size={12} className="animate-pulse" /> En cours</span>
            case 'error': return <span className="badge badge-yellow"><AlertCircle size={12} /> Erreur</span>
            default: return <span className="badge badge-dark"><Clock size={12} /> En attente</span>
        }
    }

    return (
        <div className="animate-fade-in pb-8 space-y-6">
            {/* KPI Bento */}
            <div className="bento">
                <StatCard
                    title="Total Prospects"
                    value={stats.total_prospects}
                    icon={Users}
                    cardClass="card-dark"
                    meta={`${stats.a_valider} en attente de validation`}
                />
                <StatCard
                    title="Contactés"
                    value={stats.contacted}
                    icon={UserCheck}
                    cardClass="card-pink"
                    meta="Emails envoyés"
                />
                <StatCard
                    title="Réponses"
                    value={stats.replied}
                    icon={MessageCircleReply}
                    cardClass="card-green"
                    meta={`Taux : ${stats.conversion_rate}%`}
                />
                <StatCard
                    title="Taux de Conversion"
                    value={`${stats.conversion_rate}%`}
                    icon={Target}
                    cardClass="card"
                    meta="Réponses / contactés"
                />
            </div>

            {/* Validation bandeau */}
            {stats.a_valider > 0 && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(255,184,0,0.12), rgba(255,184,0,0.05))',
                    border: '1px solid rgba(255,184,0,0.3)',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Zap size={20} style={{ color: 'var(--pink)' }} />
                        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--dark)' }}>
                            {stats.a_valider} contacts en attente de validation
                        </span>
                    </div>
                    <a href="/prospection/contacts?status=a_valider" className="btn btn-pink" style={{ fontSize: '13px' }}>
                        Valider maintenant →
                    </a>
                </div>
            )}

            {/* Dernier Job + Lancer */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div className="section-title" style={{ margin: 0 }}>Pipeline de scraping</div>
                    <button
                        onClick={launchPipeline}
                        disabled={running || (lastJob && lastJob.status === 'running')}
                        className="btn btn-pink"
                        style={{ fontSize: '13px' }}
                    >
                        <Play size={14} />
                        {running ? 'En cours...' : 'Lancer maintenant'}
                    </button>
                </div>

                {lastJob ? (
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div>
                            {getJobStatusBadge(lastJob.status)}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--gray)' }}>
                            {lastJob.finished_at ? (
                                `Terminé le ${new Date(lastJob.finished_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                            ) : lastJob.started_at ? (
                                `Démarré le ${new Date(lastJob.started_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                            ) : (
                                'En attente'
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: '"Archivo Black", sans-serif', color: 'var(--dark)' }}>
                                    {lastJob.nb_societes_trouvees}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--gray)', fontWeight: 600, textTransform: 'uppercase' }}>Sociétés</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: '"Archivo Black", sans-serif', color: 'var(--pink)' }}>
                                    {lastJob.nb_contacts_enrichis}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--gray)', fontWeight: 600, textTransform: 'uppercase' }}>Contacts</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: '"Archivo Black", sans-serif', color: 'var(--green)' }}>
                                    {lastJob.nb_emails_generes}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--gray)', fontWeight: 600, textTransform: 'uppercase' }}>Emails</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ fontSize: '13px', color: 'var(--gray)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
                        <Zap size={24} style={{ color: 'var(--border)', marginBottom: '8px' }} />
                        <p>Aucun scraping lancé. Cliquez sur "Lancer maintenant" pour démarrer le pipeline.</p>
                    </div>
                )}

                {/* Barre de statut */}
                {running && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)', animation: 'pulse 1s infinite' }} />
                        <span style={{ fontSize: '12px', color: 'var(--dark)', fontWeight: 500 }}>
                            Pipeline en cours...
                        </span>
                    </div>
                )}

                {/* Compteurs progression */}
                {(running || jobProgress?.societes > 0) && (
                    <div style={{ display: 'flex', gap: '24px', marginBottom: '12px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--dark)' }}>
                                {jobProgress?.societes || 0}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--gray)', letterSpacing: '0.05em' }}>SOCIÉTÉS</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--pink)' }}>
                                {jobProgress?.contacts || 0}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--gray)', letterSpacing: '0.05em' }}>CONTACTS</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--green)' }}>
                                {jobProgress?.emails || 0}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--gray)', letterSpacing: '0.05em' }}>EMAILS</div>
                        </div>
                    </div>
                )}

                {/* Terminal logs */}
                {jobLogs?.length > 0 && (
                    <div style={{
                        background: 'var(--dark)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 16px',
                        maxHeight: '180px',
                        overflowY: 'auto'
                    }}>
                        {jobLogs.map((log, i) => (
                            <div key={i} style={{
                                fontSize: '11px',
                                color: log.msg?.includes('❌') ? '#ff6b6b' : log.msg?.includes('✅') ? '#6bff9e' : '#9B9',
                                fontFamily: 'monospace',
                                marginBottom: '3px',
                                lineHeight: 1.4
                            }}>
                                <span style={{ opacity: 0.5 }}>{log.time?.split('T')[1]?.split('.')[0]} </span>
                                {log.msg}
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                )}

                {/* Message succès */}
                {jobStatus === 'done' && !running && (
                    <div style={{
                        marginTop: '12px',
                        padding: '10px 14px',
                        background: 'rgba(0,200,150,0.1)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '12px',
                        color: 'var(--green)',
                        fontWeight: 500
                    }}>
                        ✅ Pipeline terminé — {jobProgress?.societes} sociétés, {jobProgress?.contacts} contacts, {jobProgress?.emails} emails
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard
