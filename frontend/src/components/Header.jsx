import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';

const Header = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { notifications, markAllRead, markRead } = useAppData();
  const { user: currentUser, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const ref = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClick = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'A';

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="sidebar-toggle" onClick={onToggleSidebar}>
          <i className="fa-solid fa-bars"></i>
        </button>
        <div className="topbar-search">
          <i className="fa-solid fa-search"></i>
          <input type="text" placeholder="Rechercher un élève, une classe..." />
        </div>
      </div>
      <div className="topbar-right">
        <div className="topbar-icon" ref={notifRef} onClick={() => setNotifOpen(!notifOpen)}>
          <i className="fa-solid fa-bell"></i>
          {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          {notifOpen && (
            <div className="topbar-dropdown notif-dropdown">
              <div className="notif-dropdown-header">
                <span>Notifications</span>
                {unreadCount > 0 && <button className="notif-mark-all" onClick={(e) => { e.stopPropagation(); markAllRead(); }}>Tout marquer lu</button>}
              </div>
              <div className="notif-dropdown-body">
                {notifications.length === 0 ? (
                  <div className="notif-empty">Aucune notification</div>
                ) : notifications.slice(0, 10).map(n => (
                  <div key={n.id} className={`notif-item ${n.read ? '' : 'notif-unread'}`} onClick={() => { if (!n.read) markRead(n.id); }}>
                    <div className="notif-icon"><i className="fa-solid fa-circle-info"></i></div>
                    <div className="notif-content">
                      <div className="notif-message">{n.title || n.body || n.message}</div>
                      <div className="notif-time">{n.time || n.date}</div>
                    </div>
                    {!n.read && <div className="notif-dot"></div>}
                  </div>
                ))}
              </div>
              <div className="notif-view-all" onClick={() => { navigate('/notifications'); setNotifOpen(false); }}>
                Voir toutes les notifications
              </div>
            </div>
          )}
        </div>
        <div className="topbar-divider"></div>
        <div className="topbar-profile" ref={ref} onClick={() => setOpen(!open)}>
          <div className="topbar-avatar">{initials}</div>
          <div className="topbar-profile-info">
            <span className="topbar-profile-name">{currentUser?.name || 'Admin École'}</span>
            <span className="topbar-profile-role">{currentUser?.role || 'Administrateur'}</span>
          </div>
          {open && (
            <div className="topbar-dropdown">
              <div className="topbar-dropdown-item" onClick={() => { setOpen(false); navigate('/settings'); }}>
                <i className="fa-solid fa-user-circle"></i>
                <span>Mon Profil</span>
              </div>
              <div className="topbar-dropdown-divider"></div>
              <div className="topbar-dropdown-item topbar-dropdown-danger" onClick={handleLogout}>
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
                <span>Déconnexion</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
