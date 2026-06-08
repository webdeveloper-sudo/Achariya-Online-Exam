"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Check, AlertCircle, X, Loader2, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type ToastType = "success" | "error" | "loading" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  show: (type: ToastType, message: string, duration?: number) => string;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  loading: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
  dismiss: (id: string) => void;
  update: (id: string, updates: Partial<Omit<Toast, "id">>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (type: ToastType, message: string, duration?: number) => {
      const id = Math.random().toString(36).substring(2, 9);
      const defaultDuration = type === "loading" ? undefined : 5000;
      const actualDuration = duration !== undefined ? duration : defaultDuration;

      setToasts((prev) => [...prev, { id, type, message, duration: actualDuration }]);

      return id;
    },
    []
  );

  const success = useCallback((message: string, duration?: number) => show("success", message, duration), [show]);
  const error = useCallback((message: string, duration?: number) => show("error", message, duration), [show]);
  const loading = useCallback((message: string, duration?: number) => show("loading", message, duration), [show]);
  const info = useCallback((message: string, duration?: number) => show("info", message, duration), [show]);

  const update = useCallback((id: string, updates: Partial<Omit<Toast, "id">>) => {
    setToasts((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const oldType = t.type;
        const newType = updates.type ?? t.type;
        const defaultDuration = newType === "loading" ? undefined : 5000;
        
        let newDuration = updates.duration;
        if (newDuration === undefined) {
          if (oldType === "loading" && newType !== "loading") {
            newDuration = defaultDuration;
          } else {
            newDuration = t.duration;
          }
        }

        return { ...t, ...updates, duration: newDuration };
      })
    );
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, show, success, error, loading, info, dismiss, update }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  return (
    <div 
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none"
      id="toast-container"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => dismiss(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const { type, message, duration } = toast;

  useEffect(() => {
    if (duration === undefined || duration === null || duration === Infinity) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, type, duration, onClose]);

  const config = {
    success: {
      bg: "bg-white/95 border-l-4 border-l-emerald-600 border border-gray-200",
      icon: <Check className="h-5 w-5 text-emerald-600 shrink-0" />,
      title: "Success",
    },
    error: {
      bg: "bg-white/95 border-l-4 border-l-[#C72323] border border-gray-200",
      icon: <AlertCircle className="h-5 w-5 text-[#C72323] shrink-0" />,
      title: "Error",
    },
    loading: {
      bg: "bg-white/95 border-l-4 border-l-[#20407D] border border-gray-200",
      icon: <Loader2 className="h-5 w-5 text-[#20407D] shrink-0 animate-spin" />,
      title: "Processing",
    },
    info: {
      bg: "bg-white/95 border-l-4 border-l-blue-500 border border-gray-200",
      icon: <Info className="h-5 w-5 text-blue-500 shrink-0" />,
      title: "Notification",
    },
  }[type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95, x: 50 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95, x: 50, transition: { duration: 0.2 } }}
      className={`pointer-events-auto w-full p-4 flex gap-3 shadow-lg select-none rounded-none backdrop-blur-sm ${config.bg}`}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">
        {config.icon}
      </div>
      <div className="flex-1 space-y-1">
        <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 leading-none">
          {config.title}
        </h4>
        <p className="text-xs text-gray-600 leading-normal font-sans">
          {message}
        </p>
      </div>
      {type !== "loading" && (
        <button
          onClick={onClose}
          className="flex-shrink-0 h-5 w-5 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
}
