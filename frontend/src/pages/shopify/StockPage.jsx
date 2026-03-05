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
                const res = await axios.get('/api/v1/shopify/stock')
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
        if (current <= 0) return { label: 'Épuisé', color: 'badge badge-dark' }
        if (current <= threshold) return { label: 'Critique', color: 'badge badge-pink' }
        return { label: 'En stock', color: 'badge badge-green' }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h3 className="page-title">
                        Gestion des Stocks
                    </h3>
                    <p className="page-subtitle">Définissez des seuils d'alerte pour recevoir des notifications.</p>
                </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <table>
                    <thead>
                        <tr>
                            <th>Produit</th>
                            <th style={{ textAlign: 'center' }}>SKU</th>
                            <th style={{ textAlign: 'center' }}>Stock Actuel</th>
                            <th style={{ textAlign: 'center' }}>Seuil d'Alerte</th>
                            <th style={{ textAlign: 'center' }}>État</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--gray)', fontStyle: 'italic', padding: '48px 0' }}>Chargement des données...</td>
                            </tr>
                        ) : stock.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--gray)', fontStyle: 'italic', padding: '48px 0' }}>
                                    <div className="flex flex-col items-center">
                                        <TrendingDown style={{ color: 'var(--gray)', marginBottom: '12px', opacity: 0.5 }} size={32} />
                                        <p>Aucune donnée de stock trouvée. Le cron de synchronisation n'a peut-être pas encore tourné.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            stock.map(item => {
                                const status = getStockStatus(item.current_stock, item.threshold)
                                return (
                                    <tr key={item.id}>
                                        <td style={{ fontWeight: 500, color: 'var(--dark)' }}>
                                            {item.product_name}
                                        </td>
                                        <td style={{ textAlign: 'center', fontSize: '12px', color: 'var(--gray)' }}>
                                            {item.product_id}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{ fontSize: '18px', fontWeight: 600, color: item.current_stock <= item.threshold ? 'var(--pink)' : 'var(--dark)', fontFamily: '"Archivo Black", sans-serif' }}>
                                                {item.current_stock}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <input
                                                type="number"
                                                defaultValue={item.threshold}
                                                style={{ width: '80px', textAlign: 'center', padding: '6px' }}
                                                title="Modifications statiques - Démo"
                                            />
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={status.color} style={{ margin: '0 auto' }}>
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
