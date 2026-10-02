'use client';

/**
 * Global Leaflet Guard for Next.js & React 18/19.
 *
 * ROOT CAUSE THIS SOLVES:
 * Leaflet strictly throws `Error: Map container is already initialized.`
 * whenever `L.map()` or `<MapContainer>` is called on a DOM container that
 * still has `_leaflet_id` attached to it.
 *
 * In React 18/19 development (StrictMode), Turbopack/HMR Fast Refresh,
 * or modal re-renders, React re-executes component mounts and callback refs
 * on the same DOM element. If the previous map instance wasn't cleaned up yet,
 * or left `_leaflet_id` on the DOM node, Leaflet crashes the entire application.
 *
 * HOW THIS GUARD WORKS:
 * 1. Monkey-patches Leaflet's prototype `_initContainer`.
 * 2. If a map instance is already attached to this DOM container (`container._leaflet_map`),
 *    it gracefully removes the previous instance first.
 * 3. If a stale `_leaflet_id` remains on the container, it safely deletes it.
 * 4. Stashes the active map instance on `container._leaflet_map` so it can be cleanly
 *    dereferenced and cleaned up.
 * 5. Guarantees that no map anywhere in the frontend will ever throw
 *    "Map container is already initialized".
 */

export function patchLeaflet(L: any) {
  if (!L || !L.Map || !L.Map.prototype) return;

  const proto = L.Map.prototype as any;
  if (proto._isAlreadyGuarded) return;

  const originalInitContainer = proto._initContainer;

  proto._initContainer = function (id: any) {
    const container = L.DomUtil?.get
      ? L.DomUtil.get(id)
      : typeof id === 'string'
      ? document.getElementById(id)
      : id;

    if (container) {
      // 1. If an active map instance is still attached to this container, destroy it cleanly
      if (container._leaflet_map && typeof container._leaflet_map.remove === 'function') {
        try {
          container._leaflet_map.remove();
        } catch {
          // Ignore errors during emergency cleanup
        }
        container._leaflet_map = null;
      }

      // 2. Clear any lingering _leaflet_id left on the DOM node (StrictMode / Fast Refresh)
      if (container._leaflet_id != null) {
        try {
          delete container._leaflet_id;
        } catch {
          container._leaflet_id = undefined;
        }
      }

      // 3. Track this new map instance on the DOM container element
      container._leaflet_map = this;
    }

    return originalInitContainer.call(this, id);
  };

  const originalRemove = proto.remove;
  proto.remove = function () {
    if (this._container && this._container._leaflet_map === this) {
      this._container._leaflet_map = null;
    }
    return originalRemove.call(this);
  };

  proto._isAlreadyGuarded = true;
}
