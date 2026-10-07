import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { Transaction, Category, Currency, ICloudDevice, UserProfile } from '../types/finance';
import { INITIAL_CATEGORIES, INITIAL_TRANSACTIONS, INITIAL_ICLOUD_DEVICES } from '../data/initialData';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
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
  user: User | null;
  isAuthLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  transactions: Transaction[];
  categories: Category[];
  selectedMonth: string; // 'YYYY-MM'
  setSelectedMonth: (month: string) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  activeTab: 'home' | 'calendar' | 'stats' | 'widgets';
  setActiveTab: (tab: 'home' | 'calendar' | 'stats' | 'widgets') => void;
  selectedDay: string | null;
  setSelectedDay: (day: string | null) => void;
  quickEntryCategory: Category | null;
  setQuickEntryCategory: (cat: Category | null) => void;
  isQuickEntryOpen: boolean;
  setIsQuickEntryOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  iCloudSyncStatus: 'synced' | 'syncing' | 'offline';
  iCloudDevices: ICloudDevice[];
  triggerICloudSync: () => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'syncedToICloud'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  resetData: () => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
  statsSummary: StatsSummary;
  openCategoryQuickAdd: (category: Category) => void;
  recordWidgetExpense: (amount: number, categoryId: string, note?: string) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEY_TX = 'potle_finance_transactions_v3';
const STORAGE_KEY_CURRENCY = 'potle_finance_currency_v3';
const STORAGE_KEY_SOUND = 'potle_finance_sound_v3';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TX);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_TRANSACTIONS;
  });

  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [currency, setCurrencyState] = useState<Currency>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENCY);
      if (saved && (saved === 'EUR' || saved === 'USD' || saved === 'MXN' || saved === 'COP')) {
        return saved as Currency;
      }
    } catch {}
    return 'EUR';
  });

  const [activeTab, setActiveTabState] = useState<'home' | 'calendar' | 'stats' | 'widgets'>('home');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [quickEntryCategory, setQuickEntryCategory] = useState<Category | null>(null);
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [iCloudSyncStatus, setICloudSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [iCloudDevices, setICloudDevices] = useState<ICloudDevice[]>(INITIAL_ICLOUD_DEVICES);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SOUND);
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    haptics.setSoundEnabled(isSoundEnabled);
    try {
      localStorage.setItem(STORAGE_KEY_SOUND, String(isSoundEnabled));
    } catch {}
  }, [isSoundEnabled]);

  // Auth state listener & Real-time Firestore sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);

      if (currentUser) {
        // Register or sync user profile
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          await setDoc(
            userRef,
            {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'Usuario Potle',
              photoURL: currentUser.photoURL || '',
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn('User profile sync note:', err);
        }

        // Attach real-time snapshot on user's transactions
        const txPath = `users/${currentUser.uid}/transactions`;
        const txCol = collection(db, 'users', currentUser.uid, 'transactions');
        const unsubscribeTx = onSnapshot(
          txCol,
          (snapshot) => {
            if (!snapshot.empty) {
              const remoteTxs: Transaction[] = [];
              snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                remoteTxs.push({
                  id: docSnap.id,
                  userId: data.userId || currentUser.uid,
                  type: data.type || 'expense',
                  amount: Number(data.amount) || 0,
                  categoryId: data.categoryId || 'salidas',
                  note: data.note || '',
                  date: data.date || '2026-10-06',
                  time: data.time || '12:00',
                  createdAt: data.createdAt,
                  syncedToICloud: true,
                });
              });
              // Sort descending by date & time
              remoteTxs.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
              setTransactions(remoteTxs);
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, txPath);
          }
        );

        return () => {
          unsubscribeTx();
        };
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      haptics.tap();
      await signInWithPopup(auth, googleProvider);
      haptics.success();
    } catch (error) {
      console.error('Error signing in with Google:', error);
      haptics.deleteSound();
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      haptics.tap();
      await signOut(auth);
      haptics.deleteSound();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled((prev) => !prev);
    haptics.tap();
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY_CURRENCY, c);
    } catch {}
    haptics.tap();
  }, []);

  const setActiveTab = useCallback((tab: 'home' | 'calendar' | 'stats' | 'widgets') => {
    haptics.tap();
    setActiveTabState(tab);
  }, []);

  // Save transactions to local storage cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(transactions));
    } catch {}
  }, [transactions]);

  const triggerICloudSync = useCallback(async () => {
    setICloudSyncStatus('syncing');
    haptics.tap();

    await new Promise((resolve) => setTimeout(resolve, 800));

    setTransactions((prev) => prev.map((t) => ({ ...t, syncedToICloud: true })));

    setICloudDevices((prev) =>
      prev.map((dev) =>
        dev.isCurrent
          ? { ...dev, lastSync: 'Sincronizado ahora' }
          : { ...dev, lastSync: 'Hace 1 minuto' }
      )
    );

    setICloudSyncStatus('synced');
    haptics.success();
  }, []);

  const addTransaction = useCallback(
    async (txData: Omit<Transaction, 'id' | 'syncedToICloud'>) => {
      const newId = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newTx: Transaction = {
        ...txData,
        id: newId,
        userId: user ? user.uid : undefined,
        createdAt: new Date().toISOString(),
        syncedToICloud: true,
      };

      // Optimistic local update
      setTransactions((prev) => [newTx, ...prev]);
      haptics.success();

      // Write to Firestore if user is authenticated
      if (user) {
        const path = `users/${user.uid}/transactions/${newId}`;
        try {
          await setDoc(doc(db, 'users', user.uid, 'transactions', newId), {
            userId: user.uid,
            type: txData.type,
            amount: Number(txData.amount),
            categoryId: txData.categoryId,
            note: txData.note || '',
            date: txData.date,
            time: txData.time,
            createdAt: new Date().toISOString(),
            syncedToICloud: true,
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, path);
        }
      }
    },
    [user]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      haptics.deleteSound();

      if (user) {
        const path = `users/${user.uid}/transactions/${id}`;
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, path);
        }
      }
    },
    [user]
  );

  const updateTransaction = useCallback(
    async (id: string, updates: Partial<Transaction>) => {
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      haptics.tap();

      if (user) {
        const path = `users/${user.uid}/transactions/${id}`;
        try {
          await setDoc(doc(db, 'users', user.uid, 'transactions', id), updates, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, path);
        }
      }
    },
    [user]
  );

  const resetData = useCallback(() => {
    setTransactions(INITIAL_TRANSACTIONS);
    setSelectedMonth('2026-10');
    haptics.deleteSound();
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
        note: note || `Gasto widget: ${category?.name || 'Varios'}`,
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
          categoryTotals[tx.categoryId] = (categoryTotals[tx.categoryId] || 0) + tx.amount;
          expenseDays.add(tx.date);
        }
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

    const topExpenseCategory = topCatId ? categories.find((c) => c.id === topCatId) || null : null;
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

  return (
    <FinanceContext.Provider
      value={{
        user,
        isAuthLoading,
        signInWithGoogle,
        signOutUser,
        transactions,
        categories,
        selectedMonth,
        setSelectedMonth,
        currency,
        setCurrency,
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
        iCloudSyncStatus,
        iCloudDevices,
        triggerICloudSync,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        resetData,
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
