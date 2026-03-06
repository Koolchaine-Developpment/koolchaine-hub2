import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, GripVertical, Info, Zap, Calculator } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { Checkbox } from '../ui/Checkbox';
import { Slider } from '../ui/Slider';

const NAF_CODES = [
    { code: '7311Z', label: 'Agences de publicité' },
    { code: '7312Z', label: 'Régie publicitaire' },
    { code: '8230Z', label: 'Organisation salons/événements' },
    { code: '7420Z', label: 'Activités photographiques' },
    { code: '4771Z', label: 'Commerce détail habillement' },
    { code: '4772Z', label: 'Commerce détail chaussures' },
    { code: '9004Z', label: 'Gestion salles spectacles' },
    { code: '5510Z', label: 'Hôtels et hébergement' },
];

const SIZE_RANGES = [
    { id: 'tpe', label: 'TPE (1-10 salariés)', tranches: ['01', '02'] },
    { id: 'pme_p', label: 'Petite PME (10-50)', tranches: ['11', '12'] },
    { id: 'pme', label: 'PME (50-250)', tranches: ['21', '22'] },
];

const DEFAULT_ROLES = [
    "Directeur·rice Marketing",
    "Responsable Marketing",
    "Chargé·e de communication",
    "Responsable événementiel",
    "Chef·fe de projet events"
];

const SortableItem = ({ id }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={{ ...style, border: '1px solid var(--border)' }}
            className="flex items-center gap-3 p-3 bg-white rounded-lg mb-2 shadow-sm"
        >
            <div {...attributes} {...listeners} className="cursor-grab hover:text-[var(--dark)]" style={{ color: 'var(--gray)' }}>
                <GripVertical size={18} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--dark)' }} className="select-none">{id}</span>
        </div>
    );
};

