import { useState } from 'react';
import PageBanner from '../components/PageBanner';
import { useAppData } from '../context/AppDataContext';

const typeConfig = {
  payment: { icon: '💰', bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Paiement'    },
  alert:   { icon: '⚠️', bg: 'bg-red-100',     text: 'text-red-700',     label: 'Alerte'      },
  event:   { icon: '📅', bg: 'bg-primary-100', text: 'text-primary-700', label: 'Événement'   },
  grade:   { icon: '📝', bg: 'bg-violet-100',  text: 'text-violet-700',  label: 'Notes'       },
  enroll:  { icon: '📋', bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Inscription' },
};

const EMPTY_NOTIF = { type: 'event', title: '', body: '', important: false };

const Notifications = () => {
  const { notifications, markRead, markAllRead, removeNotification, addNotification } = useAppData();

  const [filter, setFilter]       = useState('Tous');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(EMPTY_NOTIF);

  const unreadCount = notifications.filter(n => !n.read).length;
  const tabs = ['Tous', 'Non lues', 'Importantes'];
  const filtered = notifications.filter(n => {
    if (filter === 'Non lues')    return !n.read;
    if (filter === 'Importantes') return n.important;
    return true;
  });

  const handleAdd = (e) => {
    e.preventDefault();
    addNotification({ ...form });
    setForm(EMPTY_NOTIF);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <PageBanner
        label="Centre de messages"
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} nouvelle${unreadCount > 1 ? 's' : ''} notification${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour'}
        actions={
          <div className="flex gap-3">
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors px-4 py-2 text-sm font-medium border border-white/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Tout marquer comme lu
              </button>
            )}
            <button onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white text-primary-700 hover:bg-primary-50 transition-colors px-4 py-2 text-sm font-semibold shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Nouvelle notification
            </button>
          </div>
        }
      />

      {/* Type legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(typeConfig).map(([k, v]) => (
          <span key={k} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${v.bg} ${v.text}`}>
            {v.icon} {v.label}
          </span>
        ))}
      </div>

      {/* Tabs + list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="flex gap-1 px-5 pt-4 border-b border-slate-100">
          {tabs.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-xl border-b-2 -mb-px transition-colors ${
                filter === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              {t}
              {t === 'Non lues' && unreadCount > 0 && (
                <span className="ml-1.5 text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <span className="text-4xl mb-3">🔔</span>
              <p className="text-sm font-medium">Aucune notification</p>
              <button onClick={() => setShowModal(true)} className="mt-3 px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 transition-colors">
                Créer une notification
              </button>
            </div>
          )}
          {filtered.map(n => {
            const cfg = typeConfig[n.type] || typeConfig.event;
            return (
              <div key={n.id} className={`flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group ${!n.read ? 'bg-primary-50/40' : ''}`}>
                <div className="flex-shrink-0 mt-1">
                  {!n.read
                    ? <div className="w-2 h-2 rounded-full bg-primary-600 mt-1" />
                    : <div className="w-2 h-2" />}
                </div>
                <div className={`w-10 h-10 ${cfg.bg} rounded-xl flex items-center justify-center text-lg flex-shrink-0`}>{cfg.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm font-semibold ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-[11px] text-slate-400">{n.time}</span>
                      {n.important && <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">!</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                    {!n.read && (
                      <button onClick={() => markRead(n.id)} className="text-[11px] text-primary-600 hover:underline font-medium">Marquer comme lu</button>
                    )}
                  </div>
                </div>
                <button onClick={() => removeNotification(n.id)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Notification Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Nouvelle notification</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                  {Object.entries(typeConfig).map(([k, v]) => (
                    <option key={k} value={k}>{v.icon} {v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Titre *</label>
                <input required type="text" placeholder="ex: Paiement reçu" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Message *</label>
                <textarea required rows={3} placeholder="Décrivez l'événement en détail…" value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none" />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.important}
                  onChange={e => setForm(f => ({ ...f, important: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                <span className="text-sm text-slate-600">Marquer comme importante</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">Annuler</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">Envoyer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
