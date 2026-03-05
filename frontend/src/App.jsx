import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import DashboardLayout from './layout/DashboardLayout'
import LoginPage from './pages/LoginPage'
import ProspectionLayout from './layout/ProspectionLayout'
import Dashboard from './pages/prospection/Dashboard'
import CompaniesPage from './pages/prospection/CompaniesPage'
import ContactsPage from './pages/prospection/ContactsPage'
import CampaignsPage from './pages/prospection/CampaignsPage'
import SequencesPage from './pages/prospection/SequencesPage'
import TemplatesPage from './pages/prospection/TemplatesPage'
import ShopifyLayout from './layout/ShopifyLayout'
import ShopifyDashboard from './pages/shopify/Dashboard'
import OrdersPage from './pages/shopify/OrdersPage'
import PackingListPage from './pages/shopify/PackingListPage'
import StockPage from './pages/shopify/StockPage'

import AnalyticsPage from './pages/AnalyticsPage'
import SimulateurPage from './pages/SimulateurPage'
import DashboardPage from './pages/DashboardPage'

import SocialLayout from './layout/SocialLayout'
import SandboxPage from './pages/social/SandboxPage'
import ToneOfVoicePage from './pages/settings/ToneOfVoicePage'
import LoginCallbackPage from './pages/LoginCallbackPage'

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth()

    if (loading) return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FAF9F6',
            fontFamily: 'Poppins, sans-serif'
        }}>
            <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(245, 57, 90, 0.1)',
                borderTop: '3px solid #F5395A',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '16px'
            }}></div>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
            <p style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#2D2830',
                letterSpacing: '0.02em'
            }}>
                Chargement...
            </p>
        </div>
    )

    if (!user) return <Navigate to="/login" />

    return children
}

function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/login/callback" element={<LoginCallbackPage />} />

                <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                    <Route index element={<DashboardPage />} />

                    <Route path="prospection" element={<ProspectionLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="companies" element={<CompaniesPage />} />
                        <Route path="contacts" element={<ContactsPage />} />
                        <Route path="campaigns" element={<CampaignsPage />} />
                        <Route path="sequences" element={<SequencesPage />} />
                        <Route path="templates" element={<TemplatesPage />} />
                    </Route>

                    <Route path="shopify" element={<ShopifyLayout />}>
                        <Route index element={<ShopifyDashboard />} />
                        <Route path="orders" element={<OrdersPage />} />
                        <Route path="packing-list" element={<PackingListPage />} />
                        <Route path="stock" element={<StockPage />} />
                    </Route>


                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="simulateur" element={<SimulateurPage />} />

                    <Route path="social" element={<SocialLayout />}>
                        <Route index element={<Navigate to="/social/sandbox" replace />} />
                        <Route path="sandbox" element={<SandboxPage />} />
                    </Route>

                    <Route path="settings/agents/social" element={<ToneOfVoicePage />} />
                </Route>
            </Routes>
        </AuthProvider>
    )
}

export default App
