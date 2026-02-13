import { useQuery } from '@tanstack/react-query';
import { activitiesAPI } from '../api/client';

export function useActivities(params?: { limit?: number, entityType?: string, action?: string }) {
    const { data: activities = [], isLoading: loading, error, refetch } = useQuery({
        queryKey: ['activities', params],
        queryFn: () => activitiesAPI.getAll(params),
        refetchInterval: 20000,
    });

    return {
        activities,
        loading,
        error: error ? error.message : null,
        refetch
    };
}
