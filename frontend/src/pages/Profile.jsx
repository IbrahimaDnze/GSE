import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const Profile = () => {
  const { user: currentUser, refreshUser } = useAuth();
  const [form, setForm] = useState({
    nom: currentUser?.name || '',
    email: currentUser?.email || '',
    telephone: currentUser?.phone || ''
  });
  const [passwords, setPasswords] = useState({ motDePasse: '', confirm: '' });
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwords.motDePasse && passwords.motDePasse !== passwords.confirm) return;
    setSaving(true);
    try {
      const data = { nom: form.nom, email: form.email, telephone: form.telephone };
      if (photo) data.photo = photo;
      if (passwords.motDePasse) data.motDePasse = passwords.motDePasse;
      if (currentUser?.id) {
        await api.put('/auth/profile', data);
        await refreshUser();
      }
      showToast('Profil mis à jour avec succès', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de la mise à jour', 'error');
    } finally {
      setSaving(false);
    }
  };

  const photoUrl = photo || currentUser?.photo || null;

  return (
    <div className="space-y-6">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2><i className="fa-solid fa-user-circle" style={{ color: '#b8860b', marginRight: 8 }}></i> Mon Profil</h2>
      </div>

      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{
          background: '#fff', borderRadius: 16, padding: '40px 32px', textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)', minWidth: 240, flex: 1, maxWidth: 320,
          border: '1px solid #e8e4db'
        }}>
          <div
            onClick={() => document.getElementById('photo-upload')?.click()}
            style={{
              width: 120, height: 120, borderRadius: '50%',
              background: photoUrl ? 'transparent' : '#1e3a5f',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 48, color: '#fff', fontWeight: 700,
              margin: '0 auto 16px', cursor: 'pointer', overflow: 'hidden',
              border: '3px solid #e8e4db', position: 'relative',
            }}
          >
            {photoUrl ? (
              <img src={photoUrl} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              currentUser?.name?.charAt(0)?.toUpperCase() || 'A'
            )}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 11,
              padding: '4px 0', fontWeight: 500
            }}>
              <i className="fa-solid fa-camera"></i>
            </div>
          </div>
          <input id="photo-upload" type="file" accept="image/png,image/jpeg" onChange={handlePhoto} style={{ display: 'none' }} />
          <h2 style={{ fontSize: 20, margin: 0, color: '#1a1a2e' }}>{currentUser?.name}</h2>
          <p style={{ color: '#78716c', fontSize: 14, margin: '4px 0 12px' }}>{currentUser?.email}</p>
          <span style={{
            display: 'inline-block', padding: '4px 14px', borderRadius: 20,
            background: '#ecfdf5', color: '#0d7a5e', fontWeight: 600, fontSize: 12
          }}>
            {currentUser?.role === 'admin' ? 'Administrateur' :
             currentUser?.role === 'directeur' ? 'Directeur' :
             currentUser?.role === 'enseignant' ? 'Enseignant' : 'Comptable'}
          </span>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e8e4db', flex: 2, minWidth: 300 }}>
          <h3 style={{ fontSize: 17, margin: '0 0 20px', color: '#1a1a2e' }}>
            <i className="fa-solid fa-pen-to-square" style={{ color: '#0d7a5e', marginRight: 8 }}></i>
            Modifier mes informations
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Nom complet</label>
                <input name="nom" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input name="telephone" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} placeholder="+33 6 00 00 00 00" />
            </div>

            <h4 style={{ fontSize: 14, margin: '24px 0 12px', color: '#57534e' }}>
              <i className="fa-solid fa-lock" style={{ color: '#b8860b', marginRight: 6 }}></i>
              Changer le mot de passe (optionnel)
            </h4>
            <div className="form-row">
              <div className="form-group">
                <label>Nouveau mot de passe</label>
                <input type="password" name="motDePasse" value={passwords.motDePasse} onChange={e => setPasswords({ ...passwords, motDePasse: e.target.value })} placeholder="Laisser vide" />
              </div>
              <div className="form-group">
                <label>Confirmer</label>
                <input type="password" name="confirm" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} placeholder="Confirmer" />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                <i className={`fa-solid ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i> Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
