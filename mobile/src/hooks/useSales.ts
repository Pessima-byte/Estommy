import { useQuery } from '@tanstack/react-query';
import { salesAPI } from '../api/client';
import { Sale } from '../types';

export function useSales() {
    const { data: sales = [], isLoading: loading, error, refetch } = useQuery({
        queryKey: ['sales'],
        queryFn: () => salesAPI.getAll(),
        refetchInterval: 60000,
    });

    return {
        sales,
        loading,
        error: error ? error.message : null,
        refetch
    };
}
