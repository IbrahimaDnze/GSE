import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    students, teachers, classes, payments, grades,
    calendarEvents, notifications,
  } = useAppData();
  const { user: currentUser } = useAuth();

  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({ date: '', title: '', time: '08:00', colorIndex: 0 });
  const [eventError, setEventError] = useState('');
  const { showToast } = useToast();

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const year = new Date().getFullYear();
  const schoolYear = `${year - 1} - ${year}`;

  /* ── Attendance Stats ──────────────────────────────── */
  const activeStudents = students.filter(s => s.status === 'Actif').length;
  const inactiveStudents = students.filter(s => s.status === 'Inactif').length;
  const present = activeStudents;
  const absent = inactiveStudents;
  const totalStudents = students.length || 1;
  const pctPresent = Math.round((present / totalStudents) * 100);
  const pctAbsent = Math.round((absent / totalStudents) * 100);

  /* ── Teacher Stats ─────────────────────────────────── */
  const activeTeachers = teachers.filter(t => t.status === 'Actif').length;
  const inactiveTeachers = teachers.filter(t => t.status === 'Inactif').length;

  /* ── Payment Stats ─────────────────────────────────── */
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const monthlyPayments = payments.filter(p => {
    const now = new Date();
    const monthStr = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return p.date?.includes(monthStr) || p.date?.includes(String(now.getMonth() + 1));
  });
  const monthlyCollected = monthlyPayments.reduce((s, p) => s + p.amount, 0);
  const uniqPayees = new Set(payments.filter(p => p.status === 'Payé').map(p => p.student)).size;
  const uniqLate = new Set(payments.filter(p => p.status === 'En retard').map(p => p.student)).size;
  const uniqUnpaid = new Set(payments.filter(p => p.status === 'Impayé').map(p => p.student)).size;
  const totalUnpaid = Math.max(0, activeStudents - uniqPayees);
  const objectif = 300000;
  const pctAtteint = Math.min(100, Math.round((totalCollected / objectif) * 100));

  /* ── Class Distribution ───────────────────────────── */
  const CHART_COLORS = ['#059669', '#4f46e5', '#d97706', '#0891b2', '#db2777', '#7c3aed', '#e11d48', '#0284c7'];
  const classCounts = {};
  students.forEach(s => { if (s.class) classCounts[s.class] = (classCounts[s.class] || 0) + 1; });
  const classDistribution = classes.map((c, i) => ({
    niveau: c.name,
    count: students.filter(s => s.class === c.name).length,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
  const maxClassCount = Math.max(...classDistribution.map(c => c.count), 1);

  /* ── Meilleurs élèves ─────────────────────────────── */
  const EXCLUDED_KEYS = new Set(['_id','id','studentName','matricule','class','trimestre','photo','createdAt','updatedAt','__v']);
  const topStudents = useMemo(() => {
    const subjects = [...new Set(grades.flatMap(g => Object.keys(g).filter(k => !EXCLUDED_KEYS.has(k) && typeof g[k] === 'number')))];
    const studentAverages = {};
    grades.forEach(g => {
      const vals = subjects.map(s => Number(g[s])).filter(v => !isNaN(v));
      if (vals.length === 0) return;
      const rawAvg = vals.reduce((a, b) => a + b, 0) / vals.length;
      const pct = Math.round((rawAvg / 20) * 100);
      if (!studentAverages[g.studentName] || pct > studentAverages[g.studentName].avg) {
        studentAverages[g.studentName] = { name: g.studentName, class: g.class, avg: pct, photo: g.photo || students.find(s => s.name === g.studentName)?.photo };
      }
    });
    return Object.values(studentAverages).sort((a, b) => b.avg - a.avg).slice(0, 5);
  }, [grades, students]);

  const bestAvg = topStudents.length > 0 ? topStudents[0].avg : 0;

  /* ── Dashboard Events ─────────────────────────────── */
  const dashboardEvents = calendarEvents.slice(0, 4).map(e => ({
    day: e.day,
    month: e.month,
    title: e.title,
    detail: e.time || '',
  }));

  /* ── Announcements ────────────────────────────────── */
  const dashboardAnnouncements = useMemo(() => {
    return notifications
      .filter(n => n.important)
      .slice(0, 5)
      .map(n => ({
        badge: n.important ? 'Important' : 'Info',
        badgeBg: n.important ? '#fef2f2' : '#ecfdf5',
        badgeColor: n.important ? '#b91c1c' : '#0d7a5e',
        title: n.title || n.body?.slice(0, 40) || 'Notification',
        text: n.body || n.title || '',
      }));
  }, [notifications]);

  const newThisYear = students.filter(s => {
    if (!s.id) return false;
    return true;
  }).length;

  const userName = currentUser?.name?.split(' ')[0] || 'Admin';

  const EVENT_COLORS = [
    { label: 'Vert',    color: 'bg-primary-600', textColor: 'text-primary-700', bgLight: 'bg-primary-50' },
    { label: 'Or',      color: 'bg-gold-600',    textColor: 'text-gold-700',    bgLight: 'bg-gold-50'   },
    { label: 'Violet',  color: 'bg-violet-600',  textColor: 'text-violet-700',  bgLight: 'bg-violet-50'  },
    { label: 'Orange',  color: 'bg-orange-500',  textColor: 'text-orange-700',  bgLight: 'bg-orange-50'  },
    { label: 'Rose',    color: 'bg-pink-500',    textColor: 'text-pink-700',    bgLight: 'bg-pink-50'    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Welcome ────────────────────────────────────── */}
      <div className="dashboard-welcome">
        <h1>Bienvenue, {userName}</h1>
        <p>Voici un aperçu complet de la gestion de votre établissement.</p>
      </div>

      {/* ── Row 1: 4 Stat Cards ────────────────────────── */}
      <div className="dash-cards-4">
        <div className="dash-stat-card">
          <div className="dash-stat-icon" style={{ background: '#ecfdf5', color: '#0d7a5e' }}>
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
          <div>
            <div className="dash-stat-value">{activeStudents}</div>
            <div className="dash-stat-label">Total élèves</div>
            <div className="dash-stat-sub"><i className="fa-solid fa-arrow-up" style={{ color: '#0d7a5e' }}></i> +{students.filter(s => s.status === 'Actif').length} actifs</div>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon" style={{ background: '#f0faf5', color: '#0d7a5e' }}>
            <i className="fa-solid fa-chalkboard-user"></i>
          </div>
          <div>
            <div className="dash-stat-value">{activeTeachers}</div>
            <div className="dash-stat-label">Total enseignants</div>
            <div className="dash-stat-sub">{inactiveTeachers} inactif{inactiveTeachers > 1 ? 's' : ''}</div>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon" style={{ background: '#fffbeb', color: '#b8860b' }}>
            <i className="fa-solid fa-exclamation-triangle"></i>
          </div>
          <div>
            <div className="dash-stat-value">{totalUnpaid}</div>
            <div className="dash-stat-label">Élèves impayés</div>
            <div className="dash-stat-sub">{activeStudents > 0 ? `${Math.round((totalUnpaid / activeStudents) * 100)}% des élèves` : 'Aucune donnée'}</div>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon" style={{ background: '#fffbeb', color: '#b8860b' }}>
            <i className="fa-solid fa-coins"></i>
          </div>
          <div>
            <div className="dash-stat-value">{monthlyCollected.toLocaleString('fr')} €</div>
            <div className="dash-stat-label">Paiements du mois</div>
            <div className="dash-stat-sub">{uniqPayees} payeur{uniqPayees > 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>

      {/* ── Row 2: 3 Columns ───────────────────────────── */}
      <div className="dash-grid-3">

        {/* Paiements récents */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3><i className="fa-solid fa-credit-card" style={{ color: '#0d7a5e' }}></i> Paiements récents</h3>
            <Link to="/payments" className="dash-btn-link">Voir tout <i className="fa-solid fa-arrow-right" style={{ fontSize: 10 }}></i></Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {(() => {
              const recent = [...payments]
                .sort((a, b) => new Date(b.rawDate || b.datePaiement || b.createdAt || 0) - new Date(a.rawDate || a.datePaiement || a.createdAt || 0))
                .slice(0, 5);
              return recent.length > 0 ? recent.map((p, i) => (
                <div key={p.id || i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                  borderBottom: i < recent.length - 1 ? '1px solid #f0ede8' : 'none'
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f1f0ed', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#a8a29e' }}>
                    {p.photo ? (
                      <img src={p.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <i className="fa-solid fa-user"></i>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937' }}>{p.student || p.studentName || '—'}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{p.date || ''}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0d7a5e' }}>{p.amount?.toLocaleString('fr') || '0'} GNF</div>
                    <span style={{
                      display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '1px 8px', borderRadius: 10,
                      background: p.status === 'Payé' ? '#ecfdf5' : p.status === 'En retard' ? '#fffbeb' : '#fef2f2',
                      color: p.status === 'Payé' ? '#065f46' : p.status === 'En retard' ? '#b8860b' : '#b91c1c'
                    }}>{p.status || 'Payé'}</span>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af', fontSize: 12 }}>
                  <i className="fa-solid fa-credit-card" style={{ fontSize: 24, display: 'block', marginBottom: 8, opacity: 0.4 }}></i>
                  Aucun paiement récent
                </div>
              );
            })()}
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
            <i className="fa-solid fa-arrow-up"></i> {payments.length} paiement{payments.length > 1 ? 's' : ''} au total
          </div>
        </div>

        {/* Suivi financier */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3><i className="fa-solid fa-coins" style={{ color: '#b8860b' }}></i> Suivi financier</h3>
            <Link to="/payments" className="dash-btn-link">Détails <i className="fa-solid fa-arrow-right" style={{ fontSize: 10 }}></i></Link>
          </div>
          <div className="payment-main-row">
            <div className="payment-collected">
              <div className="payment-amount">{totalCollected.toLocaleString('fr')} €</div>
              <div className="payment-sub">Total collecté</div>
            </div>
            <div className="payment-objectif">
              <div className="payment-amount-sm">{objectif.toLocaleString('fr')} €</div>
              <div className="payment-sub">Objectif mensuel</div>
            </div>
          </div>
          <div className="payment-progress-row">
            <div className="payment-progress-bar">
              <div className="payment-progress-fill" style={{ width: `${pctAtteint}%` }}></div>
            </div>
            <span className="payment-progress-text">{pctAtteint}%</span>
          </div>
          <div className="payment-flag"><i className="fa-solid fa-flag"></i> {pctAtteint}% de l'objectif atteint</div>
          <div className="payment-stats">
            <div className="payment-stat-box" style={{ background: '#ecfdf5' }}>
              <div className="payment-stat-val" style={{ color: '#0d7a5e' }}>{uniqPayees}</div>
              <div className="payment-stat-label green">Élèves ayant payé</div>
            </div>
            <div className="payment-stat-box" style={{ background: '#fef2f2' }}>
              <div className="payment-stat-val" style={{ color: '#b91c1c' }}>{totalUnpaid}</div>
              <div className="payment-stat-label red">Élèves impayés</div>
            </div>
          </div>
        </div>

        {/* Répartition des classes */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3><i className="fa-solid fa-layer-group" style={{ color: '#0d7a5e' }}></i> Répartition des classes</h3>
            <Link to="/classes" className="dash-btn-link">Voir tout <i className="fa-solid fa-arrow-right" style={{ fontSize: 10 }}></i></Link>
          </div>
          <div className="class-distribution">
            {classDistribution.map((c, i) => (
              <div className="class-item" key={i}>
                <div className="class-item-header">
                  <span className="class-level">{c.niveau}</span>
                  <span className="class-count">{c.count} élève{c.count > 1 ? 's' : ''}</span>
                </div>
                <div className="class-bar">
                  <div className="class-bar-fill" style={{ width: `${(c.count / maxClassCount) * 100}%`, background: c.color }}></div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 10 }}>
            <i className="fa-solid fa-school"></i> {classes.length} classes · {classDistribution.reduce((s, c) => s + c.count, 0)} élèves répartis
          </div>
        </div>
      </div>

      {/* ── Row 3: 3 Columns ───────────────────────────── */}
      <div className="dash-grid-3">

        {/* Annonces */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3><i className="fa-solid fa-bullhorn" style={{ color: '#b8860b' }}></i> Annonces importantes</h3>
            <Link to="/notifications" className="dash-btn-link">Gérer <i className="fa-solid fa-arrow-right" style={{ fontSize: 10 }}></i></Link>
          </div>
          {dashboardAnnouncements.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>
              <i className="fa-solid fa-bullhorn" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>
              Aucune annonce
            </div>
          ) : dashboardAnnouncements.map((a, i) => (
            <div className="announce-item" key={i}>
              <span className="announce-badge" style={{ background: a.badgeBg, color: a.badgeColor }}>{a.badge}</span>
              <div className="announce-title">{a.title}</div>
              <div className="announce-text">{a.text}</div>
            </div>
          ))}
        </div>

        {/* Meilleurs élèves */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3><i className="fa-solid fa-trophy" style={{ color: '#d97706' }}></i> Meilleurs élèves</h3>
            <Link to="/grades" className="dash-btn-link">Classement <i className="fa-solid fa-arrow-right" style={{ fontSize: 10 }}></i></Link>
          </div>
          {topStudents.length > 0 ? (<div style={{ display: 'flex', flexDirection: 'column' }}>
            {topStudents.map((e, i) => (
              <div key={e.name} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                borderBottom: i < topStudents.length - 1 ? '1px solid #f0ede8' : 'none'
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 12,
                  background: i === 0 ? '#fef3c7' : i === 1 ? '#f1f5f9' : i === 2 ? '#fef2f2' : '#f5f3ee',
                  color: i === 0 ? '#d97706' : i === 1 ? '#475569' : i === 2 ? '#b91c1c' : '#78716c',
                  flexShrink: 0
                }}>{i + 1}</div>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f1f0ed', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#a8a29e' }}>
                  {e.photo ? <img src={e.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fa-solid fa-user"></i>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937' }}>{e.name}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{e.class || ''}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, color: i === 0 ? '#d97706' : '#0d7a5e' }}>{e.avg}%</div>
              </div>
            ))}
          </div>) : (
            <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>
              <i className="fa-solid fa-file-circle-plus" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>
              Aucune note disponible
            </div>
          )}
          {topStudents.length > 0 && (
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
              <i className="fa-solid fa-chart-simple"></i> Meilleure moyenne: {bestAvg}%
            </div>
          )}
        </div>

        {/* Calendrier */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3><i className="fa-solid fa-calendar-days" style={{ color: '#0d7a5e' }}></i> Calendrier des événements</h3>
            <button className="dash-btn-link" onClick={() => setShowEventModal(true)}>Ajouter</button>
          </div>
          {dashboardEvents.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>
              <i className="fa-solid fa-calendar-plus" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>
              Aucun événement
            </div>
          ) : dashboardEvents.slice(0, 4).map((ev, i) => (
            <div className="cal-event" key={i}>
              <div className="cal-date">
                <div className="cal-day">{ev.day}</div>
                <div className="cal-month">{ev.month}</div>
              </div>
              <div className="cal-content">
                <div className="cal-title">{ev.title}</div>
                <div className="cal-detail">{ev.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────── */}
      <div className="dash-footer">
        <span>Année scolaire {schoolYear}</span>
        <span><i className="fa-solid fa-database"></i> {students.length} élèves · {teachers.length} enseignants · {payments.length} paiements · {grades.length} évaluations</span>
      </div>

      {/* ── Add Event Modal ─────────────────────────────── */}
      {showEventModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowEventModal(false); }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Nouvel événement</h3>
              <button onClick={() => setShowEventModal(false)} className="modal-close"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={async (e) => { e.preventDefault(); if (!eventForm.date || !eventForm.title.trim()) { setEventError('Veuillez remplir tous les champs obligatoires.'); return; } try { await api.post('/schedule', { className: '', day: new Date(eventForm.date).toLocaleDateString('fr-FR', { weekday: 'long' }), time: eventForm.time, subject: eventForm.title.trim(), teacher: '', room: '' }); showToast('Événement ajouté avec succès', 'success'); } catch (err) { showToast(err.response?.data?.message || 'Erreur lors de l\'ajout de l\'événement', 'error'); } setEventForm({ date: '', title: '', time: '08:00', colorIndex: 0 }); setEventError(''); setShowEventModal(false); }}>
              {eventError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl" style={{ marginBottom: 12 }}>{eventError}</p>}
              <div className="form-group">
                <label>Titre *</label>
                <input required type="text" placeholder="ex: Réunion Parents"
                  value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input required type="date" value={eventForm.date}
                    onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Heure</label>
                  <input type="time" value={eventForm.time}
                    onChange={e => setEventForm(f => ({ ...f, time: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label>Couleur</label>
                <div className="flex gap-2">
                  {EVENT_COLORS.map((c, i) => (
                    <button key={i} type="button" onClick={() => setEventForm(f => ({ ...f, colorIndex: i }))}
                      title={c.label}
                      className={`w-8 h-8 rounded-xl ${c.color} transition-transform hover:scale-110 ${eventForm.colorIndex === i ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`} />
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEventModal(false)} className="btn">Annuler</button>
                <button type="submit" className="btn btn-primary">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
