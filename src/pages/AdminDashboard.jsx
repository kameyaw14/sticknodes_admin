import React from 'react';
import { useAppContext } from '../contexts/AppContext';

const COLORS = {
  background: '#F5F7FA',
  primary: '#2B6CB0',
  secondary: '#38A169',
  text: '#1A202C',
  error: '#E53E3E',
};

const AdminDashboard = () => {
  const { admin } = useAppContext();

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold" style={{ color: COLORS.text }}>
        Welcome, {admin?.name || 'Admin'}
      </h2>
      <p className="mt-4" style={{ color: COLORS.text }}>
        Admin Dashboard
      </p>
    </div>
  );
};

export default AdminDashboard;