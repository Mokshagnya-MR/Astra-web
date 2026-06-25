'use client';

import { useState, useEffect } from 'react';

interface SpaceWeatherData {
  windSpeed: number;
  windDensity: number;
  kpIndex: number;
  kpStatus: string;
  solarFlareChance: number;
  updatedAt: string;
  fallback?: boolean;
}

export default function SpaceWeatherPanel() {
  const [data, setData] = useState<SpaceWeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/spaceweather');
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
      }
    } catch (err) {
      console.error('Failed to fetch space weather telemetry', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 120000); // refresh every 2 mins
    return () => clearInterval(interval);
  }, []);

  // Determine indicator pulses based on G-scale
  const getPulseClass = (kp: number) => {
    if (kp < 4) return 'bg-starlight/40 animate-pulse-slow';
    if (kp === 4) return 'bg-starlight/60 animate-pulse';
    return 'bg-aurora animate-ping'; // Fast blinking for solar storm events
  };

  return (
    <div className="glass-card p-4 flex flex-col gap-3 h-full justify-between">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">☀️</span>
          <h2 className="font-display text-xs text-aurora tracking-widest">SPACE WEATHER</h2>
        </div>
        {data && (
          <span className={`cosmic-badge ${data.kpIndex >= 5 ? 'bg-aurora/20 text-aurora' : 'bg-starlight/10 text-starlight/50'}`}>
            {data.kpStatus}
          </span>
        )}
      </div>

      <div className="panel-rule" />

      {loading ? (
        <div className="space-y-2 py-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 rounded shimmer" />
          ))}
        </div>
      ) : data ? (
        <div className="flex flex-col gap-4 flex-1 justify-center">
          {/* Main Gauges Row */}
          <div className="grid grid-cols-2 gap-3 items-center">
            {/* Speed Dial SVG */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span className="font-mono text-[9px] text-starlight/40 tracking-wider">SOLAR WIND SPEED</span>
              <div className="relative w-24 h-24">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {/* Gauge track */}
                  <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="transparent" />
                  {/* Gauge fill */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="var(--starlight)"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={251.2}
                    // Map speed (300 to 800) to dashoffset (251.2 to 0)
                    strokeDashoffset={251.2 - ((Math.min(800, Math.max(300, data.windSpeed)) - 300) / 500) * 180}
                    strokeLinecap="round"
                    className="opacity-70 transition-all duration-1000"
                  />
                </svg>
                {/* Gauge Reading */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-1.5">
                  <span className="font-mono text-sm font-bold text-aurora">{Math.round(data.windSpeed)}</span>
                  <span className="font-mono text-[8px] text-starlight/40">KM/S</span>
                </div>
              </div>
            </div>

            {/* Flare chance Gauge */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span className="font-mono text-[9px] text-starlight/40 tracking-wider">SOLAR FLARE CHANCE</span>
              <div className="relative w-24 h-24">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="transparent" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="var(--starlight)"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (data.solarFlareChance / 100) * 180}
                    strokeLinecap="round"
                    className="opacity-40 transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-1.5">
                  <span className="font-mono text-sm font-bold text-aurora">{data.solarFlareChance}%</span>
                  <span className="font-mono text-[8px] text-starlight/40">PROB</span>
                </div>
              </div>
            </div>
          </div>

          {/* Geomagnetic Storm Kp Scale Grid */}
          <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-mono text-[9px] text-starlight/40 tracking-widest">GEOMAGNETIC SCALE</span>
              <span className="font-mono text-[10px] text-aurora font-bold">Kp {data.kpIndex}</span>
            </div>
            {/* 9 columns representing Kp indexes */}
            <div className="grid grid-cols-9 gap-1 h-3 items-end">
              {Array.from({ length: 9 }).map((_, i) => {
                const active = i < data.kpIndex;
                return (
                  <div
                    key={i}
                    className={`h-full rounded-sm transition-all duration-500 ${
                      active
                        ? getPulseClass(data.kpIndex)
                        : 'bg-white/[0.04]'
                    }`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between font-mono text-[8px] text-starlight/30 mt-1">
              <span>Kp0 (QUIET)</span>
              <span>Kp9 (EXTREME)</span>
            </div>
          </div>

          {/* Telemetry Footer Stream */}
          <div className="data-stream flex justify-between items-center text-[9px]">
            <span>PLASMA DENSITY: <span className="text-aurora">{data.windDensity} p/cm³</span></span>
            <span className="text-starlight/20">|</span>
            <span>UPDATED: <span className="text-comet">{data.updatedAt.slice(11, 19)} UTC</span></span>
          </div>
        </div>
      ) : (
        <p className="font-mono text-xs text-starlight/30 py-4 text-center">TELEMETRY OFFLINE</p>
      )}
    </div>
  );
}
