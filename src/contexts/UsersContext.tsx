"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { usersAPI } from "@/lib/api";
import { ActivityLogger } from "@/lib/activityLogger";
import { useSession } from "next-auth/react";

const UsersContext = createContext({
    users: [] as any[],
    addUser: async (user: any) => { },
    editUser: async (id: string, updates: any) => { },
    deleteUser: async (id: string) => { },
    loading: true,
    error: null as string | null,
    refreshUsers: async () => { },
});

export function UsersProvider({ children }: { children: React.ReactNode }) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { data: session } = useSession();

    // Ideally, only load if user is admin, but the API will block non-admins anyway.
    // We can let the API handle the error or check session role here.
    const isAdmin = session?.user?.role === 'ADMIN';

    useEffect(() => {
        if (isAdmin) {
            loadUsers();
        } else {
            setLoading(false);
        }
    }, [isAdmin]);

    async function loadUsers() {
        try {
            setLoading(true);
            setError(null);
            const data = await usersAPI.getAll();
            if (Array.isArray(data)) {
                setUsers(data);
            } else {
                // If error returned as object
                console.error("Failed to load users:", data);
                setUsers([]);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load users');
            console.error('Error loading users:', err);
        } finally {
            setLoading(false);
        }
    }

    async function addUser(user: any) {
        try {
            setError(null);
            const newUserResponse = await usersAPI.create(user) as any;
            setUsers((prev) => [newUserResponse, ...prev]);
            ActivityLogger.user.created(newUserResponse.name, newUserResponse.id);
            return newUserResponse;
        } catch (err: any) {
            setError(err.message || 'Failed to add user');
            throw err;
        }
    }

    async function editUser(id: string, updates: any) {
        try {
            setError(null);
            const updatedUserResponse = await usersAPI.update(id, updates) as any;
            setUsers((prev) =>
                prev.map((u) => (u.id === id ? updatedUserResponse : u))
            );
            // ActivityLogger doesn't have a user.updated method explicitly shown in previous contexts, 
            // but we can assume generic structure or skip if not critical. 
            // Checking ActivityLog structure from context... it has entityType USER.
            // I'll assume I can log it.
            // Actually ActivityLogger might verify types.
            return updatedUserResponse;
        } catch (err: any) {
            setError(err.message || 'Failed to update user');
            throw err;
        }
    }

    async function deleteUser(id: string) {
        try {
            setError(null);
            const user = users.find(u => u.id === id);
            await usersAPI.delete(id);
            setUsers((prev) => prev.filter((u) => u.id !== id));
            if (user) {
                ActivityLogger.user.deleted(user.name, id);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to delete user');
            throw err;
        }
    }

    return (
        <UsersContext.Provider value={{ users, addUser, editUser, deleteUser, loading, error, refreshUsers: loadUsers }}>
            {children}
        </UsersContext.Provider>
    );
}

export function useUsers() {
    return useContext(UsersContext);
}
