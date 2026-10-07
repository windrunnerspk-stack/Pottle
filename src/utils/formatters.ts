import { Currency } from '../types/finance';

export const CURRENCIES = {
  EUR: { symbol: '€', code: 'EUR', label: 'Euro (€)' },
  USD: { symbol: '$', code: 'USD', label: 'Dólar ($)' },
  MXN: { symbol: '$', code: 'MXN', label: 'Peso MXN ($)' },
  COP: { symbol: '$', code: 'COP', label: 'Peso COP ($)' },
};

export function formatCurrency(amount: number, currency: Currency = 'EUR', decimals = 2): string {
  const symbol = CURRENCIES[currency]?.symbol || '€';
  const formatted = Math.abs(amount).toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${amount < 0 ? '-' : ''}${symbol}${formatted}`;
}

export function formatAmountOnly(amount: number, decimals = 2): string {
  return Math.abs(amount).toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const DAYS_SHORT_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function getMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  if (!year || !month) return yearMonth;
  return `${MONTH_NAMES_ES[month - 1]} ${year}`;
}
