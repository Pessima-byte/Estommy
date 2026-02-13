import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileAPI, getImageUrl } from '../api/client';

export function useProfile() {
    const queryClient = useQueryClient();

    const { data: user, isLoading: loading, error, refetch } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const data = await profileAPI.get();
            return {
                ...data,
                image: getImageUrl(data.image)
            };
        },
        refetchInterval: 30000,
    });

    const updateProfileMutation = useMutation({
        mutationFn: (data: any) => profileAPI.update(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        }
    });

    return {
        user,
        loading,
        error: error ? error.message : null,
        refetch,
        updateProfile: updateProfileMutation.mutateAsync,
        updating: updateProfileMutation.isPending
    };
}
