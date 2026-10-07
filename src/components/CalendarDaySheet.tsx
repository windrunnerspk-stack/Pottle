import React from 'react';
import { X, Plus, Trash2, Clock, CalendarDays } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, MONTH_NAMES_ES } from '../utils/formatters';
import { haptics } from '../utils/haptics';

export const CalendarDaySheet: React.FC = () => {
  const {
    selectedDay,
    setSelectedDay,
    transactions,
    categories,
    currency,
    deleteTransaction,
    setQuickEntryCategory,
    setIsQuickEntryOpen,
  } = useFinance();

  if (!selectedDay) return null;

  // Filter transactions for this day
  const dayTransactions = transactions.filter((t) => t.date === selectedDay);

  let totalIncome = 0;
  let totalExpenses = 0;
  dayTransactions.forEach((t) => {
    if (t.type === 'income') totalIncome += t.amount;
    else totalExpenses += t.amount;
  });
  const netDay = totalIncome - totalExpenses;

  // Format date readable in Spanish
  const [yearStr, monthStr, dayStr] = selectedDay.split('-');
  const dateObj = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayOfWeek = dayNames[dateObj.getDay()];
  const monthName = MONTH_NAMES_ES[parseInt(monthStr) - 1];

  const handleAddInDay = () => {
    haptics.tap();
    setQuickEntryCategory(categories[0] || null);
    setIsQuickEntryOpen(true);
  };

  const handleClose = () => {
    haptics.tap();
    setSelectedDay(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto">
      {/* Blurred Backdrop */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn"
      />

      {/* Slide-Up Bottom Sheet */}
      <div className="relative w-full max-w-[420px] bg-white rounded-t-[34px] p-5 ios-float-shadow z-10 max-h-[82vh] flex flex-col animate-slideUp">
        {/* Grab Handle */}
        <div className="w-10 h-1.5 bg-stone-300 rounded-full mx-auto -mt-1 mb-3" />

        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              <CalendarDays className="w-3.5 h-3.5 text-stone-500" />
              <span>{dayOfWeek}</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-stone-900">
              {parseInt(dayStr)} de {monthName} {yearStr}
            </h3>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Day Metric Summary Badges */}
        <div className="grid grid-cols-3 gap-2 p-2.5 bg-stone-50 rounded-2xl border border-stone-200/50 mb-4 text-center">
          <div>
            <span className="text-[10px] text-stone-400 font-medium block">Ingresos</span>
            <span className="font-serif text-xs sm:text-sm font-bold text-[#1E6838] tabular-nums">
              +{formatCurrency(totalIncome, currency, 0)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-stone-400 font-medium block">Gastos</span>
            <span className="font-serif text-xs sm:text-sm font-bold text-[#8A2434] tabular-nums">
              -{formatCurrency(totalExpenses, currency, 0)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-stone-400 font-medium block">Balance Neto</span>
            <span
              className={`font-serif text-xs sm:text-sm font-bold tabular-nums ${
                netDay >= 0 ? 'text-[#1E6838]' : 'text-[#8A2434]'
              }`}
            >
              {netDay >= 0 ? '+' : ''}
              {formatCurrency(netDay, currency, 0)}
            </span>
          </div>
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto no-scrollbar mb-4 space-y-2 pr-0.5">
          {dayTransactions.length === 0 ? (
            <div className="py-10 text-center text-stone-400 text-xs">
              No se registraron movimientos en esta fecha.
            </div>
          ) : (
            dayTransactions.map((tx) => {
              const cat = categories.find((c) => c.id === tx.categoryId);
              const isIncome = tx.type === 'income';

              return (
                <div
                  key={tx.id}
                  className="p-3 bg-stone-50/70 hover:bg-stone-100/70 rounded-2xl flex items-center justify-between transition-colors border border-stone-100"
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: cat?.badgeBg || '#EEEEEE' }}
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-xs shrink-0"
                    >
                      {cat?.emoji || '💸'}
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-stone-900">
                        {cat?.name || 'Varios'}
                      </div>
                      {tx.note && (
                        <div className="text-[11px] text-stone-500 line-clamp-1">
                          {tx.note}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-[10px] text-stone-400 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{tx.time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`font-serif text-sm font-bold tabular-nums ${
                        isIncome ? 'text-[#1E6838]' : 'text-[#8A2434]'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(tx.amount, currency)}
                    </span>

                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      className="p-1.5 text-stone-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom CTA to add transaction on this day */}
        <button
          onClick={handleAddInDay}
          className="w-full h-12 rounded-2xl bg-[#1F242D] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-transform cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Añadir gasto o ingreso en este día</span>
        </button>
      </div>
    </div>
  );
};
