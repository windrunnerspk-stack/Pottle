import React from 'react';
import { ChevronLeft, ChevronRight, Info, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatAmountOnly, DAYS_SHORT_ES, getMonthLabel } from '../utils/formatters';
import { haptics } from '../utils/haptics';

export const FlightFareCalendar: React.FC = () => {
  const {
    transactions,
    selectedMonth,
    setSelectedMonth,
    currency,
    setSelectedDay,
    statsSummary,
  } = useFinance();

  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12

  // Month navigation
  const prevMonth = () => {
    haptics.tap();
    const newDate = new Date(year, month - 2, 1);
    const y = newDate.getFullYear();
    const m = String(newDate.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${y}-${m}`);
  };

  const nextMonth = () => {
    haptics.tap();
    const newDate = new Date(year, month, 1);
    const y = newDate.getFullYear();
    const m = String(newDate.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${y}-${m}`);
  };

  // Calculate days in current month
  const totalDays = new Date(year, month, 0).getDate();
  // Day of week of the first day (0 = Sunday, 1 = Monday in standard JS)
  // We want Monday = 0, Sunday = 6
  const firstDayJs = new Date(year, month - 1, 1).getDay();
  const firstDayCol = (firstDayJs + 6) % 7; // Monday offset

  // Group transactions by day: 'YYYY-MM-DD'
  const dayMap: Record<string, { income: number; expenses: number; count: number }> = {};

  transactions.forEach((tx) => {
    if (tx.date.startsWith(selectedMonth)) {
      if (!dayMap[tx.date]) {
        dayMap[tx.date] = { income: 0, expenses: 0, count: 0 };
      }
      if (tx.type === 'income') {
        dayMap[tx.date].income += tx.amount;
      } else {
        dayMap[tx.date].expenses += tx.amount;
      }
      dayMap[tx.date].count += 1;
    }
  });

  const dailyAvg = statsSummary.dailyAverageExpense || 30;

  // Find max expense day for stats badge
  let maxExpenseDay: string | null = null;
  let maxExpenseAmount = 0;
  Object.entries(dayMap).forEach(([date, data]) => {
    if (data.expenses > maxExpenseAmount) {
      maxExpenseAmount = data.expenses;
      maxExpenseDay = date;
    }
  });

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-3 pb-24">
      {/* Month Navigator Header */}
      <header className="flex items-center justify-between mb-3 px-1">
        <div>
          <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider block">
            Tarifario Diario
          </span>
          <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
            {getMonthLabel(selectedMonth)}
          </h1>
        </div>

        <div className="flex items-center gap-1.5 bg-white rounded-2xl p-1 border border-stone-200/60 shadow-xs">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Flight Fare Legend & Metric Summary */}
      <section className="bg-white rounded-2xl p-3 mb-3.5 border border-stone-200/60 ios-card-shadow flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#1E6838]" />
            <span className="text-stone-600 font-medium text-[11px]">Ingreso</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#9E3344]" />
            <span className="text-stone-600 font-medium text-[11px]">Gasto</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#F7C6CA] border border-[#F2A8AF]" />
            <span className="text-stone-600 font-medium text-[11px]">&gt; Media</span>
          </div>
        </div>

        <div className="text-[11px] text-stone-500 font-medium">
          Media: <span className="font-bold text-stone-800">{formatCurrency(dailyAvg, currency, 0)}/d</span>
        </div>
      </section>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center">
        {DAYS_SHORT_ES.map((dayName, idx) => (
          <div
            key={dayName}
            className={`text-[11px] font-semibold py-1 uppercase tracking-wider ${
              idx >= 5 ? 'text-stone-400' : 'text-stone-600'
            }`}
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar Grid: Flight Fare Style */}
      <div className="grid grid-cols-7 gap-1.5 mb-4">
        {/* Leading empty cells before day 1 */}
        {Array.from({ length: firstDayCol }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="h-[74px] rounded-2xl bg-stone-100/40 border border-transparent pointer-events-none"
          />
        ))}

        {/* Days of the month */}
        {Array.from({ length: totalDays }).map((_, i) => {
          const dayNum = i + 1;
          const dateStr = `${selectedMonth}-${String(dayNum).padStart(2, '0')}`;
          const dayData = dayMap[dateStr];

          const hasExpense = dayData && dayData.expenses > 0;
          const hasIncome = dayData && dayData.income > 0;
          const hasBoth = hasExpense && hasIncome;
          const net = dayData ? dayData.income - dayData.expenses : 0;

          // Heatmap evaluation
          const isHighExpense = hasExpense && dayData.expenses > dailyAvg * 1.35;
          const isModerateExpense = hasExpense && !isHighExpense;
          const isNetPositive = net > 0;

          // Dynamic cell styling according to the Flight-fare heatmap spec
          let cellBg = 'bg-white border-stone-200/50 hover:border-stone-400';
          if (isHighExpense) {
            // Intense pastel rose (exceeded average)
            cellBg = 'bg-[#F8D2D7] border-[#F3B3BC] text-[#7A1D2B] shadow-xs';
          } else if (isModerateExpense && !isNetPositive) {
            // Gentle pastel blush
            cellBg = 'bg-[#FDF0F2] border-[#F9D8DD] text-[#8A2434]';
          } else if (isNetPositive && !hasExpense) {
            // Pure pastel mint
            cellBg = 'bg-[#E7F7ED] border-[#C4EBCD] text-[#1E6838]';
          } else if (isNetPositive && hasExpense) {
            // Mixed but net positive
            cellBg = 'bg-[#EEF9F1] border-[#D1EFE7] text-stone-800';
          }

          const isToday = dateStr === '2026-10-06';

          return (
            <button
              key={dateStr}
              onClick={() => {
                haptics.tap();
                setSelectedDay(dateStr);
              }}
              className={`h-[74px] rounded-[18px] border p-1.5 flex flex-col justify-between transition-all duration-150 active:scale-95 cursor-pointer relative overflow-hidden group ${cellBg} ${
                isToday ? 'ring-2 ring-stone-800' : ''
              }`}
            >
              {/* Top row: Day Number + Status indicator */}
              <div className="flex items-center justify-between w-full">
                <span className="font-mono text-xs font-semibold text-stone-800">
                  {dayNum}
                </span>

                {/* Micro indicators: Dual dots if both expense & income */}
                {hasBoth ? (
                  <div className="flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1E6838]" title="Ingreso" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9E3344]" title="Gasto" />
                  </div>
                ) : hasIncome ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E6838]" />
                ) : hasExpense ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9E3344]" />
                ) : null}
              </div>

              {/* Bottom Flight-Fare Tag / Price Badge */}
              <div className="w-full flex flex-col items-center justify-end text-center mt-auto">
                {hasBoth ? (
                  // Show net amount with indicators
                  <div className="w-full">
                    <span
                      className={`text-[10px] font-bold block tabular-nums leading-tight truncate ${
                        net >= 0 ? 'text-[#1E6838]' : 'text-[#8A2434]'
                      }`}
                    >
                      {net >= 0 ? '+' : '-'}
                      {formatCurrency(Math.abs(net), currency, 0)}
                    </span>
                    <span className="text-[9px] text-stone-500 font-medium block -mt-0.5">
                      neto
                    </span>
                  </div>
                ) : hasExpense ? (
                  // Expense only: Red tag (-XX)
                  <span className="text-[10px] font-bold text-[#8A2434] tabular-nums leading-tight truncate w-full">
                    -{formatCurrency(dayData.expenses, currency, 0)}
                  </span>
                ) : hasIncome ? (
                  // Income only: Green tag (+XX)
                  <span className="text-[10px] font-bold text-[#1E6838] tabular-nums leading-tight truncate w-full">
                    +{formatCurrency(dayData.income, currency, 0)}
                  </span>
                ) : (
                  // No activity
                  <span className="text-[10px] text-stone-300 font-light">—</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Helpful Flight-Fare Card at Bottom */}
      <section className="bg-white rounded-[24px] p-4 ios-card-shadow border border-stone-100 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="text-xs text-stone-600 leading-relaxed">
          <p className="font-semibold text-stone-900 mb-0.5">
            Interacción de vuelo inteligente
          </p>
          Toca cualquier día de la cuadrícula para abrir la hoja deslizante (bottom-sheet) con el desglose exacto de movimientos, horarios y notas.
        </div>
      </section>
    </div>
  );
};
