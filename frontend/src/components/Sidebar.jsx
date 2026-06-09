import { NavLink, useLocation } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { to: '/dashboard',     label: 'Tableau de bord', icon: 'fa-gauge-high' },
  { to: '/students',      label: 'Élèves',          icon: 'fa-graduation-cap' },
  { to: '/teachers',      label: 'Enseignants',     icon: 'fa-chalkboard-user' },
  { to: '/classes',       label: 'Classes',         icon: 'fa-school' },
  { to: '/enrollments',   label: 'Inscriptions',    icon: 'fa-file-pen' },
  { to: '/payments',      label: 'Paiements',       icon: 'fa-money-bill-transfer' },
  { to: '/grades',        label: 'Notes',           icon: 'fa-book-quran' },
  { to: '/schedule',      label: 'Emploi du temps', icon: 'fa-calendar-days' },
  { to: '/notifications', label: 'Notifications',   icon: 'fa-bell' },
  { to: '/reports',       label: 'Rapports',        icon: 'fa-chart-simple' },
  { to: '/cartes',        label: 'Cartes',          icon: 'fa-id-card' },
];

const bottomItems = [
  { to: '/profil',        label: 'Profil',          icon: 'fa-user-circle' },
  { to: '/settings',      label: 'Paramètres',     icon: 'fa-gear' },
];

const Sidebar = ({ onClose }) => {
  const location = useLocation();
  const { logo, schoolName } = useSchool();
  const { user: currentUser } = useAuth();
  const { notifications } = useAppData();

  const unreadCount = notifications.filter(n => !n.read).length;

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'A';

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            {logo ? (
              <img src={logo} alt="Logo" className="w-full h-full object-cover" style={{ borderRadius: 10 }} />
            ) : (
              <i className="fa-solid fa-quran"></i>
            )}
          </div>
          <div>
            <h2>{schoolName || 'École Privée'}</h2>
            <p>Gestion Scolaire</p>
          </div>
        </div>
        <button className="sidebar-close" onClick={onClose}>&times;</button>
      </div>

      <div className="sidebar-nav-wrap">
        <div className="sidebar-section-title">MENU PRINCIPAL</div>
        <ul className="sidebar-nav">
          {menuItems.map(m => (
            <li key={m.to}>
              <NavLink to={m.to} end={m.to === '/dashboard'} className={({ isActive }) => isActive ? 'active' : ''} onClick={onClose}>
                <i className={`fa-solid ${m.icon}`}></i>
                <span>{m.label}</span>
                {m.to === '/notifications' && unreadCount > 0 && (
                  <span className="notif-badge-sidebar">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="sidebar-section-title">PARAMÈTRES</div>
        <ul className="sidebar-nav">
          {bottomItems.map(m => (
            <li key={m.to}>
              <NavLink to={m.to} className={({ isActive }) => isActive ? 'active' : ''} onClick={onClose}>
                <i className={`fa-solid ${m.icon}`}></i>
                <span>{m.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-footer">
        <NavLink to="/profil" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {currentUser?.photo ? (
                <img src={currentUser.photo} alt="" className="w-full h-full object-cover rounded-[8px]" />
              ) : (
                initials
              )}
            </div>
            <div>
              <p className="sidebar-user-name">{currentUser?.name || 'Admin École'}</p>
              <p className="sidebar-user-role">{currentUser?.role || 'Administrateur'}</p>
            </div>
          </div>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
