import { useQuery } from '@tanstack/react-query';
import { customersAPI } from '../api/client';
import { Customer } from '../types';

export function useDebtors() {
    const { data: customers = [], isLoading: loading, error, refetch } = useQuery({
        queryKey: ['customers'],
        queryFn: () => customersAPI.getAll(),
        refetchInterval: 15000,
    });

    const debtors = customers.filter((c: Customer) => (c.totalDebt || 0) > 0);

    return {
        debtors,
        loading,
        error: error ? (error as any).message : null,
        refetch
    };
}
