import React from 'react';
import { Check, Clipboard, CornerDownLeft } from 'lucide-react';

interface ToastProps {
  message: string;
  subMessage?: string;
  icon?: 'check' | 'paste' | 'copy';
}

export const Toast: React.FC<ToastProps> = ({ message, subMessage, icon = 'paste' }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-2.5 bg-neutral-900/95 backdrop-blur-xl border border-white/20 text-white rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
      <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
        {icon === 'paste' ? (
          <CornerDownLeft className="w-3.5 h-3.5" />
        ) : icon === 'check' ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Clipboard className="w-3.5 h-3.5" />
        )}
      </div>
      <div>
        <div className="text-xs font-semibold text-white">{message}</div>
        {subMessage && <div className="text-[11px] text-neutral-400">{subMessage}</div>}
      </div>
    </div>
  );
};
