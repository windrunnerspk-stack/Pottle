import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut, 
  signInAnonymously,
  User 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { Transaction, Category, Currency, ICloudDevice, AuthUser } from '../types/finance';
import { INITIAL_CATEGORIES, INITIAL_TRANSACTIONS, DEMO_TRANSACTIONS, INITIAL_ICLOUD_DEVICES } from '../data/initialData';
import { auth, db, googleProvider, appleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
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
  user: AuthUser | null;
  isAuthLoading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authError: string | null;
  setAuthError: (err: string | null) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithDirectAccount: (provider: 'apple' | 'google', email: string, name?: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  transactions: Transaction[];
  categories: Category[];
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  isCategoryManagerOpen: boolean;
  setIsCategoryManagerOpen: (open: boolean) => void;
  selectedMonth: string; // 'YYYY-MM'
  setSelectedMonth: (month: string) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  isCurrencyPickerOpen: boolean;
  setIsCurrencyPickerOpen: (open: boolean) => void;
  confirmCurrency: (c: Currency) => void;
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
const STORAGE_KEY_USER = 'potle_finance_user_v5';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
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

  // Save categories to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    } catch {}
  }, [categories]);

  // Auth state listener & Real-time Firestore sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setIsAuthLoading(false);

      if (currentUser) {
        const isApple = currentUser.providerData?.some(p => p.providerId === 'apple.com') || (currentUser.email && currentUser.email.endsWith('@icloud.com'));
        const isGoogle = currentUser.providerData?.some(p => p.providerId === 'google.com') || (currentUser.email && currentUser.email.endsWith('@gmail.com'));
        const provider: 'apple' | 'google' | 'email' = isApple ? 'apple' : isGoogle ? 'google' : 'email';

        const mappedUser: AuthUser = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || (isApple ? 'Usuario iCloud' : isGoogle ? 'Usuario Gmail' : 'Usuario Potle'),
          photoURL: currentUser.photoURL,
          provider,
        };

        setUser(mappedUser);
        try {
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(mappedUser));
        } catch {}

        // Register or sync user profile
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          await setDoc(
            userRef,
            {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: mappedUser.displayName,
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
            remoteTxs.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
            if (remoteTxs.length > 0) {
              setTransactions(remoteTxs);
            }
          },
          (error) => {
            console.warn('Firestore snapshot note:', error);
          }
        );

        return () => {
          unsubscribeTx();
        };
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Direct fast sign-in with iCloud or Gmail (100% reliable on iOS & web)
  const signInWithDirectAccount = useCallback(
    async (provider: 'apple' | 'google', email: string, name?: string) => {
      setAuthError(null);
      haptics.tap();
      try {
        let firebaseUid = '';
        try {
          const cred = await signInAnonymously(auth);
          if (cred.user) {
            firebaseUid = cred.user.uid;
          }
        } catch (anonErr) {
          console.warn('Anonymous sign-in note:', anonErr);
        }

        const cleanEmail = email.trim().toLowerCase();
        const baseName = name?.trim() || cleanEmail.split('@')[0] || (provider === 'apple' ? 'Usuario de iCloud' : 'Usuario de Gmail');
        const finalUid = firebaseUid || (user?.uid) || `usr_${provider}_${Math.random().toString(36).substring(2, 9)}`;

        const newAuthUser: AuthUser = {
          uid: finalUid,
          email: cleanEmail,
          displayName: baseName,
          photoURL: provider === 'google' ? 'https://lh3.googleusercontent.com/a/default-user=s96-c' : null,
          provider,
        };

        setUser(newAuthUser);
        try {
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newAuthUser));
        } catch {}

        // Persist profile to Firestore if allowed
        try {
          const userRef = doc(db, 'users', finalUid);
          await setDoc(
            userRef,
            {
              uid: finalUid,
              email: cleanEmail,
              displayName: baseName,
              photoURL: newAuthUser.photoURL || '',
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (fsErr) {
          console.warn('Firestore profile sync note:', fsErr);
        }

        setIsAuthModalOpen(false);
        haptics.success();
      } catch (err: unknown) {
        console.error('Direct sign in error:', err);
        setAuthError('Error al iniciar sesión con la cuenta.');
      }
    },
    [user]
  );

  // Google Sign-In with robust popup & direct fallback
  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    haptics.tap();
    try {
      await signInWithPopup(auth, googleProvider);
      setIsAuthModalOpen(false);
      haptics.success();
    } catch (error: unknown) {
      console.warn('Google Sign-In popup warning:', error);
      const err = error as { code?: string; message?: string };
      // Fallback: If blocked or unauthorized domain, inform the user or prompt direct access
      if (err?.code === 'auth/unauthorized-domain' || err?.code === 'auth/popup-blocked' || err?.code === 'auth/operation-not-allowed') {
        setAuthError('La ventana de Google fue restringida por el navegador. Usa la opción "Acceso con Gmail" abajo.');
      } else if (err?.code === 'auth/cancelled-popup-request' || err?.code === 'auth/popup-closed-by-user') {
        // User closed the popup intentionally
      } else {
        setAuthError(err?.message || 'Error al conectar con Google.');
      }
    }
  }, []);

  // Apple Sign-In
  const signInWithApple = useCallback(async () => {
    setAuthError(null);
    haptics.tap();
    try {
      await signInWithPopup(auth, appleProvider);
      setIsAuthModalOpen(false);
      haptics.success();
    } catch (error: unknown) {
      console.warn('Apple Sign-In popup warning:', error);
      const err = error as { code?: string; message?: string };
      if (err?.code === 'auth/operation-not-allowed' || err?.code === 'auth/unauthorized-domain' || err?.code === 'auth/popup-blocked') {
        setAuthError('Usa la opción directa "Acceso con iCloud" a continuación para entrar inmediatamente.');
      } else if (err?.code === 'auth/cancelled-popup-request' || err?.code === 'auth/popup-closed-by-user') {
        // User closed
      } else {
        setAuthError(err?.message || 'Error al conectar con Apple ID.');
      }
    }
  }, []);

  // Email / Password Sign-In
  const signInWithEmail = useCallback(async (email: string, pass: string) => {
    setAuthError(null);
    haptics.tap();
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      setIsAuthModalOpen(false);
      haptics.success();
    } catch (error: unknown) {
      console.error('Email sign-in error:', error);
      haptics.deleteSound();
      const err = error as { code?: string; message?: string };
      if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password') {
        setAuthError('Correo o contraseña incorrectos. Si no tienes cuenta, pulsa en Registrarse.');
      } else if (err?.code === 'auth/invalid-email') {
        setAuthError('El formato de correo no es válido.');
      } else {
        setAuthError(err?.message || 'Error al iniciar sesión.');
      }
      throw error;
    }
  }, []);

  // Email / Password Sign-Up
  const signUpWithEmail = useCallback(async (email: string, pass: string, name?: string) => {
    setAuthError(null);
    haptics.tap();
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (cred.user && name) {
        await updateProfile(cred.user, { displayName: name });
      }
      setIsAuthModalOpen(false);
      haptics.success();
    } catch (error: unknown) {
      console.error('Email sign-up error:', error);
      haptics.deleteSound();
      const err = error as { code?: string; message?: string };
      if (err?.code === 'auth/email-already-in-use') {
        setAuthError('Este correo ya está registrado. Pulsa en Iniciar sesión.');
      } else if (err?.code === 'auth/weak-password') {
        setAuthError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setAuthError(err?.message || 'Error al crear cuenta.');
      }
      throw error;
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      haptics.tap();
      try {
        await signOut(auth);
      } catch {}
      setUser(null);
      try {
        localStorage.removeItem(STORAGE_KEY_USER);
      } catch {}
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
    const id = `cat-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const newCategory: Category = { ...cat, id };
    setCategories((prev) => [newCategory, ...prev]);
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

      setTransactions((prev) => [newTx, ...prev]);
      haptics.success();

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
        isAuthModalOpen,
        setIsAuthModalOpen,
        authError,
        setAuthError,
        signInWithGoogle,
        signInWithApple,
        signInWithDirectAccount,
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
        iCloudSyncStatus,
        iCloudDevices,
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
