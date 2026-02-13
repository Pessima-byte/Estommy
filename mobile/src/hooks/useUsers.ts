import { useState, useEffect } from 'react';
import { usersAPI } from '../api/client';
import { User } from '../types';

export function useUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    async function loadUsers() {
        try {
            setLoading(true);
            const data = await usersAPI.getAll();
            setUsers(data);
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to fetch users');
            // Mock default admin user if API fails
            setUsers([
                { id: 'admin1', name: 'Admin Shell', role: 'ADMIN', email: 'admin@estommy.com', status: 'ACTIVE', createdAt: '', updatedAt: '' },
                { id: 'user1', name: 'Sales Rep 1', role: 'USER', email: 'sales@estommy.com', status: 'ACTIVE', createdAt: '', updatedAt: '' },
            ]);
        } finally {
            setLoading(false);
        }
    }

    return { users, loading, error, refetch: loadUsers };
}
