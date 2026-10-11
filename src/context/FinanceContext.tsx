import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, Category, Currency, ICloudDevice, AuthUser } from '../types/finance';
import { INITIAL_CATEGORIES, INITIAL_TRANSACTIONS, DEMO_TRANSACTIONS } from '../data/initialData';
import { haptics } from '../utils/haptics';

interface StatsSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  overallBalance: number;
  dailyAverageExpense: number;
  daysWithExpensesCount: number;
  topExpenseCategory: Category | null;
  categoryTotals: Record<string, number>;
}

interface FinanceContextType {
  // Auth state preserved for backward compatibility (defaults to offline/local)
  user: AuthUser | null;
  isAuthLoading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authError: string | null;
  setAuthError: (err: string | null) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  signOutUser: () => Promise<void>;

  // Transactions & Categories
  transactions: Transaction[];
  categories: Category[];
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  isCategoryManagerOpen: boolean;
  setIsCategoryManagerOpen: (open: boolean) => void;

  // Navigation & Settings
  selectedMonth: string; // 'YYYY-MM'
  setSelectedMonth: (month: string) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  isCurrencyPickerOpen: boolean;
  setIsCurrencyPickerOpen: (open: boolean) => void;
  confirmCurrency: (c: Currency) => void;
  activeTab: 'home' | 'calendar' | 'stats' | 'sync';
  setActiveTab: (tab: 'home' | 'calendar' | 'stats' | 'sync') => void;
  selectedDay: string | null;
  setSelectedDay: (day: string | null) => void;
  quickEntryCategory: Category | null;
  setQuickEntryCategory: (cat: Category | null) => void;
  isQuickEntryOpen: boolean;
  setIsQuickEntryOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;

  // Cloud Sync & Backup
  lastBackupDate: string | null;
  setLastBackupDate: (date: string) => void;
  importTransactions: (imported: Transaction[], mode: 'merge' | 'replace') => number;
  iCloudSyncStatus: 'synced' | 'syncing' | 'offline';
  iCloudDevices: ICloudDevice[];
  triggerICloudSync: () => Promise<void>;

