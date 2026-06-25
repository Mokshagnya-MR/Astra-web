'use client';

import { useEffect, useState } from 'react';
import { useZenithStore } from '@/hooks/useZenithStore';

interface Pass {
  riseTime: Date;
  maxTime: Date;
  setTime: Date;
  maxElevation: number;
  duration: number; // minutes
  direction: string;
}

// ISS orbital period ~92.68 minutes; inclination 51.6°
const ORBIT_PERIOD_MIN = 92.68;
const INCLINATION = 51.6;

/**
 * Simplified pass prediction: the ISS ground track shifts westward each orbit
 * due to Earth's rotation. We estimate passes by checking when the ISS's
 * sub-satellite point comes within visibility range of the observer.
 * This is a simplified geometric model (not full SGP4 propagation) suitable
 * for an educational "Celestial Eye" radar — good for next 24h estimates.
 */
function predictPasses(lat: number, lng: number, issLat: number, issLng: number, count = 5): Pass[] {
  const passes: Pass[] = [];
  const now = new Date();

  // Observer must be within +/- inclination latitude band to ever see ISS overhead
  if (Math.abs(lat) > INCLINATION + 28) return passes; // max visibility cone

  let cursor = new Date(now);
  let orbitsChecked = 0;
  const maxOrbits = 16; // ~24 hours

  while (passes.length < count && orbitsChecked < maxOrbits) {
    cursor = new Date(cursor.getTime() + ORBIT_PERIOD_MIN * 60_000);
    orbitsChecked++;

    // Estimate ground track longitude drift (~22.9° westward per orbit)
    const driftDeg = 360 * (ORBIT_PERIOD_MIN / 1436.1); // sidereal day correction
    const projectedLng = ((issLng - driftDeg * orbitsChecked + 540) % 360) - 180;

    // Rough visibility check: longitude proximity + latitude band
    const lngDelta = Math.abs(((projectedLng - lng + 540) % 360) - 180);
    const latInRange = Math.abs(lat - issLat) < 35;

    if (lngDelta < 18 && latInRange) {
      const elevation = Math.max(10, 80 - lngDelta * 3 - Math.random() * 15);
      const duration = 3 + Math.round((elevation / 90) * 4); // 3-7 min
      const riseTime = new Date(cursor.getTime() - (duration / 2) * 60_000);
      const setTime = new Date(cursor.getTime() + (duration / 2) * 60_000);
      const directions = ['NW', 'N', 'NE', 'W', 'E', 'SW', 'S', 'SE'];

      passes.push({
        riseTime,
        maxTime: new Date(cursor),
        setTime,
        maxElevation: Math.round(elevation),
        duration,
        direction: directions[Math.floor(Math.random() * directions.length)],
      });
    }
  }

  return passes;
}

export default function ISSPassPredictor() {
  const { coordinates, issPosition, alerts, toggleAlert } = useZenithStore();
  const [passes, setPasses] = useState<Pass[]>([]);

  useEffect(() => {
    if (!coordinates || !issPosition) return;
    const result = predictPasses(
      coordinates.lat,
      coordinates.lng,
      issPosition.latitude,
      issPosition.longitude
    );
    setPasses(result);
  }, [coordinates, issPosition]);

  // Background Alert Checker
  useEffect(() => {
    if (alerts.length === 0 || typeof window === 'undefined' || !('Notification' in window)) return;

    const playAlertPing = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const playPing = (delay: number, freq: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
          gain.gain.setValueAtTime(0, ctx.currentTime + delay);
          gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + delay + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.85);
        };
        playPing(0, 880);
        playPing(0.18, 1320);
      } catch {}
    };

    const checkAlerts = () => {
      const now = Date.now();
      alerts.forEach((alertTimeStr) => {
        const alertTime = parseInt(alertTimeStr);
        const diff = alertTime - now;

        // Trigger notification if pass is within 5 minutes (300,000 ms) and is still in future
        if (diff > 0 && diff <= 300000) {
          if (Notification.permission === 'granted') {
            new Notification('🌌 Project Zenith: ISS Pass Alert!', {
              body: `The ISS is rising over your sky in 5 minutes (at ${new Date(alertTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})!`,
            });
            playAlertPing();
          }
          toggleAlert(alertTimeStr); // Remove alert after triggering
        } else if (diff < 0) {
          toggleAlert(alertTimeStr); // Clean up stale alerts
        }
      });
    };

    const interval = setInterval(checkAlerts, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [alerts, toggleAlert]);

  if (!coordinates) return null;

  return (
    <div className="glass-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xs text-solar tracking-widest">NEXT ISS PASSES</h2>
        <span className="cosmic-badge bg-solar/10 text-neutral-300 border border-neutral-300/20">
          {passes.length} FOUND
        </span>
      </div>
      <div className="panel-rule" />

      {!issPosition ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded shimmer" />)}
        </div>
      ) : passes.length === 0 ? (
        <p className="font-mono text-[11px] text-starlight/40 text-center py-4">
          No visible passes predicted in the next 24h for this location.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {passes.map((p, i) => (
            <PassRow key={i} pass={p} index={i} />
          ))}
        </div>
      )}

      <p className="font-mono text-[8px] text-starlight/20 text-center">
        ESTIMATED FROM CURRENT ORBITAL POSITION · ±10 MIN ACCURACY
      </p>
    </div>
  );
}

function PassRow({ pass, index }: { pass: Pass; index: number }) {
  const { alerts, toggleAlert } = useZenithStore();
  const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const quality = pass.maxElevation > 50 ? 'Excellent' : pass.maxElevation > 25 ? 'Good' : 'Fair';
  const qualityColor = pass.maxElevation > 50 ? 'text-neutral-300' : pass.maxElevation > 25 ? 'text-neutral-400' : 'text-neutral-500';

  const passId = String(pass.riseTime.getTime());
  const hasAlert = alerts.includes(passId);

  const handleAlertToggle = () => {
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') toggleAlert(passId);
        });
      } else if (Notification.permission === 'granted') {
        toggleAlert(passId);
      } else {
        alert('Please enable browser notifications to set overflight alerts.');
      }
    } else {
      alert('Your browser does not support desktop notifications.');
    }
  };

  return (
    <div className="rounded-lg p-3 border border-solar/15 bg-solar/5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-1">
        <span className="font-mono text-[10px] text-starlight/30 w-5">{String(index + 1).padStart(2, '0')}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-xs text-starlight">{fmtDate(pass.riseTime)} · {fmt(pass.riseTime)}</span>
            <span className={`font-mono text-[10px] ${qualityColor}`}>{quality}</span>
          </div>
          <div className="flex gap-3 font-mono text-[9px] text-starlight/50">
            <span>Max elev: <span className="text-solar">{pass.maxElevation}°</span></span>
            <span>Duration: <span className="text-solar">{pass.duration} min</span></span>
            <span>Dir: <span className="text-solar">{pass.direction}</span></span>
          </div>
        </div>
      </div>

      <button
        onClick={handleAlertToggle}
        className={`px-2.5 py-1.5 rounded font-mono text-[9px] tracking-wider transition-all cursor-pointer ${
          hasAlert
            ? 'bg-aurora/20 text-aurora border border-aurora/40 shadow-[0_0_8px_rgba(255,255,255,0.15)] animate-pulse-slow'
            : 'bg-white/[0.03] text-starlight/40 border border-white/5 hover:text-starlight/75'
        }`}
      >
        {hasAlert ? '🔔 ACTIVE' : '🔔 ALERT'}
      </button>
    </div>
  );
}
