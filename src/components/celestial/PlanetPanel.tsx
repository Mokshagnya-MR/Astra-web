'use client';

import { useZenithStore } from '@/hooks/useZenithStore';
import type { CelestialBody } from '@/hooks/useZenithStore';

const PLANET_EMOJI: Record<string, string> = {
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '⛢',
  Neptune: '♆',
  Moon: '🌙',
};

const PLANET_FACTS: Record<string, string> = {
  Mercury: 'Closest planet to the Sun. A year lasts just 88 Earth days; surface temps swing −180°C to 430°C.',
  Venus: 'Hottest planet at 465°C average. Rotates backwards — a Venusian day is longer than its year.',
  Mars: 'Home to Olympus Mons, the solar system\'s tallest volcano at 21.9 km. Two tiny moons orbit it.',
  Jupiter: 'Largest planet — 1,300 Earths fit inside. Its Great Red Spot is a storm raging for 350+ years.',
  Saturn: 'Ring system spans 282,000 km but is only ~10 m thick. Saturn is less dense than water.',
  Uranus: 'Rotates on its side at 97.8°. Discovered in 1781 — the first planet found with a telescope.',
  Neptune: 'Winds reach 2,100 km/h — fastest in the solar system. Its moon Triton orbits backwards.',
  Moon: 'Drifts 3.8 cm away from Earth each year. Stabilises Earth\'s axial tilt to 23.5°.',
};

export default function PlanetPanel() {
  const { celestialBodies } = useZenithStore();
  const planets = celestialBodies
    .filter((b) => b.type === 'planet')
    .sort((a, b) => b.altitude - a.altitude);

  return (
    <div className="glass-card p-4 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-sm text-white tracking-wide">Planets & Moon</h2>
          <p className="mt-1 text-xs text-starlight/45">Sorted by height in your sky</p>
        </div>
        <span className="cosmic-badge bg-comet/10 text-comet border border-comet/20">
          {planets.filter((p) => p.visible).length} / {planets.length}
        </span>
      </div>
      <div className="panel-rule" />

      <div className="flex flex-col gap-2 overflow-y-auto">
        {planets.length === 0 ? (
          <LoadingRows count={8} />
        ) : (
          planets.map((planet) => (
            <PlanetRow key={planet.name} planet={planet} />
          ))
        )}
      </div>
    </div>
  );
}

function PlanetRow({ planet }: { planet: CelestialBody }) {
  const altPct = Math.max(0, Math.min(100, ((planet.altitude + 10) / 100) * 100));
  const fact = PLANET_FACTS[planet.name];

  return (
    <div className={`rounded-lg p-2.5 border transition-all group relative ${
      planet.visible
        ? 'border-comet/20 bg-white/[0.04] hover:border-comet/50 cursor-help'
        : 'border-starlight/5 bg-void/20 opacity-50'
    }`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-base">{PLANET_EMOJI[planet.name] ?? '✦'}</span>
          <span className="font-display text-xs text-starlight tracking-wide">{planet.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {planet.magnitude !== undefined && (
            <span className="font-mono text-[10px] text-starlight/40">mag {planet.magnitude.toFixed(1)}</span>
          )}
          <span className={`w-1.5 h-1.5 rounded-full ${planet.visible ? 'bg-green-400' : 'bg-red-500/50'}`} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1 font-mono text-[10px] text-starlight/60 mb-1.5">
        <span>Alt: <span className="text-comet">{planet.altitude.toFixed(1)}°</span></span>
        <span>Az: <span className="text-comet">{planet.azimuth.toFixed(1)}°</span></span>
      </div>
      <div className="h-0.5 rounded bg-comet/10 w-full overflow-hidden">
        <div
          className="h-full rounded bg-gradient-to-r from-comet to-aurora transition-all duration-1000"
          style={{ width: `${altPct}%` }}
        />
      </div>

      {/* Educational tooltip on hover */}
      {fact && planet.visible && (
        <div className="absolute left-0 right-0 bottom-full mb-2 z-20 hidden group-hover:block pointer-events-none">
          <div className="glass-card rounded-lg px-3 py-2 text-[10px] font-mono text-starlight/75 leading-relaxed shadow-2xl border border-comet/25">
            {fact}
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-16 rounded-lg shimmer" />
      ))}
    </>
  );
}
