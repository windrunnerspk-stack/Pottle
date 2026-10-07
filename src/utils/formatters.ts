import { Currency } from '../types/finance';

export const CURRENCIES: Record<Currency, { symbol: string; code: Currency; label: string; flag: string }> = {
  COP: { symbol: '$', code: 'COP', label: 'Peso Colombiano (COP)', flag: '🇨🇴' },
  USD: { symbol: '$', code: 'USD', label: 'Dólar (USD)', flag: '🇺🇸' },
  EUR: { symbol: '€', code: 'EUR', label: 'Euro (EUR)', flag: '🇪🇺' },
  MXN: { symbol: '$', code: 'MXN', label: 'Peso Mexicano (MXN)', flag: '🇲🇽' },
};

export function formatCurrency(amount: number, currency: Currency = 'COP', decimals?: number): string {
  const symbol = CURRENCIES[currency]?.symbol || '$';
  // COP normally does not use decimals
  const resolvedDecimals = decimals !== undefined ? decimals : currency === 'COP' ? 0 : 2;
  
  const formatted = Math.abs(amount).toLocaleString('es-CO', {
    minimumFractionDigits: resolvedDecimals,
    maximumFractionDigits: resolvedDecimals,
  });
  return `${amount < 0 ? '-' : ''}${symbol}${formatted}`;
}

export function formatAmountOnly(amount: number, currency: Currency = 'COP', decimals?: number): string {
  const resolvedDecimals = decimals !== undefined ? decimals : currency === 'COP' ? 0 : 2;
  return Math.abs(amount).toLocaleString('es-CO', {
    minimumFractionDigits: resolvedDecimals,
    maximumFractionDigits: resolvedDecimals,
  });
}

export function getCurrencyPresets(currency: Currency): number[] {
  switch (currency) {
    case 'COP':
      return [2000, 5000, 20000, 50000];
    case 'MXN':
      return [20, 50, 100, 200];
    case 'USD':
    case 'EUR':
    default:
      return [5, 10, 20, 50];
  }
}

export function getWidgetPresets(currency: Currency) {
  switch (currency) {
    case 'COP':
      return {
        coffee: 4500,
        groceries: 35000,
        gas: 40000,
        pets: 20000,
      };
    case 'MXN':
      return {
        coffee: 65,
        groceries: 350,
        gas: 400,
        pets: 180,
      };
    case 'USD':
    case 'EUR':
    default:
      return {
        coffee: 3.8,
        groceries: 35.0,
        gas: 40.0,
        pets: 18.5,
      };
  }
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
