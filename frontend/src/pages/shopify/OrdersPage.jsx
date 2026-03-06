import React from 'react'
import { Truck } from 'lucide-react'

const OrdersPage = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 animate-fade-in">
            <div className="p-4 rounded-full bg-surface-2 text-pink">
                <Truck size={48} />
            </div>
            <h2 className="text-2xl font-bold text-dark">Gestion des Commandes</h2>
            <p className="text-gray max-w-md text-center">
                Ce module permettra la synchronisation et la gestion des expéditions Shopify via Boxtal.
            </p>
            <div className="badge badge-dark">Branche : shopify-analytics (à venir)</div>
        </div>
    )
}

export default OrdersPage
