import { useState } from 'react';
import { useSales } from '../../contexts/SalesContext';
import { useCustomers } from '../../contexts/CustomersContext';
import { useProducts } from '../../contexts/ProductsContext';
import { useToast } from '../Toast';
import { ButtonLoader } from '../LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

interface AddSaleModalProps {
    onClose: () => void;
}

export function AddSaleModal({ onClose }: AddSaleModalProps) {
    const [saleForm, setSaleForm] = useState({
        customer: '',
        product: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        status: 'Completed'
    });
    const [saleFormError, setSaleFormError] = useState('');
    const [saleFormSuccess, setSaleFormSuccess] = useState(false);
    const [customerMode, setCustomerMode] = useState<'select' | 'type'>('select');
    const [isAddingSale, setIsAddingSale] = useState(false);

    const { addSale } = useSales();
    const { customers, addCustomer } = useCustomers();
    const { products, editProduct } = useProducts();
    const { showToast } = useToast();

    async function handleAddSale(e: React.FormEvent) {
        e.preventDefault();
        if (!saleForm.customer || !saleForm.product || !saleForm.date || !saleForm.amount) {
            setSaleFormError('Please fill in all required fields.');
            return;
        }
        setSaleFormError('');

        setIsAddingSale(true);
        try {
            let customerId = saleForm.customer;

            const exists = customers.some(c => c.name.toLowerCase() === saleForm.customer.toLowerCase());
            if (!exists && customerMode === 'type') {
                const newCustomer = await addCustomer({
                    name: saleForm.customer,
                    email: `${saleForm.customer.toLowerCase().replace(/\s+/g, '.')}@example.com`,
                    phone: '',
                    status: 'Active',
                    avatar: '',
                });
                customerId = newCustomer.id;
            } else if (customerMode === 'type' && exists) {
                const existing = customers.find(c => c.name.toLowerCase() === saleForm.customer.toLowerCase());
                if (existing) customerId = existing.id;
            }

            await addSale({
                ...saleForm,
                customerId: customerId,
                productId: saleForm.product,
                amount: parseFloat(saleForm.amount)
            });

            // Stock update is handled server-side now

            setSaleFormSuccess(true);
            setSaleForm({
                customer: '',
                product: '',
                date: new Date().toISOString().split('T')[0],
                amount: '',
                status: 'Completed'
            });
            showToast('Sale recorded successfully!', 'success');
        } catch (error: any) {
            const msg = error.message || 'Failed to record sale';
            setSaleFormError(msg);
            showToast(msg, 'error');
        } finally {
            setIsAddingSale(false);
        }
    }

    return (
        <div className="relative text-white p-2">
            <AnimatePresence mode="wait">
                {saleFormSuccess ? (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="py-16 flex flex-col items-center text-center relative z-10"
                    >
                        <div className="relative w-24 h-24 mb-6">
                            <div className="absolute inset-0 bg-[#C5A059] rounded-full blur-3xl opacity-20 animate-pulse" />
                            <div className="relative w-full h-full rounded-full border-2 border-[#C5A059]/20 flex items-center justify-center bg-white/5 backdrop-blur-xl shadow-[0_0_50px_rgba(197,160,89,0.2)]">
                                <svg className="w-12 h-12 text-[#C5A059]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <h4 className="text-3xl font-black mb-3 tracking-tighter uppercase italic leading-none">Sale Recorded</h4>
                        <p className="text-white/40 text-[10px] mb-10 max-w-xs font-black uppercase tracking-[0.3em] leading-relaxed">The sale has been successfully recorded.</p>
                        <button
                            onClick={() => setSaleFormSuccess(false)}
                            className="px-12 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-[0.4em] text-[11px] transition-all hover:bg-[#C5A059] active:scale-95 shadow-2xl"
                        >
                            <span className="italic">Record Another Sale</span>
                        </button>
                    </motion.div>
                ) : (
                    <div className="relative">
                        {/* Decorative Tech Layers */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C5A059]/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                        {/* Corner Accents */}
                        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#C5A059]/20 rounded-tl-[2rem] pointer-events-none" />
                        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[#C5A059]/20 rounded-br-[2rem] pointer-events-none" />

                        <div className="relative z-10 mb-6 flex items-center justify-between px-2">
                            <div className="text-left">
                                <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">Record Sale</h3>
                                <div className="flex items-center gap-3">
                                    <div className="h-[2px] w-6 bg-[#C5A059]" />
                                    <span className="text-[9px] font-black text-[#C5A059] uppercase tracking-[0.5em] italic">New Transaction</span>
                                </div>
                            </div>
                            <div className="text-right hidden md:block">
                                <div className="text-[10px] uppercase tracking-[0.3em] text-white/20 font-black mb-1">Receipt ID</div>
                                <div className="text-sm font-black text-[#C5A059] tracking-tighter uppercase italic">OME-{Math.random().toString(36).substring(2, 7).toUpperCase()}</div>
                            </div>
                        </div>

                        <form className="relative z-10 flex flex-col md:flex-row gap-8" onSubmit={handleAddSale}>
                            {/* Left Column: Visual Details */}
                            <div className="flex flex-col gap-4 md:w-1/3">
                                <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group/amount">
                                    <div className="absolute inset-0 bg-[#C5A059]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                    <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-4">Total Amount</label>
                                    <div className="flex items-baseline justify-end gap-3">
                                        <span className="text-[10px] font-black text-[#C5A059]/40 italic">LE</span>
                                        <input
                                            type="number"
                                            className="w-full bg-transparent border-none p-0 text-white placeholder:text-white/5 focus:outline-none text-3xl font-black text-right tracking-tighter italic"
                                            placeholder="00"
                                            value={saleForm.amount}
                                            onChange={e => setSaleForm(f => ({ ...f, amount: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center opacity-40">
                                        <span className="text-[7px] font-black uppercase tracking-widest">Total</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
                                    </div>
                                </div>

                                <div className="mt-auto w-full pt-4 md:block hidden">
                                    <button
                                        type="button"
                                        className="w-full px-6 py-5 rounded-2xl bg-white/[0.02] border border-white/5 text-[10px] font-black text-white/30 uppercase tracking-[0.5em] hover:text-white hover:bg-white/5 transition-all text-center flex items-center justify-center italic"
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>

                            {/* Right Column: Selection Fields */}
                            <div className="flex-1 space-y-4">
                                <div className="group relative">
                                    <div className="flex items-center justify-between mb-2 px-1">
                                        <label className="text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] italic">Customer Name</label>
                                        <div className="flex bg-white/[0.05] rounded-xl p-1 border border-white/10">
                                            {['select', 'type'].map(mode => (
                                                <button
                                                    key={mode}
                                                    type="button"
                                                    onClick={() => setCustomerMode(mode as any)}
                                                    className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${customerMode === mode ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
                                                >
                                                    {mode === 'select' ? 'Existing' : 'New'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="relative">
                                        {customerMode === 'select' ? (
                                            <>
                                                <select
                                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-[#C5A059] transition-all appearance-none cursor-pointer text-lg font-black italic tracking-tight"
                                                    value={saleForm.customer}
                                                    onChange={e => setSaleForm(f => ({ ...f, customer: e.target.value }))}
                                                    required
                                                >
                                                    <option value="" className="bg-[#0f0f0f]">Select Customer...</option>
                                                    {customers.map(c => <option key={c.id} value={c.id} className="bg-[#0f0f0f]">{c.name.toUpperCase()}</option>)}
                                                </select>
                                                <div className="absolute right-5 bottom-4 pointer-events-none text-white/20">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </>
                                        ) : (
                                            <input
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-[#C5A059] transition-all text-lg font-black italic tracking-tight placeholder:text-white/5 shadow-inner"
                                                placeholder="Enter customer name..."
                                                value={saleForm.customer}
                                                onChange={e => setSaleForm(f => ({ ...f, customer: e.target.value }))}
                                                required
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="group relative">
                                    <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-1 italic">Product</label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-3 text-white focus:outline-none focus:border-[#C5A059] transition-all appearance-none cursor-pointer text-lg font-black italic tracking-tight"
                                            value={saleForm.product}
                                            onChange={e => {
                                                const pId = e.target.value;
                                                const p = products.find(prod => prod.id === pId);
                                                setSaleForm(f => ({ ...f, product: pId, amount: p ? p.price.toString() : '' }));
                                            }}
                                            required
                                        >
                                            <option value="" className="bg-[#0f0f0f]">Select Product...</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id} className="bg-[#0f0f0f]">
                                                    {p.name.toUpperCase()} [{p.stock} RESTING]
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-6 bottom-4 pointer-events-none text-white/20">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="group relative">
                                    <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-1">Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-[#C5A059] transition-all text-sm font-black italic tracking-tight shadow-inner"
                                        value={saleForm.date}
                                        onChange={e => setSaleForm(f => ({ ...f, date: e.target.value }))}
                                        required
                                    />
                                </div>



                                {saleFormError && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[9px] font-black uppercase tracking-[0.2em] text-center"
                                    >
                                        <span className="opacity-40 mr-2 font-mono">ERR_CODE:</span> {saleFormError}
                                    </motion.div>
                                )}

                                <div className="pt-3 flex gap-6 items-center">
                                    <button
                                        type="button"
                                        className="md:hidden flex-1 px-6 py-4 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-black text-white/30 uppercase tracking-[0.5em] hover:text-white hover:bg-white/5 transition-all text-center italic"
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isAddingSale}
                                        className={`relative flex-1 group active:scale-[0.98] transition-transform ${isAddingSale ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                                    >
                                        <div className="absolute inset-0 bg-white rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition duration-500" />
                                        <div className="relative bg-white text-black py-5 rounded-xl font-black uppercase tracking-[0.4em] text-[11px] flex items-center justify-center gap-6 group-hover:bg-[#C5A059] transition-all">
                                            <span className="italic">{isAddingSale ? 'Saving...' : 'Save Sale'}</span>
                                            <div className="w-8 h-[1px] bg-black/10" />
                                            <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
