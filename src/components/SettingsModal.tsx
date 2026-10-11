import React, { useState } from 'react';
import { 
  X, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Smartphone, 
  Terminal, 
  CloudUpload,
  ExternalLink,
  AlertTriangle,
  FileSpreadsheet
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
    setActiveTab,
    setIsCategoryManagerOpen,
    lastBackupDate,
  } = useFinance();

  const [showIosGuide, setShowIosGuide] = useState(false);

  if (!isSettingsOpen) return null;

  const handleClose = () => {
    haptics.tap();
    setIsSettingsOpen(false);
  };

  const currencyOptions: Currency[] = ['COP', 'USD', 'EUR', 'MXN'];

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
                Ajustes de Potle
              </h3>
              <p className="text-[10px] text-stone-400">
                Preferencias y respaldo local seguro
              </p>
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

        {/* Section: Google Drive & Excel Sync */}
        <div className="mb-4">
          <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1.5 px-1">
            Respaldo & Sincronización en la Nube
          </label>

          <div className="p-3.5 bg-stone-50 border border-stone-200/70 rounded-2xl space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CloudUpload className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-stone-900">
                  Google Drive & Excel (.xlsx)
                </div>
                <div className="text-[10px] text-stone-500 leading-tight mt-0.5">
                  Sin cuentas ni contraseñas. Importa y exporta directamente mediante enlaces o archivos.
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-amber-50/90 rounded-xl border border-amber-200/60 flex items-start gap-2 text-[10px] text-amber-900">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Aviso:</strong> Guarda tu archivo en Google Drive cada <strong>15 días</strong> para no perder información si cambias de teléfono o restableces tu iPhone.
              </span>
            </div>

            <button
              onClick={() => {
                haptics.tap();
                handleClose();
                setActiveTab('sync');
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-[#1F242D] hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ir a Sincronización y Respaldo</span>
            </button>
          </div>
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

        {/* iOS PWA & App Store release instructions */}
        <div className="mb-4">
          <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1.5 px-1">
            Instalación en iPhone (Sin modo prueba)
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
              <span>Instalar como App nativa en iPhone</span>
            </div>
            <span className="text-[10px] text-stone-300">
              {showIosGuide ? 'Ocultar' : 'Ver pasos'}
            </span>
          </button>

          {showIosGuide && (
            <div className="mt-2.5 p-3.5 bg-stone-50 border border-stone-200/80 rounded-2xl text-[11px] text-stone-700 space-y-2.5 animate-fadeIn">
              <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-stone-700" />
                <span>En tu iPhone:</span>
              </div>
              <ol className="list-decimal pl-4 space-y-1.5 text-stone-600">
                <li>
                  Abre la app en <strong>Safari</strong> en tu iPhone.
                </li>
                <li>
                  Toca el botón <strong>Compartir</strong> (el cuadrado con la flecha hacia arriba en la barra inferior).
                </li>
                <li>
                  Selecciona <strong>"Agregar al inicio"</strong> (Add to Home Screen).
                </li>
                <li>
                  ¡Listo! La app se abrirá en <strong>pantalla completa</strong> con icono de aplicación nativa, sin barras de Safari.
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Reset Data Button */}
        <div className="pt-2 border-t border-stone-100">
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
            <span>Vaciar todos los datos (Empezar en blanco)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
