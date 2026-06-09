import React from 'react';

const PageBanner = ({ label, title, subtitle, actions }) => (
  <div className="page-header">
    <div className="dashboard-welcome" style={{ margin: '6px 0 18px' }}>
      {label && <p className="text-xs font-semibold text-[#0d7a5e] uppercase tracking-wider mb-0.5">{label}</p>}
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
    {actions && <div className="flex gap-3 flex-shrink-0">{actions}</div>}
  </div>
);

export default PageBanner;
