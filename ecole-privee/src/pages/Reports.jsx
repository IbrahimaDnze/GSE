import PageBanner from '../components/PageBanner';
import { useAppData } from '../context/AppDataContext';
import { exportToCSV } from '../utils/export';

const SUBJECTS = ['Maths', 'Français', 'Anglais', 'Histoire', 'Sciences', 'Physique'];
const SUBJECT_COLORS = {
  Maths:     'bg-blue-500',
  Français:  'bg-pink-500',
  Anglais:   'bg-emerald-500',
  Histoire:  'bg-amber-500',
  Sciences:  'bg-violet-500',
  Physique:  'bg-teal-500',
};

const MONTH_MAP = {
  'janv.': 'Jan', 'févr.': 'Fév', 'mars': 'Mar', 'avr.': 'Avr', 'mai': 'Mai',
  'juin': 'Jun', 'juil.': 'Jul', 'août': 'Aoû', 'sept.': 'Sep', 'oct.': 'Oct',
  'nov.': 'Nov', 'déc.': 'Déc',
};
const MONTH_ORDER = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

const getMonthKey = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.toLowerCase().split(' ');
  return MONTH_MAP[parts[1]] || parts[1] || '';
};

const avgOf = (gradeObj) => {
  const scores = SUBJECTS.map(s => Number(gradeObj[s])).filter(n => !isNaN(n) && n >= 0);
  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
};

