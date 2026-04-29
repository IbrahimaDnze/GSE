import { useState } from 'react';
import PageBanner from '../components/PageBanner';
import { useAppData } from '../context/AppDataContext';
import { exportToCSV } from '../utils/export';

const SUBJECTS = ['Maths', 'Français', 'Anglais', 'Histoire', 'Sciences', 'Physique'];

const gradeColor = (g) => {
  if (!g && g !== 0) return 'text-slate-400 bg-slate-50';
  if (g >= 15) return 'text-emerald-700 bg-emerald-50';
  if (g >= 10) return 'text-slate-700 bg-slate-50';
  return 'text-red-600 bg-red-50';
};

const avg = (gradeObj) => {
  const scores = SUBJECTS.map(s => Number(gradeObj[s])).filter(s => !isNaN(s) && s >= 0);
  if (scores.length === 0) return null;
  return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
};

const getMention = (average) => {
  if (average === null) return { label: '—', style: 'bg-slate-100 text-slate-500' };
  const a = parseFloat(average);
  if (a >= 16) return { label: 'Très Bien',  style: 'bg-emerald-100 text-emerald-800' };
  if (a >= 14) return { label: 'Bien',        style: 'bg-blue-100 text-blue-800'       };
  if (a >= 12) return { label: 'Assez Bien',  style: 'bg-yellow-100 text-yellow-800'   };
  if (a >= 10) return { label: 'Passable',    style: 'bg-slate-100 text-slate-600'     };
  return             { label: 'Insuffisant', style: 'bg-red-100 text-red-700'          };
};

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
    <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" {...props} />
  </div>
);

