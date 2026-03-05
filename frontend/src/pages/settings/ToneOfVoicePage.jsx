import React, { useState, useEffect } from 'react'
import { apiFetch } from '../../lib/api'

const PERSONAS = [
    { value: 'koolchaine', label: 'Koolchaine', desc: 'Ateliers B2B, corporate, EHPAD, hôtels' },
    { value: 'koolcorde', label: 'Koolcorde', desc: 'Cool Cordes, B2C, vente en ligne' }
]

export default function ToneOfVoicePage() {
    const [activePersona, setActivePersona] = useState('koolchaine')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [config, setConfig] = useState({
        koolchaine: {
            brand_identity: '',
            words_to_use: [],
            words_forbidden: [],
            style_references: [],
            topics_to_avoid: [],
            default_tone: 'inspirant',
            default_length: 'moyen',
            default_emojis: 'subtil',
            default_hashtag_count: 15,
            default_language: 'fr'
        },
        koolcorde: {
            brand_identity: '',
            words_to_use: [],
            words_forbidden: [],
            style_references: [],
            topics_to_avoid: [],
            default_tone: 'chaleureux',
            default_length: 'court',
            default_emojis: 'expressif',
            default_hashtag_count: 20,
            default_language: 'fr'
        }
    })

    useEffect(() => {
        // Charger les configs existantes
        ['koolchaine', 'koolcorde'].forEach(async (persona) => {
            try {
                const res = await apiFetch(`/api/v1/social/settings/tone-of-voice/${persona}`)
                if (res.ok) {
                    const data = await res.json()
                    setConfig(prev => ({ ...prev, [persona]: { ...prev[persona], ...data } }))
                }
            } catch (err) {
                console.error(`Error loading ToV for ${persona}:`, err)
            }
        })
    }, [])

    const updateField = (field, value) => {
        setConfig(prev => ({
            ...prev,
            [activePersona]: { ...prev[activePersona], [field]: value }
        }))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const payload = { persona: activePersona, ...config[activePersona] };
            const res = await apiFetch(`/api/v1/social/settings/tone-of-voice`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            })
            if (!res.ok) throw new Error("Failed to save");
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false)
        }
    }

    const c = config[activePersona]

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px' }}>

            <div style={{ marginBottom: '32px' }}>
                <div style={{ fontFamily: 'Archivo Black', fontSize: '24px', color: 'var(--dark)', marginBottom: '8px' }}>
                    Configurateur : Tone of Voice
                </div>
                <div style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: '1.5' }}>
                    Défini le ton, le style linguistique et l'identité de marque pour chaque persona. <br />
                    Ces règles sont automatiquement appliquées de manière impérative à la sandbox via Claude.
                </div>
            </div>

            {/* Sélecteur persona */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                {PERSONAS.map(p => (
                    <div
                        key={p.value}
                        onClick={() => setActivePersona(p.value)}
                        style={{
                            flex: 1, padding: '20px', borderRadius: '12px', cursor: 'pointer',
                            border: activePersona === p.value ? '2px solid var(--pink)' : '1px solid var(--border)',
                            background: activePersona === p.value ? 'white' : '#FAFAFB',
                            boxShadow: activePersona === p.value ? '0 4px 12px rgba(245,57,90,0.1)' : 'none',
                            transition: 'all 150ms'
                        }}
                    >
                        <div style={{ fontFamily: 'Archivo Black', fontSize: '16px', color: activePersona === p.value ? 'var(--pink)' : 'var(--dark)' }}>
                            {p.label}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--gray)', marginTop: '4px' }}>{p.desc}</div>
                    </div>
                ))}
            </div>

            {/* Champs config */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dark)', marginBottom: '12px' }}>Profil identitaire</div>
                    <textarea
                        value={c.brand_identity || ''}
                        onChange={e => updateField('brand_identity', e.target.value)}
                        placeholder="Ex: Nous sommes une marque artisanale française spécialisée dans la création d'objets uniques. Notre ton est proche, complice, tutoiement obligatoire, expertise sans jargon."
                        rows={4}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', fontFamily: 'Inter, sans-serif', resize: 'vertical', lineHeight: '1.6', outline: 'none' }}
                    />
                </div>

                {[
                    { field: 'words_to_use', label: 'Vocabulaire encouragé (mots clés forts)', placeholder: 'atelier, fait-main, artisanat, transmission, équipe...' },
                    { field: 'words_forbidden', label: 'Mots bannis / lexique interdit', placeholder: 'corporate, pas cher, soldes, disruptif...' },
                    { field: 'style_references', label: 'Comptes références l\'inspiration de ton', placeholder: '@marquesimilaire1, @marquesimilaire2' },
                    { field: 'topics_to_avoid', label: 'Sujets tabous (ne jamais aborder)', placeholder: 'politique, concurrence, baisse de prix...' }
                ].map(({ field, label, placeholder }) => (
                    <div key={field} style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dark)', marginBottom: '8px' }}>{label}</div>
                        <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '12px' }}>Séparez les valeurs par des virgules.</div>
                        <input
                            type="text"
                            value={(c[field] || []).join(', ')}
                            onChange={e => updateField(field, e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                            placeholder={placeholder}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', fontFamily: 'Inter, sans-serif', outline: 'none' }}
                        />
                        {c[field] && c[field].length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
                                {c[field].map((w, i) => (
                                    <span key={i} style={{
                                        padding: '4px 10px',
                                        background: field === 'words_forbidden' ? 'rgba(245,57,90,0.1)' : 'var(--surface-2)',
                                        color: field === 'words_forbidden' ? 'var(--pink)' : 'var(--dark)',
                                        fontSize: '12px',
                                        borderRadius: '4px',
                                        fontWeight: 500
                                    }}>
                                        {w}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {/* Defaults */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dark)', marginBottom: '16px' }}>Configuration Sandbox par défaut</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {[
                            { field: 'default_tone', label: 'Ton par défaut', options: ['inspirant', 'professionnel', 'décalé', 'chaleureux', 'éducatif', 'storytelling'] },
                            { field: 'default_length', label: 'Longueur', options: ['court', 'moyen', 'long'] },
                            { field: 'default_emojis', label: 'Densité Emojis', options: ['aucun', 'subtil', 'expressif'] },
                            { field: 'default_language', label: 'Langue cible', options: ['fr', 'en', 'bilingual'] }
                        ].map(({ field, label, options }) => (
                            <div key={field}>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)', marginBottom: '8px' }}>{label}</div>
                                <select
                                    value={c[field] || ''}
                                    onChange={e => updateField(field, e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', fontFamily: 'Inter, sans-serif', outline: 'none', background: 'white', appearance: 'auto' }}
                                >
                                    {options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '20px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Hashtags suggérés automatiquement</span>
                            <span style={{ color: 'var(--pink)' }}>{c.default_hashtag_count}</span>
                        </div>
                        <input
                            type="range" min="0" max="30"
                            value={c.default_hashtag_count || 15}
                            onChange={e => updateField('default_hashtag_count', Number(e.target.value))}
                            style={{ width: '100%', accentColor: 'var(--pink)' }}
                        />
                    </div>
                </div>

            </div>

            {/* Save */}
            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', paddingBottom: '40px' }}>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        minWidth: '200px',
                        justifyContent: 'center',
                        background: 'var(--pink)',
                        color: 'white',
                        border: 'none',
                        padding: '14px 24px',
                        borderRadius: '8px',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 600,
                        fontSize: '14px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.7 : 1,
                        boxShadow: '0 4px 12px rgba(245,57,90,0.2)'
                    }}
                >
                    {saving ? 'Sauvegarde...' : saved ? '✓ Enregistré avec succès !' : 'Sauvegarder Configuration'}
                </button>
            </div>

        </div>
    )
}
