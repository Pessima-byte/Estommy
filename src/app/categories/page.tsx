"use client";
import { useCategories } from "../../contexts/CategoriesContext";
import { useState, useMemo } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/roles";
import { useToast } from '../../components/Toast';
import { motion, AnimatePresence } from "framer-motion";

export default function CategoriesPage() {
    const { categories, addCategory, editCategory, deleteCategory, loading } = useCategories();
    const { hasPermission } = usePermissions();
    const { showToast } = useToast();

    const canCreate = hasPermission(Permission.CREATE_PRODUCTS);
    const canEdit = hasPermission(Permission.EDIT_PRODUCTS);
    const canDelete = hasPermission(Permission.DELETE_PRODUCTS);

    const [showAdd, setShowAdd] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [showDelete, setShowDelete] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', description: '' });
    const [editForm, setEditForm] = useState<any>({});
    const [formError, setFormError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCategories = useMemo(() => {
        return categories.filter(category =>
            category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [categories, searchQuery]);

    function handleAddSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name.trim()) {
            setFormError('Category name is required.');
            return;
        }
        setFormError('');
        addCategory({ name: form.name.trim(), description: form.description.trim() || null })
            .then(() => {
                setForm({ name: '', description: '' });
                setShowAdd(false);
                showToast('Category added successfully!', 'success');
            })
            .catch((error: any) => {
                setFormError(error.message || 'Failed to add category');
                showToast(error.message || 'Failed to add category', 'error');
            });
    }

    function handleEditSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!editForm.name?.trim()) {
            setFormError('Category name is required.');
            return;
        }
        setFormError('');
        editCategory(editId!, { name: editForm.name.trim(), description: editForm.description?.trim() || null })
            .then(() => {
                setEditId(null);
                setEditForm({});
                showToast('Category updated successfully!', 'success');
            })
            .catch((error: any) => {
                setFormError(error.message || 'Failed to update category');
                showToast(error.message || 'Failed to update category', 'error');
            });
    }

    function handleDelete(id: string) {
        deleteCategory(id)
            .then(() => {
                setShowDelete(null);
                showToast('Category deleted successfully!', 'success');
            })
            .catch((error: any) => {
                showToast(error.message || 'Failed to delete category', 'error');
            });
    }

    function openEdit(category: any) {
        setEditId(category.id);
        setEditForm({ name: category.name, description: category.description || '' });
        setFormError('');
    }

    return (
        <div className="flex flex-col gap-8 min-h-[80vh] p-4 text-white font-sans selection:bg-[#C5A059] selection:text-black">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] glass-elevated border border-white/10 shadow-2xl p-6 md:p-8 mb-4 transition-all duration-700">
                {/* Subtle mesh glow overlay */}
                <div className="absolute inset-0 z-0 bg-white/[0.01]"></div>
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_-30%,rgba(197,160,89,0.08),transparent_70%)] opacity-40"></div>
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_80%_120%,rgba(197,160,89,0.03),transparent_70%)] opacity-40"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="h-px w-6 bg-[#C5A059]"></div>
                            <span className="text-[9px] uppercase tracking-[0.4em] text-[#C5A059] font-bold">Organization</span>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-black bg-gradient-to-r from-white via-white/80 to-white/40 bg-clip-text text-transparent mb-1 tracking-tighter uppercase">
                            Product Categories
                        </h1>
                        <p className="text-[11px] text-white/40 max-w-sm font-medium leading-relaxed">
                            Structure your inventory into logical groups for efficient management.
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right px-6 border-r border-white/5">
                            <div className="text-[9px] uppercase tracking-widest text-[#C5A059] font-bold mb-0.5">Total Groups</div>
                            <div className="text-2xl font-black text-white tracking-tighter">{categories.length}</div>
                        </div>

                        {canCreate && (
                            <button
                                className="px-6 py-3.5 rounded-full bg-white text-black text-[9px] font-black uppercase tracking-[0.2em] hover:scale-105 hover:bg-[#C5A059] transition-all shadow-xl active:scale-95"
                                onClick={() => { setShowAdd(true); setFormError(''); setForm({ name: '', description: '' }); }}
                            >
                                Add Category
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="mb-2">
                <div className="relative max-w-md">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search categories..."
                        className="w-full pl-12 pr-6 py-3 rounded-2xl bg-white/[0.03] border border-white/5 focus:outline-none focus:border-[#C5A059]/50 text-white placeholder:text-white/10 text-xs font-bold transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Categories List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-32 space-y-4">
                    <div className="w-12 h-12 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-[#C5A059] text-xs font-black uppercase tracking-[0.3em] animate-pulse">Syncing Registry...</div>
                </div>
            ) : filteredCategories.length === 0 ? (
                <div className="p-32 text-center border border-dashed border-white/10 rounded-[3rem] bg-white/5 backdrop-blur-sm">
                    <div className="text-white/20 text-lg font-bold mb-2">No Categories Found</div>
                    <p className="text-white/10 text-xs uppercase tracking-widest">Add your first product group to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {filteredCategories.map(category => (
                        <motion.div
                            key={category.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -5 }}
                            className="group relative flex flex-col p-px rounded-[2.5rem] overflow-hidden bg-gradient-to-b from-white/10 to-transparent hover:from-[#C5A059]/30 transition-all duration-500 shadow-2xl"
                        >
                            <div className="relative flex flex-col h-full bg-[#252530] backdrop-blur-3xl rounded-[2.45rem] p-8 overflow-hidden">
                                {/* Futuristic Background */}
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />

                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="relative">
                                        <div className="absolute -inset-2 bg-[#C5A059]/10 rounded-full blur-xl animate-pulse" />
                                        <div className="w-14 h-14 rounded-2xl border border-white/10 bg-black/40 flex items-center justify-center relative group-hover:border-[#C5A059]/40 transition-colors">
                                            <svg className="w-7 h-7 text-[#C5A059]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[8px] font-black text-[#C5A059] uppercase tracking-[0.3em] mb-1">System Node</div>
                                        <div className="text-[10px] font-black text-white/60 tracking-widest">#{category.id.slice(-6).toUpperCase()}</div>
                                    </div>
                                </div>

                                <div className="mb-6 relative z-10">
                                    <h3 className="text-2xl font-black text-white tracking-tighter italic mb-3 group-hover:text-[#C5A059] transition-colors leading-none uppercase">
                                        {category.name}
                                    </h3>
                                    <div className="relative p-4 rounded-2xl bg-white/[0.02] border border-white/5 group-hover:border-[#C5A059]/20 transition-all">
                                        <div className="absolute top-0 right-4 -translate-y-1/2 px-2 py-0.5 bg-[#0a0a0f] border border-white/10 rounded-full">
                                            <span className="text-[7px] font-black text-[#C5A059] uppercase tracking-widest">Description</span>
                                        </div>
                                        <p className="text-[11px] font-medium text-white/70 leading-relaxed italic">
                                            {category.description || 'No specialized operational parameters defined for this node.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-auto flex gap-3 relative z-10">
                                    {canEdit && (
                                        <button
                                            className="flex-1 py-3.5 rounded-xl bg-white/[0.03] hover:bg-white text-white/40 hover:text-black font-black text-[9px] uppercase tracking-[0.3em] transition-all border border-white/5 hover:border-white shadow-xl active:scale-95 italic text-center"
                                            onClick={() => openEdit(category)}
                                        >
                                            Modify Map
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button
                                            className="w-12 h-12 rounded-xl bg-zinc-500/5 hover:bg-zinc-500 text-zinc-500/40 hover:text-white border border-zinc-500/10 hover:border-zinc-500 flex items-center justify-center transition-all group/del active:scale-95 shadow-xl"
                                            onClick={() => setShowDelete(category.id)}
                                        >
                                            <svg className="w-5 h-5 transition-transform group-hover/del:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    )}
                                </div>

                                {/* Scanning decoration */}
                                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C5A059]/20 to-transparent opacity-0 group-hover:opacity-100 -translate-y-full animate-[scan_4s_linear_infinite]" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {(showAdd || editId) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => { setShowAdd(false); setEditId(null); }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="relative rounded-[2rem] bg-white/5 backdrop-blur-md border border-white/10 py-10 px-8 max-w-lg w-full shadow-[0_0_100px_rgba(197,160,89,0.1)] overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Futuristic accents */}
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#C5A059]/5 rounded-full blur-[80px]" />
                            <div className="absolute top-10 left-10 w-px h-10 bg-gradient-to-b from-[#C5A059] to-transparent opacity-40" />

                            <div className="relative z-10 mb-6">
                                <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">
                                    {showAdd ? 'Add Category' : 'Edit Category'}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <div className="h-[1px] w-3 bg-[#C5A059]" />
                                    <span className="text-[8px] font-black text-[#C5A059] uppercase tracking-[0.3em]">Manage Categories</span>
                                </div>
                            </div>

                            <form className="relative z-10 flex flex-col gap-6" onSubmit={showAdd ? handleAddSubmit : handleEditSubmit}>
                                <div className="group relative">
                                    <label className="block text-[11px] font-black text-white/50 uppercase tracking-[0.2em] mb-3 group-focus-within:text-[#C5A059] transition-colors">
                                        Category Name
                                    </label>
                                    <div className="relative">
                                        <input
                                            className="w-full bg-white/[0.03] border-b-2 border-white/10 focus:border-[#C5A059] px-4 py-2 text-white placeholder:text-white/10 focus:outline-none transition-all text-lg font-black italic tracking-tight"
                                            placeholder="Enter category name..."
                                            value={showAdd ? form.name : (editForm.name || '')}
                                            onChange={e => showAdd ? setForm(f => ({ ...f, name: e.target.value })) : setEditForm((f: any) => ({ ...f, name: e.target.value }))}
                                            required
                                        />
                                        <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#C5A059] shadow-[0_0_15px_rgba(197,160,89,0.8)] group-focus-within:w-full transition-all duration-700" />
                                    </div>
                                </div>

                                <div className="group relative">
                                    <label className="block text-[11px] font-black text-white/50 uppercase tracking-[0.2em] mb-3 group-focus-within:text-[#C5A059] transition-colors">
                                        Description
                                    </label>
                                    <textarea
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-xs font-medium focus:outline-none focus:border-[#C5A059]/40 transition-all resize-none min-h-[80px]"
                                        placeholder="Enter category description..."
                                        value={showAdd ? form.description : (editForm.description || '')}
                                        onChange={e => showAdd ? setForm(f => ({ ...f, description: e.target.value })) : setEditForm((f: any) => ({ ...f, description: e.target.value }))}
                                        rows={2}
                                    />
                                </div>

                                {formError && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-3 rounded-xl bg-zinc-500/10 border border-zinc-500/30 text-zinc-500 text-[8px] font-black uppercase tracking-widest text-center italic"
                                    >
                                        <span className="mr-3 font-mono">Error:</span> {formError}
                                    </motion.div>
                                )}

                                <div className="pt-4 flex gap-4 items-center">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] hover:text-[#C5A059] transition-colors"
                                        onClick={() => { setShowAdd(false); setEditId(null); }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="relative flex-1 group"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#C5A059] to-amber-600 rounded-xl blur-lg opacity-30 group-hover:opacity-60 transition duration-500" />
                                        <div className="relative bg-white hover:bg-black hover:text-white text-black py-4 rounded-xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-[0.98]">
                                            <span className="italic">{showAdd ? 'Add Category' : 'Save Changes'}</span>
                                            <svg className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                        </div>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {showDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md" onClick={() => setShowDelete(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative rounded-[2rem] bg-black/40 backdrop-blur-2xl border border-white/10 py-10 px-8 max-w-sm w-full text-center shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-16 h-16 rounded-full bg-[#F59E0B]/10 flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <h3 className="text-xl font-black mb-2 text-white uppercase tracking-tight">Confirm Deletion</h3>
                            <p className="mb-8 text-white/40 text-[10px] font-medium leading-relaxed">This product group will be permanently removed. Ensure no items are currently assigned to it.</p>
                            <div className="flex flex-col gap-3">
                                <button className="w-full py-4 rounded-xl bg-[#F59E0B] text-black font-black uppercase tracking-widest text-[10px] hover:bg-white transition-all shadow-lg shadow-orange-500/10" onClick={() => handleDelete(showDelete!)}>Delete Category</button>
                                <button className="w-full py-4 rounded-xl text-white/30 font-black uppercase tracking-widest text-[10px]" onClick={() => setShowDelete(null)}>Cancel</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
