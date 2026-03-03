import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    MoreHorizontal,
    Send,
    Users,
    CheckCircle2,
    Clock,
    Pause,
    Play,
    AlertCircle,
    ArrowRight
} from 'lucide-react';
import NewCampaignModal from '../../components/prospection/NewCampaignModal';
import { useNavigate } from 'react-router-dom';

const CampaignsPage = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const fetchCampaigns = async () => {
        try {
            const res = await fetch('/api/v1/prospection/campaigns');
            const data = await res.json();
            setCampaigns(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
        // Auto-refresh stats for active campaigns
        const interval = setInterval(fetchCampaigns, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleAction = async (id, action) => {
        await fetch(`/api/v1/prospection/campaigns/${id}/${action}`, { method: 'POST' });
        fetchCampaigns();
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle2 size={16} className="text-[#34D399]" />;
            case 'processing': return <Clock size={16} className="text-[#F5395A] animate-pulse" />;
            case 'paused': return <Pause size={16} className="text-[#8B837E]" />;
            case 'failed': return <AlertCircle size={16} className="text-[#F5395A]" />;
            default: return <Clock size={16} className="text-[#8B837E]" />;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'completed': return 'Terminée';
            case 'processing': return 'En cours';
            case 'paused': return 'En pause';
            case 'failed': return 'Échec';
            case 'pending': return 'En attente';
            default: return status;
        }
    };

    const filteredCampaigns = campaigns.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-archivo font-black text-[#2D2830] tracking-tight uppercase">Campagnes</h1>
                    <p className="text-[#8B837E] font-medium text-sm mt-1">Gérez vos recherches de leads et lancements automatiques.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#F5395A] hover:bg-[#D42B48] text-white px-6 py-3 rounded-2xl font-archivo font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-[#F5395A]/20 active:scale-95"
                >
                    <Plus size={18} strokeWidth={3} />
                    Nouvelle campagne
                </button>
            </div>

            {/* Stats Bar (Simple overview) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#FAF9F6] p-6 rounded-3xl border border-[#E8E4DF] flex items-center gap-4">
                    <div className="p-3 bg-[#F5395A]/10 rounded-2xl">
                        <Send size={24} className="text-[#F5395A]" />
                    </div>
                    <div>
                        <div className="text-2xl font-archivo font-black text-[#2D2830] leading-none">{campaigns.length}</div>
                        <div className="text-xs font-bold text-[#8B837E] uppercase mt-1">Total Campagnes</div>
                    </div>
                </div>
                <div className="bg-[#FAF9F6] p-6 rounded-3xl border border-[#E8E4DF] flex items-center gap-4">
                    <div className="p-3 bg-[#34D399]/10 rounded-2xl">
                        <CheckCircle2 size={24} className="text-[#34D399]" />
                    </div>
                    <div>
                        <div className="text-2xl font-archivo font-black text-[#2D2830] leading-none">
                            {campaigns.filter(c => c.status === 'completed').length}
                        </div>
                        <div className="text-xs font-bold text-[#8B837E] uppercase mt-1">Terminées</div>
                    </div>
                </div>
                <div className="bg-[#FAF9F6] p-6 rounded-3xl border border-[#E8E4DF] flex items-center gap-4">
                    <div className="p-3 bg-[#8B837E]/10 rounded-2xl">
                        <Users size={24} className="text-[#8B837E]" />
                    </div>
                    <div>
                        <div className="text-2xl font-archivo font-black text-[#2D2830] leading-none">
                            {campaigns.reduce((acc, c) => acc + (c.stats.enriched || 0), 0)}
                        </div>
                        <div className="text-xs font-bold text-[#8B837E] uppercase mt-1">Leads Générés</div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-3xl border border-[#E8E4DF] shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B837E] group-focus-within:text-[#F5395A] transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher une campagne..."
                        className="w-full bg-[#FAF9F6] border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#F5395A]/20 transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Campaign List */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="p-20 text-center text-[#8B837E] italic font-medium">Chargement des campagnes...</div>
                ) : filteredCampaigns.length === 0 ? (
                    <div className="p-20 bg-[#FAF9F6] border-2 border-dashed border-[#E8E4DF] rounded-3xl text-center flex flex-col items-center gap-4">
                        <div className="p-4 bg-white rounded-full shadow-sm">
                            <Send size={32} className="text-[#E8E4DF]" />
                        </div>
                        <p className="text-[#8B837E] font-medium">Aucune campagne trouvée. Lancez votre première prospection !</p>
                    </div>
                ) : (
                    filteredCampaigns.map(campaign => {
                        const progress = campaign.filters.volume ? Math.round(((campaign.stats.enriched || 0) / campaign.filters.volume) * 100) : 0;

                        return (
                            <div
                                key={campaign.id}
                                className="bg-white border border-[#E8E4DF] rounded-3xl p-6 hover:shadow-xl hover:border-[#F5395A]/20 transition-all group flex flex-col md:flex-row md:items-center gap-8"
                            >
                                {/* Name and Basic Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${campaign.status === 'completed' ? 'bg-[#34D399]/10 text-[#059669]' :
                                                campaign.status === 'processing' ? 'bg-[#F5395A]/10 text-[#F5395A]' :
                                                    'bg-[#FAF9F6] text-[#8B837E]'
                                            }`}>
                                            {getStatusIcon(campaign.status)}
                                            {getStatusLabel(campaign.status)}
                                        </span>
                                        <span className="text-[10px] font-bold text-[#8B837E] uppercase tracking-wider">{new Date(campaign.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-lg font-archivo font-black text-[#2D2830] truncate">{campaign.name}</h3>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {campaign.filters.naf?.map(n => (
                                            <span key={n} className="px-2 py-1 bg-[#FAF9F6] border border-[#E8E4DF] rounded-lg text-[10px] font-bold text-[#6B6560]">{n}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Progress Visual */}
                                <div className="w-full md:w-64">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-[10px] font-bold text-[#8B837E] uppercase">Progrès enrichissement</span>
                                        <span className="text-sm font-archivo font-black text-[#F5395A]">{progress}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-[#F0EDE9] rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ease-out ${campaign.status === 'completed' ? 'bg-[#34D399]' : 'bg-[#F5395A]'
                                                }`}
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between mt-2 text-[10px] font-medium text-[#8B837E]">
                                        <span>{campaign.stats.enriched || 0} enrichis</span>
                                        <span>{campaign.filters.volume || 0} cible</span>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex gap-8 items-center h-full px-8 md:border-l md:border-r border-[#F0EDE9]">
                                    <div className="text-center">
                                        <div className="text-sm font-archivo font-black text-[#2D2830]">{campaign.stats.total_found || 0}</div>
                                        <div className="text-[10px] font-bold text-[#8B837E] uppercase">Identifiées</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm font-archivo font-black text-[#2D2830]">{campaign.stats.enriched || 0}</div>
                                        <div className="text-[10px] font-bold text-[#8B837E] uppercase">Leads</div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => navigate(`/prospection/contacts?campaign=${campaign.id}`)}
                                        className="p-3 bg-[#FAF9F6] hover:bg-[#F5395A]/10 text-[#6B6560] hover:text-[#F5395A] rounded-2xl transition-all group/btn"
                                        title="Voir les contacts"
                                    >
                                        <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                    {campaign.status === 'processing' && (
                                        <button
                                            onClick={() => handleAction(campaign.id, 'pause')}
                                            className="p-3 bg-[#FAF9F6] hover:bg-[#8B837E]/10 text-[#6B6560] rounded-2xl transition-all"
                                            title="Mettre en pause"
                                        >
                                            <Pause size={20} />
                                        </button>
                                    )}
                                    {campaign.status === 'paused' && (
                                        <button
                                            onClick={() => handleAction(campaign.id, 'resume')}
                                            className="p-3 bg-[#FAF9F6] hover:bg-[#34D399]/10 text-[#6B6560] hover:text-[#34D399] rounded-2xl transition-all"
                                            title="Reprendre"
                                        >
                                            <Play size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <NewCampaignModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreated={fetchCampaigns}
            />
        </div>
    );
};

export default CampaignsPage;
