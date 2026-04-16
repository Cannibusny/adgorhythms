import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const icons = {
  success: <CheckCircle size={16} />,
  error: <XCircle size={16} />,
  info: <Info size={16} />,
  warning: <AlertTriangle size={16} />,
};

const colors = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-orange-500',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-2xl pointer-events-auto min-w-[280px] max-w-[380px] animate-slide-in ${colors[toast.type]}`}
        >
          <span className="flex-shrink-0">{icons[toast.type]}</span>
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 opacity-75 hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
