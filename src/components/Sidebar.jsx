import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Video, MessageSquare, Calendar, LogOut, X, Menu, Megaphone, Trophy } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import LogoutModal from './LogoutModal';

const COLORS = {
  background: '#F5F7FA',
  primary: '#2B6CB0',
  secondary: '#38A169',
  text: '#1A202C',
  error: '#E53E3E',
};

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { adminLogout } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Videos', path: '/admin/videos', icon: Video },
    { name: 'Comments', path: '/admin/comments', icon: MessageSquare },
    { name: 'Events', path: '/admin/events', icon: Calendar },
    { name: 'Notifications', path: '/admin/notifications', icon: Megaphone },
    { name: 'Top 10', path: '/admin/top10', icon: Trophy },
    { name: 'Logout', path: '#', icon: LogOut, onClick: () => setIsModalOpen(true) },
  ];

  return (
    <>
      <div
        className={`fixed inset-y-0 left-0 w-64 transform bg-white shadow-lg md:shadow-none transition-transform duration-300 ease-in-out z-30 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ backgroundColor: COLORS.background }}
      >
        <div className="flex items-center justify-between p-4 md:hidden">
          <h2 className="text-xl font-semibold" style={{ color: COLORS.text }}>
            Admin Menu
          </h2>
          <button onClick={toggleSidebar}>
            <X size={24} style={{ color: COLORS.text }} />
          </button>
        </div>
        <nav className="flex flex-col gap-2 p-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={item.onClick || toggleSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 p-2 rounded hover:bg-opacity-10 hover:bg-blue-500 ${
                  isActive && item.name !== 'Logout' ? 'font-bold' : ''
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive && item.name !== 'Logout' ? COLORS.primary : 'transparent',
                color: COLORS.text,
              })}
            >
              <item.icon size={20} style={{ color: COLORS.text }} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 bg-opacity-50 md:hidden z-20"
          onClick={toggleSidebar}
        />
      )}
      <LogoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => {
          adminLogout();
          setIsModalOpen(false);
        }}
      />
    </>
  );
};

export default Sidebar;