import React, { useState } from 'react';
import { 
  Cloud, 
  CloudRain, 
  RefreshCw, 
  CheckCircle2, 
  Smartphone, 
  Tablet, 
  Laptop, 
  Mic, 
  Sparkles, 
  ArrowRight,
  Download,
  Upload,
  Radio,
  Check
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, getWidgetPresets } from '../utils/formatters';
import { haptics } from '../utils/haptics';

export const WidgetsICloudView: React.FC = () => {
  const {
    statsSummary,
    currency,
    recordWidgetExpense,
    iCloudSyncStatus,
    iCloudDevices,
    triggerICloudSync,
    addTransaction,
    categories,
    transactions,
    user,
    setIsAuthModalOpen,
  } = useFinance();

  const [widgetFeedback, setWidgetFeedback] = useState<string | null>(null);
  const [voiceInputText, setVoiceInputText] = useState<string>('');
  const [isSimulatingDeviceSync, setIsSimulatingDeviceSync] = useState(false);

  const handleInstantQuickTap = (amount: number, categoryId: string, label: string) => {
    haptics.success();
    recordWidgetExpense(amount, categoryId, label);
    setWidgetFeedback(`¡Gasto registrado! -${formatCurrency(amount, currency)} en ${label}`);
    setTimeout(() => setWidgetFeedback(null), 3000);
  };

  // Natural language parser simulator (e.g., "18 café con amigos" or "40 supermercado")
  const handleVoiceSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!voiceInputText.trim()) return;

    haptics.tap();
    const text = voiceInputText.trim();
    // Try to extract numbers
    const match = text.match(/(\d+([.,]\d+)?)/);
    const amount = match ? parseFloat(match[1].replace(',', '.')) : 15;

    // Detect category from words
    const lower = text.toLowerCase();
    let targetCatId = 'salidas';
    if (lower.includes('super') || lower.includes('mercado') || lower.includes('compra')) {
      targetCatId = 'supermercado';
    } else if (lower.includes('gasolina') || lower.includes('coche') || lower.includes('auto')) {
      targetCatId = 'gasolina';
    } else if (lower.includes('gym') || lower.includes('gimnasio') || lower.includes('entreno')) {
      targetCatId = 'gimnasio';
    } else if (lower.includes('perro') || lower.includes('gato') || lower.includes('mascota')) {
      targetCatId = 'mascotas';
    } else if (lower.includes('luz') || lower.includes('agua') || lower.includes('internet') || lower.includes('servicio')) {
      targetCatId = 'servicios';
    }

    recordWidgetExpense(amount, targetCatId, text);
    setVoiceInputText('');
    setWidgetFeedback(`Entrada procesada: -${formatCurrency(amount, currency)} (${text})`);
    haptics.success();
    setTimeout(() => setWidgetFeedback(null), 3000);
  };

  // Simulate cross-device incoming sync from iPad/Mac
  const handleSimulateCrossDevice = async () => {
    setIsSimulatingDeviceSync(true);
    haptics.tap();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Add a simulated transaction from iPad
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    addTransaction({
      type: 'expense',
      amount: 14.50,
      categoryId: 'salidas',
      note: 'Café tostado (registrado desde iPad Pro)',
      date: '2026-10-06',
      time: timeStr,
    });

    setIsSimulatingDeviceSync(false);
    haptics.success();
    setWidgetFeedback('¡Sincronizado nuevo movimiento desde iPad Pro M4!');
    setTimeout(() => setWidgetFeedback(null), 3500);
  };

  // Export JSON backup
  const handleExportBackup = () => {
    haptics.tap();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `potle_finanzas_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-3 pb-24">
      {/* Header */}
      <header className="mb-4 px-1">
        <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider block">
          iOS Ecosistema
        </span>
        <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
          Widgets & iCloud Sync
        </h1>
      </header>

      {/* Floating feedback toast if widget was tapped */}
      {widgetFeedback && (
        <div className="mb-4 p-3 bg-stone-900 text-white rounded-2xl text-xs flex items-center gap-2 animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1 font-medium">{widgetFeedback}</span>
        </div>
      )}

      {/* Section 1: Interactive iOS Widgets */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h2 className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Widgets de Pantalla de Inicio (Interactivos)</span>
          </h2>
          <span className="text-[10px] text-stone-400 font-medium">Toca para probar</span>
        </div>

        {/* Medium Widget: 1-Tap Quick Expense */}
        <div className="bg-white rounded-[28px] p-4.5 ios-card-shadow border border-stone-100 mb-3 relative overflow-hidden">
          {/* iOS Widget Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-stone-900 text-white flex items-center justify-center text-[10px] font-serif font-bold">
                P
              </div>
              <span className="text-xs font-bold text-stone-900">
                Gasto Rápido · Potle
              </span>
            </div>
            <span className="text-[10px] text-stone-400 font-medium">Widget Mediano</span>
          </div>

          {/* 4 Quick Instant 1-Tap Buttons (Dynamic amounts per currency) */}
          {(() => {
            const wAmounts = getWidgetPresets(currency);
            return (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => handleInstantQuickTap(wAmounts.coffee, 'salidas', 'Café & Snack')}
                  className="p-2.5 rounded-2xl bg-[#FCE7ED] border border-[#F9CCD8] flex items-center gap-2 text-left active:scale-95 transition-all cursor-pointer group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">☕️</span>
                  <div>
                    <span className="text-xs font-bold text-[#962F4C] block">Café</span>
                    <span className="text-[10px] text-[#962F4C]/80 font-medium tabular-nums">{formatCurrency(wAmounts.coffee, currency)}</span>
                  </div>
                </button>

                <button
                  onClick={() => handleInstantQuickTap(wAmounts.groceries, 'supermercado', 'Compra Súper')}
                  className="p-2.5 rounded-2xl bg-[#E4F5E8] border border-[#C6ECCF] flex items-center gap-2 text-left active:scale-95 transition-all cursor-pointer group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">🛒</span>
                  <div>
                    <span className="text-xs font-bold text-[#1E6B39] block">Súper</span>
                    <span className="text-[10px] text-[#1E6B39]/80 font-medium tabular-nums">{formatCurrency(wAmounts.groceries, currency)}</span>
                  </div>
                </button>

                <button
                  onClick={() => handleInstantQuickTap(wAmounts.gas, 'gasolina', 'Gasolina')}
                  className="p-2.5 rounded-2xl bg-[#FEF8DE] border border-[#FBEFB2] flex items-center gap-2 text-left active:scale-95 transition-all cursor-pointer group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">⛽️</span>
                  <div>
                    <span className="text-xs font-bold text-[#826915] block">Gasolina</span>
                    <span className="text-[10px] text-[#826915]/80 font-medium tabular-nums">{formatCurrency(wAmounts.gas, currency)}</span>
                  </div>
                </button>

                <button
                  onClick={() => handleInstantQuickTap(wAmounts.pets, 'mascotas', 'Mascotas')}
                  className="p-2.5 rounded-2xl bg-[#E8F6EF] border border-[#CCEEDB] flex items-center gap-2 text-left active:scale-95 transition-all cursor-pointer group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">🐾</span>
                  <div>
                    <span className="text-xs font-bold text-[#297246] block">Mascotas</span>
                    <span className="text-[10px] text-[#297246]/80 font-medium tabular-nums">{formatCurrency(wAmounts.pets, currency)}</span>
                  </div>
                </button>
              </div>
            );
          })()}

          {/* Voice / Quick Text Natural Dictation Bar */}
          <form onSubmit={handleVoiceSubmit} className="flex items-center gap-1.5 p-1.5 bg-stone-50 rounded-2xl border border-stone-200/60">
            <div className="w-7 h-7 rounded-xl bg-stone-200 flex items-center justify-center text-stone-600 shrink-0">
              <Mic className="w-3.5 h-3.5 text-stone-700" />
            </div>
            <input
              type="text"
              placeholder="Dicta o escribe: '12 café y croissant'..."
              value={voiceInputText}
              onChange={(e) => setVoiceInputText(e.target.value)}
              className="flex-1 bg-transparent text-xs text-stone-800 placeholder:text-stone-400 outline-none px-1"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#1F242D] text-white rounded-xl text-[11px] font-semibold hover:bg-stone-800 active:scale-95 transition-all cursor-pointer"
            >
              OK
            </button>
          </form>
        </div>

        {/* Small Widgets Pair (Side by Side) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Small Widget: Balance Actual */}
          <div className="bg-white rounded-[26px] p-3.5 ios-card-shadow border border-stone-100 flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                Balance
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>

            <div>
              <span className="font-serif text-2xl font-bold text-stone-900 block tabular-nums">
                {formatCurrency(statsSummary.netBalance, currency, 0)}
              </span>
              <span className="text-[10px] text-stone-500 font-medium mt-0.5 block">
                Patrimonio neto
              </span>
            </div>

            <div className="text-[10px] text-emerald-700 font-medium bg-[#E8F8ED] px-2 py-0.5 rounded-full inline-block w-fit">
              +8.4% este mes
            </div>
          </div>

          {/* Small Widget: Presupuesto Diario */}
          <div className="bg-white rounded-[26px] p-3.5 ios-card-shadow border border-stone-100 flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                Hoy disponible
              </span>
              <span className="text-[10px] font-bold text-stone-400">Oct 06</span>
            </div>

            <div>
              <span className="font-serif text-2xl font-bold text-[#1E6838] block tabular-nums">
                {formatCurrency(45.00, currency, 0)}
              </span>
              <span className="text-[10px] text-stone-500 font-medium mt-0.5 block">
                Límite diario seguro
              </span>
            </div>

            <div className="text-[10px] text-stone-500 font-medium">
              Gasto medio: {formatCurrency(statsSummary.dailyAverageExpense, currency, 0)}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Real-time iCloud Integration */}
      <section className="bg-white rounded-[28px] p-5 ios-card-shadow border border-stone-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-stone-900">
                Sincronización iCloud (CloudKit)
              </h2>
              <span className="text-[10px] text-stone-500">
                Tiempo real en todos tus dispositivos
              </span>
            </div>
          </div>

          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Activo</span>
          </span>
        </div>

        {/* Sync Trigger Action & Account Status */}
        <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/50 mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
              <span>{user ? (user.provider === 'apple' ? 'iCloud Vinculado' : user.provider === 'google' ? 'Google / Gmail Vinculado' : 'Cuenta Activa') : 'Sin cuenta vinculada'}</span>
              {user && (
                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-medium">
                  {user.email || 'Conectado'}
                </span>
              )}
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              {user 
                ? (iCloudSyncStatus === 'syncing' ? 'Transmitiendo datos cifrados...' : 'Todos los movimientos sincronizados.')
                : 'Conecta tu cuenta para sincronizar con CloudKit y Google.'}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!user ? (
              <button
                onClick={() => {
                  haptics.tap();
                  setIsAuthModalOpen(true);
                }}
                className="px-2.5 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-semibold active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                Conectar
              </button>
            ) : (
              <button
                onClick={triggerICloudSync}
                disabled={iCloudSyncStatus === 'syncing'}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F242D] text-white rounded-xl text-xs font-semibold hover:bg-stone-800 active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${iCloudSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                <span>Sincronizar</span>
              </button>
            )}
          </div>
        </div>

        {/* Device Roster */}
        <div className="space-y-2 mb-4">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block px-1">
            Dispositivos Vinculados
          </span>

          {iCloudDevices.map((dev) => (
            <div
              key={dev.id}
              className="p-2.5 rounded-2xl bg-stone-50/70 border border-stone-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-stone-700 shadow-xs">
                  {dev.name.includes('iPhone') ? (
                    <Smartphone className="w-4 h-4" />
                  ) : dev.name.includes('iPad') ? (
                    <Tablet className="w-4 h-4" />
                  ) : (
                    <Laptop className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                    <span>{dev.name}</span>
                    {dev.isCurrent && (
                      <span className="text-[9px] bg-stone-200 text-stone-700 px-1.5 py-0.2 rounded-md font-medium">
                        Actual
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-stone-400">
                    {dev.model} · {dev.lastSync}
                  </div>
                </div>
              </div>

              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          ))}
        </div>

        {/* Simulate multi-device entry & JSON Backup */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
          <button
            onClick={handleSimulateCrossDevice}
            disabled={isSimulatingDeviceSync}
            className="flex-1 py-2 px-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-sky-600" />
            <span>Simular gasto desde iPad</span>
          </button>

          <button
            onClick={handleExportBackup}
            className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
            title="Exportar respaldo JSON"
          >
            <Download className="w-3.5 h-3.5 text-stone-600" />
            <span>Copia</span>
          </button>
        </div>
      </section>
    </div>
  );
};
