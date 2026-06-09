import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';

const subjectBadgeStyle = (subject) => {
  const colors = {
    'Mathématiques': '#059669', 'Français': '#4f46e5', 'Histoire-Géographie': '#d97706',
    'Sciences': '#db2777', 'Anglais': '#0891b2', 'Physique-Chimie': '#be185d',
    'Informatique': '#0284c7', 'SVT': '#65a30d',
  };
  const c = colors[subject] || '#059669';
  return { background: `${c}15`, color: c };
};

const Teachers = () => {
  const { teachers, subjects, deleteTeacher } = useAppData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAnciennete, setFilterAnciennete] = useState('');
  const [viewTeacher, setViewTeacher] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 8;
  const { showToast } = useToast();

  const filtered = useMemo(() => {
    return teachers.filter(t => {
      const q = search.toLowerCase();
      const subs = t.subjects || (t.subject ? [t.subject] : []);
      if (search && !t.name.toLowerCase().includes(q) && !subs.some(s => s.toLowerCase().includes(q)) && !(t.email || '').toLowerCase().includes(q)) return false;
      if (filterSubject && !subs.includes(filterSubject)) return false;
      if (filterStatus === 'actif' && t.status !== 'Actif') return false;
      if (filterStatus === 'inactif' && t.status === 'Actif') return false;
      if (filterAnciennete) {
        const yrs = t.years || 0;
        if (filterAnciennete === 'moins1' && yrs >= 1) return false;
        if (filterAnciennete === '1a3' && (yrs < 1 || yrs > 3)) return false;
        if (filterAnciennete === 'plus3' && yrs <= 3) return false;
      }
      return true;
    });
  }, [teachers, search, filterSubject, filterStatus, filterAnciennete]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => { setPage(1); }, [search, filterSubject, filterStatus, filterAnciennete]);

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet enseignant définitivement ?')) return;
    try {
      await deleteTeacher(id);
      showToast('Enseignant supprimé avec succès', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de la suppression', 'error');
    }
  };

  const total = teachers.length;
  const actifs = teachers.filter(t => t.status === 'Actif').length;
  const matieres = [...new Set(teachers.flatMap(t => t.subjects || (t.subject ? [t.subject] : [])))].filter(Boolean).length;
  const classesCount = 0;

  const getTeacherId = (t) => t.identifiant || `ENS-${t.id?.slice(0, 6)}`;

  const AVATAR_COLORS = ['bg-blue-500','bg-emerald-600','bg-violet-500','bg-pink-500','bg-amber-500','bg-cyan-500','bg-rose-500','bg-indigo-500'];

  return (
    <div className="space-y-6">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2><i className="fa-solid fa-chalkboard-user" style={{ color: '#b8860b', marginRight: 8 }}></i> Gestion des Enseignants</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/teachers/ajouter')} className="btn btn-primary">
            <i className="fa-solid fa-plus"></i> Ajouter enseignant
          </button>
        </div>
      </div>

      <div className="stu-stats">
        <div className="stu-stat-card" style={{ borderTopColor: '#059669' }}>
          <div className="stu-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <i className="fa-solid fa-chalkboard-user"></i>
          </div>
          <div>
            <div className="stu-stat-value">{total}</div>
            <div className="stu-stat-label">Total enseignants</div>
          </div>
        </div>
        <div className="stu-stat-card" style={{ borderTopColor: '#4f46e5' }}>
          <div className="stu-stat-icon" style={{ background: '#eef2ff', color: '#4f46e5' }}>
            <i className="fa-solid fa-user-check"></i>
          </div>
          <div>
            <div className="stu-stat-value">{actifs}</div>
            <div className="stu-stat-label">Enseignants actifs</div>
          </div>
        </div>
        <div className="stu-stat-card" style={{ borderTopColor: '#d97706' }}>
          <div className="stu-stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
            <i className="fa-solid fa-book-open"></i>
          </div>
          <div>
            <div className="stu-stat-value">{matieres}</div>
            <div className="stu-stat-label">Matières enseignées</div>
          </div>
        </div>
        <div className="stu-stat-card" style={{ borderTopColor: '#db2777' }}>
          <div className="stu-stat-icon" style={{ background: '#fdf2f8', color: '#db2777' }}>
            <i className="fa-solid fa-school"></i>
          </div>
          <div>
            <div className="stu-stat-value">{classesCount}</div>
            <div className="stu-stat-label">Classes attribuées</div>
          </div>
        </div>
      </div>

      <div className="stu-filters">
        <div className="stu-filter-group">
          <i className="fa-solid fa-search"></i>
          <input type="text" placeholder="Rechercher un enseignant..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="stu-filter-group">
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
            <option value="">Toutes matières</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="stu-filter-group">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Tous statuts</option>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
          </select>
        </div>
        <div className="stu-filter-group">
          <select value={filterAnciennete} onChange={e => setFilterAnciennete(e.target.value)}>
            <option value="">Toute ancienneté</option>
            <option value="moins1">Moins d'1 an</option>
            <option value="1a3">1 à 3 ans</option>
            <option value="plus3">Plus de 3 ans</option>
          </select>
        </div>
        {(search || filterSubject || filterStatus || filterAnciennete) && (
          <button className="btn btn-sm" style={{ background: '#f1f0ed', color: '#57534e' }}
            onClick={() => { setSearch(''); setFilterSubject(''); setFilterStatus(''); setFilterAnciennete(''); }}>
            <i className="fa-solid fa-rotate"></i> Réinitialiser
          </button>
        )}
      </div>

      <div className="table-container">
        {filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af' }}>
            <i className="fa-solid fa-chalkboard-user-slash" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.4 }}></i>
            <p style={{ fontSize: 14, fontWeight: 500 }}>Aucun enseignant trouvé</p>
            <button onClick={() => navigate('/teachers/ajouter')} className="btn btn-primary" style={{ marginTop: 12 }}>
              <i className="fa-solid fa-plus"></i> Ajouter un enseignant
            </button>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th className="col-photo" style={{ width: 50 }}>Photo</th>
                  <th className="col-nom">Nom complet</th>
                  <th style={{ background: '#be185d', color: '#fff', padding: '8px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Sexe</th>
                  <th className="col-id">ID Enseignant</th>
                  <th className="col-contact">Téléphone</th>
                  <th className="col-matiere">Matière</th>
                  <th className="col-classe">Classe</th>
                  <th className="col-date">Salaire mensuel</th>
                  <th className="col-statut">Statut</th>
                  <th className="col-actions" style={{ width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((t, i) => (
                  <tr key={t.id}>
                    <td>
                      {t.photo ? (
                        <img src={t.photo} alt={t.name} style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div className={`${AVATAR_COLORS[i % AVATAR_COLORS.length]} avatar-initials`} style={{ width: 36, height: 36 }}>
                          {t.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                    <td style={{ fontSize: 12.5 }}>{t.sexe || '—'}</td>
                    <td style={{ color: '#78716c', fontFamily: 'monospace', fontSize: 12 }}>{getTeacherId(t)}</td>
                    <td style={{ fontSize: 12.5 }}>{t.telephone || t.phone || '—'}</td>
                    <td>
                      {(t.subjects || (t.subject ? [t.subject] : [])).filter(Boolean).length > 0 ? (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(t.subjects || (t.subject ? [t.subject] : [])).filter(Boolean).map(s => (
                            <span key={s} style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, ...subjectBadgeStyle(s) }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: 12.5, color: '#57534e' }}>
                      {t.classes && t.classes.length > 0 ? t.classes.join(', ') : '—'}
                    </td>
                    <td style={{ fontSize: 12.5, color: '#57534e' }}>
                      {t.salaire ? `${Number(t.salaire).toLocaleString()} GNF` : '—'}
                    </td>
                    <td>
                      <span className={`badge ${t.status === 'Actif' ? 'badge-present' : 'badge-absent'}`}>
                        {t.status === 'Actif' ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setViewTeacher(t)} className="btn btn-sm" style={{ background: '#eef2ff', color: '#4f46e5', padding: '5px 9px' }} title="Voir profil">
                          <i className="fa-solid fa-user"></i>
                        </button>
                        <button onClick={() => navigate(`/teachers/modifier/${t.id}`)} className="btn btn-sm" style={{ background: '#fffbeb', color: '#d97706', padding: '5px 9px' }} title="Modifier">
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="btn btn-sm" style={{ background: '#fef2f2', color: '#dc2626', padding: '5px 9px' }} title="Supprimer">
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="stu-pagination">
              <div className="stu-pagination-info">
                {filtered.length > 0 && (
                  <>Affichage {(page - 1) * perPage + 1} à {Math.min(page * perPage, filtered.length)} sur {filtered.length} enseignant{filtered.length > 1 ? 's' : ''}</>
                )}
              </div>
              <div className="stu-pagination-controls">
                <button className="stu-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`stu-page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="stu-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* View Modal */}
      {viewTeacher && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setViewTeacher(null); }}>
          <div className="modal-content" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>Fiche enseignant</h3>
              <button onClick={() => setViewTeacher(null)} className="modal-close"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div style={{ padding: '8px 24px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                {viewTeacher.photo ? (
                  <img src={viewTeacher.photo} alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 52, height: 52, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700, background: '#4f46e5' }}>
                    {viewTeacher.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a2e' }}>{viewTeacher.name}</div>
                  <span className={`badge ${viewTeacher.status === 'Actif' ? 'badge-present' : 'badge-absent'}`} style={{ marginTop: 4 }}>{viewTeacher.status}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'ID', value: getTeacherId(viewTeacher) },
                  { label: 'Email', value: viewTeacher.email || '—' },
                  { label: 'Matière', value: (viewTeacher.subjects || []).filter(Boolean).join(', ') || (viewTeacher.subject || '—') },
                  { label: 'Classe(s)', value: viewTeacher.classes && viewTeacher.classes.length > 0 ? viewTeacher.classes.join(', ') : '—' },
                  { label: 'Téléphone', value: viewTeacher.telephone || viewTeacher.phone || '—' },
                  { label: 'Salaire', value: viewTeacher.salaire ? `${Number(viewTeacher.salaire).toLocaleString()} GNF` : '—' },
                  { label: 'Diplôme', value: viewTeacher.diplome || '—' },
                  { label: 'Contrat', value: viewTeacher.contrat || '—' },
                  { label: 'Niveau', value: viewTeacher.niveauEnseignement || '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: '10px 12px', background: '#faf9f6', borderRadius: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', marginTop: 2 }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button onClick={() => { const t = viewTeacher; setViewTeacher(null); navigate(`/teachers/modifier/${t.id}`); }} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  <i className="fa-solid fa-pen"></i> Modifier
                </button>
                <button onClick={() => setViewTeacher(null)} className="btn btn-cancel" style={{ flex: 1, justifyContent: 'center' }}>Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;
