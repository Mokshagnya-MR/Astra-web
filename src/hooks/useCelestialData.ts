'use client';

import { useEffect, useCallback } from 'react';
import { useZenithStore, CelestialBody, Coordinates } from './useZenithStore';

// Dynamically import astronomy-engine only on client
async function computePlanets(lat: number, lng: number, date: Date): Promise<CelestialBody[]> {
  const Astronomy = await import('astronomy-engine');

  const observer = new Astronomy.Observer(lat, lng, 0);
  const time = Astronomy.MakeTime(date);

  const planets = [
    { name: 'Mercury', body: Astronomy.Body.Mercury },
    { name: 'Venus',   body: Astronomy.Body.Venus   },
    { name: 'Mars',    body: Astronomy.Body.Mars    },
    { name: 'Jupiter', body: Astronomy.Body.Jupiter },
    { name: 'Saturn',  body: Astronomy.Body.Saturn  },
    { name: 'Uranus',  body: Astronomy.Body.Uranus  },
    { name: 'Neptune', body: Astronomy.Body.Neptune },
    { name: 'Moon',    body: Astronomy.Body.Moon    },
  ];

  return planets.map(({ name, body }) => {
    try {
      const equ = Astronomy.Equator(body, time, observer, true, true);
      const hor = Astronomy.Horizon(time, observer, equ.ra, equ.dec, 'normal');
      const illum = Astronomy.Illumination(body, time);

      return {
        name,
        type: 'planet',
        altitude: hor.altitude,
        azimuth: hor.azimuth,
        distance: equ.dist * 1.496e8, // AU → km
        magnitude: illum.mag,
        visible: hor.altitude > 0,
      } as CelestialBody;
    } catch {
      return {
        name,
        type: 'planet',
        altitude: 0,
        azimuth: 0,
        visible: false,
      } as CelestialBody;
    }
  });
}

// Major constellation visibility (simplified — based on RA/Dec centre)
const CONSTELLATIONS = [
  { name: 'Orion',       ra: 5.5833,  dec: 0     },
  { name: 'Ursa Major',  ra: 11.0,    dec: 56    },
  { name: 'Ursa Minor',  ra: 15.0,    dec: 75    },
  { name: 'Scorpius',    ra: 16.8833, dec: -30   },
  { name: 'Leo',         ra: 10.5,    dec: 15    },
  { name: 'Cygnus',      ra: 20.5,    dec: 42    },
  { name: 'Cassiopeia',  ra: 1.0,     dec: 60    },
  { name: 'Gemini',      ra: 7.0,     dec: 22    },
  { name: 'Taurus',      ra: 4.7,     dec: 15    },
  { name: 'Virgo',       ra: 13.4,    dec: -4    },
  { name: 'Sagittarius', ra: 19.0,    dec: -25   },
  { name: 'Perseus',     ra: 3.2,     dec: 45    },
];

async function computeConstellations(lat: number, lng: number, date: Date): Promise<CelestialBody[]> {
  const Astronomy = await import('astronomy-engine');
  const observer = new Astronomy.Observer(lat, lng, 0);
  const time = Astronomy.MakeTime(date);

  return CONSTELLATIONS.map(({ name, ra, dec }) => {
    try {
      const hor = Astronomy.Horizon(time, observer, ra, dec, 'normal');
      return {
        name,
        type: 'constellation',
        altitude: hor.altitude,
        azimuth: hor.azimuth,
        visible: hor.altitude > -10, // slightly below horizon still counts
      } as CelestialBody;
    } catch {
      return { name, type: 'constellation', altitude: 0, azimuth: 0, visible: false } as CelestialBody;
    }
  });
}

// Major Messier Catalog Deep Space Objects (DSOs)
const DSOS = [
  { name: 'Andromeda Galaxy', messier: 'M31', ra: 0.7123,  dec: 41.269,  dsoType: 'Spiral Galaxy', distance: '2.5M ly' },
  { name: 'Orion Nebula',     messier: 'M42', ra: 5.5881,  dec: -5.383,  dsoType: 'Emission Nebula', distance: '1,344 ly' },
  { name: 'Pleiades Cluster', messier: 'M45', ra: 3.7836,  dec: 24.116,  dsoType: 'Open Cluster', distance: '444 ly' },
  { name: 'Crab Nebula',      messier: 'M1',  ra: 5.5755,  dec: 22.014,  dsoType: 'Supernova Remnant', distance: '6,500 ly' },
  { name: 'Ring Nebula',      messier: 'M57', ra: 18.892,  dec: 33.029,  dsoType: 'Planetary Nebula', distance: '2,283 ly' },
  { name: 'Hercules Cluster', messier: 'M13', ra: 16.693,  dec: 36.461,  dsoType: 'Globular Cluster', distance: '22,200 ly' },
];

async function computeDSOs(lat: number, lng: number, date: Date): Promise<CelestialBody[]> {
  const Astronomy = await import('astronomy-engine');
  const observer = new Astronomy.Observer(lat, lng, 0);
  const time = Astronomy.MakeTime(date);

  return DSOS.map(({ name, messier, ra, dec, dsoType, distance }) => {
    try {
      const hor = Astronomy.Horizon(time, observer, ra, dec, 'normal');
      return {
        name,
        type: 'dso',
        altitude: hor.altitude,
        azimuth: hor.azimuth,
        visible: hor.altitude > 0,
        extra: { messier, dsoType, distance },
      } as CelestialBody;
    } catch {
      return {
        name,
        type: 'dso',
        altitude: 0,
        azimuth: 0,
        visible: false,
        extra: { messier, dsoType, distance },
      } as CelestialBody;
    }
  });
}

export function useCelestialData(coords: Coordinates | null) {
  const { setCelestialBodies } = useZenithStore();

  const refresh = useCallback(async () => {
    if (!coords) return;
    const now = new Date();
    const [planets, constellations, dsos] = await Promise.all([
      computePlanets(coords.lat, coords.lng, now),
      computeConstellations(coords.lat, coords.lng, now),
      computeDSOs(coords.lat, coords.lng, now),
    ]);
    setCelestialBodies([...planets, ...constellations, ...dsos]);
  }, [coords, setCelestialBodies]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60_000); // update every minute
    return () => clearInterval(id);
  }, [refresh]);
}