  // Data Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'syncedToICloud'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  resetData: () => void;
  loadDemoData: () => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
  statsSummary: StatsSummary;
  openCategoryQuickAdd: (category: Category) => void;
  recordWidgetExpense: (amount: number, categoryId: string, note?: string) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEY_TX = 'potle_finance_transactions_v4';
const STORAGE_KEY_CURRENCY = 'potle_finance_currency_v4';
const STORAGE_KEY_CURRENCY_CONFIRMED = 'potle_finance_currency_confirmed_v4';
const STORAGE_KEY_CATEGORIES = 'potle_finance_categories_v4';
const STORAGE_KEY_SOUND = 'potle_finance_sound_v4';
const STORAGE_KEY_BACKUP = 'potle_finance_last_backup_date_v1';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authenticated state is no longer required - completely offline-first and private
  const [user] = useState<AuthUser | null>(null);
  const [isAuthLoading] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Default empty transactions for personal finance tracking
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TX);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_TRANSACTIONS;
  });

  // Dynamic user editable categories
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_CATEGORIES;
  });

  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');

  // Default Currency is COP (Pesos colombianos)
  const [currency, setCurrencyState] = useState<Currency>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENCY);
      if (saved && (saved === 'EUR' || saved === 'USD' || saved === 'MXN' || saved === 'COP')) {
        return saved as Currency;
      }
    } catch {}
    return 'COP';
  });

  // Welcome currency picker modal for first-time onboarding
  const [isCurrencyPickerOpen, setIsCurrencyPickerOpen] = useState<boolean>(() => {
    try {
      const confirmed = localStorage.getItem(STORAGE_KEY_CURRENCY_CONFIRMED);
      return confirmed !== 'true';
    } catch {
      return true;
    }
  });

  const [activeTab, setActiveTabState] = useState<'home' | 'calendar' | 'stats' | 'sync'>('home');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [quickEntryCategory, setQuickEntryCategory] = useState<Category | null>(null);
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [iCloudSyncStatus, setICloudSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  // 15-day backup tracking
  const [lastBackupDate, setLastBackupDateState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_BACKUP);
    } catch {
      return null;
    }
  });

  const setLastBackupDate = useCallback((date: string) => {
    setLastBackupDateState(date);
    try {
      localStorage.setItem(STORAGE_KEY_BACKUP, date);
    } catch {}
  }, []);

  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SOUND);
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  // Save transactions to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(transactions));
    } catch {}
  }, [transactions]);

  // Save categories to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    } catch {}
  }, [categories]);

  // Save sound setting
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SOUND, isSoundEnabled ? 'true' : 'false');
    } catch {}
  }, [isSoundEnabled]);

  // Currency selection helpers
  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY_CURRENCY, c);
    } catch {}
    haptics.tap();
  }, []);

  const confirmCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY_CURRENCY, c);
      localStorage.setItem(STORAGE_KEY_CURRENCY_CONFIRMED, 'true');
    } catch {}
    setIsCurrencyPickerOpen(false);
    haptics.success();
  }, []);

  // Category management
  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    const id = cat.name.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || `cat_${Date.now()}`;
    const newCat: Category = { ...cat, id };
    setCategories((prev) => [...prev, newCat]);
    haptics.success();
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    haptics.tap();
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    haptics.deleteSound();
  }, []);

  const setActiveTab = useCallback((tab: 'home' | 'calendar' | 'stats' | 'sync') => {
    haptics.tap();
    setActiveTabState(tab);
  }, []);

  // Trigger manual sync animation
  const triggerICloudSync = useCallback(async () => {
    setICloudSyncStatus('syncing');
    haptics.tap();
    await new Promise((resolve) => setTimeout(resolve, 800));
    setTransactions((prev) => prev.map((t) => ({ ...t, syncedToICloud: true })));
    setICloudSyncStatus('synced');
    haptics.success();
  }, []);

  // Import transactions from Excel or Google Drive
  const importTransactions = useCallback((imported: Transaction[], mode: 'merge' | 'replace'): number => {
    haptics.success();
    let finalTxs: Transaction[] = [];

    if (mode === 'replace') {
      finalTxs = [...imported];
    } else {
      // Merge mode: deduplicate based on existing IDs or combination of date+time+amount+note
      const existingKeys = new Set(
        transactions.map((t) => `${t.id}_${t.date}_${t.time}_${t.amount}_${t.note}`)
      );
      const newItems = imported.filter((t) => !existingKeys.has(`${t.id}_${t.date}_${t.time}_${t.amount}_${t.note}`));
      finalTxs = [...newItems, ...transactions];
    }

    // Sort descending by date and time
    finalTxs.sort((a, b) => (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time));
    setTransactions(finalTxs);

    try {
      localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(finalTxs));
    } catch {}

    return imported.length;
  }, [transactions]);

  // Transaction CRUD
  const addTransaction = useCallback(
    async (txData: Omit<Transaction, 'id' | 'syncedToICloud'>) => {
      const newId = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newTx: Transaction = {
        ...txData,
        id: newId,
        createdAt: new Date().toISOString(),
        syncedToICloud: true,
      };

      setTransactions((prev) => [newTx, ...prev]);
      haptics.success();
    },
    []
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      haptics.deleteSound();
    },
    []
  );

  const updateTransaction = useCallback(
    async (id: string, updates: Partial<Transaction>) => {
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      haptics.tap();
    },
    []
  );

  const resetData = useCallback(() => {
    setTransactions([]);
    setSelectedMonth('2026-10');
    haptics.deleteSound();
  }, []);

  const loadDemoData = useCallback(() => {
    setTransactions(DEMO_TRANSACTIONS);
    setSelectedMonth('2026-10');
    haptics.success();
  }, []);

  const openCategoryQuickAdd = useCallback((category: Category) => {
    haptics.tap();
    setQuickEntryCategory(category);
    setIsQuickEntryOpen(true);
  }, []);

  const recordWidgetExpense = useCallback(
    (amount: number, categoryId: string, note?: string) => {
      const today = new Date();
      const dateStr = '2026-10-06';
      const timeStr = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
      const category = categories.find((c) => c.id === categoryId);

      addTransaction({
        type: 'expense',
        amount,
        categoryId,
        note: note || `Gasto rápido: ${category?.name || 'Varios'}`,
        date: dateStr,
        time: timeStr,
      });
    },
    [categories, addTransaction]
  );

  // Statistics calculation for selected month
  const statsSummary = useMemo<StatsSummary>(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let overallIncome = 0;
    let overallExpenses = 0;

    const categoryTotals: Record<string, number> = {};
    const expenseDays = new Set<string>();

    transactions.forEach((tx) => {
      if (tx.type === 'income') {
        overallIncome += tx.amount;
      } else {
        overallExpenses += tx.amount;
      }

      if (tx.date.startsWith(selectedMonth)) {
        if (tx.type === 'income') {
          totalIncome += tx.amount;
        } else {
          totalExpenses += tx.amount;
        }
        categoryTotals[tx.categoryId] = (categoryTotals[tx.categoryId] || 0) + tx.amount;
        expenseDays.add(tx.date);
      }
    });

    let topCatId: string | null = null;
    let maxExpense = 0;
    Object.entries(categoryTotals).forEach(([catId, sum]) => {
      if (sum > maxExpense) {
        maxExpense = sum;
        topCatId = catId;
      }
    });

    const topExpenseCategory = categories.find((c) => c.id === topCatId) || null;
    const daysWithExpensesCount = expenseDays.size;
    const dailyAverageExpense = daysWithExpensesCount > 0 ? totalExpenses / daysWithExpensesCount : 0;

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      overallBalance: overallIncome - overallExpenses,
      dailyAverageExpense,
      daysWithExpensesCount,
      topExpenseCategory,
      categoryTotals,
    };
  }, [transactions, selectedMonth, categories]);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled((prev) => !prev);
    haptics.tap();
  }, []);

  // Safe dummy auth methods (no-ops) so legacy references never fail
  const signInWithGoogle = useCallback(async () => {}, []);
  const signInWithApple = useCallback(async () => {}, []);
  const signInWithEmail = useCallback(async () => {}, []);
  const signUpWithEmail = useCallback(async () => {}, []);
  const signOutUser = useCallback(async () => {}, []);

  return (
    <FinanceContext.Provider
      value={{
        user,
        isAuthLoading,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authError,
        setAuthError,
        signInWithGoogle,
        signInWithApple,
        signInWithEmail,
        signUpWithEmail,
        signOutUser,
        transactions,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        isCategoryManagerOpen,
        setIsCategoryManagerOpen,
        selectedMonth,
        setSelectedMonth,
        currency,
        setCurrency,
        isCurrencyPickerOpen,
        setIsCurrencyPickerOpen,
        confirmCurrency,
        activeTab,
        setActiveTab,
        selectedDay,
        setSelectedDay,
        quickEntryCategory,
        setQuickEntryCategory,
        isQuickEntryOpen,
        setIsQuickEntryOpen,
        isSettingsOpen,
        setIsSettingsOpen,
        lastBackupDate,
        setLastBackupDate,
        importTransactions,
        iCloudSyncStatus,
        iCloudDevices: [],
        triggerICloudSync,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        resetData,
        loadDemoData,
        isSoundEnabled,
        toggleSound,
        statsSummary,
        openCategoryQuickAdd,
        recordWidgetExpense,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
