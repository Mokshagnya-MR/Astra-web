'use client';

import { useState } from 'react';
import { useZenithStore } from '@/hooks/useZenithStore';
import { buildShareURL } from '@/hooks/useShareableURL';
import CitySearch from './CitySearch';

export default function CoordinatePanel() {
  const { coordinates, setCoordinates } = useZenithStore();
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = () => {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      setError('Enter valid decimal coordinates.');
      return;
    }
    if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
      setError('Coordinates out of range.');
      return;
    }
    setError('');
    setCoordinates({ lat: parsedLat, lng: parsedLng });
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordinates({
          lat: parseFloat(pos.coords.latitude.toFixed(4)),
          lng: parseFloat(pos.coords.longitude.toFixed(4)),
          label: 'Your Location',
        });
        setLat(pos.coords.latitude.toFixed(4));
        setLng(pos.coords.longitude.toFixed(4));
        setGeoLoading(false);
      },
      () => {
        setError('Geolocation denied.');
        setGeoLoading(false);
      }
    );
  };

  const handleShare = async () => {
    if (!coordinates) return;
    const url = buildShareURL(coordinates.lat, coordinates.lng, coordinates.label);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy link.');
    }
  };

  return (
    <div className="glass-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xs text-aurora tracking-widest">COORDINATES</h2>
        <button
          onClick={handleGeolocate}
          disabled={geoLoading}
          className="cosmic-badge bg-aurora/10 text-aurora border border-aurora/30 hover:bg-aurora/20 transition-colors cursor-pointer"
          title="Use my location"
        >
          {geoLoading ? '...' : '⊕ LOCATE ME'}
        </button>
      </div>

      <div className="panel-rule" />

      {/* City search */}
      <CitySearch />

      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-starlight/10" />
        <span className="font-mono text-[9px] text-starlight/30">OR ENTER MANUALLY</span>
        <div className="flex-1 h-px bg-starlight/10" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="font-mono text-[10px] text-starlight/50 tracking-widest block mb-1">
            LATITUDE
          </label>
          <input
            type="number"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="-90 to 90"
            min={-90} max={90} step="any"
            className="w-full bg-void/80 border border-pulsar/40 rounded px-2 py-1.5 text-sm font-mono text-starlight focus:outline-none focus:border-aurora transition-colors"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] text-starlight/50 tracking-widest block mb-1">
            LONGITUDE
          </label>
          <input
            type="number"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="-180 to 180"
            min={-180} max={180} step="any"
            className="w-full bg-void/80 border border-pulsar/40 rounded px-2 py-1.5 text-sm font-mono text-starlight focus:outline-none focus:border-aurora transition-colors"
          />
        </div>
      </div>

      {error && (
        <p className="font-mono text-[11px] text-red-400">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        className="w-full py-2 rounded font-display text-xs tracking-widest bg-aurora/10 border border-aurora/40 text-aurora hover:bg-aurora/20 transition-all hover:shadow-[0_0_16px_rgba(79,195,247,0.3)]"
      >
        SET ZENITH POINT
      </button>

      {coordinates && (
        <>
          <div className="panel-rule" />
          <div className="data-stream space-y-0.5">
            <p>LAT  <span className="text-aurora">{coordinates.lat}°</span></p>
            <p>LNG  <span className="text-aurora">{coordinates.lng}°</span></p>
            {coordinates.label && (
              <p>LOC  <span className="text-comet">{coordinates.label}</span></p>
            )}
          </div>

          <button
            onClick={handleShare}
            className="w-full py-1.5 rounded font-mono text-[10px] tracking-widest bg-comet/10 border border-comet/30 text-comet hover:bg-comet/20 transition-all flex items-center justify-center gap-1.5"
          >
            {copied ? '✓ LINK COPIED' : '🔗 SHARE THIS SKY'}
          </button>
        </>
      )}
    </div>
  );
}
