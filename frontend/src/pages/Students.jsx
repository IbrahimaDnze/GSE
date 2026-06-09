import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { exportToCSV } from '../utils/export';
import { useToast } from '../context/ToastContext';

const EMPTY_FORM = { name: '', class: '', phone: '', dob: '', photo: '', gender: '', parent: '', parentPhone: '', matricule: '', status: 'Actif' };

const formatDate = (val) => {
  if (!val) return '—';
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
    const d = new Date(val);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }
  return val;
};

const Students = () => {
  const { students, classes, addStudent, updateStudent, deleteStudent } = useAppData();
  const location = useLocation();
  const [search, setSearch]           = useState('');
  const [filterClass, setFilterClass]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSexe, setFilterSexe]     = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [viewStudent, setViewStudent]   = useState(null);
  const [editStudent, setEditStudent]   = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [page, setPage]                 = useState(1);
  const [saving, setSaving]             = useState(false);
  const perPage = 10;
  const { showToast } = useToast();

  useEffect(() => {
    if (location.state?.openModal) setShowModal(true);
  }, [location.state]);

  const filtered = students.filter(
    (s) =>
      ((s.name || '').toLowerCase().includes(search.toLowerCase()) ||
       (s.matricule || '').toLowerCase().includes(search.toLowerCase())) &&
      (filterClass ? s.class === filterClass : true) &&
      (filterStatus ? s.status === filterStatus : true) &&
      (filterSexe ? s.gender === filterSexe : true)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => { setPage(1); }, [search, filterClass, filterStatus, filterSexe]);

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
      reader.onloadend = () => { setForm(f => ({ ...f, photo: reader.result })); };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editStudent) {
        await updateStudent(editStudent.id, form);
        showToast('Élève modifié avec succès', 'success');
      } else {
        await addStudent(form);
        showToast('Élève ajouté avec succès', 'success');
      }
      setShowModal(false);
      setForm(EMPTY_FORM);
      setEditStudent(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet élève définitivement ?')) return;
    try {
      await deleteStudent(id);
      showToast('Élève supprimé avec succès', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de la suppression', 'error');
    }
  };

  const handleExport = () => {
    if (students.length === 0) return alert('Aucun élève à exporter.');
    exportToCSV(
      students.map(s => ({
        Nom: s.name,
        Matricule: s.matricule || '',
        Classe: s.class || '',
        Genre: s.gender || '',
        Parent: s.parent || '',
        Téléphone: s.parentPhone || '',
        'Date naiss.': s.dob || '',
        Statut: s.status,
      })),
      'eleves'
    );
  };

  const total       = students.length;
  const active      = students.filter(s => s.status === 'Actif').length;
  const boys        = students.filter(s => s.gender === 'Masculin').length;
  const girls       = students.filter(s => s.gender === 'Féminin').length;

  const AVATAR_COLORS = ['bg-blue-500','bg-emerald-600','bg-violet-500','bg-pink-500','bg-amber-500','bg-cyan-500','bg-rose-500','bg-indigo-500'];

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="page-header">
        <h2><i className="fa-solid fa-graduation-cap" style={{ color: '#b8860b', marginRight: 8 }}></i> Gestion des Élèves</h2>
        <button onClick={handleExport} className="btn btn-primary">
          <i className="fa-solid fa-download"></i> Exporter
        </button>
      </div>

      {/* ── Stat Cards ───────────────────────────────────── */}
      <div className="stu-stats">
        <div className="stu-stat-card" style={{ borderTopColor: '#0d7a5e' }}>
          <div className="stu-stat-icon" style={{ background: '#ecfdf5', color: '#0d7a5e' }}>
            <i className="fa-solid fa-users"></i>
          </div>
          <div>
            <div className="stu-stat-value">{total}</div>
            <div className="stu-stat-label">Total élèves</div>
          </div>
        </div>
        <div className="stu-stat-card" style={{ borderTopColor: '#3b82f6' }}>
          <div className="stu-stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
            <i className="fa-solid fa-person"></i>
          </div>
          <div>
            <div className="stu-stat-value">{boys}</div>
            <div className="stu-stat-label">Garçons</div>
          </div>
        </div>
        <div className="stu-stat-card" style={{ borderTopColor: '#ec4899' }}>
          <div className="stu-stat-icon" style={{ background: '#fdf2f8', color: '#ec4899' }}>
            <i className="fa-solid fa-person-dress"></i>
          </div>
          <div>
            <div className="stu-stat-value">{girls}</div>
            <div className="stu-stat-label">Filles</div>
          </div>
        </div>
        <div className="stu-stat-card" style={{ borderTopColor: '#b8860b' }}>
          <div className="stu-stat-icon" style={{ background: '#fffbeb', color: '#b8860b' }}>
            <i className="fa-solid fa-clock"></i>
          </div>
          <div>
            <div className="stu-stat-value">{active}</div>
            <div className="stu-stat-label">Élèves actifs</div>
          </div>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────── */}
      <div className="stu-filters">
        <div className="stu-filter-group">
          <i className="fa-solid fa-search"></i>
          <input type="text" placeholder="Rechercher un élève..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="stu-filter-group">
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)}>
            <option value="">Toutes les classes</option>
            {classes.map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div className="stu-filter-group">
          <select value={filterSexe} onChange={e => setFilterSexe(e.target.value)}>
            <option value="">Tous les sexes</option>
            <option value="Masculin">Masculin</option>
            <option value="Féminin">Féminin</option>
          </select>
        </div>
        <div className="stu-filter-group">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
          </select>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────── */}
      <div className="table-container">
        {filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af' }}>
            <i className="fa-solid fa-user-graduate" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.4 }}></i>
            <p style={{ fontSize: 14, fontWeight: 500 }}>Aucun élève trouvé</p>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th className="col-nom">Élève</th>
                  <th style={{ background: '#be185d', color: '#fff', padding: '8px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Sexe</th>
                  <th className="col-id">Matricule</th>
                  <th className="col-classe">Classe</th>
                  <th className="col-date">Date naiss.</th>
                  <th className="col-contact">Parent</th>
                  <th className="col-statut">Statut</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ padding: '8px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {s.photo ? (
                          <img src={s.photo} alt={s.name} style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div className={`${AVATAR_COLORS[i % AVATAR_COLORS.length]} avatar-initials`} style={{ width: 36, height: 36 }}>
                            {s.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{s.name}</div>
                          {s.email && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{s.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '8px 16px', fontSize: 13 }}>{s.gender || '—'}</td>
                    <td style={{ padding: '8px 16px' }}>
                      <span className="badge" style={{ background: '#f1f5f9', color: '#475569', fontFamily: 'monospace' }}>
                        {s.matricule || `ETU-${s.id?.slice(0, 6) || 'N/A'}`}
                      </span>
                    </td>
                    <td style={{ padding: '8px 16px', fontSize: 13, color: '#1a1a2e', fontWeight: 500 }}>{s.class || '—'}</td>
                    <td style={{ padding: '8px 16px', fontSize: 13, color: '#78716c' }}>{formatDate(s.dob)}</td>
                    <td style={{ padding: '8px 16px' }}>
                      <div style={{ fontSize: 13, color: '#1a1a2e' }}>{s.parent || '—'}</div>
                      {s.parentPhone && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{s.parentPhone}</div>}
                    </td>
                    <td style={{ padding: '8px 16px' }}>
                      <span className={`badge ${s.status === 'Actif' ? 'badge-present' : 'badge-absent'}`}>
                        {s.status === 'Actif' ? <><i className="fa-solid fa-check"></i> Actif</> : <><i className="fa-solid fa-xmark"></i> Inactif</>}
                      </span>
                    </td>
                    <td style={{ padding: '8px 16px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setViewStudent(s)} className="btn btn-sm" style={{ background: '#eef2ff', color: '#4f46e5', padding: '5px 9px' }} title="Voir">
                          <i className="fa-solid fa-eye"></i>
                        </button>
                        <button onClick={() => openEdit(s)} className="btn btn-sm" style={{ background: '#fffbeb', color: '#d97706', padding: '5px 9px' }} title="Modifier">
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="btn btn-sm" style={{ background: '#fef2f2', color: '#dc2626', padding: '5px 9px' }} title="Supprimer">
                          <i className="fa-solid fa-trash-can"></i>
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
                  <>{(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} sur {filtered.length} élève{filtered.length > 1 ? 's' : ''}</>
                )}
              </div>
              <div className="stu-pagination-controls">
                <button className="stu-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`stu-page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>
                    {p}
                  </button>
                ))}
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
              <h3>{editStudent ? 'Modifier l\'élève' : 'Nouvel élève'}</h3>
              <button onClick={() => setShowModal(false)} className="modal-close"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group required">
                <label>Nom complet</label>
                <input type="text" placeholder="ex: Jean Dupont" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Matricule</label>
                  <input type="text" placeholder="ex: MAT2024001" value={form.matricule} onChange={e => setForm(f => ({ ...f, matricule: e.target.value }))} />
                </div>
                <div className="form-group required">
                  <label>Classe</label>
                  <select value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value }))} required>
                    <option value="">Sélectionner</option>
                    {classes.map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Genre</label>
                  <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                    <option value="">Sélectionner</option>
                    <option value="Masculin">Masculin</option>
                    <option value="Féminin">Féminin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Statut</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="Actif">Actif</option>
                    <option value="Inactif">Inactif</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Parent/Tuteur</label>
                  <input type="text" placeholder="ex: Marie Dupont" value={form.parent} onChange={e => setForm(f => ({ ...f, parent: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Téléphone parent</label>
                  <input type="tel" placeholder="06 00 00 00 00" value={form.parentPhone} onChange={e => setForm(f => ({ ...f, parentPhone: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label>Date de naissance</label>
                <input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Photo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {form.photo ? (
                    <div style={{ position: 'relative' }}>
                      <img src={form.photo} alt="" style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover' }} />
                      <button type="button" onClick={() => setForm(f => ({ ...f, photo: '' }))}
                        style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, background: '#b91c1c', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  ) : null}
                  <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ fontSize: 13 }} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-cancel">Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : (editStudent ? 'Enregistrer' : 'Ajouter')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Modal ────────────────────────────────────── */}
      {viewStudent && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setViewStudent(null); }}>
          <div className="modal-content" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>Fiche élève</h3>
              <button onClick={() => setViewStudent(null)} className="modal-close"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div style={{ padding: '8px 24px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                {viewStudent.photo ? (
                  <img src={viewStudent.photo} alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover' }} />
                ) : (
                  <div className={viewStudent.color || 'bg-primary-600'} style={{ width: 52, height: 52, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700 }}>
                    {viewStudent.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a2e' }}>{viewStudent.name}</div>
                  <span className={`badge ${viewStudent.status === 'Actif' ? 'badge-present' : 'badge-absent'}`} style={{ marginTop: 4 }}>
                    {viewStudent.status}
                  </span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Matricule', value: viewStudent.matricule || 'N/A' },
                  { label: 'Classe', value: viewStudent.class || '—' },
                  { label: 'Genre', value: viewStudent.gender || '—' },
                  { label: 'Date naiss.', value: formatDate(viewStudent.dob) },
                  { label: 'Parent', value: viewStudent.parent || '—' },
                  { label: 'Téléphone', value: viewStudent.parentPhone || '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: '10px 12px', background: '#faf9f6', borderRadius: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', marginTop: 2 }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button onClick={() => { const s = viewStudent; setViewStudent(null); openEdit(s); }} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  <i className="fa-solid fa-pen"></i> Modifier
                </button>
                <button onClick={() => setViewStudent(null)} className="btn btn-cancel" style={{ flex: 1, justifyContent: 'center' }}>
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
