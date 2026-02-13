"use client";
import React, { useMemo, useState } from 'react';
import { useSales } from '../../contexts/SalesContext';
import { useProducts } from '../../contexts/ProductsContext';
import { useCredits } from '../../contexts/CreditsContext';
import { useProfits } from '../../contexts/ProfitsContext';
import { motion, AnimatePresence } from 'framer-motion';

// Chart components can be added later (e.g., Recharts), for now using CSS bars.

export default function ReportsPage() {
    const { sales, loading: salesLoading } = useSales();
    const { products, loading: productsLoading } = useProducts();
    const { credits, loading: creditsLoading } = useCredits();
    const { profits, loading: profitsLoading } = useProfits();

    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');

    // --- Data Aggregation Logic ---

    const reportData = useMemo(() => {
        const now = new Date();
        const startOfRange = new Date();

        if (timeRange === 'week') startOfRange.setDate(now.getDate() - 7);
        if (timeRange === 'month') startOfRange.setMonth(now.getMonth() - 1);
        if (timeRange === 'year') startOfRange.setFullYear(now.getFullYear() - 1);
        if (timeRange === 'all') startOfRange.setFullYear(1970); // Effectively all time

        // Filter Sales within Range
        const salesInRange = sales.filter(s => new Date(s.date) >= startOfRange);

        // Filter Manual Profits/Expenses within Range
        const profitsInRange = profits.filter(p => new Date(p.date) >= startOfRange);

        // --- 1. Financial Metrics ---

        let totalRevenue = 0;
        let totalCOGS = 0;
        let totalExpenses = 0;
        let totalUnitsSold = 0;
        let grossSales = 0; // Total sales value regardless of payment status (Cash + Credit)

        salesInRange.forEach(sale => {
            const amount = typeof sale.amount === 'number' ? sale.amount : parseFloat(sale.amount);
            const cost = (sale as any).costPriceSnapshot || 0; // Use snapshot

            // Gross Sales (Business Volume)
            grossSales += amount;
            totalUnitsSold += 1; // Assuming 1 unit per sale record for now based on current schema

            // Revenue (Cash Basis) - Realized Cash
            if (sale.status === 'Completed' || !sale.status) { // Legacy or Completed
                totalRevenue += amount;
            }

            // COGS (Accrual Basis) - Realized Cost
            // We count cost for ALL sales (Cash + Credit) as the item is gone.
            totalCOGS += cost;
        });

        // Add Manual Income (e.g. Repayments) to Revenue
        const manualIncome = profitsInRange.filter(p => p.type === 'Income').reduce((acc, p) => acc + p.amount, 0);
        totalRevenue += manualIncome;

        // Add Manual Expenses to Expenses
        const manualExpenses = profitsInRange.filter(p => p.type === 'Expense').reduce((acc, p) => acc + p.amount, 0);
        totalExpenses += manualExpenses;

        // Net Profit = Revenue (Cash) - COGS (All) - Expenses (All)
        const netProfit = totalRevenue - totalCOGS - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        // --- 2. Inventory Metrics ---
        // (Snapshot at current time, not historical)
        const totalStockValue = products.reduce((acc, p) => acc + (p.stock * p.price), 0);
        const totalStockCost = products.reduce((acc, p) => acc + (p.stock * p.costPrice), 0);
        const potentialProfit = totalStockValue - totalStockCost;
        const lowStockItems = products.filter(p => p.stock <= 5 && p.stock > 0).length;
        const outOfStockItems = products.filter(p => p.stock === 0).length;

        // --- 3. Credit Metrics ---
        // Outstanding Debt is current state, not historical
        const totalOutstandingDebt = credits.reduce((acc, c) => {
            if (c.status !== 'Paid') {
                return acc + (c.amount - (c.amountPaid || 0));
            }
            return acc;
        }, 0);
        const overdueCredits = credits.filter(c => {
            return c.status !== 'Paid' && new Date(c.dueDate) < now;
        }).length;


        // --- 4. Product Performance (Top Sellers) ---
        const productPerformance: Record<string, { name: string, qty: number, revenue: number }> = {};
        salesInRange.forEach(sale => {
            const pid = sale.productId;
            if (!productPerformance[pid]) {
                const pName = products.find(p => p.id === pid)?.name || 'Unknown Product';
                productPerformance[pid] = { name: pName, qty: 0, revenue: 0 };
            }
            productPerformance[pid].qty += 1;
            productPerformance[pid].revenue += (typeof sale.amount === 'number' ? sale.amount : parseFloat(sale.amount));
        });

        const topProducts = Object.values(productPerformance)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);


        return {
            financials: {
                revenue: totalRevenue,
                cogs: totalCOGS,
                expenses: totalExpenses,
                netProfit: netProfit,
                profitMargin: profitMargin,
                grossSales: grossSales
            },
            inventory: {
                value: totalStockValue,
                cost: totalStockCost,
                potentialProfit: potentialProfit,
                lowStock: lowStockItems,
                outOfStock: outOfStockItems,
                stockCount: products.reduce((acc, p) => acc + p.stock, 0)
            },
            credits: {
                outstanding: totalOutstandingDebt,
                overdueCount: overdueCredits
            },
            topProducts,
            salesVolume: totalUnitsSold
        };

    }, [sales, products, credits, profits, timeRange]);

    const isLoading = salesLoading || productsLoading || creditsLoading || profitsLoading;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/10 border-t-[#C5A059] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white p-4 md:p-8 flex flex-col gap-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-2 uppercase">
                        Executive <span className="text-[#C5A059] italic">Report</span>
                    </h1>
                    <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-medium">
                        System-wide financial & inventory aggregation
                    </p>
                </div>

                {/* Time Filter */}
                <div className="bg-[#1A1A23] p-1.5 rounded-2xl border border-white/10 flex">
                    {(['week', 'month', 'year', 'all'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeRange(t)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${timeRange === t
                                    ? 'bg-white text-black shadow-lg scale-105'
                                    : 'text-white/30 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Net Profit Card */}
                <div className="relative group bg-[#1A1A23] rounded-[2.5rem] p-8 border border-white/5 overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${reportData.financials.netProfit >= 0 ? 'from-emerald-500/10' : 'from-rose-500/10'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                    <div className="relative z-10">
                        <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Net Profit (Cash)</div>
                        <div className={`text-3xl font-black tracking-tighter mb-2 ${reportData.financials.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            <span className="text-lg opacity-50 mr-1">LE</span>
                            {reportData.financials.netProfit.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`text-[10px] px-2 py-1 rounded-lg font-black uppercase tracking-widest ${reportData.financials.profitMargin >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                {reportData.financials.profitMargin.toFixed(1)}% Margin
                            </div>
                        </div>
                    </div>
                </div>

                {/* Revenue Card */}
                <div className="relative group bg-[#1A1A23] rounded-[2.5rem] p-8 border border-white/5 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#C5A059]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                        <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Total Revenue</div>
                        <div className="text-3xl font-black text-white tracking-tighter mb-2">
                            <span className="text-lg text-[#C5A059] opacity-50 mr-1">LE</span>
                            {reportData.financials.revenue.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-white/40 font-medium">
                            Includes Sales & Repayments
                        </div>
                    </div>
                </div>

                {/* Expenses & COGS */}
                <div className="relative group bg-[#1A1A23] rounded-[2.5rem] p-8 border border-white/5 overflow-hidden">
                    <div className="relative z-10">
                        <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Costs & Expenses</div>
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <div className="text-xl font-black text-white tracking-tighter">
                                    <span className="text-xs text-[#C5A059] opacity-50 mr-1">LE</span>
                                    {reportData.financials.cogs.toLocaleString()}
                                </div>
                                <div className="text-[8px] uppercase tracking-widest text-[#C5A059] font-bold">COGS</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-black text-white tracking-tighter">
                                    <span className="text-xs text-rose-400 opacity-50 mr-1">LE</span>
                                    {reportData.financials.expenses.toLocaleString()}
                                </div>
                                <div className="text-[8px] uppercase tracking-widest text-rose-400 font-bold">OpEx</div>
                            </div>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full mt-4 flex overflow-hidden">
                            <div style={{ width: `${(reportData.financials.cogs / (reportData.financials.cogs + reportData.financials.expenses || 1)) * 100}%` }} className="bg-[#C5A059]"></div>
                            <div className="flex-1 bg-rose-500"></div>
                        </div>
                    </div>
                </div>

                {/* Outstanding Debt */}
                <div className="relative group bg-[#1A1A23] rounded-[2.5rem] p-8 border border-white/5 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                        <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Receivables (Debt)</div>
                        <div className="text-3xl font-black text-white tracking-tighter mb-2">
                            <span className="text-lg text-amber-600 opacity-50 mr-1">LE</span>
                            {reportData.credits.outstanding.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2">
                            {reportData.credits.overdueCount > 0 && (
                                <div className="text-[10px] px-2 py-1 rounded-lg font-black uppercase tracking-widest bg-rose-500/20 text-rose-400">
                                    {reportData.credits.overdueCount} Overdue
                                </div>
                            )}
                            <div className="text-[10px] text-white/40 font-medium">
                                Uncollected Revenue
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Section: Inventory Valuation */}
                <div className="lg:col-span-1 bg-[#1A1A23] rounded-[2.5rem] p-8 border border-white/5">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-px w-8 bg-[#C5A059]"></div>
                        <h3 className="text-lg font-black uppercase tracking-tighter italic">Inventory Health</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-between items-center py-4 border-b border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Asset Value (Retail)</span>
                            <span className="text-sm font-black text-white tracking-tight">LE {reportData.inventory.value.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-4 border-b border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Asset Cost</span>
                            <span className="text-sm font-black text-white/70 tracking-tight">LE {reportData.inventory.cost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-4 border-b border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059]">Potential Profit</span>
                            <span className="text-sm font-black text-[#C5A059] tracking-tight">LE {reportData.inventory.potentialProfit.toLocaleString()}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="bg-white/[0.03] p-4 rounded-2xl text-center">
                                <div className="text-2xl font-black text-rose-400 mb-1">{reportData.inventory.outOfStock}</div>
                                <div className="text-[8px] uppercase tracking-widest text-white/30">Out of Stock</div>
                            </div>
                            <div className="bg-white/[0.03] p-4 rounded-2xl text-center">
                                <div className="text-2xl font-black text-amber-400 mb-1">{reportData.inventory.lowStock}</div>
                                <div className="text-[8px] uppercase tracking-widest text-white/30">Low Stock</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section: Top Products */}
                <div className="lg:col-span-2 bg-[#1A1A23] rounded-[2.5rem] p-8 border border-white/5">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-px w-8 bg-[#C5A059]"></div>
                        <h3 className="text-lg font-black uppercase tracking-tighter italic">Top Performance Assets</h3>
                    </div>

                    {reportData.topProducts.length === 0 ? (
                        <div className="h-40 flex items-center justify-center text-white/20 text-[10px] uppercase tracking-[0.2em]">
                            No sales data for this period
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reportData.topProducts.map((p, i) => (
                                <div key={i} className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/5">
                                    <div className="w-8 h-8 rounded-full bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center font-black text-xs">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-bold text-sm text-white">{p.name}</span>
                                            <span className="font-black text-sm text-white tracking-tight">LE {p.revenue.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] text-white/30 uppercase tracking-widest">
                                            <span>{p.qty} Units Sold</span>
                                            <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    style={{ width: `${(p.revenue / reportData.topProducts[0].revenue) * 100}%` }}
                                                    className="h-full bg-[#C5A059] rounded-full"
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
