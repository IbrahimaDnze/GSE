import { useState, useMemo, useEffect } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';

const TYPES = ['Scolarité', 'Cantine', 'Activité', 'Transport', 'Autre'];
const METHODS = ['Virement', 'Chèque', 'CB', 'Espèces'];
const STATUS_LIST = ['Payé', 'En attente', 'En retard'];

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const EMPTY_FORM = { student: '', matricule: '', type: 'Scolarité', amount: '', method: 'Virement', status: 'En attente' };

const typeBadgeStyle = (t) => {
  const colors = {
    'Scolarité': { bg: '#eef2ff', color: '#4f46e5' },
    'Cantine':   { bg: '#ecfdf5', color: '#059669' },
    'Activité':  { bg: '#fffbeb', color: '#d97706' },
    'Transport': { bg: '#f5f5f4', color: '#78716c' },
    'Autre':     { bg: '#fef2f2', color: '#dc2626' },
  };
  return colors[t] || colors['Autre'];
};

const Payments = () => {
  const { payments, addPayment, updatePayment, deletePayment, syncPaymentWithStudent, students, classes } = useAppData();
  const [search, setSearch]           = useState('');
  const [filterType, setFilterType]     = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClass, setFilterClass]   = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [viewItem, setViewItem]         = useState(null);
  const [editItem, setEditItem]         = useState(null);
  const [modalMatricule, setModalMatricule] = useState('');
  const [eleveTrouve, setEleveTrouve]   = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [page, setPage]                 = useState(1);
  const perPage = 8;
  const { showToast } = useToast();

  const filtered = useMemo(() => {
    return payments.filter(p => {
      const q = search.toLowerCase();
      if (search && !p.student.toLowerCase().includes(q) && !(p.matricule || '').toLowerCase().includes(q)) return false;
      if (filterType && p.type !== filterType) return false;
      if (filterMethod && p.method !== filterMethod) return false;
      if (filterStatus === 'paye' && p.status !== 'Payé') return false;
      if (filterStatus === 'attente' && p.status !== 'En attente') return false;
      if (filterStatus === 'retard' && p.status !== 'En retard') return false;
      if (filterClass) {
        const student = students.find(s => s.name === p.student);
        if (!student || student.class !== filterClass) return false;
      }
      return true;
    });
  }, [payments, search, filterType, filterMethod, filterStatus, filterClass, students]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => { setPage(1); }, [search, filterType, filterMethod, filterStatus, filterClass]);

  const totalCollected = payments.filter(p => p.status === 'Payé').reduce((s, p) => s + p.amount, 0);
  const pendingTotal = payments.filter(p => p.status === 'En attente').reduce((s, p) => s + p.amount, 0);
  const mensualites = payments.filter(p => p.type === 'Scolarité').length;
  const inscriptions = payments.filter(p => p.type === 'Activité').length;
  const enRetard = useMemo(() => {
    const paidStudents = new Set(
      payments.filter(p => p.type === 'Scolarité' && p.status === 'Payé').map(p => p.student)
    );
    return students.filter(s => !paidStudents.has(s.name)).length;
  }, [payments, students]);

  const chercherEleve = (q) => {
    setModalMatricule(q);
    if (!q.trim()) { setEleveTrouve(null); setForm(f => ({ ...f, matricule: '', student: '' })); return; }
    const found = students.find(s =>
      s.matricule?.toLowerCase() === q.trim().toLowerCase() ||
      s.name?.toLowerCase().includes(q.toLowerCase())
    );
    setEleveTrouve(found || null);
    if (found) {
      setForm(f => ({ ...f, matricule: found.matricule || '', student: found.name }));
    } else {
      setForm(f => ({ ...f, matricule: q, student: '' }));
    }
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditItem(null);
    setModalMatricule('');
    setEleveTrouve(null);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setForm({ student: p.student, matricule: p.matricule || '', type: p.type, amount: String(p.amount), method: p.method, status: p.status });
    setEditItem(p);
    const found = p.matricule ? students.find(s => s.matricule === p.matricule) : null;
    setModalMatricule(found ? found.matricule || found.name : p.student);
    setEleveTrouve(found || null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form, amount: Number(form.amount), studentId: eleveTrouve?._id || eleveTrouve?.id || '' };
      if (editItem) {
        await updatePayment(editItem.id, data);
        await syncPaymentWithStudent(editItem.id, data);
        showToast('Paiement modifié avec succès', 'success');
      } else {
        const res = await addPayment({ ...data, id: `p-${Date.now()}` });
        const realId = res?._id || res?.id;
        if (realId) await syncPaymentWithStudent(realId, data);
        showToast('Paiement ajouté avec succès', 'success');
      }
      setShowModal(false);
      setForm(EMPTY_FORM);
      setEditItem(null);
      setModalMatricule('');
      setEleveTrouve(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de l\'enregistrement', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce paiement définitivement ?')) return;
    try {
      await deletePayment(id);
      showToast('Paiement supprimé avec succès', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de la suppression', 'error');
    }
  };

  const statusBadge = (s) => {
    const m = {
      'Payé':       { bg: '#ecfdf5', color: '#0d7a5e' },
      'En attente': { bg: '#fffbeb', color: '#b8860b' },
      'En retard':  { bg: '#fef2f2', color: '#b91c1c' },
    };
    return m[s] || m['En attente'];
  };

  const AVATAR_COLORS = ['bg-blue-500','bg-emerald-600','bg-violet-500','bg-pink-500','bg-amber-500','bg-cyan-500','bg-rose-500','bg-indigo-500'];

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2><i className="fa-solid fa-coins" style={{ color: '#b8860b', marginRight: 8 }}></i> Gestion des Paiements</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={openAdd} className="btn btn-primary">
            <i className="fa-solid fa-plus"></i> Nouveau paiement
          </button>
        </div>
      </div>

      {/* ── Stat Cards ───────────────────────────────────── */}
      <div className="stu-stats">
        <div className="stu-stat-card" style={{ borderTopColor: '#059669' }}>
          <div className="stu-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <i className="fa-solid fa-coins"></i>
          </div>
          <div>
            <div className="stu-stat-value">{totalCollected.toLocaleString('fr')} €</div>
            <div className="stu-stat-label">Total encaissé</div>
          </div>
        </div>
        <div className="stu-stat-card" style={{ borderTopColor: '#4f46e5' }}>
          <div className="stu-stat-icon" style={{ background: '#eef2ff', color: '#4f46e5' }}>
            <i className="fa-solid fa-receipt"></i>
          </div>
          <div>
            <div className="stu-stat-value">{payments.length}</div>
            <div className="stu-stat-label">Transactions</div>
          </div>
        </div>
        <div className="stu-stat-card" style={{ borderTopColor: '#d97706' }}>
          <div className="stu-stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
            <i className="fa-solid fa-calendar-check"></i>
          </div>
          <div>
            <div className="stu-stat-value">{mensualites}</div>
            <div className="stu-stat-label">Scolarités</div>
          </div>
        </div>
        <div className="stu-stat-card" style={{ borderTopColor: '#db2777' }}>
          <div className="stu-stat-icon" style={{ background: '#fdf2f8', color: '#db2777' }}>
            <i className="fa-solid fa-file-lines"></i>
          </div>
          <div>
            <div className="stu-stat-value">{inscriptions}</div>
            <div className="stu-stat-label">Activités</div>
          </div>
        </div>
        <div className="stu-stat-card" style={{ borderTopColor: '#dc2626' }}>
          <div className="stu-stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div>
            <div className="stu-stat-value" style={{ color: enRetard > 0 ? '#dc2626' : undefined }}>{enRetard}</div>
            <div className="stu-stat-label">En retard</div>
          </div>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────── */}
      <div className="stu-filters">
        <div className="stu-filter-group">
          <i className="fa-solid fa-search"></i>
          <input type="text" placeholder="Rechercher par élève ou matricule..." value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: 200 }} />
        </div>
        <div className="stu-filter-group">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">Tous types</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="stu-filter-group">
          <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)}>
            <option value="">Tous modes</option>
            {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="stu-filter-group">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Tous statuts</option>
            <option value="paye">Payé</option>
            <option value="attente">En attente</option>
            <option value="retard">En retard</option>
          </select>
        </div>
        <div className="stu-filter-group">
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)}>
            <option value="">Toutes classes</option>
            {classes.map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        {(search || filterType || filterMethod || filterStatus || filterClass) && (
          <button className="btn btn-sm" style={{ background: '#f1f0ed', color: '#57534e' }}
            onClick={() => { setSearch(''); setFilterType(''); setFilterMethod(''); setFilterStatus(''); setFilterClass(''); }}>
            <i className="fa-solid fa-rotate"></i> Réinitialiser
          </button>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────── */}
      <div className="table-container">
        {filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af' }}>
            <i className="fa-solid fa-file-invoice-dollar" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.4 }}></i>
            <p style={{ fontSize: 14, fontWeight: 500 }}>Aucun paiement trouvé</p>
            <button onClick={openAdd} className="btn btn-primary" style={{ marginTop: 12 }}>
              <i className="fa-solid fa-plus"></i> Enregistrer un paiement
            </button>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th className="col-nom">Élève</th>
                  <th className="col-paiement-type">Type</th>
                  <th className="col-montant">Montant</th>
                  <th className="col-id">Méthode</th>
                  <th className="col-date">Date</th>
                  <th className="col-statut">Statut</th>
                  <th className="col-actions" style={{ width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p, i) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {p.photo ? (
                          <img src={p.photo} alt={p.student} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div className={`${AVATAR_COLORS[i % AVATAR_COLORS.length]} avatar-initials`} style={{ width: 32, height: 32, fontSize: 11 }}>
                            {p.initials || p.student?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.student}</div>
                          {p.matricule && <div style={{ fontSize: 11, color: '#9ca3af' }}>{p.matricule}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, ...typeBadgeStyle(p.type) }}>
                        {p.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#0a2e2a', fontSize: 14 }}>{Number(p.amount).toLocaleString('fr')} €</td>
                    <td style={{ fontSize: 12.5, color: '#57534e' }}>{p.method}</td>
                    <td style={{ fontSize: 12.5, color: '#57534e' }}>{p.date}</td>
                    <td>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, ...statusBadge(p.status) }}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setViewItem(p)} className="btn btn-sm" style={{ background: '#eef2ff', color: '#4f46e5', padding: '5px 9px' }} title="Voir">
                          <i className="fa-solid fa-eye"></i>
                        </button>
                        <button onClick={() => openEdit(p)} className="btn btn-sm" style={{ background: '#fffbeb', color: '#d97706', padding: '5px 9px' }} title="Modifier">
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="btn btn-sm" style={{ background: '#fef2f2', color: '#dc2626', padding: '5px 9px' }} title="Supprimer">
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
                  <>Affichage {(page - 1) * perPage + 1} à {Math.min(page * perPage, filtered.length)} sur {filtered.length} paiement{filtered.length > 1 ? 's' : ''}</>
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
              <h3><i className="fa-solid fa-coins" style={{ color: '#059669', marginRight: 8 }}></i>{editItem ? 'Modifier le paiement' : 'Nouveau paiement'}</h3>
              <button onClick={() => setShowModal(false)} className="modal-close"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Matricule / Élève</label>
                <div className="matricule-search">
                  <i className="fa-solid fa-search"></i>
                  <input
                    placeholder="Entrer le matricule ou le nom..."
                    value={modalMatricule}
                    onChange={e => chercherEleve(e.target.value)}
                  />
                </div>
                {eleveTrouve && (
                  <div className="eleve-found">
                    <span className="eleve-found-badge">{eleveTrouve.matricule || ''}</span>
                    <span className="eleve-found-name">{eleveTrouve.name}</span>
                    <span className="eleve-found-tuteur">{eleveTrouve.parent || ''}</span>
                  </div>
                )}
                {modalMatricule && !eleveTrouve && (
                  <div className="eleve-not-found">Aucun élève trouvé</div>
                )}
              </div>
              <div className="form-group">
                <label>Nom de l'élève</label>
                <input type="text" placeholder="ex: Martin Paul" value={form.student} onChange={e => setForm(f => ({ ...f, student: e.target.value }))} required />
              </div>
              <div className="form-row">
                <div className="form-group required">
                  <label>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} required>
                    <option value="">Sélectionner</option>
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group required">
                  <label>Montant (€)</label>
                  <input type="number" min="0" step="0.01" placeholder="250" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Méthode</label>
                  <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
                    {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Statut</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-cancel">Annuler</button>
                <button type="submit" className="btn btn-primary">{editItem ? 'Enregistrer' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Modal ────────────────────────────────────── */}
      {viewItem && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setViewItem(null); }}>
          <div className="modal-content" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>Détail paiement</h3>
              <button onClick={() => setViewItem(null)} className="modal-close"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div style={{ padding: '8px 24px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div className={viewItem.color || 'bg-primary-600'} style={{ width: 52, height: 52, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700 }}>
                  {viewItem.initials || viewItem.student?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a2e' }}>{viewItem.student}</div>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, marginTop: 4, ...statusBadge(viewItem.status) }}>
                    {viewItem.status}
                  </span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Matricule', value: viewItem.matricule || '—' },
                  { label: 'Montant', value: `${Number(viewItem.amount).toLocaleString('fr')} €` },
                  { label: 'Type', value: viewItem.type },
                  { label: 'Méthode', value: viewItem.method },
                  { label: 'Date', value: viewItem.date },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: '10px 12px', background: '#faf9f6', borderRadius: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', marginTop: 2 }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button onClick={() => { const item = viewItem; setViewItem(null); openEdit(item); }} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  <i className="fa-solid fa-pen"></i> Modifier
                </button>
                <button onClick={() => setViewItem(null)} className="btn btn-cancel" style={{ flex: 1, justifyContent: 'center' }}>Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
