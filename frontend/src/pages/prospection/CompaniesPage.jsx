import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Upload, Search, Building2, ShieldCheck, Loader2 } from 'lucide-react'

const CompaniesPage = () => {
    const [companies, setCompanies] = useState([])
    const [isImporting, setIsImporting] = useState(false)
    const [showModal, setShowModal] = useState(false)

    const fetchCompanies = async () => {
        try {
            const res = await axios.get('/api/v1/prospection/companies', { withCredentials: true })
            setCompanies(res.data)
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        fetchCompanies()
    }, [])

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const formData = new FormData()
        formData.append('file', file)

        setIsImporting(true)
        try {
            await axios.post('/api/v1/prospection/companies/import', formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            alert("Import réussi !")
            setShowModal(false)
            fetchCompanies()
        } catch (err) {
            alert("Erreur lors de l'import")
        } finally {
            setIsImporting(false)
        }
    }

    return (
        <div className="bg-brand-surface rounded-[10px] shadow-sm border border-brand-border overflow-hidden animate-fade-in font-sans">
            <div className="p-6 border-b border-brand-border flex justify-between items-center">
                <h3 className="text-lg font-heading text-brand-dark flex items-center gap-2">
                    <Building2 size={20} className="text-brand-text-secondary" />
                    Base Sociétés
                </h3>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-accent-pink hover:bg-accent-pink/90 text-white px-4 py-2 rounded-[6px] text-sm font-medium transition-all active:scale-[0.98] flex items-center gap-2"
                >
                    <Upload size={16} />
                    Importer SIRENE (CSV)
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left font-sans">
                    <thead className="bg-brand-bg text-brand-text-secondary font-medium border-b border-brand-border">
                        <tr>
                            <th className="px-6 py-4">Nom</th>
                            <th className="px-6 py-4 text-center">SIREN</th>
                            <th className="px-6 py-4 text-center">Code NAF</th>
                            <th className="px-6 py-4 text-center">Effectifs</th>
                            <th className="px-6 py-4">Ville</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                        {companies.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-brand-text-secondary italic">
                                    Aucune société trouvée. Vous pouvez importer un fichier SIRENE.
                                </td>
                            </tr>
                        ) : (
                            companies.map(company => (
                                <tr key={company.id} className="hover:bg-brand-bg transition-colors">
                                    <td className="px-6 py-4 font-medium text-brand-text-primary">{company.name}</td>
                                    <td className="px-6 py-4 text-center font-mono text-brand-text-secondary">{company.siren}</td>
                                    <td className="px-6 py-4 text-center text-brand-text-secondary">{company.naf_code || '-'}</td>
                                    <td className="px-6 py-4 text-center text-brand-text-secondary">{company.size_range || '-'}</td>
                                    <td className="px-6 py-4 text-brand-text-secondary">{company.city || '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-brand-surface rounded-[10px] p-8 max-w-md w-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-brand-border">
                        <h3 className="text-[22px] font-heading text-brand-dark mb-2">Importer un fichier SIRENE</h3>
                        <p className="text-sm font-sans text-brand-text-secondary mb-6">
                            Sélectionnez un fichier CSV contenant les données SIRENE pour enrichir votre base.
                        </p>

                        <div className="border-[2px] border-dashed border-brand-border rounded-[10px] p-8 text-center hover:bg-brand-bg transition-colors">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
                                {isImporting ? (
                                    <Loader2 className="animate-spin text-accent-pink" size={32} />
                                ) : (
                                    <Upload className="text-brand-text-secondary/50" size={32} />
                                )}
                                <span className="text-sm font-medium text-accent-pink">
                                    {isImporting ? "Importation en cours..." : "Cliquez pour uploader"}
                                </span>
                                <span className="text-xs font-sans text-brand-text-secondary">Format CSV uniquement</span>
                            </label>
                        </div>

                        <button
                            onClick={() => setShowModal(false)}
                            disabled={isImporting}
                            className="mt-6 w-full py-3 text-sm font-sans font-medium text-brand-text-secondary hover:bg-brand-bg rounded-[6px] transition-colors disabled:opacity-50"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CompaniesPage
