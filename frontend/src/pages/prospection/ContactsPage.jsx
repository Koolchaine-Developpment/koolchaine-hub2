import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
    Users, Send, Search, Filter, Download, Trash2,
    CheckCircle, XCircle, Edit3, ChevronLeft, ChevronRight,
    Zap, Mail, Globe, Cpu, HelpCircle, X
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { apiFetch } from '../../lib/api'

const statusColors = {
    new: 'badge badge-dark',
    a_valider: 'badge badge-yellow',
    valide: 'badge badge-green',
    contacted: 'badge badge-blue',
    envoye: 'badge badge-blue',
    replied: 'badge badge-green',
    rejete: 'badge badge-dark',
    unsubscribed: 'badge badge-dark'
}

const statusLabels = {
    new: 'Nouveau',
    a_valider: 'À valider',
    valide: 'Validé',
    contacted: 'Contacté',
    envoye: 'Envoyé',
    replied: 'Répondu',
    rejete: 'Rejeté',
    unsubscribed: 'Désinscrit'
}

const sourceIcons = {
    web: <Globe size={12} />,
    pattern: <Cpu size={12} />,
    smtp: <Mail size={12} />,
    google: <Search size={12} />,
}

const ContactsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [contacts, setContacts] = useState([])
    const [campaigns, setCampaigns] = useState([])
    const [selectedIds, setSelectedIds] = useState([])
    const [loading, setLoading] = useState(true)
    const [batchMode, setBatchMode] = useState(false)
    const [batchIndex, setBatchIndex] = useState(0)
    const [editingEmail, setEditingEmail] = useState(null)
    const [editEmailText, setEditEmailText] = useState('')

    const [filters, setFilters] = useState({
        campaign_id: searchParams.get('campaign') || '',
        status: searchParams.get('status') || '',
        search: ''
    })

    const fetchData = async () => {
        setLoading(true)
        try {
            const [contactsRes, campaignsRes] = await Promise.all([
                axios.get('/api/v1/prospection/contacts', {
                    params: {
                        campaign_id: filters.campaign_id || undefined,
                        status: filters.status || undefined
                    }
                }),
                axios.get('/api/v1/prospection/campaigns')
            ])
            setContacts(contactsRes.data)
            setCampaigns(campaignsRes.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [filters.campaign_id, filters.status])

    const toggleSelection = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const toggleAll = () => {
        if (selectedIds.length === filteredContacts.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredContacts.map(c => c.id))
        }
    }

    const handleBulkDelete = async () => {
        if (!window.confirm(`Supprimer ${selectedIds.length} contacts ?`)) return
        try {
            await axios.delete('/api/v1/prospection/contacts/bulk', {
                data: selectedIds
            })
            setSelectedIds([])
            fetchData()
        } catch (err) {
            console.error(err)
        }
    }

    const handleValider = async (id) => {
        try {
            await apiFetch(`/api/v1/prospection/contacts/${id}/valider`, { method: 'PATCH' })
            fetchData()
        } catch (err) { console.error(err) }
    }

    const handleRejeter = async (id) => {
        try {
            await apiFetch(`/api/v1/prospection/contacts/${id}/rejeter`, { method: 'PATCH' })
            fetchData()
        } catch (err) { console.error(err) }
    }

    const handleSaveEmail = async (id) => {
        try {
            await apiFetch(`/api/v1/prospection/contacts/${id}/email`, {
                method: 'PATCH',
                body: JSON.stringify({ email_genere: editEmailText }),
            })
            setEditingEmail(null)
            fetchData()
        } catch (err) { console.error(err) }
    }

    const handleBatchValidateAll = async () => {
        const aValiderIds = batchContacts.map(c => c.id)
        try {
            await apiFetch('/api/v1/prospection/contacts/valider-batch', {
                method: 'POST',
                body: JSON.stringify({ contact_ids: aValiderIds }),
            })
            setBatchMode(false)
            fetchData()
        } catch (err) { console.error(err) }
    }

    const exportCSV = () => {
        const selectedContacts = contacts.filter(c => selectedIds.includes(c.id))
        const headers = ["Nom", "Prenom", "Email", "Poste", "Societe", "Score", "Statut"]
        const rows = selectedContacts.map(c => [
            c.last_name, c.first_name, c.email, c.job_title || '',
            c.company?.name || '', c.score_pertinence || 0, c.status
        ])
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `contacts_export_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
    }

    const filteredContacts = contacts.filter(c =>
        `${c.first_name} ${c.last_name} ${c.email} ${c.company?.name || ''}`.toLowerCase().includes(filters.search.toLowerCase())
    )

    const batchContacts = filteredContacts.filter(c => c.status === 'a_valider')

    const getScoreBadge = (score) => {
        if (score >= 70) return <span className="badge badge-green" style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '11px' }}>{score}</span>
        if (score >= 30) return <span className="badge badge-yellow" style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '11px' }}>{score}</span>
        return <span className="badge badge-dark" style={{ fontFamily: '"Archivo Black", sans-serif', fontSize: '11px', opacity: 0.5 }}>{score}</span>
    }

    // BATCH MODE VIEW
    if (batchMode && batchContacts.length > 0) {
        const current = batchContacts[batchIndex]
        if (!current) {
            setBatchMode(false)
            return null
        }
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="page-title">Validation Batch</h1>
                        <p className="page-subtitle">{batchIndex + 1} / {batchContacts.length} contacts</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setBatchMode(false)} className="btn btn-ghost"><X size={16} /> Quitter</button>
                        <button onClick={handleBatchValidateAll} className="btn btn-pink">Tout valider ({batchContacts.length})</button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="progress-track" style={{ height: '6px' }}>
                    <div style={{
                        height: '100%',
                        width: `${((batchIndex + 1) / batchContacts.length) * 100}%`,
                        background: 'var(--pink)',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease',
                    }} />
                </div>

                <div className="card" style={{ padding: '32px' }}>
                    {/* Contact info */}
                    <div className="flex items-center gap-4 mb-6">
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, var(--pink), var(--blue))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 700, fontSize: '16px',
                        }}>
                            {current.first_name?.[0]}{current.last_name?.[0]}
                        </div>
                        <div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--dark)' }}>
                                {current.first_name} {current.last_name}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--gray)' }}>
                                {current.company?.name || 'Société inconnue'} · {current.job_title || 'Poste non spécifié'}
                            </div>
                        </div>
                        <div style={{ marginLeft: 'auto' }}>
                            {getScoreBadge(current.score_pertinence || 0)}
                        </div>
                    </div>

                    {/* Email & source */}
                    <div className="flex gap-4 mb-6" style={{ fontSize: '13px' }}>
                        <div>
                            <span style={{ color: 'var(--gray)', fontWeight: 600 }}>Email : </span>
                            <span style={{ color: 'var(--dark)' }}>{current.email || '—'}</span>
                        </div>
                        {current.email_source && (
                            <div className="flex items-center gap-1">
                                <span style={{ color: 'var(--gray)', fontWeight: 600 }}>Source : </span>
                                <span className="badge badge-dark" style={{ fontSize: '10px' }}>
                                    {sourceIcons[current.email_source]} {current.email_source}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Generated email */}
                    {current.email_genere && (
                        <div style={{
                            background: 'var(--surface-2)',
                            borderRadius: '12px',
                            padding: '20px',
                            marginBottom: '24px',
                            border: '1px solid var(--border)',
                        }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '12px' }}>
                                Email généré par Claude
                            </div>
                            <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--dark)', whiteSpace: 'pre-wrap' }}>
                                {current.email_genere}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                handleValider(current.id)
                                setBatchIndex(Math.min(batchIndex + 1, batchContacts.length - 1))
                            }}
                            className="btn btn-pink" style={{ flex: 1 }}
                        >
                            <CheckCircle size={16} /> Valider
                        </button>
                        <button
                            onClick={() => {
                                handleRejeter(current.id)
                                setBatchIndex(Math.min(batchIndex + 1, batchContacts.length - 1))
                            }}
                            className="btn btn-ghost" style={{ flex: 1 }}
                        >
                            <XCircle size={16} /> Rejeter
                        </button>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                        <button
                            onClick={() => setBatchIndex(Math.max(0, batchIndex - 1))}
                            disabled={batchIndex === 0}
                            className="btn btn-ghost"
                        >
                            <ChevronLeft size={16} /> Précédent
                        </button>
                        <button
                            onClick={() => setBatchIndex(Math.min(batchContacts.length - 1, batchIndex + 1))}
                            disabled={batchIndex >= batchContacts.length - 1}
                            className="btn btn-ghost"
                        >
                            Suivant <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // NORMAL LIST VIEW
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="page-title">Contacts</h1>
                    <p className="page-subtitle">Gérez votre base de prospects enrichis.</p>
                </div>

                <div className="flex items-center gap-3">
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-3 animate-fade-in">
                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--pink)', textTransform: 'uppercase', borderRight: '1px solid var(--border)', paddingRight: '16px' }}>
                                {selectedIds.length} sélectionnés
                            </span>
                            <button onClick={exportCSV} className="btn btn-ghost">
                                <Download size={16} /> Exporter
                            </button>
                            <button onClick={handleBulkDelete} className="btn btn-pink">
                                <Trash2 size={16} /> Supprimer
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Validation bandeau */}
            {batchContacts.length > 0 && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(255,184,0,0.12), rgba(255,184,0,0.05))',
                    border: '1px solid rgba(255,184,0,0.3)',
                    padding: '14px 24px',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <div className="flex items-center gap-3">
                        <Zap size={18} style={{ color: 'var(--pink)' }} />
                        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--dark)' }}>
                            {batchContacts.length} contacts en attente de validation
                        </span>
                    </div>
                    <button onClick={() => { setBatchMode(true); setBatchIndex(0) }} className="btn btn-pink" style={{ fontSize: '13px' }}>
                        Valider en batch →
                    </button>
                </div>
            )}

            {/* Filters Bar */}
            <div className="card bento-3 items-center" style={{ padding: '16px 20px' }}>
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--gray)' }} />
                    <input
                        type="text"
                        placeholder="Rechercher par nom, email, société..."
                        className="w-full"
                        style={{ paddingLeft: '36px' }}
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                </div>
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <select
                            className="w-full"
                            value={filters.campaign_id}
                            onChange={(e) => setFilters({ ...filters, campaign_id: e.target.value })}
                        >
                            <option value="">Toutes les campagnes</option>
                            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="relative flex-1">
                        <select
                            className="w-full"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="">Tous les statuts</option>
                            {Object.entries(statusLabels).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Contacts Table */}
            <div className="card" style={{ padding: 0 }}>
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '40px', textAlign: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length === filteredContacts.length && filteredContacts.length > 0}
                                    onChange={toggleAll}
                                />
                            </th>
                            <th>Prospect</th>
                            <th>Société & Rôle</th>
                            <th style={{ textAlign: 'center' }}>Score</th>
                            <th>Email</th>
                            <th style={{ textAlign: 'center' }}>Statut</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--gray)', fontStyle: 'italic', padding: '48px 0' }}>Chargement...</td>
                            </tr>
                        ) : filteredContacts.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--gray)', fontStyle: 'italic', padding: '48px 0' }}>
                                    Aucun contact trouvé.
                                </td>
                            </tr>
                        ) : (
                            filteredContacts.map(contact => (
                                <tr key={contact.id}>
                                    <td style={{ textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(contact.id)}
                                            onChange={() => toggleSelection(contact.id)}
                                        />
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600, color: 'var(--dark)' }}>{contact.first_name} {contact.last_name}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--dark)' }}>{contact.company?.name || 'Inconnue'}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--gray)', fontWeight: 600, textTransform: 'uppercase' }}>{contact.job_title || 'Non spécifié'}</div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {getScoreBadge(contact.score_pertinence || 0)}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '11px', color: 'var(--gray)' }}>{contact.email || '—'}</div>
                                        {contact.email_source && (
                                            <span className="badge badge-dark" style={{ fontSize: '9px', padding: '2px 6px', marginTop: '2px', display: 'inline-flex', gap: '3px' }}>
                                                {sourceIcons[contact.email_source]} {contact.email_source}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className={statusColors[contact.status] || 'badge badge-dark'}>
                                            {statusLabels[contact.status] || contact.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div className="flex justify-center gap-1">
                                            {(contact.status === 'a_valider' || contact.status === 'new') && (
                                                <>
                                                    <button onClick={() => handleValider(contact.id)} className="btn btn-ghost" style={{ padding: '4px 8px' }} title="Valider">
                                                        <CheckCircle size={14} style={{ color: 'var(--green)' }} />
                                                    </button>
                                                    <button onClick={() => handleRejeter(contact.id)} className="btn btn-ghost" style={{ padding: '4px 8px' }} title="Rejeter">
                                                        <XCircle size={14} style={{ color: 'var(--pink)' }} />
                                                    </button>
                                                </>
                                            )}
                                            {contact.email_genere && (
                                                <button
                                                    onClick={() => {
                                                        setEditingEmail(contact.id)
                                                        setEditEmailText(contact.email_genere)
                                                    }}
                                                    className="btn btn-ghost" style={{ padding: '4px 8px' }} title="Voir/Modifier l'email"
                                                >
                                                    <Edit3 size={14} style={{ color: 'var(--blue)' }} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Email Edit Modal */}
            {editingEmail && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(45,40,48,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
                    <div className="card" style={{ maxWidth: '600px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="section-title" style={{ margin: 0 }}>Email généré</h3>
                            <button onClick={() => setEditingEmail(null)} className="btn btn-ghost" style={{ padding: '4px' }}>
                                <X size={18} />
                            </button>
                        </div>
                        <textarea
                            value={editEmailText}
                            onChange={(e) => setEditEmailText(e.target.value)}
                            style={{
                                width: '100%', minHeight: '250px', padding: '16px',
                                borderRadius: '10px', border: '1px solid var(--border)',
                                fontSize: '14px', lineHeight: 1.6, resize: 'vertical',
                                fontFamily: 'inherit',
                            }}
                        />
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => handleSaveEmail(editingEmail)} className="btn btn-pink" style={{ flex: 1 }}>
                                Sauvegarder
                            </button>
                            <button onClick={() => setEditingEmail(null)} className="btn btn-ghost" style={{ flex: 1 }}>
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ContactsPage
