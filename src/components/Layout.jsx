import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

const COLORS = {
  background: '#F5F7FA',
  primary: '#2B6CB0',
  secondary: '#38A169',
  text: '#1A202C',
  error: '#E53E3E',
};

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 md:ml-64">
        <header className="p-4 md:hidden">
          <button onClick={toggleSidebar}>
            <Menu size={24} style={{ color: COLORS.text }} />
          </button>
        </header>
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
};

export default Layout;