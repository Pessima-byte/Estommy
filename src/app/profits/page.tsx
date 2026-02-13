"use client";
import { useProfits } from "../../contexts/ProfitsContext";
import { useSales } from "../../contexts/SalesContext";
import { useProducts } from "../../contexts/ProductsContext";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";

export default function ProfitsPage() {
    const { profits } = useProfits();
    const { sales } = useSales();
    const { products } = useProducts();
    const [filterType, setFilterType] = useState('All');

    const financials = useMemo(() => {
        // Calculate Sales Revenue and COGS
        let salesRevenue = 0;
        let cogs = 0;

        const salesTransactions = sales.map(sale => {
            const product = products.find(p => p.id === sale.productId || p.id === sale.product?.id);
            const amount = sale.amount || 0;
            // Use snapshot cost if available, otherwise fallback to current cost (for legacy records)
            const cost = (sale as any).costPriceSnapshot !== undefined ? (sale as any).costPriceSnapshot : (product?.costPrice || 0);

            // Hybrid Accounting:
            // 1. Completed Sales: Recognize Revenue (+Access) and COGS (-Stock) immediately.
            // 2. Credit Sales: Recognize COGS (-Stock) immediately. Defer Revenue to 'Repayment' (Manual Income).
            if (sale.status === 'Completed' || !sale.status) {
                salesRevenue += amount;
                cogs += cost;
            } else if (sale.status === 'Credit') {
                cogs += cost;
            }

            return {
                id: sale.id,
                type: 'Income', // Sales are Income
                category: 'Sales',
                description: `Sale - ${product?.name || 'Unknown Product'}`,
                amount: amount,
                date: sale.date,
                isSystem: true // Flag to identify system-generated records
            };
        });

        // Calculate Manual Profits (Income/Expense)
        const manualTransactions = profits.map(p => ({
            ...p,
            isSystem: false,
            date: p.date || p.createdAt || new Date().toISOString() // Ensure date exists
        }));

        const manualIncome = manualTransactions.filter(p => p.type === 'Income').reduce((acc, p) => acc + p.amount, 0);
        const manualExpenses = manualTransactions.filter(p => p.type === 'Expense').reduce((acc, p) => acc + p.amount, 0);

        // COGS entry (Virtual Expense)
        // We don't list COGS as individual transactions in the list to avoid clutter, 
        // but we include it in the total calculations.

        return {
            transactions: [...salesTransactions, ...manualTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            totalRevenue: salesRevenue + manualIncome,
            totalExpenses: cogs + manualExpenses,
            netProfit: (salesRevenue + manualIncome) - (cogs + manualExpenses)
        };
    }, [sales, products, profits]);

    const filteredTransactions = useMemo(() => {
        return financials.transactions.filter(t => filterType === 'All' || t.type === filterType);
    }, [financials.transactions, filterType]);

    return (
        <div className="flex flex-col gap-8 min-h-[80vh] p-4 text-white font-sans selection:bg-[#C5A059] selection:text-black">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] glass-elevated border border-white/10 shadow-2xl p-6 md:p-8 mb-4 transition-all duration-700">
                <div className="absolute inset-0 z-0 bg-white/[0.01]"></div>
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_-30%,rgba(16,185,129,0.08),transparent_70%)] opacity-40"></div>
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_80%_120%,rgba(16,185,129,0.03),transparent_70%)] opacity-40"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="h-px w-6 bg-emerald-500"></div>
                            <span className="text-[9px] uppercase tracking-[0.4em] text-emerald-500 font-bold">Financials</span>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-black bg-gradient-to-r from-white via-white/80 to-white/40 bg-clip-text text-transparent mb-1 tracking-tighter uppercase">
                            Revenue Stream
                        </h1>
                        <p className="text-[11px] text-white/40 max-w-sm font-medium leading-relaxed">
                            Monitor cash flow, expenses, and net profitability.
                        </p>
                    </div>

                    <div className="flex gap-6">
                        <div className="text-right px-6 border-r border-white/5">
                            <div className="text-[9px] uppercase tracking-widest text-[#C5A059] font-bold mb-0.5">Expenses</div>
                            <div className="text-2xl font-black text-white tracking-tighter">
                                <span className="text-[10px] text-[#C5A059]/50 mr-1">LE</span>
                                {financials.totalExpenses.toLocaleString()}
                            </div>
                        </div>
                        <div className="text-right px-6">
                            <div className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold mb-0.5">Net Profit</div>
                            <div className="text-2xl font-black text-white tracking-tighter">
                                <span className="text-[10px] text-emerald-400/50 mr-1">LE</span>
                                {financials.netProfit.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-4 mb-2">
                {['All', 'Income', 'Expense'].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${filterType === type
                            ? 'bg-white text-black border-white'
                            : 'bg-white/5 text-white/40 border-transparent hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* List */}
            {filteredTransactions.length === 0 ? (
                <div className="p-32 text-center border border-dashed border-white/10 rounded-[3rem] bg-white/5 backdrop-blur-sm">
                    <div className="text-white/20 text-lg font-bold mb-2">No Financial Data</div>
                    <p className="text-white/10 text-xs uppercase tracking-widest">No income or expense records found.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {filteredTransactions.map((transaction, idx) => (
                        <motion.div
                            key={transaction.id || idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-[#252530] p-6 rounded-[2rem] border border-white/5 flex flex-col md:flex-row justify-between items-center hover:bg-[#2A2A35] transition-all shadow-lg group"
                        >
                            <div className="flex items-center gap-4 mb-4 md:mb-0 w-full md:w-auto">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${transaction.type === 'Income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[#C5A059]/10 text-[#C5A059]'
                                    }`}>
                                    {transaction.type === 'Income' ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white group-hover:text-white transition-colors capitalize">{transaction.description}</h3>
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                                        {new Date(transaction.date).toLocaleDateString()}
                                        {transaction.isSystem && <span className="ml-2 px-1.5 py-0.5 rounded bg-white/10 text-white/60 text-[8px]">AUTO</span>}
                                    </p>
                                </div>
                            </div>
                            <div className={`text-xl font-black tracking-tighter ${transaction.type === 'Income' ? 'text-emerald-400' : 'text-[#C5A059]'
                                }`}>
                                {transaction.type === 'Income' ? '+' : '-'} LE {transaction.amount.toLocaleString()}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
