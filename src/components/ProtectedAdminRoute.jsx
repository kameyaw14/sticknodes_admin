import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { Loader2 } from 'lucide-react';

const COLORS = {
  background: '#F5F7FA',
  primary: '#2B6CB0',
  secondary: '#38A169',
  text: '#1A202C',
  error: '#E53E3E',
};

const ProtectedAdminRoute = ({ children }) => {
  const { isAdminAuthenticated, isCheckingAdminAuth } = useAppContext();

  if (isCheckingAdminAuth) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.background }}
      >
        <Loader2 className="animate-spin" size={40} style={{ color: COLORS.primary }} />
      </div>
    );
  }

  return isAdminAuthenticated ? children : <Navigate to="/admin/login" />;
};

export default ProtectedAdminRoute;