import { useState, useEffect } from 'react';
import { useCredits } from '../../contexts/CreditsContext';
import { useCustomers } from '../../contexts/CustomersContext';
import { useDebtors } from '../../contexts/DebtorsContext';
import { useToast } from '../Toast';
import { ButtonLoader } from '../LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

interface RepaymentModalProps {
    credit: any;
    onClose: () => void;
    onSuccess: () => void;
}

export function RepaymentModal({ credit, onClose, onSuccess }: RepaymentModalProps) {
    const { addRepayment } = useCredits();
    const { refreshCustomers } = useCustomers();
    const { refreshDebtors } = useDebtors();
    const { showToast } = useToast();

    // Calculate initial values
    const totalAmount = credit.amount;
    const initialPaid = credit.amountPaid || 0;
    const remainingBalance = totalAmount - initialPaid;

    const [amountToPay, setAmountToPay] = useState<number | ''>('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Quick fill full amount
    const handleFullPayment = () => {
        setAmountToPay(remainingBalance);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amountToPay || Number(amountToPay) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (Number(amountToPay) > remainingBalance) {
            setError(`Amount cannot exceed remaining balance (LE ${remainingBalance.toLocaleString()})`);
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await addRepayment(credit.id, Number(amountToPay), notes);

            // Refresh other contexts to keep totals in sync
            if (refreshCustomers) refreshCustomers();
            if (refreshDebtors) refreshDebtors();

            showToast('Repayment recorded successfully', 'success');
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to process repayment');
            showToast('Failed to record repayment', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-1">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Make Repayment</h3>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Record payment for {credit.customer?.name}</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-white/20 hover:text-white transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* Balance Card */}
            <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/5 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A059]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="grid grid-cols-3 gap-4 text-center relative z-10">
                    <div>
                        <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">Total</div>
                        <div className="text-sm font-bold text-white/60">LE {totalAmount.toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">Paid</div>
                        <div className="text-sm font-bold text-emerald-400/80">LE {initialPaid.toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-[9px] uppercase tracking-widest text-[#C5A059] font-black mb-1">Remaining</div>
                        <div className="text-lg font-black text-white">LE {remainingBalance.toLocaleString()}</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-[#C5A059]/50 to-[#C5A059]"
                        style={{ width: `${Math.min(100, (initialPaid / totalAmount) * 100)}%` }}
                    />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-[11px] font-black text-white/70 uppercase tracking-[0.2em] mb-2">
                        Payment Amount (LE)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            className="w-full bg-white/[0.03] border-b-2 border-white/20 focus:border-[#C5A059] px-4 py-3 text-white placeholder:text-white/20 focus:outline-none transition-all text-xl font-black italic tracking-tight rounded-t-lg"
                            placeholder="0.00"
                            value={amountToPay}
                            onChange={e => {
                                setAmountToPay(e.target.value === '' ? '' : Number(e.target.value));
                                setError('');
                            }}
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={handleFullPayment}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#C5A059]/10 hover:bg-[#C5A059]/20 text-[#C5A059] text-[9px] font-black uppercase tracking-widest rounded transition-colors"
                        >
                            Pay Full
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-[11px] font-black text-white/70 uppercase tracking-[0.2em] mb-2">
                        Notes (Optional)
                    </label>
                    <textarea
                        className="w-full bg-white/[0.03] border-b-2 border-white/20 focus:border-[#C5A059] px-4 py-3 text-white placeholder:text-white/20 focus:outline-none transition-all text-sm font-medium tracking-wide rounded-t-lg resize-none h-20"
                        placeholder="Transaction details..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                    />
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-3 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-[10px] font-bold text-center"
                    >
                        {error}
                    </motion.div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting || remainingBalance <= 0}
                    className="w-full py-4 rounded-full bg-[#C5A059] hover:bg-white text-black font-black uppercase tracking-[0.3em] text-[10px] shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? <ButtonLoader size="sm" /> : 'Confirm Payment'}
                </button>
            </form>
        </div>
    );
}