const Grades = () => {
  const { grades, addGrade, deleteGrade, students, classes, syncGradeWithStudent } = useAppData();

  const classNames = classes.length > 0 ? classes.map(c => c.name) : ['6ème A', '5ème B', '4ème C', '3ème A', '2nde B'];
  const [filterClass, setFilterClass]         = useState(classNames[0] || '');
  const [filterTrimestre, setFilterTrimestre]   = useState('T1');
  const [showModal, setShowModal]               = useState(false);
  const [editingGrade, setEditingGrade]         = useState(null);
  const [showBulletinModal, setShowBulletinModal] = useState(false);
  const [selectedGrade, setSelectedGrade]       = useState(null);
  const [form, setForm] = useState({
    studentName: '', matricule: '', Maths: '', Français: '', Anglais: '', Histoire: '', Sciences: '', Physique: ''
  });

  const EMPTY_FORM = { studentName: '', matricule: '', Maths: '', Français: '', Anglais: '', Histoire: '', Sciences: '', Physique: '' };

  /* ── Filtered grades for selected class/trimestre ─── */
  const filteredGrades = grades.filter(g => g.class === filterClass && g.trimestre === filterTrimestre);

  /* ── Students in selected class ──────────────────── */
  const studentsInClass = students.filter(s => s.class === filterClass);

  /* ── Stats ───────────────────────────────────────── */
  const allAvgs = filteredGrades.map(g => parseFloat(avg(g))).filter(v => !isNaN(v));
  const generalAvg = allAvgs.length > 0 ? (allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length).toFixed(1) : null;
  const bestGrade = filteredGrades.length > 0 ? Math.max(...SUBJECTS.flatMap(s => filteredGrades.map(g => Number(g[s]) || 0))) : null;
  const belowAvgCount = allAvgs.filter(a => a < 10).length;
  const topCount = allAvgs.filter(a => a >= 15).length;

  /* ── Open add modal ──────────────────────────────── */
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingGrade(null);
    setShowModal(true);
  };

  // Fonction pour rechercher un élève par matricule
  const handleMatriculeChange = (matricule) => {
    setForm((f) => ({ ...f, matricule }));
    
    if (matricule.trim()) {
      const student = students.find(s => s.matricule === matricule.trim());
      if (student) {
        setForm((f) => ({ ...f, studentName: student.name, matricule }));
      }
    }
  };

  /* ── Open edit modal ─────────────────────────────── */
  const openEdit = (g) => {
    setForm({
      studentName: g.studentName,
      matricule: g.matricule || '',
      Maths: g.Maths ?? '', Français: g.Français ?? '', Anglais: g.Anglais ?? '',
      Histoire: g.Histoire ?? '', Sciences: g.Sciences ?? '', Physique: g.Physique ?? '',
    });
    setEditingGrade(g);
    setShowModal(true);
  };

  /* ── Submit ──────────────────────────────────────── */
  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      studentName: form.studentName,
      matricule: form.matricule,
      class: filterClass,
      trimestre: filterTrimestre,
    };
    SUBJECTS.forEach(s => {
      if (form[s] !== '') data[s] = Number(form[s]);
    });
    
    if (editingGrade) {
      // Synchroniser la note avec les données de l'élève
      syncGradeWithStudent(editingGrade.id, data);
    } else {
      // Pour une nouvelle note, utiliser la fonction de synchronisation
      const gradeId = `g-${Date.now()}`;
      addGrade({
        ...data,
        id: gradeId
      });
      // Synchroniser après l'ajout
      syncGradeWithStudent(gradeId, data);
    }
    
    setShowModal(false);
    setForm(EMPTY_FORM);
    setEditingGrade(null);
  };

  /* ── Export ──────────────────────────────────────── */
  const handleExport = () => {
    if (filteredGrades.length === 0) return alert('Aucune note à exporter pour cette sélection.');
    exportToCSV(
      filteredGrades.map(g => ({
        Élève: g.studentName, Classe: g.class, Trimestre: g.trimestre,
        ...Object.fromEntries(SUBJECTS.map(s => [s, g[s] ?? ''])),
        Moyenne: avg(g) ?? '',
      })),
      `notes_${filterClass}_${filterTrimestre}`
    );
  };

  /* ── Delete ──────────────────────────────────────── */
  const handleDelete = (id) => {
    if (window.confirm('Supprimer ces notes définitivement ?')) deleteGrade(id);
  };

  /* ── Generate Bulletin ─────────────────────────── */
  const handleGenerateBulletin = (grade) => {
    setSelectedGrade(grade);
    setShowBulletinModal(true);
  };

  /* ── Download Bulletin CSV ─────────────────────── */
  const handleDownloadBulletin = (grade) => {
    // Créer le contenu du bulletin
    const bulletinContent = {
      studentName: grade.studentName,
      matricule: grade.matricule || 'N/A',
      class: grade.class,
      trimestre: grade.trimestre === 'T1' ? '1er Trimestre' : grade.trimestre === 'T2' ? '2ème Trimestre' : '3ème Trimestre',
      date: new Date().toLocaleDateString('fr-FR'),
      subjects: SUBJECTS.map(s => ({
        name: s,
        grade: grade[s] !== undefined && grade[s] !== '' ? grade[s] : '—',
        color: grade[s] !== undefined && grade[s] !== '' ? gradeColor(Number(grade[s])) : 'text-slate-400 bg-slate-50'
      })),
      average: avg(grade),
      mention: getMention(avg(grade))
    };

    // Convertir en format CSV pour le téléchargement
    const csvContent = [
      ['Bulletin Scolaire'],
      ['Élève', bulletinContent.studentName],
      ['Matricule', bulletinContent.matricule],
      ['Classe', bulletinContent.class],
      ['Trimestre', bulletinContent.trimestre],
      ['Date', bulletinContent.date],
      [],
      ['Matière', 'Note'],
      ...bulletinContent.subjects.map(s => [s.name, s.grade]),
      [],
      ['Moyenne générale', bulletinContent.average || '—'],
      ['Mention', bulletinContent.mention.label]
    ].map(row => row.join(',')).join('\n');

    // Créer un blob et télécharger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Bulletin_${bulletinContent.studentName}_${bulletinContent.trimestre}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ── Column averages ─────────────────────────────── */
  const colAvgs = SUBJECTS.map(s => {
    const scores = filteredGrades.map(g => Number(g[s])).filter(n => !isNaN(n) && n >= 0);
    return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—';
  });

  return (
    <div className="space-y-6">
      <PageBanner
        label="Pédagogie"
        title="Notes & Bulletins"
        subtitle="Suivi des évaluations par classe et par trimestre"
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
              Saisir des notes
            </button>
          </div>
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Moy. générale',        value: generalAvg ? `${generalAvg}/20` : '—',  bg: 'bg-primary-50',  text: 'text-primary-700' },
          { label: 'Meilleure note',        value: bestGrade !== null ? `${bestGrade}/20` : '—', bg: 'bg-emerald-50', text: 'text-emerald-700' },
          { label: 'En dessous de la moy.', value: `${belowAvgCount} élève${belowAvgCount !== 1 ? 's' : ''}`, bg: 'bg-red-50',     text: 'text-red-600'     },
          { label: 'Élèves en tête',        value: `${topCount} élève${topCount !== 1 ? 's' : ''}`,           bg: 'bg-amber-50',   text: 'text-amber-700'   },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl border border-slate-200/60 p-5`}>
            <p className={`text-xl font-bold ${s.text}`}>{s.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-700 flex-1">Relevé de notes</p>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400 transition-all appearance-none cursor-pointer">
              {classNames.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <select value={filterTrimestre} onChange={e => setFilterTrimestre(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400 transition-all appearance-none cursor-pointer">
              {['T1','T2','T3'].map(t => <option key={t} value={t}>{t === 'T1' ? '1er Trimestre' : t === 'T2' ? '2ème Trimestre' : '3ème Trimestre'}</option>)}
            </select>
          </div>
        </div>

        {filteredGrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            <p className="text-sm font-medium">Aucune note pour {filterClass} — {filterTrimestre}</p>
            <button onClick={openAdd} className="mt-3 px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 transition-colors">
              Saisir les premières notes
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Photo</th>
                  {SUBJECTS.map(s => (
                    <th key={s} className="px-4 py-3 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{s}</th>
                  ))}
                  <th className="px-5 py-3 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Moyenne</th>
                  <th className="px-5 py-3 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mention</th>
                  <th className="px-5 py-3 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Bulletin</th>
                  <th className="px-5 py-3 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrades.map((g, i) => {
                  const average = avg(g);
                  const { label: mentionLabel, style: mentionStyle } = getMention(average);
                  return (
                    <tr key={g.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i%2?'bg-slate-50/30':''}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {g.photo ? (
                            <img src={g.photo} alt={g.studentName} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                          ) : (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs ${g.color || 'bg-gradient-to-br from-primary-500 to-primary-600'} shadow-sm`}>
                              {g.studentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{g.studentName}</p>
                          </div>
                        </div>
                      </td>
                      {SUBJECTS.map(s => (
                        <td key={s} className="px-4 py-3.5 text-center">
                          {g[s] !== undefined && g[s] !== ''
                            ? <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${gradeColor(Number(g[s]))}`}>{g[s]}</span>
                            : <span className="text-xs text-slate-300">—</span>}
                        </td>
                      ))}
                      <td className="px-5 py-3.5 text-center">
                        {average !== null
                          ? <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${gradeColor(parseFloat(average))}`}>{average}</span>
                          : <span className="text-xs text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${mentionStyle}`}>{mentionLabel}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button onClick={() => handleGenerateBulletin(g)} className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors" title="Générer le bulletin">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors" title="Modifier">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-colors" title="Supprimer">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td className="px-5 py-3 text-xs font-bold text-slate-600 uppercase">Moy. classe</td>
                  {colAvgs.map((m, i) => (
                    <td key={i} className="px-4 py-3 text-center text-xs font-bold text-slate-700">{m}</td>
                  ))}
                  <td className="px-5 py-3 text-center text-xs font-bold text-slate-700">
                    {generalAvg ?? '—'}
                  </td>
                  <td colSpan={1} />
                  <td colSpan={1} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Grade Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{editingGrade ? 'Modifier les notes' : 'Saisir des notes'}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{filterClass} — {filterTrimestre === 'T1' ? '1er' : filterTrimestre === 'T2' ? '2ème' : '3ème'} Trimestre</p>
              </div>
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
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Élève *</label>
                {studentsInClass.length > 0 && !editingGrade ? (
                  <select required value={form.studentName}
                    onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                    <option value="">Sélectionner un élève</option>
                    {studentsInClass.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    <option value="__custom__">Autre (saisir manuellement)</option>
                  </select>
                ) : (
                  <input required type="text" placeholder="Nom complet de l'élève"
                    value={form.studentName === '__custom__' ? '' : form.studentName}
                    onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                )}
                {form.studentName === '__custom__' && (
                  <input required type="text" placeholder="Nom complet de l'élève" autoFocus
                    onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))}
                    className="mt-2 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-3">Notes par matière (sur 20)</p>
                <div className="grid grid-cols-2 gap-3">
                  {SUBJECTS.map(s => (
                    <InputField key={s} label={s} type="number" min="0" max="20" step="0.5"
                      placeholder="—" value={form[s]}
                      onChange={e => setForm(f => ({ ...f, [s]: e.target.value }))} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">Annuler</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">
                  {editingGrade ? 'Enregistrer' : 'Saisir les notes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulletin Modal */}
      {showBulletinModal && selectedGrade && (
        <div key={`bulletin-${selectedGrade.id}`} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-slate-200">
            {/* Header avec barre de navigation style */}
            <div className="bg-white border-b border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Notes & Bulletins</h3>
                    <p className="text-sm text-slate-500">Tableau de bord</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </button>
                  <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  </button>
                  <button onClick={() => setShowBulletinModal(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Filtres */}
              <div className="flex gap-4 items-center bg-slate-50 rounded-lg p-4">
                <select className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700">
                  <option>2023-2024</option>
                </select>
                <select className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700">
                  <option>{selectedGrade.class}</option>
                </select>
                <select className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700">
                  <option>{selectedGrade.trimestre === 'T1' ? '1er Trimestre' : selectedGrade.trimestre === 'T2' ? '2ème Trimestre' : '3ème Trimestre'}</option>
                </select>
                <select className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700">
                  <option>Toutes les matières</option>
                </select>
                <button className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Imprimer le bulletin
                </button>
              </div>

              {/* Informations de l'élève */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center gap-6">
                  {selectedGrade.photo ? (
                    <img src={selectedGrade.photo} alt={selectedGrade.studentName} className="w-20 h-20 rounded-xl object-cover border-2 border-white shadow-md" />
                  ) : (
                    <div className={`w-20 h-20 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md ${selectedGrade.color || 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                      {selectedGrade.studentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{selectedGrade.studentName}</h3>
                    <p className="text-sm text-slate-600 mb-4">Matricule: {selectedGrade.matricule || 'N/A'}</p>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg px-3 py-2 text-center">
                        <p className="text-xs text-slate-500">Moyenne générale</p>
                        <p className="text-lg font-bold text-slate-900">{avg(selectedGrade) || '—'}/20</p>
                        <p className="text-xs text-blue-600 font-medium">Bien</p>
                      </div>
                      <div className="bg-white rounded-lg px-3 py-2 text-center">
                        <p className="text-xs text-slate-500">Rang</p>
                        <p className="text-lg font-bold text-slate-900">5/28</p>
                        <p className="text-xs text-slate-500">dans la classe</p>
                      </div>
                      <div className="bg-white rounded-lg px-3 py-2 text-center">
                        <p className="text-xs text-slate-500">Moyenne classe</p>
                        <p className="text-lg font-bold text-slate-900">13.45/20</p>
                      </div>
                      <div className="bg-white rounded-lg px-3 py-2 text-center">
                        <p className="text-xs text-slate-500">Appréciation</p>
                        <p className="text-lg font-bold text-slate-900">Très bien</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Détail des notes */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Matière</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Coefficient</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Devoirs</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Composition</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Examen</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Moyenne</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Appréciation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SUBJECTS.map((s, index) => {
                      const grade = selectedGrade[s] !== undefined && selectedGrade[s] !== '' ? Number(selectedGrade[s]) : null;
                      return (
                        <tr key={`grade-${selectedGrade.id}-${s}-${index}`} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{s}</td>
                          <td className="px-4 py-3 text-center text-sm text-slate-600">1</td>
                          <td className="px-4 py-3 text-center text-sm text-slate-600">{grade || '—'}</td>
                          <td className="px-4 py-3 text-center text-sm text-slate-600">{grade || '—'}</td>
                          <td className="px-4 py-3 text-center text-sm text-slate-600">{grade || '—'}</td>
                          <td className="px-4 py-3 text-center">
                            {grade !== null ? (
                              <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold ${grade >= 15 ? 'bg-emerald-100 text-emerald-700' : grade >= 12 ? 'bg-blue-100 text-blue-700' : grade >= 10 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                {grade}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {grade !== null ? (
                              <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold ${grade >= 15 ? 'bg-emerald-100 text-emerald-700' : grade >= 12 ? 'bg-blue-100 text-blue-700' : grade >= 10 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                {grade >= 15 ? 'Excellent' : grade >= 12 ? 'Bien' : grade >= 10 ? 'Passable' : 'Insuffisant'}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">Non noté</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-50 font-semibold">
                      <td className="px-4 py-3 text-xs text-slate-600 uppercase">TOTAL DES COEFFICIENTS</td>
                      <td className="px-4 py-3 text-center text-sm text-slate-900">{SUBJECTS.length}</td>
                      <td colSpan={4} className="px-4 py-3 text-center text-xs text-slate-600 uppercase">MOYENNE GÉNÉRALE</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">
                          {avg(selectedGrade) || '—'} - {getMention(avg(selectedGrade)).label}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Résumé des moyennes */}
              <div key="summary" className="bg-white rounded-lg border border-slate-200 p-6">
                <h4 className="text-lg font-semibold text-slate-900 mb-4">Résumé des moyennes</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div key="excellent" className="text-center">
                    <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                      <span className="text-lg font-bold text-emerald-700">8</span>
                    </div>
                    <p className="text-xs text-slate-600">≥ 14</p>
                  </div>
                  <div key="bien" className="text-center">
                    <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
                      <span className="text-lg font-bold text-blue-700">12</span>
                    </div>
                    <p className="text-xs text-slate-600">10-13.99</p>
                  </div>
                  <div key="passable" className="text-center">
                    <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-2">
                      <span className="text-lg font-bold text-amber-700">6</span>
                    </div>
                    <p className="text-xs text-slate-600">&lt; 10</p>
                  </div>
                  <div key="absents" className="text-center">
                    <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-2">
                      <span className="text-lg font-bold text-slate-700">2</span>
                    </div>
                    <p className="text-xs text-slate-600">Absents</p>
                  </div>
                </div>
              </div>

              {/* Appréciation du conseil de classe */}
              <div key="appreciation" className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-slate-900 mb-3">Appréciation du conseil de classe</h4>
                <p className="text-sm text-slate-700 mb-4">
                  {selectedGrade.studentName} a fait des progrès significatifs ce trimestre. Il participe activement en classe et montre une bonne compréhension des concepts. 
                  Il est encouragé à maintenir cet effort et à approfondir ses connaissances dans les matières où il peut encore s'améliorer.
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-slate-500">Fait à {selectedGrade.class}, le {new Date().toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">Le Directeur</p>
                    <p className="text-xs text-slate-500">Signature</p>
                  </div>
                </div>
              </div>

              {/* Actions rapides */}
              <div key="actions" className="flex gap-3">
                <button className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                  Voir bulletin complet
                </button>
                <button key="download" onClick={() => handleDownloadBulletin(selectedGrade)} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Télécharger en PDF
                </button>
                <button key="send" className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Envoyer aux parents
                </button>
              </div>

              {/* Bulletins précédents */}
              <div key="previous-bulletins" className="bg-white rounded-lg border border-slate-200 p-6">
                <h4 className="text-lg font-semibold text-slate-900 mb-4">Bulletins précédents</h4>
                <div className="space-y-3">
                  <div key="t1" className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-900">1er Trimestre</p>
                      <p className="text-xs text-slate-500">2023-2024</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">14.5/20</p>
                      <p className="text-xs text-blue-600">Bien</p>
                    </div>
                  </div>
                  <div key="t2" className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-900">2ème Trimestre</p>
                      <p className="text-xs text-slate-500">2023-2024</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">15.32/20</p>
                      <p className="text-xs text-emerald-600">Très bien</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Grades;
