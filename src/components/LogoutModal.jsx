import React from 'react';
import { X } from 'lucide-react';

const COLORS = {
  background: '#F5F7FA',
  primary: '#2B6CB0',
  secondary: '#38A169',
  text: '#1A202C',
  error: '#E53E3E',
};

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full" style={{ backgroundColor: COLORS.background }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold" style={{ color: COLORS.text }}>
            Confirm Logout
          </h3>
          <button onClick={onClose}>
            <X size={20} style={{ color: COLORS.text }} />
          </button>
        </div>
        <p className="mb-6" style={{ color: COLORS.text }}>
          Are you sure you want to log out?
        </p>
        <div className="flex gap-4 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded"
            style={{ backgroundColor: COLORS.secondary, color: COLORS.background }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded"
            style={{ backgroundColor: COLORS.primary, color: COLORS.background }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;