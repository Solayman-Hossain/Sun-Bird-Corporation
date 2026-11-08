'use client';

import React, { createContext, useContext, useState, useCallback, useId } from 'react';
import { ToastContainer, ToastMessage, ToastType } from '../components/ToastContainer';

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
  removeToast: (id: string) => void;
  toasts: ToastMessage[];
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', durationMs = 3500) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastMessage = { id, message, type, durationMs };

      setToasts((prev) => [...prev, newToast]);

      // Haptic feedback trigger on mobile devices if supported
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          if (type === 'success') {
            navigator.vibrate?.([40, 30, 40]);
          } else if (type === 'error') {
            navigator.vibrate?.([80, 50, 80]);
          }
        } catch {
          // ignore vibration errors
        }
      }

      if (durationMs > 0) {
        setTimeout(() => {
          removeToast(id);
        }, durationMs);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast, toasts }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

