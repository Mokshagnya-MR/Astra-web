'use client';

import { useZenithStore } from '@/hooks/useZenithStore';
import { TOUR_CONSTELLATIONS } from '@/components/map/Globe3D';

export default function SkyTourPanel() {
  const { tourActive, tourIndex, setTourActive, setTourIndex, setViewMode } = useZenithStore();
  const current = TOUR_CONSTELLATIONS[tourIndex];

  const startTour = () => {
    setViewMode('3d');
    setTourIndex(0);
    setTourActive(true);
  };

  const next = () => {
    if (tourIndex < TOUR_CONSTELLATIONS.length - 1) {
      setTourIndex(tourIndex + 1);
    } else {
      setTourActive(false);
    }
  };

  const prev = () => {
    if (tourIndex > 0) setTourIndex(tourIndex - 1);
  };

  return (
    <div className="glass-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔭</span>
          <h2 className="font-display text-xs text-comet tracking-widest">GUIDED SKY TOUR</h2>
        </div>
        {tourActive && (
          <span className="cosmic-badge bg-comet/20 text-comet border border-comet/30 animate-pulse">
            LIVE
          </span>
        )}
      </div>
      <div className="panel-rule" />

      {!tourActive ? (
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[11px] text-starlight/50 leading-relaxed">
            Cinematic camera tour of {TOUR_CONSTELLATIONS.length} major constellations on the 3D globe — each with a description.
          </p>
          <div className="flex flex-col gap-1.5">
            {TOUR_CONSTELLATIONS.map((c, i) => (
              <div key={i} className="flex items-center gap-2 font-mono text-[10px] text-starlight/40">
                <span className="text-comet/60 w-4">{String(i + 1).padStart(2, '0')}</span>
                <span>{c.name}</span>
              </div>
            ))}
          </div>
          <button
            onClick={startTour}
            className="w-full py-2.5 rounded font-display text-xs tracking-widest bg-comet/10 border border-comet/40 text-comet hover:bg-comet/20 transition-all hover:shadow-[0_0_16px_rgba(167,139,250,0.3)]"
          >
            ▶ START TOUR
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg p-3 border border-comet/25 bg-comet/5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-display text-sm text-starlight">{current?.name}</span>
              <span className="font-mono text-[10px] text-comet/60">
                {tourIndex + 1} / {TOUR_CONSTELLATIONS.length}
              </span>
            </div>
            <p className="font-mono text-[10px] text-starlight/50 leading-relaxed">
              {current?.desc}
            </p>
          </div>

          {/* Progress */}
          <div className="h-0.5 rounded bg-comet/10 w-full">
            <div
              className="h-full rounded bg-comet transition-all duration-500"
              style={{ width: `${((tourIndex + 1) / TOUR_CONSTELLATIONS.length) * 100}%` }}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={prev}
              disabled={tourIndex === 0}
              className="flex-1 py-2 rounded font-mono text-[10px] tracking-widest border border-starlight/10 text-starlight/40 hover:border-comet/30 hover:text-comet disabled:opacity-30 transition-all"
            >
              ◀ PREV
            </button>
            <button
              onClick={next}
              className="flex-1 py-2 rounded font-mono text-[10px] tracking-widest bg-comet/10 border border-comet/40 text-comet hover:bg-comet/20 transition-all"
            >
              {tourIndex < TOUR_CONSTELLATIONS.length - 1 ? 'NEXT ▶' : 'END ✓'}
            </button>
          </div>

          <button
            onClick={() => setTourActive(false)}
            className="font-mono text-[9px] text-starlight/30 hover:text-red-400 transition-colors"
          >
            ✕ EXIT TOUR
          </button>
        </div>
      )}
    </div>
  );
}
