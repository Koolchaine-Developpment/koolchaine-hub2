import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Send, Clock, Trash2, GripVertical, GitFork, ArrowDown } from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { SortableItem } from './SortableItem' // local sub-component

const api = axios.create({
    baseURL: '/api/v1'
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
            <div className="card animate-fade-in" style={{ padding: '32px' }}>
                <h3 className="page-title" style={{ fontSize: '20px', marginBottom: '24px' }}>Constructeur de Séquence</h3>
                <input
                    type="text"
                    value={newSequence.name}
                    onChange={e => setNewSequence({ ...newSequence, name: e.target.value })}
                    className="w-full"
                    style={{ marginBottom: '32px', fontSize: '16px', padding: '12px 16px' }}
                    placeholder="Nom de la séquence (ex: Campagne Q3)"
                />

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={newSequence.steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                            {newSequence.steps.map((step, index) => (
                                <SortableItem key={step.id} id={step.id}>
                                    <div className="card flex gap-4 items-start" style={{ padding: '16px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                                        <div style={{ cursor: 'grab', color: 'var(--gray)', paddingTop: '8px' }}>
                                            <GripVertical size={20} />
                                        </div>

                                        <div className="flex-1 flex flex-col gap-3">
                                            {/* Top Row: Condition & Output */}
                                            <div className="flex justify-between items-center">
                                                <div className={`badge ${step.condition === 'always' ? 'badge-blue' : 'badge-yellow'}`}>
                                                    {step.condition !== 'always' && <GitFork size={12} />}
                                                    {step.condition === 'always' ? 'Toujours envoyer'
                                                        : step.condition === 'if_not_opened' ? 'Si non ouvert'
                                                            : step.condition === 'if_opened_no_reply' ? 'Si ouvert sans réponse'
                                                                : 'Si cliqué sans réponse'}
                                                </div>

                                                <button onClick={() => removeStep(index)} className="btn btn-ghost" style={{ padding: '4px', color: 'var(--pink)' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            {/* Main Setup Row */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {/* Delay Settings */}
                                                <div className="card bg-white" style={{ padding: '16px' }}>
                                                    <label className="card-label"><Clock size={12} /> Délai</label>
                                                    <div className="flex gap-2 items-center mt-2">
                                                        <input type="number" min="0" value={step.delay_days} onChange={e => updateStep(index, 'delay_days', e.target.value)} style={{ width: '60px' }} />
                                                        <span style={{ fontSize: '12px', color: 'var(--gray)' }}>j</span>
                                                        <input type="number" min="0" max="23" value={step.delay_hours} onChange={e => updateStep(index, 'delay_hours', e.target.value)} style={{ width: '60px' }} />
                                                        <span style={{ fontSize: '12px', color: 'var(--gray)' }}>h</span>
                                                    </div>
                                                </div>

                                                {/* Action Settings */}
                                                <div className="card bg-white md:col-span-2 flex flex-col gap-3" style={{ padding: '16px' }}>
                                                    <div>
                                                        <label className="card-label mb-2">Action (Template)</label>
                                                        <select value={step.template_id} onChange={e => updateStep(index, 'template_id', e.target.value)} className="w-full">
                                                            {templates.length === 0 && <option value="">Aucun template</option>}
                                                            {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.category})</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="card-label mb-2">Condition déclencheur</label>
                                                        <select value={step.condition} onChange={e => updateStep(index, 'condition', e.target.value)} className="w-full">
                                                            <option value="always">Toujours envoyer</option>
                                                            <option value="if_not_opened">Si non ouvert</option>
                                                            <option value="if_opened_no_reply">Si ouvert mais sans réponse</option>
                                                            <option value="if_clicked_no_reply">Si cliqué mais sans réponse</option>
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

                <div className="flex flex-col gap-4 mt-6">
                    <button onClick={addStep} style={{
                        padding: '16px', border: '2px dashed var(--pink)', borderRadius: '12px', color: 'var(--pink)', backgroundColor: 'var(--surface-2)',
                        fontSize: '14px', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                        <Plus size={16} /> Ajouter une étape
                    </button>

                    <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                        <button onClick={saveSequence} className="btn btn-pink">Sauvegarder la séquence</button>
                        <button onClick={() => setShowBuilder(false)} className="btn btn-ghost">Annuler</button>
                    </div>
                </div>
            </div>
        )
    }

    // LIST VIEW
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="page-title">Séquences</h1>
                    <p className="page-subtitle">Configurez vos parcours d'emails automatisés.</p>
                </div>
                <button onClick={() => setShowBuilder(true)} className="btn btn-pink">
                    <Plus size={18} strokeWidth={3} /> Nouvelle Séquence
                </button>
            </div>

            <div className="bento" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                {sequences.map(seq => (
                    <div key={seq.id} className="card">
                        <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--dark)', fontFamily: '"Archivo Black", sans-serif', marginBottom: '16px' }}>{seq.name}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {seq.steps.map((step, i) => {
                                const tpl = templates.find(t => t.id === step.template_id)
                                return (
                                    <div key={i} style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--gray)', alignItems: 'flex-start' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--pink)', marginTop: '2px' }}>#{i + 1}</div>
                                        <div>
                                            <div style={{ fontWeight: 500, color: 'var(--dark)' }}>{tpl ? tpl.name : 'Template Introuvable'}</div>
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
