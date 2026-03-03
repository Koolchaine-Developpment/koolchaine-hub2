import React, { useState } from 'react';
import {
    Calculator,
    User,
    Mail,
    Calendar,
    MapPin,
    Users,
    Clock,
    Settings,
    ArrowRight,
    Download,
    Info,
    CheckCircle2
} from 'lucide-react';

const SimulateurPage = () => {
    const [activeTab, setActiveTab] = useState('koolchaine');
    const [clientInfo, setClientInfo] = useState({
        name: '',
        contact: '',
        email: '',
        date: '',
        location: ''
    });
    const [workshopParams, setWorkshopParams] = useState({
        participants: 10,
        duration: '1h30',
        animators: 1,
        externalProviders: false,
        providerDetails: '',
        providerCost: ''
    });
    const [margin, setMargin] = useState(30);

    const subtotalCosts = 0; // Placeholder for logic
    const totalHT = (subtotalCosts * (1 + margin / 100)) || 0;
    const tva = totalHT * 0.2;
    const totalTTC = totalHT + tva;

    const renderForm = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
            {/* Left Column: Configuration */}
            <div className="space-y-8">
                {/* Informations Client */}
                <div className="bg-white p-6 rounded-3xl border border-[#E8E4DF] shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-[#F5395A]/10 rounded-xl">
                            <User size={18} className="text-[#F5395A]" />
                        </div>
                        <h3 className="text-lg font-archivo font-black text-[#2D2830] tracking-tight uppercase">Informations Client</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-[10px] font-bold text-[#8B837E] uppercase tracking-wider mb-1.5 ml-1">Nom du client</label>
                            <input
                                type="text"
                                placeholder="Ex: Coca-Cola France"
                                className="w-full p-2.5 bg-[#FDFCFB] border border-[#E8E4DF] rounded-xl text-sm focus:ring-2 focus:ring-[#F5395A]/20 outline-none transition-all"
                                value={clientInfo.name}
                                onChange={e => setClientInfo({ ...clientInfo, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-[#8B837E] uppercase tracking-wider mb-1.5 ml-1">Nom du contact</label>
                            <input
                                type="text"
                                placeholder="Ex: Jean Dupont"
                                className="w-full p-2.5 bg-[#FDFCFB] border border-[#E8E4DF] rounded-xl text-sm focus:ring-2 focus:ring-[#F5395A]/20 outline-none transition-all"
                                value={clientInfo.contact}
                                onChange={e => setClientInfo({ ...clientInfo, contact: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-[#8B837E] uppercase tracking-wider mb-1.5 ml-1">Email</label>
                            <input
                                type="email"
                                placeholder="Ex: jean@coca.fr"
                                className="w-full p-2.5 bg-[#FDFCFB] border border-[#E8E4DF] rounded-xl text-sm focus:ring-2 focus:ring-[#F5395A]/20 outline-none transition-all"
                                value={clientInfo.email}
                                onChange={e => setClientInfo({ ...clientInfo, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-[#8B837E] uppercase tracking-wider mb-1.5 ml-1">Date de l'atelier</label>
                            <div className="relative">
                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B837E]" />
                                <input
                                    type="date"
                                    className="w-full p-2.5 pl-9 bg-[#FDFCFB] border border-[#E8E4DF] rounded-xl text-sm focus:ring-2 focus:ring-[#F5395A]/20 outline-none transition-all"
                                    value={clientInfo.date}
                                    onChange={e => setClientInfo({ ...clientInfo, date: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-[#8B837E] uppercase tracking-wider mb-1.5 ml-1">Lieu</label>
                            <div className="relative">
                                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B837E]" />
                                <input
                                    type="text"
                                    placeholder="Ex: Paris 8e"
                                    className="w-full p-2.5 pl-9 bg-[#FDFCFB] border border-[#E8E4DF] rounded-xl text-sm focus:ring-2 focus:ring-[#F5395A]/20 outline-none transition-all"
                                    value={clientInfo.location}
                                    onChange={e => setClientInfo({ ...clientInfo, location: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Paramètres Atelier */}
                <div className="bg-white p-6 rounded-3xl border border-[#E8E4DF] shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-[#F5395A]/10 rounded-xl">
                            <Settings size={18} className="text-[#F5395A]" />
                        </div>
                        <h3 className="text-lg font-archivo font-black text-[#2D2830] tracking-tight uppercase">Paramètres Atelier</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-[#8B837E] uppercase tracking-wider mb-1.5 ml-1">Participant·es (5-500)</label>
                                <div className="relative">
                                    <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B837E]" />
                                    <input
                                        type="number"
                                        min="5"
                                        max="500"
                                        className="w-full p-2.5 pl-9 bg-[#FDFCFB] border border-[#E8E4DF] rounded-xl text-sm"
                                        value={workshopParams.participants}
                                        onChange={e => setWorkshopParams({ ...workshopParams, participants: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-[#8B837E] uppercase tracking-wider mb-1.5 ml-1">Durée</label>
                                <div className="relative">
                                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B837E]" />
                                    <select
                                        className="w-full p-2.5 pl-9 bg-[#FDFCFB] border border-[#E8E4DF] rounded-xl text-sm appearance-none"
                                        value={workshopParams.duration}
                                        onChange={e => setWorkshopParams({ ...workshopParams, duration: e.target.value })}
                                    >
                                        <option value="1h">1h</option>
                                        <option value="1h30">1h30</option>
                                        <option value="2h">2h</option>
                                        <option value="3h">3h</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-[#8B837E] uppercase tracking-wider mb-1.5 ml-1">Nombre d'animateur·rices</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full p-2.5 bg-[#FDFCFB] border border-[#E8E4DF] rounded-xl text-sm"
                                value={workshopParams.animators}
                                onChange={e => setWorkshopParams({ ...workshopParams, animators: parseInt(e.target.value) })}
                            />
                        </div>

                        <div className="pt-2">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-[#2D2830]">Prestataires externes ?</span>
                                <button
                                    onClick={() => setWorkshopParams({ ...workshopParams, externalProviders: !workshopParams.externalProviders })}
                                    className={`w-10 h-5 rounded-full p-1 transition-colors ${workshopParams.externalProviders ? 'bg-[#34D399]' : 'bg-[#E8E4DF]'}`}
                                >
                                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${workshopParams.externalProviders ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </button>
                            </div>
                            {workshopParams.externalProviders && (
                                <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-[#FAF9F6] border border-[#F0EDE9] rounded-xl animate-in slide-in-from-top-2">
                                    <input
                                        type="text"
                                        placeholder="Nom prestataire"
                                        className="p-2 border border-[#E8E4DF] rounded-lg text-xs"
                                        value={workshopParams.providerDetails}
                                        onChange={e => setWorkshopParams({ ...workshopParams, providerDetails: e.target.value })}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Coût (€)"
                                        className="p-2 border border-[#E8E4DF] rounded-lg text-xs"
                                        value={workshopParams.providerCost}
                                        onChange={e => setWorkshopParams({ ...workshopParams, providerCost: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Costs and Summary */}
            <div className="space-y-8">
                {/* Placeholder Coûts */}
                <div className="bg-[#2D2830] p-6 rounded-3xl text-white shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <h3 className="text-lg font-archivo font-black tracking-tight uppercase">Structure des Coûts</h3>
                        <div className="px-2 py-0.5 bg-[#F5395A] rounded-full text-[8px] font-bold tracking-widest uppercase">Sheets Offline</div>
                    </div>
                    <div className="space-y-4">
                        {[
                            "Matériaux / participant·e",
                            "Coût humain",
                            "Déplacement",
                            "Packaging",
                            "Sous-total coûts"
                        ].map(item => (
                            <div key={item} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                <span className="text-xs text-white/50">{item}</span>
                                <span className="text-sm font-bold">—</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-xs font-bold text-white/70 uppercase tracking-widest">Marge (%)</label>
                            <span className="bg-[#F5395A] px-3 py-1 rounded-full text-xs font-black">{margin}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="60"
                            value={margin}
                            onChange={e => setMargin(parseInt(e.target.value))}
                            className="w-full accent-[#F5395A] h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />

                        <div className="mt-8 bg-white/5 p-4 rounded-2xl flex flex-col items-center">
                            <span className="text-[10px] font-bold text-[#8B837E] uppercase tracking-widest mb-1">Total HT Estimé</span>
                            <div className="text-4xl font-archivo font-black text-[#F5395A] tracking-tighter">— €</div>
                            <p className="text-[9px] text-[#8B837E] mt-2 italic flex items-center gap-1">
                                <Info size={10} />
                                Connectez Google Sheets pour activer les calculs.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Résumé Devis */}
                <div className="bg-white p-8 rounded-3xl border border-[#E8E4DF] shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5395A]/5 rounded-bl-full -mr-16 -mt-16 group-hover:bg-[#F5395A]/10 transition-colors"></div>

                    <h3 className="text-xl font-archivo font-black text-[#2D2830] tracking-tight uppercase mb-6">Résumé du Devis</h3>

                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="w-1 px-0.5 bg-[#F5395A] rounded-full"></div>
                            <div>
                                <div className="text-[10px] font-bold text-[#8B837E] uppercase mb-0.5 transition-colors group-hover:text-[#F5395A]">Client</div>
                                <div className="text-sm font-bold text-[#2D2830]">{clientInfo.name || "Client non spécifié"}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <div className="text-[10px] font-bold text-[#8B837E] uppercase mb-0.5">Atelier</div>
                                <div className="text-sm font-bold text-[#2D2830]">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-[#8B837E] uppercase mb-0.5">Participants</div>
                                <div className="text-sm font-bold text-[#2D2830]">{workshopParams.participants}</div>
                            </div>
                        </div>

                        <div className="bg-[#FAF9F6] p-4 rounded-2xl space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-[#8B837E]">Total HT</span>
                                <span className="font-bold text-[#2D2830]">— €</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[#8B837E]">TVA (20%)</span>
                                <span className="font-bold text-[#2D2830]">— €</span>
                            </div>
                            <div className="flex justify-between text-lg pt-2 border-t border-[#E8E4DF]">
                                <span className="font-archivo font-bold text-[#2D2830]">TOTAL TTC</span>
                                <span className="font-archivo font-black text-[#F5395A]">— €</span>
                            </div>
                        </div>

                        <button
                            disabled
                            className="w-full py-4 bg-[#8B837E]/20 text-[#8B837E] rounded-2xl font-archivo font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed group-hover:translate-y-[-2px] transition-transform"
                        >
                            <Download size={16} />
                            Disponible prochainement
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto pb-20 font-poppins">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2 text-[#F5395A]">
                        <Calculator size={20} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Outil de chiffrage</span>
                    </div>
                    <h1 className="text-4xl font-archivo font-black text-[#2D2830] tracking-tighter uppercase">Simulateur</h1>
                </div>

                {/* Tabs */}
                <div className="flex bg-[#F0EDE9] p-1 rounded-2xl self-start">
                    <button
                        onClick={() => setActiveTab('koolchaine')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'koolchaine' ? 'bg-white text-[#F5395A] shadow-sm' : 'text-[#8B837E] hover:text-[#2D2830]'}`}
                    >
                        Koolchaine
                    </button>
                    <button
                        onClick={() => setActiveTab('koolcorde')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'koolcorde' ? 'bg-white text-[#F5395A] shadow-sm' : 'text-[#8B837E] hover:text-[#2D2830]'}`}
                    >
                        Koolcorde
                    </button>
                </div>
            </div>

            {renderForm()}
        </div>
    );
};

export default SimulateurPage;
