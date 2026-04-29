import { useState, useRef, useEffect } from 'react';
import PageBanner from '../components/PageBanner';
import { useSchool } from '../context/SchoolContext';
import { useAppData } from '../context/AppDataContext';

const TABS = [
  { id: 'school',   label: 'Établissement', icon: '🏫' },
  { id: 'users',    label: 'Utilisateurs',  icon: '👥' },
  { id: 'security', label: 'Sécurité',      icon: '🔒' },
  { id: 'notifs',   label: 'Notifications', icon: '🔔' },
  { id: 'theme',    label: 'Apparence',     icon: '🎨' },
];

const ROLES = ['Administrateur', 'Directeur', 'Secrétaire', 'Enseignant', 'Comptable'];

const Input = ({ label, ...p }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
    <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" {...p} />
  </div>
);

const Toggle = ({ label, description, checked, onChange }) => (
  <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
    <div>
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
    </div>
    <button onClick={onChange} className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${checked ? 'bg-primary-600' : 'bg-slate-200'}`}>
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

const EMPTY_USER_FORM = { name: '', email: '', role: 'Enseignant', password: '', active: true };

const Settings = () => {
  const { logo, schoolName, schoolId, address, phone, email: schoolEmail, website, schoolYear, currency,
    setLogo, removeLogo, updateSettings } = useSchool();
  const { users, addUser, updateUser, deleteUser, currentUser } = useAppData();

  const [tab, setTab]         = useState('school');
  const [saved, setSaved]     = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  /* ── School form state ──────────────────────────────── */
  const [schoolForm, setSchoolForm] = useState({
    schoolName: schoolName || '',
    schoolId: schoolId || '',
    address: address || '',
    phone: phone || '',
    email: schoolEmail || '',
    website: website || '',
    schoolYear: schoolYear || '2024-2025',
    currency: currency || 'EUR (€)',
  });

  useEffect(() => {
    setSchoolForm({
      schoolName: schoolName || '',
      schoolId: schoolId || '',
      address: address || '',
      phone: phone || '',
      email: schoolEmail || '',
      website: website || '',
      schoolYear: schoolYear || '2024-2025',
      currency: currency || 'EUR (€)',
    });
  }, [schoolName, schoolId, address, phone, schoolEmail, website, schoolYear, currency]);

  /* ── Toggles ──────────────────────────────────────────── */
  const [toggles, setToggles] = useState({
    emailPay: true, emailEnroll: true, emailAbsence: false,
    smsAlert: false, pushNotif: true,
    twoFA: false, sessionTimeout: true, auditLog: true,
    darkMode: false, compactView: false,
  });
  const toggle = (key) => setToggles(t => ({ ...t, [key]: !t[key] }));

  /* ── User management ─────────────────────────────────── */
  const [showUserModal, setShowUserModal]   = useState(false);
  const [editingUser, setEditingUser]       = useState(null);
  const [userForm, setUserForm]             = useState(EMPTY_USER_FORM);
  const [userFormError, setUserFormError]   = useState('');

  const openAddUser = () => {
    setUserForm(EMPTY_USER_FORM);
    setEditingUser(null);
    setUserFormError('');
    setShowUserModal(true);
  };

  const openEditUser = (u) => {
    setUserForm({ name: u.name, email: u.email, role: u.role, password: '', active: u.active });
    setEditingUser(u);
    setUserFormError('');
    setShowUserModal(true);
  };

  const handleUserSubmit = (e) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.email.trim()) {
      setUserFormError('Nom et email sont requis.');
      return;
    }
    if (!editingUser && !userForm.password) {
      setUserFormError('Un mot de passe est requis pour le nouvel utilisateur.');
      return;
    }
    if (editingUser) {
      const updates = { name: userForm.name.trim(), email: userForm.email.trim(), role: userForm.role, active: userForm.active };
      if (userForm.password) updates.password = userForm.password;
      updateUser(editingUser.id, updates);
    } else {
      addUser({ name: userForm.name.trim(), email: userForm.email.trim(), role: userForm.role, password: userForm.password, active: userForm.active });
    }
    setShowUserModal(false);
    setUserForm(EMPTY_USER_FORM);
    setEditingUser(null);
  };

  const handleDeleteUser = (id) => {
    if (id === 'admin-1') return alert('Impossible de supprimer le compte administrateur principal.');
    if (window.confirm('Supprimer cet utilisateur définitivement ?')) deleteUser(id);
  };

  /* ── Password change ─────────────────────────────────── */
  const [pwForm, setPwForm]     = useState({ current: '', newPw: '', confirm: '' });
  const [pwError, setPwError]   = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleChangePassword = () => {
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      setPwError('Veuillez remplir tous les champs.');
      return;
    }
    const user = users.find(u => u.id === currentUser?.id);
    if (!user || user.password !== pwForm.current) {
      setPwError('Mot de passe actuel incorrect.');
      return;
    }
    if (pwForm.newPw.length < 8) {
      setPwError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      setPwError('Les mots de passe ne correspondent pas.');
      return;
    }
    updateUser(currentUser.id, { password: pwForm.newPw });
    setPwForm({ current: '', newPw: '', confirm: '' });
    setPwError('');
    setPwSuccess(true);
    setTimeout(() => setPwSuccess(false), 3000);
  };

  /* ── Save school settings ────────────────────────────── */
  const handleSave = () => {
    updateSettings({ ...schoolForm });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCancel = () => {
    setSchoolForm({
      schoolName: schoolName || '',
      schoolId: schoolId || '',
      address: address || '',
      phone: phone || '',
      email: schoolEmail || '',
      website: website || '',
      schoolYear: schoolYear || '2024-2025',
      currency: currency || 'EUR (€)',
    });
  };

  /* ── Logo upload ─────────────────────────────────────── */
  const handleLogoFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setLogo(e.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <PageBanner
        label="Configuration"
        title="Paramètres"
        subtitle="Gérez les préférences et la configuration de votre établissement"
      />

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-52 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-2 space-y-0.5">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  tab === t.id ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}>
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">{TABS.find(t => t.id === tab)?.label}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Modifiez les paramètres de cette section</p>
              </div>
              {saved && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                  ✓ Modifications sauvegardées
                </span>
              )}
              {pwSuccess && tab === 'security' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                  ✓ Mot de passe mis à jour
                </span>
              )}
            </div>

            <div className="p-6">
              {/* ── École tab ─────────────────────────────────── */}
              {tab === 'school' && (
                <div className="space-y-5">
                  {/* Logo Upload */}
                  <div className="pb-5 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-800 mb-3">Logo de l'établissement</p>
                    <div className="flex items-start gap-5">
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden flex items-center justify-center bg-slate-50">
                          {logo ? (
                            <img src={logo} alt="Logo école" className="w-full h-full object-contain p-1" />
                          ) : (
                            <div className="w-full h-full bg-primary-600 flex items-center justify-center">
                              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        {logo && (
                          <button onClick={removeLogo}
                            className="mt-2 w-24 inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-700 transition-colors">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Supprimer
                          </button>
                        )}
                      </div>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleLogoFile(e.dataTransfer.files[0]); }}
                        className={`flex-1 border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                          dragOver ? 'border-primary-400 bg-primary-50' : 'border-slate-200 hover:border-primary-400 hover:bg-primary-50/50'
                        }`}>
                        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-slate-700">{dragOver ? 'Déposez ici' : 'Cliquez ou glissez votre logo'}</p>
                          <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, SVG · Max 2 Mo</p>
                        </div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                          className="mt-1 px-4 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors">
                          Parcourir
                        </button>
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                        onChange={e => handleLogoFile(e.target.files[0])} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Nom de l'établissement" value={schoolForm.schoolName}
                      onChange={e => setSchoolForm(f => ({ ...f, schoolName: e.target.value }))} />
                    <Input label="Numéro d'identification" placeholder="FR-75-001234" value={schoolForm.schoolId}
                      onChange={e => setSchoolForm(f => ({ ...f, schoolId: e.target.value }))} />
                    <Input label="Adresse" placeholder="12 rue de la Paix, Paris 75001" value={schoolForm.address}
                      onChange={e => setSchoolForm(f => ({ ...f, address: e.target.value }))} />
                    <Input label="Téléphone" type="tel" placeholder="01 23 45 67 89" value={schoolForm.phone}
                      onChange={e => setSchoolForm(f => ({ ...f, phone: e.target.value }))} />
                    <Input label="Email de contact" type="email" placeholder="contact@ecole.fr" value={schoolForm.email}
                      onChange={e => setSchoolForm(f => ({ ...f, email: e.target.value }))} />
                    <Input label="Site web" placeholder="www.ecole.fr" value={schoolForm.website}
                      onChange={e => setSchoolForm(f => ({ ...f, website: e.target.value }))} />
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Année scolaire</label>
                      <select value={schoolForm.schoolYear} onChange={e => setSchoolForm(f => ({ ...f, schoolYear: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                        <option>2023-2024</option>
                        <option>2024-2025</option>
                        <option>2025-2026</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Devise</label>
                      <select value={schoolForm.currency} onChange={e => setSchoolForm(f => ({ ...f, currency: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                        <option>EUR (€)</option>
                        <option>USD ($)</option>
                        <option>XOF (FCFA)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Users tab ─────────────────────────────────── */}
              {tab === 'users' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">{users.length} utilisateur{users.length !== 1 ? 's' : ''}</p>
                    <button onClick={openAddUser}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Inviter un utilisateur
                    </button>
                  </div>
                  {users.map((u, i) => (
                    <div key={u.id || i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                      <div className={`w-10 h-10 ${u.color || 'bg-primary-600'} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-sm font-bold">{(u.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                      <span className="text-xs font-semibold bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg">{u.role}</span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {u.active ? 'Actif' : 'Inactif'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditUser(u)} className="p-1.5 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors" title="Modifier">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        {u.id !== 'admin-1' && (
                          <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-colors" title="Supprimer">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Security tab ──────────────────────────────── */}
              {tab === 'security' && (
                <div className="space-y-1">
                  <Toggle label="Authentification à deux facteurs" description="Renforce la sécurité des connexions administrateur." checked={toggles.twoFA} onChange={() => toggle('twoFA')} />
                  <Toggle label="Expiration de session" description="Déconnexion automatique après 30 minutes d'inactivité." checked={toggles.sessionTimeout} onChange={() => toggle('sessionTimeout')} />
                  <Toggle label="Journal d'audit" description="Enregistrement de toutes les actions effectuées sur la plateforme." checked={toggles.auditLog} onChange={() => toggle('auditLog')} />
                  <div className="pt-5">
                    <p className="text-sm font-bold text-slate-800 mb-4">Changer le mot de passe</p>
                    {pwError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl mb-3">{pwError}</p>}
                    <div className="space-y-3">
                      <Input label="Mot de passe actuel" type="password" placeholder="••••••••"
                        value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} />
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Nouveau mot de passe" type="password" placeholder="••••••••"
                          value={pwForm.newPw} onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))} />
                        <Input label="Confirmer le mot de passe" type="password" placeholder="••••••••"
                          value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
                      </div>
                    </div>
                    <button onClick={handleChangePassword}
                      className="mt-4 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors">
                      Changer le mot de passe
                    </button>
                  </div>
                </div>
              )}

              {/* ── Notifications tab ─────────────────────────── */}
              {tab === 'notifs' && (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2">Email</p>
                  <Toggle label="Confirmation de paiement" description="Recevoir un email à chaque paiement validé." checked={toggles.emailPay} onChange={() => toggle('emailPay')} />
                  <Toggle label="Nouvelles inscriptions" description="Notification pour chaque nouvelle demande d'inscription." checked={toggles.emailEnroll} onChange={() => toggle('emailEnroll')} />
                  <Toggle label="Alertes d'absence" description="Email si un élève dépasse 3 jours d'absence." checked={toggles.emailAbsence} onChange={() => toggle('emailAbsence')} />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 pt-4">Autres canaux</p>
                  <Toggle label="Notifications SMS" description="Alertes urgentes par SMS (coût supplémentaire)." checked={toggles.smsAlert} onChange={() => toggle('smsAlert')} />
                  <Toggle label="Notifications push" description="Notifications dans le navigateur en temps réel." checked={toggles.pushNotif} onChange={() => toggle('pushNotif')} />
                </div>
              )}

              {/* ── Theme tab ─────────────────────────────────── */}
              {tab === 'theme' && (
                <div className="space-y-6">
                  <Toggle label="Mode sombre" description="Interface sombre pour réduire la fatigue visuelle." checked={toggles.darkMode} onChange={() => toggle('darkMode')} />
                  <Toggle label="Vue compacte" description="Réduire l'espacement pour afficher plus d'informations." checked={toggles.compactView} onChange={() => toggle('compactView')} />
                  <div>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Couleur principale</p>
                    <div className="flex gap-3">
                      {[
                        { name: 'Bleu (défaut)', color: 'bg-primary-600' },
                        { name: 'Violet', color: 'bg-violet-600' },
                        { name: 'Vert', color: 'bg-emerald-600' },
                        { name: 'Orange', color: 'bg-orange-500' },
                      ].map((c, i) => (
                        <button key={i} title={c.name} className={`w-10 h-10 rounded-xl ${c.color} ${i === 0 ? 'ring-2 ring-offset-2 ring-primary-600' : ''} hover:scale-110 transition-transform`} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={handleCancel}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Annuler
              </button>
              <button onClick={handleSave}
                className="inline-flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">{editingUser ? 'Modifier l\'utilisateur' : 'Inviter un utilisateur'}</h3>
              <button onClick={() => setShowUserModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
              {userFormError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">{userFormError}</p>}
              <Input label="Nom complet *" type="text" placeholder="ex: Marc Lefebvre" value={userForm.name}
                onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} />
              <Input label="Email *" type="email" placeholder="m.lefebvre@ecole.fr" value={userForm.email}
                onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} />
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Rôle</label>
                <select value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <Input label={editingUser ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}
                type="password" placeholder="••••••••" value={userForm.password}
                onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} />
              <div className="flex items-center gap-2.5">
                <input type="checkbox" id="activeCheck" checked={userForm.active}
                  onChange={e => setUserForm(f => ({ ...f, active: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                <label htmlFor="activeCheck" className="text-sm text-slate-600 cursor-pointer">Compte actif</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowUserModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">Annuler</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">
                  {editingUser ? 'Enregistrer' : 'Créer l\'utilisateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
