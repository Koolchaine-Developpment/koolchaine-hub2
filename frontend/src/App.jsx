import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import DashboardLayout from './layout/DashboardLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProspectionLayout from './layout/ProspectionLayout'
import Dashboard from './pages/prospection/Dashboard'
import CompaniesPage from './pages/prospection/CompaniesPage'
import ContactsPage from './pages/prospection/ContactsPage'
import SequencesPage from './pages/prospection/SequencesPage'
import ShopifyLayout from './layout/ShopifyLayout'
import ShopifyDashboard from './pages/shopify/Dashboard'
import OrdersPage from './pages/shopify/OrdersPage'
import PackingListPage from './pages/shopify/PackingListPage'
import StockPage from './pages/shopify/StockPage'
import SocialPage from './pages/SocialPage'
import AnalyticsPage from './pages/AnalyticsPage'

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth()

    if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>

    if (!user) return <Navigate to="/login" />

    return children
}

function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route path="/" element={<DashboardLayout />}>
                    <Route index element={<Navigate to="/prospection" />} />

                    <Route path="prospection" element={<ProspectionLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="companies" element={<CompaniesPage />} />
                        <Route path="contacts" element={<ContactsPage />} />
                        <Route path="sequences" element={<SequencesPage />} />
                    </Route>

                    <Route path="shopify" element={<ShopifyLayout />}>
                        <Route index element={<ShopifyDashboard />} />
                        <Route path="orders" element={<OrdersPage />} />
                        <Route path="packing-list" element={<PackingListPage />} />
                        <Route path="stock" element={<StockPage />} />
                    </Route>

                    <Route path="social" element={<SocialPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                </Route>
            </Routes>
        </AuthProvider>
    )
}

export default App
