import { useState, useEffect } from 'react';
import { useCredits } from '../../contexts/CreditsContext';
import { useCustomers } from '../../contexts/CustomersContext';
import { useProducts } from '../../contexts/ProductsContext';
import { useToast } from '../Toast';
import { ButtonLoader } from '../LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { customersAPI, uploadAPI } from '../../lib/api'; // Added customersAPI import

interface AddCreditModalProps {
    onClose: () => void;
}

interface SelectedItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
}

import { useDebtors } from '../../contexts/DebtorsContext';

export function AddCreditModal({ onClose }: AddCreditModalProps) {
    const { addCredit } = useCredits();
    const { customers, refreshCustomers } = useCustomers();
    const { refreshDebtors } = useDebtors();
    const { products } = useProducts();
    const { showToast } = useToast();

    // State
    const [creditForm, setCreditForm] = useState({
        customerId: '',
        customerName: '',
        amount: 0,
        description: '',
        status: 'Pending',
        date: new Date().toISOString().split('T')[0]
    });

    // Manage items separately for quantity control
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
    const [customItems, setCustomItems] = useState(''); // Fallback for manual text input
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Customer search states
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [isNewCustomer, setIsNewCustomer] = useState(false);
    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    const [newCustomerAddress, setNewCustomerAddress] = useState('');

    // Validation States
    const [isPhoneAvailable, setIsPhoneAvailable] = useState(true);
    const [isPhoneChecking, setIsPhoneChecking] = useState(false);
    const [isEmailAvailable, setIsEmailAvailable] = useState(true);
    const [isEmailChecking, setIsEmailChecking] = useState(false);
    const [newCustomerEmail, setNewCustomerEmail] = useState('');

    useEffect(() => {
        let timeoutId: any;

        if (isNewCustomer && newCustomerPhone) {
            const checkPhone = async () => {
                setIsPhoneChecking(true);
                try {
                    const { available } = await customersAPI.checkAvailability('phone', newCustomerPhone);
                    setIsPhoneAvailable(available);
                } catch (error) {
                    console.error('Error checking phone:', error);
                } finally {
                    setIsPhoneChecking(false);
                }
            };

            timeoutId = setTimeout(checkPhone, 500);
        } else {
            setIsPhoneAvailable(true);
        }

        return () => clearTimeout(timeoutId);
    }, [newCustomerPhone, isNewCustomer]);

    useEffect(() => {
        let timeoutId: any;

        if (isNewCustomer && newCustomerEmail) {
            const checkEmail = async () => {
                setIsEmailChecking(true);
                try {
                    const { available } = await customersAPI.checkAvailability('email', newCustomerEmail);
                    setIsEmailAvailable(available);
                } catch (error) {
                    console.error('Error checking email:', error);
                } finally {
                    setIsEmailChecking(false);
                }
            };

            timeoutId = setTimeout(checkEmail, 500);
        } else {
            setIsEmailAvailable(true);
        }

        return () => clearTimeout(timeoutId);
    }, [newCustomerEmail, isNewCustomer]);

    const [productSearch, setProductSearch] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);

    // Derived data
    const { addCustomer } = useCustomers();
    const activeCustomers = customers.filter(c => c.status === 'Active');
    const filteredCustomers = activeCustomers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase())
    );
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) && p.status !== 'Out of Stock'
    );

    function addProductToItems(product: any) {
        // check if item already exists
        const exists = selectedItems.find(item => item.id === product.id);
        if (exists) {
            setSelectedItems(prev => prev.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setSelectedItems(prev => [...prev, {
                id: product.id,
                name: product.name,
                quantity: 1,
                price: product.price
            }]);
        }

        // Auto-update amount based on selections? 
        // For now, let's just add the item. The user can adjust total amount manually or we can calc it.
        // Let's calc it to be helpful, but allow override.
        const currentTotal = selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const newTotal = currentTotal + (exists ? product.price : product.price); // naive calc

        // Actually, let's recalculate the whole total freshly from the new state in an effect or just update it here
        // Simpler to just let user input/override amount for now as credits might be partial?
        // But requested feature implies easier data entry. Let's auto-sum *suggestions* to the amount.

        setCreditForm(prev => ({
            ...prev,
            amount: prev.amount + product.price
        }));

        setProductSearch('');
        setShowProductDropdown(false);
    }

    function removeSelectedItem(id: string) {
        const itemToRemove = selectedItems.find(i => i.id === id);
        if (itemToRemove) {
            setCreditForm(prev => ({
                ...prev,
                amount: Math.max(0, prev.amount - (itemToRemove.price * itemToRemove.quantity))
            }));
        }
        setSelectedItems(prev => prev.filter(i => i.id !== id));
    }

    function updateItemQuantity(id: string, delta: number) {
        setSelectedItems(prev => prev.map(item => {
            if (item.id === id) {
                const newQuantity = Math.max(1, item.quantity + delta);
                // Adjust total amount
                const priceDiff = (newQuantity - item.quantity) * item.price;
                setCreditForm(f => ({ ...f, amount: f.amount + priceDiff }));
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    }
    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }

    async function handleAddCredit(e: React.FormEvent) {
        e.preventDefault();

        if ((!creditForm.customerId && !isNewCustomer) || !creditForm.amount) {
            setFormError('Please select a customer and enter an amount.');
            return;
        }

        setIsSubmitting(true);
        setFormError('');

        try {
            let uploadedImageUrl = null;
            if (selectedFile) {
                const uploadRes = await uploadAPI.upload(selectedFile);
                uploadedImageUrl = uploadRes.url;
            }

            let finalCustomerId = creditForm.customerId;
            let finalCustomerName = creditForm.customerName;

            // Handle New Customer Creation on the fly
            if (isNewCustomer && !creditForm.customerId) {
                const newCustomerData: any = {
                    name: customerSearch,
                    status: 'Active',
                    totalDebt: 0
                };

                if (newCustomerPhone) newCustomerData.phone = newCustomerPhone;
                if (newCustomerEmail) newCustomerData.email = newCustomerEmail;
                if (newCustomerAddress) newCustomerData.address = newCustomerAddress;

                const newCustomer = await addCustomer(newCustomerData);
                finalCustomerId = newCustomer.id;
                finalCustomerName = newCustomer.name;
            }
            // Construct description from structured items + custom text
            const structuredItemsText = selectedItems.map(i => `${i.quantity}x ${i.name} (@${i.price})`).join(', ');
            const itemsText = [structuredItemsText, customItems].filter(Boolean).join('\nAdditional: ');

            const fullDescription = itemsText
                ? `Items: ${itemsText} \n${creditForm.description} `
                : creditForm.description;

            await addCredit({
                customer: finalCustomerName,
                customerId: finalCustomerId,
                amount: Number(creditForm.amount),
                notes: fullDescription,
                status: 'Pending',
                dueDate: new Date(creditForm.date).toISOString(),
                image: uploadedImageUrl,
                items: selectedItems.map(i => ({ productId: i.id, quantity: i.quantity, price: i.price }))
            });

            // Sync: Refresh customers/debtors data
            if (refreshCustomers) refreshCustomers();
            if (refreshDebtors) refreshDebtors();

            setFormSuccess(true);
            showToast('Credit logged w/ details!', 'success');
            // Reset form
            setCreditForm({
                customerId: '',
                customerName: '',
                amount: 0,
                description: '',
                status: 'Pending',
                date: new Date().toISOString().split('T')[0]
            });
            setSelectedItems([]);
            setCustomItems('');
            setCustomerSearch('');
            setIsNewCustomer(false);
            setNewCustomerPhone('');
            setNewCustomerEmail('');
            setNewCustomerAddress('');
            setSelectedFile(null);
            setPreviewUrl(null);

        } catch (error: any) {
            setFormError(error.message || 'Failed to add credit record');
            showToast('Failed to log credit', 'error');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="relative text-white" onClick={() => setShowProductDropdown(false)}>
            <AnimatePresence mode="wait">
                {formSuccess ? (
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
                        <h4 className="text-3xl font-black mb-3 tracking-tighter uppercase italic leading-none">Debt Record Saved</h4>
                        <p className="text-white/40 text-[10px] mb-10 max-w-xs font-black uppercase tracking-[0.3em] leading-relaxed">The debt has been successfully added to the customer's account and the ledger is updated.</p>
                        <button
                            onClick={onClose}
                            className="px-12 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-[0.4em] text-[11px] transition-all hover:bg-[#C5A059] active:scale-95 shadow-2xl"
                        >
                            <span className="italic">Back to Debtors List</span>
                        </button>
                    </motion.div>
                ) : (
                    <div className="relative">
                        <div className="relative z-10 mb-8 flex items-center justify-between">
                            <div className="text-left">
                                <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">New Credit Record</h3>
                                <div className="flex items-center gap-3">
                                    <div className="h-[2px] w-6 bg-[#C5A059]" />
                                    <span className="text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em]">New Debt Entry</span>
                                </div>
                            </div>
                            <div className="text-right hidden md:block">
                                <div className="text-[10px] uppercase tracking-widest text-white/20 font-bold mb-1">RECORD TYPE</div>
                                <div className="text-xs font-black text-[#C5A059] tracking-tighter uppercase italic">MANUAL ENTRY</div>
                            </div>
                        </div>

                        <form className="relative z-10 flex flex-col md:flex-row gap-8" onSubmit={handleAddCredit}>
                            {/* Left Column: Debtor & Items */}
                            <div className="flex flex-col gap-4 md:w-1/2">
                                <div className="group relative" onClick={(e) => e.stopPropagation()}>
                                    <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-1 italic">Customer Name</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-[#C5A059] transition-all text-lg font-black italic tracking-tight placeholder:text-white/5"
                                            placeholder="Search or enter customer name..."
                                            value={customerSearch}
                                            onChange={e => {
                                                setCustomerSearch(e.target.value);
                                                setShowCustomerDropdown(true);
                                                if (creditForm.customerId) {
                                                    setCreditForm(f => ({ ...f, customerId: '', customerName: '' }));
                                                    setIsNewCustomer(false);
                                                }
                                            }}
                                            onFocus={() => setShowCustomerDropdown(true)}
                                        />
                                        <AnimatePresence>
                                            {showCustomerDropdown && (customerSearch.length > 0 || filteredCustomers.length > 0) && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="absolute z-[60] left-0 right-0 mt-2 bg-[#0A0A0F]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-3xl overflow-hidden max-h-64 overflow-y-auto custom-scrollbar"
                                                >
                                                    {filteredCustomers.map(customer => (
                                                        <button
                                                            type="button"
                                                            key={customer.id}
                                                            className="w-full text-left px-5 py-4 hover:bg-[#C5A059]/10 border-b border-white/5 last:border-0 transition-colors group"
                                                            onClick={() => {
                                                                setCreditForm(f => ({ ...f, customerId: customer.id, customerName: customer.name }));
                                                                setCustomerSearch(customer.name);
                                                                setShowCustomerDropdown(false);
                                                                setIsNewCustomer(false);
                                                            }}
                                                        >
                                                            <div className="font-black text-xs uppercase tracking-widest text-white/80 group-hover:text-[#C5A059] transition-colors">{customer.name}</div>
                                                            <div className="text-[8px] text-white/20 uppercase tracking-[0.2em] mt-1">{customer.phone || 'Phone Registry Null'}</div>
                                                        </button>
                                                    ))}

                                                    {customerSearch.length > 2 && !activeCustomers.some(c => c.name.toLowerCase() === customerSearch.toLowerCase()) && (
                                                        <button
                                                            type="button"
                                                            className="w-full text-left px-5 py-4 bg-[#C5A059]/5 border-t border-[#C5A059]/20 hover:bg-[#C5A059]/10 transition-colors group"
                                                            onClick={() => {
                                                                setIsNewCustomer(true);
                                                                setShowCustomerDropdown(false);
                                                                setCreditForm(f => ({ ...f, customerId: '', customerName: customerSearch }));
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-6 h-6 rounded-full bg-[#C5A059] text-black flex items-center justify-center text-[10px] font-black">+</div>
                                                                <div>
                                                                    <div className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest">Add New Customer</div>
                                                                    <div className="text-[8px] text-white/20 uppercase tracking-[0.2em]">{customerSearch.toUpperCase()}</div>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* New Customer Details (Phone/Email/Address) */}
                                    <AnimatePresence>
                                        {isNewCustomer && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                                animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
                                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                                className="overflow-hidden bg-[#C5A059]/5 rounded-2xl border border-[#C5A059]/20 p-5 space-y-4 shadow-inner"
                                            >
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[8px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-0.5 italic">Phone Number (+232)</label>
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                className={`w-full bg-black/20 border ${!isPhoneAvailable ? 'border-rose-500/50' : 'border-white/10'} rounded-xl px-4 py-2 text-white placeholder:text-white/10 focus:outline-none focus:border-[#C5A059] transition-all text-sm font-black italic tracking-wider`}
                                                                placeholder="7..."
                                                                maxLength={8}
                                                                value={newCustomerPhone.replace('+232', '')}
                                                                onChange={e => {
                                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                                    setNewCustomerPhone(val ? `+232${val}` : '');
                                                                }}
                                                            />
                                                            {isPhoneChecking && (
                                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                                    <div className="w-3 h-3 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        {!isPhoneAvailable && (
                                                            <p className="text-rose-500 text-[6px] font-black uppercase tracking-widest mt-1 px-1 italic">Already registered</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="block text-[8px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-0.5 italic">Email Address</label>
                                                        <div className="relative">
                                                            <input
                                                                type="email"
                                                                className={`w-full bg-black/20 border ${!isEmailAvailable ? 'border-rose-500/50' : 'border-white/10'} rounded-xl px-4 py-2 text-white placeholder:text-white/10 focus:outline-none focus:border-[#C5A059] transition-all text-sm font-black italic tracking-wider`}
                                                                placeholder="Email..."
                                                                maxLength={100}
                                                                value={newCustomerEmail}
                                                                onChange={e => setNewCustomerEmail(e.target.value.slice(0, 100))}
                                                            />
                                                            {isEmailChecking && (
                                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                                    <div className="w-3 h-3 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        {!isEmailAvailable && (
                                                            <p className="text-rose-500 text-[6px] font-black uppercase tracking-widest mt-1 px-1 italic">Already registered</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[8px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-0.5 italic">Physical Address</label>
                                                    <textarea
                                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white placeholder:text-white/10 focus:outline-none focus:border-[#C5A059] transition-all text-[11px] font-medium resize-none leading-relaxed"
                                                        placeholder="Enter address details..."
                                                        rows={2}
                                                        value={newCustomerAddress}
                                                        onChange={e => setNewCustomerAddress(e.target.value)}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="group relative" onClick={(e) => e.stopPropagation()}>
                                    <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-1 italic">Add Products (Optional)</label>
                                    <div className="relative mb-3">
                                        <input
                                            type="text"
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-white/5 focus:outline-none focus:border-[#C5A059] transition-all text-base font-black italic tracking-tight shadow-inner"
                                            placeholder="Search items..."
                                            value={productSearch}
                                            onChange={e => {
                                                setProductSearch(e.target.value);
                                                if (!showProductDropdown) setShowProductDropdown(true);
                                            }}
                                            onFocus={() => setShowProductDropdown(true)}
                                        />
                                        <AnimatePresence>
                                            {showProductDropdown && productSearch.length > 0 && filteredProducts.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="absolute z-50 left-0 right-0 mt-2 bg-[#0A0A0F]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-3xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar"
                                                >
                                                    {filteredProducts.map(product => (
                                                        <button
                                                            type="button"
                                                            key={product.id}
                                                            className="w-full text-left px-5 py-3 hover:bg-[#C5A059]/10 border-b border-white/5 last:border-0 transition-colors flex justify-between items-center group"
                                                            onClick={() => addProductToItems(product)}
                                                        >
                                                            <span className="font-black text-[10px] uppercase tracking-widest text-white/80 group-hover:text-[#C5A059] transition-colors">{product.name}</span>
                                                            <span className="text-[9px] font-mono text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded-lg opacity-60 group-hover:opacity-100 transition-opacity">LE {product.price}</span>
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Asset Manifest Table */}
                                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                                        <div className="max-h-36 overflow-y-auto custom-scrollbar">
                                            {selectedItems.length > 0 ? (
                                                <div className="divide-y divide-white/5">
                                                    {selectedItems.map(item => (
                                                        <div key={item.id} className="flex items-center justify-between p-3 group hover:bg-white/[0.02] transition-colors">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-[10px] font-black text-white italic tracking-tight uppercase">{item.name}</span>
                                                                <span className="text-[8px] font-black text-[#C5A059]/40 uppercase tracking-widest">Base Unit: {item.price} LE</span>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex items-center bg-black/40 rounded-xl border border-white/10 p-1">
                                                                    <button type="button" onClick={() => updateItemQuantity(item.id, -1)} className="w-5 h-5 flex items-center justify-center text-white/30 hover:text-[#C5A059] transition-colors">-</button>
                                                                    <span className="text-[10px] font-black text-white w-5 text-center italic">{item.quantity}</span>
                                                                    <button type="button" onClick={() => updateItemQuantity(item.id, 1)} className="w-5 h-5 flex items-center justify-center text-white/30 hover:text-[#C5A059] transition-colors">+</button>
                                                                </div>
                                                                <button type="button" onClick={() => removeSelectedItem(item.id)} className="text-white/10 hover:text-rose-500 transition-colors">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-6 text-center flex flex-col items-center gap-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                                    <span className="text-[9px] font-black uppercase tracking-[0.4em]">No items selected</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="bg-white/5 border-t border-white/10 p-2.5">
                                            <input
                                                type="text"
                                                className="w-full bg-transparent p-0 text-[10px] font-black italic tracking-wide text-white placeholder:text-white/5 focus:outline-none"
                                                placeholder="Add manual item description..."
                                                value={customItems}
                                                onChange={e => setCustomItems(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Values & Metrics */}
                            <div className="flex-1 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group/amount">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <label className="text-[8px] font-black text-[#C5A059] uppercase tracking-[0.4em]">Total Amount</label>
                                                    <span className="text-[9px] font-black text-black bg-[#C5A059] px-1.5 py-0.5 rounded-md italic shadow-[0_0_10px_rgba(197,160,89,0.3)]">LE</span>
                                                </div>
                                                <div className="flex items-center bg-white/5 rounded-xl p-0.5 border border-white/10">
                                                    <button
                                                        type="button"
                                                        onClick={() => setCreditForm(f => ({ ...f, amount: Math.max(0, (f.amount || 0) - 100) }))}
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all text-white/40 hover:text-white"
                                                    >
                                                        <span className="font-black text-lg">-</span>
                                                    </button>
                                                    <div className="w-px h-4 bg-white/10 mx-1" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setCreditForm(f => ({ ...f, amount: (f.amount || 0) + 100 }))}
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all text-white/40 hover:text-white"
                                                    >
                                                        <span className="font-black text-lg">+</span>
                                                    </button>
                                                </div>
                                            </div>
                                            <input
                                                type="number"
                                                className="w-full bg-transparent border-none p-0 pr-16 text-white placeholder:text-white/5 focus:outline-none text-xl font-black text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                placeholder="0.00"
                                                value={creditForm.amount || ''}
                                                onChange={e => setCreditForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="group relative">
                                        <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-1 italic">Record Date</label>
                                        <input
                                            type="date"
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-[#C5A059] transition-all text-base font-black italic tracking-tight"
                                            value={creditForm.date}
                                            onChange={e => setCreditForm(f => ({ ...f, date: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="group relative">
                                    <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-1 italic">Additional Notes</label>
                                    <textarea
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-white/5 focus:outline-none focus:border-[#C5A059] transition-all text-sm font-medium tracking-wide resize-none h-[80px] custom-scrollbar shadow-inner"
                                        placeholder="Add any extra details here..."
                                        value={creditForm.description}
                                        onChange={e => setCreditForm(f => ({ ...f, description: e.target.value }))}
                                    />
                                </div>

                                {/* File Upload */}
                                <div className="group relative">
                                    <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-1 italic">Attachment / Image</label>
                                    <div className="relative group/file">
                                        <input
                                            type="file"
                                            id="creditImage"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                        <label
                                            htmlFor="creditImage"
                                            className={`flex flex-col items-center justify-center w-full min-h-[100px] border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 ${previewUrl ? 'border-[#C5A059] bg-[#C5A059]/5' : 'border-white/10 hover:border-[#C5A059]/30 hover:bg-white/[0.02]'}`}
                                        >
                                            {previewUrl ? (
                                                <div className="relative w-full aspect-video p-4">
                                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-xl" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/file:opacity-100 transition-opacity flex items-center justify-center rounded-3xl">
                                                        <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Change Image</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 py-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover/file:text-[#C5A059] transition-colors">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] italic group-hover/file:text-[#C5A059]/40 transition-colors">Click to Upload Supporting Doc</span>
                                                </div>
                                            )}
                                        </label>
                                        {selectedFile && (
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors z-20"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {formError && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[9px] font-black uppercase tracking-[0.2em] text-center"
                                    >
                                        <span className="opacity-40 mr-2 font-mono">ERROR:</span> {formError}
                                    </motion.div>
                                )}

                                <div className="pt-3 flex gap-6 items-center">
                                    <button
                                        type="button"
                                        className="md:hidden flex-1 px-6 py-3 rounded-2xl bg-white/[0.02] border border-white/5 text-[10px] font-black text-white/30 uppercase tracking-[0.4em] hover:text-white hover:bg-white/5 transition-all text-center italic"
                                        onClick={onClose}
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || (isNewCustomer && (!isPhoneAvailable || isPhoneChecking || !isEmailAvailable || isEmailChecking))}
                                        className={`relative flex-1 group active:scale-[0.98] transition-transform ${(isSubmitting || (isNewCustomer && (!isPhoneAvailable || isPhoneChecking || !isEmailAvailable || isEmailChecking))) ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#C5A059] to-amber-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition duration-500" />
                                        <div className="relative bg-white text-black py-4 rounded-2xl font-black uppercase tracking-[0.5em] text-[11px] flex items-center justify-center gap-6 group-hover:bg-[#C5A059] transition-all">
                                            {isSubmitting ? <ButtonLoader size="sm" /> : (
                                                <>
                                                    <span className="italic">Save Debt Record</span>
                                                    <div className="w-8 h-px bg-black opacity-20" />
                                                    <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                    </svg>
                                                </>
                                            )}
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )
                }
            </AnimatePresence >
        </div >
    );
}
