'use client';

import React from 'react';
import './ToastContainer.css';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  durationMs: number;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-900/95 border-emerald-500/50 text-white shadow-emerald-950/20',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
        };
      case 'error':
        return {
          bg: 'bg-rose-900/95 border-rose-500/50 text-white shadow-rose-950/20',
          icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
        };
      case 'warning':
        return {
          bg: 'bg-amber-900/95 border-amber-500/50 text-white shadow-amber-950/20',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-[#1e3932]/95 border-[#c89348]/40 text-white shadow-slate-950/20',
          icon: <Info className="w-5 h-5 text-[#e6b980] shrink-0" />,
        };
    }
  };

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const style = getToastStyle(toast.type);
        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-md shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${style.bg}`}
          >
            {style.icon}
            <div className="flex-1 text-xs sm:text-sm font-medium leading-snug">
              {toast.message}
            </div>
            <button
              onClick={() => onClose(toast.id)}
              className="text-white/70 hover:text-white p-0.5 rounded transition-colors shrink-0"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

