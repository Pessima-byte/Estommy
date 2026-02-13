"use client";

import { useState, useMemo } from 'react';
import { useSales } from '../contexts/SalesContext';
import { useProducts } from '../contexts/ProductsContext';
import { useCustomers } from '../contexts/CustomersContext';
import { AddProductModal } from '../components/forms/AddProductModal';
import { AddSaleModal } from '../components/forms/AddSaleModal';
import { AddCustomerModal } from '../components/forms/AddCustomerModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const { sales } = useSales();
    const { products } = useProducts();
    const { customers } = useCustomers();
    const router = useRouter();

    const [modalOpen, setModalOpen] = useState<'add-product' | 'add-sale' | 'add-customer' | null>(null);

    // Business Insights Calculation
    const businessInsights = useMemo(() => {
        const totalRevenue = sales.reduce((acc, sale) => acc + (typeof sale.amount === 'number' ? sale.amount : parseFloat(sale.amount) || 0), 0);
        const totalOrders = sales.length;
        const activeCustomers = customers.filter(c => c.status === 'Active').length;
        const productsInStock = products.reduce((acc, prod) => acc + (typeof prod.stock === 'number' ? prod.stock : parseInt(prod.stock) || 0), 0);
        const avgSale = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const recentSales = sales.filter(s => {
            const date = new Date(s.date);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - date.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 30;
        }).length;

        return {
            totalRevenue,
            totalOrders,
            activeCustomers,
            productsInStock,
            avgSale,
            recentSales
        };
    }, [sales, products, customers]);

    const statValues = [
        businessInsights.totalRevenue,
        businessInsights.totalOrders,
        businessInsights.activeCustomers,
        businessInsights.productsInStock,
        businessInsights.avgSale,
        businessInsights.recentSales
    ];

    const stats = [
        {
            label: "Revenue",
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            link: "/sales"
        },
        {
            label: "Orders",
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
            link: "/sales"
        },
        {
            label: "Customers",
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
            link: "/customers"
        },
        {
            label: "Stock",
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
            link: "/products"
        },
        {
            label: "Avg. Value",
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
            link: "/sales"
        },
        {
            label: "Growth",
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
            link: "/sales"
        }
    ];

    const quickActions = [
        { label: "New Sale", color: "bg-white/5 text-white/50 hover:bg-[#C5A059]/10 hover:text-white", action: "add-sale" },
        { label: "Add Customer", color: "bg-white/5 text-white/50 hover:bg-[#C5A059]/10 hover:text-white", action: "add-customer" },
        { label: "Add Item", color: "bg-white/5 text-white/50 hover:bg-[#C5A059]/10 hover:text-white", action: "add-product" },
        { label: "View Reports", color: "bg-white/5 text-white/50 hover:bg-[#C5A059]/10 hover:text-white", action: "view-reports" },
    ];

    const handleAction = (action: string) => {
        if (action === 'add-product') setModalOpen('add-product');
        if (action === 'add-sale') setModalOpen('add-sale');
        if (action === 'add-customer') setModalOpen('add-customer');
        if (action === 'view-reports') router.push('/reports');
        if (action === 'view-profile') router.push('/profile');
    };

    const handleStatClick = (link: string) => {
        router.push(link);
    };

    return (
        <div className="relative min-h-[80vh] flex flex-col gap-10">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[3rem] bg-[#1A1A23] border border-white/5 shadow-2xl p-8 md:p-12 mb-4">
                {/* Sleek Gradient Background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#C5A059]/10 via-transparent to-transparent opacity-40"></div>
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#C5A059]/5 to-transparent opacity-20"></div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                        <div>
                            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-2">
                                ESTOMMY
                            </h1>
                            <div className="flex items-center gap-3">
                                <div className="h-px w-12 bg-[#C5A059]"></div>
                                <p className="text-[10px] uppercase tracking-[0.4em] text-[#C5A059] font-bold">Inventory System</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button
                                className="px-8 py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 hover:bg-[#C5A059] transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                onClick={() => handleAction("add-product")}
                            >
                                Add Product
                            </button>
                            <button
                                className="px-8 py-4 rounded-2xl bg-[#C5A059] text-black text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 hover:bg-white transition-all shadow-[0_0_20px_rgba(197,160,89,0.3)] glow-gold"
                                onClick={() => handleAction("view-reports")}
                            >
                                View Reports
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ y: -5 }}
                                className="group relative bg-[#262630] rounded-3xl p-6 flex flex-col justify-between overflow-hidden cursor-pointer transition-all duration-300 border border-white/5 hover:border-[#C5A059]/30 hover:shadow-2xl h-48"
                                onClick={() => handleStatClick(stat.link)}
                            >
                                {/* Hover Glow */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="relative z-10 flex justify-between items-start">
                                    <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 text-[#C5A059] group-hover:bg-[#C5A059] group-hover:text-black transition-colors duration-300">
                                        {stat.icon}
                                    </div>
                                    <div className="flex items-center gap-1 text-[9px] font-black text-white/20 uppercase tracking-widest group-hover:text-white/50 transition-colors">
                                        <span>+4.2%</span>
                                        <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                    </div>
                                </div>

                                <div className="relative z-10">
                                    <div className="text-[10px] font-black text-white/40 tracking-[0.2em] uppercase mb-1">{stat.label}</div>
                                    <div className="flex items-baseline gap-1">
                                        {(stat.label === "Revenue" || stat.label === "Avg. Value") && (
                                            <span className="text-sm font-black text-[#C5A059] opacity-60">Le</span>
                                        )}
                                        <div className="text-2xl font-black text-white tracking-tighter group-hover:scale-105 origin-left transition-transform duration-300">
                                            {statValues[i].toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Line Accent */}
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#C5A059]/50 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {quickActions.map((action, i) => (
                    <button
                        key={action.label}
                        onClick={() => handleAction(action.action)}
                        className="group relative p-8 rounded-[2.5rem] border border-white/5 transition-all duration-500 text-left overflow-hidden glass hover:bg-white/[0.05] hover:border-[#C5A059]/30 hover:-translate-y-2"
                    >
                        {/* Technical background pattern */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(197,160,89,0.05),transparent)] opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative z-10">
                            <div className="text-[10px] uppercase tracking-[0.4em] font-black mb-3 text-white/30 group-hover:text-[#C5A059] transition-colors">{i === 0 ? "Priority" : "System"} Action</div>
                            <div className="text-xl font-black text-white italic tracking-tight mb-4">{action.label}</div>

                            <div className="flex items-center gap-2 text-[8px] font-black text-white/20 uppercase tracking-widest group-hover:text-white/60 transition-colors">
                                <span>Execute Command</span>
                                <svg className="w-3 h-3 group-hover:translate-x-2 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </div>
                        </div>

                        {/* Geometric accent */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#C5A059]/10 to-transparent -rotate-45 translate-x-10 -translate-y-10 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform duration-700" />
                    </button>
                ))}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {modalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0"
                            onClick={() => setModalOpen(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-4xl bg-[#0F0F0F] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden"
                        >
                            <div className="max-h-[85vh] overflow-y-auto px-8 py-8 custom-scrollbar">
                                {modalOpen === 'add-product' && <AddProductModal onClose={() => setModalOpen(null)} />}
                                {modalOpen === 'add-sale' && <AddSaleModal onClose={() => setModalOpen(null)} />}
                                {modalOpen === 'add-customer' && <AddCustomerModal onClose={() => setModalOpen(null)} />}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
