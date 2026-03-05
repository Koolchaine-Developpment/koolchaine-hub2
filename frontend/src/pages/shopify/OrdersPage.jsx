import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Download, RefreshCw, Printer, AlertCircle } from 'lucide-react'

const statusColors = {
    unfulfilled: 'badge badge-yellow',
    fulfilled: 'badge badge-green',
    cancelled: 'badge badge-dark'
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
            const res = await axios.get('/api/v1/shopify/orders?status=any')
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
            await axios.post('/api/v1/shopify/orders/sync', {})
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
            const res = await axios.post(`/api/v1/shopify/orders/${orderId}/label`, {})
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
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <h3 className="page-title">
                    Gérer les Commandes
                </h3>
                <div className="flex gap-3">
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="btn btn-ghost disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                        {isSyncing ? "Synchronisation..." : "Synchroniser Shopify"}
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <table>
                    <thead>
                        <tr>
                            <th>Commande</th>
                            <th>Client</th>
                            <th>Articles</th>
                            <th style={{ textAlign: 'center' }}>Montant</th>
                            <th style={{ textAlign: 'center' }}>Statut</th>
                            <th style={{ textAlign: 'center' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--gray)', fontStyle: 'italic', padding: '48px 0' }}>
                                    Aucune commande trouvée. Tentez une synchronisation.
                                </td>
                            </tr>
                        ) : (
                            orders.map(order => (
                                <tr key={order.id}>
                                    <td>
                                        <div style={{ fontWeight: 600, color: 'var(--dark)' }}>
                                            {order.order_number}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--gray)', marginTop: '4px' }}>
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 500, color: 'var(--dark)' }}>{order.customer_name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--gray)', marginTop: '4px' }}>{order.shipping_address?.city || 'Pas de ville'}</div>
                                    </td>
                                    <td style={{ maxWidth: '200px' }}>
                                        <div style={{ color: 'var(--gray)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}>
                                            {order.items.length} article(s) : {order.items[0]?.name} {order.items.length > 1 ? '...' : ''}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--dark)' }}>
                                        €{order.total_price.toFixed(2)}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className={statusColors[order.status] || statusColors.cancelled}>
                                            {statusLabels[order.status] || order.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {order.label_url ? (
                                            <a
                                                href={order.label_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="btn btn-pink"
                                                style={{ padding: '8px 12px', fontSize: '11px', gap: '6px' }}
                                            >
                                                <Printer size={14} /> Imprimer Colissimo
                                            </a>
                                        ) : (
                                            <button
                                                onClick={() => generateLabel(order.id)}
                                                disabled={generatingLabelId === order.id || order.status === 'cancelled'}
                                                className="btn btn-ghost disabled:opacity-50"
                                                style={{ padding: '8px 12px', fontSize: '11px', gap: '6px' }}
                                            >
                                                {generatingLabelId === order.id ? (
                                                    <><RefreshCw size={14} style={{ color: 'var(--pink)' }} className="animate-spin" /> Génération...</>
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
