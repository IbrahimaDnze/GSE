import { useAppData } from '../context/AppDataContext';
import { exportToCSV } from '../utils/export';

const PALETTE = ['#122d51','#db2777','#10b981','#d97706','#7c3aed','#0891b2','#be185d','#0d9488','#ca8a04','#1d4ed8'];
const EXCLUDED_KEYS = new Set(['_id','id','studentName','matricule','class','trimestre','photo','createdAt','updatedAt','__v']);

const MONTH_MAP = {
  'janv.': 'Jan', 'févr.': 'Fév', 'mars': 'Mar', 'avr.': 'Avr', 'mai': 'Mai',
  'juin': 'Jun', 'juil.': 'Jul', 'août': 'Aoû', 'sept.': 'Sep', 'oct.': 'Oct',
  'nov.': 'Nov', 'déc.': 'Déc',
  'janvier': 'Jan', 'février': 'Fév', 'avril': 'Avr', 'juillet': 'Jul',
  'septembre': 'Sep', 'octobre': 'Oct', 'novembre': 'Nov', 'décembre': 'Déc',
};
const MONTH_ORDER = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

const getMonthKey = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.toLowerCase().split(' ');
  return MONTH_MAP[parts[1]] || parts[1] || '';
};

const avgOf = (gradeObj, subjectList) => {
  const scores = subjectList.map(s => Number(gradeObj[s])).filter(n => !isNaN(n) && n >= 0);
  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
};

  const Reports = () => {
  const { payments, students, grades } = useAppData();

  const subjectKeys = [...new Set(grades.flatMap(g => Object.keys(g).filter(k => !EXCLUDED_KEYS.has(k) && typeof g[k] === 'number')))];
  const subjectColors = {};
  subjectKeys.forEach((s, i) => { subjectColors[s] = PALETTE[i % PALETTE.length]; });

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

  const payStatusCounts = {
    'Payé':        payments.filter(p => p.status === 'Payé').length,
    'En attente':  payments.filter(p => p.status === 'En attente').length,
    'En retard':   payments.filter(p => p.status === 'En retard').length,
  };
  const maxStatus = Math.max(...Object.values(payStatusCounts), 1);

  const studentAverages = grades
    .map(g => {
      const a = avgOf(g, subjectKeys);
      return a !== null ? { name: g.studentName, avg: parseFloat(a.toFixed(1)), class: g.class } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  const subjectPerf = subjectKeys.map(subject => {
    const scores = grades.map(g => Number(g[subject])).filter(n => !isNaN(n) && n >= 0);
    const avg = scores.length > 0 ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : null;
    return { subject, avg, color: subjectColors[subject] };
  }).filter(s => s.avg !== null);

  const allAvgs = grades.map(g => avgOf(g, subjectKeys)).filter(v => v !== null);
  const successRate = allAvgs.length > 0 ? Math.round((allAvgs.filter(a => a >= 10).length / allAvgs.length) * 100) : null;
  const generalAvg  = allAvgs.length > 0 ? (allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length).toFixed(1) : null;
  const activePct   = students.length > 0 ? Math.round((students.filter(s => s.status === 'Actif').length / students.length) * 100) : null;
  const totalPaid   = payments.filter(p => p.status === 'Payé').reduce((s, p) => s + p.amount, 0);

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

  const noData = payments.length === 0 && grades.length === 0 && students.length === 0;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h2><i className="fa-solid fa-chart-bar" style={{ color: '#b8860b', marginRight: 8 }}></i> Rapports & Statistiques</h2>
        <button onClick={handleExport} className="btn btn-primary">
          <i className="fa-solid fa-download"></i> Exporter le rapport
        </button>
      </div>

      <div className="stu-stats">
        <div className="stu-stat-card" style={{ borderTopColor: '#0d7a5e' }}>
          <div className="stu-stat-icon" style={{ background: '#ecfdf5', color: '#0d7a5e' }}>
            <i className="fa-solid fa-check-circle"></i>
          </div>
          <div>
            <div className="stu-stat-value">{successRate !== null ? `${successRate}%` : '—'}</div>
            <div className="stu-stat-label">Taux de réussite</div>
          </div>
        </div>
        <div className="stu-stat-card" style={{ borderTopColor: '#3b82f6' }}>
          <div className="stu-stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
            <i className="fa-solid fa-user-check"></i>
          </div>
          <div>
            <div className="stu-stat-value">{activePct !== null ? `${activePct}%` : '—'}</div>
            <div className="stu-stat-label">Taux de présence</div>
          </div>
        </div>
        <div className="stu-stat-card" style={{ borderTopColor: '#7c3aed' }}>
          <div className="stu-stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <i className="fa-solid fa-calculator"></i>
          </div>
          <div>
            <div className="stu-stat-value">{generalAvg !== null ? `${generalAvg}/20` : '—'}</div>
            <div className="stu-stat-label">Moy. générale</div>
          </div>
        </div>
        <div className="stu-stat-card" style={{ borderTopColor: '#b8860b' }}>
          <div className="stu-stat-icon" style={{ background: '#fffbeb', color: '#b8860b' }}>
            <i className="fa-solid fa-money-bill"></i>
          </div>
          <div>
            <div className="stu-stat-value">{totalPaid.toLocaleString('fr')} €</div>
            <div className="stu-stat-label">Total encaissé</div>
          </div>
        </div>
      </div>

      {noData ? (
        <div style={{ padding: '80px 20px', textAlign: 'center', color: '#9ca3af', background: '#fff', borderRadius: 16, border: '1px solid #e8e4db' }}>
          <i className="fa-solid fa-chart-simple" style={{ fontSize: 48, display: 'block', marginBottom: 16, opacity: 0.4 }}></i>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#475569' }}>Aucune donnée disponible</p>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Ajoutez des élèves, paiements et notes pour voir vos statistiques.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8e4db', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>Revenus mensuels</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Paiements encaissés en €</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, background: '#ecfdf5', color: '#0d7a5e', padding: '4px 12px', borderRadius: 8 }}>
                Total : {totalPaid.toLocaleString('fr')} €
              </span>
            </div>
            {barData.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: '#9ca3af', fontSize: 13 }}>Aucun paiement encaissé</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160 }}>
                {barData.map((d, i) => {
                  const h = Math.round((d.value / maxBar) * 100);
                  const isLast = i === barData.length - 1;
                  return (
                    <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#57534e' }}>{d.value.toLocaleString('fr')} €</span>
                      <div style={{ width: '100%', borderRadius: '8px 8px 0 0', height: `${Math.max(h, 4)}%`, background: isLast ? '#122d51' : '#a7f3d0' }} />
                      <span style={{ fontSize: 11, color: '#57534e', fontWeight: 500 }}>{d.month}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8e4db', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>Statut des paiements</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{payments.length} transaction{payments.length !== 1 ? 's' : ''} au total</div>
              </div>
            </div>
            {payments.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: '#9ca3af', fontSize: 13 }}>Aucun paiement enregistré</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 160 }}>
                {[
                  { label: 'Payé',       count: payStatusCounts['Payé'],        color: '#10B981' },
                  { label: 'En attente', count: payStatusCounts['En attente'],  color: '#F59E0B' },
                  { label: 'En retard',  count: payStatusCounts['En retard'],   color: '#EF4444' },
                ].map((d) => {
                  const h = Math.round((d.count / maxStatus) * 100);
                  return (
                    <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#57534e' }}>{d.count}</span>
                      <div style={{ width: '100%', borderRadius: '8px 8px 0 0', height: `${Math.max(h, 4)}%`, background: d.color }} />
                      <span style={{ fontSize: 11, color: '#57534e', fontWeight: 500 }}>{d.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8e4db', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>Meilleurs élèves</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Classement par moyenne générale</div>
              </div>
            </div>
            {studentAverages.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: '#9ca3af', fontSize: 13 }}>Aucune note enregistrée</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {studentAverages.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, background: i === 0 ? '#d97706' : i === 1 ? '#cbd5e1' : i === 2 ? '#b8860b' : '#f1f0ed', color: i <= 2 ? '#fff' : '#57534e' }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.class}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{s.avg}/20</div>
                      <div style={{ width: 72, height: 6, background: '#f1f0ed', borderRadius: 4, marginTop: 4 }}>
                        <div style={{ height: '100%', background: '#122d51', borderRadius: 4, width: `${(s.avg / 20) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8e4db', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>Performance par matière</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Moyenne de toutes les classes</div>
              </div>
            </div>
            {subjectPerf.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: '#9ca3af', fontSize: 13 }}>Aucune note enregistrée</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {subjectPerf.map((s, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#57534e' }}>{s.subject}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e' }}>{s.avg}/20</span>
                    </div>
                    <div style={{ height: 8, background: '#f1f0ed', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: s.color, borderRadius: 6, width: `${(s.avg / 20) * 100}%` }} />
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
