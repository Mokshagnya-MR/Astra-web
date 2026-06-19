'use client';

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useZenithStore } from '@/hooks/useZenithStore';

const EARTH_RADIUS = 2;

function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.02;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      <meshStandardMaterial
        color="#0D1B3E"
        emissive="#1A3A6E"
        emissiveIntensity={0.15}
        roughness={0.7}
        metalness={0.2}
        wireframe={false}
      />
      {/* Wireframe overlay for grid look */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.001, 24, 24]} />
        <meshBasicMaterial color="#4FC3F7" wireframe transparent opacity={0.15} />
      </mesh>
    </mesh>
  );
}

function AtmosphereGlow() {
  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS * 1.08, 32, 32]} />
      <meshBasicMaterial color="#4FC3F7" transparent opacity={0.06} side={THREE.BackSide} />
    </mesh>
  );
}

function ZenithMarker({ lat, lng }: { lat: number; lng: number }) {
  const pos = useMemo(() => latLngToVec3(lat, lng, EARTH_RADIUS * 1.02), [lat, lng]);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
      ringRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group position={pos}>
      <mesh>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshBasicMaterial color="#4FC3F7" />
      </mesh>
      <mesh ref={ringRef}>
        <ringGeometry args={[0.05, 0.07, 24]} />
        <meshBasicMaterial color="#4FC3F7" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Vertical beam shooting outward (zenith direction) */}
      <Line
        points={[[0, 0, 0], pos.clone().normalize().multiplyScalar(0.5)]}
        color="#4FC3F7"
        transparent
        opacity={0.4}
        lineWidth={1}
      />
    </group>
  );
}

function ISSMarker({ lat, lng }: { lat: number; lng: number }) {
  const pos = useMemo(() => latLngToVec3(lat, lng, EARTH_RADIUS * 1.18), [lat, lng]);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
      meshRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group position={pos}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshBasicMaterial color="#F59E0B" />
      </mesh>
      <pointLight color="#F59E0B" intensity={0.5} distance={1} />
    </group>
  );
}

function OrbitRing() {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const r = EARTH_RADIUS * 1.18;
    const inclination = (51.6 * Math.PI) / 180;
    for (let i = 0; i <= 128; i++) {
      const t = (i / 128) * Math.PI * 2;
      const x = r * Math.cos(t);
      const y = r * Math.sin(t) * Math.sin(inclination);
      const z = r * Math.sin(t) * Math.cos(inclination);
      pts.push([x, y, z]);
    }
    return pts;
  }, []);

  return <Line points={points} color="#F59E0B" transparent opacity={0.25} lineWidth={1} />;
}

function ConnectionArc({ lat, lng }: { lat: number; lng: number }) {
  const { issPosition } = useZenithStore();
  if (!issPosition) return null;

  const start = latLngToVec3(lat, lng, EARTH_RADIUS * 1.02);
  const end = latLngToVec3(issPosition.latitude, issPosition.longitude, EARTH_RADIUS * 1.18);
  const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(EARTH_RADIUS * 1.4);

  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  const points = curve.getPoints(32).map((p): [number, number, number] => [p.x, p.y, p.z]);

  return <Line points={points} color="#A78BFA" transparent opacity={0.3} lineWidth={1} dashed dashSize={0.05} gapSize={0.03} />;
}

function Scene() {
  const { coordinates, issPosition } = useZenithStore();

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-5, -3, -5]} intensity={0.3} color="#4FC3F7" />

      <Earth />
      <AtmosphereGlow />
      <OrbitRing />

      {coordinates && <ZenithMarker lat={coordinates.lat} lng={coordinates.lng} />}
      {issPosition && <ISSMarker lat={issPosition.latitude} lng={issPosition.longitude} />}
      {coordinates && issPosition && <ConnectionArc lat={coordinates.lat} lng={coordinates.lng} />}

      <Stars radius={50} depth={50} count={2000} factor={2} saturation={0} fade speed={0.5} />

      <OrbitControls
        enablePan={false}
        minDistance={3.5}
        maxDistance={10}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
}

export default function Globe3D() {
  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ position: [0, 1, 6], fov: 45 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <div className="absolute bottom-2 left-2 font-mono text-[9px] text-starlight/30 pointer-events-none">
        DRAG TO ROTATE · SCROLL TO ZOOM
      </div>
    </div>
  );
}
