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
    calendarEvents,
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

  /* ── Recent Evaluations ───────────────────────────── */
  const recentEvals = useMemo(() => {
    return [...grades].reverse().slice(0, 5).map(g => {
      const subjects = ['Maths','Français','Anglais','Histoire','Sciences','Physique'];
      const vals = subjects.map(s => Number(g[s])).filter(v => !isNaN(v));
      const avg = vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length / 20) * 100) : 0;
      return { ...g, avg };
    });
  }, [grades]);

  const overallAvg = recentEvals.length > 0
    ? Math.round(recentEvals.reduce((s, e) => s + e.avg, 0) / recentEvals.length)
    : 0;

  /* ── Dashboard Events ─────────────────────────────── */
  const dashboardEvents = calendarEvents.slice(0, 4).map(e => ({
    day: e.day,
    month: e.month,
    title: e.title,
    detail: e.time || '',
  }));

  /* ── Announcements ────────────────────────────────── */
  const dashboardAnnouncements = [
    { badge: 'Info', badgeBg: '#ecfdf5', badgeColor: '#0d7a5e', title: 'Réunion des enseignants', text: 'Réunion trimestrielle prévue le 15 juin à 10h.' },
    { badge: 'Important', badgeBg: '#fef2f2', badgeColor: '#b91c1c', title: 'Examens fin d\'année', text: 'Les examens du 3ème trimestre débutent le 20 juin.' },
  ];

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
            <i className="fa-solid fa-check-circle"></i>
          </div>
          <div>
            <div className="dash-stat-value">{present}</div>
            <div className="dash-stat-label">Présents aujourd'hui</div>
            <div className="dash-stat-sub">{totalStudents > 0 ? `Taux: ${pctPresent}%` : 'Aucune donnée'}</div>
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

        {/* Présences */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3><i className="fa-solid fa-check-circle" style={{ color: '#0d7a5e' }}></i> Résumé des présences</h3>
            <Link to="/students" className="dash-btn-link">Rapport <i className="fa-solid fa-arrow-right" style={{ fontSize: 10 }}></i></Link>
          </div>
          <div className="presences-numbers">
            <div className="presence-stat">
              <div className="presence-num">{present}</div>
              <div className="presence-label green">Présents</div>
              <div className="presence-pct" style={{ color: '#0d7a5e' }}>{pctPresent}%</div>
            </div>
            <div className="presence-stat">
              <div className="presence-num">{absent}</div>
              <div className="presence-label red">Absents</div>
              <div className="presence-pct" style={{ color: '#b91c1c' }}>{pctAbsent}%</div>
            </div>
            <div className="presence-stat">
              <div className="presence-num">0</div>
              <div className="presence-label orange">Retards</div>
              <div className="presence-pct" style={{ color: '#b8860b' }}>0%</div>
            </div>
          </div>
          <div className="presence-bar-row">
            <div className="presence-bar-track">
              <div className="presence-bar-seg" style={{ width: `${pctPresent}%`, background: '#0d7a5e' }}></div>
              <div className="presence-bar-seg" style={{ width: `${pctAbsent}%`, background: '#b91c1c' }}></div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
            <i className="fa-solid fa-calendar-day"></i> {today}
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

        {/* Évaluations récentes */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3><i className="fa-solid fa-clipboard-check" style={{ color: '#0d7a5e' }}></i> Évaluations récentes</h3>
            <Link to="/grades" className="dash-btn-link">Voir tout <i className="fa-solid fa-arrow-right" style={{ fontSize: 10 }}></i></Link>
          </div>
          {recentEvals.length > 0 ? recentEvals.map((e, i) => (
            <div className="eval-item" key={i}>
              <div className="eval-icon" style={{ overflow: 'hidden', padding: 0 }}>
                <i className="fa-solid fa-star" style={{ color: '#0d7a5e' }}></i>
              </div>
              <div className="eval-content">
                <div className="eval-name">{e.studentName}</div>
                <div className="eval-detail">{e.class || ''}</div>
              </div>
              <div className={`eval-score ${e.avg >= 75 ? 'green' : 'orange'}`}>{e.avg}%</div>
            </div>
          )) : (
            <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>
              <i className="fa-solid fa-file-circle-plus" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>
              Aucune évaluation récente
            </div>
          )}
          {recentEvals.length > 0 && (
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
              <i className="fa-solid fa-chart-simple"></i> Moyenne générale: {overallAvg}%
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
