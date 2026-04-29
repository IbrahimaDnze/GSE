import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';

/* ─── helpers ─────────────────────────────────────────── */
const DonutChart = ({ segments, total, centerLabel, centerSub, size = 120, stroke = 14 }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const gapDeg = 3;
  const gapFrac = gapDeg / 360;
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const frac = seg.pct / 100;
    const dash = Math.max(0, (frac - gapFrac) * circ);
    const dashOffset = -offset * circ;
    offset += frac;
    return { ...seg, dash, dashOffset };
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
        {arcs.map((arc, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={arc.color}
            strokeWidth={stroke} strokeDasharray={`${arc.dash} ${circ}`}
            strokeDashoffset={arc.dashOffset} strokeLinecap="butt" />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-slate-900 leading-none">{centerLabel}</span>
        <span className="text-xs text-slate-400 mt-0.5">{centerSub}</span>
      </div>
    </div>
  );
};

const EVENT_COLORS = [
  { label: 'Bleu',    color: 'bg-primary-600', textColor: 'text-primary-700', bgLight: 'bg-primary-50' },
  { label: 'Violet',  color: 'bg-violet-600',  textColor: 'text-violet-700',  bgLight: 'bg-violet-50'  },
  { label: 'Vert',    color: 'bg-emerald-600', textColor: 'text-emerald-700', bgLight: 'bg-emerald-50' },
  { label: 'Orange',  color: 'bg-orange-500',  textColor: 'text-orange-700',  bgLight: 'bg-orange-50'  },
  { label: 'Rose',    color: 'bg-pink-500',    textColor: 'text-pink-700',    bgLight: 'bg-pink-50'    },
];

const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    students, teachers, classes, payments,
    calendarEvents, addCalendarEvent, deleteCalendarEvent,
    currentUser,
  } = useAppData();

  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({ date: '', title: '', time: '08:00', colorIndex: 0 });
  const [eventError, setEventError] = useState('');

  /* ── Computed Stats ─────────────────────────────────── */
  const totalPaid    = payments.filter(p => p.status === 'Payé').reduce((s, p) => s + p.amount, 0);
  const activeStudents = students.filter(s => s.status === 'Actif').length;
  const activeTeachers = teachers.filter(t => t.status === 'Actif').length;

  const stats = [
    {
      title: 'Élèves',
      value: students.length.toString(),
      badge: `${activeStudents} actif${activeStudents !== 1 ? 's' : ''}`,
      badgeColor: 'bg-emerald-50 text-emerald-700',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      ),
      iconBg: 'bg-primary-600', iconText: 'text-white', lightBg: 'bg-primary-50',
      onClick: () => navigate('/students'),
    },
    {
      title: 'Enseignants',
      value: teachers.length.toString(),
      badge: `${activeTeachers} actif${activeTeachers !== 1 ? 's' : ''}`,
      badgeColor: 'bg-emerald-50 text-emerald-700',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      ),
      iconBg: 'bg-emerald-500', iconText: 'text-white', lightBg: 'bg-emerald-50',
      onClick: () => navigate('/teachers'),
    },
    {
      title: 'Classes',
      value: classes.length.toString(),
      badge: `${students.length} élèves`,
      badgeColor: 'bg-violet-50 text-violet-700',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
        </svg>
      ),
      iconBg: 'bg-violet-500', iconText: 'text-white', lightBg: 'bg-violet-50',
      onClick: () => navigate('/classes'),
    },
    {
      title: 'Paiements encaissés',
      value: `${totalPaid.toLocaleString('fr')} €`,
      badge: `${payments.filter(p => p.status === 'En attente').length} en attente`,
      badgeColor: 'bg-amber-50 text-amber-700',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
        </svg>
      ),
      iconBg: 'bg-amber-500', iconText: 'text-white', lightBg: 'bg-amber-50',
      onClick: () => navigate('/payments'),
    },
  ];

  /* ── Class Distribution ─────────────────────────────── */
  const CHART_COLORS = ['#2D68C4', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
  const totalStudents = students.length || 1;
  const classCounts = {};
  students.forEach(s => { if (s.class) classCounts[s.class] = (classCounts[s.class] || 0) + 1; });
  const classDistribution = Object.entries(classCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count], i) => ({
      name,
      students: count,
      pct: Math.round((count / totalStudents) * 100 * 10) / 10,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
  const donutSegments = classDistribution.length > 0
    ? classDistribution
    : [{ pct: 100, color: '#E2E8F0' }];

  /* ── Recent Payments ───────────────────────────────── */
  const recentPayments = [...payments].reverse().slice(0, 5);

  /* ── Attendance ─────────────────────────────────────── */
  const totalS = students.length || 1;
  const activeCount = students.filter(s => s.status === 'Actif').length;
  const inactiveCount = students.length - activeCount;
  const activePct = Math.round((activeCount / totalS) * 100);
  const attendanceSegments = [
    { pct: activePct,        color: '#10B981' },
    { pct: 100 - activePct, color: '#FCA5A5' },
  ];

  /* ── Event Modal ─────────────────────────────────────── */
  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!eventForm.date || !eventForm.title.trim()) {
      setEventError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    const d = new Date(eventForm.date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase().replace('.', '');
    const preset = EVENT_COLORS[eventForm.colorIndex];
    addCalendarEvent({
      day, month,
      title: eventForm.title.trim(),
      time: eventForm.time,
      color: preset.color,
      textColor: preset.textColor,
      bgLight: preset.bgLight,
    });
    setEventForm({ date: '', title: '', time: '08:00', colorIndex: 0 });
    setEventError('');
    setShowEventModal(false);
  };

  const userName = currentUser?.name?.split(' ')[0] || 'Admin';

  return (
    <div className="space-y-6">
      {/* ── Welcome Banner ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-800 to-primary-700 p-6 text-white shadow-lg">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -right-2 top-12 h-24 w-24 rounded-full bg-white/5" />
        <div className="absolute right-32 -bottom-6 h-20 w-20 rounded-full bg-white/5" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-primary-200 text-sm font-medium uppercase tracking-widest mb-1">Tableau de bord</p>
            <h1 className="text-2xl font-bold tracking-tight">Bonjour, {userName} ! 👋</h1>
            <p className="text-primary-100/80 mt-1 text-sm">
              Voici un aperçu de l'activité de votre établissement — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={() => navigate('/students', { state: { openModal: true } })}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors px-4 py-2 text-sm font-medium backdrop-blur-sm border border-white/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouvel élève
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="inline-flex items-center gap-2 rounded-xl bg-white text-primary-700 hover:bg-primary-50 transition-colors px-4 py-2 text-sm font-semibold shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
              </svg>
              Rapport
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} onClick={stat.onClick}
            className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
            <div className="flex items-start justify-between">
              <div className={`${stat.iconBg} p-2.5 rounded-xl shadow-sm`}>
                <span className={stat.iconText}>{stat.icon}</span>
              </div>
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${stat.badgeColor}`}>
                {stat.badge}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-0.5 font-medium">{stat.title}</p>
            </div>
            <div className={`mt-4 h-1 rounded-full ${stat.lightBg}`}>
              <div className={`h-1 rounded-full w-3/4 ${stat.iconBg}`} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 2: Class Distribution + Payments ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Inscriptions par classe</h2>
              <p className="text-xs text-slate-400 mt-0.5">{students.length} élève{students.length !== 1 ? 's' : ''} au total</p>
            </div>
            <button onClick={() => navigate('/classes')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              Voir tout
            </button>
          </div>
          {classDistribution.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <span className="text-3xl mb-2">🏫</span>
              <p className="text-sm font-medium">Aucun élève inscrit</p>
              <button onClick={() => navigate('/students', { state: { openModal: true } })}
                className="mt-3 px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 transition-colors">
                Ajouter des élèves
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-8">
              <DonutChart segments={donutSegments} total={students.length}
                centerLabel={students.length.toString()} centerSub="Total" size={128} stroke={14} />
              <div className="flex-1 space-y-2.5">
                {classDistribution.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-medium text-slate-700">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                      </div>
                      <span className="text-slate-500 text-xs w-8 text-right">{item.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Paiements récents</h2>
              <p className="text-xs text-slate-400 mt-0.5">5 dernières transactions</p>
            </div>
            <button onClick={() => navigate('/payments')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              Voir tout
            </button>
          </div>
          {recentPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <span className="text-3xl mb-2">💳</span>
              <p className="text-sm font-medium">Aucun paiement enregistré</p>
              <button onClick={() => navigate('/payments')}
                className="mt-3 px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 transition-colors">
                Enregistrer un paiement
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-2 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <span>Élève</span>
                <span className="text-right">Montant</span>
                <span className="text-center">Statut</span>
                <span className="text-right">Date</span>
              </div>
              {recentPayments.map((p, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-2 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full ${p.color} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-xs font-semibold">{p.initials}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-800 truncate">{p.student}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{Number(p.amount).toLocaleString('fr')} €</span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    p.status === 'Payé' ? 'bg-emerald-50 text-emerald-700' :
                    p.status === 'En retard' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
                  }`}>{p.status}</span>
                  <span className="text-xs text-slate-400 text-right whitespace-nowrap">{p.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Events + Attendance ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Événements à venir</h2>
              <p className="text-xs text-slate-400 mt-0.5">{calendarEvents.length} événement{calendarEvents.length !== 1 ? 's' : ''} planifié{calendarEvents.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowEventModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Ajouter
              </button>
              <button onClick={() => navigate('/schedule')}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Calendrier
              </button>
            </div>
          </div>
          {calendarEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <span className="text-3xl mb-2">📅</span>
              <p className="text-sm font-medium">Aucun événement planifié</p>
              <button onClick={() => setShowEventModal(true)}
                className="mt-3 px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 transition-colors">
                Créer un événement
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {calendarEvents.slice(0, 4).map((ev, i) => (
                <div key={i} className={`flex items-center gap-4 p-3.5 rounded-xl ${ev.bgLight} border border-transparent hover:border-slate-200 transition-colors group`}>
                  <div className={`flex-shrink-0 w-12 h-12 ${ev.color} rounded-xl flex flex-col items-center justify-center text-white shadow-sm`}>
                    <span className="text-lg font-bold leading-none">{ev.day}</span>
                    <span className="text-[9px] font-semibold uppercase tracking-wider leading-none mt-0.5 opacity-80">{ev.month}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{ev.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={`text-xs font-medium ${ev.textColor}`}>{ev.time}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteCalendarEvent(ev.id)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Statut des élèves</h2>
              <p className="text-xs text-slate-400 mt-0.5">{students.length} élève{students.length !== 1 ? 's' : ''} inscrit{students.length !== 1 ? 's' : ''}</p>
            </div>
            <span className={`text-xs font-medium px-3 py-1.5 rounded-lg ${
              activePct >= 90 ? 'text-emerald-700 bg-emerald-50' :
              activePct >= 70 ? 'text-amber-700 bg-amber-50' : 'text-red-600 bg-red-50'
            }`}>
              {activePct >= 90 ? 'Excellent' : activePct >= 70 ? 'Correct' : 'À surveiller'}
            </span>
          </div>
          {students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <span className="text-3xl mb-2">👨‍🎓</span>
              <p className="text-sm font-medium">Aucun élève inscrit</p>
              <button onClick={() => navigate('/students', { state: { openModal: true } })}
                className="mt-3 px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 transition-colors">
                Ajouter des élèves
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-8">
              <DonutChart segments={attendanceSegments} total={students.length}
                centerLabel={`${activePct}%`} centerSub="Actifs" size={128} stroke={14} />
              <div className="flex-1 space-y-4">
                {[
                  { label: 'Actifs',   value: activeCount,   pct: activePct,        color: 'bg-emerald-500', textColor: 'text-emerald-700', light: 'bg-emerald-50' },
                  { label: 'Inactifs', value: inactiveCount, pct: 100 - activePct,  color: 'bg-red-400',    textColor: 'text-red-700',     light: 'bg-red-50'     },
                ].map((row, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${row.color}`} />
                        <span className="text-sm font-medium text-slate-700">{row.label}</span>
                      </div>
                      <span className={`text-sm font-bold ${row.textColor}`}>{row.value} élèves</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${row.color} transition-all`} style={{ width: `${row.pct}%` }} />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Total inscrits</span>
                    <span className="text-sm font-bold text-slate-800">{students.length} élève{students.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Add Event Modal ─────────────────────────────────── */}
      {showEventModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Nouvel événement</h3>
              <button onClick={() => setShowEventModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddEvent} className="p-6 space-y-4">
              {eventError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">{eventError}</p>}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Titre de l'événement *</label>
                <input required type="text" placeholder="ex: Réunion Parents-Professeurs"
                  value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date *</label>
                  <input required type="date" value={eventForm.date}
                    onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Heure</label>
                  <input type="time" value={eventForm.time}
                    onChange={e => setEventForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Couleur</label>
                <div className="flex gap-2">
                  {EVENT_COLORS.map((c, i) => (
                    <button key={i} type="button" onClick={() => setEventForm(f => ({ ...f, colorIndex: i }))}
                      title={c.label}
                      className={`w-8 h-8 rounded-xl ${c.color} transition-transform hover:scale-110 ${eventForm.colorIndex === i ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEventModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">Annuler</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
