'use client';

import { useZenithStore } from '@/hooks/useZenithStore';

export default function ViewToggle() {
  const { viewMode, setViewMode } = useZenithStore();

  return (
    <div className="absolute top-3 right-3 z-[400] flex glass-card-bright p-1 gap-1">
      <button
        onClick={() => setViewMode('2d')}
        className={`px-3 py-1.5 rounded font-mono text-[10px] tracking-widest transition-all ${
          viewMode === '2d'
            ? 'bg-aurora/20 text-aurora border border-aurora/40'
            : 'text-starlight/40 hover:text-starlight/70'
        }`}
      >
        🗺 2D MAP
      </button>
      <button
        onClick={() => setViewMode('3d')}
        className={`px-3 py-1.5 rounded font-mono text-[10px] tracking-widest transition-all ${
          viewMode === '3d'
            ? 'bg-aurora/20 text-aurora border border-aurora/40'
            : 'text-starlight/40 hover:text-starlight/70'
        }`}
      >
        🌐 3D GLOBE
      </button>
    </div>
  );
}
