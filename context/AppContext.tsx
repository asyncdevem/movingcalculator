'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminRates, CustomerInfo, QuoteRecord, ViewType } from '@/types/calculator';
import { DEFAULT_ADMIN_RATES, calculateQuoteBreakdown, calculateLogisticsDays, calculateTruckRates } from '@/lib/calculator-engine';
import { quotesService, settingsService } from '@/lib/firebase-service';

interface AppContextType {
  adminRates: AdminRates;
  updateAdminRates: (rates: Partial<AdminRates>) => Promise<void>;
  resetAdminRates: () => Promise<void>;
  savedQuotes: QuoteRecord[];
  saveQuote: (quote: Omit<QuoteRecord, 'id' | 'quoteNumber' | 'createdAt'>) => Promise<QuoteRecord>;
  updateQuoteStatus: (id: string, status: QuoteRecord['status']) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  duplicateQuote: (id: string) => Promise<QuoteRecord | null>;
  activeQuoteForPrint: QuoteRecord | null;
  setActiveQuoteForPrint: (quote: QuoteRecord | null) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  notification: string | null;
  showNotification: (msg: string) => void;
  isLoading: boolean;
  useFirebase: boolean;
  setUseFirebase: (use: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial sample quotes - empty by default
const SAMPLE_QUOTES: QuoteRecord[] = [];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminRates, setAdminRates] = useState<AdminRates>(DEFAULT_ADMIN_RATES);
  const [savedQuotes, setSavedQuotes] = useState<QuoteRecord[]>(SAMPLE_QUOTES);
  const [activeQuoteForPrint, setActiveQuoteForPrint] = useState<QuoteRecord | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [useFirebase, setUseFirebase] = useState<boolean>(false); // Default to localStorage for moving calculator

