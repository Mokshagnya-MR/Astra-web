'use client';

import { useState, useEffect } from 'react';
import { useZenithStore } from '@/hooks/useZenithStore';

const NAV_SECTIONS = [
  { id: 'section-map',          label: 'MAP' },
  { id: 'section-radar',        label: 'RADAR' },
  { id: 'section-weather',      label: 'WEATHER' },
  { id: 'section-planisphere',  label: 'SKY VIEW' },
  { id: 'section-events',       label: 'EVENTS' },
  { id: 'section-ai',           label: 'AI ORACLE' },
];

export default function Header() {
  const [utcTime, setUtcTime] = useState('');
  const [mounted, setMounted] = useState(false);
  const { setWebsiteTourActive, websiteTourActive } = useZenithStore();

  useEffect(() => {
    setMounted(true);
    const tick = () => setUtcTime(new Date().toUTCString().replace('GMT', 'UTC'));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card rounded-none border-b border-aurora/20 px-4 py-2">
      <div className="container mx-auto flex items-center justify-between gap-2">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <RadarIcon />
          <div>
            <h1 className="font-display text-aurora text-xs font-bold tracking-widest glow-text">PROJECT ZENITH</h1>
            <p className="font-mono text-starlight/40 text-[9px] tracking-widest hidden sm:block">THE CELESTIAL EYE</p>
          </div>
        </div>

        {/* Jump nav — hidden on mobile */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className="px-2.5 py-1 font-mono text-[9px] tracking-widest text-starlight/40 hover:text-aurora hover:bg-aurora/10 rounded transition-all"
            >
              {s.label}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Tour button */}
          {!websiteTourActive && (
            <button
              onClick={() => setWebsiteTourActive(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 font-mono text-[9px] tracking-widest text-comet border border-comet/30 rounded hover:bg-comet/10 transition-all"
            >
              ❓ TOUR
            </button>
          )}
          {/* Status dots */}
          <div className="hidden md:flex items-center gap-3 text-[9px] font-mono">
            <StatusDot label="ISS" color="bg-yellow-400" />
            <StatusDot label="SAT" color="bg-sky-400" />
          </div>
          {/* Clock */}
          <div className="hidden xl:block text-right">
            <p className="font-mono text-[9px] text-starlight/30 tracking-widest">UTC</p>
            <p className="font-mono text-aurora text-[10px]">{mounted ? utcTime.slice(17, 25) : '—'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatusDot({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className={`w-1.5 h-1.5 rounded-full ${color} animate-pulse`} />
      <span className="text-starlight/50">{label}</span>
    </div>
  );
}

function RadarIcon() {
  return (
    <div className="w-7 h-7 flex-shrink-0">
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <circle cx="16" cy="16" r="14" stroke="rgba(79,195,247,0.3)" strokeWidth="1" />
        <circle cx="16" cy="16" r="10" stroke="rgba(79,195,247,0.4)" strokeWidth="1" />
        <circle cx="16" cy="16" r="6" stroke="rgba(79,195,247,0.5)" strokeWidth="1" />
        <circle cx="16" cy="16" r="2" fill="#4FC3F7" />
        <line x1="16" y1="2" x2="16" y2="30" stroke="rgba(79,195,247,0.2)" strokeWidth="0.5" />
        <line x1="2" y1="16" x2="30" y2="16" stroke="rgba(79,195,247,0.2)" strokeWidth="0.5" />
      </svg>
    </div>
  );
}
