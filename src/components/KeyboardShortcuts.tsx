"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardShortcutsProps {
  onAddProduct?: () => void;
  onAddCustomer?: () => void;
  onAddSale?: () => void;
  onViewReports?: () => void;
  onToggleSearch?: () => void;
}

export default function KeyboardShortcuts({
  onAddProduct,
  onAddCustomer,
  onAddSale,
  onViewReports,
  onToggleSearch
}: KeyboardShortcutsProps) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger shortcuts when not typing in input fields
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement || 
          event.target instanceof HTMLSelectElement) {
        return;
      }

      // Ctrl/Cmd + key combinations
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case '1':
            event.preventDefault();
            router.push('/');
            break;
          case '2':
            event.preventDefault();
            router.push('/products');
            break;
          case '3':
            event.preventDefault();
            router.push('/customers');
            break;
          case '4':
            event.preventDefault();
            router.push('/sales');
            break;
          case '5':
            event.preventDefault();
            router.push('/stock');
            break;
          case '6':
            event.preventDefault();
            router.push('/credits');
            break;
          case '7':
            event.preventDefault();
            router.push('/profits');
            break;
          case 'n':
            event.preventDefault();
            if (event.shiftKey && onAddProduct) {
              onAddProduct();
            } else if (onAddCustomer) {
              onAddCustomer();
            }
            break;
          case 's':
            event.preventDefault();
            if (onAddSale) {
              onAddSale();
            }
            break;
          case 'r':
            event.preventDefault();
            if (onViewReports) {
              onViewReports();
            }
            break;
          case 'k':
            event.preventDefault();
            if (onToggleSearch) {
              onToggleSearch();
            }
            break;
        }
      }

      // Escape key
      if (event.key === 'Escape') {
        // Close any open modals or dropdowns
        const modals = document.querySelectorAll('[data-modal]');
        modals.forEach(modal => {
          if (modal instanceof HTMLElement) {
            modal.style.display = 'none';
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, onAddProduct, onAddCustomer, onAddSale, onViewReports, onToggleSearch]);

  return null; // This component doesn't render anything
}

// Keyboard shortcuts help modal
export function KeyboardShortcutsHelp() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <details className="group">
        <summary className="cursor-pointer bg-white  p-3 rounded-lg shadow-lg border border-gray-200  hover:bg-gray-50  transition-colors">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-gray-600 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm font-medium text-gray-700 ">Keyboard Shortcuts</span>
          </div>
        </summary>
        <div className="absolute bottom-full right-0 mb-2 w-80 bg-white  rounded-lg shadow-xl border border-gray-200  p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Keyboard Shortcuts</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 ">Dashboard</span>
              <kbd className="px-2 py-1 bg-gray-100  rounded text-xs">Ctrl + 1</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 ">Products</span>
              <kbd className="px-2 py-1 bg-gray-100  rounded text-xs">Ctrl + 2</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 ">Customers</span>
              <kbd className="px-2 py-1 bg-gray-100  rounded text-xs">Ctrl + 3</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 ">Sales</span>
              <kbd className="px-2 py-1 bg-gray-100  rounded text-xs">Ctrl + 4</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 ">Stock</span>
              <kbd className="px-2 py-1 bg-gray-100  rounded text-xs">Ctrl + 5</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 ">Add Customer</span>
              <kbd className="px-2 py-1 bg-gray-100  rounded text-xs">Ctrl + N</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 ">Add Product</span>
              <kbd className="px-2 py-1 bg-gray-100  rounded text-xs">Ctrl + Shift + N</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 ">Add Sale</span>
              <kbd className="px-2 py-1 bg-gray-100  rounded text-xs">Ctrl + S</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 ">View Reports</span>
              <kbd className="px-2 py-1 bg-gray-100  rounded text-xs">Ctrl + R</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 ">Close Modals</span>
              <kbd className="px-2 py-1 bg-gray-100  rounded text-xs">Esc</kbd>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
} 