const Reports = () => {
  const { payments, students, grades } = useAppData();

  /* ── Revenue by month ──────────────────────────────── */
  const revenueByMonth = {};
  payments.forEach(p => {
    if (p.status === 'Payé') {
      const m = getMonthKey(p.date);
      if (m) revenueByMonth[m] = (revenueByMonth[m] || 0) + p.amount;
    }
  });
  const barData = Object.entries(revenueByMonth)
    .map(([month, value]) => ({ month, value }))
    .sort((a, b) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month))
    .slice(-6);
  const maxBar = barData.length > 0 ? Math.max(...barData.map(d => d.value)) : 1;

  /* ── Payment status distribution ──────────────────── */
  const payStatusCounts = {
    'Payé':        payments.filter(p => p.status === 'Payé').length,
    'En attente':  payments.filter(p => p.status === 'En attente').length,
    'En retard':   payments.filter(p => p.status === 'En retard').length,
  };
  const maxStatus = Math.max(...Object.values(payStatusCounts), 1);

  /* ── Top students from grades ──────────────────────── */
  const studentAverages = grades
    .map(g => {
      const a = avgOf(g);
      return a !== null ? { name: g.studentName, avg: parseFloat(a.toFixed(1)), class: g.class, initials: g.initials, color: g.color } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  /* ── Subject performance ───────────────────────────── */
  const subjectPerf = SUBJECTS.map(subject => {
    const scores = grades.map(g => Number(g[subject])).filter(n => !isNaN(n) && n >= 0);
    const avg = scores.length > 0 ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : null;
    return { subject, avg, color: SUBJECT_COLORS[subject] || 'bg-primary-500' };
  }).filter(s => s.avg !== null);

  /* ── KPI cards ─────────────────────────────────────── */
  const allAvgs = grades.map(g => avgOf(g)).filter(v => v !== null);
  const successRate = allAvgs.length > 0 ? Math.round((allAvgs.filter(a => a >= 10).length / allAvgs.length) * 100) : null;
  const generalAvg  = allAvgs.length > 0 ? (allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length).toFixed(1) : null;
  const activePct   = students.length > 0 ? Math.round((students.filter(s => s.status === 'Actif').length / students.length) * 100) : null;
  const totalPaid   = payments.filter(p => p.status === 'Payé').reduce((s, p) => s + p.amount, 0);

  /* ── Export ────────────────────────────────────────── */
  const handleExport = () => {
    const rows = [
      { Indicateur: 'Taux de réussite',  Valeur: successRate !== null ? `${successRate}%` : '—' },
      { Indicateur: 'Taux de présence',  Valeur: activePct !== null   ? `${activePct}%`  : '—' },
      { Indicateur: 'Moy. générale',     Valeur: generalAvg !== null  ? `${generalAvg}/20` : '—' },
      { Indicateur: 'Total encaissé',    Valeur: `${totalPaid.toLocaleString('fr')} €` },
      { Indicateur: 'Total élèves',      Valeur: students.length.toString() },
      { Indicateur: 'Total paiements',   Valeur: payments.length.toString() },
    ];
    exportToCSV(rows, 'rapport_ecole', ['Indicateur', 'Valeur']);
  };

  const kpis = [
    {
      label: 'Taux de réussite', value: successRate !== null ? `${successRate}%` : '—',
      bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Taux de présence', value: activePct !== null ? `${activePct}%` : '—',
      bg: 'bg-primary-50', text: 'text-primary-700', badge: 'bg-primary-100 text-primary-700',
    },
    {
      label: 'Moy. générale', value: generalAvg !== null ? `${generalAvg}/20` : '—',
      bg: 'bg-violet-50', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700',
    },
    {
      label: 'Total encaissé', value: `${totalPaid.toLocaleString('fr')} €`,
      bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700',
    },
  ];

  const noData = payments.length === 0 && grades.length === 0 && students.length === 0;

  return (
    <div className="space-y-6">
      <PageBanner
        label="Analytique"
        title="Rapports & Statistiques"
        subtitle="Vue d'ensemble des performances et indicateurs clés"
        actions={
          <button onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl bg-white text-primary-700 hover:bg-primary-50 transition-colors px-4 py-2 text-sm font-semibold shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Exporter le rapport
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
            <p className={`text-3xl font-bold ${s.text}`}>{s.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">{s.label}</p>
            <span className={`inline-flex items-center gap-1 mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full ${s.badge}`}>
              {s.value !== '—' ? 'Données réelles' : 'Aucune donnée'}
            </span>
          </div>
        ))}
      </div>

      {noData ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card flex flex-col items-center justify-center py-20 text-slate-400">
          <span className="text-5xl mb-4">📊</span>
          <p className="text-base font-semibold text-slate-600">Aucune donnée disponible</p>
          <p className="text-sm text-slate-400 mt-1">Ajoutez des élèves, paiements et notes pour voir vos statistiques.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Bar Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Revenus mensuels</h2>
                <p className="text-xs text-slate-400 mt-0.5">Paiements encaissés en €</p>
              </div>
              <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg">
                Total : {totalPaid.toLocaleString('fr')} €
              </span>
            </div>
            {barData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Aucun paiement encaissé</div>
            ) : (
              <div className="flex items-end gap-3 h-40">
                {barData.map((d, i) => {
                  const h = Math.round((d.value / maxBar) * 100);
                  const isLast = i === barData.length - 1;
                  return (
                    <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500">{d.value.toLocaleString('fr')} €</span>
                      <div className="w-full rounded-t-lg transition-all" style={{ height: `${Math.max(h, 4)}%`, background: isLast ? '#2D68C4' : '#DAE5F7' }} />
                      <span className="text-[11px] text-slate-500 font-medium">{d.month}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment Status Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Statut des paiements</h2>
                <p className="text-xs text-slate-400 mt-0.5">{payments.length} transaction{payments.length !== 1 ? 's' : ''} au total</p>
              </div>
            </div>
            {payments.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Aucun paiement enregistré</div>
            ) : (
              <div className="flex items-end gap-4 h-40">
                {[
                  { label: 'Payé',       count: payStatusCounts['Payé'],        color: '#10B981' },
                  { label: 'En attente', count: payStatusCounts['En attente'],  color: '#F59E0B' },
                  { label: 'En retard',  count: payStatusCounts['En retard'],   color: '#EF4444' },
                ].map((d) => {
                  const h = Math.round((d.count / maxStatus) * 100);
                  return (
                    <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500">{d.count}</span>
                      <div className="w-full rounded-t-lg transition-all" style={{ height: `${Math.max(h, 4)}%`, backgroundColor: d.color }} />
                      <span className="text-[11px] text-slate-500 font-medium">{d.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Students */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Meilleurs élèves</h2>
                <p className="text-xs text-slate-400 mt-0.5">Classement par moyenne générale</p>
              </div>
            </div>
            {studentAverages.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Aucune note enregistrée</div>
            ) : (
              <div className="space-y-3">
                {studentAverages.map((s, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-300 text-slate-700' : i === 2 ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-500'}`}>{i+1}</span>
                    <div className={`w-8 h-8 ${s.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-xs font-bold">{s.initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.class}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{s.avg}/20</p>
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-1">
                        <div className="h-full bg-primary-600 rounded-full" style={{ width: `${(s.avg / 20) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subject Performance */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Performance par matière</h2>
                <p className="text-xs text-slate-400 mt-0.5">Moyenne de toutes les classes</p>
              </div>
            </div>
            {subjectPerf.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Aucune note enregistrée</div>
            ) : (
              <div className="space-y-3">
                {subjectPerf.map((s, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-700">{s.subject}</span>
                      <span className="text-xs font-bold text-slate-900">{s.avg}/20</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${(s.avg / 20) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
