import React, { useState } from 'react';
import { 
  X, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  ShieldCheck, 
  Check, 
  Sparkles, 
  LogIn, 
  LogOut, 
  User as UserIcon, 
  Apple, 
  Smartphone, 
  Terminal, 
  ExternalLink 
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Currency } from '../types/finance';
import { CURRENCIES } from '../utils/formatters';
import { haptics } from '../utils/haptics';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    currency,
    setCurrency,
    isSoundEnabled,
    toggleSound,
    resetData,
    user,
    isAuthLoading,
    signInWithGoogle,
    signOutUser,
    setIsCurrencyPickerOpen,
    setIsCategoryManagerOpen,
    loadDemoData,
  } = useFinance();

  const [showIosGuide, setShowIosGuide] = useState(false);

  if (!isSettingsOpen) return null;

  const handleClose = () => {
    haptics.tap();
    setIsSettingsOpen(false);
  };

  const currencyOptions: Currency[] = ['EUR', 'USD', 'MXN', 'COP'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto">
      {/* Blurred Backdrop */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity animate-fadeIn"
      />

      {/* Central Modal */}
      <div className="relative w-full max-w-[390px] bg-white rounded-[32px] p-5 ios-float-shadow z-10 border border-stone-100 animate-scaleUp max-h-[88vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-800">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Ajustes de Potle Finanzas
              </h3>
              <span className="text-[10px] text-stone-400">
                iOS Personal Finance & Firebase Cloud
              </span>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Cerrar ajustes"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section: Firebase Authentication */}
        <div className="mb-4">
          <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1.5 px-1">
            Cuenta & Sincronización en la Nube
          </label>

          {isAuthLoading ? (
            <div className="p-3 bg-stone-50 rounded-2xl text-xs text-stone-400 text-center animate-pulse">
              Verificando sesión...
            </div>
          ) : user ? (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Avatar'}
                      className="w-9 h-9 rounded-full object-cover border border-emerald-300"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-xs">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-stone-900 leading-tight">
                      {user.displayName || 'Usuario Potle'}
                    </div>
                    <div className="text-[10px] text-stone-500 leading-tight truncate max-w-[170px]">
                      {user.email || 'Sesión activa'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={signOutUser}
                  className="px-2.5 py-1 rounded-xl bg-white text-rose-600 border border-rose-200 text-[11px] font-semibold flex items-center gap-1 shadow-xs hover:bg-rose-50 active:scale-95 transition-all cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Salir</span>
                </button>
              </div>

              <div className="pt-1 border-t border-emerald-200/50 flex items-center justify-between text-[10px] text-emerald-800">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Firestore protegido por UID</span>
                </span>
                <span className="font-mono text-[9px] text-stone-400">
                  {user.uid.slice(0, 8)}...
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-stone-50 border border-stone-200/60 rounded-2xl space-y-2">
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Inicia sesión para sincronizar tus transacciones con tu propio identificador único en Firebase Firestore.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={signInWithGoogle}
                  className="flex-1 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Continuar con Google</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Currency Selector */}
        <div className="mb-4">
          <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1.5 px-1">
            Moneda principal
          </label>
          <div className="grid grid-cols-2 gap-2">
            {currencyOptions.map((c) => {
              const isSelected = currency === c;
              return (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                      : 'bg-stone-50 border-stone-200/60 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span>{CURRENCIES[c].label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Haptics & Audio Toggle */}
        <div className="mb-4">
          <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1.5 px-1">
            Respuesta Táctil & Sonido
          </label>
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {isSoundEnabled ? (
                <Volume2 className="w-4 h-4 text-stone-800" />
              ) : (
                <VolumeX className="w-4 h-4 text-stone-400" />
              )}
              <div>
                <div className="text-xs font-semibold text-stone-900">
                  Sonidos hápticos iOS
                </div>
                <div className="text-[10px] text-stone-500">
                  Clicks mecánicos y campanilla de éxito
                </div>
              </div>
            </div>

            <button
              onClick={toggleSound}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                isSoundEnabled ? 'bg-emerald-500' : 'bg-stone-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  isSoundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Category Manager Trigger */}
        <div className="mb-4">
          <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1.5 px-1">
            Categorías & Iconos
          </label>
          <button
            onClick={() => {
              haptics.tap();
              setIsCategoryManagerOpen(true);
              handleClose();
            }}
            className="w-full p-3 bg-stone-50 hover:bg-stone-100 border border-stone-200/70 rounded-2xl flex items-center justify-between text-xs font-semibold text-stone-800 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🍿</span>
              <span>Añadir / Personalizar Categorías</span>
            </div>
            <span className="text-[10px] text-stone-400">Gestionar &gt;</span>
          </button>
        </div>

        {/* Exportar a iOS Nativo (Release con Capacitor) Guide Drawer */}
        <div className="mb-4">
          <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1.5 px-1">
            Compilación Nativa iOS
          </label>
          <button
            onClick={() => {
              haptics.tap();
              setShowIosGuide(!showIosGuide);
            }}
            className="w-full p-3 bg-stone-900 text-white rounded-2xl flex items-center justify-between text-xs font-semibold active:scale-98 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>Cómo compilar para iOS en modo Release</span>
            </div>
            <span className="text-[10px] text-stone-300">
              {showIosGuide ? 'Ocultar' : 'Ver pasos'}
            </span>
          </button>

          {showIosGuide && (
            <div className="mt-2.5 p-3.5 bg-stone-50 border border-stone-200/80 rounded-2xl text-[11px] text-stone-700 space-y-2.5 animate-fadeIn">
              <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-stone-700" />
                <span>Pasos rápidos con Capacitor & Xcode:</span>
              </div>
              <ol className="list-decimal pl-4 space-y-1.5 text-stone-600">
                <li>
                  <strong>Clona el repositorio</strong> desde tu GitHub en tu Mac.
                </li>
                <li>
                  Instala dependencias de Capacitor:
                  <div className="p-1.5 bg-stone-200/80 rounded-md font-mono text-[10px] text-stone-900 my-1 overflow-x-auto">
                    npm install @capacitor/core @capacitor/ios @capacitor/cli
                  </div>
                </li>
                <li>
                  Genera la compilación de producción web:
                  <div className="p-1.5 bg-stone-200/80 rounded-md font-mono text-[10px] text-stone-900 my-1 overflow-x-auto">
                    npm run build
                  </div>
                </li>
                <li>
                  Inicializa y sincroniza el proyecto nativo de Xcode:
                  <div className="p-1.5 bg-stone-200/80 rounded-md font-mono text-[10px] text-stone-900 my-1 overflow-x-auto">
                    npx cap add ios && npx cap sync ios
                  </div>
                </li>
                <li>
                  Abre el proyecto en Xcode:
                  <div className="p-1.5 bg-stone-200/80 rounded-md font-mono text-[10px] text-stone-900 my-1 overflow-x-auto">
                    npx cap open ios
                  </div>
                </li>
                <li>
                  <strong>Para compilar en Release:</strong> En Xcode, selecciona <em>Product &gt; Scheme &gt; Edit Scheme</em>, cambia <strong>Build Configuration a Release</strong>, configura tu cuenta de Apple Developer en <em>Signing &amp; Capabilities</em> y pulsa <em>Product &gt; Archive</em> para subir a TestFlight / App Store.
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Reset & Demo Data Buttons */}
        <div className="pt-2 border-t border-stone-100 space-y-2">
          <button
            onClick={() => {
              if (window.confirm('¿Vaciar todos los movimientos para empezar desde cero?')) {
                resetData();
                handleClose();
              }
            }}
            className="w-full py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Vaciar datos (Empezar en blanco)</span>
          </button>

          <button
            onClick={() => {
              loadDemoData();
              handleClose();
            }}
            className="w-full py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>Cargar movimientos demo de ejemplo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
