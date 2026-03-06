import React, { useState } from 'react'
import { Plus, Edit2, Copy, Trash2, Mail } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import TemplateEditorModal from '../../components/prospection/TemplateEditorModal'

// Need to set up axios base url if not already done in the context
const api = axios.create({
    baseURL: '/api/v1'
})

export default function TemplatesPage() {
    const queryClient = useQueryClient()
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState(null)

    // Fetch Templates
    const { data: templates = [], isLoading } = useQuery({
        queryKey: ['templates'],
        queryFn: async () => {
            const res = await api.get('/prospection/templates')
            return res.data
        }
    })

    // Delete Template Mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/prospection/templates/${id}`),
        onSuccess: () => queryClient.invalidateQueries(['templates'])
    })

    // Duplicate Template Mutation
    const duplicateMutation = useMutation({
        mutationFn: (id) => api.post(`/prospection/templates/${id}/duplicate`),
        onSuccess: () => queryClient.invalidateQueries(['templates'])
    })

    const handleCreateNew = () => {
        setEditingTemplate(null)
        setIsEditorOpen(true)
    }

    const handleEdit = (template) => {
        setEditingTemplate(template)
        setIsEditorOpen(true)
    }

    if (isLoading) return <div style={{ fontFamily: 'Poppins, sans-serif' }}>Chargement...</div>

    return (
        <div style={{ fontFamily: 'Poppins, sans-serif' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#2D2830', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                        Templates d'Emails
                    </h1>
                    <p style={{ color: '#6B6560', fontSize: '14px' }}>
                        Créez et gérez vos modèles de prospection enrichis.
                    </p>
                </div>

                <button
                    onClick={handleCreateNew}
                    style={{
                        backgroundColor: '#F5395A',
                        color: '#FFF',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'opacity 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                    <Plus size={16} />
                    Nouveau Template
                </button>
            </div>

            {/* Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '24px'
            }}>
                {templates.map(template => (
                    <div key={template.id} style={{
                        border: '1px solid #E8E4DF',
                        borderRadius: '12px',
                        padding: '24px',
                        backgroundColor: '#FFFFFF',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <span style={{
                                    display: 'inline-block',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: '#F5395A',
                                    backgroundColor: 'rgba(245, 57, 90, 0.1)',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    marginBottom: '8px'
                                }}>
                                    {template.category}
                                </span>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#2D2830', margin: 0 }}>
                                    {template.name}
                                </h3>
                                <p style={{ fontSize: '13px', color: '#6B6560', marginTop: '4px' }}>
                                    {template.subject}
                                </p>
                            </div>
                        </div>

                        <div style={{
                            flex: 1,
                            backgroundColor: '#F9F8F6',
                            borderRadius: '8px',
                            padding: '12px',
                            fontSize: '12px',
                            color: '#6B6560',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical'
                        }}>
                            {/* Safe strip HTML tags for grid preview */}
                            {template.html_content.replace(/<[^>]+>/g, '') || "Aucun contenu..."}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #E8E4DF', paddingTop: '16px' }}>
                            <button onClick={() => handleEdit(template)} style={iconBtnStyle} title="Éditer">
                                <Edit2 size={16} />
                            </button>
                            <button onClick={() => duplicateMutation.mutate(template.id)} style={iconBtnStyle} title="Dupliquer">
                                <Copy size={16} />
                            </button>
                            <button onClick={() => { if (window.confirm('Supprimer ce template ?')) deleteMutation.mutate(template.id) }} style={{ ...iconBtnStyle, color: '#E11D48' }} title="Supprimer">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Fullscreen Editor Modal rendered when open */}
            {isEditorOpen && (
                <TemplateEditorModal
                    template={editingTemplate}
                    onClose={() => setIsEditorOpen(false)}
                />
            )}
        </div>
    )
}

const iconBtnStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#6B6560',
    padding: '8px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease'
}
