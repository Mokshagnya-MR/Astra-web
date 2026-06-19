'use client';

import { useEffect, useRef } from 'react';

interface SpeedGaugeProps {
  velocityKmS: number;  // km/s
  maxKmS?: number;      // gauge max
}

export default function SpeedGauge({ velocityKmS, maxKmS = 10 }: SpeedGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animatedValue = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H * 0.78;
    const R = Math.min(W, H) * 0.62;

    const startAngle = Math.PI * 1.0; // 180deg (left)
    const endAngle = Math.PI * 2.0;   // 360deg (right) — half circle gauge

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      // Smooth animate toward target
      const target = Math.min(velocityKmS / maxKmS, 1);
      animatedValue.current += (target - animatedValue.current) * 0.08;

      // Background arc
      ctx.beginPath();
      ctx.arc(cx, cy, R, startAngle, endAngle);
      ctx.lineWidth = 10;
      ctx.strokeStyle = 'rgba(79,195,247,0.1)';
      ctx.lineCap = 'round';
      ctx.stroke();

      // Value arc
      const valueAngle = startAngle + (endAngle - startAngle) * animatedValue.current;
      const grad = ctx.createLinearGradient(cx - R, cy, cx + R, cy);
      grad.addColorStop(0, '#4FC3F7');
      grad.addColorStop(1, '#F59E0B');
      ctx.beginPath();
      ctx.arc(cx, cy, R, startAngle, valueAngle);
      ctx.lineWidth = 10;
      ctx.strokeStyle = grad;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Tick marks
      for (let i = 0; i <= 10; i++) {
        const a = startAngle + ((endAngle - startAngle) * i) / 10;
        const x1 = cx + (R - 14) * Math.cos(a);
        const y1 = cy + (R - 14) * Math.sin(a);
        const x2 = cx + (R - 6) * Math.cos(a);
        const y2 = cy + (R - 6) * Math.sin(a);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = 'rgba(200,216,248,0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Needle
      const needleAngle = valueAngle;
      const nx = cx + (R - 20) * Math.cos(needleAngle);
      const ny = cy + (R - 20) * Math.sin(needleAngle);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = '#FF6B6B';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Center hub
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#FF6B6B';
      ctx.fill();

      // Digital readout
      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 22px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(velocityKmS.toFixed(2), cx, cy - 22);
      ctx.fillStyle = 'rgba(200,216,248,0.4)';
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillText('KM/S', cx, cy - 8);

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [velocityKmS, maxKmS]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={130}
      style={{ width: '100%', maxWidth: 200, height: 'auto' }}
    />
  );
}
