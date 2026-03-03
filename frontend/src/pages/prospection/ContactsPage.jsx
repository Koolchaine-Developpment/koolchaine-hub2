import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Users, Send, Search } from 'lucide-react'

const statusColors = {
    new: 'bg-brand-bg text-brand-text-secondary border-brand-border',
    contacted: 'bg-accent-blue/10 text-accent-blue border-accent-blue/20',
    replied: 'bg-accent-green/10 text-accent-green border-accent-green/20',
    unsubscribed: 'bg-accent-pink/10 text-accent-pink border-accent-pink/20'
}

const statusLabels = {
    new: 'Nouveau',
    contacted: 'Contacté',
    replied: 'Répondu',
    unsubscribed: 'Désinscrit'
}

const ContactsPage = () => {
    const [contacts, setContacts] = useState([])
    const [selectedIds, setSelectedIds] = useState([])

    const fetchContacts = async () => {
        try {
            const res = await axios.get('/api/v1/prospection/contacts', { withCredentials: true })
            setContacts(res.data)
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        fetchContacts()
    }, [])

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

    return (
        <div className="bg-brand-surface rounded-[10px] shadow-sm border border-brand-border overflow-hidden flex flex-col h-full animate-fade-in font-sans">
            <div className="p-6 border-b border-brand-border flex justify-between items-center bg-brand-surface">
                <h3 className="text-lg font-heading text-brand-dark flex items-center gap-2">
                    <Users size={20} className="text-brand-text-secondary" />
                    Base Contacts
                </h3>
                {selectedIds.length > 0 && (
                    <button className="bg-accent-pink hover:bg-accent-pink/90 text-white px-4 py-2 rounded-[6px] text-sm font-sans font-medium transition-all active:scale-[0.98] flex items-center gap-2">
                        <Send size={16} />
                        Lancer {selectedIds.length} contact(s)
                    </button>
                )}
            </div>

            <div className="overflow-x-auto flex-1 bg-brand-surface">
                <table className="w-full text-sm text-left font-sans">
                    <thead className="bg-brand-bg text-brand-text-secondary font-medium border-b border-brand-border sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-4 w-12 text-center border-l-[3px] border-transparent">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length === contacts.length && contacts.length > 0}
                                    onChange={toggleAll}
                                    className="rounded border-brand-border text-accent-pink focus:ring-accent-pink bg-brand-surface"
                                />
                            </th>
                            <th className="px-6 py-4">Nom</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Rôle</th>
                            <th className="px-6 py-4 text-center">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border bg-brand-surface">
                        {contacts.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-brand-text-secondary italic">
                                    Aucun contact. Enrichissez des sociétés pour obtenir des contacts.
                                </td>
                            </tr>
                        ) : (
                            contacts.map(contact => (
                                <tr key={contact.id} className="hover:bg-brand-bg transition-colors">
                                    <td className="px-6 py-4 text-center border-l-[3px] border-transparent hover:border-accent-pink">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(contact.id)}
                                            onChange={() => toggleSelection(contact.id)}
                                            className="rounded border-brand-border text-accent-pink focus:ring-accent-pink bg-brand-surface"
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-medium text-brand-text-primary">
                                        {contact.first_name} {contact.last_name}
                                    </td>
                                    <td className="px-6 py-4 text-brand-text-secondary">{contact.email}</td>
                                    <td className="px-6 py-4 text-brand-text-secondary">{contact.job_title || 'Non spécifié'}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1.5 text-xs font-semibold font-sans rounded-full border ${statusColors[contact.status]}`}>
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
