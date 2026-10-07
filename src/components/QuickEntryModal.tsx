import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, MessageSquare, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Category, TransactionType } from '../types/finance';
import { formatCurrency, getCurrencyPresets } from '../utils/formatters';
import { haptics } from '../utils/haptics';

export const QuickEntryModal: React.FC = () => {
  const {
    isQuickEntryOpen,
    setIsQuickEntryOpen,
    quickEntryCategory,
    categories,
    currency,
    addTransaction,
    selectedDay,
    selectedMonth,
  } = useFinance();

  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [amountStr, setAmountStr] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [type, setType] = useState<TransactionType>('expense');
  const [txDate, setTxDate] = useState<string>('2026-10-06');

  useEffect(() => {
    if (quickEntryCategory) {
      setActiveCategory(quickEntryCategory);
      if (quickEntryCategory.id === 'ingresos') {
        setType('income');
      } else {
        setType('expense');
      }
    } else if (categories.length > 0) {
      setActiveCategory(categories[0]);
    }
  }, [quickEntryCategory, categories]);

  useEffect(() => {
    if (selectedDay) {
      setTxDate(selectedDay);
    } else {
      setTxDate(`${selectedMonth}-06`);
    }
  }, [selectedDay, selectedMonth]);

  if (!isQuickEntryOpen || !activeCategory) return null;

  const handleClose = () => {
    haptics.tap();
    setIsQuickEntryOpen(false);
    setAmountStr('');
    setNote('');
  };

  const handleKeypadPress = (val: string) => {
    haptics.tap();
    if (val === 'DEL') {
      setAmountStr((prev) => prev.slice(0, -1));
      return;
    }
    if (val === '.') {
      if (amountStr.includes('.')) return;
      if (amountStr === '') {
        setAmountStr('0.');
        return;
      }
    }
    // Limit decimal places to 2
    if (amountStr.includes('.') && amountStr.split('.')[1].length >= 2) return;
    if (amountStr.length >= 7) return; // reasonable max
    setAmountStr((prev) => prev + val);
  };

  const handleQuickPreset = (preset: number) => {
    haptics.tap();
    setAmountStr(String(preset));
  };

  const handleSave = () => {
    const num = parseFloat(amountStr);
    if (isNaN(num) || num <= 0) {
      haptics.tap();
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    addTransaction({
      type,
      amount: num,
      categoryId: activeCategory.id,
      note: note.trim() || activeCategory.name,
      date: txDate,
      time: timeStr,
    });

    handleClose();
  };

  const parsedAmount = parseFloat(amountStr) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto">
      {/* Blurred Backdrop */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fadeIn"
      />

      {/* Central Floating Card Modal */}
      <div className="relative w-full max-w-[380px] bg-white rounded-[32px] p-5 ios-float-shadow z-10 flex flex-col border border-stone-100 animate-scaleUp overflow-hidden">
        {/* Top Bar with Category & Close */}
        <div className="flex items-center justify-between mb-3">
          {/* Type Toggle: Gasto / Ingreso */}
          <div className="flex items-center gap-1 p-0.5 bg-stone-100 rounded-xl">
            <button
              onClick={() => {
                haptics.tap();
                setType('expense');
              }}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                type === 'expense'
                  ? 'bg-white text-[#9E3344] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Gasto</span>
            </button>
            <button
              onClick={() => {
                haptics.tap();
                setType('income');
              }}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                type === 'income'
                  ? 'bg-white text-[#1E6838] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Ingreso</span>
            </button>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Category Header Pill */}
        <div
          style={{
            backgroundColor: activeCategory.badgeBg,
            borderColor: activeCategory.badgeBorder,
          }}
          className="border rounded-2xl p-2.5 flex items-center justify-between mb-4 shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/80 flex items-center justify-center text-xl shadow-xs">
              {activeCategory.emoji}
            </div>
            <div>
              <span
                style={{ color: activeCategory.textColor }}
                className="text-xs font-bold block"
              >
                {activeCategory.name}
              </span>
              <span className="text-[10px] text-stone-500">
                Presupuesto mensual: {formatCurrency(activeCategory.budgetMonthly || 100, currency, 0)}
              </span>
            </div>
          </div>

          {/* Category Switcher Mini Scroll */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-[120px] no-scrollbar">
            {categories.slice(0, 5).map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  haptics.tap();
                  setActiveCategory(c);
                  if (c.id === 'ingresos') setType('income');
                }}
                className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-transform ${
                  activeCategory.id === c.id ? 'scale-115 ring-2 ring-stone-800' : 'opacity-70 hover:opacity-100'
                }`}
                title={c.name}
              >
                {c.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input Display */}
        <div className="text-center py-2 mb-2">
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider block mb-1">
            Importe del movimiento
          </span>
          <div className="flex items-baseline justify-center gap-1">
            <span
              className={`font-serif text-4xl sm:text-5xl font-bold tracking-tight tabular-nums ${
                type === 'income' ? 'text-[#1E6838]' : 'text-[#8A2434]'
              }`}
            >
              {type === 'income' ? '+' : '-'}
              {formatCurrency(parsedAmount, currency)}
            </span>
          </div>
        </div>

        {/* Quick Amount Presets (Dynamic by Currency) */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {getCurrencyPresets(currency).map((preset) => (
            <button
              key={preset}
              onClick={() => handleQuickPreset(preset)}
              className="py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-semibold active:scale-95 transition-all cursor-pointer tabular-nums truncate px-1"
            >
              +{preset >= 1000 ? `${(preset / 1000).toLocaleString()}k` : preset}
            </button>
          ))}
        </div>

        {/* Note / Concept Input */}
        <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 rounded-2xl border border-stone-200/60 mb-3 text-xs">
          <MessageSquare className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <input
            type="text"
            placeholder="Nota opcional (ej: Tostadas y café)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-transparent outline-none text-stone-800 placeholder:text-stone-400 text-xs"
          />
        </div>

        {/* Numeric Keypad Grid */}
        <div className="grid grid-cols-3 gap-1.5 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', currency === 'COP' ? '000' : '.', '0', 'DEL'].map((key) => (
            <button
              key={key}
              onClick={() => handleKeypadPress(key)}
              className="h-10 rounded-xl bg-stone-100 hover:bg-stone-200/80 active:bg-stone-300 text-stone-800 font-semibold text-sm flex items-center justify-center transition-all cursor-pointer tabular-nums"
            >
              {key === 'DEL' ? '⌫' : key}
            </button>
          ))}
        </div>

        {/* Confirm Save CTA */}
        <button
          onClick={handleSave}
          disabled={parsedAmount <= 0}
          className={`w-full h-12 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
            parsedAmount > 0
              ? 'bg-[#1F242D] hover:bg-[#2C333F] text-white active:scale-98'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
          }`}
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>Guardar en Potle Finanzas</span>
        </button>
      </div>
    </div>
  );
};
