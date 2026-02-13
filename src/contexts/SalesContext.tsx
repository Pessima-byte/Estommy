"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { salesAPI } from "@/lib/api";
import { ActivityLogger } from "@/lib/activityLogger";

const SalesContext = createContext({
  sales: [] as any[],
  addSale: async (sale: any) => { },
  editSale: async (id: string, updates: any) => { },
  deleteSale: async (id: string) => { },
  loading: true,
  error: null as string | null,
});

export function SalesProvider({ children }: { children: React.ReactNode }) {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSales();
    // Background polling for real-time sync
    const interval = setInterval(() => loadSales(true), 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadSales(silent = false) {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await salesAPI.getAll();
      setSales(data as any[]);
    } catch (err: any) {
      if (!silent) setError(err.message || 'Failed to load sales');
      console.error('Error loading sales:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function addSale(sale: any) {
    try {
      setError(null);
      const newSale = await salesAPI.create(sale) as any;
      setSales((prev) => [...prev, newSale]);
      const description = `${newSale.product?.name || newSale.product} - ${newSale.customer?.name || newSale.customer}`;
      ActivityLogger.sale.created(description, newSale.id, newSale.amount);
      return newSale;
    } catch (err: any) {
      setError(err.message || 'Failed to add sale');
      throw err;
    }
  }

  async function editSale(id: string, updates: any) {
    try {
      setError(null);
      const updatedSale = await salesAPI.update(id, updates) as any;
      setSales((prev) =>
        prev.map((s) => (s.id === id ? updatedSale : s))
      );
      const description = `${updatedSale.product?.name || updatedSale.product} - ${updatedSale.customer?.name || updatedSale.customer}`;
      ActivityLogger.sale.updated(description, updatedSale.id);
      return updatedSale;
    } catch (err: any) {
      setError(err.message || 'Failed to update sale');
      throw err;
    }
  }

  async function deleteSale(id: string) {
    try {
      setError(null);
      const sale = sales.find(s => s.id === id);
      await salesAPI.delete(id);
      setSales((prev) => prev.filter((s) => s.id !== id));
      if (sale) {
        const description = `${sale.product?.name || sale.product} - ${sale.customer?.name || sale.customer}`;
        ActivityLogger.sale.deleted(description, id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete sale');
      throw err;
    }
  }

  return (
    <SalesContext.Provider value={{ sales, addSale, editSale, deleteSale, loading, error }}>
      {children}
    </SalesContext.Provider>
  );
}

export function useSales() {
  return useContext(SalesContext);
} 