import React from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { useMineGuard } from '../context/MineGuardContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useMineGuard();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isCritical = toast.type === 'critical';
        const isWarning = toast.type === 'warning';
        const isSuccess = toast.type === 'success';

        let borderColor = 'border-mine-info/40';
        let bgColor = 'bg-mine-card/95';
        let icon = <Info className="w-5 h-5 text-mine-info shrink-0 mt-0.5" />;

        if (isCritical) {
          borderColor = 'border-mine-critical/80';
          bgColor = 'bg-[#1e1115]/95';
          icon = <ShieldAlert className="w-5 h-5 text-mine-critical shrink-0 mt-0.5 animate-bounce" />;
        } else if (isWarning) {
          borderColor = 'border-mine-warning/80';
          bgColor = 'bg-[#1f1b13]/95';
          icon = <AlertTriangle className="w-5 h-5 text-mine-warning shrink-0 mt-0.5" />;
        } else if (isSuccess) {
          borderColor = 'border-mine-success/60';
          bgColor = 'bg-[#0f1d17]/95';
          icon = <CheckCircle2 className="w-5 h-5 text-mine-success shrink-0 mt-0.5" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border ${borderColor} ${bgColor} shadow-2xl backdrop-blur-md text-xs transition-all duration-300 animate-in slide-in-from-bottom-5`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-mine-textPrimary text-xs">{toast.title}</h4>
              <p className="text-mine-textSecondary text-[11px] mt-0.5 leading-relaxed">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-mine-textSecondary hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
