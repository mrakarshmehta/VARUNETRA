/**
 * Cesium 3D Flood Layer Renderer
 * 
 * Renders flood depth polygons as 3D extruded entities in the Cesium scene.
 * Uses the same depth classification as the 2D Leaflet GISMap:
 *   < 10 cm, 10–20 cm, 20–40 cm, 40–60 cm, > 60 cm
 * 
 * All geometry corresponds to VARUNETRA synthetic Patna pilot data.
 * Provenance: SYNTHETIC / SIMULATED
 */

import * as Cesium from "cesium";

export interface FloodZone3D {
  name: string;
  bounds: number[][]; // [[lat,lng], ...]
  depth: number; // cm
}

// Same depth zones as GISMap.tsx
export function getFloodDepthZones(maxDepthCm: number): FloodZone3D[] {
  if (maxDepthCm <= 5) return [];

  return [
    {
      name: "Rajendra Nagar Central Depression",
      bounds: [
        [25.5995, 85.151],
        [25.6045, 85.151],
        [25.6045, 85.159],
        [25.5995, 85.159],
      ],
      depth: maxDepthCm,
    },
    {
      name: "Saidpur Culvert Backwater Zone",
      bounds: [
        [25.608, 85.153],
        [25.613, 85.153],
        [25.613, 85.161],
        [25.608, 85.161],
      ],
      depth: Math.round(maxDepthCm * 0.75),
    },
    {
      name: "Kankarbagh Colony Mor Underpass",
      bounds: [
        [25.596, 85.137],
        [25.601, 85.137],
        [25.601, 85.144],
        [25.596, 85.144],
      ],
      depth: Math.round(maxDepthCm * 0.6),
    },
    {
      name: "Ashok Rajpath Medical Corridor",
      bounds: [
        [25.6165, 85.148],
        [25.6205, 85.148],
        [25.6205, 85.155],
        [25.6165, 85.155],
      ],
      depth: Math.round(maxDepthCm * 0.4),
    },
  ];
}

/**
 * Get the color for a given flood depth in cm.
 */
export function getFloodColor(depthCm: number): Cesium.Color {
  if (depthCm > 60) return Cesium.Color.fromCssColorString("#dc2626").withAlpha(0.6);
  if (depthCm > 40) return Cesium.Color.fromCssColorString("#ea580c").withAlpha(0.55);
  if (depthCm > 20) return Cesium.Color.fromCssColorString("#f59e0b").withAlpha(0.48);
  if (depthCm > 10) return Cesium.Color.fromCssColorString("#60a5fa").withAlpha(0.4);
  return Cesium.Color.fromCssColorString("#93c5fd").withAlpha(0.3);
}

export function getDepthBandLabel(depthCm: number): string {
  if (depthCm > 60) return "> 60 cm (Extreme Inundation)";
  if (depthCm > 40) return "40–60 cm (Severe Surcharge)";
  if (depthCm > 20) return "20–40 cm (Moderate Ponding)";
  if (depthCm > 10) return "10–20 cm (Caution)";
  return "< 10 cm (Minor)";
}

/**
 * Render flood depth zones as extruded 3D polygons into a Cesium DataSource.
 * Height extrusion = depth_cm * scaleFactor (visual amplification for 3D)
 */
export function renderFloodEntities(
  dataSource: Cesium.CustomDataSource,
  maxDepthCm: number,
  extrusionScale: number = 3.0
): void {
  dataSource.entities.removeAll();

  const zones = getFloodDepthZones(maxDepthCm);

  zones.forEach((zone) => {
    if (zone.depth <= 5) return;

    const positions = zone.bounds.map((b) =>
      Cesium.Cartesian3.fromDegrees(b[1], b[0])
    );
    // Close the polygon
    positions.push(positions[0]);

    const color = getFloodColor(zone.depth);
    const extrudedHeight = zone.depth * extrusionScale / 100; // Convert cm to meters, then scale

    dataSource.entities.add({
      name: zone.name,
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(
          zone.bounds.map((b) => Cesium.Cartesian3.fromDegrees(b[1], b[0]))
        ),
        height: 0,
        extrudedHeight: Math.max(extrudedHeight, 0.5), // minimum visual height
        material: color,
        outline: true,
        outlineColor: color.withAlpha(0.9),
        outlineWidth: 1,
        classificationType: Cesium.ClassificationType.BOTH,
      },
      description: `<div style="font-family:Inter,sans-serif;font-size:13px;padding:8px">
        <strong>${zone.name}</strong><br/>
        Depth Band: <b>${getDepthBandLabel(zone.depth)}</b><br/>
        Simulated Water Depth: <b>${zone.depth} cm</b><br/>
        Confidence: 90% [Quantile Surrogate]<br/>
        <span style="color:#64748b;font-size:11px">Provenance: SYNTHETIC / SIMULATED</span>
      </div>`,
    });
  });
}
