import { useState, useEffect } from 'react';
import { useCustomers } from '../../contexts/CustomersContext';
import { useToast } from '../Toast';
import { ButtonLoader } from '../LoadingSpinner';
import { uploadAPI, customersAPI } from '../../lib/api';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface AddCustomerModalProps {
    onClose: () => void;
    initialCustomer?: any;
}

export function AddCustomerModal({ onClose, initialCustomer }: AddCustomerModalProps) {
    const isEditing = !!initialCustomer;
    const [customerForm, setCustomerForm] = useState({
        name: initialCustomer?.name || '',
        email: initialCustomer?.email || '',
        phone: initialCustomer?.phone || '',
        gender: initialCustomer?.gender || 'Male',
        status: initialCustomer?.status || 'Active',
        avatar: initialCustomer?.avatar || '',
        attachment: initialCustomer?.attachment || '',
        address: initialCustomer?.address || '',
        totalDebt: initialCustomer?.totalDebt || 0
    });
    const [customerFormError, setCustomerFormError] = useState('');
    const [customerFormSuccess, setCustomerFormSuccess] = useState(false);
    const [isAddingCustomer, setIsAddingCustomer] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>(initialCustomer?.avatar || '');
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [attachmentPreview, setAttachmentPreview] = useState<string>(initialCustomer?.attachment || '');
    const { addCustomer, editCustomer } = useCustomers();
    const { showToast } = useToast();

    // Validation States
    const [isPhoneAvailable, setIsPhoneAvailable] = useState(true);
    const [isPhoneChecking, setIsPhoneChecking] = useState(false);
    const [isEmailAvailable, setIsEmailAvailable] = useState(true);
    const [isEmailChecking, setIsEmailChecking] = useState(false);

    useEffect(() => {
        let timeoutId: any;

        if (customerForm.phone) {
            const checkPhone = async () => {
                setIsPhoneChecking(true);
                try {
                    const { available } = await customersAPI.checkAvailability('phone', customerForm.phone);
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
    }, [customerForm.phone]);

    useEffect(() => {
        let timeoutId: any;

        if (customerForm.email) {
            const checkEmail = async () => {
                setIsEmailChecking(true);
                try {
                    const { available } = await customersAPI.checkAvailability('email', customerForm.email);
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
    }, [customerForm.email]);

    async function handleAddCustomer(e: React.FormEvent) {
        e.preventDefault();
        if (!customerForm.name) {
            setCustomerFormError('Name is required.');
            return;
        }
        setCustomerFormError('');

        setIsAddingCustomer(true);
        try {
            let avatarUrl = customerForm.avatar;
            if (avatarFile) {
                const uploadRes = await uploadAPI.upload(avatarFile);
                avatarUrl = uploadRes.url;
            }

            let attachmentUrl = customerForm.attachment;
            if (attachmentFile) {
                const uploadRes = await uploadAPI.upload(attachmentFile);
                attachmentUrl = uploadRes.url;
            }

            if (isEditing) {
                await editCustomer(initialCustomer.id, { ...customerForm, avatar: avatarUrl, attachment: attachmentUrl });
                showToast('Profile updated!', 'success');
            } else {
                await addCustomer({ ...customerForm, avatar: avatarUrl, attachment: attachmentUrl });
                showToast('Customer registered!', 'success');
            }

            if (!isEditing) {
                setCustomerFormSuccess(true);
            } else {
                onClose();
            }
            setCustomerForm({ name: '', email: '', phone: '', gender: 'Male', status: 'Active', avatar: '', attachment: '', address: '', totalDebt: 0 });
            setAvatarFile(null);
            setAvatarPreview('');
            setAttachmentFile(null);
            setAttachmentPreview('');
            showToast('Customer registered!', 'success');
        } catch (error: any) {
            const msg = error.message || 'Failed to register customer';
            setCustomerFormError(msg);
            showToast(msg, 'error');
        } finally {
            setIsAddingCustomer(false);
        }
    }

    return (
        <div className="relative text-white">
            <AnimatePresence mode="wait">
                {customerFormSuccess ? (
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
                        <h4 className="text-3xl font-black mb-3 tracking-tighter uppercase italic leading-none">Customer Registered</h4>
                        <p className="text-white/40 text-[10px] mb-10 max-w-xs font-black uppercase tracking-[0.3em] leading-relaxed">Registry synchronization complete. Digital profile successfully provisioned.</p>
                        <button
                            onClick={() => setCustomerFormSuccess(false)}
                            className="px-12 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-[0.4em] text-[11px] transition-all hover:bg-[#C5A059] active:scale-95 shadow-2xl"
                        >
                            <span className="italic">Provision New Profile</span>
                        </button>
                    </motion.div>
                ) : (
                    <div className="relative">
                        <div className="relative z-10 mb-6 flex items-center justify-between">
                            <div className="text-left">
                                <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">Create Profile</h3>
                                <div className="flex items-center gap-3">
                                    <div className="h-[2px] w-6 bg-[#C5A059]" />
                                    <span className="text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em]">Synchronizing Registry</span>
                                </div>
                            </div>
                            <div className="text-right hidden md:block">
                                <div className="text-[10px] uppercase tracking-widest text-white/20 font-bold mb-1">ID_AUTH_CODE</div>
                                <div className="text-xs font-black text-[#C5A059] tracking-tighter uppercase italic">OVW-{Math.random().toString(36).substring(2, 7).toUpperCase()}</div>
                            </div>
                        </div>

                        <form className="relative z-10 flex flex-col md:flex-row gap-8" onSubmit={handleAddCustomer}>
                            {/* Left Column: Avatar */}
                            <div className="flex flex-col items-center gap-6 md:w-1/3">
                                <div className="relative group">
                                    <div className="absolute -inset-4 bg-gradient-to-tr from-[#C5A059]/20 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                                    <div
                                        className="relative w-40 h-40 rounded-3xl p-1 bg-gradient-to-br from-white/20 to-transparent cursor-pointer overflow-hidden shadow-2xl"
                                        onClick={() => document.getElementById('customer-modal-avatar-upload')?.click()}
                                    >
                                        <div className="relative h-full w-full rounded-[1.4rem] overflow-hidden bg-[#0A0A0F]">
                                            {avatarPreview ? (
                                                <Image src={avatarPreview} alt="Preview" fill className="object-cover transition-transform duration-700 group-hover:scale-110" unoptimized />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-white/10 uppercase tracking-tighter italic text-center p-4">
                                                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                    <span className="text-[10px] font-black leading-tight">Biometric Photo Source</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-x-0 bottom-0 py-2.5 bg-black/60 backdrop-blur-md translate-y-full group-hover:translate-y-0 transition-transform duration-300 border-t border-white/10">
                                                <span className="block text-[8px] font-black text-white text-center uppercase tracking-widest leading-none">Capture Identity</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shadow-2xl border border-black/10 group-hover:scale-110 transition-transform cursor-pointer"
                                        onClick={() => document.getElementById('customer-modal-avatar-upload')?.click()}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1 leading-relaxed max-w-[120px]">Recommended: Square aspect ratio, High fidelity.</p>
                                </div>

                                <input id="customer-modal-avatar-upload" type="file" className="hidden" accept="image/*" onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setAvatarFile(file);
                                        const reader = new FileReader();
                                        reader.onload = ev => setAvatarPreview(ev.target?.result as string);
                                        reader.readAsDataURL(file);
                                    }
                                }} />

                                <div className="mt-auto w-full pt-4 md:block hidden">
                                    <button
                                        type="button"
                                        className="w-full px-6 py-5 rounded-2xl bg-white/[0.02] border border-white/5 text-[10px] font-black text-white/30 uppercase tracking-[0.5em] hover:text-white hover:bg-white/5 transition-all text-center flex items-center justify-center italic"
                                        onClick={onClose}
                                    >
                                        Abort Registry
                                    </button>
                                </div>
                            </div>

                            {/* Right Column: Fields */}
                            <div className="flex-1 space-y-4">
                                <div className="group relative">
                                    <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-1">Full Name</label>
                                    <input
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-[#C5A059] transition-all text-lg font-black italic tracking-tight placeholder:text-white/5 shadow-inner"
                                        placeholder="Simbo Hopanda"
                                        value={customerForm.name}
                                        onChange={e => setCustomerForm(f => ({ ...f, name: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="group relative">
                                        <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-1">Phone Link</label>
                                        <div className="relative flex items-center group">
                                            <div className="absolute left-0 px-4 h-full flex items-center text-[#C5A059] text-base font-black italic border-r border-white/5 bg-white/[0.02] rounded-l-2xl">
                                                +232
                                            </div>
                                            <input
                                                className={`w-full bg-white/[0.03] border ${!isPhoneAvailable ? 'border-rose-500/50' : 'border-white/10'} rounded-2xl pl-20 pr-12 py-3 text-white focus:outline-none focus:border-[#C5A059] transition-all text-lg font-black italic tracking-tight`}
                                                placeholder="75553022"
                                                value={customerForm.phone.replace('+232', '')}
                                                maxLength={8}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                    setCustomerForm(f => ({ ...f, phone: val ? `+232${val}` : '' }));
                                                }}
                                            />
                                            {isPhoneChecking && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 scale-75">
                                                    <div className="w-4 h-4 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        {!isPhoneAvailable && (
                                            <motion.p
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="text-rose-500 text-[8px] font-black uppercase tracking-widest mt-2 px-1 flex items-center gap-2"
                                            >
                                                <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                                                SYSTEM_ALERT: Phone node occupied by another client
                                            </motion.p>
                                        )}
                                    </div>
                                    <div className="group relative">
                                        <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-1">Gender</label>
                                        <select
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-[#C5A059] transition-all text-lg font-black italic tracking-tight appearance-none cursor-pointer"
                                            value={customerForm.gender}
                                            onChange={e => setCustomerForm(f => ({ ...f, gender: e.target.value }))}
                                        >
                                            <option value="Male" className="bg-[#0f0f0f]">Male</option>
                                            <option value="Female" className="bg-[#0f0f0f]">Female</option>
                                            <option value="Other" className="bg-[#0f0f0f]">Other</option>
                                        </select>
                                        <div className="absolute right-5 bottom-4 pointer-events-none text-white/20">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="group relative">
                                    <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-1">Email</label>
                                    <div className="relative flex items-center group">
                                        <input
                                            type="email"
                                            className={`w-full bg-white/[0.03] border ${!isEmailAvailable ? 'border-rose-500/50' : 'border-white/10'} rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-[#C5A059] transition-all text-lg font-black italic tracking-tight`}
                                            placeholder="simbo@gmail.com"
                                            value={customerForm.email}
                                            maxLength={100}
                                            onChange={e => setCustomerForm(f => ({ ...f, email: e.target.value.slice(0, 100) }))}
                                        />
                                        {isEmailChecking && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 scale-75">
                                                <div className="w-4 h-4 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    {!isEmailAvailable && (
                                        <motion.p
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-rose-500 text-[8px] font-black uppercase tracking-widest mt-2 px-1 flex items-center gap-2"
                                        >
                                            <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                                            SYSTEM_ALERT: Email node occupied by another client
                                        </motion.p>
                                    )}
                                </div>

                                <div className="group relative">
                                    <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-1">Physical Location</label>
                                    <textarea
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-[#C5A059] transition-all text-sm font-medium min-h-[60px] resize-none leading-relaxed"
                                        placeholder="Eastern..."
                                        value={customerForm.address}
                                        onChange={e => setCustomerForm(f => ({ ...f, address: e.target.value }))}
                                    />
                                </div>

                                <div className="group relative">
                                    <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-1">Identity Attachment / Support Doc</label>
                                    <div
                                        className={`group/file relative border-2 border-dashed rounded-2xl p-4 transition-all duration-300 cursor-pointer ${attachmentPreview ? 'border-[#C5A059] bg-[#C5A059]/5' : 'border-white/10 hover:border-[#C5A059]/30 hover:bg-white/[0.02]'}`}
                                        onClick={() => document.getElementById('customer-modal-attachment-upload')?.click()}
                                    >
                                        <input
                                            id="customer-modal-attachment-upload"
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setAttachmentFile(file);
                                                    const reader = new FileReader();
                                                    reader.onload = ev => setAttachmentPreview(ev.target?.result as string);
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                        {attachmentPreview ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-black/20 overflow-hidden relative">
                                                    <Image src={attachmentPreview} alt="Preview" fill className="object-cover" unoptimized />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black text-white uppercase italic">Document Staged</p>
                                                    <p className="text-[8px] text-white/40 uppercase tracking-widest mt-0.5">Ready for synchronization</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setAttachmentFile(null); setAttachmentPreview(''); }}
                                                    className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 py-1">
                                                <svg className="w-5 h-5 text-white/20 group-hover/file:text-[#C5A059] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] group-hover/file:text-[#C5A059]/60 transition-colors">Attach Identity Proof</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {customerFormError && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[9px] font-black uppercase tracking-[0.2em] text-center"
                                    >
                                        <span className="opacity-40 mr-2 font-mono">ERR_CODE:</span> {customerFormError}
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
                                        disabled={isAddingCustomer || !isPhoneAvailable || isPhoneChecking || !isEmailAvailable || isEmailChecking}
                                        className={`relative flex-1 group active:scale-[0.98] transition-transform ${(isAddingCustomer || !isPhoneAvailable || isPhoneChecking || !isEmailAvailable || isEmailChecking) ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                                    >
                                        <div className="absolute inset-0 bg-white rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition duration-500" />
                                        <div className="relative bg-white text-black py-5 rounded-xl font-black uppercase tracking-[0.4em] text-[11px] flex items-center justify-center gap-6 group-hover:bg-[#C5A059] transition-all">
                                            <span className="italic">{isAddingCustomer ? 'Provisioning...' : 'Provision Registry'}</span>
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
