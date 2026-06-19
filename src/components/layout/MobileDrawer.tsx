'use client';

import { useState, useRef, ReactNode } from 'react';

interface MobileDrawerProps {
  children: ReactNode;
  title?: string;
}

export default function MobileDrawer({ children, title = 'CELESTIAL DATA' }: MobileDrawerProps) {
  const [expanded, setExpanded] = useState(false);
  const startY = useRef<number | null>(null);
  const dragDelta = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    dragDelta.current = e.touches[0].clientY - startY.current;
  };

  const handleTouchEnd = () => {
    if (dragDelta.current < -40) setExpanded(true);
    if (dragDelta.current > 40) setExpanded(false);
    startY.current = null;
    dragDelta.current = 0;
  };

  return (
    <div className="lg:hidden">
      {/* Backdrop when expanded */}
      {expanded && (
        <div
          className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        />
      )}

      <div
        className={`fixed left-0 right-0 z-40 glass-card-bright rounded-t-2xl rounded-b-none border-b-0 transition-all duration-300 ease-out ${
          expanded ? 'bottom-0 h-[80vh]' : 'bottom-0 h-24'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle / header — always tappable to toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex flex-col items-center pt-2.5 pb-3 px-4"
        >
          <div className="w-10 h-1 rounded-full bg-starlight/20 mb-2.5" />
          <div className="w-full flex items-center justify-between">
            <span className="font-display text-[11px] text-aurora tracking-widest">{title}</span>
            <span className="font-mono text-[10px] text-starlight/40">
              {expanded ? '▼ COLLAPSE' : '▲ EXPAND'}
            </span>
          </div>
        </button>

        {/* Scrollable content */}
        <div
          className={`overflow-y-auto px-4 pb-8 transition-opacity duration-200 ${
            expanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ maxHeight: 'calc(80vh - 64px)' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
