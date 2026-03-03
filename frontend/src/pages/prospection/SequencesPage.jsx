import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Send, Clock, Trash2, GripVertical, GitFork, ArrowDown } from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { SortableItem } from './SortableItem' // local sub-component

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost/api/v1',
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

export default function SequencesPage() {
    const [sequences, setSequences] = useState([])
    const [templates, setTemplates] = useState([])
    const [showBuilder, setShowBuilder] = useState(false)
    const [newSequence, setNewSequence] = useState({ name: '', steps: [] })

    const fetchData = async () => {
        try {
            const [seqRes, tplRes] = await Promise.all([
                api.get('/prospection/sequences'),
                api.get('/prospection/templates')
            ])
            setSequences(seqRes.data)
            setTemplates(tplRes.data)
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => { fetchData() }, [])

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const addStep = () => {
        setNewSequence(prev => ({
            ...prev,
            steps: [...prev.steps, {
                id: `step-${Date.now()}`, // Temporary ID for DND
                delay_days: 1,
                delay_hours: 0,
                template_id: templates.length > 0 ? templates[0].id : '',
                condition: 'always',
                stop_on_reply: true
            }]
        }))
    }

    const removeStep = (index) => {
        setNewSequence(prev => ({
            ...prev,
            steps: prev.steps.filter((_, i) => i !== index)
        }))
    }

    const updateStep = (index, field, value) => {
        setNewSequence(prev => {
            const newSteps = [...prev.steps]
            newSteps[index] = { ...newSteps[index], [field]: value }
            return { ...prev, steps: newSteps }
        })
    }

    const handleDragEnd = (event) => {
        const { active, over } = event
        if (active.id !== over.id) {
            setNewSequence((prev) => {
                const oldIndex = prev.steps.findIndex(s => s.id === active.id)
                const newIndex = prev.steps.findIndex(s => s.id === over.id)
                const newSteps = Array.from(prev.steps)
                const [moved] = newSteps.splice(oldIndex, 1)
                newSteps.splice(newIndex, 0, moved)
                return { ...prev, steps: newSteps }
            })
        }
    }

    const saveSequence = async () => {
        if (!newSequence.name || newSequence.steps.length === 0) {
            alert("Veuillez donner un nom et ajouter au moins une étape.")
            return
        }
        try {
            // Strip the temporary 'id' from steps before sending to API
            const payload = {
                name: newSequence.name,
                steps: newSequence.steps.map(s => {
                    const { id, ...rest } = s
                    return { ...rest, template_id: parseInt(rest.template_id) }
                })
            }
            await api.post('/prospection/sequences', payload)
            setShowBuilder(false)
            setNewSequence({ name: '', steps: [] })
            fetchData()
        } catch (err) {
            alert("Erreur lors de la sauvegarde.")
        }
    }

    if (showBuilder) {
        return (
            <div style={{ padding: '24px', backgroundColor: '#FFF', borderRadius: '12px', border: '1px solid #E8E4DF', fontFamily: 'Poppins, sans-serif' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#2D2830', marginBottom: '24px' }}>Constructeur de Séquence</h3>
                <input
                    type="text"
                    value={newSequence.name}
                    onChange={e => setNewSequence({ ...newSequence, name: e.target.value })}
                    style={{ ...inputStyle, width: '100%', marginBottom: '32px', fontSize: '16px' }}
                    placeholder="Nom de la séquence (ex: Campagne Q3)"
                />

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={newSequence.steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                            {newSequence.steps.map((step, index) => (
                                <SortableItem key={step.id} id={step.id}>
                                    <div style={{ backgroundColor: '#F9F8F6', border: '1px solid #E8E4DF', borderRadius: '8px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                        <div style={{ cursor: 'grab', color: '#A39C93', paddingTop: '8px' }}>
                                            <GripVertical size={20} />
                                        </div>

                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {/* Top Row: Condition & Output */}
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <div style={{
                                                    backgroundColor: step.condition === 'always' ? '#E0E7FF' : '#FEF3C7',
                                                    color: step.condition === 'always' ? '#4338CA' : '#D97706',
                                                    padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'
                                                }}>
                                                    {step.condition !== 'always' && <GitFork size={12} />}
                                                    {step.condition === 'always' ? 'Toujours envoyer'
                                                        : step.condition === 'if_not_opened' ? 'Si non ouvert'
                                                            : step.condition === 'if_opened_no_reply' ? 'Si ouvert sans réponse'
                                                                : 'Si cliqué sans réponse'}
                                                </div>

                                                <div style={{ flex: 1 }}></div>

                                                <button onClick={() => removeStep(index)} style={{ background: 'none', border: 'none', color: '#E11D48', cursor: 'pointer', padding: '4px' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            {/* Main Setup Row */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 3fr', gap: '16px' }}>
                                                {/* Delay Settings */}
                                                <div style={{ backgroundColor: '#FFF', border: '1px solid #E8E4DF', borderRadius: '6px', padding: '12px' }}>
                                                    <label style={labelStyle}><Clock size={12} /> Délai après l'étape précédente</label>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <input type="number" min="0" value={step.delay_days} onChange={e => updateStep(index, 'delay_days', e.target.value)} style={{ ...inputStyle, width: '60px' }} />
                                                            <span style={{ fontSize: '12px', color: '#6B6560' }}>j</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <input type="number" min="0" max="23" value={step.delay_hours} onChange={e => updateStep(index, 'delay_hours', e.target.value)} style={{ ...inputStyle, width: '60px' }} />
                                                            <span style={{ fontSize: '12px', color: '#6B6560' }}>h</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Settings */}
                                                <div style={{ backgroundColor: '#FFF', border: '1px solid #E8E4DF', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    <div>
                                                        <label style={labelStyle}>Action (Template)</label>
                                                        <select value={step.template_id} onChange={e => updateStep(index, 'template_id', e.target.value)} style={{ ...inputStyle, width: '100%' }}>
                                                            {templates.length === 0 && <option value="">Aucun template disponible</option>}
                                                            {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.category})</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label style={labelStyle}>Condition déclencheur</label>
                                                        <select value={step.condition} onChange={e => updateStep(index, 'condition', e.target.value)} style={{ ...inputStyle, width: '100%' }}>
                                                            <option value="always">Toujours envoyer</option>
                                                            <option value="if_not_opened">Envoyer si email précédent NON ouvert</option>
                                                            <option value="if_opened_no_reply">Envoyer si email précédent ouvert mais sans réponse</option>
                                                            <option value="if_clicked_no_reply">Envoyer si email précédent cliqué mais sans réponse</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </SortableItem>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <button onClick={addStep} style={{
                        padding: '12px', border: '2px dashed #F5395A', borderRadius: '8px', color: '#F5395A', backgroundColor: 'rgba(245,57,90,0.05)',
                        fontSize: '14px', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer'
                    }}>
                        <Plus size={16} /> Ajouter une étape
                    </button>

                    <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid #E8E4DF' }}>
                        <button onClick={saveSequence} style={saveBtnStyle}>Sauvegarder la séquence</button>
                        <button onClick={() => setShowBuilder(false)} style={cancelBtnStyle}>Annuler</button>
                    </div>
                </div>
            </div>
        )
    }

    // LIST VIEW
    return (
        <div style={{ fontFamily: 'Poppins, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#2D2830', marginBottom: '8px', letterSpacing: '-0.02em' }}>Séquences</h1>
                    <p style={{ color: '#6B6560', fontSize: '14px' }}>Configurez vos parcours d'emails automatisés.</p>
                </div>
                <button onClick={() => setShowBuilder(true)} style={saveBtnStyle}><Plus size={16} /> Nouvelle Séquence</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {sequences.map(seq => (
                    <div key={seq.id} style={{ border: '1px solid #E8E4DF', borderRadius: '12px', padding: '24px', backgroundColor: '#FFFFFF' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#2D2830', margin: '0 0 16px 0' }}>{seq.name}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {seq.steps.map((step, i) => {
                                const tpl = templates.find(t => t.id === step.template_id)
                                return (
                                    <div key={i} style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#6B6560', alignItems: 'flex-start' }}>
                                        <div style={{ fontWeight: 600, color: '#F5395A', marginTop: '2px' }}>#{i + 1}</div>
                                        <div>
                                            <div style={{ fontWeight: 500, color: '#2D2830' }}>{tpl ? tpl.name : 'Template Introuvable'}</div>
                                            <div style={{ fontSize: '11px', opacity: 0.8 }}>J+{step.delay_days} | {step.condition === 'always' ? 'Toujours' : 'Conditionnel'}</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

const inputStyle = { padding: '8px 12px', borderRadius: '6px', border: '1px solid #E8E4DF', fontSize: '13px', outline: 'none' }
const labelStyle = { fontSize: '11px', fontWeight: 600, color: '#6B6560', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }
const saveBtnStyle = { padding: '10px 16px', backgroundColor: '#F5395A', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }
const cancelBtnStyle = { ...saveBtnStyle, backgroundColor: '#FFF', color: '#6B6560', border: '1px solid #E8E4DF' }
