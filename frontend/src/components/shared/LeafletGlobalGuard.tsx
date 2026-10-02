'use client';

import { useEffect } from 'react';
import { patchLeaflet } from '@/lib/leafletGuard';

/**
 * Initializes the Leaflet global safety guard on client mount.
 * Prevents "Map container is already initialized" anywhere in the app.
 */
export default function LeafletGlobalGuard() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    import('leaflet').then((L) => {
      patchLeaflet(L.default || L);
    });
  }, []);

  return null;
}
