'use client';

import { useRef, useEffect } from 'react';
import { useZenithStore } from '@/hooks/useZenithStore';

/**
 * Renders a planisphere-style "dome" view: the entire visible sky projected
 * onto a circle, with the zenith (straight up) at the center and the
 * horizon at the rim — exactly what an astronomer's all-sky chart looks like.
 */
export default function SkyPlanisphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { celestialBodies, issPosition, coordinates } = useZenithStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(cx, cy) - 24;

    ctx.clearRect(0, 0, W, H);

    // Dome background — radial gradient from zenith (dark) to horizon (lighter blue haze)
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    bgGrad.addColorStop(0, 'rgba(4,6,15,0.95)');
    bgGrad.addColorStop(0.7, 'rgba(13,27,62,0.9)');
    bgGrad.addColorStop(1, 'rgba(26,58,110,0.6)');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // Altitude rings (every 15°: 90,75,60,45,30,15,0)
    for (let alt = 75; alt >= 0; alt -= 15) {
      const r = R * (1 - alt / 90);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(79,195,247,0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = 'rgba(200,216,248,0.25)';
      ctx.font = '8px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${alt}°`, cx + 3, cy - r + 9);
    }

    // Horizon ring (bold)
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(79,195,247,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Azimuth spokes (every 30°) + cardinal labels
    const cardinals: Record<number, string> = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };
    for (let az = 0; az < 360; az += 30) {
      const a = (az * Math.PI) / 180 - Math.PI / 2;
      const x2 = cx + R * Math.cos(a);
      const y2 = cy + R * Math.sin(a);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(79,195,247,0.08)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      const label = cardinals[az];
      if (label) {
        const lx = cx + (R + 14) * Math.cos(a);
        const ly = cy + (R + 14) * Math.sin(a);
        ctx.fillStyle = '#4FC3F7';
        ctx.font = 'bold 11px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, lx, ly);
      }
    }

    // Zenith marker (center)
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.strokeStyle = '#4FC3F7';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(200,216,248,0.3)';
    ctx.font = '7px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ZENITH', cx, cy + 14);

    // Plot celestial bodies (only those above horizon)
    const colorMap: Record<string, string> = {
      planet: '#4FC3F7',
      constellation: '#A78BFA',
      iss: '#F59E0B',
      satellite: '#4ADE80',
      star: '#FDE68A',
      dso: '#f472b6',
    };

    const sizeMap: Record<string, number> = {
      planet: 4,
      constellation: 2.5,
      iss: 5,
      satellite: 2,
      star: 2,
      dso: 3.5,
    };

    const allBodies = [...celestialBodies];
    if (issPosition && coordinates) {
      // Compute rough alt/az of ISS relative to observer (simplified)
      const dLat = issPosition.latitude - coordinates.lat;
      const dLng = issPosition.longitude - coordinates.lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      const altitude = Math.max(-10, 90 - dist * 8); // rough proxy
      const azimuth = ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;
      allBodies.push({
        name: 'ISS',
        type: 'iss',
        altitude,
        azimuth,
        visible: altitude > 0,
      });
    }

    allBodies.forEach((body) => {
      if (body.altitude < -10) return;
      const r = R * Math.max(0, 1 - Math.max(0, body.altitude) / 90);
      const a = (body.azimuth * Math.PI) / 180 - Math.PI / 2;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      const size = sizeMap[body.type] ?? 2;
      const color = colorMap[body.type] ?? '#fff';
      const opacity = body.altitude > 0 ? 1 : 0.3;

      ctx.globalAlpha = opacity;

      if (body.type === 'dso') {
        const dsoLabel = (body.extra?.messier as string) ?? '';
        
        // Draw fuzzy DSO nebula glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 3.5);
        glow.addColorStop(0, 'rgba(244, 114, 182, 0.25)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, size * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Draw dotted target circle
        ctx.beginPath();
        ctx.arc(x, y, size * 2.2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(244, 114, 182, 0.6)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([2, 3]);
        ctx.stroke();
        ctx.setLineDash([]); // reset dash

        // Draw center core
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = '#f472b6';
        ctx.fill();

        // Label
        if (body.altitude > 5) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.font = '8px JetBrains Mono, monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`${dsoLabel} (${body.name})`, x + size + 4, y + 2.5);
        }
      } else {
        // Standard body drawing
        const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
        glow.addColorStop(0, color);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, size * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        if (body.altitude > 10) {
          ctx.fillStyle = 'rgba(200,216,248,0.7)';
          ctx.font = '8px Inter, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(body.name, x + size + 3, y + 3);
        }
      }

      ctx.globalAlpha = 1;
    });
  }, [celestialBodies, issPosition, coordinates]);

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        width={340}
        height={340}
        style={{ maxWidth: '100%', height: 'auto', borderRadius: '50%' }}
      />
      <div className="flex flex-wrap justify-center items-center gap-3 font-mono text-[9px] text-starlight/40 mt-1">
        <LegendDot color="#4FC3F7" label="Planet" />
        <LegendDot color="#A78BFA" label="Constellation" />
        <LegendDot color="#f472b6" label="DSO (Messier)" />
        <LegendDot color="#F59E0B" label="ISS" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}
