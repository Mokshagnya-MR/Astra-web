# 🌌 Project Zenith: The Celestial Eye

> A real-time cosmic radar — select any coordinate on Earth and instantly see what's overhead: ISS, active satellites, planets, and constellations.

![Project Zenith Banner](public/assets/banner.png)

---

## 🚀 Features

- **3D Rotating Globe** — Three.js Earth with live ISS marker, zenith beacon, orbit ring (51.6° inclination), and a connection arc between your location and the station. Toggle between 2D map and 3D globe anytime.
- **Sky View Planisphere** — A circular all-sky dome chart (zenith at center, horizon at rim) plotting every visible planet, constellation, and the ISS by true altitude/azimuth — the same projection real astronomers use.
- **ISS Pass Predictor** — Estimates the next 5 visible ISS passes over your location (rise/peak/set time, max elevation, duration, compass direction) from current orbital position.
- **City Search** — Type any city name (free OpenStreetMap/Nominatim geocoding, no API key) and the map flies there instantly.
- **Live Orbit Path** — The ISS's actual ground track (last ~40 positions) plus a projected path for the next 90 minutes, drawn directly on the map.
- **Speed Tracker Gauge** — An animated canvas speedometer showing live ISS velocity (~7.66 km/s / ~27,600 km/h) with smooth needle interpolation.
- **Share This Sky** — One-tap copy of a URL that encodes your exact coordinates (`?lat=...&lng=...&loc=...`) so anyone can open the same view instantly.
- **Celestial Events Countdown** — Live countdown to the next full moon, new moon, and upcoming 2026 meteor shower peaks, plus the current moon phase.
- **Mobile Swipe Drawer** — On phones, all data panels live in a swipe-up bottom drawer instead of a long scroll — drag up to expand, drag down to collapse.
- **Cinematic Boot Sequence** — A radar-themed boot animation plays on first visit, simulating telemetry connection before the interface appears.
- **Interactive Dark Map** — Click anywhere on a Carto dark-themed Leaflet map to select your zenith point, or use GPS geolocation.
- **Live ISS Tracking** — Polls OpenNotify every 5 seconds for real-time latitude, longitude, altitude, and velocity.
- **Planet Positions** — Uses `astronomy-engine` to compute real-time altitude/azimuth/magnitude for Mercury through Neptune plus the Moon.
- **Constellation Visibility** — 12 major constellations computed for your exact location and time.
- **Radar Display** — Canvas-based polar sky chart with animated sweep.
- **Satellite Catalog** — Up to 200 active satellites pulled live from CelesTrak's GP endpoint.
- **Responsive UI** — CSS Grid + Flexbox, cosmic glassmorphism theme, works on mobile, tablet, and desktop.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| UI | React 18 + Tailwind CSS |
| Map | Leaflet + react-leaflet |
| Astronomy | astronomy-engine |
| State | Zustand |
| Animation | Framer Motion |
| ISS API | OpenNotify (`api.open-notify.org`) |
| Satellite TLE | CelesTrak GP endpoint |
| Planets | NASA Horizons (future) / astronomy-engine |

---

## ⚡ Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/project-zenith.git
cd project-zenith
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create `.env.local` in the project root:

```env
# No API keys required for base features.
# NASA Horizons API (optional, for extended planet data):
NEXT_PUBLIC_NASA_API_KEY=your_nasa_api_key_here
```

Get a free NASA API key at: https://api.nasa.gov/

---

## 📦 Dependencies

```json
{
  "next": "14.2.3",
  "react": "^18",
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "astronomy-engine": "^2.1.19",
  "satellite.js": "^5.0.0",
  "zustand": "^4.5.2",
  "framer-motion": "^11.1.7",
  "three": "^0.163.0",
  "@react-three/fiber": "^8.16.3",
  "@react-three/drei": "^9.105.4"
}
```

---

