import React from 'react'

const ProspectionPage = () => {
    return (
        <div>
            <header className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Prospection B2B</h2>
                <p className="text-slate-500">Gérez votre pipeline d'outreach email.</p>
            </header>

            <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                    <span className="text-2xl">📧</span>
                </div>
                <h3 className="text-lg font-medium text-slate-900">Module en attente</h3>
                <p className="text-slate-500 max-w-sm mt-2">
                    L'intégration des données SIRENE et des séquences Dropcontact sera implémentée dans la prochaine phase.
                </p>
            </div>
        </div>
    )
}

export default ProspectionPage
