import React, { useState } from 'react';
import { 
  Settings, 
  ChevronDown, 
  TrendingUp, 
  TrendingDown, 
  Trash2, 
  Clock, 
  CloudCheck, 
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, getMonthLabel, MONTH_NAMES_ES } from '../utils/formatters';
import { haptics } from '../utils/haptics';

export const HomeDashboard: React.FC = () => {
  const {
    transactions,
    categories,
    selectedMonth,
    setSelectedMonth,
    currency,
    setIsSettingsOpen,
    openCategoryQuickAdd,
    deleteTransaction,
    statsSummary,
    iCloudSyncStatus,
    triggerICloudSync,
    user,
    signInWithGoogle,
  } = useFinance();

  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');

  // Filter transactions for this month and selected filter
  const currentMonthTransactions = transactions.filter((tx) =>
    tx.date.startsWith(selectedMonth)
  );

  const displayedTransactions = currentMonthTransactions.filter((tx) => {
    if (filterType === 'all') return true;
    return tx.type === filterType;
  });

  const monthOptions = [
    '2026-08',
    '2026-09',
    '2026-10',
    '2026-11',
    '2026-12',
  ];

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-3 pb-24">
      {/* Header zone */}
      <header className="flex items-center justify-between mb-4">
        {/* Month Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              haptics.tap();
              setIsMonthPickerOpen(!isMonthPickerOpen);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/70 backdrop-blur-md border border-stone-200/50 shadow-xs text-stone-900 active:scale-95 transition-all cursor-pointer"
          >
            <span className="font-serif italic text-base text-stone-900 font-semibold tracking-tight">
              {getMonthLabel(selectedMonth)}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform ${isMonthPickerOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Month Picker dropdown menu */}
          {isMonthPickerOpen && (
            <div className="absolute left-0 top-11 z-30 w-44 bg-white/95 backdrop-blur-xl rounded-2xl border border-stone-200/70 shadow-lg p-1.5 animate-fadeIn">
              <div className="text-[11px] font-semibold text-stone-400 px-2 py-1 uppercase tracking-wider">
                Seleccionar mes
              </div>
              {monthOptions.map((m) => {
                const isSelected = m === selectedMonth;
                return (
                  <button
                    key={m}
                    onClick={() => {
                      haptics.tap();
                      setSelectedMonth(m);
                      setIsMonthPickerOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-[#1F242D] text-white font-medium'
                        : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span>{getMonthLabel(m)}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Action Icons: User Account, iCloud status & Settings */}
        <div className="flex items-center gap-1.5">
          {/* User profile trigger */}
          {user ? (
            <button
              onClick={() => {
                haptics.tap();
                setIsSettingsOpen(true);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-2xl bg-white/70 backdrop-blur-md border border-stone-200/50 shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Cuenta de usuario"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Usuario'}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
              )}
              <span className="text-[11px] font-medium text-stone-700 max-w-[70px] truncate hidden sm:inline">
                {user.displayName?.split(' ')[0] || 'Cuenta'}
              </span>
            </button>
          ) : (
            <button
              onClick={() => {
                haptics.tap();
                signInWithGoogle();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-stone-900 text-white shadow-xs active:scale-95 transition-all cursor-pointer text-[11px] font-semibold"
              title="Iniciar sesión"
            >
              <span>Acceder</span>
            </button>
          )}

          {/* iCloud quick trigger button */}
          <button
            onClick={triggerICloudSync}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-white/70 backdrop-blur-md border border-stone-200/50 shadow-xs active:scale-90 transition-all cursor-pointer"
            title="Sincronizar iCloud"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                iCloudSyncStatus === 'syncing'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="text-[11px] font-medium text-stone-600 hidden sm:inline">iCloud</span>
          </button>

          {/* Settings button */}
          <button
            onClick={() => {
              haptics.tap();
              setIsSettingsOpen(true);
            }}
            className="w-9 h-9 rounded-2xl bg-white/70 backdrop-blur-md border border-stone-200/50 shadow-xs flex items-center justify-center text-stone-700 hover:text-stone-900 active:scale-90 transition-all cursor-pointer"
            aria-label="Ajustes"
          >
            <Settings className="w-4 h-4 stroke-[2]" />
          </button>
        </div>
      </header>

      {/* Main Total Balance Highlight Card */}
      <section className="bg-white rounded-[28px] p-5 mb-4 ios-card-shadow border border-stone-100/80 relative overflow-hidden">
        {/* Subtle decorative pastel ambient glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-gradient-to-br from-emerald-100/50 to-amber-100/30 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            Balance Total
          </span>
          <span className="text-[11px] text-stone-500 font-medium bg-stone-100 px-2 py-0.5 rounded-full">
            {currency}
          </span>
        </div>

        {/* Big Serif Number */}
        <div className="flex items-baseline gap-1 my-1">
          <h1 className="font-serif text-4xl sm:text-[42px] font-bold text-stone-900 tracking-tight">
            {formatCurrency(statsSummary.netBalance, currency)}
          </h1>
        </div>

        {/* Quiet Subtitle / Health Context */}
        <div className="flex items-center gap-2 text-xs text-stone-500 mt-2">
          <span className="flex items-center gap-1 text-emerald-700 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            +8.4%
          </span>
          <span aria-hidden="true">·</span>
          <span>Ahorro neto este mes</span>
        </div>
      </section>

      {/* Summary Pill / Soft Cards: Ingresos (+) & Gastos (-) */}
      <section className="grid grid-cols-2 gap-3 mb-5">
        {/* Ingresos card (Mint Green pastel) */}
        <div className="bg-[#D4EDDA]/70 border border-[#BDE3C6] rounded-[24px] p-3.5 flex flex-col justify-between ios-card-shadow">
          <div className="flex items-center justify-between text-xs text-[#226E3F] font-medium mb-1">
            <span className="tracking-tight">Ingresos</span>
            <div className="w-6 h-6 rounded-full bg-[#E8F8ED] flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5 text-[#226E3F]" />
            </div>
          </div>
          <div className="font-serif text-xl sm:text-2xl font-bold text-[#1E6838] tracking-tight">
            +{formatCurrency(statsSummary.totalIncome, currency)}
          </div>
          <div className="text-[10px] text-[#226E3F]/80 mt-1 font-medium">
            {currentMonthTransactions.filter((t) => t.type === 'income').length} registros
          </div>
        </div>

        {/* Gastos card (Blush Red pastel) */}
        <div className="bg-[#F8D7DA]/70 border border-[#F3BEC3] rounded-[24px] p-3.5 flex flex-col justify-between ios-card-shadow">
          <div className="flex items-center justify-between text-xs text-[#9E3344] font-medium mb-1">
            <span className="tracking-tight">Gastos</span>
            <div className="w-6 h-6 rounded-full bg-[#FDF0F1] flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5 text-[#9E3344]" />
            </div>
          </div>
          <div className="font-serif text-xl sm:text-2xl font-bold text-[#8A2434] tracking-tight">
            -{formatCurrency(statsSummary.totalExpenses, currency)}
          </div>
          <div className="text-[10px] text-[#9E3344]/80 mt-1 font-medium">
            {currentMonthTransactions.filter((t) => t.type === 'expense').length} movimientos
          </div>
        </div>
      </section>

      {/* Quick Category Grid: 3D/Emoji Buttons */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-semibold text-stone-800 tracking-tight flex items-center gap-1.5">
            <span>Registro Rápido</span>
            <span className="text-[11px] font-normal text-stone-400">· Toca para añadir</span>
          </h2>
        </div>

        {/* Grid of categories with pastel squircle design */}
        <div className="grid grid-cols-4 gap-2.5">
          {categories.slice(0, 8).map((cat) => (
            <button
              key={cat.id}
              onClick={() => openCategoryQuickAdd(cat)}
              style={{
                backgroundColor: cat.badgeBg,
                borderColor: cat.badgeBorder,
              }}
              className="h-24 rounded-[22px] border p-2 flex flex-col items-center justify-between text-center transition-all duration-150 active:scale-95 shadow-xs hover:shadow-sm cursor-pointer group"
            >
              {/* Cute 3D Emoji Icon Container */}
              <div className="w-10 h-10 rounded-2xl bg-white/70 backdrop-blur-xs flex items-center justify-center text-xl shadow-xs group-hover:scale-110 transition-transform">
                {cat.emoji}
              </div>

              {/* Category Name */}
              <span
                style={{ color: cat.textColor }}
                className="text-[11px] font-semibold tracking-tight truncate w-full"
              >
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Recent Transactions Feed */}
      <section className="bg-white rounded-[28px] p-4 ios-card-shadow border border-stone-100/80">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-semibold text-stone-800">
            Movimientos recientes
          </h2>

          {/* Clean Segmented Filter (Functional buttons) */}
          <div className="flex items-center gap-1 p-0.5 bg-stone-100 rounded-xl">
            <button
              onClick={() => {
                haptics.tap();
                setFilterType('all');
              }}
              className={`px-2.5 py-1 text-[11px] rounded-lg transition-all ${
                filterType === 'all'
                  ? 'bg-white text-stone-900 font-semibold shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => {
                haptics.tap();
                setFilterType('expense');
              }}
              className={`px-2.5 py-1 text-[11px] rounded-lg transition-all ${
                filterType === 'expense'
                  ? 'bg-white text-[#9E3344] font-semibold shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Gastos
            </button>
            <button
              onClick={() => {
                haptics.tap();
                setFilterType('income');
              }}
              className={`px-2.5 py-1 text-[11px] rounded-lg transition-all ${
                filterType === 'income'
                  ? 'bg-white text-[#1E6838] font-semibold shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Ingresos
            </button>
          </div>
        </div>

        {/* Transactions list */}
        {displayedTransactions.length === 0 ? (
          <div className="py-8 text-center text-stone-400 text-xs">
            No hay movimientos en este periodo. Toca cualquier categoría arriba para registrar uno.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {displayedTransactions.slice(0, 7).map((tx) => {
              const cat = categories.find((c) => c.id === tx.categoryId);
              const isIncome = tx.type === 'income';

              return (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between group hover:bg-stone-50/50 rounded-xl px-1.5 transition-colors"
                >
                  {/* Left: Icon & Info */}
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: cat?.badgeBg || '#F5F5F5' }}
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-xs shrink-0"
                    >
                      {cat?.emoji || '💸'}
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                        <span>{cat?.name || 'Varios'}</span>
                        {tx.note && (
                          <span className="text-stone-400 font-normal truncate max-w-[130px] hidden sm:inline">
                            · {tx.note}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-stone-400 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{tx.date.slice(5)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{tx.time}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Delete trigger */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-serif text-sm sm:text-base font-bold tabular-nums ${
                        isIncome ? 'text-[#1E6838]' : 'text-[#8A2434]'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(tx.amount, currency)}
                    </span>

                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-stone-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
