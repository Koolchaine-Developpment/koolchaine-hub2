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
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../../lib/api';

const CampaignsPage = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const fetchCampaigns = async () => {
        try {
            const res = await apiFetch('/api/v1/prospection/campaigns');
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
        // Check for ?new=true to open modal automatically
        const params = new URLSearchParams(location.search);
        if (params.get('new') === 'true') {
            setIsModalOpen(true);
            // Remove the param without refreshing to avoid re-opening on manual refresh
            window.history.replaceState({}, '', location.pathname);
        }

        const interval = setInterval(fetchCampaigns, 5000);
        return () => clearInterval(interval);
    }, [location.pathname, location.search]);

    // Fallback if location object doesn't trigger effect correctly
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('new') === 'true') {
            setIsModalOpen(true);
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [isModalOpen === false]); // Only check when closed

    const handleAction = async (id, action) => {
        await apiFetch(`/api/v1/prospection/campaigns/${id}/${action}`, {
            method: 'POST'
        });
        fetchCampaigns();
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle2 size={16} style={{ color: 'var(--green)' }} />;
            case 'processing': return <Clock size={16} className="animate-pulse" style={{ color: 'var(--pink)' }} />;
            case 'paused': return <Pause size={16} style={{ color: 'var(--gray)' }} />;
            case 'failed': return <AlertCircle size={16} style={{ color: 'var(--pink)' }} />;
            default: return <Clock size={16} style={{ color: 'var(--gray)' }} />;
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
        <div className="space-y-8 animate-fade-in">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="page-title">Campagnes</h1>
                    <p className="page-subtitle">Gérez vos recherches de leads et lancements automatiques.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-pink"
                >
                    <Plus size={18} strokeWidth={3} />
                    Nouvelle campagne
                </button>
            </div>

            {/* Stats Bar (Simple overview) */}
            <div className="bento-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="metric-card">
                    <div className="metric-label">TOTAL CAMPAGNES</div>
                    <div className="metric-value">{campaigns.length}</div>
                    <div className="metric-sub">
                        {campaigns.filter(c => c.status === 'processing').length} en cours
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">TERMINÉES</div>
                    <div className="metric-value">
                        {campaigns.filter(c => c.status === 'completed').length}
                    </div>
                    <div className="metric-sub">Campagnes complétées</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">LEADS GÉNÉRÉS</div>
                    <div className="metric-value">
                        {campaigns.reduce((acc, c) => acc + (c.stats.enriched || 0), 0)}
                    </div>
                    <div className="metric-sub">Total contacts qualifiés</div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="card flex flex-col md:flex-row gap-4 items-center" style={{ padding: '16px 20px' }}>
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--gray)' }} />
                    <input
                        type="text"
                        placeholder="Rechercher une campagne..."
                        className="w-full"
                        style={{ paddingLeft: '36px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Campaign List */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="p-20 text-center italic font-medium" style={{ color: 'var(--gray)' }}>Chargement des campagnes...</div>
                ) : filteredCampaigns.length === 0 ? (
                    <div className="p-20 border-2 border-dashed rounded-3xl text-center flex flex-col items-center gap-4" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                        <div className="p-4 bg-white rounded-full shadow-sm" style={{ backgroundColor: 'var(--surface)' }}>
                            <Send size={32} style={{ color: 'var(--border)' }} />
                        </div>
                        <p className="font-medium" style={{ color: 'var(--gray)' }}>Aucune campagne trouvée. Lancez votre première prospection !</p>
                    </div>
                ) : (
                    filteredCampaigns.map(campaign => {
                        const progress = campaign.filters.volume ? Math.round(((campaign.stats.enriched || 0) / campaign.filters.volume) * 100) : 0;

                        return (
                            <div key={campaign.id} className="card flex flex-col md:flex-row md:items-center gap-8" style={{ padding: '24px' }}>
                                {/* Name and Basic Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className={`badge ${campaign.status === 'completed' ? 'badge-green' : campaign.status === 'processing' ? 'badge-pink' : 'badge-dark'}`}>
                                            {getStatusIcon(campaign.status)}
                                            {getStatusLabel(campaign.status)}
                                        </span>
                                        <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--gray)', letterSpacing: '0.05em' }}>{new Date(campaign.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--dark)', fontFamily: '"Archivo Black", sans-serif' }}>{campaign.name}</h3>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {campaign.filters.naf?.map(n => (
                                            <span key={n} className="badge badge-dark" style={{ background: 'var(--surface-2)', color: 'var(--gray)' }}>{n}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Progress Visual */}
                                <div className="w-full md:w-64">
                                    <div className="progress-row">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="card-label" style={{ marginBottom: 0 }}>Progrès enrichissement</span>
                                            <span style={{ fontSize: '14px', fontFamily: '"Archivo Black", sans-serif', color: 'var(--pink)' }}>{progress}%</span>
                                        </div>
                                        <div className="progress-track" style={{ height: '20px' }}>
                                            <div className={`progress-fill ${campaign.status === 'completed' ? 'badge-green' : 'badge-pink'}`} style={{ width: `${Math.max(progress, 5)}%`, minWidth: 0, padding: 0, borderRadius: 0 }}>
                                            </div>
                                        </div>
                                        <div className="flex justify-between mt-2 text-[10px] font-medium" style={{ color: 'var(--gray)' }}>
                                            <span>{campaign.stats.enriched || 0} enrichis</span>
                                            <span>{campaign.filters.volume || 0} cible</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex gap-8 items-center h-full px-8 md:border-l md:border-r border-[#F0EDE9]">
                                    <div className="text-center">
                                        <div className="card-value" style={{ fontSize: '24px' }}>{campaign.stats.total_found || 0}</div>
                                        <div className="card-label" style={{ marginBottom: 0 }}>Identifiées</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="card-value" style={{ fontSize: '24px' }}>{campaign.stats.enriched || 0}</div>
                                        <div className="card-label" style={{ marginBottom: 0 }}>Leads</div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button onClick={() => navigate(`/prospection/contacts?campaign=${campaign.id}`)} className="btn btn-ghost" title="Voir les contacts">
                                        <ArrowRight size={16} />
                                    </button>
                                    {campaign.status === 'processing' && (
                                        <button onClick={() => handleAction(campaign.id, 'pause')} className="btn btn-ghost" title="Mettre en pause">
                                            <Pause size={16} />
                                        </button>
                                    )}
                                    {campaign.status === 'paused' && (
                                        <button onClick={() => handleAction(campaign.id, 'resume')} className="btn btn-ghost" title="Reprendre">
                                            <Play size={16} />
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
