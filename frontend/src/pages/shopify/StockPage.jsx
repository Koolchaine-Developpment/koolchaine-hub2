import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { AlertTriangle, TrendingDown } from 'lucide-react'

const StockPage = () => {
    const [stock, setStock] = useState([])
    const [loading, setLoading] = useState(true)

    // Normally we'd fetch directly from DB where the background cron syncs
    useEffect(() => {
        const fetchStock = async () => {
            try {
                const res = await axios.get('/api/v1/shopify/stock', { withCredentials: true })
                setStock(res.data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchStock()
    }, [])

    const getStockStatus = (current, threshold) => {
        if (current <= 0) return { label: 'Épuisé', color: 'bg-brand-bg text-brand-text-secondary border-brand-border' }
        if (current <= threshold) return { label: 'Critique', color: 'bg-accent-pink/10 text-accent-pink border-accent-pink/20' }
        return { label: 'En stock', color: 'bg-accent-green/10 text-accent-green border-accent-green/20' }
    }

    return (
        <div className="bg-brand-surface rounded-[10px] shadow-sm border border-brand-border overflow-hidden flex flex-col h-full animate-fade-in font-sans">
            <div className="p-6 border-b border-brand-border flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-heading text-brand-dark flex items-center gap-2">
                        Gestion des Stocks
                    </h3>
                    <p className="text-sm font-sans text-brand-text-secondary mt-1">Définissez des seuils d'alerte pour recevoir des notifications.</p>
                </div>
            </div>

            <div className="overflow-x-auto flex-1 bg-brand-surface">
                <table className="w-full text-sm text-left font-sans">
                    <thead className="bg-brand-bg text-brand-text-secondary font-medium border-b border-brand-border">
                        <tr>
                            <th className="px-6 py-4">Produit</th>
                            <th className="px-6 py-4 text-center">SKU</th>
                            <th className="px-6 py-4 text-center">Stock Actuel</th>
                            <th className="px-6 py-4 text-center">Seuil d'Alerte</th>
                            <th className="px-6 py-4 text-center">État</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-brand-text-secondary font-sans italic">Chargement des données...</td>
                            </tr>
                        ) : stock.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-brand-text-secondary font-sans italic">
                                    <div className="flex flex-col items-center">
                                        <TrendingDown className="text-brand-border mb-3" size={32} />
                                        <p>Aucune donnée de stock trouvée. Le cron de synchronisation n'a peut-être pas encore tourné.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            stock.map(item => {
                                const status = getStockStatus(item.current_stock, item.threshold)
                                return (
                                    <tr key={item.id} className="hover:bg-brand-bg transition-colors">
                                        <td className="px-6 py-4 font-medium font-sans text-brand-text-primary">
                                            {item.product_name}
                                        </td>
                                        <td className="px-6 py-4 text-center text-brand-text-secondary font-sans text-xs">
                                            {item.product_id}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-lg font-heading ${item.current_stock <= item.threshold ? 'text-accent-pink' : 'text-brand-text-primary'}`}>
                                                {item.current_stock}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="number"
                                                defaultValue={item.threshold}
                                                className="w-20 text-center border-brand-border rounded-[6px] text-sm bg-brand-surface text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-accent-pink/20 focus:border-accent-pink transition-all font-sans"
                                                title="Modifications statiques - Démo"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 text-xs font-sans font-semibold rounded-full border flex items-center gap-1.5 justify-center w-max mx-auto ${status.color}`}>
                                                {item.current_stock <= item.threshold && <AlertTriangle size={12} />}
                                                {status.label}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default StockPage
