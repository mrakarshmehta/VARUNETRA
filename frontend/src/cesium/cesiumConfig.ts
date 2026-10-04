/**
 * CesiumJS Configuration & Provider Setup
 * 
 * VARUNETRA 3D Digital Twin — Cesium Engine Configuration
 * 
 * IMPORTANT: The application MUST work without a paid Cesium Ion API key.
 * When no key is configured, the system falls back to:
 *   - Ellipsoid terrain (flat WGS84 reference surface)
 *   - OpenStreetMap imagery tiles
 * 
 * ATTRIBUTION:
 *   - CesiumJS: Apache 2.0 License — https://github.com/CesiumGS/cesium
 *   - OpenStreetMap: ODbL — https://www.openstreetmap.org/copyright
 *   - Cesium World Terrain: Cesium Ion Terms of Service (requires API key)
 */

import * as Cesium from "cesium";

// ────────────────────────────────────────
// Cesium Ion Token — Optional
// ────────────────────────────────────────
// Set via environment variable: VITE_CESIUM_ION_TOKEN
// If not set, the application uses free/open providers only.
const CESIUM_ION_TOKEN = (import.meta as any).env?.VITE_CESIUM_ION_TOKEN || "";

export interface CesiumProviderStatus {
  terrain: "CESIUM_WORLD_TERRAIN" | "ELLIPSOID_FALLBACK";
  imagery: "CESIUM_ION" | "OSM_TILES";
  ionConnected: boolean;
  disclaimer: string;
}

export function initializeCesiumToken(): CesiumProviderStatus {
  if (CESIUM_ION_TOKEN) {
    Cesium.Ion.defaultAccessToken = CESIUM_ION_TOKEN;
    return {
      terrain: "CESIUM_WORLD_TERRAIN",
      imagery: "CESIUM_ION",
      ionConnected: true,
      disclaimer: "Cesium Ion connected — terrain and imagery from Cesium Ion.",
    };
  }

  return {
    terrain: "ELLIPSOID_FALLBACK",
    imagery: "OSM_TILES",
    ionConnected: false,
    disclaimer:
      "No Cesium Ion token configured. Using ellipsoid terrain and OpenStreetMap imagery. " +
      "Set VITE_CESIUM_ION_TOKEN for photorealistic 3D tiles.",
  };
}

export function createTerrainProvider(
  status: CesiumProviderStatus
): Cesium.TerrainProvider {
  if (status.ionConnected) {
    try {
      return Cesium.createWorldTerrainAsync() as any;
    } catch {
      // fall through
    }
  }
  return new Cesium.EllipsoidTerrainProvider();
}

export function createImageryProvider(
  status: CesiumProviderStatus
): Cesium.ImageryProvider {
  if (status.ionConnected) {
    try {
      return Cesium.IonImageryProvider.fromAssetId(3) as any;
    } catch {
      // fall through
    }
  }
  return new Cesium.OpenStreetMapImageryProvider({
    url: "https://tile.openstreetmap.org/",
  });
}

// Patna Pilot Basin center (same as 2D Leaflet)
export const PATNA_CENTER = {
  longitude: 85.145,
  latitude: 25.6093,
  height: 8000, // initial camera height in meters
};

export const PATNA_BOUNDS = {
  west: 85.125,
  south: 25.585,
  east: 85.175,
  north: 25.630,
};
