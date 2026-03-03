import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Download, RefreshCw, Printer, AlertCircle } from 'lucide-react'

const statusColors = {
    unfulfilled: 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20',
    fulfilled: 'bg-accent-green/10 text-accent-green border-accent-green/20',
    cancelled: 'bg-brand-bg text-brand-text-secondary border-brand-border'
}

const statusLabels = {
    unfulfilled: 'À préparer',
    fulfilled: 'Expédié',
    cancelled: 'Annulé'
}

const OrdersPage = () => {
    const [orders, setOrders] = useState([])
    const [isSyncing, setIsSyncing] = useState(false)
    const [generatingLabelId, setGeneratingLabelId] = useState(null)

    const fetchOrders = async () => {
        try {
            const res = await axios.get('/api/v1/shopify/orders?status=any', { withCredentials: true })
            setOrders(res.data)
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [])

    const handleSync = async () => {
        setIsSyncing(true)
        try {
            await axios.post('/api/v1/shopify/orders/sync', {}, { withCredentials: true })
            await fetchOrders()
        } catch (err) {
            alert("Erreur lors de la synchronisation.")
        } finally {
            setIsSyncing(false)
        }
    }

    const generateLabel = async (orderId) => {
        setGeneratingLabelId(orderId)
        try {
            const res = await axios.post(`/api/v1/shopify/orders/${orderId}/label`, {}, { withCredentials: true })
            if (res.data.status === 'pending') {
                alert("Génération d'étiquette lancée en arrière-plan. Veuillez rafraîchir la page dans quelques instants.")
            } else if (res.data.url) {
                setOrders(prev => prev.map(o =>
                    o.id === orderId ? { ...o, label_url: res.data.url } : o
                ))
            }
        } catch (err) {
            alert("Erreur lors de la génération de l'étiquette.")
        } finally {
            setGeneratingLabelId(null)
        }
    }

    return (
        <div className="bg-brand-surface rounded-[10px] shadow-sm border border-brand-border overflow-hidden flex flex-col h-full animate-fade-in font-sans">
            <div className="p-6 border-b border-brand-border flex justify-between items-center">
                <h3 className="text-lg font-heading text-brand-dark flex items-center gap-2">
                    Gérer les Commandes
                </h3>
                <div className="flex gap-3">
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="bg-brand-surface border border-brand-border hover:bg-brand-bg text-brand-text-secondary px-4 py-2 rounded-[6px] text-sm font-sans font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                        {isSyncing ? "Synchronisation..." : "Synchroniser Shopify"}
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto flex-1 bg-brand-surface">
                <table className="w-full text-sm text-left font-sans">
                    <thead className="bg-brand-bg text-brand-text-secondary font-medium border-b border-brand-border">
                        <tr>
                            <th className="px-6 py-4">Commande</th>
                            <th className="px-6 py-4">Client</th>
                            <th className="px-6 py-4">Articles</th>
                            <th className="px-6 py-4 text-center">Montant</th>
                            <th className="px-6 py-4 text-center">Statut</th>
                            <th className="px-6 py-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-brand-text-secondary italic font-sans">
                                    Aucune commande trouvée. Tentez une synchronisation.
                                </td>
                            </tr>
                        ) : (
                            orders.map(order => (
                                <tr key={order.id} className="hover:bg-brand-bg transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-heading text-[15px] text-brand-text-primary">
                                            {order.order_number}
                                        </div>
                                        <div className="text-xs font-sans text-brand-text-secondary mt-1">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium font-sans text-brand-text-primary">{order.customer_name}</div>
                                        <div className="text-xs font-sans text-brand-text-secondary">{order.shipping_address?.city || 'Pas de ville'}</div>
                                    </td>
                                    <td className="px-6 py-4 max-w-[200px]">
                                        <div className="text-brand-text-secondary font-sans truncate" title={order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}>
                                            {order.items.length} article(s) : {order.items[0]?.name} {order.items.length > 1 ? '...' : ''}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-medium font-sans text-brand-text-primary">
                                        €{order.total_price.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-1 text-xs font-sans font-semibold rounded-full border ${statusColors[order.status] || statusColors.cancelled}`}>
                                            {statusLabels[order.status] || order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {order.label_url ? (
                                            <a
                                                href={order.label_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs font-sans font-medium text-accent-pink bg-accent-pink/10 px-3 py-1.5 rounded-[6px] border border-accent-pink/20 hover:bg-accent-pink/20 transition-colors"
                                            >
                                                <Printer size={14} /> Imprimer Colissimo
                                            </a>
                                        ) : (
                                            <button
                                                onClick={() => generateLabel(order.id)}
                                                disabled={generatingLabelId === order.id || order.status === 'cancelled'}
                                                className="inline-flex items-center gap-1.5 text-xs font-sans font-medium text-brand-text-secondary bg-brand-surface px-3 py-1.5 rounded-[6px] border border-brand-border hover:bg-brand-bg hover:text-brand-dark transition-colors disabled:opacity-50"
                                            >
                                                {generatingLabelId === order.id ? (
                                                    <><RefreshCw size={14} className="animate-spin text-accent-pink" /> Génération...</>
                                                ) : (
                                                    <><Download size={14} /> Créer Étiquette</>
                                                )}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default OrdersPage
