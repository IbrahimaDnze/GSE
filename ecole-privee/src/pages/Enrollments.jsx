import { useState } from 'react';
import PageBanner from '../components/PageBanner';
import { useAppData } from '../context/AppDataContext';
import { exportToCSV } from '../utils/export';

const CLASSES = ['6ème A', '5ème B', '4ème C', '3ème A', '2nde B'];

const statusStyle = {
  Accepté:     'bg-emerald-50 text-emerald-700',
  'En attente': 'bg-amber-50 text-amber-700',
  Refusé:      'bg-red-50 text-red-600',
};

const EMPTY_FORM = { 
    student: '', matricule: '', dob: '', birthPlace: '', filiations: '', address: '', parent: '', parentPhone: '', gender: '',
    classReq: '', schoolYear: '', docs: false 
  };

const Enrollments = () => {
  const { enrollments, addEnrollment, updateEnrollment, deleteEnrollment, students, updateStudent, addStudent } = useAppData();
  const [filter, setFilter]           = useState('Tous');
  const [showModal, setShowModal]       = useState(false);
  const [showReenrollModal, setShowReenrollModal] = useState(false);
  const [viewItem, setViewItem]         = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [reenrollForm, setReenrollForm] = useState({ matricule: '', studentId: '', classReq: '', parent: '', parentPhone: '', gender: '', schoolYear: '', docs: false });

  const tabs = ['Tous', 'En attente', 'Accepté', 'Refusé'];
  const filtered = filter === 'Tous' ? enrollments : enrollments.filter((i) => i.status === filter);
  const counts   = tabs.slice(1).reduce((acc, t) => ({ ...acc, [t]: enrollments.filter((i) => i.status === t).length }), {});

  const accept = (id) => updateEnrollment(id, { status: 'Accepté' });
  const refuse = (id) => updateEnrollment(id, { status: 'Refusé' });
  const handleDelete = (id) => {
    if (window.confirm('Supprimer cette inscription ?')) deleteEnrollment(id);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    
    // Créer l'élève avec toutes les informations nécessaires
    const studentData = {
      name: form.student,
      matricule: form.matricule,
      dob: form.dob,
      birthPlace: form.birthPlace,
      filiations: form.filiations,
      address: form.address,
      class: form.classReq,
      schoolYear: form.schoolYear,
      gender: form.gender,
      parent: form.parent,
      parentPhone: form.parentPhone,
      status: 'Actif'
    };
    
    // Ajouter l'élève à la base de données
    addStudent(studentData);
    
    // Créer la demande d'inscription
    addEnrollment({
      student: form.student,
      parent: form.parent,
      parentPhone: form.parentPhone,
      parentEmail: form.parentEmail,
      classReq: form.classReq,
      schoolYear: form.schoolYear,
      gender: form.gender,
      photo: studentData.photo,
      docs: form.docs,
      status: 'Accepté' // Auto-accepter car on crée directement l'élève
    });
    
    setShowModal(false);
    setForm(EMPTY_FORM);
  };

  const handleReenroll = (e) => {
    e.preventDefault();
    const selectedStudent = students.find(s => s.id === reenrollForm.studentId);
    if (selectedStudent) {
      // Mettre à jour la classe de l'élève existant
      updateStudent(selectedStudent.id, {
        class: reenrollForm.classReq,
        status: 'Actif',
        parent: reenrollForm.parent,
        parentPhone: reenrollForm.parentPhone,
        gender: reenrollForm.gender,
        schoolYear: reenrollForm.schoolYear
      });
      
      // Vérifier si une inscription existe déjà pour cet élève
      const existingEnrollments = enrollments.filter(enr => 
        enr.student === selectedStudent.name && 
        enr.status !== 'Refusé'
      );
      
      if (existingEnrollments.length > 0) {
        // Mettre à jour toutes les inscriptions existantes
        existingEnrollments.forEach(enrollment => {
          updateEnrollment(enrollment.id, {
            parent: reenrollForm.parent,
            parentPhone: reenrollForm.parentPhone,
            parentEmail: reenrollForm.parentEmail,
            classReq: reenrollForm.classReq,
            schoolYear: reenrollForm.schoolYear,
            gender: reenrollForm.gender,
            photo: selectedStudent.photo,
            docs: reenrollForm.docs,
            status: 'Accepté'
          });
        });
      } else {
        // Créer une nouvelle inscription seulement si aucune n'existe
        addEnrollment({
          student: selectedStudent.name,
          parent: reenrollForm.parent,
          parentPhone: reenrollForm.parentPhone,
          parentEmail: reenrollForm.parentEmail,
          classReq: reenrollForm.classReq,
          schoolYear: reenrollForm.schoolYear,
          gender: reenrollForm.gender,
          photo: selectedStudent.photo,
          docs: reenrollForm.docs,
          status: 'Accepté'
        });
      }
    }
    setShowReenrollModal(false);
    setReenrollForm({ matricule: '', studentId: '', classReq: '', parent: '', parentPhone: '', gender: '', schoolYear: '', docs: false });
  };

  const handleExport = () => {
    if (enrollments.length === 0) return alert('Aucune donnée à exporter.');
    exportToCSV(
      enrollments.map(({ id, ...r }) => r),
      'inscriptions',
      ['student', 'parent', 'classReq', 'date', 'status', 'docs']
    );
  };

  return (
    <div className="space-y-6">
      <PageBanner
        label="Scolarité"
        title="Inscriptions"
        subtitle={`${enrollments.length} demande${enrollments.length !== 1 ? 's' : ''} · ${counts['En attente'] || 0} en attente de traitement`}
        actions={
          <div className="flex gap-3">
            <button onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors px-4 py-2 text-sm font-medium border border-white/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Exporter CSV
            </button>
            <button onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}
              className="inline-flex items-center gap-2 rounded-xl bg-white text-primary-700 hover:bg-primary-50 transition-colors px-4 py-2 text-sm font-semibold shadow-sm">
              <span className="text-lg">➕</span>
              Nouvelle inscription
            </button>
            <button onClick={() => { setReenrollForm({ matricule: '', studentId: '', classReq: '', parent: '', parentPhone: '', gender: '', schoolYear: '', docs: false }); setShowReenrollModal(true); }}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors px-4 py-2 text-sm font-semibold shadow-sm">
              <span className="text-lg">🔁</span>
              Réinscrire un élève existant
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total',      value: enrollments.length,           bg: 'bg-slate-50',   text: 'text-slate-700'   },
          { label: 'En attente', value: counts['En attente'] || 0,    bg: 'bg-amber-50',   text: 'text-amber-700'   },
          { label: 'Acceptées',  value: counts['Accepté'] || 0,       bg: 'bg-emerald-50', text: 'text-emerald-700' },
          { label: 'Refusées',   value: counts['Refusé'] || 0,        bg: 'bg-red-50',     text: 'text-red-600'     },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl border border-slate-200/60 p-5`}>
            <p className={`text-3xl font-bold ${s.text}`}>{s.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="flex gap-1 px-5 pt-4 border-b border-slate-100">
          {tabs.map((t) => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-xl transition-colors border-b-2 -mb-px ${
                filter === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              {t}
              {t !== 'Tous' && counts[t] > 0 && (
                <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filter === t ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'}`}>
                  {counts[t]}
                </span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <span className="text-4xl mb-3">📋</span>
            <p className="text-sm font-medium">Aucune inscription trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Matricule', 'Photo', 'Parent', 'Classe demandée', 'Date', 'Statut', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  // Récupérer le matricule depuis les données de l'élève correspondant
                  const correspondingStudent = students.find(s => s.name === row.student);
                  const matricule = correspondingStudent?.matricule || row.matricule || 'N/A';
                  
                  return (
                  <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded-lg">{matricule}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {row.photo ? (
                          <img src={row.photo} alt={row.student} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs ${row.color || 'bg-gradient-to-br from-primary-500 to-primary-600'} shadow-sm`}>
                            {row.student.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{row.student}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{row.parent}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium bg-primary-50 text-primary-700 px-2.5 py-1 rounded-lg">{row.classReq}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{row.date}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyle[row.status]}`}>{row.status}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewItem(row)} className="p-1.5 rounded-lg text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors" title="Voir">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        {row.status === 'En attente' ? (
                          <>
                            <button onClick={() => accept(row.id)} className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold rounded-lg transition-colors">Accepter</button>
                            <button onClick={() => refuse(row.id)} className="px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold rounded-lg transition-colors">Refuser</button>
                          </>
                        ) : (
                          <button onClick={() => { updateEnrollment(row.id, { status: 'En attente' }); }} className="px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-semibold rounded-lg transition-colors">Réinitialiser</button>
                        )}
                        <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-colors" title="Supprimer">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Nouvelle demande d'inscription</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="border-b border-slate-200 pb-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-4">Informations de l'élève</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Élève *</label>
                    <input required type="text" placeholder="ex: Jean Dupont" value={form.student} onChange={(e) => setForm((f) => ({ ...f, student: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Matricule *</label>
                    <input required type="text" placeholder="ex: MAT2024001" value={form.matricule} onChange={(e) => setForm((f) => ({ ...f, matricule: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date de naissance</label>
                    <input type="date" value={form.dob} onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Lieu de naissance</label>
                    <input type="text" placeholder="ex: Paris, France" value={form.birthPlace} onChange={(e) => setForm((f) => ({ ...f, birthPlace: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Filiations</label>
                  <input type="text" placeholder="ex: Pierre Dupont (père) et Marie Durand (mère)" value={form.filiations} onChange={(e) => setForm((f) => ({ ...f, filiations: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Adresse</label>
                  <input type="text" placeholder="ex: 123 Rue de l'École, 75001 Paris" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Genre de l'élève *</label>
                    <select required value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                      <option value="">Sélectionner</option>
                      <option value="Masculin">Masculin</option>
                      <option value="Féminin">Féminin</option>
                    </select>
                  </div>
                                  </div>
              </div>
              
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-4">Informations parentales</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Parent / Tuteur *</label>
                    <input required type="text" placeholder="ex: Marie Dupont" value={form.parent} onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Téléphone parent</label>
                    <input type="tel" placeholder="ex: 06 98 76 54 32" value={form.parentPhone} onChange={(e) => setForm((f) => ({ ...f, parentPhone: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Classe souhaitée *</label>
                  <select required value={form.classReq} onChange={(e) => setForm((f) => ({ ...f, classReq: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                    <option value="">Sélectionner</option>
                    {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Année scolaire *</label>
                  <select required value={form.schoolYear} onChange={(e) => setForm((f) => ({ ...f, schoolYear: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                    <option value="">Sélectionner</option>
                    <option value="2023-2024">2023-2024</option>
                    <option value="2024-2025">2024-2025</option>
                    <option value="2025-2026">2025-2026</option>
                  </select>
                </div>
              </div>
              
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.docs} onChange={(e) => setForm((f) => ({ ...f, docs: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                <span className="text-sm text-slate-600">Documents complets fournis</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">Soumettre</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reenroll Modal */}
      {showReenrollModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Réinscrire un élève existant</h3>
              <button onClick={() => setShowReenrollModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleReenroll} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Matricule de l'élève</label>
                <input 
                  type="text" 
                  placeholder="ex: MAT2024001" 
                  value={reenrollForm.matricule} 
                  onChange={(e) => {
                    const matricule = e.target.value.toUpperCase();
                    setReenrollForm(f => ({ ...f, matricule }));
                    
                    // Recherche automatique de l'élève par matricule
                    if (matricule) {
                      const foundStudent = students.find(s => s.matricule === matricule);
                      if (foundStudent) {
                        setReenrollForm(f => ({ 
                          ...f, 
                          studentId: foundStudent.id,
                          parent: foundStudent.parent || '',
                          parentPhone: foundStudent.parentPhone || '',
                          parentEmail: foundStudent.parentEmail || ''
                        }));
                      } else {
                        setReenrollForm(f => ({ ...f, studentId: '' }));
                      }
                    } else {
                      setReenrollForm(f => ({ ...f, studentId: '' }));
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" 
                />
                {reenrollForm.matricule && students.find(s => s.matricule === reenrollForm.matricule) && (
                  <p className="mt-1 text-xs text-emerald-600 font-medium">
                    ✓ Élève trouvé: {students.find(s => s.matricule === reenrollForm.matricule)?.name}
                  </p>
                )}
                {reenrollForm.matricule && !students.find(s => s.matricule === reenrollForm.matricule) && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    ✗ Aucun élève trouvé avec ce matricule
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ou sélectionner manuellement</label>
                <select value={reenrollForm.studentId} onChange={(e) => {
                  const studentId = e.target.value;
                  setReenrollForm(f => ({ ...f, studentId }));
                  
                  // Mettre à jour le matricule si un élève est sélectionné
                  if (studentId) {
                    const selectedStudent = students.find(s => s.id === studentId);
                    if (selectedStudent) {
                      setReenrollForm(f => ({ 
                        ...f, 
                        matricule: selectedStudent.matricule || '',
                        parent: selectedStudent.parent || '',
                        parentPhone: selectedStudent.parentPhone || '',
                        parentEmail: selectedStudent.parentEmail || ''
                      }));
                    }
                  }
                }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                  <option value="">Sélectionner un élève</option>
                  {students.filter((student, index, self) => 
                    index === self.findIndex((s) => s.id === student.id)
                  ).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.matricule || 'N/A'}) - {s.class || 'Non assigné'}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nouvelle classe *</label>
                  <select required value={reenrollForm.classReq} onChange={(e) => setReenrollForm(f => ({ ...f, classReq: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                    <option value="">Sélectionner</option>
                    {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Genre de l'élève *</label>
                  <select required value={reenrollForm.gender} onChange={(e) => setReenrollForm(f => ({ ...f, gender: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                    <option value="">Sélectionner</option>
                    <option value="Masculin">Masculin</option>
                    <option value="Féminin">Féminin</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Année scolaire *</label>
                <select required value={reenrollForm.schoolYear} onChange={(e) => setReenrollForm(f => ({ ...f, schoolYear: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                  <option value="">Sélectionner</option>
                  <option value="2023-2024">2023-2024</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Parent / Tuteur *</label>
                <input required type="text" placeholder="ex: Marie Dupont" value={reenrollForm.parent} onChange={(e) => setReenrollForm(f => ({ ...f, parent: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Téléphone parent</label>
                <input type="tel" placeholder="ex: 06 98 76 54 32" value={reenrollForm.parentPhone} onChange={(e) => setReenrollForm(f => ({ ...f, parentPhone: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={reenrollForm.docs} onChange={(e) => setReenrollForm(f => ({ ...f, docs: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                <span className="text-sm text-slate-600">Documents complets fournis</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowReenrollModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">Réinscrire</button>
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
              <h3 className="text-lg font-bold text-slate-900">Détail inscription</h3>
              <button onClick={() => setViewItem(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: 'Élève',           value: viewItem.student   },
                { label: 'Parent / Tuteur', value: viewItem.parent    },
                { label: 'Classe souhaitée',value: viewItem.classReq  },
                { label: 'Date de demande', value: viewItem.date      },
                { label: 'Documents',       value: viewItem.docs ? 'Complets ✓' : 'Incomplets ⚠' },
                { label: 'Statut',          value: viewItem.status    },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-medium text-slate-800">{value}</p>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                {viewItem.status === 'En attente' && (
                  <>
                    <button onClick={() => { accept(viewItem.id); setViewItem(null); }} className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors">Accepter</button>
                    <button onClick={() => { refuse(viewItem.id); setViewItem(null); }} className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors">Refuser</button>
                  </>
                )}
                <button onClick={() => setViewItem(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enrollments;
