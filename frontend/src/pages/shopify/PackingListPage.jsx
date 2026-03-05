import React, { useState } from 'react'
import axios from 'axios'
import { FileDown, Printer } from 'lucide-react'

const PackingListPage = () => {
    const [isGenerating, setIsGenerating] = useState(false)

    const downloadPDF = async () => {
        setIsGenerating(true)
        try {
            const res = await axios.get('/api/v1/shopify/orders/packing-list', {
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([res.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `Bordereau_Commandes_${new Date().toISOString().split('T')[0]}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()

        } catch (err) {
            alert("Erreur lors de la génération du PDF.")
        } finally {
            setIsGenerating(false)
        }
    }

    // A real app would display a preview of the HTML version of the packing list here
    // For now, we supply a clean UI to trigger the PDF download since the 
    // requirement specifies a printable PDF generated via ReportLab/WeasyPrint
    return (
        <div className="bg-brand-surface rounded-[10px] shadow-sm border border-brand-border overflow-hidden min-h-[500px] flex flex-col items-center justify-center p-8 text-center animate-fade-in font-sans">
            <div className="w-20 h-20 bg-accent-pink/10 rounded-full flex items-center justify-center mb-6 border-[8px] border-accent-pink/5">
                <Printer className="text-accent-pink" size={32} />
            </div>

            <h2 className="text-[26px] font-heading text-brand-dark mb-2">Bordereau de Préparation</h2>
            <p className="text-brand-text-secondary font-sans max-w-md mb-8">
                Générez la liste complète des commandes à expédier aujourd'hui.
                Le document PDF inclura toutes les adresses d'expédition et le récapitulatif des articles.
            </p>

            <button
                onClick={downloadPDF}
                disabled={isGenerating}
                className="bg-accent-pink hover:bg-accent-pink/90 text-white font-sans font-medium py-3 px-8 rounded-[6px] transition-all flex items-center gap-3 disabled:opacity-70 active:scale-[0.98]"
            >
                {isGenerating ? (
                    <><RefreshCw className="animate-spin" size={20} /> Création du PDF...</>
                ) : (
                    <><FileDown size={20} /> Télécharger le PDF</>
                )}
            </button>
        </div>
    )
}

export default PackingListPage
