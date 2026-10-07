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
    signOutUser,
    setIsAuthModalOpen,
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
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {user.provider === 'apple' ? (
                    <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center shadow-xs">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12.01-14.43-6.53-9.87-11.75-21.28-15.66-34.23-3.92-12.94-5.88-25.07-5.88-36.38 0-16.14 4.12-29.41 12.36-39.81 8.24-10.4 18.23-15.71 29.98-15.93 5.43 0 11.09 1.41 16.99 4.23 5.9 2.82 10.01 4.34 12.33 4.56 2.21 0 6.64-1.57 13.29-4.71 6.65-3.14 12.6-4.52 17.86-4.13 13.52.87 24.32 5.92 32.4 15.15-11.78 7.17-17.56 16.94-17.34 29.32.22 9.68 3.91 17.81 11.07 24.41 7.16 6.6 15.54 10.32 25.14 11.16-2.5 7.82-5.76 15.5-9.78 23.03zm-32.99-106.9c0-8.04 2.87-15.65 8.62-22.82 5.75-7.17 12.79-11.83 21.12-13.98.54 1.74.82 3.59.82 5.54 0 7.93-2.93 15.65-8.79 23.16-5.86 7.51-12.98 12.18-21.36 14.02-.22-1.96-.41-3.94-.41-5.92z" />
                      </svg>
                    </div>
                  ) : user.provider === 'google' ? (
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-stone-200 shadow-xs">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z" />
                        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                      </svg>
                    </div>
                  ) : user.photoURL ? (
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
                    <div className="text-xs font-bold text-stone-900 leading-tight flex items-center gap-1.5">
                      <span>{user.displayName || 'Usuario Potle'}</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-medium">
                        {user.provider === 'apple' ? 'iCloud' : user.provider === 'google' ? 'Gmail' : 'Cuenta'}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-500 leading-tight truncate max-w-[170px] mt-0.5">
                      {user.email || 'Sesión activa'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      haptics.tap();
                      setIsSettingsOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="px-2 py-1 rounded-xl bg-white text-stone-700 border border-stone-200 text-[10px] font-medium shadow-2xs hover:bg-stone-50 active:scale-95 transition-all cursor-pointer"
                  >
                    Cambiar
                  </button>
                  <button
                    onClick={signOutUser}
                    className="px-2 py-1 rounded-xl bg-white text-rose-600 border border-rose-200 text-[10px] font-medium shadow-2xs hover:bg-rose-50 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Salir</span>
                  </button>
                </div>
              </div>

              <div className="pt-1.5 border-t border-emerald-200/50 flex items-center justify-between text-[10px] text-emerald-800">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sincronización segura activa</span>
                </span>
                <span className="font-mono text-[9px] text-stone-400">
                  {user.uid.slice(0, 8)}...
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-stone-50 border border-stone-200/60 rounded-2xl space-y-2.5">
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Inicia sesión con tu cuenta de iCloud o Gmail para sincronizar tus transacciones de forma segura.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    haptics.tap();
                    setIsSettingsOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="py-2 px-2.5 rounded-xl bg-black hover:bg-neutral-900 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12.01-14.43-6.53-9.87-11.75-21.28-15.66-34.23-3.92-12.94-5.88-25.07-5.88-36.38 0-16.14 4.12-29.41 12.36-39.81 8.24-10.4 18.23-15.71 29.98-15.93 5.43 0 11.09 1.41 16.99 4.23 5.9 2.82 10.01 4.34 12.33 4.56 2.21 0 6.64-1.57 13.29-4.71 6.65-3.14 12.6-4.52 17.86-4.13 13.52.87 24.32 5.92 32.4 15.15-11.78 7.17-17.56 16.94-17.34 29.32.22 9.68 3.91 17.81 11.07 24.41 7.16 6.6 15.54 10.32 25.14 11.16-2.5 7.82-5.76 15.5-9.78 23.03zm-32.99-106.9c0-8.04 2.87-15.65 8.62-22.82 5.75-7.17 12.79-11.83 21.12-13.98.54 1.74.82 3.59.82 5.54 0 7.93-2.93 15.65-8.79 23.16-5.86 7.51-12.98 12.18-21.36 14.02-.22-1.96-.41-3.94-.41-5.92z" />
                  </svg>
                  <span>iCloud</span>
                </button>

                <button
                  onClick={() => {
                    haptics.tap();
                    setIsSettingsOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="py-2 px-2.5 rounded-xl bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                  <span>Gmail</span>
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
