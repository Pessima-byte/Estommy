import { useQuery } from '@tanstack/react-query';
import { salesAPI } from '../api/client';
import { Sale } from '../types';

export function useSales() {
    const { data: sales = [], isLoading: loading, error, refetch } = useQuery({
        queryKey: ['sales'],
        queryFn: () => salesAPI.getAll(),
        refetchInterval: 15000, // Reduced from 3s to 15s for better battery/data efficiency
    });

    return {
        sales,
        loading,
        error: error ? error.message : null,
        refetch
    };
}
