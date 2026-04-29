import { useState } from 'react';
import PageBanner from '../components/PageBanner';
import { useAppData } from '../context/AppDataContext';

const SUBJECTS = ['Mathématiques', 'Français', 'Histoire-Géo', 'Sciences', 'Anglais', 'EPS', 'Arts', 'Physique', 'Informatique', 'Philosophie'];
const STATUSES = ['Actif', 'Congé', 'Inactif'];

const statusColor = {
  Actif:   'bg-emerald-50 text-emerald-700',
  Congé:   'bg-amber-50 text-amber-700',
  Inactif: 'bg-red-50 text-red-600',
};

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
    <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" {...props} />
  </div>
);

const EMPTY_FORM = { name: '', email: '', subject: '', phone: '', years: 0, status: 'Actif' };

const Teachers = () => {
  const { teachers, addTeacher, updateTeacher, deleteTeacher } = useAppData();
  const [search, setSearch]           = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [viewTeacher, setViewTeacher]   = useState(null);
  const [editTeacher, setEditTeacher]   = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);

  const filtered = teachers.filter(
    (t) =>
      (t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.subject || '').toLowerCase().includes(search.toLowerCase())) &&
      (filterSubject ? t.subject === filterSubject : true)
  );

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditTeacher(null);
    setShowModal(true);
  };

  const openEdit = (t) => {
    setForm({ name: t.name, email: t.email, subject: t.subject || '', phone: t.phone || '', years: t.years || 0, status: t.status });
    setEditTeacher(t);
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editTeacher) {
      updateTeacher(editTeacher.id, { ...form, years: Number(form.years) });
    } else {
      addTeacher({ ...form, years: Number(form.years) });
    }
    setShowModal(false);
    setForm(EMPTY_FORM);
    setEditTeacher(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Supprimer cet enseignant définitivement ?')) deleteTeacher(id);
  };

  const total  = teachers.length;
  const active = teachers.filter((t) => t.status === 'Actif').length;

  return (
    <div className="space-y-6">
      <PageBanner
        label="Administration"
        title="Gestion des Enseignants"
        subtitle={`${total} enseignant${total !== 1 ? 's' : ''} · ${active} actif${active !== 1 ? 's' : ''}`}
        actions={
          <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-xl bg-white text-primary-700 hover:bg-primary-50 transition-colors px-4 py-2 text-sm font-semibold shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Ajouter un enseignant
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total',     value: total,                                                    icon: '👨‍🏫', color: 'text-primary-600', bg: 'bg-primary-50'  },
          { label: 'Actifs',    value: active,                                                   icon: '✅',  color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'En congé',  value: teachers.filter((t) => t.status === 'Congé').length,     icon: '🏖️', color: 'text-amber-700',   bg: 'bg-amber-50'   },
          { label: 'Matières',  value: [...new Set(teachers.map((t) => t.subject).filter(Boolean))].length, icon: '📚', color: 'text-violet-700', bg: 'bg-violet-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 flex items-center gap-4">
            <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>{s.icon}</div>
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Rechercher un enseignant…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400 transition-all" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
            <option value="">Toutes les matières</option>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <span className="text-4xl mb-3">👨‍🏫</span>
            <p className="text-sm font-medium">Aucun enseignant trouvé</p>
            <button onClick={openAdd} className="mt-3 px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 transition-colors">
              Ajouter le premier enseignant
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Enseignant', 'Matière', 'Expérience', 'Téléphone', 'Statut', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr key={t.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 ? 'bg-slate-50/30' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 ${t.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white text-xs font-bold">{t.initials}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                          <p className="text-xs text-slate-400">{t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium bg-primary-50 text-primary-700 px-2.5 py-1 rounded-lg">{t.subject || '—'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{t.years} an{t.years > 1 ? 's' : ''}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{t.phone || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[t.status] || statusColor.Inactif}`}>{t.status}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewTeacher(t)} className="p-1.5 rounded-lg text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors" title="Voir">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors" title="Modifier">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-colors" title="Supprimer">
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
              <h3 className="text-lg font-bold text-slate-900">{editTeacher ? 'Modifier l\'enseignant' : 'Nouvel enseignant'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <InputField label="Nom complet *" type="text" placeholder="ex: Marc Lefebvre" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              <InputField label="Email *" type="email" placeholder="m.lefebvre@ecole.fr" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
              <InputField label="Téléphone" type="tel" placeholder="06 00 00 00 00" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Matière *</label>
                <select value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                  <option value="">Sélectionner une matière</option>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Statut</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <InputField label="Années d'expérience" type="number" min="0" placeholder="0" value={form.years} onChange={(e) => setForm((f) => ({ ...f, years: e.target.value }))} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">{editTeacher ? 'Enregistrer' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewTeacher && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Fiche enseignant</h3>
              <button onClick={() => setViewTeacher(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className={`w-14 h-14 ${viewTeacher.color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xl font-bold">{viewTeacher.initials}</span>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{viewTeacher.name}</p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[viewTeacher.status] || ''}`}>{viewTeacher.status}</span>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { icon: '✉️', label: 'Email', value: viewTeacher.email },
                  { icon: '📚', label: 'Matière', value: viewTeacher.subject || '—' },
                  { icon: '📞', label: 'Téléphone', value: viewTeacher.phone || '—' },
                  { icon: '🎓', label: 'Expérience', value: `${viewTeacher.years} ans` },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <span className="text-base">{icon}</span>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-medium text-slate-800">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => { setViewTeacher(null); openEdit(viewTeacher); }}
                  className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors">Modifier</button>
                <button onClick={() => setViewTeacher(null)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;
