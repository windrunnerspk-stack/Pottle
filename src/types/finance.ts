export type TransactionType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  emoji: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  lightBg: string;
  budgetMonthly: number;
}

export interface Transaction {
  id: string;
  userId?: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  note: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  createdAt?: string;
  syncedToICloud?: boolean;
}

export interface UserProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  createdAt: string;
}

export type Currency = 'EUR' | 'USD' | 'MXN' | 'COP';

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  label: string;
}

export interface ICloudDevice {
  id: string;
  name: string;
  model: string;
  lastSync: string;
  isCurrent: boolean;
  status: 'active' | 'idle' | 'syncing';
}
