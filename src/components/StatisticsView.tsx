import React from 'react';
import { PieChart, TrendingUp, Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, getMonthLabel } from '../utils/formatters';

export const StatisticsView: React.FC = () => {
  const {
    selectedMonth,
    currency,
    categories,
    statsSummary,
    transactions,
  } = useFinance();

  // Current month expenses grouped
  const currentMonthTx = transactions.filter((t) => t.date.startsWith(selectedMonth));
  const expenseTx = currentMonthTx.filter((t) => t.type === 'expense');

  const totalExpense = statsSummary.totalExpenses || 1; // avoid division by 0

  // Category breakdown sorted
  const sortedCategories = categories
    .filter((cat) => cat.id !== 'ingresos')
    .map((cat) => {
      const spent = statsSummary.categoryTotals[cat.id] || 0;
      const percentage = totalExpense > 0 ? (spent / totalExpense) * 100 : 0;
      const budget = cat.budgetMonthly || 100;
      const budgetUsage = Math.min((spent / budget) * 100, 100);
      return {
        ...cat,
        spent,
        percentage,
        budgetUsage,
      };
    })
    .sort((a, b) => b.spent - a.spent);

  // Group expenses by day of week
  const dayOfWeekExpenses: number[] = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
  expenseTx.forEach((tx) => {
    const [y, m, d] = tx.date.split('-').map(Number);
    const dayJs = new Date(y, m - 1, d).getDay();
    const idx = (dayJs + 6) % 7; // Monday = 0
    dayOfWeekExpenses[idx] += tx.amount;
  });

  const maxDayExpense = Math.max(...dayOfWeekExpenses, 1);
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Calculate SVG stroke offset for donut chart
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-3 pb-24">
      {/* Header */}
      <header className="mb-4 px-1">
        <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider block">
          Análisis Financiero
        </span>
        <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
          {getMonthLabel(selectedMonth)}
        </h1>
      </header>

      {/* Hero Stats Card with Donut Chart */}
      <section className="bg-white rounded-[28px] p-5 mb-4 ios-card-shadow border border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* SVG Donut Chart */}
        <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
            {/* Background ring */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              className="text-stone-100 stroke-current"
              strokeWidth="14"
              fill="transparent"
            />
            {/* Donut slices */}
            {sortedCategories
              .filter((cat) => cat.spent > 0)
              .map((cat) => {
                const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
                accumulatedPercent += cat.percentage;

                return (
                  <circle
                    key={cat.id}
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke={cat.textColor}
                    strokeWidth="14"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-500"
                  />
                );
              })}
          </svg>

          {/* Center text inside donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-stone-400 font-medium uppercase">Total</span>
            <span className="font-serif text-base font-bold text-stone-900 tabular-nums">
              {formatCurrency(statsSummary.totalExpenses, currency, 0)}
            </span>
          </div>
        </div>

        {/* Top 3 Quick Badges */}
        <div className="flex-1 w-full space-y-2">
          <div className="p-2.5 rounded-2xl bg-stone-50 border border-stone-100">
            <span className="text-[10px] text-stone-400 font-medium block">Gasto medio diario</span>
            <span className="font-serif text-lg font-bold text-stone-800 tabular-nums">
              {formatCurrency(statsSummary.dailyAverageExpense, currency)} / día
            </span>
          </div>

          {statsSummary.topExpenseCategory && (
            <div className="p-2.5 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-stone-400 font-medium block">Mayor categoría</span>
                <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5 mt-0.5">
                  <span>{statsSummary.topExpenseCategory.emoji}</span>
                  <span>{statsSummary.topExpenseCategory.name}</span>
                </span>
              </div>
              <span className="font-serif text-sm font-bold text-[#8A2434] tabular-nums">
                {formatCurrency(statsSummary.categoryTotals[statsSummary.topExpenseCategory.id] || 0, currency, 0)}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Weekly Spending Rhythm Bar Chart */}
      <section className="bg-white rounded-[28px] p-4 mb-4 ios-card-shadow border border-stone-100">
        <h2 className="text-xs font-semibold text-stone-800 mb-3 px-1">
          Ritmo de gasto por día de la semana
        </h2>
        <div className="grid grid-cols-7 gap-1.5 items-end h-28 pt-4 pb-1 px-1">
          {dayOfWeekExpenses.map((spent, idx) => {
            const heightPercent = maxDayExpense > 0 ? (spent / maxDayExpense) * 100 : 0;
            const isHighest = spent === maxDayExpense && spent > 0;

            return (
              <div key={idx} className="flex flex-col items-center h-full justify-end gap-1">
                <span className="text-[9px] text-stone-400 font-medium tabular-nums">
                  {spent > 0 ? formatCurrency(spent, currency, 0) : ''}
                </span>
                <div className="w-full bg-stone-100 rounded-t-lg relative flex items-end h-16 overflow-hidden">
                  <div
                    style={{ height: `${Math.max(heightPercent, 8)}%` }}
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isHighest ? 'bg-[#9E3344]' : 'bg-[#D4EDDA]'
                    }`}
                  />
                </div>
                <span className="text-[10px] font-medium text-stone-600">
                  {dayNames[idx]}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Category Breakdown & Budget Meter List */}
      <section className="bg-white rounded-[28px] p-4 ios-card-shadow border border-stone-100">
        <h2 className="text-xs font-semibold text-stone-800 mb-3 px-1">
          Desglose por categoría
        </h2>

        <div className="space-y-3">
          {sortedCategories.map((cat) => (
            <div key={cat.id} className="p-2.5 rounded-2xl bg-stone-50/70 border border-stone-100">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    style={{ backgroundColor: cat.badgeBg }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                  >
                    {cat.emoji}
                  </div>
                  <span className="text-xs font-semibold text-stone-900">
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    ({cat.percentage.toFixed(0)}%)
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-serif text-xs font-bold text-stone-900 tabular-nums">
                    {formatCurrency(cat.spent, currency)}
                  </span>
                </div>
              </div>

              {/* Progress bar vs monthly budget */}
              <div className="w-full h-1.5 bg-stone-200/60 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${cat.budgetUsage}%`,
                    backgroundColor: cat.textColor,
                  }}
                  className="h-full rounded-full transition-all duration-300"
                />
              </div>

              <div className="flex items-center justify-between text-[9px] text-stone-400 mt-1 font-medium">
                <span>Presupuesto: {formatCurrency(cat.budgetMonthly, currency, 0)}</span>
                <span>{cat.budgetUsage >= 100 ? 'Límite alcanzado' : `${(100 - cat.budgetUsage).toFixed(0)}% restante`}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
