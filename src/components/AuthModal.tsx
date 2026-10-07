import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, AlertCircle, ArrowRight, Check, Sparkles } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { haptics } from '../utils/haptics';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    authError,
    setAuthError,
  } = useFinance();

  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    haptics.tap();
    setIsAuthModalOpen(false);
    setAuthError(null);
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  const handleGoogleSubmit = async () => {
    haptics.tap();
    setIsSubmitting(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch {
      // Error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppleSubmit = async () => {
    haptics.tap();
    setIsSubmitting(true);
    setAuthError(null);
    try {
      await signInWithApple();
    } catch {
      // Error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsSubmitting(true);
    setAuthError(null);

    try {
      if (authTab === 'signup') {
        await signUpWithEmail(email.trim(), password, displayName.trim());
      } else {
        await signInWithEmail(email.trim(), password);
      }
      handleClose();
    } catch {
      // Error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto">
      {/* Blurred Backdrop */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-fadeIn"
      />

      {/* Central Modal */}
      <div className="relative w-full max-w-[390px] bg-white rounded-[32px] p-6 ios-float-shadow z-10 border border-stone-100 animate-scaleUp text-stone-900">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-2xl bg-stone-900 text-white flex items-center justify-center text-sm font-serif font-bold shadow-xs">
              P
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900 leading-tight">
                Guardar en la Nube
              </h3>
              <span className="text-[10px] text-stone-400">
                Potle Finanzas · Sincronización Segura
              </span>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auth Error Banner if present */}
        {authError && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-[11px] text-amber-900 animate-fadeIn leading-relaxed">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block mb-0.5">Aviso de cuenta:</span>
                <span>{authError}</span>
              </div>
            </div>
            {authError.includes('Apple') && (
              <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-center justify-between">
                <span className="text-[10px] text-amber-800">¿Usas correo de iCloud?</span>
                <button
                  type="button"
                  onClick={() => {
                    haptics.tap();
                    setAuthTab('signup');
                    setAuthError(null);
                  }}
                  className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-semibold cursor-pointer"
                >
                  Registrarme con mi correo
                </button>
              </div>
            )}
          </div>
        )}

        {/* 1. Google One-Tap Sign In */}
        <div className="space-y-2 mb-4">
          <button
            type="button"
            onClick={handleGoogleSubmit}
            disabled={isSubmitting}
            className="w-full h-12 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2.5 shadow-2xs active:scale-98 transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{isSubmitting ? 'Conectando...' : 'Continuar con Google (Gmail)'}</span>
          </button>

          {/* Apple ID Button */}
          <button
            type="button"
            onClick={handleAppleSubmit}
            disabled={isSubmitting}
            className="w-full h-11 bg-black hover:bg-neutral-900 text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-2.5 shadow-2xs active:scale-98 transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12.01-14.43-6.53-9.87-11.75-21.28-15.66-34.23-3.92-12.94-5.88-25.07-5.88-36.38 0-16.14 4.12-29.41 12.36-39.81 8.24-10.4 18.23-15.71 29.98-15.93 5.43 0 11.09 1.41 16.99 4.23 5.9 2.82 10.01 4.34 12.33 4.56 2.21 0 6.64-1.57 13.29-4.71 6.65-3.14 12.6-4.52 17.86-4.13 13.52.87 24.32 5.92 32.4 15.15-11.78 7.17-17.56 16.94-17.34 29.32.22 9.68 3.91 17.81 11.07 24.41 7.16 6.6 15.54 10.32 25.14 11.16-2.5 7.82-5.76 15.5-9.78 23.03zm-32.99-106.9c0-8.04 2.87-15.65 8.62-22.82 5.75-7.17 12.79-11.83 21.12-13.98.54 1.74.82 3.59.82 5.54 0 7.93-2.93 15.65-8.79 23.16-5.86 7.51-12.98 12.18-21.36 14.02-.22-1.96-.41-3.94-.41-5.92z" />
            </svg>
            <span>Continuar con Apple ID</span>
          </button>
        </div>

        {/* Separator */}
        <div className="relative flex items-center justify-center my-3">
          <div className="border-t border-stone-200 w-full" />
          <span className="bg-white px-2 text-[10px] text-stone-400 uppercase tracking-wider shrink-0">
            o con tu correo
          </span>
        </div>

        {/* 2. Email & Password Form (Works with any email: @icloud.com, @gmail.com, etc.) */}
        <div className="mb-2">
          {/* Subtabs: Iniciar Sesión / Registrarse */}
          <div className="grid grid-cols-2 bg-stone-100 p-1 rounded-xl mb-3">
            <button
              type="button"
              onClick={() => {
                haptics.tap();
                setAuthTab('login');
                setAuthError(null);
              }}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                authTab === 'login'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                haptics.tap();
                setAuthTab('signup');
                setAuthError(null);
              }}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                authTab === 'signup'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleEmailFormSubmit} className="space-y-2.5">
            {authTab === 'signup' && (
              <div>
                <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                  Tu Nombre
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-200/90 rounded-xl text-xs">
                  <UserIcon className="w-3.5 h-3.5 text-stone-400" />
                  <input
                    type="text"
                    required
                    placeholder="Tu nombre completo o alias"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-transparent outline-none text-stone-900"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                Correo Electrónico
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-200/90 rounded-xl text-xs">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                <input
                  type="email"
                  required
                  placeholder="ejemplo@icloud.com o gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent outline-none text-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                Contraseña
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-200/90 rounded-xl text-xs">
                <Lock className="w-3.5 h-3.5 text-stone-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none text-stone-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer mt-1 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Guardando en la nube...</span>
              ) : (
                <>
                  <span>
                    {authTab === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta en la Nube'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-[10px] text-stone-400 text-center mt-3 leading-tight">
          Tus transacciones se guardan cifradas y asociadas únicamente a tu identificador en Firebase Firestore.
        </p>
      </div>
    </div>
  );
};
