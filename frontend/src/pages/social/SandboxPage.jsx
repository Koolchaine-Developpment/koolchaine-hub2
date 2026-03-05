import React, { useState, useRef, useCallback, useEffect } from 'react'
import { apiFetch } from '../../lib/api'

const TONES = ['inspirant', 'professionnel', 'décalé', 'chaleureux', 'éducatif', 'storytelling']
const LENGTHS = [
    { value: 'court', label: 'Court', desc: '1-2 phrases' },
    { value: 'moyen', label: 'Moyen', desc: '3-5 lignes' },
    { value: 'long', label: 'Long', desc: 'Storytelling' }
]

// API configuration
const API_BASE = "/api/v1/social"

// Helper to compress image
const compressImage = (file, maxWidth = 1024, quality = 0.8) => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas')
        const img = new Image()
        img.onload = () => {
            const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1)
            canvas.width = img.width * ratio
            canvas.height = img.height * ratio
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
            const base64 = canvas.toDataURL('image/jpeg', quality).split(',')[1]
            resolve(base64)
        }
        img.src = URL.createObjectURL(file)
    })
}

// Helper to convert File to Base64 (legacy, used for raw if needed, but we compress now)
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
});

export default function SandboxPage() {
    const fileInputRef = useRef(null)
    const [activeTab, setActiveTab] = useState('sandbox') // 'sandbox' | 'library'

    // --- Sandbox States ---
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [base64Image, setBase64Image] = useState(null)
    const [generating, setGenerating] = useState(false)
    const [result, setResult] = useState(null) // Contient caption, visual_fiche, media_id

    // Settings
    const [persona, setPersona] = useState('koolchaine')
    const [tone, setTone] = useState('inspirant')
    const [length, setLength] = useState('moyen')
    const [brief, setBrief] = useState('')

    // --- Library States ---
    const [library, setLibrary] = useState([])
    const [loadingLibrary, setLoadingLibrary] = useState(false)
    const [filterPersona, setFilterPersona] = useState('')
    const [filterFavorite, setFilterFavorite] = useState(false)

    const [copied, setCopied] = useState(false)

    // ─── EFFECTS ──────────────────────────────────────────────────

    useEffect(() => {
        if (activeTab === 'library') {
            fetchLibrary()
        }
    }, [activeTab, filterPersona, filterFavorite])

    // ─── ACTIONS : SANDBOX ────────────────────────────────────────

    const handleFileSelect = useCallback(async (selectedFile) => {
        if (!selectedFile) return
        setFile(selectedFile)
        setPreview(URL.createObjectURL(selectedFile))
        setResult(null)

        const b64 = await compressImage(selectedFile)
        setBase64Image(b64)
    }, [])

    const handleGenerate = async () => {
        if (!base64Image) return
        setGenerating(true)
        setResult(null)

        try {
            const res = await apiFetch(`${API_BASE}/generate`, {
                method: 'POST',
                body: JSON.stringify({
                    image_base64: base64Image,
                    image_mime: 'image/jpeg', // Toujours JPEG après compression
                    persona,
                    ton: tone,
                    longueur: length,
                    brief: brief || null
                })
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Generation failed');
            }
            const data = await res.json()
            setResult(data)
        } catch (err) {
            console.error('Erreur:', err)
            alert(`Erreur lors de la génération : ${err.message}`)
        } finally {
            setGenerating(false)
        }
    }

    const handleRegenerate = async (mediaId) => {
        setGenerating(true)
        try {
            const res = await apiFetch(`${API_BASE}/regenerate`, {
                method: 'POST',
                body: JSON.stringify({
                    media_id: mediaId,
                    persona,
                    ton: tone,
                    longueur: length,
                    brief: brief || null
                })
            })

            if (!res.ok) throw new Error('Regeneration failed')
            const data = await res.json()
            setResult(prev => ({ ...prev, caption: data.caption }))
        } catch (err) {
            console.error(err)
        } finally {
            setGenerating(false)
        }
    }

    // ─── ACTIONS : LIBRARY ─────────────────────────────────────────

    const fetchLibrary = async () => {
        setLoadingLibrary(true)
        try {
            let url = `${API_BASE}/media?`
            if (filterPersona) url += `persona=${filterPersona}&`
            if (filterFavorite) url += `is_favorite=true&`

            const res = await apiFetch(url)
            const data = await res.json()
            setLibrary(data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingLibrary(false)
        }
    }

    const toggleFavorite = async (id) => {
        try {
            const res = await apiFetch(`${API_BASE}/media/${id}/favorite`, {
                method: 'PATCH',
            })
            if (res.ok) {
                setLibrary(prev => prev.map(m => m.id === id ? { ...m, is_favorite: !m.is_favorite } : m))
                if (result?.media_id === id) {
                    setResult(prev => ({ ...prev, is_favorite: !prev.is_favorite }))
                }
            }
        } catch (err) { console.error(err) }
    }

    const useFromLibrary = (media) => {
        setResult({
            caption: "",
            visual_fiche: media.visual_fiche,
            media_id: media.id,
            is_favorite: media.is_favorite,
            tags_auto: media.tags_auto,
            analyse_courte: media.claude_analysis
        })
        setPreview(null) // L'image viendra de l'URL du media si dispos
        setPersona(media.persona || 'koolchaine')
        setActiveTab('sandbox')
    }

    // ─── RENDER ───────────────────────────────────────────────────

    return (
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden', flexDirection: 'column' }}>

            {/* Header Tabs */}
            <div style={{
                height: '56px',
                borderBottom: '1px solid var(--border)',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                padding: '0 24px',
                gap: '32px'
            }}>
                <div
                    onClick={() => setActiveTab('sandbox')}
                    style={{
                        fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                        color: activeTab === 'sandbox' ? 'var(--pink)' : 'var(--gray)',
                        borderBottom: activeTab === 'sandbox' ? '2px solid var(--pink)' : 'none',
                        height: '100%', display: 'flex', alignItems: 'center'
                    }}>
                    Sandbox Créatif
                </div>
                <div
                    onClick={() => setActiveTab('library')}
                    style={{
                        fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                        color: activeTab === 'library' ? 'var(--pink)' : 'var(--gray)',
                        borderBottom: activeTab === 'library' ? '2px solid var(--pink)' : 'none',
                        height: '100%', display: 'flex', alignItems: 'center'
                    }}>
                    Bibliothèque Médias
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {activeTab === 'sandbox' ? (
                    <>
                        {/* COLONNE GAUCHE — Réglages */}
                        <div style={{ width: '400px', borderRight: '1px solid var(--border)', background: 'white', overflowY: 'auto', padding: '24px' }}>

                            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray)', marginBottom: '16px', letterSpacing: '0.05em' }}>Média source</div>

                            {!preview && !result?.media_id ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: '#FAFAFB' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div>
                                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Cliquer pour uploader</div>
                                    <div style={{ fontSize: '11px', color: 'var(--gray)', marginTop: '4px' }}>Analyse Claude Vision auto</div>
                                </div>
                            ) : (
                                <div style={{ position: 'relative', marginBottom: '20px' }}>
                                    {preview && <img src={preview} style={{ width: '100%', borderRadius: '12px', display: 'block' }} alt="Upload" />}
                                    {!preview && result?.media_id && (
                                        <div style={{ background: 'var(--surface-2)', height: '120px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--gray)' }}>
                                            Media #{result.media_id} (Library)
                                        </div>
                                    )}
                                    <button
                                        onClick={() => { setFile(null); setPreview(null); setBase64Image(null); setResult(null); }}
                                        style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}>×</button>
                                </div>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFileSelect(e.target.files[0])} />

                            <div style={{ height: '24px' }} />

                            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray)', marginBottom: '12px' }}>Persona & Ton</div>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                {['koolchaine', 'koolcorde'].map(p => (
                                    <button key={p} onClick={() => setPersona(p)} style={{
                                        flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid',
                                        borderColor: persona === p ? 'var(--pink)' : 'var(--border)',
                                        background: persona === p ? 'rgba(245,57,90,0.05)' : 'white',
                                        color: persona === p ? 'var(--pink)' : 'var(--dark)',
                                        fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                                    }}>{p === 'koolchaine' ? 'Koolchaine' : 'Koolcorde'}</button>
                                ))}
                            </div>

                            <select
                                value={tone}
                                onChange={e => setTone(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '16px', fontSize: '13px', outline: 'none' }}>
                                {TONES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                            </select>

                            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray)', marginBottom: '12px' }}>Longueur</div>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                {LENGTHS.map(l => (
                                    <button key={l.value} onClick={() => setLength(l.value)} style={{
                                        flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid',
                                        borderColor: length === l.value ? 'var(--pink)' : 'var(--border)',
                                        background: length === l.value ? 'rgba(245,57,90,0.05)' : 'white',
                                        color: length === l.value ? 'var(--pink)' : 'var(--dark)',
                                        fontSize: '12px', fontWeight: 500, cursor: 'pointer'
                                    }}>{l.label}</button>
                                ))}
                            </div>

                            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray)', marginBottom: '12px' }}>Brief supplémentaire</div>
                            <textarea
                                value={brief}
                                onChange={e => setBrief(e.target.value)}
                                placeholder="Contexte, objectif, offre..."
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', height: '100px', resize: 'none', outline: 'none', marginBottom: '24px' }}
                            />

                            <button
                                onClick={result?.media_id ? () => handleRegenerate(result.media_id) : handleGenerate}
                                disabled={(!base64Image && !result?.media_id) || generating}
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
                                    background: 'var(--dark)', color: 'white', fontWeight: 700, fontSize: '14px',
                                    cursor: 'pointer', opacity: generating ? 0.7 : 1
                                }}>
                                {generating ? 'Magie en cours...' : (result?.media_id ? '✦ Régénérer' : '✦ Créer la Caption')}
                            </button>
                        </div>

                        {/* COLONNE DROITE — Résultat & Analyse */}
                        <div style={{ flex: 1, background: 'var(--cream)', padding: '40px', overflowY: 'auto' }}>
                            {!result && !generating && (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>✨</div>
                                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--dark)' }}>Studio de Création</div>
                                    <div style={{ fontSize: '14px', color: 'var(--gray)', textAlign: 'center', maxWidth: '300px', marginTop: '8px' }}>
                                        Uploadez une image ou choisissez-en une dans la bibliothèque pour commencer.
                                    </div>
                                </div>
                            )}

                            {generating && !result && (
                                <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', borderRadius: '16px', padding: '32px', border: '1px solid var(--border)' }}>
                                    <div style={{ height: '24px', width: '200px', background: 'var(--border)', borderRadius: '4px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }} />
                                    <div style={{ height: '16px', width: '100%', background: 'var(--surface-2)', borderRadius: '4px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }} />
                                    <div style={{ height: '16px', width: '90%', background: 'var(--surface-2)', borderRadius: '4px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }} />
                                    <div style={{ height: '16px', width: '70%', background: 'var(--surface-2)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                                </div>
                            )}

                            {result && (
                                <div style={{ maxWidth: '700px', margin: '0 auto' }}>

                                    {/* Analyse Section */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                                        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--pink)', textTransform: 'uppercase', marginBottom: '12px' }}>Analyse Visuelle</div>
                                            <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--dark)', fontStyle: 'italic' }}>"{result.analyse_courte}"</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '16px' }}>
                                                {result.tags_auto?.map(tag => (
                                                    <span key={tag} style={{ fontSize: '10px', background: 'var(--surface-2)', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>#{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--blue)', textTransform: 'uppercase', marginBottom: '12px' }}>Angles Narratifs</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {result.visual_fiche?.angles_caption?.map((angle, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={() => setBrief(prev => prev + (prev ? '\n' : '') + "Angle suggéré : " + angle)}
                                                        style={{ fontSize: '12px', border: '1px solid var(--border)', padding: '8px', borderRadius: '6px', cursor: 'pointer', transition: 'background 0.2s' }}
                                                        onMouseEnter={e => e.currentTarget.style.background = '#F0F2FF'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                                    >
                                                        💡 {angle}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Result Card */}
                                    <div style={{ background: 'white', borderRadius: '20px', padding: '32px', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)' }} />
                                                <span style={{ fontSize: '14px', fontWeight: 800 }}>Caption Générée</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <button
                                                    onClick={() => toggleFavorite(result.media_id)}
                                                    style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>
                                                    {result.is_favorite ? '❤️' : '🤍'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(result.caption)
                                                        setCopied(true)
                                                        setTimeout(() => setCopied(false), 2000)
                                                    }}
                                                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: copied ? 'var(--green)' : 'white', color: copied ? 'white' : 'var(--dark)' }}>
                                                    {copied ? '✓ Copié' : 'Copier'}
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '16px', lineHeight: '1.8', whiteSpace: 'pre-wrap', color: 'var(--dark)', fontFamily: 'Inter, sans-serif' }}>
                                            {result.caption}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, background: 'var(--cream)', padding: '32px', overflowY: 'auto' }}>

                        {/* Filters */}
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', alignItems: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 900, marginRight: '16px' }}>Médiathèque</div>
                            <select
                                value={filterPersona}
                                onChange={e => setFilterPersona(e.target.value)}
                                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}>
                                <option value="">Tous les personas</option>
                                <option value="koolchaine">Koolchaine</option>
                                <option value="koolcorde">Koolcorde</option>
                            </select>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={filterFavorite} onChange={e => setFilterFavorite(e.target.checked)} />
                                Favoris uniquement
                            </label>
                        </div>

                        {loadingLibrary ? (
                            <div style={{ textAlign: 'center', padding: '100px', color: 'var(--gray)' }}>Chargement de la bibliothèque...</div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: '24px'
                            }}>
                                {library.map(media => (
                                    <div
                                        key={media.id}
                                        style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)', transition: 'transform 0.2s', cursor: 'pointer' }}
                                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                        onClick={() => useFromLibrary(media)}
                                    >
                                        <div style={{ height: '180px', background: 'var(--surface-2)', position: 'relative' }}>
                                            <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleFavorite(media.id); }}
                                                    style={{ background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                    {media.is_favorite ? '❤️' : '🤍'}
                                                </button>
                                            </div>
                                            <div style={{ position: 'absolute', bottom: '12px', left: '12px' }}>
                                                <span style={{ fontSize: '10px', background: 'var(--dark)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase' }}>{media.status}</span>
                                            </div>
                                        </div>
                                        <div style={{ padding: '16px' }}>
                                            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--dark)', height: '40px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {media.claude_analysis || "Aucune analyse"}
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {media.tags_auto?.slice(0, 3).map(tag => (
                                                    <span key={tag} style={{ fontSize: '10px', color: 'var(--gray)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: '4px' }}>{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {library.length === 0 && !loadingLibrary && (
                            <div style={{ textAlign: 'center', padding: '100px', color: 'var(--gray)' }}>Aucun média trouvé.</div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    )
}
