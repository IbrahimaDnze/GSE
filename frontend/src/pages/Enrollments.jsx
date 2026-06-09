import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { exportToCSV } from '../utils/export';
import { useToast } from '../context/ToastContext';

const Enrollments = () => {
  const { enrollments, updateEnrollment, deleteEnrollment, students } = useAppData();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('Tous');
  const [filterSexe, setFilterSexe] = useState('');
  const [viewItem, setViewItem] = useState(null);
  const { showToast } = useToast();

  const enriched = useMemo(() => enrollments.map(row => {
    const student = students.find(s => s.name === row.student || s._id === row.studentId);
    return { ...row, gender: row.gender || student?.gender || '' };
  }), [enrollments, students]);

  const filtered = enriched.filter(i => {
    if (filter !== 'Tous' && i.status !== filter) return false;
    if (filterSexe && i.gender !== filterSexe) return false;
    return true;
  });
  const counts = ['En attente', 'Accepté', 'Refusé'].reduce((acc, t) => ({ ...acc, [t]: enrollments.filter((i) => i.status === t).length }), {});

  const accept = async (id) => {
    try {
      await updateEnrollment(id, { status: 'Accepté' });
      showToast('Inscription acceptée avec succès', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de l\'acceptation', 'error');
    }
  };
  const refuse = async (id) => {
    try {
      await updateEnrollment(id, { status: 'Refusé' });
      showToast('Inscription refusée', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors du refus', 'error');
    }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette inscription ?')) return;
    try {
      await deleteEnrollment(id);
      showToast('Inscription supprimée avec succès', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de la suppression', 'error');
    }
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
      <div className="page-header">
        <h2><i className="fa-solid fa-file-pen" style={{ color: '#b8860b', marginRight: 8 }}></i> Gestion des Inscriptions</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExport} className="btn btn-primary">
            <i className="fa-solid fa-download"></i> Exporter CSV
          </button>
          <button onClick={() => navigate('/enrollments/ajouter')} className="btn btn-primary">
            <i className="fa-solid fa-plus"></i> Nouvelle inscription
          </button>
          <button onClick={() => navigate('/enrollments/reinscrire')} className="btn btn-primary" style={{ background: '#b8860b' }}>
            <i className="fa-solid fa-rotate"></i> Réinscrire
          </button>
        </div>
      </div>

      <div className="stu-stats">
        <div className="stu-stat-card" style={{ borderTopColor: '#0d7a5e' }}>
          <div className="stu-stat-icon" style={{ background: '#ecfdf5', color: '#0d7a5e' }}>
            <i className="fa-solid fa-file-pen"></i>
          </div>
          <div>
            <div className="stu-stat-value">{enrollments.length}</div>
            <div className="stu-stat-label">Total inscriptions</div>
          </div>
        </div>
        <div className="stu-stat-card" style={{ borderTopColor: '#f59e0b' }}>
          <div className="stu-stat-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>
            <i className="fa-solid fa-clock"></i>
          </div>
          <div>
            <div className="stu-stat-value">{counts['En attente'] || 0}</div>
            <div className="stu-stat-label">En attente</div>
          </div>
        </div>
        <div className="stu-stat-card" style={{ borderTopColor: '#10b981' }}>
          <div className="stu-stat-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
            <i className="fa-solid fa-check"></i>
          </div>
          <div>
            <div className="stu-stat-value">{counts['Accepté'] || 0}</div>
            <div className="stu-stat-label">Acceptées</div>
          </div>
        </div>
        <div className="stu-stat-card" style={{ borderTopColor: '#ef4444' }}>
          <div className="stu-stat-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
            <i className="fa-solid fa-xmark"></i>
          </div>
          <div>
            <div className="stu-stat-value">{counts['Refusé'] || 0}</div>
            <div className="stu-stat-label">Refusées</div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="stu-filters">
        <div className="stu-filter-group">
          <i className="fa-solid fa-filter"></i>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="Tous">Tous les statuts</option>
            <option value="En attente">En attente ({counts['En attente'] || 0})</option>
            <option value="Accepté">Accepté ({counts['Accepté'] || 0})</option>
            <option value="Refusé">Refusé ({counts['Refusé'] || 0})</option>
          </select>
        </div>
        <div className="stu-filter-group">
          <select value={filterSexe} onChange={e => setFilterSexe(e.target.value)}>
            <option value="">Tous les sexes</option>
            <option value="Masculin">Masculin</option>
            <option value="Féminin">Féminin</option>
          </select>
        </div>
      </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af' }}>
            <i className="fa-solid fa-file-pen" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.4 }}></i>
            <p style={{ fontSize: 14, fontWeight: 500 }}>Aucune inscription trouvée</p>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th className="col-id">Matricule</th>
                  <th style={{ background: '#0d7a5e', color: '#fff', padding: '8px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Élève</th>
                  <th style={{ background: '#be185d', color: '#fff', padding: '8px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Sexe</th>
                  <th className="col-contact">Parent</th>
                  <th className="col-classe">Classe</th>
                  <th className="col-date">Date</th>
                  <th className="col-statut">Statut</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const correspondingStudent = students.find(s => s.name === row.student || s._id === row.studentId);
                  const matricule = correspondingStudent?.matricule || row.matricule || 'N/A';
                  return (
                    <tr key={row.id}>
                      <td style={{ padding: '8px 16px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#78716c', background: '#f1f0ed', padding: '3px 8px', borderRadius: 6 }}>{matricule}</span>
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {row.photo ? (
                            <img src={row.photo} alt={row.student} style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ecfdf5', color: '#0d7a5e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                              {row.student?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                          )}
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{row.student}</div>
                        </div>
                      </td>
                      <td style={{ padding: '8px 16px', fontSize: 13 }}>{row.gender || '—'}</td>
                      <td style={{ padding: '8px 16px', fontSize: 13, color: '#78716c' }}>{row.parent || '—'}</td>
                      <td style={{ padding: '8px 16px' }}>
                        <span style={{ fontSize: 12, fontWeight: 500, background: '#ecfdf5', color: '#0d7a5e', padding: '3px 10px', borderRadius: 6 }}>{row.classReq}</span>
                      </td>
                      <td style={{ padding: '8px 16px', fontSize: 13, color: '#78716c' }}>{row.date || '—'}</td>
                      <td style={{ padding: '8px 16px' }}>
                        <span className={`badge ${row.status === 'Accepté' ? 'badge-present' : row.status === 'En attente' ? 'badge-warning' : 'badge-absent'}`}>
                          {row.status === 'Accepté' ? <><i className="fa-solid fa-check"></i> Accepté</> :
                           row.status === 'En attente' ? <><i className="fa-solid fa-clock"></i> En attente</> :
                           <><i className="fa-solid fa-xmark"></i> Refusé</>}
                        </span>
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => setViewItem(row)} className="btn btn-sm" style={{ background: '#eef2ff', color: '#4f46e5', padding: '5px 9px' }} title="Voir">
                              <i className="fa-solid fa-eye"></i>
                            </button>
                          {row.status === 'En attente' ? (
                            <>
                              <button onClick={() => accept(row.id)} className="btn btn-sm" style={{ background: '#ecfdf5', color: '#065f46' }}>
                                <i className="fa-solid fa-check"></i>
                              </button>
                              <button onClick={() => refuse(row.id)} className="btn btn-sm" style={{ background: '#fef2f2', color: '#b91c1c' }}>
                                <i className="fa-solid fa-xmark"></i>
                              </button>
                            </>
                          ) : (
                            <button onClick={async () => { try { await updateEnrollment(row.id, { status: 'En attente' }); showToast('Inscription remise en attente', 'success'); } catch (err) { showToast('Erreur lors de la mise en attente', 'error'); } }} className="btn btn-sm" style={{ background: '#fffbeb', color: '#92400e' }}>
                              <i className="fa-solid fa-rotate"></i>
                            </button>
                          )}
                            <button onClick={() => handleDelete(row.id)} className="btn btn-sm" style={{ background: '#fef2f2', color: '#dc2626', padding: '5px 9px' }} title="Supprimer">
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="stu-pagination">
              <div className="stu-pagination-info">
                {filtered.length > 0 && (
                  <>1–{filtered.length} sur {filtered.length} inscription{filtered.length > 1 ? 's' : ''}</>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* View Modal */}
      {viewItem && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setViewItem(null); }}>
          <div className="modal-content" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>Détail inscription</h3>
              <button onClick={() => setViewItem(null)} className="modal-close"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div style={{ padding: '8px 24px 24px' }}>
              {[
                { label: 'Élève', value: viewItem.student },
                { label: 'Parent / Tuteur', value: viewItem.parent },
                { label: 'Classe souhaitée', value: viewItem.classReq },
                { label: 'Date de demande', value: viewItem.date },
                { label: 'Documents', value: viewItem.docs ? 'Complets' : 'Incomplets' },
                { label: 'Statut', value: viewItem.status },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#faf9f6', borderRadius: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{value}</div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                {viewItem.status === 'En attente' && (
                  <>
                    <button onClick={() => { accept(viewItem.id); setViewItem(null); }} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                      <i className="fa-solid fa-check"></i> Accepter
                    </button>
                    <button onClick={() => { refuse(viewItem.id); setViewItem(null); }} className="btn btn-cancel" style={{ flex: 1, justifyContent: 'center', color: '#b91c1c', borderColor: '#fecaca' }}>
                      <i className="fa-solid fa-xmark"></i> Refuser
                    </button>
                  </>
                )}
                <button onClick={() => setViewItem(null)} className="btn btn-cancel" style={{ flex: 1, justifyContent: 'center' }}>
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

export default Enrollments;
