import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';

const ROLES = ['Administrateur', 'Directeur', 'Secrétaire', 'Enseignant', 'Comptable'];

const InputField = ({ label, icon, error, ...props }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
      <input
        className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
          error ? 'border-red-400 bg-red-50' : 'border-slate-200'
        }`}
        {...props}
      />
    </div>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

const Register = () => {
  const navigate = useNavigate();
  const { addUser, login } = useAppData();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    role: '', schoolName: '', schoolId: '',
    password: '', confirmPassword: '',
    agree: false,
  });
  const [errors, setErrors] = useState({});

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Prénom requis';
    if (!form.lastName.trim())  e.lastName  = 'Nom requis';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Email invalide';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.role)              e.role       = 'Rôle requis';
    if (!form.schoolName.trim()) e.schoolName = 'Nom de l\'établissement requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e = {};
    if (form.password.length < 8) e.password = 'Au moins 8 caractères';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Les mots de passe ne correspondent pas';
    if (!form.agree) e.agree = 'Vous devez accepter les conditions';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) setStep(2);
    if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateStep3()) return;
    setLoading(true);
    setTimeout(() => {
      // Create user in context (localStorage)
      addUser({
        name: `${form.firstName.trim()} ${form.lastName.trim()}`,
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        phone: form.phone,
      });
      // Auto-login
      setTimeout(() => {
        login(form.email.trim(), form.password);
        setLoading(false);
        navigate('/dashboard', { replace: true });
      }, 200);
    }, 1000);
  };

  const steps = [
    { n: 1, label: 'Identité' },
    { n: 2, label: 'Établissement' },
    { n: 3, label: 'Sécurité' },
  ];

  const passwordStrength = (p) => {
    if (!p) return { score: 0, label: '', color: '' };
    let score = 0;
    if (p.length >= 8)  score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const map = [
      { label: '', color: '' },
      { label: 'Faible',    color: 'bg-red-500'     },
      { label: 'Moyen',     color: 'bg-amber-500'   },
      { label: 'Fort',      color: 'bg-emerald-500' },
      { label: 'Très fort', color: 'bg-emerald-600' },
    ];
    return { score, ...map[score] };
  };

  const pwStrength = passwordStrength(form.password);

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/18145430/pexels-photo-18145430.jpeg?auto=compress&cs=tinysrgb&w=1280)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900/60 to-primary-700/50" />
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-40 -right-16 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 left-20 w-64 h-64 rounded-full bg-white/5" />

        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg border border-white/20">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">École Privée</h1>
          <p className="text-primary-200 mt-2 text-base font-medium">Créez votre espace scolaire</p>
          <div className="mt-12 space-y-5 text-left max-w-xs mx-auto">
            {[
              { n: 1, title: 'Informations personnelles', desc: 'Vos coordonnées de contact' },
              { n: 2, title: 'Votre établissement',       desc: 'Rôle et école concernée' },
              { n: 3, title: 'Sécurité du compte',        desc: 'Mot de passe et confirmation' },
            ].map((s) => (
              <div key={s.n} className={`flex items-center gap-4 transition-all duration-300 ${step >= s.n ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${step > s.n ? 'bg-emerald-500 text-white' : step === s.n ? 'bg-white text-primary-700' : 'bg-white/20 text-white'}`}>
                  {step > s.n ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s.n}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{s.title}</p>
                  <p className="text-primary-200/70 text-xs">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-slate-900 font-bold text-base leading-tight">École Privée</h1>
              <p className="text-slate-500 text-xs">Gestion Scolaire</p>
            </div>
          </div>

          {/* Step progress */}
          <div className="flex items-center justify-between mb-6">
            {steps.map((s, i) => (
              <div key={s.n} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step > s.n ? 'bg-emerald-500 text-white' : step === s.n ? 'bg-primary-600 text-white shadow-sm' : 'bg-slate-200 text-slate-400'}`}>
                    {step > s.n ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : s.n}
                  </div>
                  <span className={`text-[10px] font-semibold mt-1 ${step === s.n ? 'text-primary-600' : step > s.n ? 'text-emerald-600' : 'text-slate-400'}`}>{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all ${step > s.n ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {step === 1 ? 'Créer un compte' : step === 2 ? 'Votre établissement' : 'Sécurisez votre compte'}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                {step === 1 ? 'Renseignez vos informations personnelles' : step === 2 ? 'Précisez votre rôle et votre école' : 'Choisissez un mot de passe sécurisé'}
              </p>
            </div>

            <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
              {/* ── Step 1 ── */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Prénom" placeholder="Jean" value={form.firstName}
                      onChange={e => set('firstName', e.target.value)} error={errors.firstName}
                      icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                    />
                    <InputField label="Nom" placeholder="Dupont" value={form.lastName}
                      onChange={e => set('lastName', e.target.value)} error={errors.lastName} />
                  </div>
                  <InputField label="Adresse email" type="email" placeholder="jean.dupont@ecole.fr"
                    value={form.email} onChange={e => set('email', e.target.value)} error={errors.email}
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                  />
                  <InputField label="Téléphone (optionnel)" type="tel" placeholder="06 00 00 00 00"
                    value={form.phone} onChange={e => set('phone', e.target.value)}
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                  />
                </div>
              )}

              {/* ── Step 2 ── */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Rôle *</label>
                    <select value={form.role} onChange={e => set('role', e.target.value)}
                      className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${errors.role ? 'border-red-400' : 'border-slate-200'}`}>
                      <option value="">Sélectionner un rôle</option>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
                  </div>
                  <InputField label="Nom de l'établissement *" placeholder="École Privée Excellence"
                    value={form.schoolName} onChange={e => set('schoolName', e.target.value)}
                    error={errors.schoolName}
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                  />
                  <InputField label="Numéro d'identification (optionnel)" placeholder="FR-75-001234"
                    value={form.schoolId} onChange={e => set('schoolId', e.target.value)}
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>}
                  />
                  <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
                    <p className="text-xs font-semibold text-primary-700 mb-1">💡 Bon à savoir</p>
                    <p className="text-xs text-primary-600/80">Vous pourrez modifier ces informations à tout moment depuis les paramètres.</p>
                  </div>
                </div>
              )}

              {/* ── Step 3 ── */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mot de passe *</label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <input type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                        value={form.password} onChange={e => set('password', e.target.value)}
                        className={`w-full pl-9 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${errors.password ? 'border-red-400' : 'border-slate-200'}`} />
                      <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {showPassword
                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>}
                        </svg>
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                    {form.password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1,2,3,4].map(i => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= pwStrength.score ? pwStrength.color : 'bg-slate-200'}`} />
                          ))}
                        </div>
                        <p className={`text-[11px] font-medium ${pwStrength.score <= 1 ? 'text-red-500' : pwStrength.score <= 2 ? 'text-amber-500' : 'text-emerald-600'}`}>
                          Sécurité : {pwStrength.label}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirmer le mot de passe *</label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <input type={showConfirm ? 'text' : 'password'} placeholder="••••••••"
                        value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                        className={`w-full pl-9 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${errors.confirmPassword ? 'border-red-400' : 'border-slate-200'}`} />
                      <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
                  </div>

                  <div>
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={form.agree} onChange={e => set('agree', e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 flex-shrink-0" />
                      <span className="text-xs text-slate-600">
                        J'accepte les{' '}
                        <a href="#" className="text-primary-600 font-semibold hover:underline">conditions d'utilisation</a>{' '}
                        et la{' '}
                        <a href="#" className="text-primary-600 font-semibold hover:underline">politique de confidentialité</a>
                      </span>
                    </label>
                    {errors.agree && <p className="mt-1 text-xs text-red-600">{errors.agree}</p>}
                  </div>
                </div>
              )}

              <div className={`flex gap-3 mt-7 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
                {step > 1 && (
                  <button type="button" onClick={() => setStep(s => s - 1)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Retour
                  </button>
                )}
                <button type="submit" disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Création…
                    </div>
                  ) : step < 3 ? (
                    <div className="flex items-center gap-2">
                      Suivant
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  ) : 'Créer mon compte'}
                </button>
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Déjà un compte ?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                Se connecter
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-slate-400 mt-5">
            © {new Date().getFullYear()} École Privée — Plateforme de gestion scolaire
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
