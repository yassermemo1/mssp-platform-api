import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/common/ToastProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navigation from './components/common/Navigation';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import OperationalDashboard from './pages/admin/Dashboard';
import ClientOverview from './pages/admin/clients/ClientOverview';
import ClientsListPage from './pages/ClientsListPage';
import CreateClientPage from './pages/CreateClientPage';
import ClientDetailsPage from './pages/ClientDetailsPage';
import EditClientPage from './pages/EditClientPage';
import AdminContractsListPage from './pages/admin/contracts/AdminContractsListPage';
import CreateContractPage from './pages/admin/contracts/CreateContractPage';
import AdminContractDetailsPage from './pages/admin/contracts/AdminContractDetailsPage';
import EditContractPage from './pages/admin/contracts/EditContractPage';
import AdminLicensePoolsListPage from './pages/admin/license-pools/AdminLicensePoolsListPage';
import CreateLicensePoolPage from './pages/admin/license-pools/CreateLicensePoolPage';
import EditLicensePoolPage from './pages/admin/license-pools/EditLicensePoolPage';
import LicensePoolDetailsPage from './pages/admin/license-pools/LicensePoolDetailsPage';
import LicensePoolAssignmentsPage from './pages/admin/license-pools/LicensePoolAssignmentsPage';
import LicenseDashboardPage from './pages/admin/license-pools/LicenseDashboardPage';
import ClientLicensesPage from './pages/admin/clients/ClientLicensesPage';
// Hardware Assets imports
import AdminHardwareAssetsListPage from './pages/admin/hardware-assets/AdminHardwareAssetsListPage';
import CreateHardwareAssetPage from './pages/admin/hardware-assets/CreateHardwareAssetPage';
import EditHardwareAssetPage from './pages/admin/hardware-assets/EditHardwareAssetPage';
// Hardware Assignments imports
import AdminHardwareAssignmentsListPage from './pages/admin/hardware-assignments/AdminHardwareAssignmentsListPage';
import CreateHardwareAssignmentPage from './pages/admin/hardware-assignments/CreateHardwareAssignmentPage';
import EditHardwareAssignmentPage from './pages/admin/hardware-assignments/EditHardwareAssignmentPage';
import ViewHardwareAssignmentPage from './pages/admin/hardware-assignments/ViewHardwareAssignmentPage';
// Financial Transactions imports
import FinancialTransactionsListPage from './pages/admin/financials/transactions/FinancialTransactionsListPage';
import FinancialTransactionFormPage from './pages/admin/financials/transactions/FinancialTransactionFormPage';
// Proposal imports
import ProposalDashboard from './pages/admin/proposals/ProposalDashboard';
import ProposalListPage from './pages/admin/proposals/ProposalListPage';
import ProposalEditPage from './pages/admin/proposals/ProposalEditPage';
// Team Assignment imports
import AdminTeamAssignmentsListPage from './pages/admin/team-assignments/AdminTeamAssignmentsListPage';
import CreateTeamAssignmentPage from './pages/admin/team-assignments/CreateTeamAssignmentPage';
import EditTeamAssignmentPage from './pages/admin/team-assignments/EditTeamAssignmentPage';
// Custom Fields imports
import AdminCustomFieldsPage from './pages/admin/custom-fields/AdminCustomFieldsPage';
import AdminCustomFieldsEntityPage from './pages/admin/custom-fields/AdminCustomFieldsEntityPage';
import AdminCustomFieldCreatePage from './pages/admin/custom-fields/AdminCustomFieldCreatePage';
import AdminCustomFieldEditPage from './pages/admin/custom-fields/AdminCustomFieldEditPage';
import './App.css';

/**
 * AuthenticatedApp Component
 * Handles routing for authenticated users
 */
