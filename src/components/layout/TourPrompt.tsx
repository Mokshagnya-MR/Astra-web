'use client';

import { useEffect, useState } from 'react';
import { useZenithStore } from '@/hooks/useZenithStore';

export default function TourPrompt() {
  const { bootComplete, setWebsiteTourActive } = useZenithStore();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!bootComplete) return;
    if (sessionStorage.getItem('zenith-toured') === '1') return;
    const t = setTimeout(() => setShow(true), 800);
    return () => clearTimeout(t);
  }, [bootComplete]);

  if (!show) return null;

  const accept = () => {
    setShow(false);
    sessionStorage.setItem('zenith-toured', '1');
    setWebsiteTourActive(true);
  };

  const decline = () => {
    setShow(false);
    sessionStorage.setItem('zenith-toured', '1');
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] animate-float">
      <div className="glass-card-bright border border-comet/30 rounded-xl px-6 py-4 shadow-2xl flex items-center gap-4 max-w-sm">
        <span className="text-2xl">🔭</span>
        <div className="flex-1">
          <p className="font-display text-xs text-aurora tracking-widest mb-0.5">NEW HERE?</p>
          <p className="font-mono text-[10px] text-starlight/60">Take a quick tour of all features</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <button onClick={accept}
            className="px-3 py-1.5 font-mono text-[10px] tracking-widest bg-comet/20 border border-comet/50 text-comet rounded hover:bg-comet/30 transition-all whitespace-nowrap">
            YES, SHOW ME
          </button>
          <button onClick={decline}
            className="px-3 py-1.5 font-mono text-[10px] text-starlight/30 hover:text-starlight/60 transition-colors text-center">
            SKIP
          </button>
        </div>
      </div>
    </div>
  );
}
