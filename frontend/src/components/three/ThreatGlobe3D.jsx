import { useRef, useMemo, useState } from 'react';
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
  { lat: 40.7, lng: -74, severity: 'critical', label: 'New York' },
  { lat: 51.5, lng: -0.1, severity: 'high', label: 'London' },
  { lat: 35.6, lng: 139.7, severity: 'medium', label: 'Tokyo' },
  { lat: 55.75, lng: 37.6, severity: 'high', label: 'Moscow' },
  { lat: -33.8, lng: 151.2, severity: 'low', label: 'Sydney' },
  { lat: 1.35, lng: 103.8, severity: 'medium', label: 'Singapore' },
  { lat: 28.6, lng: 77.2, severity: 'critical', label: 'New Delhi' },
  { lat: -23.5, lng: -46.6, severity: 'low', label: 'São Paulo' },
];

function ThreatPoint({ position, severity, index }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.low;

  useFrame((state) => {
    const t = state.clock.elapsedTime + index * 0.7;
    const pulse = 1 + Math.sin(t * 3) * 0.35;
    if (meshRef.current) {
      meshRef.current.scale.setScalar(pulse);
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(pulse * 2.2);
      glowRef.current.material.opacity = 0.15 + Math.sin(t * 3) * 0.1;
    }
  });

  return (
    <group position={position}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

function AttackArc({ from, to }) {
  const curve = useMemo(() => {
    const start = latLngToVector3(from.lat, from.lng, 2.02);
    const end = latLngToVector3(to.lat, to.lng, 2.02);
    const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(2.6);
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [from, to]);

  const points = useMemo(() => curve.getPoints(32), [curve]);
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#22d3ee" transparent opacity={0.25} />
    </line>
  );
}

function Globe() {
  const groupRef = useRef();
  const wireRef = useRef();

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.1;
    if (wireRef.current) wireRef.current.rotation.y -= delta * 0.04;
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

  const arcs = useMemo(
    () => [
      [points[0], points[2]],
      [points[3], points[6]],
      [points[1], points[4]],
    ],
    [points]
  );

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[2, 56, 56]} />
        <meshStandardMaterial color="#142a45" metalness={0.55} roughness={0.3} transparent opacity={0.95} />
      </mesh>
      <mesh ref={wireRef}>
        <sphereGeometry args={[2.015, 36, 36]} />
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.18} />
      </mesh>
      {arcs.map(([a, b], i) => (
        <AttackArc key={i} from={a} to={b} />
      ))}
      {points.map((p) => (
        <ThreatPoint key={p.key} position={p.position} severity={p.severity} index={p.key} />
      ))}
      <pointLight position={[8, 5, 8]} intensity={1.8} color="#22d3ee" />
      <pointLight position={[-6, -3, -4]} intensity={0.6} color="#a78bfa" />
      <ambientLight intensity={0.45} />
    </group>
  );
}

function GlobeFallback() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#0c1929] to-[#030712] p-6 text-center">
      <div className="w-32 h-32 rounded-full border border-cyan-500/30 bg-cyan-500/5 flex items-center justify-center mb-4 relative">
        <div className="absolute inset-2 rounded-full border border-dashed border-cyan-500/20 animate-spin" style={{ animationDuration: '20s' }} />
        <span className="text-3xl">🌐</span>
      </div>
      <p className="text-xs font-mono text-gray-500 uppercase">Threat Map · Simulated</p>
      <p className="text-[11px] text-gray-600 mt-2">3D view unavailable — showing static fallback</p>
    </div>
  );
}

export default function ThreatGlobe3D({ className = '', recentEvent }) {
  const [webglFailed, setWebglFailed] = useState(false);
  const recentLabel = recentEvent?.ip
    ? `${recentEvent.ip}${recentEvent.metadata?.country ? ` · ${recentEvent.metadata.country}` : ''}`
    : 'Awaiting telemetry…';

  if (webglFailed) {
    return (
      <div className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-black/40 ${className}`}>
        <GlobeFallback />
        <div className="absolute bottom-3 left-3 right-3 z-20 text-[10px] text-gray-500 font-mono">
          <span>Recent: {recentLabel}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-black/40 ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-t from-soc-bg/90 via-transparent to-transparent z-10 pointer-events-none" />
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', () => setWebglFailed(true), { once: true });
        }}
      >
        <color attach="background" args={['#030712']} />
        <Stars radius={80} depth={40} count={1400} factor={3.5} saturation={0} fade speed={0.5} />
        <Globe />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.4} />
      </Canvas>
      <div className="absolute top-3 left-3 z-20">
        <span className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-wider">Threat Map · Simulated</span>
      </div>
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[10px] text-gray-500 font-mono">
        <span className="truncate">Recent: {recentLabel}</span>
        <span className="flex flex-wrap gap-x-3 gap-y-1 shrink-0">
          <span className="text-red-400">● critical</span>
          <span className="text-orange-400">● high</span>
          <span className="text-amber-400">● medium</span>
          <span className="text-cyan-400">● low</span>
        </span>
      </div>
    </div>
  );
}
