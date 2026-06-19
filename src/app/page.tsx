'use client';

import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import HeroOverlay from '@/components/layout/HeroOverlay';
import BootSequence from '@/components/layout/BootSequence';
import MobileDrawer from '@/components/layout/MobileDrawer';
import ViewToggle from '@/components/map/ViewToggle';
import CoordinatePanel from '@/components/celestial/CoordinatePanel';
import CelestialDashboard from '@/components/celestial/CelestialDashboard';
import ISSTracker from '@/components/celestial/ISSTracker';
import ConstellationOverlay from '@/components/celestial/ConstellationOverlay';
import SatellitePanel from '@/components/celestial/SatellitePanel';
import PlanetPanel from '@/components/celestial/PlanetPanel';
import ISSPassPredictor from '@/components/celestial/ISSPassPredictor';
import SkyPlanisphere from '@/components/celestial/SkyPlanisphere';
import CelestialEvents from '@/components/celestial/CelestialEvents';
import { useZenithStore } from '@/hooks/useZenithStore';
import { useShareableURL } from '@/hooks/useShareableURL';

const CosmicMap = dynamic(() => import('@/components/map/CosmicMap'), {
  ssr: false,
  loading: () => <MapLoading label="INITIALIZING MAP" />,
});

const Globe3D = dynamic(() => import('@/components/map/Globe3D'), {
  ssr: false,
  loading: () => <MapLoading label="LOADING 3D GLOBE" />,
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

  const dataPanels = (
    <>
      {coordinates && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <CelestialDashboard />
            <PlanetPanel />
            <SatellitePanel />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card p-4 flex flex-col items-center gap-3">
              <h2 className="font-display text-xs text-yellow-400 tracking-widest self-start">SKY VIEW (PLANISPHERE)</h2>
              <div className="panel-rule w-full" />
              <SkyPlanisphere />
            </div>
            <ISSPassPredictor />
          </div>
          <ConstellationOverlay />
          <CelestialEvents />
        </div>
      )}
    </>
  );

  return (
    <main className="min-h-screen flex flex-col">
      <BootSequence />
      <Header />

      <section className="relative flex-1">
        <HeroOverlay />

        <div className="container mx-auto px-4 pt-24 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 h-[480px] rounded-xl overflow-hidden border border-aurora/20 relative">
              {viewMode === '2d' ? <CosmicMap /> : <Globe3D />}
              <ViewToggle />
            </div>
            <div className="flex flex-col gap-4">
              <CoordinatePanel />
              <ISSTracker />
            </div>
          </div>

          {/* Desktop: panels inline. Mobile: hidden, shown via drawer instead */}
          <div className="hidden lg:block">{dataPanels}</div>
        </div>
      </section>

      {/* Mobile drawer holds the same panels for small screens */}
      <MobileDrawer>{dataPanels}</MobileDrawer>

      <footer className="hidden lg:block border-t border-aurora/10 py-6 text-center">
        <p className="text-starlight/40 font-mono text-xs tracking-widest">
          PROJECT ZENITH: THE CELESTIAL EYE · REAL-TIME COSMIC RADAR · {new Date().getFullYear()}
        </p>
      </footer>
    </main>
  );
}
