import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';

const EnrollmentForm = ({ mode }) => {
  const navigate = useNavigate();
  const { enrollments, addEnrollment, updateEnrollment, students, updateStudent, addStudent, classes } = useAppData();
  const fileRef = useRef(null);

  const isReenroll = mode === 'reinscrire';
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  // New enrollment state
  const [form, setForm] = useState({
    student: '', matricule: '', dob: '', birthPlace: '', filiations: '',
    address: '', parent: '', parentPhone: '', gender: '',
    classReq: '', schoolYear: '', docs: false, photo: ''
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [acceptedTermsAdd, setAcceptedTermsAdd] = useState(false);

  // Re-enrollment state
  const [reenrollForm, setReenrollForm] = useState({
    matricule: '', studentId: '', classReq: '', parent: '', parentPhone: '', schoolYear: '', docs: false
  });
  const [acceptedTermsReenroll, setAcceptedTermsReenroll] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target.result);
      setForm(f => ({ ...f, photo: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!acceptedTermsAdd) return;
    setSaving(true);
    try {
      const studentData = {
        name: form.student,
        matricule: form.matricule,
        dob: form.dob,
        birthPlace: form.birthPlace,
        filiations: form.filiations,
        address: form.address,
        class: form.classReq,
        schoolYear: form.schoolYear,
        gender: form.gender,
        parent: form.parent,
        parentPhone: form.parentPhone,
        photo: form.photo,
        status: 'Actif'
      };

      const enrollmentData = {
        student: form.student,
        parent: form.parent,
        parentPhone: form.parentPhone,
        parentEmail: form.parentEmail,
        classReq: form.classReq,
        schoolYear: form.schoolYear,
        gender: form.gender,
        photo: form.photo,
        docs: form.docs,
        status: 'Accepté',
        date: new Date().toLocaleDateString('fr-FR')
      };

      await Promise.all([addStudent(studentData), addEnrollment(enrollmentData)]);

      showToast('Inscription ajoutée avec succès', 'success');
      navigate('/enrollments');
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de l\'inscription', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReenroll = async (e) => {
    e.preventDefault();
    if (!acceptedTermsReenroll) return;
    setSaving(true);
    try {
      const selectedStudent = students.find(s => s.id === reenrollForm.studentId);
      if (selectedStudent) {
        await updateStudent(selectedStudent.id, {
          class: reenrollForm.classReq,
          status: 'Actif',
          parent: reenrollForm.parent,
          parentPhone: reenrollForm.parentPhone,
          schoolYear: reenrollForm.schoolYear
        });

        const existingEnrollments = enrollments.filter(enr =>
          enr.student === selectedStudent.name &&
          enr.status !== 'Refusé'
        );

        if (existingEnrollments.length > 0) {
          for (const enrollment of existingEnrollments) {
            await updateEnrollment(enrollment.id, {
              parent: reenrollForm.parent,
              parentPhone: reenrollForm.parentPhone,
              parentEmail: reenrollForm.parentEmail,
              classReq: reenrollForm.classReq,
              schoolYear: reenrollForm.schoolYear,
              photo: selectedStudent.photo,
              docs: reenrollForm.docs,
              status: 'Accepté'
            });
          }
        } else {
          await addEnrollment({
            student: selectedStudent.name,
            parent: reenrollForm.parent,
            parentPhone: reenrollForm.parentPhone,
            parentEmail: reenrollForm.parentEmail,
            classReq: reenrollForm.classReq,
            schoolYear: reenrollForm.schoolYear,
            photo: selectedStudent.photo,
            docs: reenrollForm.docs,
            status: 'Accepté',
            date: new Date().toLocaleDateString('fr-FR')
          });
        }
      }
      showToast('Réinscription effectuée avec succès', 'success');
      navigate('/enrollments');
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de la réinscription', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/">Accueil</Link> <span className="breadcrumb-sep">/</span>
        <Link to="/enrollments">Inscriptions</Link> <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{isReenroll ? 'Réinscrire un élève' : 'Nouvelle inscription'}</span>
      </div>

      <div className="form-page-title">
        <i className="fa-solid fa-file-pen"></i>
        {isReenroll ? 'Réinscrire un élève' : 'Nouvelle inscription'}
      </div>

      <div className="form-wrapper">
        {isReenroll ? (
          /* ── Re-enrollment Form ── */
          <form onSubmit={handleReenroll}>
            {/* Section 1: Recherche élève */}
            <div className="form-section">
              <div className="form-section-title">
                <i className="fa-solid fa-search"></i> Rechercher l'élève
              </div>
              <div className="form-section-body">
                <div className="form-group">
                  <label>Matricule de l'élève</label>
                  <div className="matricule-search">
                    <i className="fa-solid fa-id-card"></i>
                    <input type="text" placeholder="Ex: MAT2024001" value={reenrollForm.matricule}
                      onChange={(e) => {
                        const matricule = e.target.value.toUpperCase();
                        setReenrollForm(f => ({ ...f, matricule }));
                        if (matricule) {
                          const foundStudent = students.find(s => s.matricule === matricule);
                          if (foundStudent) {
                            setReenrollForm(f => ({
                              ...f,
                              matricule,
                              studentId: foundStudent.id,
                              parent: foundStudent.parent || '',
                              parentPhone: foundStudent.parentPhone || '',
                              parentEmail: foundStudent.parentEmail || ''
                            }));
                          } else {
                            setReenrollForm(f => ({ ...f, studentId: '' }));
                          }
                        } else {
                          setReenrollForm(f => ({ ...f, studentId: '' }));
                        }
                      }} />
                  </div>
                  {reenrollForm.matricule && students.find(s => s.matricule === reenrollForm.matricule) && (
                    <div className="eleve-found">
                      <i className="fa-solid fa-check-circle" style={{ color: '#0d7a5e', fontSize: 16 }}></i>
                      <span className="eleve-found-badge">{reenrollForm.matricule}</span>
                      <span className="eleve-found-name">{students.find(s => s.matricule === reenrollForm.matricule)?.name}</span>
                    </div>
                  )}
                  {reenrollForm.matricule && !students.find(s => s.matricule === reenrollForm.matricule) && (
                    <div className="eleve-not-found">
                      <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }}></i>
                      Aucun élève trouvé avec ce matricule
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Ou sélectionner manuellement</label>
                  <select value={reenrollForm.studentId} onChange={(e) => {
                    const studentId = e.target.value;
                    setReenrollForm(f => ({ ...f, studentId }));
                    if (studentId) {
                      const selectedStudent = students.find(s => s.id === studentId);
                      if (selectedStudent) {
                        setReenrollForm(f => ({
                          ...f,
                          matricule: selectedStudent.matricule || '',
                          parent: selectedStudent.parent || '',
                          parentPhone: selectedStudent.parentPhone || '',
                          parentEmail: selectedStudent.parentEmail || ''
                        }));
                      }
                    }
                  }}>
                    <option value="">Sélectionner un élève</option>
                    {students.filter((student, index, self) =>
                      index === self.findIndex((s) => s.id === student.id)
                    ).map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.matricule || 'N/A'}) - {s.class || 'Non assigné'}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Nouvelle affectation */}
            <div className="form-section">
              <div className="form-section-title">
                <i className="fa-solid fa-book"></i> Nouvelle affectation
              </div>
              <div className="form-section-body">
                <div className="form-row">
                  <div className="form-group required">
                    <label>Nouvelle classe</label>
                    <select value={reenrollForm.classReq} onChange={e => setReenrollForm(f => ({ ...f, classReq: e.target.value }))} required>
                      <option value="">Sélectionner</option>
                      {classes.map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group required">
                    <label>Année scolaire</label>
                    <select value={reenrollForm.schoolYear} onChange={e => setReenrollForm(f => ({ ...f, schoolYear: e.target.value }))} required>
                      <option value="">Sélectionner</option>
                      <option value="2023-2024">2023-2024</option>
                      <option value="2024-2025">2024-2025</option>
                      <option value="2025-2026">2025-2026</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Parent / Tuteur */}
            <div className="form-section">
              <div className="form-section-title">
                <i className="fa-solid fa-users"></i> Informations du parent / tuteur
              </div>
              <div className="form-section-body">
                <div className="form-row">
                  <div className="form-group required">
                    <label>Nom du parent / tuteur</label>
                    <input type="text" placeholder="Ex: Marie Dupont" value={reenrollForm.parent} onChange={e => setReenrollForm(f => ({ ...f, parent: e.target.value }))} required />
                  </div>
                  <div className="form-group required">
                    <label>Téléphone</label>
                    <input type="tel" placeholder="Ex: 06 00 00 00 00" value={reenrollForm.parentPhone} onChange={e => setReenrollForm(f => ({ ...f, parentPhone: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: 12 }}>
                  <label>Documents fournis</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 4 }}>
                    <input type="checkbox" checked={reenrollForm.docs} onChange={e => setReenrollForm(f => ({ ...f, docs: e.target.checked }))} style={{ width: 17, height: 17, accentColor: '#0d7a5e' }} />
                    <span style={{ fontSize: 13, color: '#44403c' }}>Documents complets fournis</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="form-footer">
              <label className="terms-checkbox">
                <input type="checkbox" checked={acceptedTermsReenroll} onChange={e => setAcceptedTermsReenroll(e.target.checked)} />
                <span>J'accepte les conditions d'utilisation et la politique de confidentialité.</span>
              </label>
              <div className="form-actions-right">
                <button type="button" onClick={() => navigate('/enrollments')} className="btn btn-cancel">
                  <i className="fa-solid fa-times"></i> Annuler
                </button>
                <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                  <i className="fa-solid fa-save"></i> {saving ? 'Enregistrement...' : 'Réinscrire'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* ── New Enrollment Form ── */
          <form onSubmit={handleAdd}>
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
                          <div className="photo-zone-text">Photo de l'élève</div>
                          <div className="photo-zone-hint">PNG, JPG (max 2Mo)</div>
                        </>
                      )}
                      <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                    </div>
                  </div>
                  <div className="form-fields-col">
                    <div className="form-row">
                      <div className="form-group required">
                        <label>Nom complet</label>
                        <input type="text" placeholder="Nom" value={form.student} onChange={e => setForm(f => ({ ...f, student: e.target.value }))} required />
                      </div>
                      <div className="form-group required">
                        <label>Matricule</label>
                        <input type="text" placeholder="Ex: ETU-001" value={form.matricule} onChange={e => setForm(f => ({ ...f, matricule: e.target.value }))} required />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Date de naissance</label>
                        <input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label>Lieu de naissance</label>
                        <input type="text" placeholder="Ex: Paris" value={form.birthPlace} onChange={e => setForm(f => ({ ...f, birthPlace: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group required">
                        <label>Sexe</label>
                        <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} required>
                          <option value="">Sélectionner</option>
                          <option value="Masculin">Masculin</option>
                          <option value="Féminin">Féminin</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Adresse</label>
                        <input type="text" placeholder="Adresse" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Filiations</label>
                      <input type="text" placeholder="ex: Pierre Dupont (père) et Marie Durand (mère)" value={form.filiations} onChange={e => setForm(f => ({ ...f, filiations: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Informations scolaires */}
            <div className="form-section">
              <div className="form-section-title">
                <i className="fa-solid fa-book"></i> Informations scolaires
              </div>
              <div className="form-section-body">
                <div className="form-row">
                  <div className="form-group required">
                    <label>Classe souhaitée</label>
                    <select value={form.classReq} onChange={e => setForm(f => ({ ...f, classReq: e.target.value }))} required>
                      <option value="">Sélectionner</option>
                      {classes.map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group required">
                    <label>Année scolaire</label>
                    <select value={form.schoolYear} onChange={e => setForm(f => ({ ...f, schoolYear: e.target.value }))} required>
                      <option value="">Sélectionner</option>
                      <option value="2023-2024">2023-2024</option>
                      <option value="2024-2025">2024-2025</option>
                      <option value="2025-2026">2025-2026</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Parent / Tuteur */}
            <div className="form-section">
              <div className="form-section-title">
                <i className="fa-solid fa-users"></i> Informations du parent / tuteur
              </div>
              <div className="form-section-body">
                <div className="form-row">
                  <div className="form-group required">
                    <label>Nom du parent / tuteur</label>
                    <input type="text" placeholder="Ex: Marie Dupont" value={form.parent} onChange={e => setForm(f => ({ ...f, parent: e.target.value }))} required />
                  </div>
                  <div className="form-group required">
                    <label>Téléphone</label>
                    <input type="tel" placeholder="Ex: 06 00 00 00 00" value={form.parentPhone} onChange={e => setForm(f => ({ ...f, parentPhone: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: 12 }}>
                  <label>Documents fournis</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 4 }}>
                    <input type="checkbox" checked={form.docs} onChange={e => setForm(f => ({ ...f, docs: e.target.checked }))} style={{ width: 17, height: 17, accentColor: '#0d7a5e' }} />
                    <span style={{ fontSize: 13, color: '#44403c' }}>Documents complets fournis</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="form-footer">
              <label className="terms-checkbox">
                <input type="checkbox" checked={acceptedTermsAdd} onChange={e => setAcceptedTermsAdd(e.target.checked)} />
                <span>J'accepte les conditions d'utilisation et la politique de confidentialité.</span>
              </label>
              <div className="form-actions-right">
                <button type="button" onClick={() => navigate('/enrollments')} className="btn btn-cancel">
                  <i className="fa-solid fa-times"></i> Annuler
                </button>
                <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                  <i className="fa-solid fa-save"></i> {saving ? 'Enregistrement...' : 'Inscrire'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EnrollmentForm;
