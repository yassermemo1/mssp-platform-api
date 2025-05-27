import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navigation from './components/common/Navigation';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ClientsListPage from './pages/ClientsListPage';
import CreateClientPage from './pages/CreateClientPage';
import ClientDetailsPage from './pages/ClientDetailsPage';
import EditClientPage from './pages/EditClientPage';
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
      <Router>
        <div className="App">
          <AuthenticatedApp />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
