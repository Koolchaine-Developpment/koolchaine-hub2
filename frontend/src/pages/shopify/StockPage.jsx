import React from 'react'
import { AlertTriangle } from 'lucide-react'

const StockPage = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 animate-fade-in">
            <div className="p-4 rounded-full bg-surface-2 text-pink">
                <AlertTriangle size={48} />
            </div>
            <h2 className="text-2xl font-bold text-dark">Suivi des Stocks</h2>
            <p className="text-gray max-w-md text-center">
                Visualisation des stocks Shopify et alertes automatiques.
            </p>
            <div className="badge badge-pink">En attente de développement</div>
        </div>
    )
}

export default StockPage