const NewCampaignModal = ({ isOpen, onClose, onCreated }) => {
    const [name, setName] = useState('');
    const [selectedNaf, setSelectedNaf] = useState([]);
    const [customNaf, setCustomNaf] = useState('');
    const [selectedSizes, setSelectedSizes] = useState(['tpe', 'pme_p', 'pme']);
    const [location, setLocation] = useState({ type: 'france', value: '' });
    const [volume, setVolume] = useState(50);
    const [roles, setRoles] = useState(DEFAULT_ROLES);
    const [sequenceId, setSequenceId] = useState('');
    const [sequences, setSequences] = useState([]);
    const [estimation, setEstimation] = useState(null);
    const [loading, setLoading] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (isOpen) {
            apiFetch('/api/v1/prospection/sequences')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setSequences(data);
                    } else {
                        console.error('Sequences is not an array:', data);
                        setSequences([]);
                    }
                })
                .catch(err => {
                    console.error('Failed to fetch sequences:', err);
                    setSequences([]);
                });
        }
    }, [isOpen]);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setRoles((items) => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const getFilters = () => {
        const naf = [...selectedNaf];
        if (customNaf) naf.push(customNaf);

        let sizeTranches = [];
        selectedSizes.forEach(s => {
            sizeTranches = [...sizeTranches, ...SIZE_RANGES.find(sr => sr.id === s).tranches];
        });

        return {
            naf,
            size: sizeTranches,
            location: location.type === 'france' ? null : { [location.type]: location.value },
            volume
        };
    };

    const handleEstimate = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/api/v1/prospection/campaigns/estimate', {
                method: 'POST',
                body: JSON.stringify(getFilters())
            });
            const data = await res.json();
            setEstimation(data.estimated_count);
        } finally {
            setLoading(false);
        }
    };

    const handleLaunch = async () => {
        const body = {
            name,
            filters: getFilters(),
            role_priority: roles,
            sequence_id: sequenceId ? parseInt(sequenceId) : null
        };

        const res = await apiFetch('/api/v1/prospection/campaigns', {
            method: 'POST',
            body: JSON.stringify(body)
        });

        if (res.ok) {
            onCreated();
            onClose();
        }
    };

    return (
        <Modal open={isOpen} onClose={onClose} title="Nouvelle Campagne de Prospection" width={840}>
            <p style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '24px', marginTop: '-12px' }}>
                Configurez vos filtres et lancez la génération de leads.
            </p>

            {/* Form Body */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                {/* Left Column: Config */}
                <div className="space-y-8">
                    <div>
                        <label className="section-label block">Nom de la campagne</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ex: Agences Pub - Paris"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="section-label block">Secteurs cibles (NAF)</label>
                        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-2">
                            {NAF_CODES.map(n => (
                                <Checkbox
                                    key={n.code}
                                    label={n.label}
                                    description={`Code NAF: ${n.code}`}
                                    checked={selectedNaf.includes(n.code)}
                                    onChange={checked => {
                                        if (checked) setSelectedNaf([...selectedNaf, n.code]);
                                        else setSelectedNaf(selectedNaf.filter(c => c !== n.code));
                                    }}
                                />
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Saisir un code NAF libre..."
                            value={customNaf}
                            onChange={e => setCustomNaf(e.target.value.toUpperCase())}
                            className="w-full mt-3 p-2 text-xs bg-transparent border-b border-transparent focus:outline-none focus:border-[var(--pink)] transition-colors"
                            style={{ borderBottomColor: 'var(--border)' }}
                        />
                    </div>

                    <div>
                        <label className="section-label block">Taille d'entreprise</label>
                        <div className="flex flex-col gap-1">
                            {SIZE_RANGES.map(sr => (
                                <Checkbox
                                    key={sr.id}
                                    label={sr.label}
                                    checked={selectedSizes.includes(sr.id)}
                                    onChange={checked => {
                                        if (checked) setSelectedSizes([...selectedSizes, sr.id]);
                                        else setSelectedSizes(selectedSizes.filter(s => s !== sr.id));
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="section-label block">Localisation</label>
                            <select
                                className="w-full"
                                value={location.type}
                                onChange={e => setLocation({ ...location, type: e.target.value })}
                            >
                                <option value="france">Toute la France</option>
                                <option value="departement">Département (CP)</option>
                                <option value="region">Région (Code)</option>
                            </select>
                        </div>
                        {location.type !== 'france' && (
                            <div>
                                <label className="section-label block flex justify-between">Valeur</label>
                                <input
                                    type="text"
                                    value={location.value}
                                    onChange={e => setLocation({ ...location, value: e.target.value })}
                                    placeholder={location.type === 'departement' ? 'Ex: 75' : 'Ex: 11'}
                                    className="w-full"
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <Slider
                            label="Volume cible"
                            value={volume}
                            min={10} max={200} step={10}
                            displayValue={`${volume} contacts`}
                            onChange={val => setVolume(val)}
                        />
                    </div>
                </div>

                {/* Right Column: Roles & Sequence */}
                <div className="space-y-8">
                    <div>
                        <label className="section-label block">Priorité des postes (Drag & Drop)</label>
                        <p style={{ fontSize: '10px', color: 'var(--gray)', marginBottom: '16px', fontStyle: 'italic' }}>Dropcontact cherchera les contacts dans cet ordre de priorité.</p>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={roles}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                                    {roles.map(role => (
                                        <SortableItem key={role} id={role} />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>

                    <div>
                        <label className="section-label block">Séquence à associer</label>
                        <select
                            value={sequenceId}
                            onChange={e => setSequenceId(e.target.value)}
                            className="w-full"
                        >
                            <option value="">Aucune séquence (enrichissement seul)</option>
                            {sequences.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Estimation Box */}
                    <div className="card card-dark" style={{ padding: '24px' }}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                                <Calculator size={18} style={{ color: 'var(--pink)' }} />
                                <span className="card-label" style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>Estimation SIRENE</span>
                            </div>
                            {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                            ) : (
                                <button
                                    onClick={handleEstimate}
                                    style={{ fontSize: '10px', fontWeight: 700, color: 'var(--pink)', textTransform: 'uppercase', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                    className="transition-colors hover:text-white"
                                >
                                    RAFRAÎCHIR
                                </button>
                            )}
                        </div>

                        <div className="flex items-baseline gap-2">
                            <span className="card-value" style={{ color: '#FFF' }}>
                                {estimation === null ? '--' : estimation.toLocaleString()}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>Sociétés identifiées</span>
                        </div>

                        <div className="mt-4 flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)', fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>
                            <Info size={12} />
                            <span>Basé sur les filtres NAF et la taille d'entreprise.</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t flex justify-end gap-3" style={{ borderColor: 'var(--border)' }}>
                <button
                    onClick={onClose}
                    className="btn btn-ghost"
                >
                    Annuler
                </button>
                <button
                    onClick={handleLaunch}
                    disabled={!name || selectedNaf.length === 0}
                    className="btn btn-pink"
                    style={{ opacity: (!name || selectedNaf.length === 0) ? 0.5 : 1 }}
                >
                    <Zap size={16} fill="currentColor" />
                    Lancer la campagne
                </button>
            </div>
        </Modal>
    );
};

export default NewCampaignModal;
