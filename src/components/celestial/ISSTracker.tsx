'use client';

import { useZenithStore } from '@/hooks/useZenithStore';
import { useEffect, useState } from 'react';
import SpeedGauge from './SpeedGauge';

export default function ISSTracker() {
  const { issPosition } = useZenithStore();
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 600);
    return () => clearTimeout(t);
  }, [issPosition?.timestamp]);

  return (
    <div className={`glass-card p-4 transition-all duration-300 ${pulse ? 'border-yellow-400/40' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🛸</span>
          <h2 className="font-display text-xs text-solar tracking-widest">ISS TRACKER</h2>
        </div>
        <span className="blip" />
      </div>
      <div className="panel-rule mb-3" />

      {issPosition ? (
        <div className="flex flex-col items-center gap-3">
          <SpeedGauge velocityKmS={issPosition.velocity} maxKmS={10} />
          <div className="data-stream space-y-1 w-full">
            <Row label="LAT" value={`${issPosition.latitude.toFixed(4)}°`} color="solar" />
            <Row label="LNG" value={`${issPosition.longitude.toFixed(4)}°`} color="solar" />
            <Row label="ALT" value={`${issPosition.altitude} km`} color="aurora" />
            <Row label="UPD" value={new Date(issPosition.timestamp * 1000).toISOString().slice(11, 19) + ' UTC'} color="comet" />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 rounded shimmer" />
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    solar: 'text-yellow-400',
    aurora: 'text-sky-400',
    comet: 'text-violet-400',
  };
  return (
    <div className="flex justify-between">
      <span className="text-starlight/40">{label}</span>
      <span className={`${colorMap[color]} font-medium`}>{value}</span>
    </div>
  );
}
