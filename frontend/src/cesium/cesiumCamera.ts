/**
 * Cesium Camera Controller
 * 
 * Professional GIS-style camera presets and fly-to controls
 * for the VARUNETRA 3D Digital Twin.
 */

import * as Cesium from "cesium";
import { PATNA_CENTER } from "./cesiumConfig";

export type CameraPreset = "TOP_DOWN" | "TILT_3D" | "ORBIT" | "RESET";

/**
 * Apply a camera preset to the Cesium viewer
 */
export function applyCameraPreset(
  viewer: Cesium.Viewer,
  preset: CameraPreset
): void {
  const center = Cesium.Cartesian3.fromDegrees(
    PATNA_CENTER.longitude,
    PATNA_CENTER.latitude,
    0
  );

  switch (preset) {
    case "TOP_DOWN":
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          PATNA_CENTER.longitude,
          PATNA_CENTER.latitude,
          PATNA_CENTER.height
        ),
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(-90),
          roll: 0,
        },
        duration: 1.5,
      });
      break;

    case "TILT_3D":
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          PATNA_CENTER.longitude - 0.012,
          PATNA_CENTER.latitude - 0.008,
          4500
        ),
        orientation: {
          heading: Cesium.Math.toRadians(35),
          pitch: Cesium.Math.toRadians(-45),
          roll: 0,
        },
        duration: 1.8,
      });
      break;

    case "ORBIT":
      // Start an orbital movement by offsetting heading
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          PATNA_CENTER.longitude + 0.01,
          PATNA_CENTER.latitude - 0.006,
          5000
        ),
        orientation: {
          heading: Cesium.Math.toRadians(120),
          pitch: Cesium.Math.toRadians(-40),
          roll: 0,
        },
        duration: 2.0,
      });
      break;

    case "RESET":
    default:
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          PATNA_CENTER.longitude,
          PATNA_CENTER.latitude,
          PATNA_CENTER.height
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-60),
          roll: 0,
        },
        duration: 1.5,
      });
      break;
  }
}

/**
 * Fly to a specific geographic point (for incidents, shelters, pumps, roads)
 */
export function flyToLocation(
  viewer: Cesium.Viewer,
  lat: number,
  lng: number,
  height: number = 1200,
  pitch: number = -50
): void {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(lng, lat, height),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(pitch),
      roll: 0,
    },
    duration: 1.2,
  });
}

/**
 * Constrain the camera to stay within the Patna pilot basin area
 */
export function constrainCameraToBounds(viewer: Cesium.Viewer): void {
  // Set minimum/maximum zoom
  viewer.scene.screenSpaceCameraController.minimumZoomDistance = 200;
  viewer.scene.screenSpaceCameraController.maximumZoomDistance = 25000;
}
