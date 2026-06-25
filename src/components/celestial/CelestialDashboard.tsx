'use client';

import { useZenithStore } from '@/hooks/useZenithStore';
import { useCelestialData } from '@/hooks/useCelestialData';
import { useEffect, useRef } from 'react';

export default function CelestialDashboard() {
  const { coordinates, celestialBodies } = useZenithStore();
  useCelestialData(coordinates);

  const visible = celestialBodies.filter((b) => b.visible);
  const planets = visible.filter((b) => b.type === 'planet');
  const constellations = visible.filter((b) => b.type === 'constellation');

  return (
    <div className="glass-card p-4 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-sm text-white tracking-wide">Sky Radar</h2>
          <p className="mt-1 text-xs text-starlight/45">Objects currently above the horizon</p>
        </div>
        <span className="cosmic-badge bg-aurora/10 text-aurora border border-aurora/20">
          {visible.length} VISIBLE
        </span>
      </div>
      <div className="panel-rule" />

      {/* Radar visualization */}
      <div className="flex min-h-[340px] flex-1 items-center justify-center">
        <RadarCanvas bodies={visible} />
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <StatBox label="Planets" value={planets.length} color="aurora" />
        <StatBox label="Constellations" value={constellations.length} color="comet" />
        <StatBox label="Overhead" value={celestialBodies.filter((b) => b.altitude > 60).length} color="solar" />
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    aurora: 'text-sky-400',
    comet: 'text-violet-400',
    solar: 'text-neutral-300',
  };
  const borderMap: Record<string, string> = {
    aurora: 'border-sky-400/20',
    comet: 'border-violet-400/20',
    solar: 'border-neutral-300/20',
  };
  return (
    <div className={`rounded-lg border ${borderMap[color]} bg-white/[0.035] py-3 px-2`}>
      <div className={`font-display text-xl font-bold ${colorMap[color]}`}>{value}</div>
      <div className="font-mono text-[9px] text-starlight/45 tracking-widest mt-0.5 uppercase">{label}</div>
    </div>
  );
}

// Canvas-based radar chart
function RadarCanvas({ bodies }: { bodies: Array<{ name: string; altitude: number; azimuth: number; type: string }> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bodiesRef = useRef(bodies);

  useEffect(() => {
    bodiesRef.current = bodies;
  }, [bodies]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let cssSize = 320;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      cssSize = Math.max(280, Math.floor(Math.min(rect.width, rect.height)));
      canvas.width = Math.floor(cssSize * dpr);
      canvas.height = Math.floor(cssSize * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const activeBodies = bodiesRef.current;
      const W = cssSize;
      const H = cssSize;
      const cx = W / 2;
      const cy = H / 2;
      const R = Math.min(cx, cy) - 18;

      ctx.clearRect(0, 0, W, H);

      const background = ctx.createRadialGradient(cx, cy, R * 0.05, cx, cy, R);
      background.addColorStop(0, 'rgba(24, 54, 105, 0.72)');
      background.addColorStop(0.45, 'rgba(9, 18, 40, 0.9)');
      background.addColorStop(1, 'rgba(3, 6, 14, 0.96)');
      ctx.fillStyle = background;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      [1, 2 / 3, 1 / 3].forEach((frac, index) => {
        ctx.strokeStyle = `rgba(79,195,247,${0.16 + index * 0.08})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, R * frac, 0, Math.PI * 2);
        ctx.stroke();
      });

      for (let azimuth = 0; azimuth < 360; azimuth += 45) {
        const angle = (azimuth * Math.PI) / 180 - Math.PI / 2;
        ctx.strokeStyle = azimuth % 90 === 0 ? 'rgba(79,195,247,0.2)' : 'rgba(79,195,247,0.08)';
        ctx.lineWidth = azimuth % 90 === 0 ? 1 : 0.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(79,195,247,0.34)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(226,238,255,0.74)';
      ctx.font = '600 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('N', cx, cy - R + 18);
      ctx.fillText('S', cx, cy + R - 10);
      ctx.textAlign = 'right';
      ctx.fillText('W', cx - R + 16, cy + 4);
      ctx.textAlign = 'left';
      ctx.fillText('E', cx + R - 16, cy + 4);

      const sweepAngle = ((Date.now() / 1000) * (Math.PI / 2)) % (Math.PI * 2) - Math.PI / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(sweepAngle);
      const sweepGrad = ctx.createLinearGradient(0, -R, 0, 0);
      sweepGrad.addColorStop(0, 'rgba(79,195,247,0)');
      sweepGrad.addColorStop(0.72, 'rgba(79,195,247,0.08)');
      sweepGrad.addColorStop(1, 'rgba(79,195,247,0.36)');
      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R, -Math.PI / 2, -Math.PI / 2 + Math.PI / 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      const colorMap: Record<string, string> = {
        planet: '#4FC3F7',
        constellation: '#A78BFA',
        iss: '#F59E0B',
        satellite: '#4ADE80',
        star: '#FDE68A',
      };

      activeBodies.forEach((body) => {
        if (body.altitude < 0) return;
        const radius = R * (1 - body.altitude / 90);
        const azimuth = (body.azimuth * Math.PI) / 180 - Math.PI / 2;
        const x = cx + radius * Math.cos(azimuth);
        const y = cy + radius * Math.sin(azimuth);
        const color = colorMap[body.type] ?? '#fff';
        const dotRadius = body.type === 'planet' ? 4.2 : 3.2;

        const glow = ctx.createRadialGradient(x, y, 0, x, y, 13);
        glow.addColorStop(0, color);
        glow.addColorStop(0.28, color);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 13, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(79,195,247,0.68)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, dotRadius + 1.5, 0, Math.PI * 2);
        ctx.stroke();

        if (body.altitude > 8) {
          ctx.fillStyle = 'rgba(226,238,255,0.82)';
          ctx.font = '500 10px Inter, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(body.name.slice(0, 12), x + 8, y - 6);
        }
      });

      ctx.fillStyle = 'rgba(200,216,248,0.42)';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('90° overhead', cx, cy + 4);

      rafId = requestAnimationFrame(draw);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    rafId = requestAnimationFrame(draw);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="aspect-square w-full max-w-[360px] rounded-full border border-aurora/25 shadow-[0_0_40px_rgba(79,195,247,0.12)]"
    />
  );
}
