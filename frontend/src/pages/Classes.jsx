import { useState, useMemo, useEffect } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';

const LEVELS = ['Primaire', 'Collège', 'Lycée'];

const EMPTY_FORM = { name: '', level: 'Primaire', teacher: '', max: 30, subjects: [] };

const Classes = () => {
  const { classes, students, teachers, subjects, subjectData, addSubject, addClass, updateClass, deleteClass } = useAppData();
  const [search, setSearch]           = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [editClass, setEditClass]       = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [newSubject, setNewSubject]     = useState('');
  const [newSubjectLevel, setNewSubjectLevel] = useState('');
  const [page, setPage]                 = useState(1);
  const perPage = 8;
  const { showToast } = useToast();

  const enriched = useMemo(() => {
    return classes.map(c => {
      const assignedTeachers = teachers.filter(t =>
        t.classes && t.classes.some(cls => cls === c.name)
      );
      const teacherNames = assignedTeachers.map(t => t.name);
      const teacherSubjects = [...new Set(assignedTeachers.flatMap(t =>
        t.subjects || (t.subject ? [t.subject] : [])
      ).filter(Boolean))];
      return {
        ...c,
        elevesCount: students.filter(s => s.class === c.name).length,
        teacher: teacherNames.join(', ') || c.teacher,
        subjects: teacherSubjects.length > 0
          ? teacherSubjects
          : (Array.isArray(c.subjects) ? c.subjects : []),
      };
    });
  }, [classes, students, teachers]);

  const filtered = useMemo(() => {
    return enriched.filter(c => {
      const q = search.toLowerCase();
      if (search && !c.name.toLowerCase().includes(q) && !(c.teacher || '').toLowerCase().includes(q)) return false;
      if (filterLevel && c.level !== filterLevel) return false;
      if (filterStatus === 'actif' && c.status !== 'Actif') return false;
      if (filterStatus === 'inactif' && c.status === 'Actif') return false;
      return true;
    });
  }, [enriched, search, filterLevel, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => { setPage(1); }, [search, filterLevel, filterStatus]);

  const totalClasses = classes.length;
  const totalActives = classes.filter(c => c.status !== 'Inactif').length;
  const totalEleves  = students.length;
  const niveauxUniques = new Set(classes.map(c => c.level)).size;

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditClass(null);
    setShowModal(true);
  };

  const openEdit = (c) => {
    setForm({ name: c.name, level: c.level || 'Primaire', teacher: c.teacher || '', max: c.max, subjects: Array.isArray(c.subjects) ? [...c.subjects] : [] });
    setEditClass(c);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form, max: Number(form.max), status: editClass ? undefined : 'Actif' };
      if (editClass) {
        await updateClass(editClass.id, data);
        showToast('Classe modifiée avec succès', 'success');
      } else {
        await addClass(data);
        showToast('Classe ajoutée avec succès', 'success');
      }
      setShowModal(false);
      setForm(EMPTY_FORM);
      setEditClass(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de l\'enregistrement', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette classe définitivement ?')) return;
    try {
      await deleteClass(id);
      showToast('Classe supprimée avec succès', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de la suppression', 'error');
    }
  };

  const toggleStatus = async (c) => {
    try {
      const newStatus = c.status === 'Actif' ? 'Inactif' : 'Actif';
      await updateClass(c.id, { status: newStatus });
      showToast(`Statut changé en "${newStatus}"`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors du changement de statut', 'error');
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    try {
      await addSubject({ name: newSubject.trim(), level: newSubjectLevel });
      showToast('Matière ajoutée avec succès', 'success');
      setNewSubject('');
      setNewSubjectLevel('');
      setShowSubjectModal(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de l\'ajout de la matière', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2><i className="fa-solid fa-school" style={{ color: '#b8860b', marginRight: 8 }}></i> Gestion des Classes</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={openAdd} className="btn btn-primary">
            <i className="fa-solid fa-plus"></i> Ajouter une classe
          </button>
          <button onClick={() => setShowSubjectModal(true)} className="btn btn-primary" style={{ background: '#d97706' }}>
            <i className="fa-solid fa-book"></i> Ajouter une matière
          </button>
        </div>
      </div>

      {/* ── Stat Cards ───────────────────────────────────── */}
      <div className="stu-stats">
        <div className="stu-stat-card" style={{ borderTopColor: '#059669' }}>
          <div className="stu-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <i className="fa-solid fa-school"></i>
          </div>
          <div>
            <div className="stu-stat-value">{totalClasses}</div>
            <div className="stu-stat-label">Total classes</div>
          </div>
        </div>
        <div className="stu-stat-card" style={{ borderTopColor: '#4f46e5' }}>
          <div className="stu-stat-icon" style={{ background: '#eef2ff', color: '#4f46e5' }}>
            <i className="fa-solid fa-toggle-on"></i>
          </div>
          <div>
            <div className="stu-stat-value">{totalActives}</div>
            <div className="stu-stat-label">Classes actives</div>
          </div>
        </div>
        <div className="stu-stat-card" style={{ borderTopColor: '#d97706' }}>
          <div className="stu-stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
            <i className="fa-solid fa-users"></i>
          </div>
          <div>
            <div className="stu-stat-value">{totalEleves}</div>
            <div className="stu-stat-label">Élèves inscrits</div>
          </div>
        </div>
        <div className="stu-stat-card" style={{ borderTopColor: '#db2777' }}>
          <div className="stu-stat-icon" style={{ background: '#fdf2f8', color: '#db2777' }}>
            <i className="fa-solid fa-layer-group"></i>
          </div>
          <div>
            <div className="stu-stat-value">{niveauxUniques}</div>
            <div className="stu-stat-label">Niveaux distincts</div>
          </div>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────── */}
      <div className="stu-filters">
        <div className="stu-filter-group">
          <i className="fa-solid fa-search"></i>
          <input type="text" placeholder="Rechercher une classe ou un enseignant..." value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: 220 }} />
        </div>
        <div className="stu-filter-group">
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
            <option value="">Tous niveaux</option>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="stu-filter-group">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Tous statuts</option>
            <option value="actif">Active</option>
            <option value="inactif">Inactive</option>
          </select>
        </div>
        {(search || filterLevel || filterStatus) && (
          <button className="btn btn-sm" style={{ background: '#f1f0ed', color: '#57534e' }}
            onClick={() => { setSearch(''); setFilterLevel(''); setFilterStatus(''); }}>
            <i className="fa-solid fa-rotate"></i> Réinitialiser
          </button>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────── */}
      <div className="table-container">
        {filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af' }}>
            <i className="fa-solid fa-chalkboard-slash" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.4 }}></i>
            <p style={{ fontSize: 14, fontWeight: 500 }}>Aucune classe trouvée</p>
            <button onClick={openAdd} className="btn btn-primary" style={{ marginTop: 12 }}>
              <i className="fa-solid fa-plus"></i> Créer une classe
            </button>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th className="col-nom" style={{ width: 200 }}>Nom de la classe</th>
                  <th className="col-niveau">Niveau</th>
                  <th className="col-contact">Enseignant</th>
                  <th className="col-classe">Élèves</th>
                  <th className="col-date">Capacité max</th>
                  <th className="col-id">Matières</th>
                  <th className="col-statut">Statut</th>
                  <th className="col-actions" style={{ width: 110 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>
                      <span className="badge" style={{ background: c.level === 'Primaire' ? '#059669' : c.level === 'Collège' ? '#4f46e5' : c.level === 'Lycée' ? '#d97706' : '#ca8a04', color: '#fff' }}>
                        {c.level}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {c.teacher ? (
                        <span style={{ fontWeight: 500 }}>{c.teacher}</span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>Non assigné</span>
                      )}
                    </td>
                    <td style={{ fontSize: 14, fontWeight: 600, color: '#0a2e2a' }}>
                      <i className="fa-solid fa-user-graduate" style={{ color: '#059669', marginRight: 4, fontSize: 12 }}></i>
                      {c.elevesCount || 0}
                    </td>
                    <td style={{ fontSize: 13, color: '#57534e' }}>{c.max || '-'}</td>
                    <td>
                      {Array.isArray(c.subjects) && c.subjects.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          {c.subjects.map(s => (
                            <span key={s} style={{ display: 'inline-block', padding: '2px 8px', background: '#f5f3ee', borderRadius: 12, fontSize: 11, color: '#57534e', fontWeight: 500 }}>{s}</span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: 12 }}>Non définies</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => toggleStatus(c)}
                        className={`badge ${c.status === 'Actif' || !c.status ? 'badge-present' : 'badge-absent'}`}
                        style={{ cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}
                        title="Cliquer pour changer le statut"
                      >
                        {c.status === 'Actif' || !c.status ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => openEdit(c)} className="btn btn-sm" style={{ background: '#fffbeb', color: '#d97706', padding: '5px 9px' }} title="Modifier">
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="btn btn-sm" style={{ background: '#fef2f2', color: '#dc2626', padding: '5px 9px' }} title="Supprimer">
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="stu-pagination">
              <div className="stu-pagination-info">
                {filtered.length > 0 && (
                  <>Affichage {(page - 1) * perPage + 1} à {Math.min(page * perPage, filtered.length)} sur {filtered.length} classe{filtered.length > 1 ? 's' : ''}</>
                )}
              </div>
              <div className="stu-pagination-controls">
                <button className="stu-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let start = Math.max(1, page - 2);
                  if (start + 4 > totalPages) start = Math.max(1, totalPages - 4);
                  const pn = start + i;
                  if (pn > totalPages) return null;
                  return <button key={pn} className={`stu-page-btn ${pn === page ? 'active' : ''}`} onClick={() => setPage(pn)}>{pn}</button>;
                })}
                <button className="stu-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-content" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3><i className="fa-solid fa-school" style={{ color: '#059669', marginRight: 8 }}></i>{editClass ? 'Modifier la classe' : 'Nouvelle classe'}</h3>
              <button onClick={() => setShowModal(false)} className="modal-close"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group required">
                <label>Nom de la classe</label>
                <input type="text" placeholder="ex: 6ème A" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                <label>Niveau d'enseignement</label>
                  <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value, subjects: [] }))}>
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Capacité max.</label>
                  <input type="number" min="1" value={form.max} onChange={e => setForm(f => ({ ...f, max: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label>Matières enseignées ({form.subjects.length} sélectionnée{form.subjects.length > 1 ? 's' : ''})</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4, maxHeight: 140, overflowY: 'auto', padding: '4px 0' }}>
                  {subjectData.filter(s => s.level === form.level).map(s => {
                    const checked = form.subjects.includes(s.name);
                    return (
                      <label key={s.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: checked ? '#ecfdf5' : '#f5f3ee', borderRadius: 20, fontSize: 12.5, cursor: 'pointer', border: checked ? '1px solid #0d7a5e' : '1px solid transparent', color: checked ? '#0d7a5e' : '#57534e', fontWeight: checked ? 600 : 400, transition: 'all .15s' }}>
                        <input type="checkbox" checked={checked} onChange={() => {
                          setForm(f => ({
                            ...f,
                            subjects: checked ? f.subjects.filter(x => x !== s.name) : [...f.subjects, s.name]
                          }));
                        }} style={{ accentColor: '#0d7a5e' }} />
                        {s.name}
                      </label>
                    );
                  })}
                  {subjectData.filter(s => s.level === form.level).length === 0 && (
                    <span style={{ fontSize: 12.5, color: '#9ca3af' }}>Aucune matière pour ce niveau. Créez-en une d'abord.</span>
                  )}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-cancel">Annuler</button>
                <button type="submit" className="btn btn-primary">{editClass ? 'Enregistrer' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Subject Modal ────────────────────────────── */}
      {showSubjectModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowSubjectModal(false); }}>
          <div className="modal-content" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3><i className="fa-solid fa-book" style={{ color: '#d97706', marginRight: 8 }}></i> Ajouter une matière</h3>
              <button onClick={() => setShowSubjectModal(false)} className="modal-close"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleAddSubject}>
              <div className="form-group required">
                <label>Niveau</label>
                <select value={newSubjectLevel} onChange={e => setNewSubjectLevel(e.target.value)} required>
                  <option value="">Sélectionner un niveau</option>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="form-group required" style={{ marginTop: 16 }}>
                <label>Nom de la matière</label>
                <input type="text" placeholder="ex: Mathématiques" value={newSubject} onChange={e => setNewSubject(e.target.value)} required autoFocus />
              </div>
              {newSubjectLevel && (
                <div className="form-group" style={{ marginTop: 16 }}>
                  <label>Matières liées au niveau <strong>{newSubjectLevel}</strong></label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {subjectData.filter(s => s.level === newSubjectLevel).map(s => (
                      <span key={s.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: '#f5f3ee', borderRadius: 20, fontSize: 12.5, color: '#57534e' }}>
                        {s.name}
                      </span>
                    ))}
                    {subjectData.filter(s => s.level === newSubjectLevel).length === 0 && (
                      <span style={{ fontSize: 12.5, color: '#9ca3af' }}>Aucune matière pour ce niveau</span>
                    )}
                  </div>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" onClick={() => setShowSubjectModal(false)} className="btn btn-cancel">Annuler</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#d97706' }}>Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;
