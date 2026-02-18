import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersAPI } from '../api/client';
import { Customer } from '../types';

export function useCustomers() {
    const queryClient = useQueryClient();

    const { data: customers = [], isLoading: loading, error, refetch } = useQuery({
        queryKey: ['customers'],
        queryFn: () => customersAPI.getAll(),
        refetchInterval: 60000,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => customersAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        }
    });

    return {
        customers,
        loading,
        error: error ? error.message : null,
        refetch,
        deleteCustomer: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending,
    };
}
