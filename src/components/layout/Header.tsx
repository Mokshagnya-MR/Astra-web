'use client';

import { useState, useEffect } from 'react';
import { useZenithStore } from '@/hooks/useZenithStore';
import { useCosmicAudio } from '@/hooks/useCosmicAudio';

export default function Header() {
  const [utcTime, setUtcTime] = useState('');
  const [mounted, setMounted] = useState(false);
  const { audioEnabled, setAudioEnabled } = useZenithStore();
  useCosmicAudio();

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-void/80 px-4 py-3 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <RadarIcon />
          <div>
            <h1 className="font-display text-aurora text-sm font-bold tracking-widest">
              PROJECT ZENITH
            </h1>
            <p className="hidden text-[11px] text-starlight/55 sm:block">
              Real-time sky scanner
            </p>
          </div>
        </div>

        {/* Status bar & Audio Toggle */}
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-mono sm:flex">
            <StatusDot label="ISS" color="solar" />
            <span className="h-3 w-px bg-white/10" />
            <StatusDot label="Satellites" color="aurora" />
            <span className="h-3 w-px bg-white/10" />
            <StatusDot label="Live" color="comet" />
          </div>

          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-mono tracking-wider transition-all hover:bg-white/10 cursor-pointer ${
              audioEnabled
                ? 'border-aurora/40 bg-aurora/10 text-aurora shadow-[0_0_8px_rgba(255,255,255,0.15)]'
                : 'border-white/10 bg-white/[0.02] text-starlight/40'
            }`}
          >
            {audioEnabled ? '🔊 SONAR ON' : '🔇 SONAR OFF'}
          </button>
        </div>

        {/* UTC clock */}
        <div className="hidden md:block text-right">
          <p className="font-mono text-[10px] text-starlight/40 tracking-widest">UTC TIME</p>
          <p className="font-mono text-aurora text-xs tracking-wider">
            {mounted ? utcTime : '—'}
          </p>
        </div>
      </div>
    </header>
  );
}

function StatusDot({ label, color }: { label: string; color: string }) {
  const colorMap: Record<string, string> = {
    solar: 'bg-yellow-400',
    aurora: 'bg-sky-400',
    comet: 'bg-violet-400',
  };
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${colorMap[color]} animate-pulse-slow`} />
      <span className="text-starlight/65">{label}</span>
    </div>
  );
}

function RadarIcon() {
  return (
    <div className="relative w-8 h-8 flex-shrink-0">
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <circle cx="16" cy="16" r="14" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        <circle cx="16" cy="16" r="10" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        <circle cx="16" cy="16" r="6" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
        <circle cx="16" cy="16" r="2" fill="#FFFFFF" />
        <line x1="16" y1="2" x2="16" y2="30" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
        <line x1="2" y1="16" x2="30" y2="16" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
      </svg>
    </div>
  );
}
