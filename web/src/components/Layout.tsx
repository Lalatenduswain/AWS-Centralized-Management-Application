/**
 * Layout Component
 *
 * Provides consistent header and navigation across all pages.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <div className="header">
        <div className="header-content">
          <h2 style={{ margin: 0 }}>AWS Central Management</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <nav className="nav-links">
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/clients">Clients</Link>
            </nav>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>{user?.email}</span>
              <button onClick={handleLogout} className="button button-secondary">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      {children}
    </>
  );
};

export default Layout;
