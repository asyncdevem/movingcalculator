'use client';

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase-config';
import { QuoteRecord, AdminRates, CustomerInfo } from '@/types/calculator';

// Collection names
const QUOTES_COLLECTION = 'quotes';
const CUSTOMERS_COLLECTION = 'customers';
const SETTINGS_COLLECTION = 'settings';

// Helper to convert Firestore timestamp to ISO string
const timestampToISO = (timestamp: any): string => {
  if (timestamp?.toDate) {
    return timestamp.toDate().toISOString();
  }
  return new Date().toISOString();
};

// Quotes Service
export const quotesService = {
  // Create a new quote
  async createQuote(quote: Omit<QuoteRecord, 'id'>): Promise<QuoteRecord> {
    try {
      const docRef = await addDoc(collection(db, QUOTES_COLLECTION), {
        ...quote,
        createdAt: Timestamp.now(),
      });
      
      return {
        ...quote,
        id: docRef.id,
      };
    } catch (error) {
      console.error('Error creating quote:', error);
      throw new Error('Failed to create quote');
    }
  },

  // Get all quotes
  async getAllQuotes(): Promise<QuoteRecord[]> {
    try {
      const q = query(
        collection(db, QUOTES_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: timestampToISO(data.createdAt),
        } as QuoteRecord;
      });
    } catch (error) {
      console.error('Error fetching quotes:', error);
      throw new Error('Failed to fetch quotes');
    }
  },

  // Get quote by ID
  async getQuoteById(id: string): Promise<QuoteRecord | null> {
    try {
      const docRef = doc(db, QUOTES_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          id: docSnap.id,
          createdAt: timestampToISO(data.createdAt),
        } as QuoteRecord;
      }
      return null;
    } catch (error) {
      console.error('Error fetching quote:', error);
      throw new Error('Failed to fetch quote');
    }
  },

  // Update quote status
  async updateQuoteStatus(id: string, status: QuoteRecord['status']): Promise<void> {
    try {
      const docRef = doc(db, QUOTES_COLLECTION, id);
      await updateDoc(docRef, { status });
    } catch (error) {
      console.error('Error updating quote status:', error);
      throw new Error('Failed to update quote status');
    }
  },

  // Update entire quote
  async updateQuote(id: string, updates: Partial<QuoteRecord>): Promise<void> {
    try {
      const docRef = doc(db, QUOTES_COLLECTION, id);
      await updateDoc(docRef, updates as DocumentData);
    } catch (error) {
      console.error('Error updating quote:', error);
      throw new Error('Failed to update quote');
    }
  },

  // Delete quote
  async deleteQuote(id: string): Promise<void> {
    try {
      const docRef = doc(db, QUOTES_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting quote:', error);
      throw new Error('Failed to delete quote');
    }
  },

  // Get quotes by customer
  async getQuotesByCustomer(customerId: string): Promise<QuoteRecord[]> {
    try {
      const q = query(
        collection(db, QUOTES_COLLECTION),
        where('customer.id', '==', customerId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: timestampToISO(data.createdAt),
        } as QuoteRecord;
      });
    } catch (error) {
      console.error('Error fetching customer quotes:', error);
      throw new Error('Failed to fetch customer quotes');
    }
  },

  // Get quotes by status
  async getQuotesByStatus(status: QuoteRecord['status']): Promise<QuoteRecord[]> {
    try {
      const q = query(
        collection(db, QUOTES_COLLECTION),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: timestampToISO(data.createdAt),
        } as QuoteRecord;
      });
    } catch (error) {
      console.error('Error fetching quotes by status:', error);
      throw new Error('Failed to fetch quotes by status');
    }
  },
};

// Customers Service
export const customersService = {
  // Create a new customer
  async createCustomer(customer: Omit<CustomerInfo, 'id'>): Promise<CustomerInfo> {
    try {
      const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), {
        ...customer,
        createdAt: Timestamp.now(),
      });
      
      return {
        ...customer,
        id: docRef.id,
      };
    } catch (error) {
      console.error('Error creating customer:', error);
      throw new Error('Failed to create customer');
    }
  },

  // Get all customers
  async getAllCustomers(): Promise<CustomerInfo[]> {
    try {
      const querySnapshot = await getDocs(collection(db, CUSTOMERS_COLLECTION));
      
      return querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as CustomerInfo[];
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw new Error('Failed to fetch customers');
    }
  },

  // Get customer by ID
  async getCustomerById(id: string): Promise<CustomerInfo | null> {
    try {
      const docRef = doc(db, CUSTOMERS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          ...docSnap.data(),
          id: docSnap.id,
        } as CustomerInfo;
      }
      return null;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw new Error('Failed to fetch customer');
    }
  },

  // Update customer
  async updateCustomer(id: string, updates: Partial<CustomerInfo>): Promise<void> {
    try {
      const docRef = doc(db, CUSTOMERS_COLLECTION, id);
      await updateDoc(docRef, updates as DocumentData);
    } catch (error) {
      console.error('Error updating customer:', error);
      throw new Error('Failed to update customer');
    }
  },

  // Delete customer
  async deleteCustomer(id: string): Promise<void> {
    try {
      const docRef = doc(db, CUSTOMERS_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw new Error('Failed to delete customer');
    }
  },

  // Search customers by name or email
  async searchCustomers(searchTerm: string): Promise<CustomerInfo[]> {
    try {
      const querySnapshot = await getDocs(collection(db, CUSTOMERS_COLLECTION));
      const term = searchTerm.toLowerCase();
      
      const customers = querySnapshot.docs
        .map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as CustomerInfo[];
      
      return customers.filter((customer) =>
        customer.name.toLowerCase().includes(term) ||
        customer.email?.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error searching customers:', error);
      throw new Error('Failed to search customers');
    }
  },
};

// Settings Service
export const settingsService = {
  // Save admin rates
  async saveAdminRates(rates: AdminRates): Promise<void> {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, 'adminRates');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, rates as DocumentData);
      } else {
        await addDoc(collection(db, SETTINGS_COLLECTION), {
          ...rates,
          id: 'adminRates',
        });
      }
    } catch (error) {
      console.error('Error saving admin rates:', error);
      throw new Error('Failed to save admin rates');
    }
  },

  // Get admin rates
  async getAdminRates(): Promise<AdminRates | null> {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, 'adminRates');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as AdminRates;
      }
      return null;
    } catch (error) {
      console.error('Error fetching admin rates:', error);
      throw new Error('Failed to fetch admin rates');
    }
  },
};
