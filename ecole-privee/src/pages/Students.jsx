import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageBanner from '../components/PageBanner';
import { useAppData } from '../context/AppDataContext';

const CLASSES = ['6ème A', '5ème B', '4ème C', '3ème A', '2nde B'];

const CLASS_COLORS = {
  '6ème A': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  '5ème B': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  '4ème C': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  '3ème A': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  '2nde B': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' }
};

const GENDER_COLORS = {
  'Masculin': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', symbol: '♂' },
  'Féminin': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', symbol: '♀' }
};

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
    <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" {...props} />
  </div>
);

const SelectField = ({ label, children, ...props }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
    <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" {...props}>
      {children}
    </select>
  </div>
);

const EMPTY_FORM = { name: '', class: '', phone: '', dob: '', photo: '', gender: '', parent: '', parentPhone: '', matricule: '', status: 'Actif' };

const Students = () => {
  const { students, addStudent, updateStudent, deleteStudent, syncStudentWithEnrollments, syncDeleteStudentWithEnrollments } = useAppData();
  const location = useLocation();
  const [search, setSearch]           = useState('');
  const [filterClass, setFilterClass]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [viewStudent, setViewStudent]   = useState(null);
  const [editStudent, setEditStudent]   = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);

  // Open add modal if navigated with state
  useEffect(() => {
    if (location.state?.openModal) setShowModal(true);
  }, [location.state]);

  const filtered = students.filter(
    (s) =>
      (s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())) &&
      (filterClass ? s.class === filterClass : true) &&
      (filterStatus ? s.status === filterStatus : true)
  );

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditStudent(null);
    setShowModal(true);
  };

  const openEdit = (s) => {
    setForm({ name: s.name, class: s.class, phone: s.phone || '', dob: s.dob || '', photo: s.photo || '', gender: s.gender || '', parent: s.parent || '', parentPhone: s.parentPhone || '', matricule: s.matricule || '', status: s.status });
    setEditStudent(s);
    setShowModal(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(f => ({ ...f, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editStudent) {
      const oldStudentName = editStudent.name;
      updateStudent(editStudent.id, form);
      
      // Synchroniser avec les inscriptions existantes en utilisant la fonction centralisée
      syncStudentWithEnrollments(editStudent.id, form, oldStudentName);
    } else {
      addStudent(form);
    }
    setShowModal(false);
    setForm(EMPTY_FORM);
    setEditStudent(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Supprimer cet élève définitivement ?')) {
      // Synchroniser la suppression avec les inscriptions
      syncDeleteStudentWithEnrollments(id);
      // Supprimer l'élève
      deleteStudent(id);
    }
  };

  const total  = students.length;
  const active = students.filter((s) => s.status === 'Actif').length;

  return (
    <div className="space-y-6">
      <PageBanner
        label="Administration"
        title="Gestion des Élèves"
        subtitle={`${total} élève${total !== 1 ? 's' : ''} inscrit${total !== 1 ? 's' : ''} · ${active} actif${active !== 1 ? 's' : ''}`}
        actions={null}
      />

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filtres & Recherche</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Rechercher un élève…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400 transition-all" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
            <option value="">Toutes les classes</option>
            {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
            <option value="">Tous les statuts</option>
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</p>
          <span className="text-xs text-slate-400">Année scolaire en cours</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <p className="text-sm font-medium">Aucun élève trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Matricule', 'Photo', 'Classe', 'Date de naissance', 'Genre', 'Parent/Tuteur', 'Statut', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 !== 0 ? 'bg-slate-50/30' : ''}`}>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded-lg">{s.matricule || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {s.photo ? (
                          <img src={s.photo} alt={s.name} className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm" />
                        ) : (
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm ${s.color || 'bg-gradient-to-br from-primary-500 to-primary-600'} shadow-sm`}>
                            {s.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{s.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${
                        CLASS_COLORS[s.class] ? `${CLASS_COLORS[s.class].bg} ${CLASS_COLORS[s.class].text} ${CLASS_COLORS[s.class].border}` : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {s.class || 'Non assigné'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{s.dob || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        GENDER_COLORS[s.gender] ? `${GENDER_COLORS[s.gender].bg} ${GENDER_COLORS[s.gender].text} ${GENDER_COLORS[s.gender].border}` : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {GENDER_COLORS[s.gender] && <span>{GENDER_COLORS[s.gender].symbol}</span>}
                        {s.gender || 'Non spécifié'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-slate-800">{s.parent || '—'}</span>
                        {s.parentPhone && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {s.parentPhone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.status === 'Actif' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewStudent(s)} className="p-1.5 rounded-lg text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors" title="Voir">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors" title="Modifier">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-colors" title="Supprimer">
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
              <h3 className="text-lg font-bold text-slate-900">{editStudent ? 'Modifier l\'élève' : 'Nouvel élève'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <InputField label="Nom complet *" type="text" placeholder="ex: Jean Dupont" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              <InputField label="Matricule" type="text" placeholder="ex: MAT2024001" value={form.matricule} onChange={(e) => setForm((f) => ({ ...f, matricule: e.target.value }))} />
              <SelectField label="Classe *" value={form.class} onChange={(e) => setForm((f) => ({ ...f, class: e.target.value }))} required>
                <option value="">Sélectionner une classe</option>
                {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </SelectField>
              <SelectField label="Statut" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="Actif">Actif</option>
                <option value="Inactif">Inactif</option>
              </SelectField>
              <SelectField label="Genre" value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
                <option value="">Sélectionner</option>
                <option value="Masculin">Masculin</option>
                <option value="Féminin">Féminin</option>
              </SelectField>
              <InputField label="Parent/Tuteur" type="text" placeholder="ex: Marie Dupont" value={form.parent} onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value }))} />
              <InputField label="Téléphone parent" type="tel" placeholder="06 00 00 00 00" value={form.parentPhone} onChange={(e) => setForm((f) => ({ ...f, parentPhone: e.target.value }))} />
              <InputField label="Date de naissance" type="text" placeholder="JJ/MM/AAAA" value={form.dob} onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))} />
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Photo de l'élève</label>
                <div className="flex items-center gap-4">
                  {form.photo ? (
                    <div className="relative">
                      <img src={form.photo} alt="Photo de l'élève" className="w-20 h-20 rounded-xl object-cover border-2 border-slate-200" />
                      <button 
                        type="button"
                        onClick={() => setForm(f => ({ ...f, photo: '' }))}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="Supprimer la photo"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all file:mr-2 file:py-1 file:px-3 file:border-0"
                    />
                    <p className="text-xs text-slate-400 mt-1">Formats acceptés : JPG, PNG, GIF (max 5MB)</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">
                  Annuler
                </button>
                <button type="submit" className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">
                  {editStudent ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Fiche élève</h3>
              <button onClick={() => setViewStudent(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className={`w-14 h-14 ${viewStudent.color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xl font-bold">{viewStudent.initials}</span>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{viewStudent.name}</p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${viewStudent.status === 'Actif' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {viewStudent.status}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { icon: '✉️', label: 'Email', value: viewStudent.email },
                  { icon: '🏫', label: 'Classe', value: viewStudent.class },
                  { icon: '📞', label: 'Téléphone', value: viewStudent.phone || '—' },
                  { icon: '🎂', label: 'Date de naissance', value: viewStudent.dob || '—' },
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
                <button onClick={() => { setViewStudent(null); openEdit(viewStudent); }}
                  className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors">
                  Modifier
                </button>
                <button onClick={() => setViewStudent(null)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
