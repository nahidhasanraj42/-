import React, { useState, useEffect } from 'react';
import { backNavigation } from '../utils/backNavigation';
import { LogOut, ArrowLeft } from 'lucide-react';

export const DeviceBackExitToast: React.FC = () => {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('আরেকবার ব্যাক চাপলে অ্যাপ থেকে বের হবেন');

  useEffect(() => {
    // Initialize back navigation manager
    backNavigation.init();

    const unsubscribe = backNavigation.onExitToast((isVisible, msg) => {
      setShow(isVisible);
      if (msg) setMessage(msg);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce transition-all duration-300 pointer-events-none"
    >
      <div className="bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-3 backdrop-blur-md">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
          <ArrowLeft className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <p className="text-xs font-bold text-white font-bengali">
            {message}
          </p>
          <p className="text-[10px] text-slate-400 font-bengali">
            (Press back again within 2.5s to exit)
          </p>
        </div>
      </div>
    </div>
  );
};
