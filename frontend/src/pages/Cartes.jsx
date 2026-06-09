import { useState, useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';

const Cartes = () => {
  const { students, teachers } = useAppData();
  const [onglet, setOnglet] = useState('eleve');
  const [selectionnes, setSelectionnes] = useState([]);
  const [filtreClasse, setFiltreClasse] = useState('');

  const liste = onglet === 'eleve' ? students : teachers;

  const classes = useMemo(() => {
    return [...new Set(students.filter(s => s.class).map(s => s.class))].sort();
  }, [students]);

  const listeFiltree = useMemo(() => {
    if (onglet !== 'eleve' || !filtreClasse) return liste;
    return liste.filter(item => item.class === filtreClasse);
  }, [liste, onglet, filtreClasse]);

  const toutSelectionner = () => {
    setSelectionnes(liste.map(item => item.id));
  };

  const toutDeselectionner = () => {
    setSelectionnes([]);
  };

  const selectionnerClasse = () => {
    setSelectionnes(listeFiltree.map(item => item.id));
  };

  const basculer = (id) => {
    setSelectionnes(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const genererCartes = () => {
    if (!selectionnes.length) return;
    alert(`Génération de ${selectionnes.length} carte(s) ${onglet === 'eleve' ? 'élève' : 'enseignant'} - Fonctionnalité à connecter à une API PDF`);
  };

  return (
    <div className="space-y-6">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2><i className="fa-solid fa-id-card" style={{ color: '#b8860b', marginRight: 8 }}></i> Génération de cartes</h2>
      </div>

      <div className="stu-filters" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={`btn ${onglet === 'eleve' ? 'btn-primary' : 'btn-cancel'}`} onClick={() => { setOnglet('eleve'); setSelectionnes([]); setFiltreClasse(''); }}>
            <i className="fa-solid fa-graduation-cap"></i> Élèves
          </button>
          <button className={`btn ${onglet === 'enseignant' ? 'btn-primary' : 'btn-cancel'}`} onClick={() => { setOnglet('enseignant'); setSelectionnes([]); setFiltreClasse(''); }}>
            <i className="fa-solid fa-chalkboard-user"></i> Enseignants
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {onglet === 'eleve' && classes.length > 0 && (
            <div className="stu-filter-group" style={{ marginBottom: 0 }}>
              <select value={filtreClasse} onChange={e => { setFiltreClasse(e.target.value); setSelectionnes([]); }} style={{ padding: '7px 12px' }}>
                <option value="">Toutes les classes</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          {filtreClasse && (
            <button className="btn btn-sm btn-cancel" onClick={selectionnerClasse}>
              <i className="fa-solid fa-users"></i> Cette classe
            </button>
          )}
          <button className="btn btn-sm btn-cancel" onClick={toutSelectionner}>
            <i className="fa-solid fa-check-double"></i> Tout
          </button>
          <button className="btn btn-sm btn-cancel" onClick={toutDeselectionner}>
            <i className="fa-solid fa-xmark"></i> Aucun
          </button>
          <button className="btn btn-primary" onClick={genererCartes} disabled={!selectionnes.length}>
            <i className="fa-solid fa-id-card"></i> Générer ({selectionnes.length})
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
        {listeFiltree.map(item => {
          const isSelected = selectionnes.includes(item.id);
          return (
            <div key={item.id} onClick={() => basculer(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12,
              cursor: 'pointer', border: isSelected ? '2px solid #0d7a5e' : '2px solid #e8e4db',
              background: isSelected ? '#f0faf5' : '#fff', transition: 'all 0.15s'
            }}>
              <input type="checkbox" checked={isSelected} onChange={() => basculer(item.id)} style={{ width: 18, height: 18, accentColor: '#0d7a5e' }} />
              <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f1f0ed', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a8a29e', fontSize: 16 }}>
                {item.photo ? (
                  <img src={item.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <i className="fa-solid fa-user"></i>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1f2937' }}>{item.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  {onglet === 'eleve' ? (
                    <>{item.matricule || 'Pas de matricule'} · {item.class || '—'}</>
                  ) : (
                    <>{item.subject || 'Pas de matière'}</>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {listeFiltree.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          <i className="fa-solid fa-users-slash" style={{ fontSize: 40, marginBottom: 12, display: 'block', opacity: 0.4 }}></i>
          Aucun {onglet === 'eleve' ? 'élève' : 'enseignant'} trouvé
        </div>
      )}
    </div>
  );
};

export default Cartes;
