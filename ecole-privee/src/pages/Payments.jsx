import { useState } from 'react';
import PageBanner from '../components/PageBanner';
import { useAppData } from '../context/AppDataContext';
import { exportToCSV } from '../utils/export';

const TYPES   = ['Scolarité', 'Cantine', 'Activité', 'Transport', 'Autre'];
const METHODS = ['Virement', 'Chèque', 'CB', 'Espèces'];

const statusStyle = {
  Payé:          'bg-emerald-50 text-emerald-700',
  'En attente':  'bg-amber-50 text-amber-700',
  'En retard':   'bg-red-50 text-red-600',
};

const EMPTY_FORM = { student: '', matricule: '', type: '', amount: '', method: 'Virement', status: 'En attente' };

const Payments = () => {
  const { payments, addPayment, updatePayment, deletePayment, students, syncPaymentWithStudent } = useAppData();
  const [filter, setFilter]       = useState('Tous');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [viewItem, setViewItem]     = useState(null);
  const [editItem, setEditItem]     = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);

  const tabs     = ['Tous', 'Payé', 'En attente', 'En retard'];
  const total    = payments.filter((p) => p.status === 'Payé').reduce((s, p) => s + p.amount, 0);
  const pending  = payments.filter((p) => p.status === 'En attente').reduce((s, p) => s + p.amount, 0);
  const overdue  = payments.filter((p) => p.status === 'En retard').reduce((s, p) => s + p.amount, 0);
  const filtered = payments.filter(
    (p) => (filter === 'Tous' || p.status === filter) && (filterType ? p.type === filterType : true)
  );

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditItem(null);
    setShowModal(true);
  };

  // Fonction pour rechercher un élève par matricule
  const handleMatriculeChange = (matricule) => {
    setForm((f) => ({ ...f, matricule }));
    
    if (matricule.trim()) {
      const student = students.find(s => s.matricule === matricule.trim());
      if (student) {
        setForm((f) => ({ ...f, student: student.name, matricule }));
      }
    }
  };

  const openEdit = (p) => {
    setForm({ student: p.student, matricule: p.matricule || '', type: p.type, amount: p.amount, method: p.method, status: p.status });
    setEditItem(p);
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editItem) {
      // Synchroniser le paiement avec les données de l'élève
      syncPaymentWithStudent(editItem.id, form);
    } else {
      // Pour un nouveau paiement, utiliser la fonction de synchronisation
      const paymentId = `p-${Date.now()}`;
      addPayment({
        ...form,
        id: paymentId
      });
      // Synchroniser après l'ajout
      syncPaymentWithStudent(paymentId, form);
    }
    setShowModal(false);
    setForm(EMPTY_FORM);
    setEditItem(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Supprimer ce paiement ?')) deletePayment(id);
  };

  const handleExport = () => {
    if (payments.length === 0) return alert('Aucun paiement à exporter.');
    exportToCSV(
      payments.map(({ id, initials, color, ...r }) => r),
      'paiements',
      ['student', 'type', 'amount', 'method', 'date', 'status']
    );
  };

  return (
    <div className="space-y-6">
      <PageBanner
        label="Finance"
        title="Gestion des Paiements"
        subtitle="Suivi des paiements et transactions"
        actions={
          <div className="flex gap-3">
            <button onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors px-4 py-2 text-sm font-medium border border-white/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Exporter CSV
            </button>
            <button onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-white text-primary-700 hover:bg-primary-50 transition-colors px-4 py-2 text-sm font-semibold shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Enregistrer un paiement
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Encaissé',    value: `${total.toLocaleString('fr')} €`,    icon: '💰', bg: 'bg-emerald-50', text: 'text-emerald-700' },
          { label: 'En attente',  value: `${pending.toLocaleString('fr')} €`,  icon: '⏳', bg: 'bg-amber-50',   text: 'text-amber-700'   },
          { label: 'En retard',   value: `${overdue.toLocaleString('fr')} €`,  icon: '⚠️', bg: 'bg-red-50',     text: 'text-red-600'     },
          { label: 'Transactions',value: payments.length,                       icon: '📋', bg: 'bg-primary-50', text: 'text-primary-600' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl border border-slate-200/60 p-5 flex items-center gap-4`}>
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className={`text-xl font-bold ${s.text}`}>{s.value}</p>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 pt-4 border-b border-slate-100 pb-3">
          <div className="flex gap-1 flex-1 flex-wrap">
            {tabs.map((t) => (
              <button key={t} onClick={() => setFilter(t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  filter === t ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}>{t}</button>
            ))}
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
            <option value="">Tous les types</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <span className="text-4xl mb-3">💳</span>
            <p className="text-sm font-medium">Aucun paiement trouvé</p>
            <button onClick={openAdd} className="mt-3 px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 transition-colors">
              Enregistrer le premier paiement
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Matricule', 'Photo', 'Type', 'Montant', 'Méthode', 'Date', 'Statut', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 ? 'bg-slate-50/30' : ''}`}>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded-lg">{p.matricule || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {p.photo ? (
                          <img src={p.photo} alt={p.student} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs ${p.color || 'bg-gradient-to-br from-primary-500 to-primary-600'} shadow-sm`}>
                            {p.student.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{p.student}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">{p.type}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-slate-900">{Number(p.amount).toLocaleString('fr')} €</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{p.method}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{p.date}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyle[p.status]}`}>{p.status}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewItem(p)} className="p-1.5 rounded-lg text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors" title="Voir">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </button>
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors" title="Modifier">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-colors" title="Supprimer">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">{editItem ? 'Modifier le paiement' : 'Enregistrer un paiement'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Matricule</label>
                <input type="text" placeholder="ex: MAT2024001" value={form.matricule} onChange={(e) => handleMatriculeChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nom de l'élève *</label>
                <input required type="text" placeholder="ex: Martin Paul" value={form.student} onChange={(e) => setForm((f) => ({ ...f, student: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Type *</label>
                  <select required value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                    <option value="">Sélectionner</option>
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Montant (€) *</label>
                  <input required type="number" min="0" step="0.01" placeholder="250" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Méthode</label>
                  <select value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                    {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Statut</label>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                    {['En attente', 'Payé', 'En retard'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">{editItem ? 'Enregistrer' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Détail paiement</h3>
              <button onClick={() => setViewItem(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className={`w-12 h-12 ${viewItem.color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-lg font-bold">{viewItem.initials}</span>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{viewItem.student}</p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyle[viewItem.status]}`}>{viewItem.status}</span>
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'Matricule', value: viewItem.matricule || 'N/A' },
                  { label: 'Montant',  value: `${Number(viewItem.amount).toLocaleString('fr')} €` },
                  { label: 'Type',     value: viewItem.type   },
                  { label: 'Méthode',  value: viewItem.method },
                  { label: 'Date',     value: viewItem.date   },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                    <p className="text-sm font-medium text-slate-800">{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => { setViewItem(null); openEdit(viewItem); }} className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors">Modifier</button>
                <button onClick={() => setViewItem(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
