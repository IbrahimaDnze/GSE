import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="pt-14 p-6 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
