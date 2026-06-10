import { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { exportToCSV } from '../utils/export';
import { useToast } from '../context/ToastContext';
import jsPDF from 'jspdf';
import api from '../api/axios';

const PALETTE = ['#d97706', '#db2777', '#10b981', '#7c3aed', '#6366f1', '#0891b2', '#be185d', '#0d9488', '#ca8a04', '#1d4ed8'];

const gradeColor = (g, maxScore = 20) => {
  if (!g && g !== 0) return { color: '#d4cfc4', bg: 'transparent' };
  const threshold = maxScore / 2;
  if (g >= maxScore * 0.75) return { color: '#065f46', bg: '#ecfdf5' };
  if (g >= threshold) return { color: '#1a1a2e', bg: 'transparent' };
  return { color: '#b91c1c', bg: '#fef2f2' };
};

const avg = (gradeObj, subjectList) => {
  const scores = subjectList.map(s => Number(gradeObj[s])).filter(s => !isNaN(s) && s >= 0);
  if (scores.length === 0) return null;
  return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
};

const getMention = (average, maxScore = 20) => {
  if (average === null) return { label: '—', style: { color: '#9ca3af' } };
  const a = parseFloat(average);
  const r = maxScore / 20;
  if (a >= 16 * r) return { label: 'Très Bien', style: { color: '#065f46' } };
  if (a >= 14 * r) return { label: 'Bien', style: { color: '#0d7a5e' } };
  if (a >= 12 * r) return { label: 'Assez Bien', style: { color: '#92400e' } };
  if (a >= 10 * r) return { label: 'Passable', style: { color: '#57534e' } };
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
  const [form, setForm] = useState({ studentName: '', matricule: '', class: '', trimestre: '', ...EMPTY_FORM_VALUES });
  const formLevel = getLevelForClass(form.class);
  const maxScore = formLevel === 'Primaire' ? 10 : 20;
  const filteredSubjects = form.class ? (classes.find(c => c.name === form.class)?.subjects || [...new Set(subjectData.filter(sd => sd.level === formLevel).map(sd => sd.name))]) : [];
  const { showToast } = useToast();

  const filteredGrades = grades.filter(g => g.class === filterClass && g.trimestre === filterTrimestre);
  const studentsInClass = students.filter(s => s.class === filterClass);
  const tableLevel = getLevelForClass(filterClass);
  const tableMaxScore = tableLevel === 'Primaire' ? 10 : 20;
  const tableSubjects = filterClass ? (classes.find(c => c.name === filterClass)?.subjects || [...new Set(subjectData.filter(sd => sd.level === tableLevel).map(sd => sd.name))]) : [];
  const tableSubjectColors = {};
  tableSubjects.forEach((s, i) => { tableSubjectColors[s] = PALETTE[i % PALETTE.length]; });

  const allAvgs = filteredGrades.map(g => parseFloat(avg(g, tableSubjects))).filter(v => !isNaN(v));
  const generalAvg = allAvgs.length > 0 ? (allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length).toFixed(1) : null;
  const bestGrade = filteredGrades.length > 0 ? Math.max(...tableSubjects.flatMap(s => filteredGrades.map(g => Number(g[s]) || 0))) : null;
  const belowAvgCount = allAvgs.filter(a => a < tableMaxScore * 0.5).length;
  const topCount = allAvgs.filter(a => a >= tableMaxScore * 0.75).length;

  const openAdd = () => {
    setForm({ studentName: '', matricule: '', class: '', trimestre: '', ...EMPTY_FORM_VALUES });
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
    const vals = { studentName: g.studentName, matricule: g.matricule || '', class: g.class || '', trimestre: g.trimestre || filterTrimestre };
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
        trimestre: form.trimestre || filterTrimestre,
      };
      subjects.forEach(s => {
        if (form[s] !== '') data[s] = Number(form[s]);
      });
      if (editingGrade) {
        await syncGradeWithStudent(editingGrade._id || editingGrade.id, data);
        showToast('Notes modifiées avec succès', 'success');
      } else {
        const created = await addGrade(data);
        await syncGradeWithStudent(created._id, data);
        showToast('Notes ajoutées avec succès', 'success');
      }
      setFilterClass(data.class);
      setFilterTrimestre(data.trimestre);
      setShowModal(false);
      setForm({ studentName: '', matricule: '', class: '', trimestre: '', ...EMPTY_FORM_VALUES });
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
        ...Object.fromEntries(tableSubjects.map(s => [s, g[s] ?? ''])),
        Moyenne: avg(g, tableSubjects) ?? '',
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

  const handleDownloadBulletin = async (grade) => {
    const bulletinLevel = getLevelForClass(grade.class);
    const bulletinSubjects = classes.find(c => c.name === grade.class)?.subjects || [...new Set(subjectData.filter(sd => !bulletinLevel || sd.level === bulletinLevel).map(sd => sd.name))];
    const maxNote = bulletinLevel === 'Primaire' ? 10 : 20;
    const average = avg(grade, bulletinSubjects);
    const mention = getMention(average, maxNote);

    let schoolName = 'École Privée';
    let logoUrl = '';
    try {
      const raw = localStorage.getItem('school_settings');
      if (raw) {
        const s = JSON.parse(raw);
        schoolName = s.schoolName || schoolName;
        logoUrl = s.logo || '';
      }
    } catch {}
    if (!logoUrl) {
      try {
        const settingsRes = await api.get('/settings');
        logoUrl = settingsRes.data.logo || '';
        schoolName = settingsRes.data.schoolName || schoolName;
      } catch {}
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const cl = '#0d7a5e';
    const gold = '#b8860b';
    const gray = '#57534e';

    // ── Header band ──
    doc.setFillColor('#1e3a5f');
    doc.rect(0, 0, pw, 42, 'F');

    // Logo
    if (logoUrl) {
      try {
        if (logoUrl.startsWith('data:')) {
          doc.addImage(logoUrl, 'PNG', 14, 6, 24, 24);
        } else {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = logoUrl;
          await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          doc.addImage(canvas.toDataURL('image/png'), 'PNG', 14, 6, 24, 24);
        }
      } catch {}
    }

    doc.setTextColor('#ffffff');
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(schoolName, pw / 2, 16, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('BULLETIN SCOLAIRE', pw / 2, 26, { align: 'center' });

    doc.setFontSize(9);
    doc.text('Année scolaire ' + new Date().getFullYear() + ' / ' + (new Date().getFullYear() + 1), pw / 2, 34, { align: 'center' });

    doc.setFillColor(gold);
    doc.rect(50, 37, pw - 100, 1.2, 'F');

    // ── Info student ──
    const infoY = 48;
    doc.setDrawColor('#e8e4db');
    doc.setFillColor('#f8f7f3');
    doc.roundedRect(14, infoY, pw - 28, 32, 3, 3, 'FD');

    doc.setTextColor('#1a1a2e');
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Élève : ' + grade.studentName, 22, infoY + 10);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(gray);
    doc.text('Matricule : ' + (grade.matricule || 'N/A'), 22, infoY + 20);
    doc.text('Classe : ' + grade.class, pw / 2 + 10, infoY + 10);
    doc.text('Trimestre : ' + (grade.trimestre === 'T1' ? '1er' : grade.trimestre === 'T2' ? '2ème' : '3ème'), pw / 2 + 10, infoY + 20);

    // ── Table header ──
    const th = 9;
    const colX = [14, 90, 130, 170];
    const colW = [76, 40, 40, 36];
    const rowH = 8;

    let ty = infoY + 44;
    doc.setFillColor(cl);
    doc.rect(14, ty, pw - 28, th, 'F');
    doc.setTextColor('#ffffff');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const tHeaders = ['Matière', 'Note', 'Appréciation', 'Moy.'];
    tHeaders.forEach((h, i) => doc.text(h, colX[i] + 4, ty + 6));

    // ── Table rows ──
    ty += th;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    bulletinSubjects.forEach((s, i) => {
      const gval = grade[s] !== undefined && grade[s] !== '' ? Number(grade[s]) : null;
      const isEven = i % 2 === 0;
      if (isEven) {
        doc.setFillColor('#faf9f6');
        doc.rect(14, ty, pw - 28, rowH, 'F');
      }
      doc.setTextColor('#1a1a2e');
      doc.text(s, colX[0] + 4, ty + 6);

      if (gval !== null) {
        doc.setTextColor(gval >= maxNote * 0.75 ? '#065f46' : gval >= maxNote * 0.5 ? '#1a1a2e' : '#b91c1c');
        doc.setFont('helvetica', 'bold');
        doc.text(String(gval), colX[1] + 4, ty + 6);
        doc.setFont('helvetica', 'normal');
        const appr = gval >= maxNote * 0.75 ? 'Excellent' : gval >= maxNote * 0.6 ? 'Bien' : gval >= maxNote * 0.5 ? 'Passable' : 'Insuffisant';
        doc.setTextColor(gray);
        doc.text(appr, colX[2] + 4, ty + 6);
      } else {
        doc.setTextColor('#d4cfc4');
        doc.text('—', colX[1] + 4, ty + 6);
        doc.text('Non noté', colX[2] + 4, ty + 6);
      }

      // separator line
      doc.setDrawColor('#e8e4db');
      doc.line(14, ty + rowH, pw - 14, ty + rowH);
      ty += rowH;
    });

    // ── Average row ──
    doc.setFillColor('#f0fdf4');
    doc.rect(14, ty, pw - 28, rowH + 2, 'F');
    doc.setDrawColor(cl);
    doc.setLineWidth(0.8);
    doc.line(14, ty, pw - 14, ty);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor('#1a1a2e');
    doc.text('MOYENNE GÉNÉRALE', colX[0] + 4, ty + 7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(cl);
    const avgText = average ? average + '/' + maxNote : '—';
    doc.text(avgText, pw / 2, ty + 7, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor('#1a1a2e');
    doc.text(mention.label, colX[3] + 4, ty + 7);

    ty += rowH + 6;

    // ── Info band at bottom ──
    const remaining = ph - ty - 14;
    if (remaining > 30) {
      doc.setDrawColor('#e8e4db');
      doc.setFillColor('#f8f7f3');
      doc.roundedRect(14, ty, pw - 28, 26, 3, 3, 'FD');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(gray);
      doc.text('Date d\'édition : ' + new Date().toLocaleDateString('fr-FR'), 22, ty + 10);
      doc.text('Cachet et signature', pw - 50, ty + 10);
      doc.line(pw - 60, ty + 18, pw - 22, ty + 18);
    }

    doc.save(`Bulletin_${grade.studentName}_${grade.trimestre}.pdf`);
  };

  const colAvgs = tableSubjects.map(s => {
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
            <div className="stu-stat-value">{generalAvg ? `${generalAvg}/${tableMaxScore}` : '—'}</div>
            <div className="stu-stat-label">Moy. générale</div>
          </div>
        </div>
        <div className="stu-stat-card" style={{ borderTopColor: '#10b981' }}>
          <div className="stu-stat-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
            <i className="fa-solid fa-star"></i>
          </div>
          <div>
            <div className="stu-stat-value">{bestGrade !== null ? `${bestGrade}/${tableMaxScore}` : '—'}</div>
            <div className="stu-stat-label">Meilleure note</div>
          </div>
        </div>
        <div className="stu-stat-card" style={{ borderTopColor: '#ef4444' }}>
          <div className="stu-stat-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
            <i className="fa-solid fa-arrow-down"></i>
          </div>
          <div>
            <div className="stu-stat-value">{belowAvgCount}</div>
            <div className="stu-stat-label">En dessous de {tableMaxScore * 0.5}</div>
          </div>
        </div>
        <div className="stu-stat-card" style={{ borderTopColor: '#b8860b' }}>
          <div className="stu-stat-icon" style={{ background: '#fffbeb', color: '#b8860b' }}>
            <i className="fa-solid fa-trophy"></i>
          </div>
          <div>
            <div className="stu-stat-value">{topCount}</div>
            <div className="stu-stat-label">≥ {tableMaxScore * 0.75}/{tableMaxScore}</div>
          </div>
        </div>
      </div>

      <div className="stu-filters" style={{ background: '#f8f7f3', padding: '12px 16px', borderRadius: 12, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18, border: '1px solid #e8e4db' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#57534e', marginRight: 4 }}>Filtrer par</div>
        <div className="stu-filter-group">
          <i className="fa-solid fa-school" style={{ left: 12 }}></i>
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ paddingLeft: 32, minWidth: 170 }}>
            {classNames.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="stu-filter-group">
          <i className="fa-solid fa-calendar" style={{ left: 12 }}></i>
          <select value={filterTrimestre} onChange={e => setFilterTrimestre(e.target.value)} style={{ paddingLeft: 32, minWidth: 170 }}>
            <option value="T1">1er Trimestre</option>
            <option value="T2">2ème Trimestre</option>
            <option value="T3">3ème Trimestre</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        {filteredGrades.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af' }}>
            <i className="fa-solid fa-book" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.4 }}></i>
            <p style={{ fontSize: 14, fontWeight: 500 }}>Aucune note pour {filterClass} — {filterTrimestre === 'T1' ? '1er' : filterTrimestre === 'T2' ? '2ème' : '3ème'} Trimestre</p>
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
                  <th style={{ background: '#b8860b', color: '#fff', padding: '8px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Matricule</th>
                  <th style={{ background: '#7c3aed', color: '#fff', padding: '8px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Trimestre</th>
                  {tableSubjects.map(s => (
                    <th key={s} style={{ background: tableSubjectColors[s], color: '#fff', padding: '8px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>{s}</th>
                  ))}
                  <th style={{ background: '#b8860b', color: '#fff', padding: '8px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Moy.</th>
                  <th style={{ background: '#7c3aed', color: '#fff', padding: '8px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Mention</th>
                  <th style={{ background: '#78716c', color: '#fff', padding: '8px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrades.map((g, i) => {
                  const average = avg(g, tableSubjects);
                  const { label: mentionLabel, style: mentionStyle } = getMention(average, tableMaxScore);
                  return (
                    <tr key={g._id || g.id}>
                      <td style={{ padding: '8px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {(() => {
                            const photoUrl = g.photo || students.find(s => s.name === g.studentName)?.photo;
                            return photoUrl ? (
                              <img src={photoUrl} alt={g.studentName} style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ecfdf5', color: '#0d7a5e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                                {g.studentName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                            );
                          })()}
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{g.studentName}</div>
                        </div>
                      </td>
                      <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#78716c' }}>{g.matricule || '—'}</span>
                      </td>
                      <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed' }}>{g.trimestre === 'T1' ? '1er' : g.trimestre === 'T2' ? '2ème' : '3ème'}</span>
                      </td>
                      {tableSubjects.map(s => {
                        const gc = g[s] !== undefined && g[s] !== '' ? gradeColor(Number(g[s]), tableMaxScore) : { color: '#d4cfc4', bg: 'transparent' };
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
                          <button onClick={() => handleDelete(g._id || g.id)} className="btn btn-sm btn-danger" title="Supprimer">
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
                  <td style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, color: '#57534e', textTransform: 'uppercase' }} colSpan={3}>Moy. classe</td>
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
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Classe</label>
                  <select value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value, studentName: '' }))}>
                    <option value="">Sélectionner une classe</option>
                    {classNames.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Trimestre</label>
                  <select value={form.trimestre} onChange={e => setForm(f => ({ ...f, trimestre: e.target.value }))}>
                    <option value="">Sélectionner un trimestre</option>
                    <option value="T1">1er Trimestre</option>
                    <option value="T2">2ème Trimestre</option>
                    <option value="T3">3ème Trimestre</option>
                  </select>
                </div>
              </div>
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
                  <select required value={form.studentName} onChange={e => {
                    const name = e.target.value;
                    const student = students.find(s => s.name === name);
                    setForm(f => ({ ...f, studentName: name, matricule: student?.matricule || '' }));
                  }}>
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
                <label style={{ marginBottom: 10 }}>Notes par matière (sur {maxScore})</label>
                <div className="form-row" style={{ flexWrap: 'wrap', gap: 0 }}>
                  {filteredSubjects.length > 0 ? filteredSubjects.map((s, idx) => (
                    <div className="form-group" key={s} style={{ flex: '0 0 50%', maxWidth: '50%' }}>
                      <label style={{ fontSize: 11, color: subjectColors[s], fontWeight: 600 }}>{s}</label>
                      <input type="number" min="0" max={maxScore} step="0.5" placeholder="—" value={form[s]} onChange={e => setForm(f => ({ ...f, [s]: e.target.value }))} />
                    </div>
                  )) : <p style={{ fontSize: 12, color: '#9ca3af', padding: 12 }}>{form.class ? 'Aucune matière pour ce niveau' : 'Sélectionnez une classe pour voir les matières'}</p>}
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
                  {(() => {
                    const bulletinLevel = getLevelForClass(selectedGrade.class);
                    const bulletinSubjects = classes.find(c => c.name === selectedGrade.class)?.subjects || [...new Set(subjectData.filter(sd => !bulletinLevel || sd.level === bulletinLevel).map(sd => sd.name))];
                    return bulletinSubjects.map((s, idx) => {
                    const gvalue = selectedGrade[s] !== undefined && selectedGrade[s] !== '' ? Number(selectedGrade[s]) : null;
                    const bulletinMax = bulletinLevel === 'Primaire' ? 10 : 20;
                    return (
                      <tr key={s}>
                        <td style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: subjectColors[s] }}>{s}</td>
                        <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                          {gvalue !== null ? (
                            <span style={{ fontWeight: 700, fontSize: 13, color: gvalue >= bulletinMax * 0.75 ? '#065f46' : gvalue >= bulletinMax * 0.5 ? '#1a1a2e' : '#b91c1c' }}>{gvalue}</span>
                          ) : <span style={{ color: '#d4cfc4' }}>—</span>}
                        </td>
                        <td style={{ padding: '8px 16px', textAlign: 'center', fontSize: 12, color: '#57534e' }}>
                          {gvalue !== null ? (gvalue >= bulletinMax * 0.75 ? 'Excellent' : gvalue >= bulletinMax * 0.6 ? 'Bien' : gvalue >= bulletinMax * 0.5 ? 'Passable' : 'Insuffisant') : 'Non noté'}
                        </td>
                      </tr>
                    );
                    });
                  })()}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8f7f3' }}>
                    <td style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700 }}>Moyenne générale</td>
                    <td style={{ padding: '8px 16px', textAlign: 'center', fontWeight: 700 }}>
                      {(() => { 
                        const bl = getLevelForClass(selectedGrade.class);
                        const bs = classes.find(c => c.name === selectedGrade.class)?.subjects || [...new Set(subjectData.filter(sd => !bl || sd.level === bl).map(sd => sd.name))];
                        return avg(selectedGrade, bs) || '—';
                      })()}
                    </td>
                    <td style={{ padding: '8px 16px', textAlign: 'center', fontWeight: 600, fontSize: 12 }}>
                      {(() => { 
                        const bl = getLevelForClass(selectedGrade.class);
                        const bs = classes.find(c => c.name === selectedGrade.class)?.subjects || [...new Set(subjectData.filter(sd => !bl || sd.level === bl).map(sd => sd.name))];
                        return getMention(avg(selectedGrade, bs), bl === 'Primaire' ? 10 : 20).label;
                      })()}
                    </td>
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
