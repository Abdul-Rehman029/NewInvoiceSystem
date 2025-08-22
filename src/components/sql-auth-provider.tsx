"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import type { User, Customer, Product, Invoice } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type AuthContextType = {
  user: User | null;
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  createUser: (email: string, password: string) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'userId'>) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'userId'>) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'userId'>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const ADMIN_EMAIL = 'admin@fbr.gov.pk';

export function SqlAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load customers
  const loadCustomers = useCallback(async (userId: string) => {
    try {
      const response = await fetch('/api/customers', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  }, []);

  // Load products
  const loadProducts = useCallback(async (userId: string) => {
    try {
      const response = await fetch('/api/products', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }, []);

  // Load invoices
  const loadInvoices = useCallback(async (userId: string) => {
    try {
      const response = await fetch('/api/invoices', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Failed to load invoices:', error);
    }
  }, []);

  // Check authentication status on mount
  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        
        // Load user data in parallel
        await Promise.all([
          loadCustomers(data.user.id),
          loadProducts(data.user.id),
          loadInvoices(data.user.id)
        ]);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [loadCustomers, loadProducts, loadInvoices]);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.user) {
        setUser(data.user);
        
        // Load user data in parallel
        await Promise.all([
          loadCustomers(data.user.id),
          loadProducts(data.user.id),
          loadInvoices(data.user.id)
        ]);
        
        return true;
      } else {
        toast({
          title: 'Login Failed',
          description: data.error || 'Invalid credentials',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: 'An error occurred during login',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast, loadCustomers, loadProducts, loadInvoices]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setCustomers([]);
      setProducts([]);
      setInvoices([]);
    }
  }, []);

  // Create user function
  const createUser = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: email.split('@')[0], 
          email, 
          password,
          role: email === ADMIN_EMAIL ? 'admin' : 'user'
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'User Created',
          description: `Successfully created account for ${email}`,
        });
      } else {
        throw new Error(data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Create user error:', error);
      toast({
        title: 'Creation Failed',
        description: error instanceof Error ? error.message : 'Failed to create user',
        variant: 'destructive'
      });
      throw error;
    }
  }, [toast]);

  // Add customer function
  const addCustomer = useCallback(async (customerData: Omit<Customer, 'id' | 'userId'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setCustomers(prev => [...prev, data.customer]);
        toast({
          title: 'Customer Added',
          description: `${customerData.name} has been saved.`,
        });
      } else {
        throw new Error(data.error || 'Failed to add customer');
      }
    } catch (error) {
      console.error('Add customer error:', error);
      toast({
        title: 'Error',
        description: 'Could not save the customer.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [user, toast]);

  // Add product function
  const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'userId'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setProducts(prev => [...prev, data.product]);
        toast({
          title: 'Product Added',
          description: `${productData.name} has been saved.`,
        });
      } else {
        throw new Error(data.error || 'Failed to add product');
      }
    } catch (error) {
      console.error('Add product error:', error);
      toast({
        title: 'Error',
        description: 'Could not save the product.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [user, toast]);

  // Add invoice function
  const addInvoice = useCallback(async (invoiceData: Omit<Invoice, 'id' | 'userId'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setInvoices(prev => [...prev, data.invoice]);
        toast({
          title: 'Invoice Created',
          description: `Invoice ${data.invoice.id} has been created.`,
        });
      } else {
        throw new Error(data.error || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Add invoice error:', error);
      toast({
        title: 'Error',
        description: 'Could not create the invoice.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [user, toast]);

  // Memoized values to prevent unnecessary re-renders
  const isAuthenticated = useMemo(() => !!user, [user]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const contextValue = useMemo(() => ({
    user,
    customers,
    products,
    invoices,
    isAuthenticated,
    isLoading,
    logout,
    login,
    createUser,
    addCustomer,
    addProduct,
    addInvoice,
  }), [user, customers, products, invoices, isAuthenticated, isLoading, logout, login, createUser, addCustomer, addProduct, addInvoice]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSqlAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSqlAuth must be used within a SqlAuthProvider');
  }
  return context;
}
