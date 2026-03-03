import React, { useState, useEffect, useRef } from 'react'
import { X, Save, Eye, Smartphone, Monitor } from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost/api/v1',
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

export default function TemplateEditorModal({ template, onClose }) {
    const queryClient = useQueryClient()
    const [name, setName] = useState(template?.name || '')
    const [subject, setSubject] = useState(template?.subject || '')
    const [category, setCategory] = useState(template?.category || 'Introduction')
    const [previewMode, setPreviewMode] = useState('desktop') // 'desktop' or 'mobile'
    const [liveHtml, setLiveHtml] = useState(template?.html_content || '')
    const [isSaving, setIsSaving] = useState(false)

    // TipTap Editor instance
    const editor = useEditor({
        extensions: [
            StarterKit,
            TextStyle,
            Color,
            Image,
            Link.configure({ openOnClick: false }),
        ],
        content: template?.html_content || '<p>Bonjour {{prenom}},</p>',
        onUpdate: ({ editor }) => {
            setLiveHtml(editor.getHTML())
        },
    })

    const saveMutation = useMutation({
        mutationFn: async (data) => {
            if (template?.id) {
                return api.put(`/prospection/templates/${template.id}`, data)
            }
            return api.post('/prospection/templates', data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['templates'])
            onClose()
        }
    })

    const handleSave = () => {
        setIsSaving(true)
        saveMutation.mutate({
            name,
            category,
            subject,
            html_content: editor.getHTML(),
            placeholders: ['prenom', 'entreprise', 'produit'], // Static for now
            has_signature: false,
        }, {
            onSettled: () => setIsSaving(false)
        })
    }

    const insertVariable = (variable) => {
        if (editor) {
            editor.chain().focus().insertContent(`{{${variable}}}`).run()
        }
    }

    // A simple mock for resolving variables in preview (Frontend only representation)
    const resolvePreview = (html) => {
        return html
            .replace(/\{\{prenom\}\}/g, '<span style="background-color: #FEE2E2; padding: 2px 4px; border-radius: 4px; color: #DC2626;">Jean</span>')
            .replace(/\{\{entreprise\}\}/g, '<span style="background-color: #DBEAFE; padding: 2px 4px; border-radius: 4px; color: #2563EB;">Koolchaine Inc.</span>')
            .replace(/\{\{produit\}\}/g, '<span style="background-color: #D1FAE5; padding: 2px 4px; border-radius: 4px; color: #059669;">Cool Cordes</span>')
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', flexDirection: 'column',
            fontFamily: 'Poppins, sans-serif'
        }}>
            <div style={{
                backgroundColor: '#FFF', flex: 1, margin: '24px',
                borderRadius: '12px', display: 'flex', flexDirection: 'column',
                overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>

                {/* Header Navbar */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 24px', borderBottom: '1px solid #E8E4DF'
                }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#2D2830' }}>
                            {template ? 'Éditer Template' : 'Nouveau Template'}
                        </h2>

                        <input
                            value={name} onChange={e => setName(e.target.value)}
                            placeholder="Nom du template..."
                            style={inputStyle}
                        />
                        <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
                            <option>Introduction</option>
                            <option>Relance</option>
                            <option>Dernière tentative</option>
                            <option>Custom</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={onClose} style={cancelBtnStyle}>
                            <X size={18} /> Annuler
                        </button>
                        <button onClick={handleSave} disabled={isSaving} style={saveBtnStyle}>
                            <Save size={18} /> {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </div>

                {/* Main 2-Panel Area */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                    {/* LEFT: Editor Panel */}
                    <div style={{ flex: 1, borderRight: '1px solid #E8E4DF', display: 'flex', flexDirection: 'column', backgroundColor: '#FAFAFA' }}>

                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #E8E4DF', backgroundColor: '#FFF' }}>
                            <label style={{ fontSize: '13px', fontWeight: 500, color: '#6B6560', marginBottom: '8px', display: 'block' }}>Objet de l'email</label>
                            <input
                                value={subject} onChange={e => setSubject(e.target.value)}
                                style={{ ...inputStyle, width: '100%', fontSize: '15px' }}
                                placeholder="ex: {{prenom}}, on collabore ?"
                            />
                        </div>

                        {/* Formatting Toolbar */}
                        {editor && (
                            <div style={{ display: 'flex', gap: '8px', padding: '12px 24px', borderBottom: '1px solid #E8E4DF', backgroundColor: '#FFF', flexWrap: 'wrap' }}>
                                <button onClick={() => editor.chain().focus().toggleBold().run()} style={getToolbarBtnStyle(editor.isActive('bold'))}>Gras</button>
                                <button onClick={() => editor.chain().focus().toggleItalic().run()} style={getToolbarBtnStyle(editor.isActive('italic'))}>Italique</button>
                                <span style={{ width: '1px', backgroundColor: '#E8E4DF', margin: '0 4px' }} />
                                <button onClick={() => insertVariable('prenom')} style={variableBtnStyle}>+ {'{{prenom}}'}</button>
                                <button onClick={() => insertVariable('entreprise')} style={variableBtnStyle}>+ {'{{entreprise}}'}</button>
                                <button onClick={() => insertVariable('produit')} style={variableBtnStyle}>+ {'{{produit}}'}</button>
                            </div>
                        )}

                        {/* Actual TipTap Editor */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', cursor: 'text' }} onClick={() => editor?.commands.focus()}>
                            <EditorContent editor={editor} style={{ minHeight: '100%', outline: 'none' }} className="ProseMirror" />
                        </div>
                    </div>


                    {/* RIGHT: Live Preview Panel */}
                    <div style={{ flex: 1, backgroundColor: '#F3F4F6', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                        {/* Preview Topbar */}
                        <div style={{ width: '100%', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', borderBottom: '1px solid #E8E4DF' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6B6560', fontWeight: 500 }}>
                                <Eye size={16} /> Prévisualisation Live
                            </div>

                            <div style={{ display: 'flex', backgroundColor: '#F3F4F6', borderRadius: '6px', padding: '2px' }}>
                                <button onClick={() => setPreviewMode('desktop')} style={getToggleStyle(previewMode === 'desktop')}><Monitor size={15} /> PC</button>
                                <button onClick={() => setPreviewMode('mobile')} style={getToggleStyle(previewMode === 'mobile')}><Smartphone size={15} /> Mobile</button>
                            </div>
                        </div>

                        {/* Rendering Canvas */}
                        <div style={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center', padding: '24px', overflowY: 'auto' }}>
                            <div style={{
                                width: previewMode === 'mobile' ? '375px' : '100%',
                                maxWidth: '800px',
                                backgroundColor: '#FFF',
                                borderRadius: '8px',
                                padding: '32px',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                transition: 'width 0.3s ease',
                                border: '1px solid #E5E7EB',
                                fontSize: '15px', color: '#374151', lineHeight: '1.6'
                            }}>
                                <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: '16px', marginBottom: '24px' }}>
                                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>Objet</div>
                                    <div style={{ fontWeight: 600, color: '#111827', fontSize: '16px' }} dangerouslySetInnerHTML={{ __html: resolvePreview(subject || '(Sans objet)') }} />
                                </div>

                                <div dangerouslySetInnerHTML={{ __html: resolvePreview(liveHtml) }} />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            {/* Global styles for TipTap */}
            <style>{`
                .ProseMirror { outline: none; font-size: 15px; line-height: 1.6; color: #2D2830; }
                .ProseMirror p { margin-bottom: 1em; }
                .ProseMirror a { color: #2563EB; text-decoration: underline; }
            `}</style>
        </div>
    )
}

// Sub-component styles
const inputStyle = {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #E8E4DF',
    fontSize: '14px',
    outline: 'none'
}
const cancelBtnStyle = {
    ...inputStyle, backgroundColor: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
}
const saveBtnStyle = {
    ...inputStyle, backgroundColor: '#F5395A', color: '#FFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500
}
const getToolbarBtnStyle = (isActive) => ({
    padding: '6px 12px', borderRadius: '4px', border: 'none', fontSize: '13px', cursor: 'pointer',
    backgroundColor: isActive ? '#F3F4F6' : '#FFF',
    color: isActive ? '#2D2830' : '#6B6560',
    fontWeight: isActive ? 600 : 400
})
const variableBtnStyle = {
    padding: '4px 8px', borderRadius: '4px', border: '1px dashed #D1D5DB', fontSize: '12px', cursor: 'pointer',
    backgroundColor: '#F9FAFB', color: '#4B5563', fontFamily: 'monospace'
}
const getToggleStyle = (isActive) => ({
    padding: '6px 12px', borderRadius: '4px', border: 'none', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
    backgroundColor: isActive ? '#FFF' : 'transparent',
    color: isActive ? '#2D2830' : '#6B6560',
    boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
})
