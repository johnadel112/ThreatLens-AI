import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#22d3ee',
  info: '#60a5fa',
};

function latLngToVector3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

const ATTACK_POINTS = [
  { lat: 40.7, lng: -74, severity: 'critical' },
  { lat: 51.5, lng: -0.1, severity: 'high' },
  { lat: 35.6, lng: 139.7, severity: 'medium' },
  { lat: 55.75, lng: 37.6, severity: 'high' },
  { lat: -33.8, lng: 151.2, severity: 'low' },
  { lat: 1.35, lng: 103.8, severity: 'medium' },
  { lat: 28.6, lng: 77.2, severity: 'critical' },
  { lat: -23.5, lng: -46.6, severity: 'low' },
];

function Globe() {
  const groupRef = useRef();
  const wireRef = useRef();

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.12;
    if (wireRef.current) wireRef.current.rotation.y -= delta * 0.05;
  });

  const points = useMemo(
    () =>
      ATTACK_POINTS.map((p, i) => ({
        ...p,
        position: latLngToVector3(p.lat, p.lng, 2.02),
        key: i,
      })),
    []
  );

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[2, 48, 48]} />
        <meshStandardMaterial color="#0c1929" metalness={0.6} roughness={0.35} transparent opacity={0.92} />
      </mesh>
      <mesh ref={wireRef}>
        <sphereGeometry args={[2.01, 32, 32]} />
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.12} />
      </mesh>
      {points.map((p) => (
        <mesh key={p.key} position={p.position}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={SEVERITY_COLORS[p.severity] || SEVERITY_COLORS.low} />
        </mesh>
      ))}
      <pointLight position={[6, 4, 6]} intensity={1.2} color="#22d3ee" />
      <ambientLight intensity={0.35} />
    </group>
  );
}

export default function ThreatGlobe3D({ className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-black/40 ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-t from-soc-bg via-transparent to-transparent z-10 pointer-events-none" />
      <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={['#030712']} />
        <Stars radius={80} depth={40} count={1200} factor={3} saturation={0} fade speed={0.6} />
        <Globe />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.4} />
      </Canvas>
      <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between text-[10px] text-gray-500 font-mono">
        <span>THREAT MAP · SIMULATED</span>
        <span className="flex gap-2">
          <span className="text-red-400">● critical</span>
          <span className="text-cyan-400">● low</span>
        </span>
      </div>
    </div>
  );
}
