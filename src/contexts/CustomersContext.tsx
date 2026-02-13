"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { customersAPI } from "@/lib/api";
import { ActivityLogger } from "@/lib/activityLogger";

const CustomersContext = createContext({
  customers: [] as any[],
  addCustomer: async (customer: any) => { return {} as any },
  editCustomer: async (id: string, updates: any) => { return {} as any },
  deleteCustomer: async (id: string) => { },
  refreshCustomers: async () => { },
  loading: true,
  error: null as string | null,
});

export function CustomersProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
    // Background polling for real-time sync
    const interval = setInterval(() => loadCustomers(true), 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadCustomers(silent = false) {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await customersAPI.getAll();
      setCustomers(data);
    } catch (err: any) {
      if (!silent) setError(err.message || 'Failed to load customers');
      console.error('Error loading customers:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function addCustomer(customer: any) {
    try {
      setError(null);
      // Use gender-based avatar if no custom avatar is provided
      let avatarUrl = customer.avatar;
      if (!avatarUrl || avatarUrl.trim() === '') {
        const genderLower = customer.gender?.toLowerCase();
        if (genderLower === 'female') {
          avatarUrl = '/female-avatar.png';
        } else if (genderLower === 'other') {
          avatarUrl = '/other-avatar.png';
        } else {
          avatarUrl = '/male-avatar.png'; // Default to male avatar
        }
      }

      const newCustomer = await customersAPI.create({
        ...customer,
        avatar: avatarUrl,
      });
      setCustomers((prev) => [...prev, newCustomer]);
      ActivityLogger.customer.created(newCustomer.name, newCustomer.id);
      return newCustomer;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to add customer';
      // Don't set error or log for duplicate cases - let the UI handle it with friendly message
      if (!errorMessage.includes('already exists')) {
        setError(errorMessage);
        console.error('Error adding customer:', err);
      }
      throw err;
    }
  }

  async function editCustomer(id: string, updates: any) {
    try {
      setError(null);
      // Update avatar based on gender if no custom avatar is provided
      let avatarUrl = updates.avatar;
      if (!avatarUrl || avatarUrl.trim() === '' ||
        updates.avatar?.includes('randomuser.me') ||
        updates.avatar?.includes('dicebear.com') ||
        updates.avatar?.includes('ui-avatars.com') ||
        updates.avatar?.includes('pravatar.cc')) {
        // Use gender-based avatar
        const genderLower = updates.gender?.toLowerCase();
        if (genderLower === 'female') {
          avatarUrl = '/female-avatar.png';
        } else if (genderLower === 'other') {
          avatarUrl = '/other-avatar.png';
        } else {
          avatarUrl = '/male-avatar.png'; // Default to male avatar
        }
      }

      // Ensure all required fields are present
      const updatePayload = {
        ...updates,
        avatar: avatarUrl,
      };

      const updatedCustomer = await customersAPI.update(id, updatePayload);
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? updatedCustomer : c))
      );
      ActivityLogger.customer.updated(updatedCustomer.name, updatedCustomer.id);
      return updatedCustomer;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update customer';
      setError(errorMessage);
      console.error('Error updating customer:', err);
      throw err;
    }
  }

  async function deleteCustomer(id: string) {
    try {
      setError(null);
      const customer = customers.find(c => c.id === id);
      await customersAPI.delete(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      if (customer) {
        ActivityLogger.customer.deleted(customer.name, id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete customer');
      throw err;
    }
  }

  return (
    <CustomersContext.Provider value={{ customers, addCustomer, editCustomer, deleteCustomer, refreshCustomers: loadCustomers, loading, error }}>
      {children}
    </CustomersContext.Provider>
  );
}

export function useCustomers() {
  return useContext(CustomersContext);
} 