const AuthenticatedApp: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated && <Navigation />}
      <Routes>
        <Route path="/login" element={<LoginRedirect />} />
        <Route path="/register" element={<RegisterRedirect />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute>
              <OperationalDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/clients" 
          element={
            <ProtectedRoute>
              <ClientsListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/clients/new" 
          element={
            <ProtectedRoute>
              <CreateClientPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/clients/:id" 
          element={
            <ProtectedRoute>
              <ClientDetailsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/clients/:id/edit" 
          element={
            <ProtectedRoute>
              <EditClientPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/clients/:id/overview" 
          element={
            <ProtectedRoute>
              <ClientOverview />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/contracts" 
          element={
            <ProtectedRoute>
              <AdminContractsListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/contracts/new" 
          element={
            <ProtectedRoute>
              <CreateContractPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/contracts/:id" 
          element={
            <ProtectedRoute>
              <AdminContractDetailsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/contracts/:id/edit" 
          element={
            <ProtectedRoute>
              <EditContractPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/license-pools" 
          element={
            <ProtectedRoute>
              <AdminLicensePoolsListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/license-pools/new" 
          element={
            <ProtectedRoute>
              <CreateLicensePoolPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/license-pools/:id" 
          element={
            <ProtectedRoute>
              <LicensePoolDetailsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/license-pools/:id/edit" 
          element={
            <ProtectedRoute>
              <EditLicensePoolPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/license-pools/:id/assignments" 
          element={
            <ProtectedRoute>
              <LicensePoolAssignmentsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/license-dashboard" 
          element={
            <ProtectedRoute>
              <LicenseDashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/clients/:clientId/licenses" 
          element={
            <ProtectedRoute>
              <ClientLicensesPage />
            </ProtectedRoute>
          } 
        />
        {/* Hardware Assets Routes */}
        <Route 
          path="/admin/hardware-assets" 
          element={
            <ProtectedRoute>
              <AdminHardwareAssetsListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/hardware-assets/new" 
          element={
            <ProtectedRoute>
              <CreateHardwareAssetPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/hardware-assets/:id/edit" 
          element={
            <ProtectedRoute>
              <EditHardwareAssetPage />
            </ProtectedRoute>
          } 
        />
        {/* Hardware Assignments Routes */}
        <Route 
          path="/admin/hardware-assignments" 
          element={
            <ProtectedRoute>
              <AdminHardwareAssignmentsListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/hardware-assignments/new" 
          element={
            <ProtectedRoute>
              <CreateHardwareAssignmentPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/hardware-assignments/:id" 
          element={
            <ProtectedRoute>
              <ViewHardwareAssignmentPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/hardware-assignments/:id/edit" 
          element={
            <ProtectedRoute>
              <EditHardwareAssignmentPage />
            </ProtectedRoute>
          } 
        />
        {/* Financial Transactions Routes */}
        <Route 
          path="/admin/financials/transactions" 
          element={
            <ProtectedRoute>
              <FinancialTransactionsListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/financials/transactions/new" 
          element={
            <ProtectedRoute>
              <FinancialTransactionFormPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/financials/transactions/:id/edit" 
          element={
            <ProtectedRoute>
              <FinancialTransactionFormPage />
            </ProtectedRoute>
          } 
        />
        {/* Proposal Routes */}
        <Route 
          path="/admin/proposals" 
          element={
            <ProtectedRoute>
              <ProposalDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/proposals/list" 
          element={
            <ProtectedRoute>
              <ProposalListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/proposals/:id/edit" 
          element={
            <ProtectedRoute>
              <ProposalEditPage />
            </ProtectedRoute>
          } 
        />
        {/* Team Assignment Routes */}
        <Route 
          path="/admin/team-assignments" 
          element={
            <ProtectedRoute>
              <AdminTeamAssignmentsListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/team-assignments/new" 
          element={
            <ProtectedRoute>
              <CreateTeamAssignmentPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/team-assignments/:id/edit" 
          element={
            <ProtectedRoute>
              <EditTeamAssignmentPage />
            </ProtectedRoute>
          } 
        />
        {/* Custom Fields Management Routes */}
        <Route path="/admin/settings/custom-fields" element={<AdminCustomFieldsPage />} />
        <Route path="/admin/settings/custom-fields/:entityType" element={<AdminCustomFieldsEntityPage />} />
        <Route path="/admin/settings/custom-fields/:entityType/new" element={<AdminCustomFieldCreatePage />} />
        <Route path="/admin/settings/custom-fields/edit/:definitionId" element={<AdminCustomFieldEditPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
};

/**
 * LoginRedirect Component
 * Redirects authenticated users away from login page
 */
const LoginRedirect: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <LoginPage />;
};

/**
 * RegisterRedirect Component
 * Redirects authenticated users away from register page
 */
const RegisterRedirect: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <RegisterPage />;
};

/**
 * Main App Component
 */
function App() {
  return (
    <AuthProvider>
      <ToastProvider position="top-right" maxToasts={5}>
        <Router>
          <div className="App">
            <AuthenticatedApp />
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
