"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { creditsAPI, profitsAPI } from "@/lib/api";
import { ActivityLogger } from "@/lib/activityLogger";

const CreditsContext = createContext({
  credits: [] as any[],
  addCredit: async (credit: any) => { },
  editCredit: async (id: string, updates: any) => { },
  deleteCredit: async (id: string) => { },
  addRepayment: async (id: string, amount: number, notes?: string) => { },
  loading: true,
  error: null as string | null,
});

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCredits();
  }, []);

  async function loadCredits() {
    try {
      setLoading(true);
      setError(null);
      const data = await creditsAPI.getAll();
      setCredits(data as any[]);
    } catch (err: any) {
      setError(err.message || 'Failed to load credits');
      console.error('Error loading credits:', err);
    } finally {
      setLoading(false);
    }
  }

  async function addCredit(credit: any) {
    try {
      setError(null);
      const newCreditResponse = await creditsAPI.create({
        ...credit,
        amountPaid: 0 // Initialize amountPaid
      }) as any;

      // Ensure we have an ID
      const newCredit = {
        ...newCreditResponse,
        id: newCreditResponse.id || crypto.randomUUID() || Date.now().toString()
      };

      if (!newCreditResponse.id) {
        console.warn('API did not return an ID for new credit, generated temporary ID:', newCredit.id);
      }

      setCredits((prev) => [...prev, newCredit]);
      ActivityLogger.credit.created(newCredit.customer?.name || newCredit.customer, newCredit.id, newCredit.amount);
      return newCredit;
    } catch (err: any) {
      setError(err.message || 'Failed to add credit');
      throw err;
    }
  }

  async function editCredit(id: string, updates: any) {
    try {
      setError(null);
      const updatedCreditResponse = await creditsAPI.update(id, updates) as any;
      // Ensure we preserve the ID and other fields if the API returns a partial object
      const updatedCredit = { ...credits.find(c => c.id === id), ...updatedCreditResponse, id };

      setCredits((prev) =>
        prev.map((c) => (c.id === id ? updatedCredit : c))
      );
      ActivityLogger.credit.updated(updatedCredit.customer?.name || updatedCredit.customer, updatedCredit.id);
      return updatedCredit;
    } catch (err: any) {
      setError(err.message || 'Failed to update credit');
      throw err;
    }
  }

  async function addRepayment(id: string, amount: number, notes?: string) {
    try {
      setError(null);

      const creditToUpdate = credits.find(c => c.id === id);
      if (!creditToUpdate) throw new Error('Credit record not found');

      const currentPaid = creditToUpdate.amountPaid || 0;
      const newAmountPaid = currentPaid + amount;
      const remaining = creditToUpdate.amount - newAmountPaid;

      // Determine status
      let newStatus = creditToUpdate.status;
      if (remaining <= 0) {
        newStatus = 'Paid';
      } else if (newAmountPaid > 0) {
        newStatus = 'Partial';
      }

      // 1. Update the Credit Record
      const updatedCreditResponse = await creditsAPI.update(id, {
        amountPaid: newAmountPaid,
        status: newStatus,
        notes: notes ? `${creditToUpdate.notes || ''}\nRepayment (${new Date().toLocaleDateString()}): ${amount} LE - ${notes}` : creditToUpdate.notes
      }) as any;

      // Safe update
      const updatedCredit = { ...creditToUpdate, ...updatedCreditResponse, amountPaid: newAmountPaid, status: newStatus, id };

      setCredits((prev) =>
        prev.map((c) => (c.id === id ? updatedCredit : c))
      );

      // 2. Log as Income (Profit)
      await profitsAPI.create({
        date: new Date().toISOString().split('T')[0],
        amount: amount,
        type: 'Income',
        description: `Credit Repayment - ${creditToUpdate.customer?.name || 'Unknown Debtor'}`,
        notes: `Repayment for credit record ${id}. ${notes || ''}`
      });

      ActivityLogger.credit.updated(creditToUpdate.customer?.name || creditToUpdate.customer, id);
      return updatedCredit;

    } catch (err: any) {
      setError(err.message || 'Failed to record repayment');
      throw err;
    }
  }

  async function deleteCredit(id: string) {
    try {
      setError(null);
      const credit = credits.find(c => c.id === id);
      await creditsAPI.delete(id);
      setCredits((prev) => prev.filter((c) => c.id !== id));
      if (credit) {
        ActivityLogger.credit.deleted(credit.customer?.name || credit.customer, id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete credit');
      throw err;
    }
  }

  return (
    <CreditsContext.Provider value={{ credits, addCredit, editCredit, deleteCredit, addRepayment, loading, error }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  return useContext(CreditsContext);
}

