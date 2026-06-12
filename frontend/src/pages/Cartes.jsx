import { useState, useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import jsPDF from 'jspdf';
import api from '../api/axios';

const Cartes = () => {
  const { students, teachers } = useAppData();
  const { showToast } = useToast();
  const [onglet, setOnglet] = useState('eleve');
  const [selectionnes, setSelectionnes] = useState([]);
  const [filtreClasse, setFiltreClasse] = useState('');
  const [generating, setGenerating] = useState(false);

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

  const loadImageDataUrl = async (url) => {
    if (!url) return null;
    try {
      if (url.startsWith('data:')) return url;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch {
      return null;
    }
  };

  const genererCartes = async () => {
    if (!selectionnes.length) return;
    setGenerating(true);

    try {
      const personnes = liste.filter(item => selectionnes.includes(item.id));
      const type = onglet;

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
          const res = await api.get('/settings');
          logoUrl = res.data.logo || '';
          schoolName = res.data.schoolName || schoolName;
        } catch {}
      }

      const logoData = logoUrl ? await loadImageDataUrl(logoUrl) : null;
      const photoDataList = await Promise.all(personnes.map(p => loadImageDataUrl(p.photo)));

      const doc = new jsPDF('p', 'mm', 'a4');
      const pw = doc.internal.pageSize.getWidth();

      const cardW = 90;
      const cardH = 56;
      const mx = 8;
      const my = 10;
      const gx = 14;
      const gy = 8;
      const cols = 2;
      const rowsPerPage = 4;
      const cardsPerPage = cols * rowsPerPage;

      const drawCard = (x, y, p, idx) => {
        const photo = photoDataList[idx];

        // Shadow
        doc.setFillColor('#d6d2c7');
        doc.roundedRect(x + 0.7, y + 0.7, cardW, cardH, 3, 3, 'F');

        // Card body
        doc.setFillColor('#ffffff');
        doc.setDrawColor('#d1ccc0');
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, cardW, cardH, 3, 3, 'FD');

        // ── Top band (blue) ──
        doc.setFillColor('#1e3a5f');
        doc.rect(x, y, cardW, 14, 'F');

        if (logoData) {
          try { doc.addImage(logoData, 'PNG', x + 2.5, y + 2.2, 9.6, 9.6); } catch {}
        }

        doc.setTextColor('#ffffff');
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        const sn = schoolName.length > 28 ? schoolName.substring(0, 28) + '…' : schoolName;
        doc.text(sn, x + 13.5, y + 6);

        doc.setFontSize(5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#b8860b');
        doc.text(type === 'eleve' ? 'CARTE D\'ÉLÈVE' : 'CARTE ENSEIGNANT', x + 13.5, y + 11);

        // ── Photo on left ──
        const photoX = x + 3;
        const photoY = y + 17;
        const photoW = 26;
        const photoH = 32;

        if (photo) {
          try { doc.addImage(photo, 'JPEG', photoX, photoY, photoW, photoH); } catch {}
        } else {
          doc.setFillColor('#f1f0ed');
          doc.roundedRect(photoX, photoY, photoW, photoH, 2, 2, 'F');
          doc.setTextColor('#c4bfb2');
          doc.setFontSize(12);
          doc.text('📷', photoX + photoW / 2, photoY + photoH / 2 + 4, { align: 'center' });
        }

        // Gold accent below photo
        doc.setDrawColor('#b8860b');
        doc.setLineWidth(0.5);
        doc.line(photoX + 1, photoY + photoH + 2.5, photoX + photoW - 1, photoY + photoH + 2.5);

        // ── Info ──
        const ix = x + 31;
        const iw = cardW - 33;

        doc.setTextColor('#1a1a2e');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        const nm = (p.name || '—').length > 26 ? (p.name || '—').substring(0, 26) + '…' : (p.name || '—');
        doc.text(nm, ix, y + 21);

        doc.setDrawColor('#e5e2d9');
        doc.setLineWidth(0.2);
        doc.line(ix, y + 23, x + cardW - 3, y + 23);

        const drawField = (label, value, yy) => {
          doc.setFontSize(5.8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor('#9e9a8e');
          doc.text(label, ix, yy);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor('#1a1a2e');
          const v = (value || '—').length > 24 ? (value || '—').substring(0, 24) + '…' : (value || '—');
          doc.text(v, ix, yy + 3.8);
        };

        drawField('Matricule', p.matricule, y + 26);
        if (type === 'eleve') {
          drawField('Classe', p.class, y + 31.5);
          drawField('Né(e) le', p.dob, y + 37);
          drawField('Sexe', p.gender || p.sexe || '—', y + 42.5);
        } else {
          const matieres = Array.isArray(p.subjects) ? p.subjects.join(', ') : p.subjects || p.matieres || '—';
          drawField('Matière(s)', matieres, y + 31.5);
          drawField('Tél.', p.telephone || p.phone || '—', y + 37);
          drawField('Identifiant', p.identifiant || '—', y + 42.5);
        }

        // ── Bottom band (green) ──
        doc.setFillColor('#0d7a5e');
        doc.rect(x, y + cardH - 8, cardW, 8, 'F');
        doc.setTextColor('#ffffff');
        doc.setFontSize(4.8);
        doc.setFont('helvetica', 'normal');
        const yr = new Date().getFullYear();
        doc.text(`Année scolaire ${yr}-${yr + 1}`, x + 3, y + cardH - 3.2);
        doc.text(`Carte ${type === 'eleve' ? 'élève' : 'enseignant'} · ${p.matricule || 'N/A'}`, x + cardW / 2 + 3, y + cardH - 3.2);
      };

      personnes.forEach((p, idx) => {
        const pageIdx = Math.floor(idx / cardsPerPage);
        const posInPage = idx % cardsPerPage;
        if (posInPage === 0 && idx > 0) doc.addPage();

        const col = posInPage % cols;
        const row = Math.floor(posInPage / cols);
        const cx = mx + col * (cardW + gx);
        const cy = my + row * (cardH + gy);

        drawCard(cx, cy, p, idx);
      });

      doc.save(`Cartes_${type === 'eleve' ? 'eleves' : 'enseignants'}.pdf`);
      showToast(`${personnes.length} carte(s) générée(s) avec succès`, 'success');
    } catch (err) {
      showToast('Erreur : ' + (err?.message || err || 'Génération échouée'), 'error');
    } finally {
      setGenerating(false);
    }
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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
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
          <button className="btn btn-primary" onClick={genererCartes} disabled={!selectionnes.length || generating}>
            <i className="fa-solid fa-id-card"></i> {generating ? 'Génération...' : `Générer (${selectionnes.length})`}
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
                    <>{Array.isArray(item.subjects) ? item.subjects.join(', ') : item.subjects || item.matieres || 'Pas de matière'}</>
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
