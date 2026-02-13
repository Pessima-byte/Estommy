"use client";

import { useState, useMemo } from 'react';
import { useSales } from '../../contexts/SalesContext';
import { useProducts } from '../../contexts/ProductsContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/lib/roles';
import { AddSaleModal } from '../../components/forms/AddSaleModal';
import { useToast } from '../../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

// Format currency utility
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'SLE',
        minimumFractionDigits: 2
    }).format(amount).replace('SLE', 'Le');
};

export default function SalesPage() {
    const { sales, deleteSale, loading } = useSales();
    const { products } = useProducts();
    const { hasPermission } = usePermissions();
    const { showToast } = useToast();

    const canCreate = hasPermission(Permission.CREATE_SALES);
    const canDelete = hasPermission(Permission.DELETE_SALES);

    const [showAdd, setShowAdd] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDelete, setShowDelete] = useState<string | null>(null);

    const filteredSales = useMemo(() => {
        return sales.filter(sale => {
            const customerName = sale.customer?.name || 'Guest';
            const productName = sale.product?.name || 'Unknown Product';
            return customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sale.id.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [sales, searchQuery]);

    // Calculate totals
    const totalRevenue = useMemo(() => sales.reduce((acc, sale) => acc + (sale.amount || 0), 0), [sales]);

    // Calculate Profit
    const totalProfit = useMemo(() => {
        return sales.reduce((acc, sale) => {
            // Try to find the product to get its cost price
            // Assuming sale.product.id or sale.productId exists. 
            // Based on filteredSales logic: sale.product?.name
            // We'll trust sale.productId if available, or try to match by name if we have to, but ID is safer.
            // If sale has product object fully populated:
            const product = products.find(p => p.id === (sale.product?.id || sale.productId));
            const cost = product?.costPrice || 0;
            const revenue = sale.amount || 0;
            return acc + (revenue - cost);
        }, 0);
    }, [sales, products]);

    async function handleDelete(id: string) {
        try {
            await deleteSale(id);
            showToast('Transaction voided successfully.', 'success');
            setShowDelete(null);
        } catch (error: any) {
            showToast(error.message || 'Void failed', 'error');
        }
    }

    return (
        <div className="flex flex-col gap-8 min-h-[80vh] p-4 text-white font-sans selection:bg-[#C5A059] selection:text-black">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] glass-elevated border border-white/10 shadow-2xl p-6 md:p-8 mb-4 transition-all duration-700">
                <div className="absolute inset-0 z-0 bg-white/[0.01]"></div>
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_-30%,rgba(197,160,89,0.08),transparent_70%)] opacity-40"></div>
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_80%_120%,rgba(197,160,89,0.03),transparent_70%)] opacity-40"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="h-px w-6 bg-[#C5A059]"></div>
                            <span className="text-[9px] uppercase tracking-[0.4em] text-[#C5A059] font-bold">Ledger</span>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-black bg-gradient-to-r from-white via-white/80 to-white/40 bg-clip-text text-transparent mb-1 tracking-tighter uppercase">
                            Sales History
                        </h1>
                        <p className="text-[11px] text-white/40 max-w-sm font-medium leading-relaxed">
                            Immutable transaction history and real-time revenue analytics.
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right px-6 border-r border-white/5">
                            <div className="text-[9px] uppercase tracking-widest text-[#C5A059] font-bold mb-0.5">Net Revenue</div>
                            <div className="text-2xl font-black text-white tracking-tighter">{formatCurrency(totalRevenue)}</div>
                        </div>

                        <div className="text-right px-6 border-r border-white/5">
                            <div className="text-[9px] uppercase tracking-widest text-emerald-500 font-bold mb-0.5">Net Profit</div>
                            <div className="text-2xl font-black text-[#C5A059] tracking-tighter">{formatCurrency(totalProfit)}</div>
                        </div>

                        {canCreate && (
                            <button
                                className="px-6 py-3.5 rounded-full bg-white text-black text-[9px] font-black uppercase tracking-[0.2em] hover:scale-105 hover:bg-[#C5A059] transition-all shadow-xl active:scale-95"
                                onClick={() => setShowAdd(true)}
                            >
                                New Entry
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
                        placeholder="Search transactions..."
                        className="w-full pl-12 pr-6 py-3 rounded-2xl bg-white/[0.03] border border-white/5 focus:outline-none focus:border-[#C5A059]/50 text-white placeholder:text-white/10 text-xs font-bold transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Sales Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-32 space-y-4">
                    <div className="w-12 h-12 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-[#C5A059] text-xs font-black uppercase tracking-[0.3em] animate-pulse">Syncing Ledger...</div>
                </div>
            ) : filteredSales.length === 0 ? (
                <div className="p-32 text-center border border-dashed border-white/10 rounded-[3rem] bg-white/5 backdrop-blur-sm">
                    <div className="text-white/20 text-lg font-bold mb-2">No Records Found</div>
                    <p className="text-white/10 text-xs uppercase tracking-widest">Your transaction ledger is currently empty.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredSales.map(sale => (
                        <motion.div
                            key={sale.id}
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
                                        <div className={`w-14 h-14 rounded-2xl border border-white/10 bg-black/40 flex items-center justify-center relative ${sale.status === 'Completed' ? 'text-emerald-500' : 'text-amber-500'
                                            }`}>
                                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[8px] font-black text-[#C5A059]/60 uppercase tracking-[0.3em] mb-1">Receipt ID</div>
                                        <div className="text-[10px] font-black text-white/40 tracking-widest">#{sale.id.slice(-8).toUpperCase()}</div>
                                    </div>
                                </div>

                                <div className="mb-8 relative z-10">
                                    <h3 className="text-3xl font-black text-white tracking-tighter italic mb-1 group-hover:text-[#C5A059] transition-colors leading-none">
                                        {formatCurrency(sale.amount)}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-px bg-[#C5A059]/40" />
                                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] truncate">
                                            {sale.product?.name || 'Unknown Product'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 mb-8 relative z-10">
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 transition-all group-hover:border-[#C5A059]/20 group-hover:bg-[#C5A059]/5">
                                        <div className="flex flex-col">
                                            <span className="text-[7px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1">Customer</span>
                                            <span className="text-sm font-black text-white truncate max-w-[120px] uppercase">
                                                {sale.customer?.name || 'Guest'}
                                            </span>
                                        </div>
                                        <div className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/20 group-hover:text-[#C5A059] transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex flex-col">
                                            <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.4em] mb-0.5">Timestamp</span>
                                            <span className="text-[10px] font-black text-white/60">
                                                {new Date(sale.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.4em] mb-0.5">Status</span>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${sale.status === 'Completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${sale.status === 'Completed' ? 'text-emerald-500' : 'text-amber-500'}`}>{sale.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto flex gap-3 relative z-10">
                                    <button className="flex-1 py-3.5 rounded-xl bg-white/[0.03] hover:bg-white text-white/40 hover:text-black font-black text-[9px] uppercase tracking-[0.3em] transition-all border border-white/5 hover:border-white shadow-xl active:scale-95 italic text-center">
                                        Audit Details
                                    </button>
                                    {canDelete && (
                                        <button
                                            className="w-12 h-12 rounded-xl bg-white/[0.03] hover:bg-white/10 text-white/20 hover:text-white border border-white/5 hover:border-white/20 flex items-center justify-center transition-all group/del active:scale-95 shadow-xl"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setShowDelete(sale.id);
                                            }}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {showAdd && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative rounded-[3rem] bg-white/5 backdrop-blur-md border border-white/10 py-10 px-10 max-w-4xl w-full mx-4 shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <AddSaleModal onClose={() => setShowAdd(false)} />
                        </motion.div>
                    </div>
                )}

                {showDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowDelete(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative rounded-[2rem] bg-white/5 backdrop-blur-md border border-[#F59E0B]/30 py-10 px-8 max-w-sm w-full text-center shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-16 h-16 rounded-full bg-[#F59E0B]/10 flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <h3 className="text-xl font-black mb-2 text-white uppercase tracking-tight">Confirm Void</h3>
                            <p className="mb-8 text-white/40 text-[10px] font-medium leading-relaxed">This transaction will be voided. This action is irreversible.</p>
                            <div className="flex flex-col gap-3">
                                <button className="w-full py-4 rounded-xl bg-[#F59E0B] text-black font-black uppercase tracking-widest text-[10px] hover:bg-white transition-all shadow-lg" onClick={() => handleDelete(showDelete!)}>Void Transaction</button>
                                <button className="w-full py-4 rounded-xl text-white/30 font-black uppercase tracking-widest text-[10px]" onClick={() => setShowDelete(null)}>Dismiss</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
