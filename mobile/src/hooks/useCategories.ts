import { useQuery } from '@tanstack/react-query';
import { categoriesAPI } from '../api/client';

export function useCategories() {
    const { data: categories = [], isLoading: loading, error, refetch } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoriesAPI.getAll(),
    });

    return {
        categories,
        loading,
        error: error ? error.message : null,
        refetch
    };
}
