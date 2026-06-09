import { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { exportToCSV } from '../utils/export';
import { useToast } from '../context/ToastContext';

const PALETTE = ['#d97706', '#db2777', '#10b981', '#7c3aed', '#6366f1', '#0891b2', '#be185d', '#0d9488', '#ca8a04', '#1d4ed8'];

const gradeColor = (g) => {
  if (!g && g !== 0) return { color: '#d4cfc4', bg: 'transparent' };
  if (g >= 15) return { color: '#065f46', bg: '#ecfdf5' };
  if (g >= 10) return { color: '#1a1a2e', bg: 'transparent' };
  return { color: '#b91c1c', bg: '#fef2f2' };
};

const avg = (gradeObj, subjectList) => {
  const scores = subjectList.map(s => Number(gradeObj[s])).filter(s => !isNaN(s) && s >= 0);
  if (scores.length === 0) return null;
  return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
};

const getMention = (average) => {
  if (average === null) return { label: '—', style: { color: '#9ca3af' } };
  const a = parseFloat(average);
  if (a >= 16) return { label: 'Très Bien', style: { color: '#065f46' } };
  if (a >= 14) return { label: 'Bien', style: { color: '#0d7a5e' } };
  if (a >= 12) return { label: 'Assez Bien', style: { color: '#92400e' } };
  if (a >= 10) return { label: 'Passable', style: { color: '#57534e' } };
  return { label: 'Insuffisant', style: { color: '#b91c1c' } };
};

const Grades = () => {
  const { grades, addGrade, deleteGrade, students, classes, subjects, subjectData, syncGradeWithStudent } = useAppData();

  const subjectColors = {};
  subjects.forEach((s, i) => { subjectColors[s] = PALETTE[i % PALETTE.length]; });

  const EMPTY_FORM_VALUES = {};
  subjects.forEach(s => { EMPTY_FORM_VALUES[s] = ''; });

  const classNames = classes.length > 0 ? classes.map(c => c.name) : ['6ème A', '5ème B', '4ème C', '3ème A', '2nde B'];
  const getLevelForClass = (className) => {
    const cls = classes.find(c => c.name === className);
    return cls ? cls.level : '';
  };
  const [filterClass, setFilterClass] = useState(classNames[0] || '');
  const [filterTrimestre, setFilterTrimestre] = useState('T1');
  const [showModal, setShowModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [showBulletinModal, setShowBulletinModal] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [form, setForm] = useState({ studentName: '', matricule: '', class: classNames[0] || '', ...EMPTY_FORM_VALUES });
  const formLevel = getLevelForClass(form.class);
  const filteredSubjects = subjectData.filter(sd => !formLevel || sd.level === formLevel).map(sd => sd.name);
  const { showToast } = useToast();

  const filteredGrades = grades.filter(g => g.class === filterClass && g.trimestre === filterTrimestre);
  const studentsInClass = students.filter(s => s.class === filterClass);

  const allAvgs = filteredGrades.map(g => parseFloat(avg(g, subjects))).filter(v => !isNaN(v));
  const generalAvg = allAvgs.length > 0 ? (allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length).toFixed(1) : null;
  const bestGrade = filteredGrades.length > 0 ? Math.max(...subjects.flatMap(s => filteredGrades.map(g => Number(g[s]) || 0))) : null;
  const belowAvgCount = allAvgs.filter(a => a < 10).length;
  const topCount = allAvgs.filter(a => a >= 15).length;

  const openAdd = () => {
    setForm({ studentName: '', matricule: '', class: filterClass, ...EMPTY_FORM_VALUES });
    setEditingGrade(null);
    setShowModal(true);
  };

  const handleMatriculeChange = (matricule) => {
    setForm((f) => ({ ...f, matricule }));
    if (matricule.trim()) {
      const student = students.find(s => s.matricule === matricule.trim());
      if (student) {
        setForm((f) => ({ ...f, studentName: student.name, matricule }));
      }
    }
  };

  const openEdit = (g) => {
    const vals = { studentName: g.studentName, matricule: g.matricule || '', class: g.class || filterClass };
    subjects.forEach(s => { vals[s] = g[s] ?? ''; });
    setForm(vals);
    setEditingGrade(g);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        studentName: form.studentName,
        matricule: form.matricule,
        class: form.class || filterClass,
        trimestre: filterTrimestre,
      };
      subjects.forEach(s => {
        if (form[s] !== '') data[s] = Number(form[s]);
      });
      if (editingGrade) {
        await syncGradeWithStudent(editingGrade.id, data);
        showToast('Notes modifiées avec succès', 'success');
      } else {
        const gradeId = `g-${Date.now()}`;
        await addGrade({ ...data, id: gradeId });
        await syncGradeWithStudent(gradeId, data);
        showToast('Notes ajoutées avec succès', 'success');
      }
      setShowModal(false);
      setForm({ studentName: '', matricule: '', class: filterClass, ...EMPTY_FORM_VALUES });
      setEditingGrade(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de l\'enregistrement', 'error');
    }
  };

  const handleExport = () => {
    if (filteredGrades.length === 0) return alert('Aucune note à exporter pour cette sélection.');
    exportToCSV(
      filteredGrades.map(g => ({
        Élève: g.studentName, Classe: g.class, Trimestre: g.trimestre,
        ...Object.fromEntries(subjects.map(s => [s, g[s] ?? ''])),
        Moyenne: avg(g, subjects) ?? '',
      })),
      `notes_${filterClass}_${filterTrimestre}`
    );
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ces notes définitivement ?')) return;
    try {
      await deleteGrade(id);
      showToast('Notes supprimées avec succès', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de la suppression', 'error');
    }
  };

  const handleGenerateBulletin = (grade) => {
    setSelectedGrade(grade);
    setShowBulletinModal(true);
  };

  const handleDownloadBulletin = (grade) => {
    const bulletinContent = {
      studentName: grade.studentName,
      matricule: grade.matricule || 'N/A',
      class: grade.class,
      trimestre: grade.trimestre === 'T1' ? '1er Trimestre' : grade.trimestre === 'T2' ? '2ème Trimestre' : '3ème Trimestre',
      date: new Date().toLocaleDateString('fr-FR'),
      subjects: subjects.map(s => ({
        name: s,
        grade: grade[s] !== undefined && grade[s] !== '' ? grade[s] : '—',
        color: grade[s] !== undefined && grade[s] !== '' ? gradeColor(Number(grade[s])) : { color: '#d4cfc4', bg: 'transparent' }
      })),
      average: avg(grade, subjects),
      mention: getMention(avg(grade, subjects))
    };
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

  const colAvgs = subjects.map(s => {
    const scores = filteredGrades.map(g => Number(g[s])).filter(n => !isNaN(n) && n >= 0);
    return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—';
  });

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h2><i className="fa-solid fa-book" style={{ color: '#b8860b', marginRight: 8 }}></i> Notes & Bulletins</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExport} className="btn btn-primary">
            <i className="fa-solid fa-download"></i> Exporter CSV
          </button>
          <button onClick={openAdd} className="btn btn-primary">
            <i className="fa-solid fa-plus"></i> Saisir des notes
          </button>
        </div>
      </div>

      <div className="stu-stats">
        <div className="stu-stat-card" style={{ borderTopColor: '#0d7a5e' }}>
          <div className="stu-stat-icon" style={{ background: '#ecfdf5', color: '#0d7a5e' }}>
            <i className="fa-solid fa-calculator"></i>
          </div>
          <div>
            <div className="stu-stat-value">{generalAvg ? `${generalAvg}/20` : '—'}</div>
            <div className="stu-stat-label">Moy. générale</div>
          </div>
        </div>
        <div className="stu-stat-card" style={{ borderTopColor: '#10b981' }}>
          <div className="stu-stat-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
            <i className="fa-solid fa-star"></i>
          </div>
          <div>
            <div className="stu-stat-value">{bestGrade !== null ? `${bestGrade}/20` : '—'}</div>
            <div className="stu-stat-label">Meilleure note</div>
          </div>
        </div>
        <div className="stu-stat-card" style={{ borderTopColor: '#ef4444' }}>
          <div className="stu-stat-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
            <i className="fa-solid fa-arrow-down"></i>
          </div>
          <div>
            <div className="stu-stat-value">{belowAvgCount}</div>
            <div className="stu-stat-label">En dessous de 10</div>
          </div>
        </div>
        <div className="stu-stat-card" style={{ borderTopColor: '#b8860b' }}>
          <div className="stu-stat-icon" style={{ background: '#fffbeb', color: '#b8860b' }}>
            <i className="fa-solid fa-trophy"></i>
          </div>
          <div>
            <div className="stu-stat-value">{topCount}</div>
            <div className="stu-stat-label">≥ 15/20</div>
          </div>
        </div>
      </div>

      <div className="stu-filters">
        <div className="stu-filter-group">
          <i className="fa-solid fa-school"></i>
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)}>
            {classNames.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="stu-filter-group">
          <i className="fa-solid fa-calendar"></i>
          <select value={filterTrimestre} onChange={e => setFilterTrimestre(e.target.value)}>
            {['T1','T2','T3'].map(t => <option key={t} value={t}>{t === 'T1' ? '1er Trimestre' : t === 'T2' ? '2ème Trimestre' : '3ème Trimestre'}</option>)}
          </select>
        </div>
      </div>

      <div className="table-container">
        {filteredGrades.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af' }}>
            <i className="fa-solid fa-book" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.4 }}></i>
            <p style={{ fontSize: 14, fontWeight: 500 }}>Aucune note pour {filterClass} — {filterTrimestre}</p>
            <button onClick={openAdd} className="btn btn-primary" style={{ marginTop: 12 }}>
              <i className="fa-solid fa-plus"></i> Saisir les premières notes
            </button>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th style={{ background: '#0d7a5e', color: '#fff', padding: '8px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Élève</th>
                  {subjects.map(s => (
                    <th key={s} style={{ background: subjectColors[s], color: '#fff', padding: '8px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>{s}</th>
                  ))}
                  <th style={{ background: '#b8860b', color: '#fff', padding: '8px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Moy.</th>
                  <th style={{ background: '#7c3aed', color: '#fff', padding: '8px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Mention</th>
                  <th style={{ background: '#78716c', color: '#fff', padding: '8px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrades.map((g, i) => {
                  const average = avg(g, subjects);
                  const { label: mentionLabel, style: mentionStyle } = getMention(average);
                  return (
                    <tr key={g.id}>
                      <td style={{ padding: '8px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {g.photo ? (
                            <img src={g.photo} alt={g.studentName} style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ecfdf5', color: '#0d7a5e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                              {g.studentName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                          )}
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{g.studentName}</div>
                        </div>
                      </td>
                      {subjects.map(s => {
                        const gc = g[s] !== undefined && g[s] !== '' ? gradeColor(Number(g[s])) : { color: '#d4cfc4', bg: 'transparent' };
                        return (
                          <td key={s} style={{ padding: '8px 16px', textAlign: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: gc.color }}>{g[s] ?? '—'}</span>
                          </td>
                        );
                      })}
                      <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                        {average !== null
                          ? <span style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e' }}>{average}</span>
                          : <span style={{ color: '#d4cfc4' }}>—</span>}
                      </td>
                      <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, ...mentionStyle }}>{mentionLabel}</span>
                      </td>
                      <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button onClick={() => handleGenerateBulletin(g)} className="btn btn-sm btn-info" title="Bulletin">
                            <i className="fa-solid fa-file"></i>
                          </button>
                          <button onClick={() => openEdit(g)} className="btn btn-sm btn-primary" title="Modifier">
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button onClick={() => handleDelete(g.id)} className="btn btn-sm btn-danger" title="Supprimer">
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8f7f3' }}>
                  <td style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, color: '#57534e', textTransform: 'uppercase' }}>Moy. classe</td>
                  {colAvgs.map((m, i) => (
                    <td key={i} style={{ padding: '8px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#1a1a2e' }}>{m}</td>
                  ))}
                  <td style={{ padding: '8px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#1a1a2e' }}>{generalAvg ?? '—'}</td>
                  <td></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>

            <div className="stu-pagination">
              <div className="stu-pagination-info">
                {filteredGrades.length > 0 && (
                  <>1–{filteredGrades.length} sur {filteredGrades.length} élève{filteredGrades.length > 1 ? 's' : ''}</>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-content" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3>{editingGrade ? 'Modifier les notes' : 'Saisir des notes'}</h3>
              <button onClick={() => setShowModal(false)} className="modal-close"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Classe</label>
                <select value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value, studentName: '' }))}>
                  {classNames.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <p style={{ fontSize: 12, color: '#78716c', marginBottom: 16 }}>{form.class || filterClass} — {filterTrimestre === 'T1' ? '1er' : filterTrimestre === 'T2' ? '2ème' : '3ème'} Trimestre</p>
              <div className="form-group">
                <label>Matricule</label>
                <div className="matricule-search">
                  <i className="fa-solid fa-id-card"></i>
                  <input type="text" placeholder="ex: MAT2024001" value={form.matricule} onChange={(e) => handleMatriculeChange(e.target.value)} />
                </div>
              </div>
              <div className="form-group required">
                <label>Élève</label>
                {students.filter(s => s.class === (form.class || filterClass)).length > 0 && !editingGrade ? (
                  <select required value={form.studentName} onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))}>
                    <option value="">Sélectionner un élève</option>
                    {students.filter(s => s.class === (form.class || filterClass)).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    <option value="__custom__">Autre (saisir manuellement)</option>
                  </select>
                ) : (
                  <input required type="text" placeholder="Nom complet" value={form.studentName === '__custom__' ? '' : form.studentName} onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))} />
                )}
                {form.studentName === '__custom__' && (
                  <input required type="text" placeholder="Nom complet" autoFocus onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))} style={{ marginTop: 8 }} />
                )}
              </div>
              <div className="form-group">
                <label style={{ marginBottom: 10 }}>Notes par matière (sur 20)</label>
                <div className="form-row" style={{ flexWrap: 'wrap', gap: 0 }}>
                  {filteredSubjects.length > 0 ? filteredSubjects.map((s, idx) => (
                    <div className="form-group" key={s} style={{ flex: '0 0 50%', maxWidth: '50%' }}>
                      <label style={{ fontSize: 11, color: subjectColors[s], fontWeight: 600 }}>{s}</label>
                      <input type="number" min="0" max="20" step="0.5" placeholder="—" value={form[s]} onChange={e => setForm(f => ({ ...f, [s]: e.target.value }))} />
                    </div>
                  )) : <p style={{ fontSize: 12, color: '#9ca3af', padding: 12 }}>Aucune matière pour ce niveau</p>}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-cancel">Annuler</button>
                <button type="submit" className="btn btn-primary">{editingGrade ? 'Enregistrer' : 'Saisir les notes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulletinModal && selectedGrade && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowBulletinModal(false); }}>
          <div className="modal-content" style={{ maxWidth: 720, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Bulletin — {selectedGrade.studentName}</h3>
              <button onClick={() => setShowBulletinModal(false)} className="modal-close"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div style={{ padding: '8px 24px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, padding: 16, background: '#f8f7f3', borderRadius: 12 }}>
                {selectedGrade.photo ? (
                  <img src={selectedGrade.photo} alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: '#0d7a5e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
                    {selectedGrade.studentName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a2e' }}>{selectedGrade.studentName}</div>
                  <div style={{ fontSize: 12, color: '#78716c', marginTop: 2 }}>Matricule: {selectedGrade.matricule || 'N/A'} — {selectedGrade.class} — {selectedGrade.trimestre === 'T1' ? '1er' : selectedGrade.trimestre === 'T2' ? '2ème' : '3ème'} Trimestre</div>
                </div>
                <button onClick={() => handleDownloadBulletin(selectedGrade)} className="btn btn-primary">
                  <i className="fa-solid fa-download"></i> Télécharger
                </button>
              </div>

              <table>
                <thead>
                  <tr>
                    <th style={{ background: '#0d7a5e', color: '#fff', padding: '8px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Matière</th>
                    <th style={{ background: '#0d7a5e', color: '#fff', padding: '8px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Note</th>
                    <th style={{ background: '#0d7a5e', color: '#fff', padding: '8px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Appréciation</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s, idx) => {
                    const gvalue = selectedGrade[s] !== undefined && selectedGrade[s] !== '' ? Number(selectedGrade[s]) : null;
                    return (
                      <tr key={idx}>
                        <td style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: subjectColors[s] }}>{s}</td>
                        <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                          {gvalue !== null ? (
                            <span style={{ fontWeight: 700, fontSize: 13, color: gvalue >= 15 ? '#065f46' : gvalue >= 10 ? '#1a1a2e' : '#b91c1c' }}>{gvalue}</span>
                          ) : <span style={{ color: '#d4cfc4' }}>—</span>}
                        </td>
                        <td style={{ padding: '8px 16px', textAlign: 'center', fontSize: 12, color: '#57534e' }}>
                          {gvalue !== null ? (gvalue >= 15 ? 'Excellent' : gvalue >= 12 ? 'Bien' : gvalue >= 10 ? 'Passable' : 'Insuffisant') : 'Non noté'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8f7f3' }}>
                    <td style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700 }}>Moyenne générale</td>
                    <td style={{ padding: '8px 16px', textAlign: 'center', fontWeight: 700 }}>{avg(selectedGrade, subjects) || '—'}</td>
                    <td style={{ padding: '8px 16px', textAlign: 'center', fontWeight: 600, fontSize: 12 }}>{getMention(avg(selectedGrade, subjects)).label}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Grades;
