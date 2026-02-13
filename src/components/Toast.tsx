"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextProps {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextProps>({ showToast: () => { } });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 items-end" aria-live="polite" aria-atomic="true">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`px-5 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2
                ${toast.type === 'success' ? 'bg-green-600 text-white' : ''}
                ${toast.type === 'error' ? 'bg-rose-600 text-white' : ''}
                ${toast.type === 'info' ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : ''}
              `}
              role="status"
              tabIndex={0}
            >
              {toast.type === 'success' && <span aria-hidden="true">✅</span>}
              {toast.type === 'error' && <span aria-hidden="true">❌</span>}
              {toast.type === 'info' && <span aria-hidden="true">ℹ️</span>}
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
} 