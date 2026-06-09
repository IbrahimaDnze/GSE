import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';

const NATIONALITES = ['Guinéenne', 'Malienne', 'Sénégalaise', 'Ivoirienne', 'Burkinabè', 'Nigérienne', 'Autre'];
const NIVEAUX_ENSEIGNEMENT = ['Primaire', 'Collège', 'Lycée'];
const DIPLOMES = ['BTS', 'Licence', 'Master', 'Doctorat'];
const CONTRATS = ['CDI', 'CDD', 'Vacataire'];

const EMPTY_FORM = {
  name: '', sexe: 'Masculin', dateNaissance: '', lieuNaissance: '', nationalite: 'Guinéenne',
  adresse: '', telephone: '', email: '', identifiant: '', subjects: [],
  niveauEnseignement: 'Primaire', classes: [], dateRecrutement: '',
  diplomes: [], experience: '', contrat: 'CDI', salaire: '', status: 'Actif'
};

const TeacherForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { teachers, subjects, subjectData, classes, addTeacher, updateTeacher } = useAppData();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(EMPTY_FORM);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (isEdit) {
      const t = teachers.find(t => t.id === id);
      if (t) {
        setForm({
          name: t.name, sexe: t.sexe || 'Masculin', dateNaissance: t.dateNaissance || '',
          lieuNaissance: t.lieuNaissance || '', nationalite: t.nationalite || 'Guinéenne',
          adresse: t.adresse || '', telephone: t.telephone || '', email: t.email || '',
          identifiant: t.identifiant || '', subjects: t.subjects || (t.subject ? [t.subject] : []),
          niveauEnseignement: t.niveauEnseignement || 'Collège', classes: t.classes || [],
          dateRecrutement: t.dateRecrutement || '', diplomes: t.diplomes || (t.diplome ? [t.diplome] : []),
          experience: t.experience || '', contrat: t.contrat || 'CDI',
          salaire: t.salaire || '', status: t.status
        });
        setPhotoPreview(t.photo || null);
      }
    }
  }, [id, isEdit, teachers]);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const toggleClass = (cls) => {
    setForm(prev => ({
      ...prev,
      classes: prev.classes.includes(cls)
        ? prev.classes.filter(c => c !== cls)
        : [...prev.classes, cls]
    }));
  };

  const toggleSubject = (subj) => {
    setForm(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subj)
        ? prev.subjects.filter(s => s !== subj)
        : [...prev.subjects, subj]
    }));
  };

  const toggleDiplome = (dip) => {
    setForm(prev => ({
      ...prev,
      diplomes: prev.diplomes.includes(dip)
        ? prev.diplomes.filter(d => d !== dip)
        : [...prev.diplomes, dip]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        photo: photoPreview || '',
        years: form.experience ? parseInt(form.experience) || 0 : 0
      };
      if (isEdit) {
        await updateTeacher(id, data);
        showToast('Enseignant modifié avec succès', 'success');
      } else {
        await addTeacher(data);
        showToast('Enseignant ajouté avec succès', 'success');
      }
      navigate('/teachers');
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/">Accueil</Link> <span className="breadcrumb-sep">/</span>
        <Link to="/teachers">Enseignants</Link> <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{isEdit ? "Modifier l'enseignant" : 'Ajouter un enseignant'}</span>
      </div>

      <div className="form-page-title">
        <i className="fa-solid fa-chalkboard-user"></i>
        {isEdit ? "Modifier l'enseignant" : 'Ajouter un enseignant'}
      </div>

      <div className="form-wrapper">
        <form onSubmit={handleSubmit}>
          {/* Section 1: Informations personnelles */}
          <div className="form-section">
            <div className="form-section-title">
              <i className="fa-solid fa-user"></i> Informations personnelles
            </div>
            <div className="form-section-body">
              <div className="form-layout-with-photo">
                <div className="form-photo-col">
                  <div className="photo-zone" onClick={() => fileRef.current?.click()}>
                    {photoPreview ? (
                      <img src={photoPreview} alt="Photo" className="photo-preview" />
                    ) : (
                      <>
                        <div className="photo-zone-icon"><i className="fa-solid fa-camera"></i></div>
                        <div className="photo-zone-text">Photo de profil</div>
                        <div className="photo-zone-hint">PNG, JPG (max 2Mo)</div>
                      </>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
                  </div>
                </div>
                <div className="form-fields-col">
                  <div className="form-row">
                    <div className="form-group required">
                      <label>Nom complet</label>
                      <input type="text" placeholder="Nom complet" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                    </div>
                    <div className="form-group required">
                      <label>Sexe</label>
                      <select value={form.sexe} onChange={e => setForm(f => ({ ...f, sexe: e.target.value }))} required>
                        <option value="Masculin">Masculin</option>
                        <option value="Féminin">Féminin</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Date de naissance</label>
                      <input type="date" value={form.dateNaissance} onChange={e => setForm(f => ({ ...f, dateNaissance: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label>Lieu de naissance</label>
                      <input type="text" placeholder="Lieu de naissance" value={form.lieuNaissance} onChange={e => setForm(f => ({ ...f, lieuNaissance: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nationalité</label>
                      <select value={form.nationalite} onChange={e => setForm(f => ({ ...f, nationalite: e.target.value }))}>
                        {NATIONALITES.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Adresse complète</label>
                      <input type="text" placeholder="Adresse" value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group required">
                      <label>Téléphone</label>
                      <input type="tel" placeholder="6XX XXX XXX" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} required />
                    </div>
                    <div className="form-group required">
                      <label>Email</label>
                      <input type="email" placeholder="exemple@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Informations professionnelles */}
          <div className="form-section">
            <div className="form-section-title">
              <i className="fa-solid fa-briefcase"></i> Informations professionnelles
            </div>
            <div className="form-section-body">
              <div className="form-row">
                <div className="form-group required">
                  <label>Matricule Enseignant</label>
                  <input type="text" placeholder="ENS-2026-001" value={form.identifiant} onChange={e => setForm(f => ({ ...f, identifiant: e.target.value }))} required />
                </div>
                <div className="form-group required">
                  <label>Niveau d'enseignement</label>
                  <select value={form.niveauEnseignement} onChange={e => setForm(f => ({ ...f, niveauEnseignement: e.target.value, subjects: [], classes: [] }))} required>
                    {NIVEAUX_ENSEIGNEMENT.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              {(() => {
                const filteredSubjects = form.niveauEnseignement
                  ? subjectData.filter(s => s.level === form.niveauEnseignement).map(s => s.name)
                  : subjects;
                return (
                <div className="form-row">
                  <div className="form-group required">
                    <label>Matière(s) enseignée(s)</label>
                    {filteredSubjects.length === 0 ? (
                      <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Aucune matière disponible pour ce niveau</p>
                    ) : (
                    <div className="checkbox-grid">
                      {filteredSubjects.map(subject => (
                        <label key={subject} className="checkbox-chip" style={{
                          borderColor: form.subjects.includes(subject) ? '#0d7a5e' : '#e3dfd6',
                          background: form.subjects.includes(subject) ? '#f0faf5' : '#fcfcfa',
                          color: form.subjects.includes(subject) ? '#065f46' : '#57534e'
                        }}>
                          <input type="checkbox" checked={form.subjects.includes(subject)} onChange={() => toggleSubject(subject)} />
                          {subject}
                        </label>
                      ))}
                    </div>
                    )}
                  </div>
                </div>
                );
              })()}
              {(() => {
                const filteredClasses = form.niveauEnseignement
                  ? classes.filter(cls => cls.level === form.niveauEnseignement)
                  : classes;
                return (
                <div className="form-group">
                  <label>Classe(s) affectée(s)</label>
                  {filteredClasses.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Aucune classe disponible pour ce niveau</p>
                  ) : (
                  <div className="checkbox-grid">
                    {filteredClasses.map(cls => (
                      <label key={cls.name} className="checkbox-chip" style={{
                        borderColor: form.classes.includes(cls.name) ? '#0d7a5e' : '#e3dfd6',
                        background: form.classes.includes(cls.name) ? '#f0faf5' : '#fcfcfa',
                        color: form.classes.includes(cls.name) ? '#065f46' : '#57534e'
                      }}>
                        <input type="checkbox" checked={form.classes.includes(cls.name)} onChange={() => toggleClass(cls.name)} />
                        {cls.name}
                      </label>
                    ))}
                  </div>
                  )}
                </div>
                );
              })()}
              <div className="form-group" style={{ marginTop: 16 }}>
                <label>Diplôme(s) obtenu(s)</label>
                <div className="checkbox-grid">
                  {DIPLOMES.map(dip => (
                    <label key={dip} className="checkbox-chip" style={{
                      borderColor: form.diplomes.includes(dip) ? '#0d7a5e' : '#e3dfd6',
                      background: form.diplomes.includes(dip) ? '#f0faf5' : '#fcfcfa',
                      color: form.diplomes.includes(dip) ? '#065f46' : '#57534e'
                    }}>
                      <input type="checkbox" checked={form.diplomes.includes(dip)} onChange={() => toggleDiplome(dip)} />
                      {dip}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Expérience professionnelle</label>
                  <input type="text" placeholder="5 ans" value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} />
                </div>
                <div className="form-group required">
                  <label>Type de contrat</label>
                  <select value={form.contrat} onChange={e => setForm(f => ({ ...f, contrat: e.target.value }))} required>
                    {CONTRATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date de recrutement</label>
                  <input type="date" value={form.dateRecrutement} onChange={e => setForm(f => ({ ...f, dateRecrutement: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Salaire mensuel</label>
                  <input type="text" placeholder="3 500 000 GNF" value={form.salaire} onChange={e => setForm(f => ({ ...f, salaire: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="form-footer">
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.status === 'Actif'} onChange={e => setForm(f => ({ ...f, status: e.target.checked ? 'Actif' : 'Inactif' }))}
                  style={{ width: 17, height: 17, accentColor: '#0d7a5e' }} />
                <span style={{ fontSize: 13, color: '#44403c', fontWeight: 500 }}>Enseignant actif</span>
              </label>
            </div>
            <div className="form-actions-right">
              <button type="button" onClick={() => navigate('/teachers')} className="btn btn-cancel">
                <i className="fa-solid fa-times"></i> Annuler
              </button>
              <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                <i className="fa-solid fa-save"></i> {saving ? 'Enregistrement...' : (isEdit ? 'Enregistrer' : 'Ajouter')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherForm;
