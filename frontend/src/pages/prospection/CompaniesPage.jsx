import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Upload, Search, Building2, Loader2, TrendingUp, Filter } from 'lucide-react'
import { apiFetch } from '../../lib/api'

const SECTEUR_LABELS = {
    evenementiel: 'Événementiel',
    mode: 'Mode',
    com: 'Com / Agences',
    hotel: 'Hôtels',
    ehpad: 'EHPAD',
}

const CompaniesPage = () => {
    const [companies, setCompanies] = useState([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [isImporting, setIsImporting] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [filters, setFilters] = useState({
        secteur: '',
        intent_score_min: '',
    })

    const fetchCompanies = async () => {
        try {
            const params = { page, per_page: 50 }
            if (filters.secteur) params.secteur = filters.secteur
            if (filters.intent_score_min) params.intent_score_min = parseInt(filters.intent_score_min)

            const res = await apiFetch(`/api/v1/prospection/societes?${new URLSearchParams(params)}`)
            const data = await res.json()
            setCompanies(data.results || [])
            setTotal(data.total || 0)
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        fetchCompanies()
    }, [page, filters.secteur, filters.intent_score_min])

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const formData = new FormData()
        formData.append('file', file)

        setIsImporting(true)
        try {
            await axios.post('/api/v1/prospection/companies/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            alert("Import réussi !")
            setShowModal(false)
            fetchCompanies()
        } catch (err) {
            alert("Erreur lors de l'import")
        } finally {
            setIsImporting(false)
        }
    }

    const getIntentBadge = (score) => {
        if (score >= 70) return <span className="badge badge-green" style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '11px' }}>{score}</span>
        if (score >= 30) return <span className="badge badge-yellow" style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '11px' }}>{score}</span>
        return <span className="badge badge-dark" style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '11px', opacity: 0.5 }}>{score || 0}</span>
    }

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 className="page-title flex items-center gap-2">
                        <Building2 size={20} style={{ color: 'var(--gray)' }} />
                        Base Sociétés
                    </h3>
                    <p className="page-subtitle">{total} sociétés en base</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn btn-pink">
                    <Upload size={16} /> Importer SIRENE (CSV)
                </button>
            </div>

            {/* Filters */}
            <div className="card flex gap-4 items-center" style={{ padding: '16px 20px' }}>
                <div className="flex items-center gap-2">
                    <Filter size={14} style={{ color: 'var(--gray)' }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray)', textTransform: 'uppercase' }}>Filtres</span>
                </div>
                <select
                    className="flex-1"
                    value={filters.secteur}
                    onChange={(e) => { setFilters({ ...filters, secteur: e.target.value }); setPage(1) }}
                >
                    <option value="">Tous les secteurs</option>
                    {Object.entries(SECTEUR_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                    ))}
                </select>
                <select
                    className="flex-1"
                    value={filters.intent_score_min}
                    onChange={(e) => { setFilters({ ...filters, intent_score_min: e.target.value }); setPage(1) }}
                >
                    <option value="">Intent score minimum</option>
                    <option value="70">≥ 70 (chaud)</option>
                    <option value="30">≥ 30 (tiède)</option>
                    <option value="1">≥ 1 (tout signal)</option>
                </select>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0 }}>
                <div className="overflow-x-auto">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th style={{ textAlign: 'center' }}>Secteur</th>
                                <th style={{ textAlign: 'center' }}>Effectifs</th>
                                <th>Ville</th>
                                <th style={{ textAlign: 'center' }}>Intent Score</th>
                                <th style={{ textAlign: 'center' }}>Signals</th>
                                <th style={{ textAlign: 'center' }}>Contacts</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--gray)', fontStyle: 'italic', padding: '48px 0' }}>
                                        Aucune société trouvée. Importez un fichier SIRENE ou lancez le pipeline.
                                    </td>
                                </tr>
                            ) : (
                                companies.map(company => (
                                    <tr key={company.id}>
                                        <td>
                                            <div style={{ fontWeight: 500, color: 'var(--dark)' }}>{company.name}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--gray)', fontFamily: 'monospace' }}>{company.siren}</div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {company.secteur ? (
                                                <span className="badge badge-dark" style={{ fontSize: '10px' }}>
                                                    {SECTEUR_LABELS[company.secteur] || company.secteur}
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--gray)', fontSize: '11px' }}>—</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center', color: 'var(--gray)', fontSize: '13px' }}>
                                            {company.effectifs || '—'}
                                        </td>
                                        <td style={{ color: 'var(--gray)', fontSize: '13px' }}>{company.city || '—'}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            {getIntentBadge(company.intent_score)}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div className="flex justify-center gap-1">
                                                {company.intent_levee_fonds && (
                                                    <span title="Levée de fonds" style={{ fontSize: '14px' }}>💰</span>
                                                )}
                                                {company.intent_salon && (
                                                    <span title="Salon / Événement" style={{ fontSize: '14px' }}>🎪</span>
                                                )}
                                                {company.intent_recrutement_event && (
                                                    <span title="Recrutement event" style={{ fontSize: '14px' }}>👔</span>
                                                )}
                                                {!company.intent_levee_fonds && !company.intent_salon && !company.intent_recrutement_event && (
                                                    <span style={{ color: 'var(--gray)', fontSize: '11px' }}>—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{ fontWeight: 600, color: company.nb_contacts > 0 ? 'var(--pink)' : 'var(--gray)', fontFamily: '"Archivo Black", sans-serif' }}>
                                                {company.nb_contacts}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {total > 50 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px', borderTop: '1px solid var(--border)' }}>
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page <= 1}
                            className="btn btn-ghost"
                            style={{ fontSize: '13px' }}
                        >
                            ← Précédent
                        </button>
                        <span style={{ fontSize: '13px', color: 'var(--gray)', display: 'flex', alignItems: 'center' }}>
                            Page {page} / {Math.ceil(total / 50)}
                        </span>
                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={page >= Math.ceil(total / 50)}
                            className="btn btn-ghost"
                            style={{ fontSize: '13px' }}
                        >
                            Suivant →
                        </button>
                    </div>
                )}
            </div>

            {/* Import Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(45,40,48,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
                    <div className="card" style={{ maxWidth: '450px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                        <h3 className="page-title" style={{ fontSize: '22px', marginBottom: '8px' }}>Importer un fichier SIRENE</h3>
                        <p style={{ color: 'var(--gray)', fontSize: '13px', marginBottom: '24px' }}>
                            Sélectionnez un fichier CSV contenant les données SIRENE pour enrichir votre base.
                        </p>

                        <div style={{ border: '2px dashed var(--border)', borderRadius: '10px', padding: '32px', textAlign: 'center', transition: 'background-color 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-2)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} id="file-upload" />
                            <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                {isImporting ? (
                                    <Loader2 className="animate-spin" size={32} style={{ color: 'var(--pink)' }} />
                                ) : (
                                    <Upload size={32} style={{ color: 'var(--gray)', opacity: 0.5 }} />
                                )}
                                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--pink)' }}>
                                    {isImporting ? "Importation en cours..." : "Cliquez pour uploader"}
                                </span>
                                <span style={{ fontSize: '12px', color: 'var(--gray)' }}>Format CSV uniquement</span>
                            </label>
                        </div>

                        <button onClick={() => setShowModal(false)} disabled={isImporting} className="btn btn-ghost w-full" style={{ marginTop: '24px', justifyContent: 'center' }}>
                            Annuler
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CompaniesPage
