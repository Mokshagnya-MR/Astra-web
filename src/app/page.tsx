'use client';

import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import HeroOverlay from '@/components/layout/HeroOverlay';
import BootSequence from '@/components/layout/BootSequence';
import MobileDrawer from '@/components/layout/MobileDrawer';
import WebsiteTour from '@/components/layout/WebsiteTour';
import TourPrompt from '@/components/layout/TourPrompt';
import { useISSTracking } from '@/hooks/useISSTracking';
import CoordinatePanel from '@/components/celestial/CoordinatePanel';
import CelestialDashboard from '@/components/celestial/CelestialDashboard';
import ISSTracker from '@/components/celestial/ISSTracker';
import ConstellationOverlay from '@/components/celestial/ConstellationOverlay';
import SatellitePanel from '@/components/celestial/SatellitePanel';
import PlanetPanel from '@/components/celestial/PlanetPanel';
import ISSPassPredictor from '@/components/celestial/ISSPassPredictor';
import SkyPlanisphere from '@/components/celestial/SkyPlanisphere';
import CelestialEvents from '@/components/celestial/CelestialEvents';
import SpaceWeatherPanel from '@/components/celestial/SpaceWeatherPanel';
import SkyTourPanel from '@/components/celestial/SkyTourPanel';
import AIChatPanel from '@/components/ai/AIChatPanel';
import ViewToggle from '@/components/map/ViewToggle';
import { useZenithStore } from '@/hooks/useZenithStore';
import { useShareableURL } from '@/hooks/useShareableURL';

const Globe3D = dynamic(() => import('@/components/map/Globe3D'), {
  ssr: false,
  loading: () => <MapLoading label="LOADING 3D GLOBE" />,
});
const CosmicMap = dynamic(() => import('@/components/map/CosmicMap'), {
  ssr: false,
  loading: () => <MapLoading label="LOADING 2D RADAR MAP" />,
});

function MapLoading({ label }: { label: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center glass-card">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-2 border-aurora border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-mono text-aurora text-sm tracking-widest">{label}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const { coordinates, viewMode } = useZenithStore();
  useShareableURL();
  useISSTracking();

  const dataPanels = (
    <>
      {coordinates && (
        <div className="flex flex-col gap-4">
          <div id="section-radar" className="grid grid-cols-1 xl:grid-cols-3 gap-4 scroll-mt-16">
            <CelestialDashboard />
            <PlanetPanel />
            <SatellitePanel />
          </div>
          <div id="section-weather" className="grid grid-cols-1 lg:grid-cols-3 gap-4 scroll-mt-16">
            <SpaceWeatherPanel />
            <SkyTourPanel />
            <ISSPassPredictor />
          </div>
          <div id="section-planisphere" className="grid grid-cols-1 lg:grid-cols-2 gap-4 scroll-mt-16">
            <div className="glass-card p-4 flex flex-col items-center gap-3">
              <h2 className="font-display text-xs text-yellow-400 tracking-widest self-start">SKY VIEW — PLANISPHERE</h2>
              <div className="panel-rule w-full" />
              <SkyPlanisphere />
            </div>
            <div id="section-ai" className="scroll-mt-16">
              <AIChatPanel />
            </div>
          </div>
          <ConstellationOverlay />
          <div id="section-events" className="scroll-mt-16">
            <CelestialEvents />
          </div>
        </div>
      )}
    </>
  );

  return (
    <main className="min-h-screen flex flex-col">
      <BootSequence />
      <TourPrompt />
      <WebsiteTour />
      <Header />
      <section className="relative flex-1">
        <HeroOverlay />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <div id="section-map" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 scroll-mt-16">
            <div className="lg:col-span-2 h-[350px] sm:h-[480px] lg:h-[650px] glass-card overflow-hidden relative">
              <ViewToggle />
              {viewMode === '3d' ? <Globe3D /> : <CosmicMap />}
            </div>
            <div className="flex flex-col gap-4">
              <div id="coord-panel"><CoordinatePanel /></div>
              <div id="iss-tracker-panel"><ISSTracker /></div>
            </div>
          </div>
          <div className="hidden lg:block">{dataPanels}</div>
        </div>
      </section>
      <MobileDrawer>{dataPanels}</MobileDrawer>
      <footer className="hidden lg:block border-t border-aurora/10 py-6 text-center">
        <p className="text-starlight/40 font-mono text-xs tracking-widest">
          PROJECT ZENITH: THE CELESTIAL EYE · REAL-TIME COSMIC RADAR · {new Date().getFullYear()}
        </p>
      </footer>
    </main>
  );
}
