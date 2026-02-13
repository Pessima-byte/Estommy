"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { customersAPI } from "@/lib/api";

const DebtorsContext = createContext({
    debtors: [] as any[],
    loading: true,
    error: null as string | null,
    refreshDebtors: async () => { },
});

export function DebtorsProvider({ children }: { children: React.ReactNode }) {
    const [debtors, setDebtors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDebtors();
    }, []);

    async function loadDebtors() {
        try {
            setLoading(true);
            setError(null);
            const allCustomers = await customersAPI.getAll();
            // Filter customers who have a totalDebt > 0
            const debtorsList = allCustomers.filter((c: any) => c.totalDebt && c.totalDebt > 0);
            setDebtors(debtorsList);
        } catch (err: any) {
            setError(err.message || 'Failed to load debtors');
            console.error('Error loading debtors:', err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <DebtorsContext.Provider value={{ debtors, loading, error, refreshDebtors: loadDebtors }}>
            {children}
        </DebtorsContext.Provider>
    );
}

export function useDebtors() {
    return useContext(DebtorsContext);
}
