"use client";
import { useState } from 'react';
import { useDebtors } from '@/contexts/DebtorsContext';
import { useCredits } from '@/contexts/CreditsContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditDetailsModal } from '@/components/modals/CreditDetailsModal';
import { AddCreditModal } from '@/components/forms/AddCreditModal';
import { AddCustomerModal } from '@/components/forms/AddCustomerModal';
import { exportToCSV } from '@/utils/csvExport';

export default function DebtorsPage() {
    const { debtors, loading, error } = useDebtors();
    const { credits } = useCredits();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('debt_desc');
    const [selectedCredit, setSelectedCredit] = useState<any>(null);
    const [editingDebtor, setEditingDebtor] = useState<any>(null);
    const [showAdd, setShowAdd] = useState(false);

    const handleDebtorClick = (debtor: any) => {
        // Find the most recent credit for this debtor
        const customerCredits = credits.filter(c => c.customerId === debtor.id);
        if (customerCredits.length > 0) {
            setSelectedCredit(customerCredits[0]);
        }
    };

    const filteredDebtors = debtors.filter(debtor =>
        debtor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debtor.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        switch (sortBy) {
            case 'debt_desc':
                return (b.totalDebt || 0) - (a.totalDebt || 0);
            case 'debt_asc':
                return (a.totalDebt || 0) - (b.totalDebt || 0);
            case 'name_asc':
                return a.name.localeCompare(b.name);
            case 'name_desc':
                return b.name.localeCompare(a.name);
            case 'newest':
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case 'oldest':
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            default:
                return 0;
        }
    });

    const totalDebt = filteredDebtors.reduce((acc, curr) => acc + (curr.totalDebt || 0), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C5A059]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <div className="text-red-400 mb-2 font-bold">Error Loading Debtors</div>
                <div className="text-white/50 text-sm">{error}</div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header / Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">
                        Debtors
                    </h1>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                        Customers with outstanding balances
                    </p>
                </div>

                <div className="bg-[#C5A059]/10 border border-[#C5A059]/20 px-6 py-4 rounded-2xl flex flex-col items-end">
                    <span className="text-[10px] text-[#C5A059] font-black uppercase tracking-[0.2em] mb-1">Total Outstanding</span>
                    <span className="text-2xl font-black text-white tracking-tight">LE {totalDebt.toLocaleString()}</span>
                </div>
            </div>

            {/* Search & Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-white/20 group-focus-within:text-[#C5A059] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-12 pr-4 py-4 border border-white/5 rounded-[2rem] bg-white/5 text-white placeholder-white/20 focus:outline-none focus:bg-white/10 focus:border-[#C5A059]/30 sm:text-sm transition-all shadow-inner"
                        placeholder="Search debtors by name or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <select
                            className="w-full pl-6 pr-10 py-4 rounded-[2rem] bg-white/5 border border-white/5 focus:outline-none focus:border-[#C5A059]/30 text-white appearance-none cursor-pointer text-[10px] font-black uppercase tracking-widest transition-all shadow-inner"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="debt_desc" className="bg-[#0f0f0f]">Highest Debt</option>
                            <option value="debt_asc" className="bg-[#0f0f0f]">Lowest Debt</option>
                            <option value="name_asc" className="bg-[#0f0f0f]">Name (A-Z)</option>
                            <option value="name_desc" className="bg-[#0f0f0f]">Name (Z-A)</option>
                            <option value="newest" className="bg-[#0f0f0f]">Recently Added</option>
                            <option value="oldest" className="bg-[#0f0f0f]">Oldest First</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => exportToCSV(filteredDebtors, 'debtors')}
                    className="w-full md:w-auto px-8 py-4 rounded-[2rem] bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export CSV
                </button>

                <button
                    onClick={() => setShowAdd(true)}
                    className="w-full md:w-auto px-8 py-4 rounded-[2rem] bg-white hover:bg-[#C5A059] text-black font-black uppercase tracking-[0.2em] text-[10px] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Debtor
                </button>
            </div>

            <AnimatePresence>
                {editingDebtor && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-2xl p-4 overflow-y-auto" onClick={() => setEditingDebtor(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 40 }}
                            className="relative rounded-[2.5rem] bg-gradient-to-br from-[#1A1A23] to-[#0F0F0F] border border-white/10 py-8 px-10 max-w-4xl w-full shadow-[0_0_150px_rgba(0,0,0,0.8)] overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C5A059]/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
                            <AddCustomerModal
                                initialCustomer={editingDebtor}
                                onClose={() => setEditingDebtor(null)}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {(() => {
                        const latestCreditsMap = credits.reduce((acc, credit) => {
                            const existing = acc[credit.customerId];
                            if (!existing || new Date(credit.createdAt) > new Date(existing.createdAt)) {
                                acc[credit.customerId] = credit;
                            }
                            return acc;
                        }, {} as Record<string, any>);

                        return filteredDebtors.map((debtor) => {
                            const latestCredit = latestCreditsMap[debtor.id];

                            return (
                                <motion.div
                                    key={debtor.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group relative bg-[#1E1E24] border border-white/5 rounded-[2.2rem] p-7 hover:border-[#C5A059]/30 transition-all duration-500 overflow-hidden cursor-pointer shadow-xl hover:shadow-[#C5A059]/5 active:scale-[0.98]"
                                    onClick={() => handleDebtorClick(debtor)}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#C5A059]/0 to-[#C5A059]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                    <div className="relative z-10 flex items-start justify-between mb-8">
                                        <div className="flex items-center gap-5">
                                            <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/40 group-hover:border-[#C5A059]/40 transition-colors">
                                                {debtor.avatar ? (
                                                    <img src={debtor.avatar} alt={debtor.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white/30 font-black text-xl italic bg-gradient-to-br from-white/5 to-transparent">
                                                        {debtor.name[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white leading-tight group-hover:text-[#C5A059] transition-colors italic tracking-tight">{debtor.name}</h3>
                                                <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest mt-0.5">{debtor.phone || 'No Contact'}</p>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-[#C5A059] group-hover:text-black transition-all duration-500 group-hover:rotate-45 shadow-inner">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Additional Image / Receipt Preview (Similar to Mobile) */}
                                    {latestCredit?.image && (
                                        <div className="relative mb-8 rounded-[1.5rem] overflow-hidden aspect-[16/8] border border-white/10 group/img bg-black shadow-2xl">
                                            <img
                                                src={latestCredit.image}
                                                alt="Receipt"
                                                className="w-full h-full object-cover opacity-80 group-hover/img:scale-110 group-hover/img:opacity-100 transition-all duration-1000"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                                            {latestCredit.notes && (
                                                <div className="absolute bottom-4 left-4 right-4">
                                                    <p className="text-[10px] text-white font-black italic truncate bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10 inline-block shadow-lg">
                                                        {latestCredit.notes.split('\n')[0]}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="relative z-10 pt-6 border-t border-white/5 flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-[#C5A059] uppercase tracking-[0.2em] font-black italic">Current Liability</p>
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-xs font-black text-white/40 tracking-tighter italic">LE</span>
                                                <span className="text-3xl font-black text-white tracking-tighter leading-none">
                                                    {debtor.totalDebt?.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-[#C5A059] hover:text-black text-white/40 text-[10px] font-black uppercase tracking-widest transition-all duration-500 border border-white/5 hover:border-transparent active:scale-90"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDebtorClick(debtor);
                                                }}
                                            >
                                                History
                                            </button>
                                            <button className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white hover:text-black text-white/40 text-[10px] font-black uppercase tracking-widest transition-all duration-500 border border-white/5 hover:border-transparent active:scale-90"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingDebtor(debtor);
                                                }}
                                            >
                                                Profile
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        });
                    })()}
                </AnimatePresence>
            </div>

            {/* Details Modal */}
            {selectedCredit && (
                <CreditDetailsModal
                    credit={selectedCredit}
                    onClose={() => setSelectedCredit(null)}
                />
            )}

            {/* Add Record Modal */}
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

                            <AddCreditModal onClose={() => setShowAdd(false)} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {filteredDebtors.length === 0 && (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
                    <p className="text-white/30">No debtors found matching your search.</p>
                </div>
            )}
        </div>
    );
}
