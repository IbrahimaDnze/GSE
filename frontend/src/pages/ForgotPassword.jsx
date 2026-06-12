import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setGeneratedCode(res.data.code);
      setStep(2);
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (motDePasse !== confirm) {
      showToast('Les mots de passe ne correspondent pas', 'error');
      return;
    }
    if (motDePasse.length < 6) {
      showToast('Le mot de passe doit contenir au moins 6 caracteres', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, code, motDePasse });
      showToast('Mot de passe reinitialise ! Connectez-vous.');
      navigate('/login');
    } catch (err) {
      showToast(err.response?.data?.message || 'Code invalide ou expire', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/18145430/pexels-photo-18145430.jpeg?auto=compress&cs=tinysrgb&w=1280)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}>
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900/70 to-emerald-900/60" />
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-40 -right-16 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 left-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-gold-500 to-gold-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg border border-gold-400/30">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">École Privée</h1>
          <p className="text-emerald-200 mt-2 text-base font-medium">Plateforme de Gestion Scolaire</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-gold-600 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-slate-900 font-bold text-base leading-tight">École Privée</h1>
              <p className="text-slate-500 text-xs">Gestion Scolaire</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8">
            {step === 1 ? (
              <>
                <div className="mb-7">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Mot de passe oublié</h2>
                  <p className="text-slate-500 text-sm mt-1">Entrez votre email pour recevoir un code de réinitialisation</p>
                </div>
                <form onSubmit={handleSendCode} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <input type="email" required placeholder="admin@ecole.fr"
                        value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {loading ? (
                      <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Envoi en cours…</>
                    ) : 'Envoyer le code'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="mb-7">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Nouveau mot de passe</h2>
                  <p className="text-slate-500 text-sm mt-1">Utilisez le code ci-dessous pour réinitialiser votre mot de passe</p>
                </div>
                {generatedCode && (
                  <div className="reset-code-box">
                    <div className="reset-code-label">Code de réinitialisation</div>
                    <div className="reset-code-value">{generatedCode}</div>
                  </div>
                )}
                <form onSubmit={handleReset} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirmez le code</label>
                    <input type="text" required placeholder="Entrez le code" maxLength={6}
                      value={code} onChange={e => setCode(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nouveau mot de passe</label>
                    <input type="password" required placeholder="Min. 6 caractères"
                      value={motDePasse} onChange={e => setMotDePasse(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirmer</label>
                    <input type="password" required placeholder="Confirmer le mot de passe"
                      value={confirm} onChange={e => setConfirm(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {loading ? (
                      <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Réinitialisation…</>
                    ) : 'Réinitialiser'}
                  </button>
                </form>
              </>
            )}
            <p className="text-center text-sm text-slate-500 mt-6">
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                <i className="fa-solid fa-arrow-left"></i> Retour à la connexion
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

export default ForgotPassword;