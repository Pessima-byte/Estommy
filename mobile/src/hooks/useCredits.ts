import { useQuery } from '@tanstack/react-query';
import { creditsAPI } from '../api/client';

export function useCredits() {
    const {
        data: credits = [],
        isLoading: loading,
        error,
        refetch
    } = useQuery({
        queryKey: ['credits'],
        queryFn: async () => {
            const data = await creditsAPI.getAll();
            return data.map((c: any) => ({
                ...c,
                liability: c.amount - (c.amountPaid || 0),
                customerName: c.customer?.name || 'Unknown Client'
            }));
        },
        refetchInterval: 15000, // Sync every 15 seconds
    });

    return {
        credits,
        loading,
        error: error ? (error as any).message : null,
        refetch
    };
}
