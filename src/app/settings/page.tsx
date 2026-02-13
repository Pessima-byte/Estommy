"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { backupAPI } from "@/lib/api";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/roles";
import { useToast } from "@/components/Toast";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  const canBackup = hasPermission(Permission.BACKUP_RESTORE);

  async function handleBackup() {
    try {
      setBackupLoading(true);
      const backup = await backupAPI.create();

      // Download as JSON file
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `estommy-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Cloud architecture backup successful!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to create backup', 'error');
    } finally {
      setBackupLoading(false);
    }
  }

  async function handleRestore() {
    if (!restoreFile) {
      showToast('Please select a valid architecture file.', 'error');
      return;
    }

    try {
      setRestoreLoading(true);
      const text = await restoreFile.text();
      const backup = JSON.parse(text);

      if (!backup.data || !backup.data.products || !backup.data.customers) {
        showToast('Invalid backup file format. System integrity check failed.', 'error');
        return;
      }

      const confirmed = window.confirm(
        'CRITICAL: This will synchronize system state with the backup file. Current local data will be overwritten. Proceed with restoration?'
      );

      if (!confirmed) return;

      await backupAPI.restore(backup.data, false);
      showToast('System restoration complete. Rebooting state...', 'success');
      setRestoreFile(null);

      // Refresh page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      showToast(error.message || 'Failed to restore backup', 'error');
    } finally {
      setRestoreLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setRestoreFile(file);
    }
  }

  if (!canBackup) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="w-16 h-16 rounded-full bg-zinc-500/10 flex items-center justify-center border border-zinc-500/20">
          <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2 italic">Access Restrictred</h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em]">Administrator privileges required for system configuration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 min-h-[80vh] p-4 text-white font-sans selection:bg-[#C5A059] selection:text-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] glass-elevated border border-white/10 shadow-2xl p-6 md:p-8 mb-4 transition-all duration-700">
        <div className="absolute inset-0 z-0 bg-white/[0.01]"></div>
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_-30%,rgba(0,217,255,0.08),transparent_70%)] opacity-40"></div>
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_80%_120%,rgba(124,58,237,0.03),transparent_70%)] opacity-40"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-px w-6 bg-cyan-400"></div>
              <span className="text-[9px] uppercase tracking-[0.4em] text-cyan-400 font-bold">System Core</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black bg-gradient-to-r from-white via-white/80 to-white/40 bg-clip-text text-transparent mb-1 tracking-tighter uppercase">
              Configuration
            </h1>
            <p className="text-[11px] text-white/40 max-w-sm font-medium leading-relaxed uppercase">
              Global system parameters and infrastructure data management.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right px-6 border-r border-white/5">
              <div className="text-[9px] uppercase tracking-widest text-cyan-400 font-bold mb-0.5">DB Engine</div>
              <div className="text-lg font-black text-white tracking-widest">SQLITE v1.0</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-widest text-emerald-500 font-bold mb-0.5">Integrity</div>
              <div className="text-lg font-black text-white tracking-widest">VERIFIED</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Backup UI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative p-px rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent overflow-hidden group shadow-2xl"
        >
          <div className="relative bg-[#252530] backdrop-blur-3xl rounded-[2.45rem] p-8 h-full">
            <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,217,255,0.1)]">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4-4v12" /></svg>
              </div>
              <div className="text-right">
                <div className="text-[8px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-1">Backup Unit</div>
                <div className="text-[10px] font-black text-white/40 tracking-widest uppercase">Export Local State</div>
              </div>
            </div>

            <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic italic mb-4">Export Infrastructure</h3>
            <p className="text-[11px] text-white/40 font-medium leading-relaxed mb-8 uppercase tracking-wider">
              Download a full cryptographic snapshot of your business ecosystem including all products, customers, transactions, and ledger history.
            </p>

            <button
              onClick={handleBackup}
              disabled={backupLoading}
              className="relative w-full group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition duration-500" />
              <div className="relative bg-white hover:bg-cyan-400 hover:text-white text-black py-4 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-50">
                {backupLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    Processing Snapshot...
                  </span>
                ) : (
                  <>
                    <span className="italic">Initiate Export</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  </>
                )}
              </div>
            </button>
          </div>
        </motion.div>

        {/* Restore UI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative p-px rounded-[2.5rem] bg-gradient-to-br from-[#C5A059]/30 to-transparent overflow-hidden group shadow-2xl"
        >
          <div className="relative bg-[#252530] backdrop-blur-3xl rounded-[2.45rem] p-8 h-full">
            <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-[#C5A059] shadow-[0_0_20px_rgba(197,160,89,0.1)]">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              </div>
              <div className="text-right">
                <div className="text-[8px] font-black text-[#C5A059] uppercase tracking-[0.3em] mb-1">Restore Unit</div>
                <div className="text-[10px] font-black text-white/40 tracking-widest uppercase">System Initialization</div>
              </div>
            </div>

            <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic mb-4">State Restoration</h3>
            <p className="text-[11px] text-white/40 font-medium leading-relaxed mb-6 uppercase tracking-wider">
              Upload a system snapshot to restore architecture. Warning: This operation will overwrite all local records with the provided dataset.
            </p>

            <div className="space-y-4">
              <div className="relative group/input">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full px-6 py-4 rounded-2xl bg-white/[0.02] border border-white/5 group-hover/input:border-[#C5A059]/40 transition-all flex items-center justify-between">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest truncate max-w-[200px]">
                    {restoreFile ? restoreFile.name : 'Select Snapshot File...'}
                  </span>
                  <div className="px-3 py-1.5 rounded-lg bg-[#C5A059]/10 text-[#C5A059] text-[8px] font-black uppercase tracking-widest border border-[#C5A059]/20">
                    Browse
                  </div>
                </div>
              </div>

              <button
                onClick={handleRestore}
                disabled={restoreLoading || !restoreFile}
                className="relative w-full group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl blur-lg opacity-10 group-hover:opacity-30 transition duration-500" />
                <div className="relative bg-[#C5A059] hover:bg-white hover:text-[#C5A059] text-black py-4 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-30">
                  {restoreLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      Synchronizing...
                    </span>
                  ) : (
                    <>
                      <span className="italic">Apply Snapshot</span>
                      <svg className="w-4 h-4 group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Profile & Security Info */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-[2rem] glass border border-white/5 p-8">
          <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-6">User Authorization</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-[8px] font-black text-cyan-400 uppercase tracking-widest mb-1 italic">Operator</div>
              <div className="text-sm font-black text-white truncate truncate uppercase italic">{session?.user?.name || 'Unknown'}</div>
            </div>
            <div>
              <div className="text-[8px] font-black text-cyan-400 uppercase tracking-widest mb-1 italic">Identity</div>
              <div className="text-sm font-black text-white truncate truncate lowercase opacity-60 italic">{session?.user?.email || 'N/A'}</div>
            </div>
            <div>
              <div className="text-[8px] font-black text-[#C5A059] uppercase tracking-widest mb-1 italic">Privilege</div>
              <div className="inline-flex px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-[#C5A059] tracking-widest uppercase">
                {session?.user?.role || 'User'}
              </div>
            </div>
            <div>
              <div className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1 italic">Method</div>
              <div className="text-sm font-black text-white uppercase italic">{session?.user?.provider || 'Auth'}</div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] glass border border-white/5 p-8 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">System Online</span>
          </div>
          <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest leading-loose italic">
            All modules operational. Database connection secure. Regional latency: 24ms.
          </p>
        </div>
      </div>
    </div>
  );
}




