import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import VerifyEmailPage from './pages/auth/VerifyEmailPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ProductsPage from './pages/public/ProductsPage.jsx';
import ProductDetailPage from './pages/public/ProductDetailPage.jsx';
import TermsPage from './pages/TermsPage.jsx';
import PrivacyPage from './pages/PrivacyPage.jsx';
import ContactPage from './pages/public/ContactPage.jsx';

import AdminDashboard from './pages/protected/AdminDashboard.jsx';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage.jsx';
import AdminProductsPage from './pages/admin/AdminProductsPage.jsx';
import AdminLocationsPage from './pages/admin/AdminLocationsPage.jsx';
import AuthAuditLogs from './pages/admin/AuthAuditLogs.jsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx';

import StaffDashboard from './pages/protected/StaffDashboard.jsx';
import WarehouseDashboard from './pages/protected/WarehouseDashboard.jsx';
import CustomerAccount from './pages/protected/CustomerAccount.jsx';
import ProfilePage from './pages/protected/ProfilePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import GuestRoute from './components/auth/GuestRoute.jsx';
import InventoryPage from './pages/inventory/InventoryPage.jsx';
import TransferRequestsPage from './pages/transfers/TransferRequestsPage.jsx';
import TransferRequestDetailPage from './pages/transfers/TransferRequestDetailPage.jsx';
import ApplicationFormPage from './pages/applications/ApplicationFormPage.jsx';
import MyApplicationsPage from './pages/applications/MyApplicationsPage.jsx';
import ApplicationManagementPage from './pages/applications/ApplicationManagementPage.jsx';
import ApplicationDetailPage from './pages/applications/ApplicationDetailPage.jsx';
import NotificationsPage from './pages/notifications/NotificationsPage.jsx';
import ReportsPage from './pages/reports/ReportsPage.jsx';
import useInactivityLogout from './hooks/useInactivityLogout.js';

export function App() {
  useInactivityLogout();
  return (
    <MainLayout>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/verify-email" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />

        {/* Protected Role-Based Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminCategoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products/:id"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ProductDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/locations"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLocationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={<ProtectedRoute allowedRoles={['admin']}><AdminUsersPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AuthAuditLogs />
            </ProtectedRoute>
          }
        />

        {/* Protected Role-Based Staff & Customer Routes */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={['admin', 'branch_staff']}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/warehouse"
          element={
            <ProtectedRoute allowedRoles={['admin', 'warehouse_staff']}>
              <WarehouseDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute allowedRoles={['admin', 'branch_staff', 'warehouse_staff']}>
              <InventoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transfers"
          element={<ProtectedRoute allowedRoles={['admin', 'branch_staff', 'warehouse_staff']}><TransferRequestsPage /></ProtectedRoute>}
        />
        <Route
          path="/transfers/:id"
          element={<ProtectedRoute allowedRoles={['admin', 'branch_staff', 'warehouse_staff']}><TransferRequestDetailPage /></ProtectedRoute>}
        />
        <Route
          path="/products/:productId/apply"
          element={<ProtectedRoute allowedRoles={['customer']}><ApplicationFormPage /></ProtectedRoute>}
        />
        <Route
          path="/account/applications"
          element={<ProtectedRoute allowedRoles={['customer']}><MyApplicationsPage /></ProtectedRoute>}
        />
        <Route
          path="/account/products"
          element={<ProtectedRoute allowedRoles={['customer']}><ProductsPage /></ProtectedRoute>}
        />
        <Route
          path="/account/products/:id"
          element={<ProtectedRoute allowedRoles={['customer']}><ProductDetailPage /></ProtectedRoute>}
        />
        <Route
          path="/manage/applications"
          element={<ProtectedRoute allowedRoles={['admin', 'branch_staff']}><ApplicationManagementPage /></ProtectedRoute>}
        />
        <Route
          path="/applications/:id"
          element={<ProtectedRoute><ApplicationDetailPage /></ProtectedRoute>}
        />
        <Route
          path="/notifications"
          element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>}
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['admin', 'branch_staff', 'warehouse_staff']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <CustomerAccount />
            </ProtectedRoute>
          }
        />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
