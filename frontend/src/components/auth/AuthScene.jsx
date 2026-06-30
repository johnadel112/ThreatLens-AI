import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';

function Scene() {
  return (
    <>
      <color attach="background" args={['#030712']} />
      <Stars radius={60} depth={30} count={2000} factor={4} saturation={0} fade speed={0.5} />
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#22d3ee" />
    </>
  );
}

export default function AuthScene() {
  return (
    <div className="absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-cyber-grid bg-grid opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-br from-soc-bg via-transparent to-purple-950/20" />
      <Canvas className="!absolute inset-0" dpr={[1, 1.25]} camera={{ position: [0, 0, 1] }}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-t from-soc-bg via-soc-bg/60 to-transparent" />
    </div>
  );
}
