import React, { useState, useMemo, useEffect } from 'react';
import {
    Calculator, Settings, Download, Edit2, Trash2, Mail, Save, FileText
} from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function SimulateurPage() {

    // ── ÉTAT ──────────────────────────────────────────────
    const [persona, setPersona] = useState('koolchaine');

    // Infos client
    const [client, setClient] = useState({ nom: '', contact: '', email: '', date: '', lieu: '' });

    // Paramètres atelier
    const [participants, setParticipants] = useState(10);
    const [animateurs, setAnimateurs] = useState(1);
    const [duree, setDuree] = useState('1h30');

    // Config coûts (chargée depuis l'API)
    const [config, setConfig] = useState({
        tarif_1_10: 450, tarif_11_30: 650, tarif_31_100: 950,
        tarif_101_200: 1400, tarif_201_500: 2200, tarif_500_plus: 3500,
        cout_horaire_anim: 60, cout_materiel_par_pers: 8,
        cout_prestataires: 200, cout_personnalisation: 150,
        deplacement_type: 'forfait', deplacement_montant: 60,
        marge_pct: 20,
        option_prestataires: false, option_deplacement: true,
        option_materiel: true, option_personnalisation: false
    });

    // Templates
    const [templates, setTemplates] = useState([]);
    const [editModal, setEditModal] = useState(null); // null | template object

    // UI State
    const [configOpen, setConfigOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // ── CHARGEMENT INITIAL ────────────────────────────────

    useEffect(() => {
        loadData();
    }, [persona]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load Config
            const resConfig = await apiFetch(`/api/v1/simulateur/config/${persona}`);
            if (resConfig.ok) {
                const data = await resConfig.json();
                setConfig(data);
            }

            // Load Templates
            const resTemplates = await apiFetch(`/api/v1/simulateur/templates/${persona}`);
            if (resTemplates.ok) {
                const data = await resTemplates.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error("Erreur de chargement du simulateur:", error);
        } finally {
            setLoading(false);
        }
    };

    // ── SAUVEGARDE CONFIG ─────────────────────────────────

    const handleConfigChange = async (key, value) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);

        try {
            await apiFetch(`/api/v1/simulateur/config/${persona}`, {
                method: 'PUT',
                body: JSON.stringify({ [key]: value })
            });
        } catch (error) {
            console.error("Erreur de sauvegarde de la config:", error);
        }
    };

    // ── CALCUL ────────────────────────────────────────────

    const getTarifBase = () => {
        if (participants <= 10) return config.tarif_1_10;
        if (participants <= 30) return config.tarif_11_30;
        if (participants <= 100) return config.tarif_31_100;
        if (participants <= 200) return config.tarif_101_200;
        if (participants <= 500) return config.tarif_201_500;
        return config.tarif_500_plus;
    };

    const getDureeH = () => ({ '1h': 1, '1h30': 1.5, '2h': 2, '3h': 3, 'Journée': 7 }[duree] || 1.5);

    const lignes = useMemo(() => {
        const l = [];
        // Base = Tarif grille * coeff horaire * nb animateurs
        l.push({ label: `Prestation (${duree} × ${animateurs} animateur·rice${animateurs > 1 ? 's' : ''})`, val: getTarifBase() * getDureeH() * animateurs });

        if (config.option_materiel) l.push({ label: `Matériel (${participants} participant·es)`, val: config.cout_materiel_par_pers * participants });
        if (config.option_deplacement) l.push({ label: 'Déplacement', val: config.deplacement_montant });
        if (config.option_prestataires) l.push({ label: 'Prestataires externes', val: config.cout_prestataires });
        if (config.option_personnalisation) l.push({ label: 'Personnalisation', val: config.cout_personnalisation });
        return l;
    }, [participants, animateurs, duree, config]);

    const sousTotal = lignes.reduce((sum, l) => sum + l.val, 0);
    const total = sousTotal * (1 + config.marge_pct / 100);

    // ── GESTION TEMPLATES ─────────────────────────────────

    const loadTemplate = (t) => {
        setParticipants(t.participants);
        setDuree(t.duree);
        setAnimateurs(t.animateurs);
        if (t.options) {
            setConfig(prev => ({
                ...prev,
                option_prestataires: t.options.option_prestataires ?? prev.option_prestataires,
                option_deplacement: t.options.option_deplacement ?? prev.option_deplacement,
                option_materiel: t.options.option_materiel ?? prev.option_materiel,
                option_personnalisation: t.options.option_personnalisation ?? prev.option_personnalisation,
            }));
        }
    };

    const saveTemplate = async () => {
        const nom = prompt("Nom du template à enregistrer :");
        if (!nom) return;

        setSaving(true);
        const newTpl = {
            persona,
            nom,
            participants,
            duree,
            animateurs,
            options: {
                option_prestataires: config.option_prestataires,
                option_deplacement: config.option_deplacement,
                option_materiel: config.option_materiel,
                option_personnalisation: config.option_personnalisation
            },
            total_estime: total
        };

        try {
            const res = await apiFetch(`/api/v1/simulateur/templates`, {
                method: 'POST',
                body: JSON.stringify(newTpl)
            });
            if (res.ok) {
                const savedTpl = await res.json();
                setTemplates([savedTpl, ...templates]);
            }
        } catch (error) {
            console.error("Erreur save template:", error);
        } finally {
            setSaving(false);
        }
    };

    const updateTemplate = async () => {
        try {
            const res = await apiFetch(`/api/v1/simulateur/templates/${editModal.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    nom: editModal.nom,
                    participants: editModal.participants,
                    duree: editModal.duree,
                    notes: editModal.notes
                })
            });
            if (res.ok) {
                const updated = await res.json();
                setTemplates(templates.map(t => t.id === updated.id ? updated : t));
                setEditModal(null);
            }
        } catch (error) {
            console.error("Erreur update template:", error);
        }
    };

    const deleteTemplate = async () => {
        if (!confirm("Voulez-vous vraiment supprimer ce template ?")) return;
        try {
            const res = await apiFetch(`/api/v1/simulateur/templates/${editModal.id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setTemplates(templates.filter(t => t.id !== editModal.id));
                setEditModal(null);
            }
        } catch (error) {
            console.error("Erreur delete template:", error);
        }
    };

    if (loading && templates.length === 0) return <div style={{ padding: '32px' }}>Chargement du simulateur...</div>;

    // ── RENDER ────────────────────────────────────────────
    return (
        <div className="space-y-8 animate-fade-in pb-12">

            {/* Bloc 1 — Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div>
                    <h1 style={{ fontFamily: 'Archivo Black', fontSize: '22px', color: 'var(--dark)' }}>Simulateur de devis</h1>
                    <p style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '3px' }}>Calcule automatiquement le coût d'un atelier Koolchaine ou Koolcorde</p>
                </div>
                {/* Persona tabs */}
                <div style={{ display: 'flex', background: 'white', borderRadius: '8px', padding: '4px', border: '1px solid var(--border)' }}>
                    {['koolchaine', 'koolcorde'].map(p => (
                        <button key={p} onClick={() => setPersona(p)} style={{
                            padding: '6px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                            fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                            background: persona === p ? (p === 'koolchaine' ? 'var(--pink)' : 'var(--blue)') : 'transparent',
                            color: persona === p ? 'white' : 'var(--gray)',
                            transition: 'all 150ms'
                        }}>
                            {p === 'koolchaine' ? 'Koolchaine' : 'Koolcorde'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bloc 2 — Top row (grid 2 colonnes égales) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'stretch' }}>

                {/* Card Templates */}
                <div style={{
                    background: 'white', border: '1px solid var(--border)', borderRadius: '12px',
                    padding: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    maxHeight: '400px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'Archivo Black', fontSize: '14px', color: 'var(--dark)' }}>Templates enregistrés</span>
                        <span style={{ fontSize: '11px', color: 'var(--gray)' }}>Cliquer pour charger</span>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px', paddingRight: '4px', paddingBottom: '4px' }}>
                        {templates.map(t => (
                            <div key={t.id}
                                onClick={() => loadTemplate(t)}
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 8px', borderRadius: '8px', cursor: 'pointer', border: '1px solid transparent', transition: 'all 150ms' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--dark)' }}>{t.nom}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--gray)', marginTop: '1px' }}>{t.participants} pers. · {t.duree} · {t.persona === 'koolchaine' ? 'Koolchaine' : 'Koolcorde'}</div>
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', color: 'var(--dark)' }}>{Math.round(t.total_estime).toLocaleString('fr-FR')} €</span>
                                <button onClick={e => { e.stopPropagation(); setEditModal(t) }}
                                    style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                >
                                    <Edit2 size={12} color="var(--gray)" />
                                </button>
                            </div>
                        ))}
                        {templates.length === 0 && (
                            <div style={{ fontSize: '13px', color: 'var(--gray)', textAlign: 'center', padding: '24px 0', marginTop: 'auto', marginBottom: 'auto' }}>
                                <FileText size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                                Aucun template enregistré
                            </div>
                        )}
                    </div>
                </div>

                {/* Card Récapitulatif dark */}
                <div style={{ background: 'var(--dark)', borderRadius: '12px', padding: '24px', color: 'white', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontFamily: 'Archivo Black', fontSize: '16px', marginBottom: '24px', color: 'white' }}>Estimation du devis</div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {lignes.map((l, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{l.label}</span>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{Math.round(l.val).toLocaleString('fr-FR')} €</span>
                            </div>
                        ))}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Marge ({(config.marge_pct || 0)}%)</span>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{Math.round(sousTotal * (config.marge_pct / 100)).toLocaleString('fr-FR')} €</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                            <span style={{ fontFamily: 'Archivo Black', fontSize: '18px', color: 'white' }}>TOTAL HT</span>
                            <span style={{ fontFamily: 'Archivo Black', fontSize: '24px', color: persona === 'koolchaine' ? 'var(--pink)' : 'var(--blue)' }}>{Math.round(total).toLocaleString('fr-FR')} €</span>
                        </div>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button className="btn btn-pink" style={{ background: persona === 'koolchaine' ? 'var(--pink)' : 'var(--blue)' }}>
                            <Download size={16} /> Générer le devis PDF
                        </button>
                        <button className="btn btn-ghost-white">
                            <Mail size={16} /> Envoyer par email
                        </button>
                        <button onClick={saveTemplate} className="btn btn-save" disabled={saving}>
                            <Save size={14} /> {saving ? 'Enregistrement...' : 'Enregistrer comme template'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Bloc 3 — Form rows (flex column) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Card Infos client */}
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dark)', marginBottom: '16px' }}>Informations Client</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--gray)', marginBottom: '6px' }}>Société / Client</label>
                            <input type="text" value={client.nom} onChange={e => setClient({ ...client, nom: e.target.value })} placeholder="Ex: L'Oréal" style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--gray)', marginBottom: '6px' }}>Contact</label>
                            <input type="text" value={client.contact} onChange={e => setClient({ ...client, contact: e.target.value })} placeholder="Ex: Jean Martin" style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--gray)', marginBottom: '6px' }}>Email</label>
                            <input type="email" value={client.email} onChange={e => setClient({ ...client, email: e.target.value })} placeholder="jean@loreal.com" style={{ width: '100%' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--gray)', marginBottom: '6px' }}>Date de l'événement</label>
                                <input type="date" value={client.date} onChange={e => setClient({ ...client, date: e.target.value })} style={{ width: '100%' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--gray)', marginBottom: '6px' }}>Lieu (Ville)</label>
                                <input type="text" value={client.lieu} onChange={e => setClient({ ...client, lieu: e.target.value })} placeholder="Paris" style={{ width: '100%' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card Paramètres atelier */}
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dark)', marginBottom: '16px' }}>Paramètres de l'atelier</div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                            {/* Participants */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--gray)', marginBottom: '8px' }}>Nombre de participant·es</label>
                                <div className="number-input">
                                    <button className="number-btn" onClick={() => setParticipants(Math.max(5, participants - 5))}>−</button>
                                    <input type="number" className="number-val" value={participants} onChange={e => setParticipants(Number(e.target.value) || 0)} min="5" max="1000" />
                                    <button className="number-btn" onClick={() => setParticipants(participants + 5)}>+</button>
                                </div>
                            </div>

                            {/* Animateurs */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--gray)', marginBottom: '8px' }}>Nombre d'animateur·rices</label>
                                <div className="number-input">
                                    <button className="number-btn" onClick={() => setAnimateurs(Math.max(1, animateurs - 1))}>−</button>
                                    <input type="number" className="number-val" value={animateurs} onChange={e => setAnimateurs(Number(e.target.value) || 0)} min="1" max="50" />
                                    <button className="number-btn" onClick={() => setAnimateurs(animateurs + 1)}>+</button>
                                </div>
                            </div>
                        </div>

                        {/* Durée */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--gray)', marginBottom: '8px' }}>Durée estimée</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {['1h', '1h30', '2h', '3h', 'Journée'].map(d => (
                                    <button key={d} onClick={() => setDuree(d)} style={{
                                        padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                                        background: duree === d ? 'rgba(45, 40, 48, 0.05)' : 'white',
                                        color: duree === d ? 'var(--dark)' : 'var(--gray)',
                                        border: `1px solid ${duree === d ? 'var(--dark)' : 'var(--border)'}`,
                                        boxShadow: duree === d ? '0 2px 0 var(--dark)' : 'none',
                                        transform: duree === d ? 'translateY(-1px)' : 'none',
                                        transition: 'all 150ms'
                                    }}>
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Options toggle */}
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '4px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--gray)', marginBottom: '12px' }}>Options incluses</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {[
                                    { key: 'option_materiel', label: 'Matériel inclus' },
                                    { key: 'option_deplacement', label: 'Déplacement' },
                                    { key: 'option_prestataires', label: 'Prestataires externes' },
                                    { key: 'option_personnalisation', label: 'Personnalisation' }
                                ].map(opt => (
                                    <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', background: config[opt.key] ? 'rgba(245,57,90,0.03)' : 'white' }}>
                                        <input
                                            type="checkbox"
                                            checked={config[opt.key] || false}
                                            onChange={e => handleConfigChange(opt.key, e.target.checked)}
                                            style={{ margin: 0, width: '18px', height: '18px', accentColor: 'var(--pink)' }}
                                        />
                                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--dark)' }}>{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card Config coûts & options — dépliable avec chevron */}
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div
                        onClick={() => setConfigOpen(!configOpen)}
                        style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: configOpen ? 'var(--surface-2)' : 'white' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Settings size={18} color="var(--gray)" />
                            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dark)' }}>Configuration des grilles & forfaits</span>
                        </div>
                        <span style={{ transform: configOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms', color: 'var(--gray)' }}>▼</span>
                    </div>

                    {configOpen && (
                        <div style={{ padding: '24px', borderTop: '1px solid var(--border)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>

                                {/* Colonne Gauche: Grille */}
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dark)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grille Tarifaire (Base)</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {[
                                            { key: 'tarif_1_10', label: '1 à 10 pers.' },
                                            { key: 'tarif_11_30', label: '11 à 30 pers.' },
                                            { key: 'tarif_31_100', label: '31 à 100 pers.' },
                                            { key: 'tarif_101_200', label: '101 à 200 pers.' },
                                            { key: 'tarif_201_500', label: '201 à 500 pers.' },
                                            { key: 'tarif_500_plus', label: '500 pers. et +' },
                                        ].map(tarif => (
                                            <div key={tarif.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span style={{ fontSize: '13px', color: 'var(--gray)' }}>{tarif.label}</span>
                                                <div className="unit-input" style={{ width: '120px' }}>
                                                    <input type="number" value={config[tarif.key]} onChange={e => handleConfigChange(tarif.key, Number(e.target.value))} />
                                                    <span className="unit-label">€</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Colonne Droite: Forfaits */}
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dark)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coûts & Forfaits</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--gray)', marginBottom: '6px' }}>Marge par défaut (%)</label>
                                            <div className="unit-input">
                                                <input type="number" value={config.marge_pct} onChange={e => handleConfigChange('marge_pct', Number(e.target.value))} />
                                                <span className="unit-label">%</span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--gray)', marginBottom: '6px' }}>Déplacement (Forfait)</label>
                                                <div className="unit-input">
                                                    <input type="number" value={config.deplacement_montant} onChange={e => handleConfigChange('deplacement_montant', Number(e.target.value))} />
                                                    <span className="unit-label">€</span>
                                                </div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--gray)', marginBottom: '6px' }}>Matériel / pers.</label>
                                                <div className="unit-input">
                                                    <input type="number" value={config.cout_materiel_par_pers} onChange={e => handleConfigChange('cout_materiel_par_pers', Number(e.target.value))} />
                                                    <span className="unit-label">€</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--gray)', marginBottom: '6px' }}>Prestataires (Forfait)</label>
                                                <div className="unit-input">
                                                    <input type="number" value={config.cout_prestataires} onChange={e => handleConfigChange('cout_prestataires', Number(e.target.value))} />
                                                    <span className="unit-label">€</span>
                                                </div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--gray)', marginBottom: '6px' }}>Personnalisation</label>
                                                <div className="unit-input">
                                                    <input type="number" value={config.cout_personnalisation} onChange={e => handleConfigChange('cout_personnalisation', Number(e.target.value))} />
                                                    <span className="unit-label">€</span>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Modal Edit Template */}
            {editModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', borderRadius: '14px', padding: '28px', width: '400px' }}>
                        <h3 style={{ fontFamily: 'Archivo Black', fontSize: '18px', color: 'var(--dark)', marginBottom: '20px' }}>Modifier Template</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--gray)', marginBottom: '4px' }}>Nom</label>
                                <input type="text" value={editModal.nom} onChange={e => setEditModal({ ...editModal, nom: e.target.value })} style={{ width: '100%' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--gray)', marginBottom: '4px' }}>Participants</label>
                                    <input type="number" value={editModal.participants} onChange={e => setEditModal({ ...editModal, participants: Number(e.target.value) })} style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--gray)', marginBottom: '4px' }}>Durée</label>
                                    <select value={editModal.duree} onChange={e => setEditModal({ ...editModal, duree: e.target.value })} style={{ width: '100%' }}>
                                        {['1h', '1h30', '2h', '3h', 'Journée'].map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--gray)', marginBottom: '4px' }}>Notes internes</label>
                                <textarea rows="3" value={editModal.notes || ''} onChange={e => setEditModal({ ...editModal, notes: e.target.value })} style={{ width: '100%', resize: 'vertical' }}></textarea>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button onClick={deleteTemplate} style={{ background: 'rgba(245,57,90,0.1)', color: 'var(--pink)', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <Trash2 size={16} />
                            </button>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => setEditModal(null)} className="btn btn-ghost">Annuler</button>
                                <button onClick={updateTemplate} className="btn btn-dark">Sauvegarder</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
