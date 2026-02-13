"use client";
import { useProducts } from "../../contexts/ProductsContext";
import { useCategories } from "../../contexts/CategoriesContext";
import { useState, useMemo, useEffect } from "react";
import { exportToCSV } from "../../utils/csvExport";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/roles";
import { uploadAPI } from "../../lib/api";
import { AddProductModal } from "../../components/forms/AddProductModal";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const ITEMS_PER_PAGE = 12;

export default function ProductsPage() {
    const { products, editProduct, deleteProduct } = useProducts();
    const { categories } = useCategories();
    const { hasPermission } = usePermissions();
    const [editId, setEditId] = useState<string | null>(null);

    // Check permissions
    const canCreate = hasPermission(Permission.CREATE_PRODUCTS);
    const canEdit = hasPermission(Permission.EDIT_PRODUCTS);
    const canDelete = hasPermission(Permission.DELETE_PRODUCTS);
    const canExport = hasPermission(Permission.EXPORT_DATA);

    // Edit Form State
    const [editForm, setEditForm] = useState<any>({});
    const [editImageFile, setEditImageFile] = useState<File | null>(null);
    const [editImagePreview, setEditImagePreview] = useState('');

    // Other States
    const [showDelete, setShowDelete] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    function openEdit(product: any) {
        setEditId(product.id);
        setEditForm({ ...product });
        setEditImageFile(null);
        setEditImagePreview('');
    }

    async function handleEditSubmit(e: any) {
        e.preventDefault();
        try {
            let imageUrl = editForm.image;
            if (editImageFile) {
                const uploadRes = await uploadAPI.upload(editImageFile);
                imageUrl = uploadRes.url;
            }
            await editProduct(editId!, { ...editForm, image: imageUrl });
            setEditId(null);
            setEditImageFile(null);
            setEditImagePreview('');
        } catch (err: any) {
            console.error('Failed to update product:', err);
        }
    }

    function handleDelete(id: string) {
        deleteProduct(id);
        setShowDelete(null);
    }

    // Filter and search logic
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesSearch = !searchQuery ||
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.category.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = !categoryFilter || product.category === categoryFilter;
            const matchesStatus = !statusFilter || product.status === statusFilter;
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [products, searchQuery, categoryFilter, statusFilter]);

    // Pagination logic
    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredProducts, currentPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, categoryFilter, statusFilter]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Stock Intelligence Stats
    const lowStockCount = products.filter(p => p.status === 'Low Stock').length;
    const outOfStockCount = products.filter(p => p.status === 'Out of Stock').length;
    const totalStockValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);

    return (
        <div className="flex flex-col gap-8 min-h-[80vh] p-4 text-white font-sans selection:bg-[#C5A059] selection:text-black">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] glass-elevated border border-white/10 shadow-2xl p-6 md:p-8 mb-4 transition-all duration-700">
                {/* Subtle mesh glow overlay */}
                <div className="absolute inset-0 z-0 bg-white/[0.01]"></div>
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at:20%_-30%,rgba(197,160,89,0.08),transparent_70%)] opacity-40"></div>
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at:80%_120%,rgba(197,160,89,0.03),transparent_70%)] opacity-40"></div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="h-px w-6 bg-[#C5A059]"></div>
                            <span className="text-[9px] uppercase tracking-[0.4em] text-[#C5A059] font-bold">Inventory Intelligence</span>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-black bg-gradient-to-r from-white via-white/80 to-white/40 bg-clip-text text-transparent mb-1 tracking-tighter uppercase">
                            Registry & Stock
                        </h1>
                        <p className="text-[11px] text-white/40 max-w-sm font-medium leading-relaxed">
                            Complete catalog management and real-time inventory tracking.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 md:gap-8">
                        <div className="flex gap-6 md:gap-8 border-r border-white/5 pr-8">
                            <div className="text-right">
                                <div className="text-[9px] uppercase tracking-widest text-[#C5A059] font-bold mb-0.5">Assets</div>
                                <div className="text-xl md:text-2xl font-black text-white tracking-tighter">{products.length}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold mb-0.5">Value (LE)</div>
                                <div className="text-xl md:text-2xl font-black text-white tracking-tighter">{totalStockValue.toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="flex gap-6 md:gap-8 border-r border-white/5 pr-8">
                            <div className="text-right">
                                <div className="text-[9px] uppercase tracking-widest text-amber-500 font-bold mb-0.5">Low</div>
                                <div className="text-xl md:text-2xl font-black text-white tracking-tighter">{lowStockCount}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Out</div>
                                <div className="text-xl md:text-2xl font-black text-white tracking-tighter">{outOfStockCount}</div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {canExport && (
                                <button
                                    className="px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all shadow-xl"
                                    onClick={() => exportToCSV(filteredProducts, 'products')}
                                >
                                    Export
                                </button>
                            )}
                            {canCreate && (
                                <button
                                    className="px-5 py-3 rounded-2xl bg-white text-black text-[9px] font-black uppercase tracking-[0.2em] hover:scale-105 hover:bg-[#C5A059] transition-all shadow-xl active:scale-95"
                                    onClick={() => setShowAdd(true)}
                                >
                                    Add Item
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-2">
                <div className="relative flex-1 max-w-md">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search items..."
                        className="w-full pl-12 pr-6 py-3 rounded-2xl bg-white/[0.03] border border-white/5 focus:outline-none focus:border-[#C5A059]/50 text-white placeholder:text-white/10 text-xs font-bold transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-4">
                    <div className="relative">
                        <select
                            className="pl-6 pr-10 py-3 rounded-2xl bg-white/[0.03] border border-white/5 focus:outline-none focus:border-[#C5A059]/50 text-white appearance-none cursor-pointer text-[11px] font-black uppercase tracking-widest transition-all"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="" className="bg-[#0f0f0f]">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.name} className="bg-[#0f0f0f]">{cat.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>

                    <div className="relative">
                        <select
                            className="pl-6 pr-10 py-3 rounded-2xl bg-white/[0.03] border border-white/5 focus:outline-none focus:border-[#C5A059]/50 text-white appearance-none cursor-pointer text-[11px] font-black uppercase tracking-widest transition-all"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="" className="bg-[#0f0f0f]">Status</option>
                            <option value="In Stock" className="bg-[#0f0f0f]">In Stock</option>
                            <option value="Low Stock" className="bg-[#0f0f0f]">Low Stock</option>
                            <option value="Out of Stock" className="bg-[#0f0f0f]">Out of Stock</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
                <div className="p-32 text-center border border-dashed border-white/10 rounded-[3rem] bg-white/5 backdrop-blur-sm">
                    <div className="text-white/20 text-lg font-bold mb-2">Inventory Empty</div>
                    <p className="text-white/10 text-xs uppercase tracking-widest">No assets found in the current registry view.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {paginatedProducts.map(product => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -5 }}
                            className="group relative flex flex-col p-px rounded-[2.5rem] overflow-hidden bg-gradient-to-b from-white/10 to-transparent hover:from-[#C5A059]/30 transition-all duration-500 shadow-2xl"
                        >
                            <div className="relative flex flex-col h-full bg-[#252530] backdrop-blur-3xl rounded-[2.45rem] p-0 overflow-hidden">
                                {/* Futuristic Background */}
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />

                                {/* Image Section */}
                                <div className="relative h-56 overflow-hidden">
                                    <div className="absolute inset-x-4 top-4 z-20 flex justify-between items-start">
                                        <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
                                            <span className="text-[8px] font-black text-[#C5A059] uppercase tracking-[0.2em]">{product.category}</span>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-xl backdrop-blur-md border ${product.status === 'In Stock' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                            product.status === 'Low Stock' ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20' :
                                                'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                                            }`}>
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-1 h-1 rounded-full animate-pulse ${product.status === 'In Stock' ? 'bg-emerald-400' :
                                                    product.status === 'Low Stock' ? 'bg-[#F59E0B]' :
                                                        'bg-zinc-400'
                                                    }`} />
                                                <span className="text-[8px] font-black uppercase tracking-widest">{product.status}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <img
                                        src={product.image || 'https://placehold.co/640x360'}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent opacity-80" />
                                    <div className="absolute inset-0 w-full h-[1px] bg-[#C5A059]/30 blur-[1px] -translate-y-full group-hover:animate-[scan_3s_linear_infinite]" />
                                </div>

                                <div className="p-7 flex flex-col flex-1 relative z-10">
                                    <div className="mb-6">
                                        <div className="flex justify-between items-start gap-4 mb-2">
                                            <h3 className="text-2xl font-black text-white group-hover:text-[#C5A059] transition-colors tracking-tighter leading-none italic uppercase truncate">
                                                {product.name}
                                            </h3>
                                            <div className="text-xl font-black text-white tracking-tighter group-hover:scale-110 transition-transform">
                                                <span className="text-[10px] text-[#C5A059] mr-1 opacity-60">LE</span>
                                                {product.price.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="text-[9px] font-black text-white/50 tracking-[0.4em] uppercase">UID: {product.id.slice(-8).toUpperCase()}</div>
                                    </div>

                                    {/* Stock Intelligence */}
                                    <div className="mb-8 p-4 rounded-2xl bg-white/[0.02] border border-white/5 transition-all group-hover:bg-white/[0.04]">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-3.5 h-3.5 text-[#C5A059]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                                <span className="text-[9px] font-black text-white/70 uppercase tracking-widest">Available Reserve</span>
                                            </div>
                                            <span className="text-sm font-black text-white italic">{product.stock} <span className="text-[8px] opacity-70 uppercase ml-1">Units</span></span>
                                        </div>
                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden flex">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min((product.stock / 100) * 100, 100)}%` }}
                                                className={`h-full rounded-full ${product.stock > 50 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                                                    product.stock > 10 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' :
                                                        'bg-[#C5A059] shadow-[0_0_10px_rgba(197,160,89,0.5)]'
                                                    }`}
                                            />
                                        </div>
                                    </div>

                                    {/* Actions Deck */}
                                    <div className="mt-auto flex gap-3">
                                        {canEdit && (
                                            <button
                                                className="flex-1 py-4 rounded-xl bg-white/[0.03] hover:bg-white text-white/60 hover:text-black font-black text-[10px] uppercase tracking-[0.3em] transition-all border border-white/5 shadow-xl active:scale-95 italic text-center"
                                                onClick={() => openEdit(product)}
                                            >
                                                Adjust Data
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                className="w-12 h-12 rounded-xl bg-white/[0.03] hover:bg-white/10 text-white/20 hover:text-white border border-white/5 hover:border-white/20 flex items-center justify-center transition-all group/del active:scale-95 shadow-xl"
                                                onClick={() => setShowDelete(product.id)}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            className={`w-10 h-10 rounded-xl font-black text-[10px] transition-all flex items-center justify-center ${currentPage === page
                                ? 'bg-white text-black shadow-xl scale-110'
                                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                                }`}
                            onClick={() => handlePageChange(page)}
                        >
                            {page}
                        </button>
                    ))}
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {showAdd && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-2xl p-4 overflow-y-auto" onClick={() => setShowAdd(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 40 }}
                            className="relative rounded-[2.5rem] bg-gradient-to-br from-[#1A1A23] to-[#0F0F0F] border border-white/10 py-8 px-10 max-w-4xl w-full shadow-[0_0_150px_rgba(0,0,0,0.8)] overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Decorative Tech Layers */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C5A059]/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

                            {/* Corner Accents */}
                            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#C5A059]/20 rounded-tl-[3rem] pointer-events-none" />
                            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[#C5A059]/20 rounded-br-[3rem] pointer-events-none" />

                            <AddProductModal onClose={() => setShowAdd(false)} />
                        </motion.div>
                    </div>
                )}

                {editId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-2xl p-4 overflow-y-auto" onClick={() => setEditId(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 40 }}
                            className="relative rounded-[2.5rem] bg-gradient-to-br from-[#1A1A23] to-[#0F0F0F] border border-white/10 py-8 px-10 max-w-4xl w-full shadow-[0_0_150px_rgba(0,0,0,0.8)] overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Decorative Tech Layers */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C5A059]/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

                            {/* Corner Accents */}
                            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#C5A059]/20 rounded-tl-[3rem] pointer-events-none" />
                            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[#C5A059]/20 rounded-br-[3rem] pointer-events-none" />

                            <div className="relative z-10 mb-6 flex items-center justify-between">
                                <div className="text-left">
                                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">Modify Asset</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="h-[2px] w-6 bg-[#C5A059]" />
                                        <span className="text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em]">Updating Registry</span>
                                    </div>
                                </div>
                                <div className="text-right hidden md:block">
                                    <div className="text-[10px] uppercase tracking-widest text-white/20 font-bold mb-1">ASSET_CLASS</div>
                                    <div className="text-xs font-black text-[#C5A059] tracking-tighter uppercase italic">SIG-{editId.slice(-5).toUpperCase()}</div>
                                </div>
                            </div>

                            <form className="relative z-10 flex flex-col md:flex-row gap-8" onSubmit={handleEditSubmit}>
                                {/* Left Column: Visuals */}
                                <div className="flex flex-col items-center gap-6 md:w-1/3">
                                    <div className="relative group">
                                        <div className="absolute -inset-4 bg-gradient-to-tr from-[#C5A059]/20 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                                        <div
                                            className="relative w-40 h-40 rounded-3xl p-1 bg-gradient-to-br from-white/20 to-transparent cursor-pointer overflow-hidden shadow-2xl"
                                            onClick={() => document.getElementById('edit-product-image-upload')?.click()}
                                        >
                                            <div className="relative h-full w-full rounded-[1.4rem] overflow-hidden bg-[#0A0A0F]">
                                                {editImagePreview || editForm.image ? (
                                                    <Image src={editImagePreview || editForm.image} alt="Preview" fill className="object-cover transition-transform duration-700 group-hover:scale-110" unoptimized />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-white/10 uppercase tracking-tighter italic text-center p-4">
                                                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                        <span className="text-[10px] font-black leading-tight">Visual Identity Box</span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-x-0 bottom-0 py-2.5 bg-black/60 backdrop-blur-md translate-y-full group-hover:translate-y-0 transition-transform duration-300 border-t border-white/10">
                                                    <span className="block text-[8px] font-black text-white text-center uppercase tracking-widest leading-none">Modify Graphic</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shadow-2xl border border-black/10 group-hover:scale-110 transition-transform cursor-pointer"
                                            onClick={() => document.getElementById('edit-product-image-upload')?.click()}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1 leading-relaxed max-w-[120px]">Recommended: High fidelity resource, 16:9 or 1:1 format.</p>
                                    </div>
                                    <input id="edit-product-image-upload" type="file" className="hidden" accept="image/*" onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setEditImageFile(file);
                                            const reader = new FileReader();
                                            reader.onload = ev => setEditImagePreview(ev.target?.result as string);
                                            reader.readAsDataURL(file);
                                        }
                                    }} />

                                    <div className="mt-auto w-full pt-4 md:block hidden">
                                        <button
                                            type="button"
                                            className="w-full px-6 py-5 rounded-2xl bg-white/[0.02] border border-white/5 text-[10px] font-black text-white/30 uppercase tracking-[0.5em] hover:text-white hover:bg-white/5 transition-all text-center flex items-center justify-center italic"
                                            onClick={() => setEditId(null)}
                                        >
                                            Abort Update
                                        </button>
                                    </div>
                                </div>

                                {/* Right Column: Fields */}
                                <div className="flex-1 space-y-4">
                                    <div className="group relative">
                                        <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-1">Asset Descriptor</label>
                                        <input
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-[#C5A059] transition-all text-lg font-black italic tracking-tight placeholder:text-white/5 shadow-inner"
                                            value={editForm.name || ''}
                                            onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))}
                                            required
                                        />
                                    </div>

                                    <div className="group relative">
                                        <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-1">Primary Classification</label>
                                        <select
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-[#C5A059] transition-all text-lg font-black italic tracking-tight appearance-none cursor-pointer"
                                            value={editForm.category || ''}
                                            onChange={e => setEditForm((f: any) => ({ ...f, category: e.target.value }))}
                                            required
                                        >
                                            <option value="" className="bg-[#0f0f0f]">SELECT_CLASS</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.name} className="bg-[#0f0f0f]">{cat.name.toUpperCase()}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-5 bottom-4 pointer-events-none text-white/20">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="group relative">
                                            <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-1 text-left">Cost Price (LE)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-[#C5A059] transition-all text-lg font-black italic tracking-tight"
                                                value={editForm.costPrice || ''}
                                                onChange={e => setEditForm((f: any) => ({ ...f, costPrice: parseFloat(e.target.value) }))}
                                                required
                                            />
                                        </div>
                                        <div className="group relative">
                                            <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-1 text-left">Selling Price (LE)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-[#C5A059] transition-all text-lg font-black italic tracking-tight"
                                                value={editForm.price || ''}
                                                onChange={e => setEditForm((f: any) => ({ ...f, price: parseFloat(e.target.value) }))}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="group relative">
                                        <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-1 text-left">Reserve Quant</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-[#C5A059] transition-all text-lg font-black italic tracking-tight"
                                            value={editForm.stock || 0}
                                            onChange={e => setEditForm((f: any) => ({ ...f, stock: parseInt(e.target.value) }))}
                                            required
                                        />
                                    </div>

                                    <div className="group relative">
                                        <label className="block text-[8px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1 px-1">Resource Link</label>
                                        <div className="relative">
                                            <input
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-10 pr-5 py-2.5 text-white focus:outline-none focus:border-[#C5A059] transition-all text-[9px] font-black uppercase tracking-widest placeholder:text-white/5"
                                                placeholder="EXTERNAL_RESOURCE_LINK"
                                                value={editForm.image || ''}
                                                onChange={e => setEditForm((f: any) => ({ ...f, image: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-6 items-center">
                                        <button
                                            type="button"
                                            className="md:hidden flex-1 px-6 py-4 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-black text-white/30 uppercase tracking-[0.5em] hover:text-white hover:bg-white/5 transition-all text-center italic"
                                            onClick={() => setEditId(null)}
                                        >
                                            Abort
                                        </button>
                                        <button
                                            type="submit"
                                            className="relative flex-1 group active:scale-[0.98] transition-transform"
                                        >
                                            <div className="absolute inset-0 bg-white rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition duration-500" />
                                            <div className="relative bg-white text-black py-5 rounded-xl font-black uppercase tracking-[0.4em] text-[11px] flex items-center justify-center gap-6 group-hover:bg-[#C5A059] transition-all">
                                                <span className="italic">Apply Changes</span>
                                                <div className="w-8 h-[1px] bg-black/10" />
                                                <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                </svg>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {showDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-xl" onClick={() => setShowDelete(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative rounded-[2rem] bg-white/[0.03] backdrop-blur-3xl border border-white/10 py-10 px-8 max-w-sm w-full text-center shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-16 h-16 rounded-full bg-[#F59E0B]/10 flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <h3 className="text-xl font-black mb-2 text-white uppercase tracking-tight">Confirm Deletion</h3>
                            <p className="mb-8 text-white/40 text-[10px] font-medium leading-relaxed">This product will be permanently removed from your inventory system.</p>
                            <div className="flex flex-col gap-3">
                                <button className="w-full py-4 rounded-xl bg-[#F59E0B] text-black font-black uppercase tracking-widest text-[10px] hover:bg-white transition-all shadow-lg" onClick={() => handleDelete(showDelete!)}>Delete Item</button>
                                <button className="w-full py-4 rounded-xl text-white/30 font-black uppercase tracking-widest text-[10px]" onClick={() => setShowDelete(null)}>Cancel</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}