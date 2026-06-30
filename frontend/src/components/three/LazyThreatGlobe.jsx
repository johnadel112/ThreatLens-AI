import { lazy, Suspense } from 'react';
import { SkeletonLine } from '../ui/LoadingSkeleton';

const ThreatGlobe3D = lazy(() => import('./ThreatGlobe3D'));

export default function LazyThreatGlobe({ className = 'h-[320px]', recentEvent }) {
  return (
    <Suspense fallback={<SkeletonLine className={`w-full ${className}`} />}>
      <ThreatGlobe3D className={className} recentEvent={recentEvent} />
    </Suspense>
  );
}
