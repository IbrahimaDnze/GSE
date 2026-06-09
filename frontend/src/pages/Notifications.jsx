import { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';

const typeConfig = {
  payment: { icon: 'fa-solid fa-credit-card', bg: '#d1fae5', text: '#047857', label: 'Paiement' },
  alert:   { icon: 'fa-solid fa-triangle-exclamation', bg: '#fecaca', text: '#b91c1c', label: 'Alerte' },
  event:   { icon: 'fa-solid fa-calendar', bg: '#d1fae5', text: '#047857', label: 'Événement' },
  grade:   { icon: 'fa-solid fa-file-pen', bg: '#e9d5ff', text: '#6d28d9', label: 'Notes' },
  enroll:  { icon: 'fa-solid fa-user-plus', bg: '#fef3c7', text: '#92400e', label: 'Inscription' },
};

const EMPTY_NOTIF = { type: 'event', title: '', body: '', important: false };

const Notifications = () => {
  const { notifications, markRead, markAllRead, removeNotification, addNotification } = useAppData();

  const [filter, setFilter] = useState('Tous');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_NOTIF);

  const unreadCount = notifications.filter(n => !n.read).length;
  const filtered = notifications.filter(n => {
    if (filter === 'Non lues') return !n.read;
    if (filter === 'Importantes') return n.important;
    return true;
  });

  const { showToast } = useToast();

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addNotification({ ...form });
      showToast('Notification ajoutée avec succès', 'success');
      setForm(EMPTY_NOTIF);
      setShowModal(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de l\'ajout', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h2><i className="fa-solid fa-bell" style={{ color: '#b8860b', marginRight: 8 }}></i> Notifications</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn btn-primary">
              <i className="fa-solid fa-check-double"></i> Tout marquer comme lu
            </button>
          )}
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <i className="fa-solid fa-plus"></i> Nouvelle notification
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {Object.entries(typeConfig).map(([k, v]) => (
          <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: v.bg, color: v.text }}>
            <i className={v.icon}></i> {v.label}
          </span>
        ))}
      </div>

      <div className="stu-filters">
        <div className="stu-filter-group">
          <i className="fa-solid fa-filter"></i>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="Tous">Toutes les notifications</option>
            <option value="Non lues">Non lues ({unreadCount})</option>
            <option value="Importantes">Importantes</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        {filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af' }}>
            <i className="fa-solid fa-bell" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.4 }}></i>
            <p style={{ fontSize: 14, fontWeight: 500 }}>Aucune notification</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ marginTop: 12 }}>
              <i className="fa-solid fa-plus"></i> Créer une notification
            </button>
          </div>
        ) : (
          <div>
            {filtered.map(n => {
              const cfg = typeConfig[n.type] || typeConfig.event;
              return (
                <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderBottom: '1px solid #f1f0ed', background: !n.read ? '#f0faf5' : 'transparent' }}>
                  <div style={{ flexShrink: 0, marginTop: 3 }}>
                    {!n.read
                      ? <i className="fa-solid fa-circle" style={{ fontSize: 8, color: '#0d7a5e' }}></i>
                      : <div style={{ width: 8, height: 8 }} />}
                  </div>
                  <div style={{ width: 36, height: 36, background: cfg.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={cfg.icon} style={{ color: cfg.text, fontSize: 14 }}></i>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: '#78716c', marginTop: 2, lineHeight: 1.4 }}>{n.body}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>{n.time}</span>
                        {n.important && <span style={{ fontSize: 10, background: '#fecaca', color: '#b91c1c', fontWeight: 700, padding: '1px 6px', borderRadius: 8 }}>!</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: cfg.bg, color: cfg.text }}>{cfg.label}</span>
                      {!n.read && (
                        <button onClick={() => markRead(n.id)} style={{ fontSize: 11, color: '#0d7a5e', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}>Marquer comme lu</button>
                      )}
                    </div>
                  </div>
                  <button onClick={async () => { try { await removeNotification(n.id); showToast('Notification supprimée', 'success'); } catch (err) { showToast('Erreur lors de la suppression', 'error'); } }}
                    style={{ padding: 4, border: 'none', background: 'transparent', color: '#d4cfc4', cursor: 'pointer', borderRadius: 6, flexShrink: 0, fontSize: 14 }}
                    title="Supprimer">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>Nouvelle notification</h3>
              <button onClick={() => setShowModal(false)} className="modal-close"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {Object.entries(typeConfig).map(([k, v]) => (
                    <option key={k} value={k}><i className={v.icon}></i> {v.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group required">
                <label>Titre</label>
                <input required type="text" placeholder="ex: Paiement reçu" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="form-group required">
                <label>Message</label>
                <textarea required rows={3} placeholder="Décrivez l'événement en détail…" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '0 24px' }}>
                <input type="checkbox" checked={form.important} onChange={e => setForm(f => ({ ...f, important: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#0d7a5e' }} />
                <span style={{ fontSize: 13, color: '#475569' }}>Marquer comme importante</span>
              </label>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-cancel">Annuler</button>
                <button type="submit" className="btn btn-primary">Envoyer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
