"use client";
import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { customersAPI, salesAPI, creditsAPI } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

export default function CustomerProfilePage() {
    const { id } = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const [customer, setCustomer] = useState<any>(null);
    const [sales, setSales] = useState<any[]>([]);
    const [credits, setCredits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'credits'>('overview');

    useEffect(() => {
        if (id) {
            fetchCustomerData();
        }
    }, [id]);

    async function fetchCustomerData() {
        try {
            setLoading(true);
            const [customerData, allSales, allCredits] = await Promise.all([
                customersAPI.getOne(id as string),
                salesAPI.getAll() as Promise<any[]>,
                creditsAPI.getAll() as Promise<any[]>
            ]);

            setCustomer(customerData);
            setSales(allSales.filter((s: any) => s.customerId === id));
            setCredits(allCredits.filter((c: any) => c.customerId === id));
        } catch (error: any) {
            showToast(error.message || 'Failed to fetch customer details', 'error');
        } finally {
            setLoading(false);
        }
    }

    const stats = useMemo(() => {
        if (!sales.length && !credits.length) return { totalSpent: 0, pendingCredits: 0, lastActivity: 'None' };

        const totalSpent = sales.reduce((sum, s) => sum + s.amount, 0);
        const pendingCredits = credits.filter(c => c.status === 'Pending').reduce((sum, c) => sum + c.amount, 0);

        const allDates = [
            ...sales.map(s => new Date(s.createdAt)),
            ...credits.map(c => new Date(c.createdAt))
        ].sort((a, b) => b.getTime() - a.getTime());

        const lastActivity = allDates.length > 0
            ? allDates[0].toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'None';

        return { totalSpent, pendingCredits, lastActivity };
    }, [sales, credits]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
                <div className="w-12 h-12 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin"></div>
                <div className="text-[#C5A059] text-xs font-black uppercase tracking-[0.3em] animate-pulse">Synchronizing Profile...</div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-8">
                <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">Profile Not Found</h1>
                <p className="text-white/40 mb-8 max-w-md">The customer record you are looking for might have been removed or the ID is incorrect.</p>
                <Link href="/customers" className="px-8 py-4 rounded-full bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-[#C5A059] transition-all">
                    Return to Registry
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 min-h-[80vh] p-4 text-white font-sans selection:bg-[#C5A059] selection:text-black">
            {/* Top Navigation & Actions */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="group flex items-center gap-3 text-white/40 hover:text-white transition-colors"
                >
                    <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center group-hover:border-[#C5A059]/40 group-hover:bg-[#C5A059]/10 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Go Back</span>
                </button>

                <div className="flex gap-3">
                    <button className="px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/5 text-[10px] font-black uppercase tracking-widest hover:border-white/20 transition-all active:scale-95">
                        Download Report
                    </button>
                </div>
            </div>

            {/* Profile Header Card */}
            <div className="relative overflow-hidden rounded-[2.5rem] glass-elevated border border-white/10 shadow-2xl p-6 md:p-10">
                <div className="absolute inset-0 z-0 bg-white/[0.01]"></div>
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_0%_0%,rgba(197,160,89,0.06),transparent_70%)]"></div>

                <div className="relative z-10 flex flex-col md:flex-row gap-8 md:items-center">
                    {/* Large Avatar */}
                    <div className="relative w-32 h-32 shrink-0">
                        <div className="absolute -inset-1.5 bg-gradient-to-tr from-[#C5A059] to-[#8C7853] rounded-[2rem] opacity-20 blur-md" />
                        <div className="relative w-full h-full rounded-[2rem] border-2 border-white/10 bg-[#0a0a0f] p-1.5 overflow-hidden shadow-2xl">
                            <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative">
                                <Image
                                    src={customer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=1a1a1a&color=fff`}
                                    alt={customer.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 px-3 py-1 rounded-full border-[3px] border-[#0a0a0f] text-[8px] font-black uppercase tracking-wider z-20 ${customer.status === 'Active' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-[#F59E0B] text-black'}`}>
                            {customer.status}
                        </div>
                    </div>

                    {/* Customer Identity & Quick Info */}
                    <div className="flex-1 space-y-5">
                        <div>
                            <div className="flex items-center gap-3 mb-1.5">
                                <div className="h-[2px] w-6 bg-[#C5A059]"></div>
                                <span className="text-[9px] uppercase tracking-[0.4em] text-[#C5A059] font-bold">Verified Account</span>
                                <span className="text-[9px] uppercase tracking-[0.2em] text-white/20 font-black italic">#{customer.id.slice(-6).toUpperCase()}</span>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase mb-1 italic">
                                {customer.name}
                            </h1>
                            <p className="text-white/30 text-[11px] font-black uppercase tracking-tight font-mono">
                                {customer.email} // {customer.phone}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#C5A059]/30 transition-colors group">
                                <span className="block text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-1 group-hover:text-[#C5A059] transition-colors">Total Spent</span>
                                <span className="text-base font-black text-white tracking-tighter">Le {stats.totalSpent.toLocaleString()}</span>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#F59E0B]/30 transition-colors group">
                                <span className="block text-[8px] font-black text-[#F59E0B]/40 uppercase tracking-[0.2em] mb-1 group-hover:text-[#F59E0B] transition-colors">Current Debt</span>
                                <span className="text-base font-black text-white tracking-tighter">Le {customer.totalDebt.toLocaleString()}</span>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/20 transition-colors group">
                                <span className="block text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-1 group-hover:text-white transition-colors">Volume</span>
                                <span className="text-base font-black text-white tracking-tighter">{sales.length} Sales</span>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#C5A059]/30 transition-colors group">
                                <span className="block text-[8px] font-black text-[#C5A059]/40 uppercase tracking-[0.2em] mb-1 group-hover:text-[#C5A059] transition-colors">Activity</span>
                                <span className="text-base font-black text-white tracking-tighter">{stats.lastActivity}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/[0.03] border border-white/5 self-start">
                {(['overview', 'sales', 'credits'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab
                            ? 'bg-white text-black shadow-xl ring-4 ring-white/10'
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-8"
                        >
                            <div className="space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#C5A059]">General Information</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between py-4 border-b border-white/5">
                                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Address</span>
                                        <span className="text-xs font-bold text-white text-right">{customer.address || 'Not Registered'}</span>
                                    </div>
                                    <div className="flex justify-between py-4 border-b border-white/5">
                                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Gender</span>
                                        <span className="text-xs font-bold text-white uppercase">{customer.gender || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between py-4 border-b border-white/5">
                                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Member Since</span>
                                        <span className="text-xs font-bold text-white">{new Date(customer.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#C5A059]">Signature Verification</h3>
                                <div className="aspect-[3/1] rounded-[2rem] border-2 border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center overflow-hidden">
                                    {customer.signature ? (
                                        <div className="relative w-full h-full p-6 italic text-4xl font-serif text-white/60 flex items-center justify-center">
                                            {customer.signature}
                                            <div className="absolute bottom-4 right-8 text-[8px] font-black uppercase text-emerald-500/40">Verified Match</div>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-black text-white/10 uppercase tracking-widest">No Authorized Signature Found</span>
                                    )}
                                </div>

                                {customer.attachment && (
                                    <div className="mt-8 space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#C5A059]">Identity Documentation</h3>
                                        <div className="relative group/doc aspect-video rounded-3xl border border-white/10 bg-black/20 overflow-hidden flex items-center justify-center">
                                            <Image
                                                src={customer.attachment}
                                                alt="ID Document"
                                                fill
                                                className="object-contain group-hover:scale-105 transition-transform duration-700"
                                                unoptimized
                                            />
                                            <a
                                                href={customer.attachment}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="absolute inset-0 bg-black/40 opacity-0 group-hover/doc:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-black uppercase tracking-[0.2em] italic"
                                            >
                                                View Document Full Screen
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'sales' && (
                        <motion.div
                            key="sales"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {sales.length === 0 ? (
                                <div className="py-20 text-center border border-dashed border-white/10 rounded-[3rem] bg-white/5">
                                    <p className="text-white/20 text-xs font-black uppercase tracking-widest">No sales records found for this customer</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {sales.map((sale: any) => (
                                        <div key={sale.id} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex items-center justify-between group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#C5A059] group-hover:bg-[#C5A059] group-hover:text-black transition-all">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-white uppercase mb-0.5">Sale Reference #{sale.id.slice(-6).toUpperCase()}</h4>
                                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{new Date(sale.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-lg font-black text-white tracking-tighter">Le {sale.amount.toLocaleString()}</span>
                                                <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 uppercase tracking-widest">{sale.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'credits' && (
                        <motion.div
                            key="credits"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {credits.length === 0 ? (
                                <div className="py-20 text-center border border-dashed border-white/10 rounded-[3rem] bg-white/5">
                                    <p className="text-white/20 text-xs font-black uppercase tracking-widest">No credit entries registered</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {credits.map((credit: any) => (
                                        <div key={credit.id} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex items-center justify-between group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B] group-hover:bg-[#F59E0B] group-hover:text-black transition-all">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-sm font-black text-white uppercase mb-0.5">Credit Agreement #{credit.id.slice(-6).toUpperCase()}</h4>
                                                        {credit.image && (
                                                            <div className="w-4 h-4 rounded bg-[#C5A059]/10 flex items-center justify-center text-[#C5A059]">
                                                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Due: {new Date(credit.dueDate).toLocaleDateString('en-GB')}</p>
                                                    {credit.notes && <p className="text-[9px] text-white/20 italic mt-1 line-clamp-1">{credit.notes}</p>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-lg font-black text-white tracking-tighter">Le {credit.amount.toLocaleString()}</span>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${credit.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[#F59E0B]/10 text-[#F59E0B]'
                                                    }`}>{credit.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
