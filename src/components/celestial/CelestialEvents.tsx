'use client';

import { useEffect, useState } from 'react';

interface CelestialEvent {
  name: string;
  date: Date;
  type: 'moon' | 'eclipse' | 'meteor' | 'conjunction';
  description: string;
}

// Synodic month (new moon to new moon)
const SYNODIC_MONTH_DAYS = 29.530588853;
// Known reference new moon: Jan 11, 2024 11:57 UTC
const REF_NEW_MOON = new Date('2024-01-11T11:57:00Z').getTime();

function getMoonPhase(date: Date): { phase: number; name: string; emoji: string } {
  const diff = (date.getTime() - REF_NEW_MOON) / 86400000;
  const phase = ((diff % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
  const pct = phase / SYNODIC_MONTH_DAYS;

  if (pct < 0.03 || pct > 0.97) return { phase: pct, name: 'New Moon', emoji: '🌑' };
  if (pct < 0.22) return { phase: pct, name: 'Waxing Crescent', emoji: '🌒' };
  if (pct < 0.28) return { phase: pct, name: 'First Quarter', emoji: '🌓' };
  if (pct < 0.47) return { phase: pct, name: 'Waxing Gibbous', emoji: '🌔' };
  if (pct < 0.53) return { phase: pct, name: 'Full Moon', emoji: '🌕' };
  if (pct < 0.72) return { phase: pct, name: 'Waning Gibbous', emoji: '🌖' };
  if (pct < 0.78) return { phase: pct, name: 'Last Quarter', emoji: '🌗' };
  return { phase: pct, name: 'Waning Crescent', emoji: '🌘' };
}

function nextFullMoon(from: Date): Date {
  let cursor = new Date(from);
  for (let i = 0; i < 35; i++) {
    const { name } = getMoonPhase(cursor);
    if (name === 'Full Moon') return cursor;
    cursor = new Date(cursor.getTime() + 86400000);
  }
  return cursor;
}

function nextNewMoon(from: Date): Date {
  let cursor = new Date(from);
  for (let i = 0; i < 35; i++) {
    const { name } = getMoonPhase(cursor);
    if (name === 'New Moon') return cursor;
    cursor = new Date(cursor.getTime() + 86400000);
  }
  return cursor;
}

// Known 2026 meteor showers (peak dates, UTC)
const METEOR_SHOWERS_2026 = [
  { name: 'Quadrantids', date: '2026-01-03' },
  { name: 'Lyrids', date: '2026-04-22' },
  { name: 'Eta Aquariids', date: '2026-05-05' },
  { name: 'Perseids', date: '2026-08-12' },
  { name: 'Orionids', date: '2026-10-21' },
  { name: 'Leonids', date: '2026-11-17' },
  { name: 'Geminids', date: '2026-12-14' },
];

function getUpcomingEvents(now: Date): CelestialEvent[] {
  const events: CelestialEvent[] = [];

  events.push({
    name: 'Next Full Moon',
    date: nextFullMoon(now),
    type: 'moon',
    description: 'Moon fully illuminated, brightest in its cycle',
  });

  events.push({
    name: 'Next New Moon',
    date: nextNewMoon(now),
    type: 'moon',
    description: 'Best night for deep-sky and faint object viewing',
  });

  for (const shower of METEOR_SHOWERS_2026) {
    const d = new Date(shower.date + 'T00:00:00Z');
    if (d.getTime() > now.getTime()) {
      events.push({
        name: `${shower.name} Meteor Shower`,
        date: d,
        type: 'meteor',
        description: 'Peak activity — best viewed after midnight',
      });
    }
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
}

export default function CelestialEvents() {
  const [now, setNow] = useState<Date | null>(null);
  const [events, setEvents] = useState<CelestialEvent[]>([]);
  const [currentPhase, setCurrentPhase] = useState<{ phase: number; name: string; emoji: string } | null>(null);

  useEffect(() => {
    const update = () => {
      const n = new Date();
      setNow(n);
      setEvents(getUpcomingEvents(n));
      setCurrentPhase(getMoonPhase(n));
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  return (
    <div className="glass-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xs text-comet tracking-widest">CELESTIAL EVENTS</h2>
        {currentPhase && (
          <span className="cosmic-badge bg-comet/10 text-comet border border-comet/20 flex items-center gap-1">
            {currentPhase.emoji} {currentPhase.name.toUpperCase()}
          </span>
        )}
      </div>
      <div className="panel-rule" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {events.map((event, i) => (
          <EventCard key={i} event={event} now={now} />
        ))}
      </div>
    </div>
  );
}

function EventCard({ event, now }: { event: CelestialEvent; now: Date }) {
  const msUntil = event.date.getTime() - now.getTime();
  const days = Math.floor(msUntil / 86400000);
  const hours = Math.floor((msUntil % 86400000) / 3600000);

  const typeIcon: Record<string, string> = {
    moon: '🌙',
    eclipse: '🌘',
    meteor: '☄️',
    conjunction: '✨',
  };

  const typeColor: Record<string, string> = {
    moon: 'border-comet/20 bg-comet/5',
    eclipse: 'border-event-horizon/20 bg-event-horizon/5',
    meteor: 'border-solar/20 bg-solar/5',
    conjunction: 'border-aurora/20 bg-aurora/5',
  };

  return (
    <div className={`rounded-lg p-3 border ${typeColor[event.type]}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base">{typeIcon[event.type]}</span>
        <span className="font-display text-[11px] text-starlight leading-tight">{event.name}</span>
      </div>
      <p className="font-mono text-[9px] text-starlight/40 mb-2">{event.description}</p>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-starlight/50">
          {event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
        <span className="font-mono text-[10px] text-aurora">
          {days > 0 ? `${days}d ${hours}h` : `${hours}h`}
        </span>
      </div>
    </div>
  );
}
