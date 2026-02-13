"use client";
import { useCustomers } from "../../contexts/CustomersContext";
import { useState, useMemo, useEffect } from "react";
import { exportToCSV } from "../../utils/csvExport";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/roles";
import { uploadAPI, customersAPI } from "../../lib/api";
import { AddCustomerModal } from "../../components/forms/AddCustomerModal";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "../../components/Toast";

const ITEMS_PER_PAGE = 12;

export default function CustomersPage() {
    const { customers, editCustomer, deleteCustomer, loading } = useCustomers();
    const { hasPermission } = usePermissions();
    const { showToast } = useToast();
    const [editId, setEditId] = useState<string | null>(null);

    // Check permissions
    const canCreate = hasPermission(Permission.CREATE_CUSTOMERS);
    const canEdit = hasPermission(Permission.EDIT_CUSTOMERS);
    const canDelete = hasPermission(Permission.DELETE_CUSTOMERS);
    const canExport = hasPermission(Permission.EXPORT_DATA);

    // Edit Form State
    const [editForm, setEditForm] = useState<any>({});
    const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
    const [editAvatarPreview, setEditAvatarPreview] = useState('');
    const [editAttachmentFile, setEditAttachmentFile] = useState<File | null>(null);
    const [editAttachmentPreview, setEditAttachmentPreview] = useState('');

    // Other States
    const [showDelete, setShowDelete] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);


    // Validation States
    const [isPhoneAvailable, setIsPhoneAvailable] = useState(true);
    const [isPhoneChecking, setIsPhoneChecking] = useState(false);
    const [isEmailAvailable, setIsEmailAvailable] = useState(true);
    const [isEmailChecking, setIsEmailChecking] = useState(false);

    useEffect(() => {
        let timeoutId: any;

        if (editId && editForm.phone) {
            const checkPhone = async () => {
                setIsPhoneChecking(true);
                try {
                    const { available } = await customersAPI.checkAvailability('phone', editForm.phone, editId);
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
    }, [editForm.phone, editId]);

    useEffect(() => {
        let timeoutId: any;

        if (editId && editForm.email) {
            const checkEmail = async () => {
                setIsEmailChecking(true);
                try {
                    const { available } = await customersAPI.checkAvailability('email', editForm.email, editId);
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
    }, [editForm.email, editId]);

    function openEdit(customer: any) {
        setEditId(customer.id);
        setEditForm({ ...customer });
        setEditAvatarFile(null);
        setEditAvatarPreview(customer.avatar || '');
        setEditAttachmentFile(null);
        setEditAttachmentPreview(customer.attachment || '');
    }

    async function handleEditSubmit(e: any) {
        e.preventDefault();
        try {
            let avatarUrl = editForm.avatar;
            if (editAvatarFile) {
                const uploadRes = await uploadAPI.upload(editAvatarFile);
                avatarUrl = uploadRes.url;
            }

            let attachmentUrl = editForm.attachment;
            if (editAttachmentFile) {
                const uploadRes = await uploadAPI.upload(editAttachmentFile);
                attachmentUrl = uploadRes.url;
            }

            await editCustomer(editId!, { ...editForm, avatar: avatarUrl, attachment: attachmentUrl });
            setEditId(null);
            setEditAvatarFile(null);
            setEditAvatarPreview('');
            setEditAttachmentFile(null);
            setEditAttachmentPreview('');
            showToast('Profile updated successfully', 'success');
        } catch (err: any) {
            console.error('Failed to update customer:', err);
            const errorMessage = err.message || 'Failed to update customer';
            showToast(errorMessage, 'error');
        }
    }

    function handleDelete(id: string) {
        deleteCustomer(id);
        setShowDelete(null);
    }

    // Filter and search logic
    const filteredCustomers = useMemo(() => {
        let result = customers.filter(customer => {
            const nameMatch = customer.name.toLowerCase().includes(searchQuery.toLowerCase());
            const phoneMatch = customer.phone?.toLowerCase().includes(searchQuery.toLowerCase());
            const emailMatch = customer.email?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesSearch = !searchQuery || nameMatch || phoneMatch || emailMatch;
            const matchesStatus = !statusFilter || customer.status === statusFilter;
            return matchesSearch && matchesStatus;
        });

        // Apply Sorting
        return result.sort((a, b) => {
            switch (sortBy) {
                case 'name_asc':
                    return a.name.localeCompare(b.name);
                case 'name_desc':
                    return b.name.localeCompare(a.name);
                case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'debt_desc':
                    return (b.totalDebt || 0) - (a.totalDebt || 0);
                default:
                    return 0;
            }
        });
    }, [customers, searchQuery, statusFilter, sortBy]);

    // Pagination logic
    const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
    const paginatedCustomers = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredCustomers, currentPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, sortBy]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading && customers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
                <div className="w-12 h-12 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin"></div>
                <div className="text-[#C5A059] text-xs font-black uppercase tracking-[0.3em] animate-pulse">Initializing Registry...</div>
            </div>
        );
    }

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
                            <span className="text-[9px] uppercase tracking-[0.4em] text-[#C5A059] font-bold">CRM System</span>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-black bg-gradient-to-r from-white via-white/80 to-white/40 bg-clip-text text-transparent mb-1 tracking-tighter uppercase">
                            Customer Registry
                        </h1>
                        <p className="text-[11px] text-white/40 max-w-sm font-medium leading-relaxed">
                            Maintain your demographic database and track individual customer journeys.
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right px-6 border-r border-white/5">
                            <div className="text-[9px] uppercase tracking-widest text-[#C5A059] font-bold mb-0.5">Active Accounts</div>
                            <div className="text-2xl font-black text-white tracking-tighter">{customers.length}</div>
                        </div>

                        <div className="flex gap-3">
                            {canExport && (
                                <button
                                    className="px-6 py-3.5 rounded-full bg-white/[0.03] border border-white/10 text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all shadow-xl"
                                    onClick={() => exportToCSV(filteredCustomers, 'customers')}
                                >
                                    Export CSV
                                </button>
                            )}
                            {canCreate && (
                                <button
                                    className="px-6 py-3.5 rounded-full bg-white text-black text-[9px] font-black uppercase tracking-[0.2em] hover:scale-105 hover:bg-[#C5A059] transition-all shadow-xl active:scale-95"
                                    onClick={() => setShowAdd(true)}
                                >
                                    Add Customer
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-2">
                <div className="relative flex-1 max-w-md">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name, phone or email..."
                        className="w-full pl-12 pr-6 py-3 rounded-2xl bg-white/[0.03] border border-white/5 focus:outline-none focus:border-[#C5A059]/50 text-white placeholder:text-white/10 text-xs font-bold transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-4">
                    <div className="relative">
                        <select
                            className="pl-6 pr-10 py-4 rounded-2xl bg-white/[0.03] border border-white/5 focus:outline-none focus:border-[#C5A059]/50 text-white appearance-none cursor-pointer text-[10px] font-black uppercase tracking-widest transition-all"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="" className="bg-[#0f0f0f]">All Statuses</option>
                            <option value="Active" className="bg-[#0f0f0f]">Active</option>
                            <option value="Inactive" className="bg-[#0f0f0f]">Inactive</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>

                    <div className="relative">
                        <select
                            className="pl-6 pr-10 py-4 rounded-2xl bg-white/[0.03] border border-white/5 focus:outline-none focus:border-[#C5A059]/50 text-white appearance-none cursor-pointer text-[10px] font-black uppercase tracking-widest transition-all"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="newest" className="bg-[#0f0f0f]">Recently Added</option>
                            <option value="oldest" className="bg-[#0f0f0f]">Oldest First</option>
                            <option value="name_asc" className="bg-[#0f0f0f]">Name (A-Z)</option>
                            <option value="name_desc" className="bg-[#0f0f0f]">Name (Z-A)</option>
                            <option value="debt_desc" className="bg-[#0f0f0f]">Highest Debt</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Customer Grid */}
            {filteredCustomers.length === 0 ? (
                <div className="p-32 text-center border border-dashed border-white/10 rounded-[3rem] bg-white/5 backdrop-blur-sm">
                    <div className="text-white/20 text-lg font-bold mb-2">No Records Found</div>
                    <p className="text-white/10 text-xs uppercase tracking-widest">Your search criteria did not match any registered customers.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {paginatedCustomers.map(customer => (
                        <motion.div
                            key={customer.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -5 }}
                            className="group relative flex flex-col p-px rounded-[2.5rem] overflow-hidden bg-gradient-to-b from-white/10 to-transparent hover:from-[#C5A059]/30 transition-all duration-500 shadow-2xl"
                        >
                            {/* Inner Glass Layer */}
                            <div className="relative flex flex-col h-full bg-gradient-to-b from-[#252530] to-[#1A1A23] backdrop-blur-3xl rounded-[2.45rem] p-7 overflow-hidden border border-white/5 group-hover:border-[#C5A059]/20 transition-all">
                                {/* Futuristic Grid/Scanline background */}
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
                                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#C5A059]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                {/* Top Navigation/Status */}
                                <div className="flex items-start justify-between mb-8 relative z-10">
                                    <div className="relative">
                                        {/* Avatar Tech Frame */}
                                        <div className="relative w-20 h-20">
                                            <div className="absolute -inset-4 bg-[#C5A059]/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                                            <div className="absolute -inset-[1px] bg-gradient-to-tr from-white/10 to-transparent rounded-2xl" />

                                            <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                                                <Image
                                                    src={customer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=1a1a1a&color=fff`}
                                                    alt={customer.name}
                                                    fill
                                                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                                />
                                                {/* Scanning Line */}
                                                <div className="absolute inset-0 w-full h-[2px] bg-[#C5A059]/40 blur-[1px] -translate-y-full group-hover:animate-[scan_3s_linear_infinite]" />
                                            </div>

                                            {/* Status Indicator */}
                                            <div className="absolute -bottom-1 -right-1 z-20">
                                                <div className={`w-4 h-4 rounded-full border-[3px] border-[#0a0a0f] relative ${customer.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'
                                                    }`}>
                                                    <div className={`absolute inset-0 rounded-full animate-ping opacity-40 ${customer.status === 'Active' ? 'bg-emerald-400' : 'bg-amber-400'
                                                        }`} />
                                                    <div className={`absolute -inset-2 rounded-full blur-md opacity-20 ${customer.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'
                                                        }`} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Deck */}
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/customers/${customer.id}`}
                                            className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 hover:border-[#C5A059]/40 hover:bg-[#C5A059]/10 text-white/30 hover:text-[#C5A059] flex items-center justify-center transition-all duration-300"
                                            title="View Profile"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        </Link>
                                        {canDelete && (
                                            <button
                                                className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/40 hover:bg-white/10 text-white/10 hover:text-white flex items-center justify-center transition-all duration-300"
                                                onClick={() => setShowDelete(customer.id)}
                                                title="Remove Account"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Identity Section */}
                                <div className="space-y-4 mb-8 relative z-10">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1 opacity-40">
                                            <div className="w-3 h-[1px] bg-[#C5A059]" />
                                            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[#C5A059]">Client Identity</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-white group-hover:text-[#C5A059] transition-colors tracking-tighter uppercase italic leading-none truncate">
                                            {customer.name}
                                        </h3>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-white/50 group-hover:text-white transition-colors">
                                            <svg className="w-3 h-3 text-[#C5A059]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            <span className="text-[9px] font-bold uppercase tracking-widest truncate">{customer.email || 'NO_ENCRYPTION_ADDR'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white/50 group-hover:text-white transition-colors">
                                            <svg className="w-3 h-3 text-[#C5A059]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                            <span className="text-[9px] font-bold uppercase tracking-widest">{customer.phone || 'OFFLINE'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tech Stats Bar */}
                                <div className="mt-auto grid grid-cols-2 gap-px bg-white/5 rounded-2xl border border-white/5 overflow-hidden relative z-10 group-hover:border-[#C5A059]/20 transition-colors">
                                    <div className="bg-[#0a0a0f] p-4 flex flex-col items-center justify-center text-center">
                                        <span className="text-[7px] font-black text-[#C5A059]/60 uppercase tracking-[0.4em] mb-1">Liability</span>
                                        <span className="text-sm font-black text-white tracking-tighter">
                                            Le <span className="text-base">{(customer.totalDebt || 0).toLocaleString()}</span>
                                        </span>
                                    </div>
                                    <div className="bg-[#0a0a0f] p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-full bg-[#C5A059]/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">Status</span>
                                        <span className="text-[10px] font-black text-white uppercase tracking-[0.1em] italic">
                                            {customer.gender || 'UNDEFINED'}
                                        </span>
                                    </div>
                                </div>

                                {/* Primary Action */}
                                <div className="mt-6 relative z-10">
                                    {canEdit && (
                                        <button
                                            className="w-full py-4 rounded-2xl bg-white/[0.05] hover:bg-white text-white/60 hover:text-black font-black text-[10px] uppercase tracking-[0.4em] transition-all duration-500 border border-white/5 hover:border-white shadow-[0_0_20px_rgba(0,0,0,0.5)] active:scale-[0.97]"
                                            onClick={() => openEdit(customer)}
                                        >
                                            <span className="relative z-10 italic">Modify Profile</span>
                                        </button>
                                    )}
                                </div>

                                {/* Corner Decorative Accents */}
                                <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-white/10 to-transparent opacity-20 pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-8 h-8 bg-gradient-to-tr from-[#C5A059]/5 to-transparent opacity-20 pointer-events-none" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            className={`w-10 h-10 rounded-xl font-black text-[10px] transition-all flex items-center justify-center ${currentPage === page
                                ? 'bg-white text-black shadow-xl scale-110'
                                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                                }`}
                            onClick={() => handlePageChange(page)}
                        >
                            {page}
                        </button>
                    ))}
                </div>
            )}

            {/* Modals */}
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

                            <AddCustomerModal onClose={() => setShowAdd(false)} />
                        </motion.div>
                    </div>
                )}

                {editId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-2xl p-4 overflow-y-auto" onClick={() => setEditId(null)}>
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

                            <div className="relative z-10 mb-6 flex items-center justify-between">
                                <div className="text-left">
                                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">Edit Profile</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="h-[2px] w-6 bg-[#C5A059]" />
                                        <span className="text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em]">Synchronizing Registry</span>
                                    </div>
                                </div>
                                <div className="text-right hidden md:block">
                                    <div className="text-[10px] uppercase tracking-widest text-white/20 font-bold mb-1">ID_AUTH_CODE</div>
                                    <div className="text-xs font-black text-[#C5A059] tracking-tighter uppercase italic">{editId.slice(-8)}</div>
                                </div>
                            </div>

                            <form className="relative z-10 flex flex-col md:flex-row gap-8" onSubmit={handleEditSubmit}>
                                {/* Left Column: Avatar */}
                                <div className="flex flex-col items-center gap-6 md:w-1/3">
                                    <div className="relative group">
                                        <div className="absolute -inset-4 bg-gradient-to-tr from-[#C5A059]/20 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                                        <div
                                            className="relative w-40 h-40 rounded-3xl p-1 bg-gradient-to-br from-white/20 to-transparent cursor-pointer overflow-hidden shadow-2xl"
                                            onClick={() => document.getElementById('edit-avatar-upload')?.click()}
                                        >
                                            <div className="relative h-full w-full rounded-[1.4rem] overflow-hidden bg-[#0A0A0F]">
                                                {editAvatarPreview ? (
                                                    <Image src={editAvatarPreview} alt="Preview" fill className="object-cover transition-transform duration-700 group-hover:scale-110" unoptimized />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-white/10 uppercase tracking-tighter italic text-center p-4">
                                                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                        <span className="text-[10px] font-black leading-tight">Biometric Photo Source</span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-x-0 bottom-0 py-2.5 bg-black/60 backdrop-blur-md translate-y-full group-hover:translate-y-0 transition-transform duration-300 border-t border-white/10">
                                                    <span className="block text-[8px] font-black text-white text-center uppercase tracking-widest leading-none">Modify Identity</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shadow-2xl border border-black/10 group-hover:scale-110 transition-transform cursor-pointer"
                                            onClick={() => document.getElementById('edit-avatar-upload')?.click()}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1 leading-relaxed max-w-[120px]">Recommended: Square aspect ratio, High fidelity.</p>
                                    </div>
                                    <input id="edit-avatar-upload" type="file" className="hidden" accept="image/*" onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setEditAvatarFile(file);
                                            const reader = new FileReader();
                                            reader.onload = ev => setEditAvatarPreview(ev.target?.result as string);
                                            reader.readAsDataURL(file);
                                        }
                                    }} />

                                    <div className="mt-auto w-full pt-4 md:block hidden">
                                        <button
                                            type="button"
                                            className="w-full px-6 py-5 rounded-2xl bg-white/[0.02] border border-white/5 text-[10px] font-black text-white/30 uppercase tracking-[0.5em] hover:text-white hover:bg-white/5 transition-all text-center flex items-center justify-center italic"
                                            onClick={() => setEditId(null)}
                                        >
                                            Abort
                                        </button>
                                    </div>
                                </div>

                                {/* Right Column: Fields */}
                                <div className="flex-1 space-y-4">
                                    <div className="group relative">
                                        <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-1">Full Name</label>
                                        <input
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-[#C5A059] transition-all text-lg font-black italic tracking-tight placeholder:text-white/5 shadow-inner"
                                            value={editForm.name || ''}
                                            onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))}
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
                                                    value={(editForm.phone || '').replace('+232', '')}
                                                    maxLength={8}
                                                    onChange={e => {
                                                        const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                        setEditForm((f: any) => ({ ...f, phone: val ? `+232${val}` : '' }));
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
                                                value={editForm.gender || ''}
                                                onChange={e => setEditForm((f: any) => ({ ...f, gender: e.target.value }))}
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
                                                value={editForm.email || ''}
                                                maxLength={100}
                                                onChange={e => setEditForm((f: any) => ({ ...f, email: e.target.value.slice(0, 100) }))}
                                                placeholder="UNREGISTERED_ADDR"
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
                                            placeholder="Awaiting location coordinates..."
                                            value={editForm.address || ''}
                                            onChange={e => setEditForm((f: any) => ({ ...f, address: e.target.value }))}
                                        />
                                    </div>

                                    <div className="group relative">
                                        <label className="block text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-1.5 px-1">Identity Attachment / Support Doc</label>
                                        <div
                                            className={`group/file relative border-2 border-dashed rounded-2xl p-4 transition-all duration-300 cursor-pointer ${editAttachmentPreview ? 'border-[#C5A059] bg-[#C5A059]/5' : 'border-white/10 hover:border-[#C5A059]/30 hover:bg-white/[0.02]'}`}
                                            onClick={() => document.getElementById('edit-attachment-upload')?.click()}
                                        >
                                            <input
                                                id="edit-attachment-upload"
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={e => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setEditAttachmentFile(file);
                                                        const reader = new FileReader();
                                                        reader.onload = ev => setEditAttachmentPreview(ev.target?.result as string);
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                            {editAttachmentPreview ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-lg bg-black/20 overflow-hidden relative border border-white/10">
                                                        <Image src={editAttachmentPreview} alt="Preview" fill className="object-cover" unoptimized />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-black text-white uppercase italic">Document Staged</p>
                                                        <p className="text-[8px] text-white/40 uppercase tracking-widest mt-0.5">Ready for synchronization</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); setEditAttachmentFile(null); setEditAttachmentPreview(''); setEditForm((f: any) => ({ ...f, attachment: null })); }}
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

                                    <div className="pt-4 flex gap-6 items-center">
                                        <button
                                            type="button"
                                            className="md:hidden flex-1 px-6 py-4 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-black text-white/30 uppercase tracking-[0.5em] hover:text-white hover:bg-white/5 transition-all text-center italic"
                                            onClick={() => setEditId(null)}
                                        >
                                            Abort
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!isPhoneAvailable || isPhoneChecking || !isEmailAvailable || isEmailChecking}
                                            className={`relative flex-1 group active:scale-[0.98] transition-transform ${(!isPhoneAvailable || isPhoneChecking || !isEmailAvailable || isEmailChecking) ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                                        >
                                            <div className="absolute inset-0 bg-white rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition duration-500" />
                                            <div className="relative bg-white text-black py-5 rounded-xl font-black uppercase tracking-[0.4em] text-[11px] flex items-center justify-center gap-6 group-hover:bg-[#C5A059] transition-all">
                                                <span className="italic">Apply Changes</span>
                                                <div className="w-8 h-[1px] bg-black/10" />
                                                <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                </svg>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {
                    showDelete && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-xl" onClick={() => setShowDelete(null)}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative rounded-[2rem] bg-white/[0.03] backdrop-blur-3xl border border-white/10 py-10 px-8 max-w-sm w-full text-center shadow-2xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="w-16 h-16 rounded-full bg-zinc-500/10 flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <h3 className="text-xl font-black mb-2 text-white uppercase tracking-tight">Remove Account</h3>
                                <p className="mb-8 text-white/40 text-[10px] font-medium leading-relaxed">This customer profile and all their history will be permanently erased from the registry.</p>
                                <div className="flex flex-col gap-3">
                                    <button className="w-full py-4 rounded-xl bg-white/10 text-white font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-black transition-all shadow-lg" onClick={() => handleDelete(showDelete!)}>Commit Deletion</button>
                                    <button className="w-full py-4 rounded-xl text-white/30 font-black uppercase tracking-widest text-[10px]" onClick={() => setShowDelete(null)}>Abort</button>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >
        </div >
    );
}
