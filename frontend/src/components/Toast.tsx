/** Toast 通知组件 */
import { createPortal } from "react-dom";
import { CheckCircle, AlertCircle, XCircle, Info, X } from "lucide-react";
import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const toastIcons = {
  success: <CheckCircle className="w-5 h-5 text-success-500" />,
  error: <XCircle className="w-5 h-5 text-error-500" />,
  warning: <AlertCircle className="w-5 h-5 text-warning-500" />,
  info: <Info className="w-5 h-5 text-primary-500" />,
};

function ToastItem({ toast, onRemove }: ToastItemProps) {
  useEffect(() => {
    const duration = toast.duration ?? 3000;
    const timer = setTimeout(() => onRemove(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const getBgStyle = () => {
    const styles = {
      success: { light: "rgb(240 253 244)", dark: "rgba(5, 46, 22, 0.3)" },
      error: { light: "rgb(254 242 242)", dark: "rgba(69, 10, 10, 0.3)" },
      warning: { light: "rgb(255 251 235)", dark: "rgba(69, 10, 10, 0.3)" },
      info: { light: "rgb(238 242 255)", dark: "rgba(30, 27, 75, 0.3)" },
    };
    return styles[toast.type];
  };

  const getBorderColor = () => {
    const colors = {
      success: "rgb(34 197 94)",
      error: "rgb(239 68 68)",
      warning: "rgb(245 158 11)",
      info: "rgb(79 70 229)",
    };
    return colors[toast.type];
  };

  const bgStyle = getBgStyle();
  const borderColor = getBorderColor();

  return (
    <div
      className="flex items-start gap-3 p-4 rounded-xl border-l-4 shadow-elevation-2 toast-enter min-w-[320px] max-w-md"
      style={{
        backgroundColor: document.documentElement.classList.contains('dark')
          ? bgStyle.dark
          : bgStyle.light,
        borderLeftColor: borderColor,
      }}
    >
      <div className="flex-shrink-0 mt-0.5">
        {toastIcons[toast.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>,
    document.body
  );
}

// Toast Hook
let toastId = 0;
const listeners = new Set<(toasts: Toast[]) => void>;
let toasts: Toast[] = [];

function notifyListeners() {
  listeners.forEach((listener) => listener([...toasts]));
}

export function toast(message: string, type: ToastType = "info", duration?: number) {
  const id = `toast-${++toastId}`;
  toasts.push({ id, message, type, duration });
  notifyListeners();
  return id;
}

export function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notifyListeners();
}

export function useToast() {
  const [localToasts, setLocalToasts] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.add(setLocalToasts);
    setLocalToasts([...toasts]);
    return () => {
      listeners.delete(setLocalToasts);
    };
  }, []);

  return {
    toasts: localToasts,
    addToast: toast,
    removeToast,
  };
}
