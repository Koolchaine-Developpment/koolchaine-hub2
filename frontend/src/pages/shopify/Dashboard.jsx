import React from 'react'
import { ShoppingBag } from 'lucide-react'

const ShopifyDashboard = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 animate-fade-in">
            <div className="p-4 rounded-full bg-surface-2 text-pink">
                <ShoppingBag size={48} />
            </div>
            <h2 className="text-2xl font-bold text-dark">Shopify Analytics (B2C)</h2>
            <p className="text-gray max-w-md text-center">
                Ce module est actuellement une coquille vide prête pour l'implémentation de la partie B2C.
                Les endpoints API sont déjà configurés dans <code>backend/app/api/shopify.py</code>.
            </p>
            <div className="badge badge-yellow">En attente de développement</div>
        </div>
    )
}

export default ShopifyDashboard
