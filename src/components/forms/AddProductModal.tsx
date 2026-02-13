import { useState } from 'react';
import { useProducts } from '../../contexts/ProductsContext';
import { useToast } from '../Toast';
import { ButtonLoader } from '../LoadingSpinner';
import { uploadAPI } from '../../lib/api';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface AddProductModalProps {
    onClose: () => void;
}

export function AddProductModal({ onClose }: AddProductModalProps) {
    const [productForm, setProductForm] = useState({
        name: '',
        category: '',
        costPrice: '',
        price: '',
        stock: '',
        status: 'In Stock',
        image: '',
    });
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState(false);
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const { addProduct } = useProducts();
    const { showToast } = useToast();

    async function handleAddProduct(e: React.FormEvent) {
        e.preventDefault();
        if (!productForm.name || !productForm.category || !productForm.costPrice || !productForm.price || !productForm.stock) {
            setFormError('Please fill in all required fields.');
            return;
        }
        setFormError('');

        setIsAddingProduct(true);
        try {
            let imageUrl = productForm.image;

            if (imageFile) {
                const uploadRes = await uploadAPI.upload(imageFile);
                imageUrl = uploadRes.url;
            }

            await addProduct({
                name: productForm.name,
                category: productForm.category,
                costPrice: parseFloat(productForm.costPrice),
                price: parseFloat(productForm.price),
                stock: parseInt(productForm.stock),
                status: productForm.status,
                image: imageUrl || 'https://placehold.co/64x64',
            });
            setFormSuccess(true);
            setProductForm({ name: '', category: '', costPrice: '', price: '', stock: '', status: 'In Stock', image: '' });
            setImageFile(null);
            setImagePreview('');
            showToast('Product added!', 'success');
        } catch (error: any) {
            const msg = error.message || 'Failed to add product';
            setFormError(msg);
            showToast(msg, 'error');
        } finally {
            setIsAddingProduct(false);
        }
    }

    return (
        <div className="relative text-white">
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
                        <h4 className="text-3xl font-black mb-3 tracking-tighter uppercase italic leading-none">Catalog Updated</h4>
                        <p className="text-white/40 text-[10px] mb-10 max-w-xs font-black uppercase tracking-[0.3em] leading-relaxed">Inventory registry synchronization complete. New asset successfully provisioned.</p>
                        <button
                            onClick={() => setFormSuccess(false)}
                            className="px-12 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-[0.4em] text-[11px] transition-all hover:bg-[#C5A059] active:scale-95 shadow-2xl"
                        >
                            <span className="italic">Provision New Asset</span>
                        </button>
                    </motion.div>
                ) : (
                    <div className="relative">
                        <div className="relative z-10 mb-6 flex items-center justify-between">
                            <div className="text-left">
                                <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">Add Asset</h3>
                                <div className="flex items-center gap-3">
                                    <div className="h-[2px] w-6 bg-[#C5A059]" />
                                    <span className="text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em]">Synchronizing Registry</span>
                                </div>
                            </div>
                            <div className="text-right hidden md:block">
                                <div className="text-[10px] uppercase tracking-widest text-white/20 font-bold mb-1">ASSET_CLASS</div>
                                <div className="text-xs font-black text-[#C5A059] tracking-tighter uppercase italic">SIG-{Math.random().toString(36).substring(2, 7).toUpperCase()}</div>
                            </div>
                        </div>

                        <form className="relative z-10 flex flex-col md:flex-row gap-8" onSubmit={handleAddProduct}>
                            {/* Left Column: Visuals */}
                            <div className="flex flex-col items-center gap-6 md:w-1/3">
                                <div className="relative group">
                                    <div className="absolute -inset-4 bg-gradient-to-tr from-[#C5A059]/20 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                                    <div
                                        className="relative w-40 h-40 rounded-3xl p-1 bg-gradient-to-br from-white/20 to-transparent cursor-pointer overflow-hidden shadow-2xl"
                                        onClick={() => document.getElementById('product-image-upload')?.click()}
                                    >
                                        <div className="relative h-full w-full rounded-[1.4rem] overflow-hidden bg-[#0A0A0F]">
                                            {imagePreview ? (
                                                <Image src={imagePreview} alt="Preview" fill className="object-cover transition-transform duration-700 group-hover:scale-110" unoptimized />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-white/10 uppercase tracking-tighter italic text-center p-4">
                                                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    <span className="text-[10px] font-black leading-tight">Visual Identity Box</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-x-0 bottom-0 py-2.5 bg-black/60 backdrop-blur-md translate-y-full group-hover:translate-y-0 transition-transform duration-300 border-t border-white/10">
                                                <span className="block text-[8px] font-black text-white text-center uppercase tracking-widest leading-none">Capture Graphic</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shadow-2xl border border-black/10 group-hover:scale-110 transition-transform cursor-pointer"
                                        onClick={() => document.getElementById('product-image-upload')?.click()}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1 leading-relaxed max-w-[120px]">Recommended: High fidelity resource, 16:9 or 1:1 format.</p>
                                </div>

                                <input id="product-image-upload" type="file" className="hidden" accept="image/*" onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setImageFile(file);
                                        const reader = new FileReader();
                                        reader.onload = ev => setImagePreview(ev.target?.result as string);
                                        reader.readAsDataURL(file);
                                        setProductForm(f => ({ ...f, image: '' }));
                                    }
                                }} />

                                <div className="mt-auto w-full pt-4 md:block hidden">
                                    <button
                                        type="button"
                                        className="w-full px-6 py-5 rounded-2xl bg-white/[0.02] border border-white/5 text-[10px] font-black text-white/30 uppercase tracking-[0.5em] hover:text-white hover:bg-white/5 transition-all text-center flex items-center justify-center italic"
                                        onClick={onClose}
                                    >
                                        Abort Provisioning
                                    </button>
                                </div>
                            </div>

                            {/* Right Column: Fields */}
                            <div className="flex-1 space-y-4">
                                <div className="group relative">
                                    <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-1">Asset Descriptor</label>
                                    <input
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-[#C5A059] transition-all text-lg font-black italic tracking-tight placeholder:text-white/5 shadow-inner"
                                        placeholder="Simbo Hopanda"
                                        value={productForm.name}
                                        onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="group relative">
                                    <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-1">Primary Classification</label>
                                    <select
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-[#C5A059] transition-all text-lg font-black italic tracking-tight appearance-none cursor-pointer"
                                        value={productForm.category}
                                        onChange={e => setProductForm(f => ({ ...f, category: e.target.value }))}
                                        required
                                    >
                                        <option value="" className="bg-[#0f0f0f]">SELECT_CLASS</option>
                                        {['Clothing', 'Electronics', 'Books', 'Home Appliances', 'Food', 'Accessories'].map(cat => (
                                            <option key={cat} value={cat} className="bg-[#0f0f0f]">{cat.toUpperCase()}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-5 bottom-4 pointer-events-none text-white/20">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="group relative">
                                        <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-1">Cost Price (LE)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-[#C5A059] transition-all text-lg font-black italic tracking-tight"
                                            placeholder="0.00"
                                            value={productForm.costPrice}
                                            onChange={e => setProductForm(f => ({ ...f, costPrice: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="group relative">
                                        <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-1">Selling Price (LE)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-[#C5A059] transition-all text-lg font-black italic tracking-tight"
                                            placeholder="0.00"
                                            value={productForm.price}
                                            onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="group relative">
                                    <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-1">Reserve Quant</label>
                                    <input
                                        type="number"
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-[#C5A059] transition-all text-lg font-black italic tracking-tight"
                                        placeholder="0"
                                        value={productForm.stock}
                                        onChange={e => setProductForm(f => ({ ...f, stock: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="group relative">
                                    <label className="block text-[8px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1 px-1">Resource Link</label>
                                    <div className="relative">
                                        <input
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-10 pr-5 py-2.5 text-white focus:outline-none focus:border-[#C5A059] transition-all text-[9px] font-black uppercase tracking-widest placeholder:text-white/5"
                                            placeholder="EXTERNAL_RESOURCE_LINK"
                                            value={productForm.image}
                                            onChange={e => {
                                                setProductForm(f => ({ ...f, image: e.target.value }));
                                                if (imageFile) {
                                                    setImageFile(null);
                                                    setImagePreview('');
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                {formError && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[9px] font-black uppercase tracking-[0.2em] text-center"
                                    >
                                        <span className="opacity-40 mr-2 font-mono">ERR_CODE:</span> {formError}
                                    </motion.div>
                                )}

                                <div className="pt-4 flex gap-6 items-center">
                                    <button
                                        type="button"
                                        className="md:hidden flex-1 px-6 py-4 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-black text-white/30 uppercase tracking-[0.5em] hover:text-white hover:bg-white/5 transition-all text-center italic"
                                        onClick={onClose}
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isAddingProduct}
                                        className={`relative flex-1 group active:scale-[0.98] transition-transform ${isAddingProduct ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                                    >
                                        <div className="absolute inset-0 bg-white rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition duration-500" />
                                        <div className="relative bg-white text-black py-5 rounded-xl font-black uppercase tracking-[0.4em] text-[11px] flex items-center justify-center gap-6 group-hover:bg-[#C5A059] transition-all">
                                            <span className="italic">{isAddingProduct ? 'Provisioning...' : 'Provision Asset'}</span>
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
