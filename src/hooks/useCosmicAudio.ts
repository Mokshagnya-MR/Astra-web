'use client';

import { useEffect, useRef } from 'react';
import { useZenithStore } from './useZenithStore';

// Haversine formula to compute distance between two lat/lng pairs in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useCosmicAudio() {
  const { audioEnabled, issPosition, coordinates } = useZenithStore();

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const lfoGainRef = useRef<GainNode | null>(null);

  // Initialize and manage sound synthesis loop
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (audioEnabled) {
      // 1. Create AudioContext (fallback to webkitAudioContext for Safari)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // 2. Main deep space drone oscillator (Triangle wave for soft low hum)
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(85, ctx.currentTime); // Low baseline hum
      oscRef.current = osc;

      // 3. Bandpass filter for resonant sweeps
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(2.2, ctx.currentTime);
      filter.frequency.setValueAtTime(220, ctx.currentTime);
      filterRef.current = filter;

      // 4. Main Gain node for volume control & fade-in
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, ctx.currentTime); // start silent
      gainRef.current = gainNode;

      // 5. LFO to sweep the filter frequency (pulsing space breathing)
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // 1 sweep every 12.5 seconds
      lfoRef.current = lfo;

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(80, ctx.currentTime); // sweep width (depth)
      lfoGainRef.current = lfoGain;

      // Connect LFO: lfo -> lfoGain -> filter.frequency
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      // Connect signal path: osc -> filter -> gainNode -> destination
      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Start oscillators
      osc.start(0);
      lfo.start(0);

      // Smooth fade-in to prevent audio clicks
      gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 1.5);
    } else {
      // Fade-out and teardown
      const ctx = audioCtxRef.current;
      const gainNode = gainRef.current;

      if (ctx && gainNode) {
        gainNode.gain.cancelScheduledValues(ctx.currentTime);
        gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);

        // Terminate audio context after fade-out
        const t = setTimeout(() => {
          try {
            if (oscRef.current) oscRef.current.stop();
            if (lfoRef.current) lfoRef.current.stop();
            ctx.close();
          } catch (e) {
            console.error('Audio teardown failed', e);
          }
          audioCtxRef.current = null;
        }, 500);

        return () => clearTimeout(t);
      }
    }

    return () => {
      // Direct teardown on unmount
      if (audioCtxRef.current) {
        try {
          if (oscRef.current) oscRef.current.stop();
          if (lfoRef.current) lfoRef.current.stop();
          audioCtxRef.current.close();
        } catch {}
        audioCtxRef.current = null;
      }
    };
  }, [audioEnabled]);

  // Handle live proximity modulation (ISS distance to observer coordinates)
  useEffect(() => {
    const ctx = audioCtxRef.current;
    const osc = oscRef.current;
    const lfo = lfoRef.current;

    if (!audioEnabled || !ctx || !osc || !lfo || !issPosition || !coordinates) {
      // Reset back to baseline slow sweeps when no observer or ISS is far
      if (ctx && osc && lfo && audioEnabled) {
        osc.frequency.setTargetAtTime(85, ctx.currentTime, 0.8);
        lfo.frequency.setTargetAtTime(0.08, ctx.currentTime, 0.8);
      }
      return;
    }

    // Compute distance in km
    const distance = getDistance(
      coordinates.lat,
      coordinates.lng,
      issPosition.latitude,
      issPosition.longitude
    );

    const activeRange = 3500; // start modulating when ISS is within 3500 km

    if (distance < activeRange) {
      // Proximity intensity scale (0 = far away/3500km, 1 = overhead/0km)
      const intensity = Math.max(0, 1 - distance / activeRange);
      
      // Modulate main oscillator pitch: 85Hz up to 135Hz
      const targetPitch = 85 + intensity * 50;
      // Modulate LFO rate (sweep speed): 0.08Hz up to 1.6Hz (pulsing warning chime rate)
      const targetLFORate = 0.08 + intensity * 1.52;

      osc.frequency.setTargetAtTime(targetPitch, ctx.currentTime, 0.6);
      lfo.frequency.setTargetAtTime(targetLFORate, ctx.currentTime, 0.6);
    } else {
      // Normal baseline slow sweep
      osc.frequency.setTargetAtTime(85, ctx.currentTime, 0.8);
      lfo.frequency.setTargetAtTime(0.08, ctx.currentTime, 0.8);
    }
  }, [audioEnabled, issPosition, coordinates]);
}
