import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
    Users,
    Send,
    Search,
    Filter,
    Download,
    Trash2,
    MinusCircle,
    ChevronDown,
    X
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

const statusColors = {
    new: 'bg-[#FDFCFB] text-[#8B837E] border-[#E8E4DF]',
    contacted: 'bg-[#F5395A]/5 text-[#F5395A] border-[#F5395A]/10',
    replied: 'bg-[#34D399]/5 text-[#059669] border-[#34D399]/10',
    unsubscribed: 'bg-[#8B837E]/5 text-[#6B6560] border-[#8B837E]/10'
}

const statusLabels = {
    new: 'Nouveau',
    contacted: 'Contacté',
    replied: 'Répondu',
    unsubscribed: 'Désinscrit'
}

const ContactsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [contacts, setContacts] = useState([])
    const [campaigns, setCampaigns] = useState([])
    const [selectedIds, setSelectedIds] = useState([])
    const [loading, setLoading] = useState(true)

    // Filters
    const [filters, setFilters] = useState({
        campaign_id: searchParams.get('campaign') || '',
        status: '',
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
        if (selectedIds.length === contacts.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(contacts.map(c => c.id))
        }
    }

    const handleBulkDelete = async () => {
        if (!window.confirm(`Supprimer ${selectedIds.length} contacts ?`)) return
        try {
            await axios.delete('/api/v1/prospection/contacts/bulk', { data: selectedIds })
            setSelectedIds([])
            fetchData()
        } catch (err) {
            console.error(err)
        }
    }

    const exportCSV = () => {
        const selectedContacts = contacts.filter(c => selectedIds.includes(c.id))
        const headers = ["Nom", "Prenom", "Email", "Poste", "Societe", "Statut"]
        const rows = selectedContacts.map(c => [
            c.last_name,
            c.first_name,
            c.email,
            c.job_title || '',
            c.company?.name || '',
            c.status
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500 font-poppins">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-archivo font-black text-[#2D2830] tracking-tight uppercase">Contacts</h1>
                    <p className="text-[#8B837E] font-medium text-sm mt-1">Gérez votre base de prospects enrichis.</p>
                </div>

                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-3 animate-in slide-in-from-right-4">
                        <span className="text-xs font-bold text-[#F5395A] uppercase border-r border-[#E8E4DF] pr-4 mr-1">
                            {selectedIds.length} sélectionnés
                        </span>
                        <button
                            onClick={exportCSV}
                            className="p-3 bg-white border border-[#E8E4DF] text-[#6B6560] rounded-2xl hover:bg-[#FAF9F6] transition-all shadow-sm flex items-center gap-2 text-xs font-bold uppercase"
                        >
                            <Download size={16} />
                            Exporter
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="p-3 bg-white border border-[#E8E4DF] text-[#F5395A] rounded-2xl hover:bg-[#F5395A]/5 transition-all shadow-sm flex items-center gap-2 text-xs font-bold uppercase"
                        >
                            <Trash2 size={16} />
                            Supprimer
                        </button>
                    </div>
                )}
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-3xl border border-[#E8E4DF] shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="relative group col-span-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B837E] group-focus-within:text-[#F5395A] transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher par nom, email, société..."
                        className="w-full bg-[#FAF9F6] border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#F5395A]/20 transition-all outline-none"
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                </div>

                <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B837E]" size={16} />
                    <select
                        className="w-full bg-[#FAF9F6] border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium appearance-none outline-none focus:ring-2 focus:ring-[#F5395A]/20"
                        value={filters.campaign_id}
                        onChange={(e) => setFilters({ ...filters, campaign_id: e.target.value })}
                    >
                        <option value="">Toutes les campagnes</option>
                        {campaigns.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B837E] pointer-events-none" size={16} />
                </div>

                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#8B837E]"></div>
                    <select
                        className="w-full bg-[#FAF9F6] border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium appearance-none outline-none focus:ring-2 focus:ring-[#F5395A]/20"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="">Tous les statuts</option>
                        {Object.entries(statusLabels).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B837E] pointer-events-none" size={16} />
                </div>
            </div>

            {/* Contacts Table */}
            <div className="bg-white rounded-3xl border border-[#E8E4DF] shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-[#FAF9F6] border-b border-[#E8E4DF]">
                        <tr>
                            <th className="px-6 py-4 w-12 text-center">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length === filteredContacts.length && filteredContacts.length > 0}
                                    onChange={toggleAll}
                                    className="accent-[#F5395A] w-4 h-4"
                                />
                            </th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[#8B837E] uppercase tracking-widest">Prospect</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[#8B837E] uppercase tracking-widest">Société & Rôle</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[#8B837E] uppercase tracking-widest">Campagne</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[#8B837E] uppercase tracking-widest text-center">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EDE9]">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-[#8B837E] italic">Chargement...</td>
                            </tr>
                        ) : filteredContacts.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-[#8B837E] italic text-sm">
                                    Aucun contact trouvé.
                                </td>
                            </tr>
                        ) : (
                            filteredContacts.map(contact => (
                                <tr key={contact.id} className="hover:bg-[#FAF9F6] transition-colors group">
                                    <td className="px-6 py-4 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(contact.id)}
                                            onChange={() => toggleSelection(contact.id)}
                                            className="accent-[#F5395A] w-4 h-4"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-[#2D2830]">{contact.first_name} {contact.last_name}</div>
                                        <div className="text-xs text-[#8B837E]">{contact.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-[#2D2830]">{contact.company?.name || 'Inconnue'}</div>
                                        <div className="text-[10px] text-[#8B837E] font-bold uppercase">{contact.job_title || 'Non spécifié'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {contact.campaign ? (
                                            <span className="text-xs font-medium text-[#6B6560] bg-[#FAF9F6] px-2 py-1 rounded-lg border border-[#E8E4DF]">
                                                {contact.campaign.name}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-[#8B837E] italic">Import manuel</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${statusColors[contact.status]}`}>
                                            {statusLabels[contact.status]}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default ContactsPage
