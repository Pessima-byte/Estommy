"use client";
import { useCredits } from "../../contexts/CreditsContext";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AddCreditModal } from "../../components/forms/AddCreditModal";
import { CreditDetailsModal } from "../../components/modals/CreditDetailsModal";
import { useSearchParams } from "next/navigation";
import { exportToCSV } from "../../utils/csvExport";

export default function CreditsPage() {
    const { credits } = useCredits();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [showAdd, setShowAdd] = useState(false);
    const [selectedCredit, setSelectedCredit] = useState<any>(null);

    // Update search if URL changes
    useEffect(() => {
        const query = searchParams.get('search');
        if (query) setSearchQuery(query);
    }, [searchParams]);

    const totalOutstanding = credits.filter(c => c.status !== 'Paid').reduce((acc, c) => acc + (c.amount - (c.amountPaid || 0)), 0);
    const totalCredits = credits.length;

    const filteredCredits = useMemo(() => {
        return credits.filter(credit => {
            const matchesSearch = !searchQuery ||
                (typeof credit.customer === 'string'
                    ? credit.customer
                    : (credit.customer?.name || '')
                ).toLowerCase().includes(searchQuery.toLowerCase()) ||
                (credit.notes || credit.description || '').toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [credits, searchQuery]);

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
                            <span className="text-[9px] uppercase tracking-[0.4em] text-[#C5A059] font-bold">Accounts Receivable</span>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-black bg-gradient-to-r from-white via-white/80 to-white/40 bg-clip-text text-transparent mb-1 tracking-tighter uppercase">
                            Credit Ledger
                        </h1>
                        <p className="text-[11px] text-white/40 max-w-sm font-medium leading-relaxed">
                            Track outstanding debts and credit history.
                        </p>
                    </div>

                    <div className="flex gap-6">
                        <div className="text-right px-6 border-r border-white/5">
                            <div className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold mb-0.5">Total Records</div>
                            <div className="text-2xl font-black text-white tracking-tighter">{totalCredits}</div>
                        </div>
                        <div className="text-right px-6">
                            <div className="text-[9px] uppercase tracking-widest text-[#C5A059] font-bold mb-0.5">Outstanding</div>
                            <div className="text-2xl font-black text-white tracking-tighter">
                                <span className="text-[10px] text-[#C5A059]/50 mr-1">LE</span>
                                {totalOutstanding.toLocaleString()}
                            </div>
                        </div>
                        <button
                            className="px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 h-fit self-center flex items-center gap-2"
                            onClick={() => exportToCSV(filteredCredits, 'credits')}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export CSV
                        </button>
                        <button
                            className="px-6 py-3.5 rounded-full bg-white text-black text-[9px] font-black uppercase tracking-[0.2em] hover:scale-105 hover:bg-[#C5A059] transition-all shadow-xl active:scale-95 h-fit self-center"
                            onClick={() => setShowAdd(true)}
                        >
                            Create Record
                        </button>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="mb-2">
                <input
                    type="text"
                    placeholder="Search debtors..."
                    className="w-full md:w-1/3 pl-6 pr-6 py-3 rounded-2xl bg-white/[0.03] border border-white/5 focus:outline-none focus:border-[#C5A059]/50 text-white placeholder:text-white/10 text-xs font-bold transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* List */}
            {filteredCredits.length === 0 ? (
                <div className="p-32 text-center border border-dashed border-white/10 rounded-[3rem] bg-white/5 backdrop-blur-sm">
                    <div className="text-white/20 text-lg font-bold mb-2">No Credit Records</div>
                    <p className="text-white/10 text-xs uppercase tracking-widest">No outstanding credits or history found.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {filteredCredits.map((credit, idx) => (
                        <motion.div
                            key={credit.id || `credit-${idx}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#252530] p-6 rounded-[2rem] border border-white/5 flex flex-col md:flex-row justify-between items-center hover:border-[#C5A059]/20 transition-all shadow-lg cursor-pointer active:scale-[0.98]"
                            onClick={() => setSelectedCredit(credit)}
                        >
                            <div className="flex items-center gap-4 mb-4 md:mb-0 w-full md:w-auto">
                                <div className="w-12 h-12 rounded-full bg-[#C5A059]/10 flex items-center justify-center text-[#C5A059]">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white">{credit.customer?.name}</h3>
                                    <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest">{credit.date || 'Recent Transaction'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                                <div className="text-right">
                                    <div className="text-[9px] uppercase tracking-widest text-[#C5A059] font-bold mb-0.5">Amount Due</div>
                                    <div className="text-xl font-black text-white tracking-tight">LE {(credit.amount - (credit.amountPaid || 0)).toLocaleString()}</div>
                                </div>
                                <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border ${credit.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                                    }`}>
                                    {credit.status || 'Pending'}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
            {/* Modal */}
            <AnimatePresence>
                {showAdd && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0"
                            onClick={() => setShowAdd(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-[#0F0F0F] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div key="modal-content" className="max-h-[85vh] overflow-y-auto px-8 py-8 custom-scrollbar">
                                <AddCreditModal onClose={() => setShowAdd(false)} />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Details Modal */}
            {selectedCredit && (
                <CreditDetailsModal
                    credit={credits.find(c => c.id === selectedCredit.id) || selectedCredit}
                    onClose={() => setSelectedCredit(null)}
                />
            )}
        </div>
    );
}
