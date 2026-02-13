"use client";
import React, { useState } from 'react';
import { useUsers } from '../../contexts/UsersContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/lib/roles';

export default function UsersPage() {
    const { users, addUser, editUser, deleteUser, loading } = useUsers();
    const { data: session } = useSession();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null); // For editing
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'USER',
        phone: '',
        isActive: true
    });
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState('');

    const isAdmin = session?.user?.role === UserRole.ADMIN || (session?.user?.role as any) === 'ADMIN';

    const handleOpenModal = (user?: any) => {
        if (user) {
            setCurrentUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                password: '', // Don't populate password
                role: user.role,
                phone: user.phone || '',
                isActive: user.isActive
            });
        } else {
            setCurrentUser(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'USER',
                phone: '',
                isActive: true
            });
        }
        setIsModalOpen(true);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setError('');

        try {
            if (currentUser) {
                // Edit
                const updates: any = {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    isActive: formData.isActive
                };
                if (formData.password) updates.password = formData.password;
                if (formData.phone) updates.phone = formData.phone;

                await editUser(currentUser.id, updates);
            } else {
                // Add
                await addUser({ ...formData });
            }
            setIsModalOpen(false);
        } catch (err: any) {
            setError(err.message || 'Operation failed');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this user?')) {
            try {
                await deleteUser(id);
            } catch (err: any) {
                alert(err.message || 'Failed to delete');
            }
        }
    };

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] text-white/50">
                You do not have permission to view this page.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 min-h-[80vh] text-white font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-px w-8 bg-[#C5A059]"></div>
                        <h1 className="text-4xl font-black tracking-tighter text-white uppercase">
                            User <span className="text-[#C5A059] italic">Management</span>
                        </h1>
                    </div>
                    <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-medium pl-11">
                        Control access & permissions
                    </p>
                </div>

                <button
                    onClick={() => handleOpenModal()}
                    className="group flex items-center gap-3 px-6 py-3 bg-[#C5A059] text-black rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(197,160,89,0.3)]"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Add User
                </button>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(user => (
                    <div key={user.id} className="relative group bg-[#1A1A23] rounded-[2rem] p-6 border border-white/5 hover:border-[#C5A059]/30 transition-all overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C5A059] to-amber-600 flex items-center justify-center text-black font-black text-xl shadow-lg">
                                        {user.image ? (
                                            <img src={user.image} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
                                        ) : (
                                            user.name[0].toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white">{user.name}</h3>
                                        <div className={`text-[10px] px-2 py-0.5 rounded border inline-block uppercase tracking-wider font-bold ${user.role === 'ADMIN'
                                            ? 'border-[#C5A059]/30 text-[#C5A059] bg-[#C5A059]/10'
                                            : 'border-white/10 text-white/50 bg-white/5'
                                            }`}>
                                            {user.role}
                                        </div>
                                    </div>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${user.isActive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                            </div>

                            <div className="space-y-3 mb-6 flex-1">
                                <div className="flex items-center gap-3 text-sm text-white/60">
                                    <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    <span className="truncate">{user.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-white/60">
                                    <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-auto pt-6 border-t border-white/5">
                                <button
                                    onClick={() => handleOpenModal(user)}
                                    className="py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(user.id)}
                                    className="py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider transition-colors"
                                    disabled={user.email === session?.user?.email}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#1A1A23] w-full max-w-lg rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute top-0 right-0 p-6">
                                <button onClick={() => setIsModalOpen(false)} className="text-white/30 hover:text-white transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-8">
                                {currentUser ? 'Edit User' : 'New User'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#C5A059] transition-colors"
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#C5A059] transition-colors"
                                            placeholder="john@example.com"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Password {currentUser && '(Leave empty to keep)'}</label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#C5A059] transition-colors"
                                            placeholder="••••••••"
                                            required={!currentUser}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Role</label>
                                            <select
                                                value={formData.role}
                                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C5A059] transition-colors appearance-none"
                                            >
                                                <option value="USER" className="bg-[#1A1A23]">User</option>
                                                <option value="ADMIN" className="bg-[#1A1A23]">Admin</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Status</label>
                                            <select
                                                value={formData.isActive ? 'true' : 'false'}
                                                onChange={e => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C5A059] transition-colors appearance-none"
                                            >
                                                <option value="true" className="bg-[#1A1A23]">Active</option>
                                                <option value="false" className="bg-[#1A1A23]">Inactive</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="w-full py-4 rounded-xl bg-[#C5A059] text-black font-black uppercase tracking-widest hover:bg-white transition-colors shadow-lg disabled:opacity-50"
                                >
                                    {formLoading ? 'Saving...' : (currentUser ? 'Update User' : 'Create User')}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
