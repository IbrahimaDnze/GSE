import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`layout${sidebarOpen ? ' sidebar-open' : ''}`}>
      <Sidebar onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <div className="main-content">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="layout-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
