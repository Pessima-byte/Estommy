"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { profitsAPI } from "@/lib/api";
import { ActivityLogger } from "@/lib/activityLogger";

const ProfitsContext = createContext({
  profits: [] as any[],
  addProfit: async (profit: any) => {},
  editProfit: async (id: string, updates: any) => {},
  deleteProfit: async (id: string) => {},
  loading: true,
  error: null as string | null,
});

export function ProfitsProvider({ children }: { children: React.ReactNode }) {
  const [profits, setProfits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfits();
  }, []);

  async function loadProfits() {
    try {
      setLoading(true);
      setError(null);
      const data = await profitsAPI.getAll();
      setProfits(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load profits');
      console.error('Error loading profits:', err);
    } finally {
      setLoading(false);
    }
  }

  async function addProfit(profit: any) {
    try {
      setError(null);
      const newProfit = await profitsAPI.create(profit);
      setProfits((prev) => [...prev, newProfit]);
      const description = newProfit.description || `${newProfit.type} - $${newProfit.amount.toFixed(2)}`;
      ActivityLogger.profit.created(description, newProfit.id, newProfit.amount);
      return newProfit;
    } catch (err: any) {
      setError(err.message || 'Failed to add profit');
      throw err;
    }
  }

  async function editProfit(id: string, updates: any) {
    try {
      setError(null);
      const updatedProfit = await profitsAPI.update(id, updates);
      setProfits((prev) =>
        prev.map((p) => (p.id === id ? updatedProfit : p))
      );
      const description = updatedProfit.description || `${updatedProfit.type} - $${updatedProfit.amount.toFixed(2)}`;
      ActivityLogger.profit.updated(description, updatedProfit.id);
      return updatedProfit;
    } catch (err: any) {
      setError(err.message || 'Failed to update profit');
      throw err;
    }
  }

  async function deleteProfit(id: string) {
    try {
      setError(null);
      const profit = profits.find(p => p.id === id);
      await profitsAPI.delete(id);
      setProfits((prev) => prev.filter((p) => p.id !== id));
      if (profit) {
        const description = profit.description || `${profit.type} - $${profit.amount.toFixed(2)}`;
        ActivityLogger.profit.deleted(description, id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete profit');
      throw err;
    }
  }

  return (
    <ProfitsContext.Provider value={{ profits, addProfit, editProfit, deleteProfit, loading, error }}>
      {children}
    </ProfitsContext.Provider>
  );
}

export function useProfits() {
  return useContext(ProfitsContext);
}

