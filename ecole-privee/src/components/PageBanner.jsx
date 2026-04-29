import React from 'react';

/**
 * Reusable gradient banner used at the top of every page.
 * @param {string} label  - small uppercase label (e.g. "Gestion")
 * @param {string} title  - main heading
 * @param {string} subtitle - sub-text
 * @param {React.ReactNode} actions - buttons to display on the right
 */
const PageBanner = ({ label, title, subtitle, actions }) => (
  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-800 to-primary-700 p-6 text-white shadow-lg">
    <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
    <div className="absolute -right-2 top-12 h-24 w-24 rounded-full bg-white/5" />
    <div className="absolute right-32 -bottom-6 h-20 w-20 rounded-full bg-white/5" />
    <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        {label && (
          <p className="text-primary-200 text-xs font-semibold uppercase tracking-widest mb-1">{label}</p>
        )}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-primary-100/80 mt-1 text-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-3 flex-shrink-0">{actions}</div>}
    </div>
  </div>
);

export default PageBanner;
