import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI, getImageUrl } from '../api/client';
import { Product } from '../types';

export function useProducts() {
    const queryClient = useQueryClient();

    const { data: products = [], isLoading: loading, error, refetch } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const data = await productsAPI.getAll();
            return data.map((p: any) => ({
                ...p,
                image: getImageUrl(p.image)
            }));
        },
        refetchInterval: 60000,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => productsAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
    });

    return {
        products,
        loading,
        error: error ? (error as any).message : null,
        refetch,
        deleteProduct: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending
    };
}
