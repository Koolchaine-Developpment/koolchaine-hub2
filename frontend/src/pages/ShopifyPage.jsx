import React from 'react'

const ShopifyPage = () => {
    return (
        <div>
            <header className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Shopify & Logistique</h2>
                <p className="text-slate-500">Commandes, étiquettes Colissimo et packing lists.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-50 grayscale">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-32 flex items-center justify-center font-medium">
                    Commandes du jour
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-32 flex items-center justify-center font-medium">
                    Étiquettes Colissimo
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-32 flex items-center justify-center font-medium">
                    Packing List
                </div>
            </div>
        </div>
    )
}

export default ShopifyPage
