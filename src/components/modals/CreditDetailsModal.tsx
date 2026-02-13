import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RepaymentModal } from './RepaymentModal';
import dynamic from 'next/dynamic';

const Confetti = dynamic(() => import('react-confetti'), { ssr: false }) as any;

interface CreditDetailsModalProps {
    credit: any;
    onClose: () => void;
}

export function CreditDetailsModal({ credit, onClose }: CreditDetailsModalProps) {
    const [showRepayment, setShowRepayment] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    if (!credit) return null;

    // Parse notes if they contain items structure
    const notes = credit.notes || '';
    const itemsPart = notes.includes('Items:') ? notes.split('Items:')[1].split('\n')[0] : '';
    const descriptionPart = notes.includes('Items:') ? notes.split('\n').slice(1).join('\n') : notes;

    const totalAmount = credit.amount;
    const initialPaid = credit.amountPaid || 0;
    const remainingBalance = totalAmount - initialPaid;
    const progress = Math.min(100, (initialPaid / totalAmount) * 100);

    const handleRepaymentSuccess = () => {
        // If fully paid, show confetti
        // We can check if the credit status became 'Paid' or if remaining is 0
        // Since we don't have the *new* credit object here immediately without refetching, 
        // we can assume if they paid the full remaining amount it's done. 
        // But simpler: just show confetti if they did a payment, it's a celebration!
        // Or better, only if it's fully paid. 
        // For now, let's just show it briefly.
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
    };

    return (
        <AnimatePresence>
            {showConfetti && (
                <div key="confetti-container" className="fixed inset-0 z-[60] pointer-events-none">
                    <Confetti numberOfPieces={200} recycle={false} />
                </div>
            )}

            <div key="details-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-[#0F0F0F] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="relative p-6">
                        {/* Header: Minimal & Compact */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C5A059] to-[#8A6E35] flex items-center justify-center text-black shadow-lg">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase italic tracking-tight leading-none">Record Details</h3>
                                    <span className="text-[9px] text-[#C5A059] font-black uppercase tracking-[0.3em] opacity-80">#{credit.id?.slice(-6).toUpperCase()}</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-rose-500/20 text-white/20 hover:text-rose-500 transition-all group">
                                <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Unified Stats Card: Compressed & Sleek */}
                        <div className="mb-6 p-5 rounded-[1.5rem] bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent border border-white/10 shadow-xl">
                            <div className="flex justify-between items-center mb-5">
                                <div className="space-y-0.5">
                                    <p className="text-[8px] uppercase tracking-[0.4em] text-white/30 font-black">Current Balance</p>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-xs font-black text-[#C5A059] italic">LE</span>
                                        <span className="text-3xl font-black text-white tracking-tighter leading-none">
                                            {remainingBalance.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border shadow-inner ${credit.status === 'Paid' || credit.status === 'Cleared'
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : 'bg-zinc-500/10 text-[#C5A059] border-[#C5A059]/10'
                                        }`}>
                                        {credit.status || 'Pending'}
                                    </div>
                                    <p className="text-[8px] text-white/20 font-black uppercase tracking-widest mt-2">{new Date(credit.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Compact Progress */}
                                <div className="group/progress relative h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        className="h-full bg-gradient-to-r from-[#C5A059] to-white rounded-full"
                                    />
                                </div>

                                <div className="flex justify-between items-end bg-black/20 rounded-xl p-3 border border-white/5">
                                    <div className="space-y-1">
                                        <p className="text-[7px] text-white/20 font-black uppercase tracking-widest leading-none">Debtor Profile</p>
                                        <p className="text-sm font-black text-white/90 truncate max-w-[150px] leading-none italic">{credit.customer?.name}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="text-right">
                                            <p className="text-[7px] text-white/20 font-black uppercase tracking-widest leading-none">Lent</p>
                                            <p className="text-[10px] font-black text-white/60 tracking-tight leading-none mt-1">{totalAmount.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right border-l border-white/10 pl-4">
                                            <p className="text-[7px] text-white/20 font-black uppercase tracking-widest leading-none">Received</p>
                                            <p className="text-[10px] font-black text-[#C5A059] tracking-tight leading-none mt-1">{initialPaid.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Records: Compact Side-by-Side Area */}
                        <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                            <div className="grid grid-cols-1 gap-4">
                                {/* Monospace Ledger & Items Combined */}
                                <div className="space-y-2">
                                    <h4 className="text-[8px] text-white/20 font-black uppercase tracking-[0.4em] flex items-center gap-2">
                                        <span>Transaction Ledger</span>
                                        <div className="h-px flex-1 bg-white/5" />
                                    </h4>

                                    <div className="bg-[#0A0A0A] rounded-xl border border-white/10 overflow-hidden shadow-inner">
                                        {itemsPart && (
                                            <div className="bg-[#C5A059]/5 p-3 border-b border-white/5">
                                                <p className="text-[9px] text-[#C5A059] font-black uppercase tracking-wider italic leading-relaxed">
                                                    Inventory: {itemsPart}
                                                </p>
                                            </div>
                                        )}
                                        {descriptionPart && descriptionPart.trim() !== '' && (
                                            <div className="p-4">
                                                <p className="text-[11px] text-white/60 font-mono leading-relaxed whitespace-pre-wrap">
                                                    {descriptionPart}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Support Image - Compressed Frame */}
                                {credit.image && (
                                    <div className="space-y-2">
                                        <h4 className="text-[8px] text-white/20 font-black uppercase tracking-[0.4em] flex items-center gap-2">
                                            <span>Validation Asset</span>
                                            <div className="h-px flex-1 bg-white/5" />
                                        </h4>
                                        <div className="relative group/img rounded-xl overflow-hidden border border-white/10 bg-black aspect-[16/6] flex items-center justify-center p-1.5">
                                            <img
                                                src={credit.image}
                                                alt="Support"
                                                className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-700"
                                            />
                                            <a
                                                href={credit.image}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="absolute inset-x-4 bottom-4 py-2 bg-black/60 backdrop-blur-md rounded-lg opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center gap-2 border border-white/10"
                                            >
                                                <svg className="w-3.5 h-3.5 text-[#C5A059]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" /></svg>
                                                <span className="text-[8px] font-black uppercase tracking-widest text-[#C5A059]">Digital Full Copy</span>
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom Actions: Compact Buttons */}
                        <div className="mt-8 flex gap-3">
                            <button onClick={onClose} className="flex-1 py-3.5 rounded-xl bg-white/[0.03] hover:bg-white/10 text-white/40 hover:text-white font-black text-[9px] uppercase tracking-[0.3em] italic transition-all border border-white/5">
                                Dismiss
                            </button>
                            {remainingBalance > 0 && (
                                <button
                                    onClick={() => setShowRepayment(true)}
                                    className="flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-[#C5A059] to-white text-black font-black text-[9px] uppercase tracking-[0.3em] italic shadow-lg shadow-[#C5A059]/20 transition-all hover:scale-[1.02] active:scale-95"
                                >
                                    Settle Payment
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Repayment Modal Overlay */}
            {showRepayment && (
                <div key="repayment-modal-overlay" className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-md bg-[#0F0F0F] border border-white/10 rounded-[2rem] shadow-2xl p-6 relative overflow-hidden"
                    >
                        <RepaymentModal
                            credit={credit}
                            onClose={() => setShowRepayment(false)}
                            onSuccess={handleRepaymentSuccess}
                        />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