  // Load persisted admin rates & quotes from Firebase or localStorage
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (useFirebase) {
          // Try to load from Firebase
          const [firebaseRates, firebaseQuotes] = await Promise.all([
            settingsService.getAdminRates(),
            quotesService.getAllQuotes(),
          ]);

          if (firebaseRates) {
            setAdminRates(firebaseRates);
          }
          
          if (firebaseQuotes && firebaseQuotes.length > 0) {
            setSavedQuotes(firebaseQuotes);
          }
        } else {
          // Fallback to localStorage
          const storedRates = localStorage.getItem('ldm_admin_rates');
          if (storedRates) {
            setAdminRates(JSON.parse(storedRates));
          }
          const storedQuotes = localStorage.getItem('ldm_saved_quotes');
          if (storedQuotes) {
            setSavedQuotes(JSON.parse(storedQuotes));
          }
        }
      } catch (e) {
        console.warn('Error loading data from Firebase, falling back to localStorage:', e);
        // Fallback to localStorage on error
        try {
          const storedRates = localStorage.getItem('ldm_admin_rates');
          if (storedRates) {
            setAdminRates(JSON.parse(storedRates));
          }
          const storedQuotes = localStorage.getItem('ldm_saved_quotes');
          if (storedQuotes) {
            setSavedQuotes(JSON.parse(storedQuotes));
          }
        } catch (localError) {
          console.warn('LocalStorage error', localError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [useFirebase]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  const updateAdminRates = async (newRates: Partial<AdminRates>) => {
    const updated = { ...adminRates, ...newRates };
    setAdminRates(updated);
    
    try {
      if (useFirebase) {
        await settingsService.saveAdminRates(updated);
      }
      localStorage.setItem('ldm_admin_rates', JSON.stringify(updated));
      showNotification('Admin pricing settings saved successfully.');
    } catch (e) {
      console.error('Error saving admin rates:', e);
      showNotification('Failed to save admin settings.');
    }
  };

  const resetAdminRates = async () => {
    setAdminRates(DEFAULT_ADMIN_RATES);
    
    try {
      if (useFirebase) {
        await settingsService.saveAdminRates(DEFAULT_ADMIN_RATES);
      }
      localStorage.setItem('ldm_admin_rates', JSON.stringify(DEFAULT_ADMIN_RATES));
      showNotification('Admin settings reset to factory defaults.');
    } catch (e) {
      console.error('Error resetting admin rates:', e);
      showNotification('Failed to reset admin settings.');
    }
  };

  const saveQuote = async (quoteData: Omit<QuoteRecord, 'id' | 'quoteNumber' | 'createdAt'>): Promise<QuoteRecord> => {
    const nextSeq = savedQuotes.length + 1004;
    const newQuote: QuoteRecord = {
      ...quoteData,
      id: `quote-${Date.now()}`,
      quoteNumber: `LDM-2026-${nextSeq}`,
      createdAt: new Date().toISOString(),
    };

    try {
      if (useFirebase) {
        const firebaseQuote = await quotesService.createQuote(newQuote);
        setSavedQuotes((prev) => [firebaseQuote, ...prev]);
        showNotification(`Quote ${firebaseQuote.quoteNumber} created and saved.`);
        return firebaseQuote;
      } else {
        setSavedQuotes((prev) => {
          const list = [newQuote, ...prev];
          localStorage.setItem('ldm_saved_quotes', JSON.stringify(list));
          return list;
        });
        showNotification(`Quote ${newQuote.quoteNumber} created and saved.`);
        return newQuote;
      }
    } catch (e) {
      console.error('Error saving quote:', e);
      // Fallback to localStorage
      setSavedQuotes((prev) => {
        const list = [newQuote, ...prev];
        localStorage.setItem('ldm_saved_quotes', JSON.stringify(list));
        return list;
      });
      showNotification(`Quote ${newQuote.quoteNumber} created (saved locally).`);
      return newQuote;
    }
  };

  const updateQuoteStatus = async (id: string, status: QuoteRecord['status']) => {
    try {
      if (useFirebase) {
        await quotesService.updateQuoteStatus(id, status);
      }
      
      setSavedQuotes((prev) => {
        const updated = prev.map((q) => (q.id === id ? { ...q, status } : q));
        localStorage.setItem('ldm_saved_quotes', JSON.stringify(updated));
        return updated;
      });
      showNotification(`Quote status updated to ${status}.`);
    } catch (e) {
      console.error('Error updating quote status:', e);
      showNotification('Failed to update quote status.');
    }
  };

  const deleteQuote = async (id: string) => {
    try {
      if (useFirebase) {
        await quotesService.deleteQuote(id);
      }
      
      setSavedQuotes((prev) => {
        const filtered = prev.filter((q) => q.id !== id);
        localStorage.setItem('ldm_saved_quotes', JSON.stringify(filtered));
        return filtered;
      });
      showNotification('Quote deleted.');
    } catch (e) {
      console.error('Error deleting quote:', e);
      showNotification('Failed to delete quote.');
    }
  };

  const duplicateQuote = async (id: string): Promise<QuoteRecord | null> => {
    const target = savedQuotes.find((q) => q.id === id);
    if (!target) return null;

    const duplicated = await saveQuote({
      customer: { ...target.customer, name: `${target.customer.name} (Copy)` },
      route: { ...target.route },
      truck: { ...target.truck },
      ratesUsed: { ...target.ratesUsed },
      breakdown: { ...target.breakdown },
      status: 'Draft',
    });
    showNotification(`Duplicated as ${duplicated.quoteNumber}`);
    return duplicated;
  };

  return (
    <AppContext.Provider
      value={{
        adminRates,
        updateAdminRates,
        resetAdminRates,
        savedQuotes,
        saveQuote,
        updateQuoteStatus,
        deleteQuote,
        duplicateQuote,
        activeQuoteForPrint,
        setActiveQuoteForPrint,
        isDarkMode,
        toggleDarkMode,
        notification,
        showNotification,
        isLoading,
        useFirebase,
        setUseFirebase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
