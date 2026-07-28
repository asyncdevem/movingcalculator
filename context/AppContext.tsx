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

// Initial sample quotes for rich UI demonstration
const SAMPLE_QUOTES: QuoteRecord[] = [
  {
    id: 'quote-1001',
    quoteNumber: 'LDM-2026-1001',
    createdAt: '2026-07-24T14:30:00Z',
    customer: {
      id: 'cust-1',
      name: 'Robert Davis',
      phone: '(555) 234-5678',
      email: 'robert.davis@example.com',
      moveDate: '2026-08-15',
      notes: 'Residential 3-bedroom house move.',
    },
    route: {
      pickupAddress: 'New York, NY',
      deliveryAddress: 'Miami, FL',
      distanceMiles: 1280,
      durationHours: 19.5,
      drivingDays: 2,
      hotelNights: 1,
    },
    truck: {
      type: '26 ft Box Truck',
      count: 1,
      uhaulRatePerTruck: 2846,
      penskeRatePerTruck: 2888,
      selectedProvider: 'U-Haul',
    },
    ratesUsed: DEFAULT_ADMIN_RATES,
    breakdown: {
      driverPay: 640,
      fuelCost: 704,
      hotelCost: 200,
      loadingCost: 600,
      unloadingCost: 600,
      laborCost: 1200,
      flightCost: 300,
      truckRentalCost: 2846,
      subtotal: 5690,
      profitAmount: 1707,
      grandTotal: 7397,
    },
    status: 'Accepted',
  },
  {
    id: 'quote-1002',
    quoteNumber: 'LDM-2026-1002',
    createdAt: '2026-07-25T09:15:00Z',
    customer: {
      id: 'cust-2',
      name: 'Sarah Jenkins',
      phone: '(555) 987-6543',
      email: 'sjenkins@techcorp.io',
      moveDate: '2026-09-01',
      notes: 'Corporate relocation. Requires 2 trucks.',
    },
    route: {
      pickupAddress: 'Los Angeles, CA',
      deliveryAddress: 'Dallas, TX',
      distanceMiles: 1435,
      durationHours: 21.0,
      drivingDays: 2,
      hotelNights: 1,
    },
    truck: {
      type: '26 ft Box Truck',
      count: 2,
      uhaulRatePerTruck: 3148,
      penskeRatePerTruck: 3175,
      selectedProvider: 'U-Haul',
    },
    ratesUsed: DEFAULT_ADMIN_RATES,
    breakdown: {
      driverPay: 1435,
      fuelCost: 1579,
      hotelCost: 400,
      loadingCost: 1200,
      unloadingCost: 1200,
      laborCost: 2400,
      flightCost: 300,
      truckRentalCost: 6296,
      subtotal: 12410,
      profitAmount: 3723,
      grandTotal: 16133,
    },
    status: 'Sent',
  },
  {
    id: 'quote-1003',
    quoteNumber: 'LDM-2026-1003',
    createdAt: '2026-07-25T11:45:00Z',
    customer: {
      id: 'cust-3',
      name: 'Michael Miller',
      phone: '(555) 456-7890',
      email: 'm.miller@gmail.com',
      moveDate: '2026-08-20',
      notes: '2-bedroom condo.',
    },
    route: {
      pickupAddress: 'Chicago, IL',
      deliveryAddress: 'Houston, TX',
      distanceMiles: 1084,
      durationHours: 16.5,
      drivingDays: 2,
      hotelNights: 1,
    },
    truck: {
      type: '26 ft Box Truck',
      count: 1,
      uhaulRatePerTruck: 2464,
      penskeRatePerTruck: 2525,
      selectedProvider: 'U-Haul',
    },
    ratesUsed: DEFAULT_ADMIN_RATES,
    breakdown: {
      driverPay: 542,
      fuelCost: 596,
      hotelCost: 200,
      loadingCost: 600,
      unloadingCost: 600,
      laborCost: 1200,
      flightCost: 300,
      truckRentalCost: 2464,
      subtotal: 5302,
      profitAmount: 1591,
      grandTotal: 6893,
    },
    status: 'Draft',
  },
];

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
