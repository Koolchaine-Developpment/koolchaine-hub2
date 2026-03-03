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
            style={style}
            className="flex items-center gap-3 p-3 bg-white border border-[#E8E4DF] rounded-lg mb-2 shadow-sm"
        >
            <div {...attributes} {...listeners} className="cursor-grab text-[#8B837E] hover:text-[#2D2830]">
                <GripVertical size={18} />
            </div>
            <span className="text-sm font-medium text-[#2D2830] select-none">{id}</span>
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
        fetch('/api/v1/prospection/sequences')
            .then(res => res.json())
            .then(setSequences);
    }, []);

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
            const res = await fetch('/api/v1/prospection/campaigns/estimate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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

        const res = await fetch('/api/v1/prospection/campaigns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            onCreated();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col font-poppins">
                {/* Header */}
                <div className="p-6 border-b border-[#E8E4DF] flex justify-between items-center bg-[#FDFCFB]">
                    <div>
                        <h2 className="text-xl font-archivo font-black text-[#2D2830] tracking-tight uppercase">Nouvelle Campagne de Prospection</h2>
                        <p className="text-sm text-[#8B837E]">Configurez vos filtres et lancez la génération de leads.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#F0EDE9] rounded-full transition-colors">
                        <X size={20} className="text-[#8B837E]" />
                    </button>
                </div>

                {/* Form Body */}
                <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">

                    {/* Left Column: Config */}
                    <div className="space-y-8">
                        <div>
                            <label className="block text-xs font-bold text-[#8B837E] uppercase tracking-wider mb-2">Nom de la campagne</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Ex: Agences Pub - Paris"
                                className="w-full p-3 bg-[#FDFCFB] border border-[#E8E4DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5395A] focus:border-transparent transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#8B837E] uppercase tracking-wider mb-2">Secteurs cibles (NAF)</label>
                            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-2 border border-[#F0EDE9] rounded-xl bg-[#FDFCFB]">
                                {NAF_CODES.map(n => (
                                    <label key={n.code} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            className="accent-[#F5395A] w-4 h-4"
                                            checked={selectedNaf.includes(n.code)}
                                            onChange={e => {
                                                if (e.target.checked) setSelectedNaf([...selectedNaf, n.code]);
                                                else setSelectedNaf(selectedNaf.filter(c => c !== n.code));
                                            }}
                                        />
                                        <span className="text-sm text-[#2D2830]">{n.label} <span className="text-[10px] text-[#8B837E] font-medium ml-1">({n.code})</span></span>
                                    </label>
                                ))}
                            </div>
                            <input
                                type="text"
                                placeholder="Ajouter un code NAF custom..."
                                value={customNaf}
                                onChange={e => setCustomNaf(e.target.value.toUpperCase())}
                                className="w-full mt-2 p-2 text-xs bg-transparent border-b border-[#E8E4DF] focus:border-[#F5395A] focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#8B837E] uppercase tracking-wider mb-2">Taille d'entreprise</label>
                            <div className="flex flex-wrap gap-4">
                                {SIZE_RANGES.map(sr => (
                                    <label key={sr.id} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="accent-[#F5395A]"
                                            checked={selectedSizes.includes(sr.id)}
                                            onChange={e => {
                                                if (e.target.checked) setSelectedSizes([...selectedSizes, sr.id]);
                                                else setSelectedSizes(selectedSizes.filter(s => s !== sr.id));
                                            }}
                                        />
                                        <span className="text-sm text-[#2D2830]">{sr.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#8B837E] uppercase tracking-wider mb-2">Localisation</label>
                                <select
                                    className="w-full p-3 bg-[#FDFCFB] border border-[#E8E4DF] rounded-xl text-sm"
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
                                    <label className="block text-xs font-bold text-[#8B837E] uppercase tracking-wider mb-2">Valeur</label>
                                    <input
                                        type="text"
                                        value={location.value}
                                        onChange={e => setLocation({ ...location, value: e.target.value })}
                                        placeholder={location.type === 'departement' ? 'Ex: 75' : 'Ex: 11'}
                                        className="w-full p-3 bg-[#FDFCFB] border border-[#E8E4DF] rounded-xl text-sm"
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#8B837E] uppercase tracking-wider mb-2 flex justify-between">
                                <span>Volume cible</span>
                                <span className="text-[#F5395A] font-black">{volume} contacts</span>
                            </label>
                            <input
                                type="range"
                                min="10"
                                max="200"
                                step="10"
                                value={volume}
                                onChange={e => setVolume(parseInt(e.target.value))}
                                className="w-full accent-[#F5395A] h-2 bg-[#F0EDE9] rounded-lg appearance-none cursor-pointer mt-2"
                            />
                        </div>
                    </div>

                    {/* Right Column: Roles & Sequence */}
                    <div className="space-y-8">
                        <div>
                            <label className="block text-xs font-bold text-[#8B837E] uppercase tracking-wider mb-2">Priorité des postes (Drag & Drop)</label>
                            <p className="text-[10px] text-[#8B837E] mb-4 italic">Dropcontact cherchera les contacts dans cet ordre de priorité.</p>

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={roles}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="p-2 bg-[#FDFCFB] border border-[#F0EDE9] rounded-xl">
                                        {roles.map(role => (
                                            <SortableItem key={role} id={role} />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#8B837E] uppercase tracking-wider mb-2">Séquence à associer</label>
                            <select
                                value={sequenceId}
                                onChange={e => setSequenceId(e.target.value)}
                                className="w-full p-3 bg-[#FDFCFB] border border-[#E8E4DF] rounded-xl text-sm"
                            >
                                <option value="">Aucune séquence (enrichissement seul)</option>
                                {sequences.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Estimation Box */}
                        <div className="p-6 bg-gradient-to-br from-[#2D2830] to-[#1A161C] rounded-2xl text-white">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <Calculator size={18} className="text-[#F5395A]" />
                                    <span className="text-xs font-archivo font-bold uppercase tracking-widest text-[#8B837E]">Estimation SIRENE</span>
                                </div>
                                {loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                                ) : (
                                    <button
                                        onClick={handleEstimate}
                                        className="text-[10px] font-bold text-[#F5395A] hover:text-white transition-colors"
                                    >
                                        REFRAÎCHIR
                                    </button>
                                )}
                            </div>

                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-archivo font-black">
                                    {estimation === null ? '--' : estimation.toLocaleString()}
                                </span>
                                <span className="text-xs font-medium text-[#8B837E]">Sociétés identifiées</span>
                            </div>

                            <div className="mt-4 flex items-center gap-2 p-2 bg-white/5 rounded-lg text-[10px] text-[#8B837E]">
                                <Info size={12} />
                                <span>Basé sur les filtres NAF et la taille d'entreprise.</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[#E8E4DF] bg-[#FDFCFB] flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 text-sm font-bold text-[#8B837E] hover:text-[#2D2830] transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleLaunch}
                        disabled={!name || selectedNaf.length === 0}
                        className="px-8 py-3 bg-[#F5395A] text-white rounded-xl font-archivo font-black text-sm uppercase tracking-wider flex items-center gap-2 hover:bg-[#D42B48] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#F5395A]/20"
                    >
                        <Zap size={18} fill="currentColor" />
                        Lancer la campagne
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewCampaignModal;