## 🗂 Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout + metadata
│   ├── page.tsx            # Main page — wires every feature together
│   └── api/
│       ├── iss/route.ts    # Proxy: OpenNotify ISS
│       └── satellites/route.ts  # Proxy: CelesTrak GP
├── components/
│   ├── layout/
│   │   ├── Header.tsx          # Nav + UTC clock
│   │   ├── HeroOverlay.tsx     # Pre-selection overlay
│   │   ├── BootSequence.tsx    # Cinematic radar boot animation
│   │   └── MobileDrawer.tsx    # Swipe-up bottom drawer (mobile)
│   ├── map/
│   │   ├── CosmicMap.tsx       # Leaflet 2D map + ISS marker + orbit paths
│   │   ├── Globe3D.tsx         # Three.js 3D rotating globe
│   │   └── ViewToggle.tsx      # 2D/3D switcher
│   ├── celestial/
│   │   ├── CoordinatePanel.tsx     # Lat/lng input + city search + share
│   │   ├── CitySearch.tsx          # Nominatim city geocoding
│   │   ├── CelestialDashboard.tsx  # Radar chart
│   │   ├── ISSTracker.tsx          # Live ISS data + speed gauge
│   │   ├── SpeedGauge.tsx          # Animated canvas speedometer
│   │   ├── ISSPassPredictor.tsx    # Next visible pass predictions
│   │   ├── SkyPlanisphere.tsx      # All-sky dome chart
│   │   ├── PlanetPanel.tsx         # Planet visibility list
│   │   ├── SatellitePanel.tsx      # Active satellite list
│   │   ├── ConstellationOverlay.tsx # Constellation grid
│   │   └── CelestialEvents.tsx     # Moon phase + meteor shower countdown
│   └── ui/
│       └── StarField.tsx       # Animated background stars
├── hooks/
│   ├── useZenithStore.ts       # Zustand global state
│   ├── useISSTracking.ts       # ISS polling hook
│   ├── useCelestialData.ts     # Planet/constellation computation
│   └── useShareableURL.ts      # URL <-> coordinates sync
├── lib/
│   ├── utils.ts                # Math helpers
│   └── astronomy.d.ts          # Type shims
└── styles/
    └── globals.css             # Tailwind + cosmic theme
```

---

## 🌍 APIs Used

| API | Purpose | Rate Limit |
|-----|---------|-----------|
| [OpenNotify](http://api.open-notify.org/iss-now.json) | ISS real-time position | Unlimited |
| [CelesTrak GP](https://celestrak.org/GP/query?GROUP=active&FORMAT=JSON) | Active satellite TLE data | Fair use |
| [astronomy-engine](https://github.com/cosinekitty/astronomy) | Client-side planet calculations | N/A (local) |

---

## 🔮 Extending the Project

### Add NASA Horizons for precise planetary ephemeris
```typescript
// src/app/api/horizons/route.ts
const url = `https://ssd.jpl.nasa.gov/api/horizons.api?COMMAND='499'&...`;
```

### Add satellite.js for TLE propagation
```typescript
import { twoline2satrec, propagate, gstime, eciToGeodetic } from 'satellite.js';
// Compute satellite position from TLE at current time
```

### Add Three.js 3D globe
```typescript
// src/components/map/Globe3D.tsx — already in dependencies
import { Canvas } from '@react-three/fiber';
import { Sphere, OrbitControls } from '@react-three/drei';
```

---

## 📱 Responsive Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| Mobile (<768px) | Single column stack |
| Tablet (768–1024px) | 2-column grid |
| Desktop (>1024px) | 3-column dashboard |

---

## 🏆 AstralWeb Innovate Round 2

Built for **AstralWeb Innovate Round 2** (June 10–26, 2026).

**Submission checklist:**
- [x] Live hosted URL
- [x] Public GitHub repository  
- [x] Comprehensive README
- [x] Responsive UI (Grid + Flexbox) + mobile swipe drawer
- [x] Interactive 2D map + 3D rotating globe
- [x] Real-time data fetching (ISS + satellites)
- [x] Astronomical accuracy (astronomy-engine + sky planisphere)
- [x] ISS pass prediction
- [x] City search (geocoding)
- [x] Live orbit path + 90-minute projection
- [x] Speed tracker gauge
- [x] Shareable URLs
- [x] Celestial events countdown (moon phases, meteor showers)
- [x] Cinematic boot sequence
- [x] Cosmic UI theme
- [x] Clean architecture + documented code

---

## 📄 License

MIT — free to use, modify, and distribute.
