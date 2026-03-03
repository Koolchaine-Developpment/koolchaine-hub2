import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Send, Clock, Trash2 } from 'lucide-react'

const SequencesPage = () => {
    const [sequences, setSequences] = useState([])
    const [showBuilder, setShowBuilder] = useState(false)
    const [newSequence, setNewSequence] = useState({ name: '', steps: [] })

    const fetchSequences = async () => {
        try {
            const res = await axios.get('/api/v1/prospection/sequences', { withCredentials: true })
            setSequences(res.data)
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        fetchSequences()
    }, [])

    const addStep = () => {
        setNewSequence(prev => ({
            ...prev,
            steps: [...prev.steps, { delay_days: 1, subject: '', body_template: '' }]
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

    const saveSequence = async () => {
        if (!newSequence.name || newSequence.steps.length === 0) {
            alert("Veuillez donner un nom et ajouter au moins une étape.")
            return
        }
        try {
            await axios.post('/api/v1/prospection/sequences', newSequence, { withCredentials: true })
            setShowBuilder(false)
            setNewSequence({ name: '', steps: [] })
            fetchSequences()
        } catch (err) {
            alert("Erreur lors de la sauvegarde.")
        }
    }

    if (showBuilder) {
        return (
            <div className="bg-brand-surface rounded-[10px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-brand-border p-8 max-w-3xl mx-auto animate-fade-in font-sans">
                <h3 className="text-[26px] font-heading text-brand-dark mb-6">Créer une Séquence</h3>

                <div className="mb-6 space-y-2">
                    <label className="text-sm font-medium font-sans text-brand-text-primary">Nom de la séquence</label>
                    <input
                        type="text"
                        value={newSequence.name}
                        onChange={e => setNewSequence({ ...newSequence, name: e.target.value })}
                        className="w-full p-3 bg-brand-bg border border-brand-border rounded-[6px] text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent-pink/20 focus:border-accent-pink transition-all font-sans"
                        placeholder="Ex: Campagne Cibles Agences Q3"
                    />
                </div>

                <div className="space-y-6">
                    {newSequence.steps.map((step, index) => (
                        <div key={index} className="p-6 border border-brand-border rounded-[10px] bg-brand-bg/50 relative transition-all">
                            <button
                                onClick={() => removeStep(index)}
                                className="absolute top-4 right-4 text-brand-text-secondary hover:text-accent-pink transition-colors"
                                title="Supprimer l'étape"
                            >
                                <Trash2 size={18} />
                            </button>

                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-8 rounded-[8px] bg-accent-pink/10 text-accent-pink flex items-center justify-center font-bold font-sans text-sm">
                                    {index + 1}
                                </div>
                                <h4 className="font-heading text-lg text-brand-dark mt-0.5">Étape {index + 1}</h4>
                            </div>

                            <div className="space-y-5">
                                <div className="flex items-center gap-3">
                                    <Clock size={16} className="text-brand-text-secondary" />
                                    <span className="text-sm font-sans text-brand-text-secondary">Délai après l'étape précédente :</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={step.delay_days}
                                        onChange={e => updateStep(index, 'delay_days', parseInt(e.target.value))}
                                        className="w-20 p-2 bg-brand-surface border border-brand-border rounded-[6px] text-center focus:outline-none focus:ring-2 focus:ring-accent-pink/20 focus:border-accent-pink transition-all text-brand-text-primary"
                                    />
                                    <span className="text-sm font-sans text-brand-text-secondary">jour(s)</span>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium font-sans text-brand-text-primary">Objet de l'email</label>
                                    <input
                                        type="text"
                                        value={step.subject}
                                        onChange={e => updateStep(index, 'subject', e.target.value)}
                                        className="w-full p-3 bg-brand-surface border border-brand-border rounded-[6px] text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent-pink/20 focus:border-accent-pink transition-all font-sans"
                                        placeholder="Sujet accrocheur..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium font-sans text-brand-text-primary">Corps du message</label>
                                    <p className="text-xs font-sans text-brand-text-secondary mb-2">
                                        Variables disponibles : <code className="bg-brand-bg px-1.5 py-0.5 rounded-[4px] text-accent-blue font-medium">{"{{first_name}}"}</code>, <code className="bg-brand-bg px-1.5 py-0.5 rounded-[4px] text-accent-blue font-medium">{"{{last_name}}"}</code>
                                    </p>
                                    <textarea
                                        rows="5"
                                        value={step.body_template}
                                        onChange={e => updateStep(index, 'body_template', e.target.value)}
                                        className="w-full p-3 bg-brand-surface border border-brand-border rounded-[6px] text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent-pink/20 focus:border-accent-pink transition-all font-sans resize-y"
                                        placeholder="Bonjour {{first_name}}, ..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={addStep}
                    className="mt-6 w-full py-4 border-[2px] border-dashed border-accent-pink/30 text-accent-pink hover:bg-accent-pink/5 rounded-[10px] font-sans font-medium flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
                >
                    <Plus size={18} />
                    Ajouter une étape
                </button>

                <div className="mt-8 flex gap-4 pt-6 border-t border-brand-border">
                    <button
                        onClick={saveSequence}
                        className="flex-1 bg-accent-pink hover:bg-accent-pink/90 text-white font-sans font-medium py-3 rounded-[6px] transition-all active:scale-[0.98]"
                    >
                        Sauvegarder la séquence
                    </button>
                    <button
                        onClick={() => setShowBuilder(false)}
                        className="flex-1 bg-brand-bg hover:bg-brand-border/50 text-brand-text-secondary font-sans font-medium py-3 rounded-[6px] transition-colors"
                    >
                        Annuler
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-brand-surface rounded-[10px] shadow-sm border border-brand-border p-6 min-h-[400px] animate-fade-in font-sans">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-heading text-brand-dark">Séquences enregistrées</h3>
                <button
                    onClick={() => setShowBuilder(true)}
                    className="bg-accent-pink hover:bg-accent-pink/90 text-white px-4 py-2 rounded-[6px] text-sm font-sans font-medium transition-all active:scale-[0.98] flex items-center gap-2"
                >
                    <Plus size={16} />
                    Nouvelle séquence
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sequences.length === 0 ? (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center gap-4 border-[2px] border-dashed border-[#E8E4DF] rounded-[10px] bg-[#F7F5F2]/40">
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(245,57,90,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Send size={22} color="#F5395A" />
                        </div>
                        <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px', fontStyle: 'italic', color: '#6B6560', margin: 0 }}>
                            Aucune séquence créée pour le moment.
                        </p>
                        <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '12px', color: '#6B6560', opacity: 0.7, margin: 0 }}>
                            Créez votre première séquence d'outreach.
                        </p>
                    </div>
                ) : (
                    sequences.map(seq => (
                        <div key={seq.id} className="bg-brand-surface border border-brand-border rounded-[10px] p-6 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow group flex flex-col">
                            <h4 className="font-heading text-lg text-brand-dark mb-1 truncate group-hover:text-accent-pink transition-colors" title={seq.name}>{seq.name}</h4>
                            <p className="text-sm font-sans text-brand-text-secondary mb-5 pb-4 border-b border-brand-border/50">{seq.steps.length} étape(s)</p>
                            <div className="space-y-4 flex-1">
                                {seq.steps.map((step, i) => (
                                    <div key={i} className="flex gap-3 text-sm font-sans">
                                        <span className="font-medium text-accent-blue mt-0.5">#{i + 1}</span>
                                        <div className="min-w-0">
                                            <p className="font-medium text-brand-text-primary truncate" title={step.subject}>{step.subject || '(Sans objet)'}</p>
                                            <p className="text-xs text-brand-text-secondary mt-0.5">J+{step.delay_days}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default SequencesPage
