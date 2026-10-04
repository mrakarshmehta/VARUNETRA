"""
VARUNETRA 0-3 Hour Flood Nowcast Service
Couples rainfall nowcast hyetograph, 1D drainage hydraulics, and 2D street inundation.
Generates temporal steps: NOW, +15 MIN, +30 MIN, +45 MIN, +60 MIN, +90 MIN, +120 MIN, +150 MIN, +180 MIN.
"""

from typing import List, Dict, Any, Optional
import datetime
from app.core.config import (
    settings,
    DataProvenance,
    RiskLevel,
    RoadStatus,
    VehicleType,
)
from app.schemas.common import ProvenanceMeta, GeoJSONFeature, GeoJSONGeometry, GeoJSONFeatureCollection
from app.schemas.nowcast import (
    NowcastTimeStep,
    NowcastSeriesResponse,
    InundationPrediction,
    RoadImpact,
    DrainageStress,
)
from simulation.hydrology import CoupledUrbanHydroEngine
from app.services.ml_service import ml_service
from app.services.terrain_engine import urban_terrain_engine


# Monitored road segments in Patna Pilot Urban Basin
PILOT_ROADS = [
    {
        "road_id": "ROAD-01",
        "name": "Kankarbagh Main Road",
        "coords": [[85.1400, 25.6025], [85.1480, 25.6015], [85.1550, 25.6005]],
        "elevation_m": 48.2,
        "base_speed_kmh": 40.0,
        "length_km": 1.5,
        "catchment_id": "CAT-01",
    },
    {
        "road_id": "ROAD-02",
        "name": "Rajendra Nagar Overbridge Approach",
        "coords": [[85.1550, 25.6005], [85.1580, 25.6050], [85.1620, 25.6080]],
        "elevation_m": 47.6,  # Depression hotspot
        "base_speed_kmh": 35.0,
        "length_km": 0.9,
        "catchment_id": "CAT-02",
    },
    {
        "road_id": "ROAD-03",
        "name": "Saidpur Canal Road",
        "coords": [[85.1620, 25.6080], [85.1670, 25.6120], [85.1720, 25.6150]],
        "elevation_m": 47.2,  # Severe low elevation
        "base_speed_kmh": 30.0,
        "length_km": 1.2,
        "catchment_id": "CAT-03",
    },
    {
        "road_id": "ROAD-04",
        "name": "Bypass Link to Patna Junction",
        "coords": [[85.1320, 25.5990], [85.1400, 25.6025], [85.1420, 25.6080]],
        "elevation_m": 49.5,
        "base_speed_kmh": 45.0,
        "length_km": 1.8,
        "catchment_id": "CAT-04",
    },
    {
        "road_id": "ROAD-05",
        "name": "Fraser Road Commercial Corridor",
        "coords": [[85.1380, 25.6120], [85.1400, 25.6150], [85.1420, 25.6180]],
        "elevation_m": 49.8,
        "base_speed_kmh": 35.0,
        "length_km": 0.8,
        "catchment_id": "CAT-06",
    },
    {
        "road_id": "ROAD-06",
        "name": "Gandhi Maidan Periphery Arterial",
        "coords": [[85.1420, 25.6180], [85.1470, 25.6210], [85.1520, 25.6190]],
        "elevation_m": 50.8,
        "base_speed_kmh": 40.0,
        "length_km": 1.4,
        "catchment_id": "CAT-05",
    },
    {
        "road_id": "ROAD-07",
        "name": "Ashok Rajpath High Embankment",
        "coords": [[85.1520, 25.6190], [85.1600, 25.6220], [85.1700, 25.6200]],
        "elevation_m": 51.5,  # High ridge road
        "base_speed_kmh": 40.0,
        "length_km": 2.0,
        "catchment_id": "CAT-05",
    },
    {
        "road_id": "ROAD-08",
        "name": "Patliputra Station Radial Road",
        "coords": [[85.1180, 25.6250], [85.1280, 25.6180], [85.1380, 25.6120]],
        "elevation_m": 51.0,
        "base_speed_kmh": 50.0,
        "length_km": 2.2,
        "catchment_id": "CAT-07",
    },
    {
        "road_id": "ROAD-09",
        "name": "Bargawan Colony Interior Lane",
        "coords": [[85.1350, 25.5900], [85.1380, 25.5920], [85.1440, 25.5950]],
        "elevation_m": 47.0,  # Deepest bowl
        "base_speed_kmh": 25.0,
        "length_km": 1.1,
        "catchment_id": "CAT-04",
    },
    {
        "road_id": "ROAD-10",
        "name": "Kumhrar Ancient Sump Avenue",
        "coords": [[85.1720, 25.6020], [85.1780, 25.6000], [85.1840, 25.5940]],
        "elevation_m": 48.0,
        "base_speed_kmh": 35.0,
        "length_km": 1.7,
        "catchment_id": "CAT-03",
    },
]


class NowcastEngine:
    def __init__(self):
        self.hydro_engine = CoupledUrbanHydroEngine(outfall_river_stage_m=49.85)
        # Precomputed cached nowcast series
        self._cached_series: Optional[NowcastSeriesResponse] = None
        self._last_generation_time: float = 0.0

    def compute_nowcast_series(self, force_refresh: bool = False) -> NowcastSeriesResponse:
        """
        Calculates the complete 0-3 hour nowcast curve at 15-minute resolution:
        NOW, +15 MIN, +30 MIN, +45 MIN, +60 MIN, +90 MIN, +120 MIN, +150 MIN, +180 MIN
        """
        now = datetime.datetime.now(datetime.timezone.utc)
        
        # Steps definition: (offset_min, label, rain_intensity_mmh, cumulative_rain_mm)
        time_steps_config = [
            (0, "NOW", 48.5, 48.5),
            (15, "+15 MIN", 64.0, 64.5),
            (30, "+30 MIN", 82.0, 85.0),
            (45, "+45 MIN", 92.5, 108.1),
            (60, "+60 MIN", 70.0, 125.6),
            (90, "+90 MIN", 45.0, 148.1),
            (120, "+120 MIN", 25.0, 160.6),
            (150, "+150 MIN", 12.0, 166.6),
            (180, "+180 MIN", 4.0, 168.0),
        ]

        steps_result: List[NowcastTimeStep] = []

        # Reset simulation state
        self.hydro_engine = CoupledUrbanHydroEngine(outfall_river_stage_m=49.85)

        for idx, (offset_m, label, rain_rate, cum_rain) in enumerate(time_steps_config):
            # Run coupled hydraulic step
            sim_out = self.hydro_engine.simulate_step(
                rainfall_intensity_mmh=rain_rate,
                accumulated_rain_mm=cum_rain,
                dt_seconds=900.0,
                override_river_stage=49.85
            )

            # 1. Drainage stress items
            drainage_stress_list: List[DrainageStress] = []
            for cid, conduit in self.hydro_engine.conduits.items():
                c_st = sim_out["conduit_states"][cid]
                drainage_stress_list.append(DrainageStress(
                    node_or_pipe_id=cid,
                    name=conduit.name,
                    type="conduit",
                    capacity_utilization_pct=c_st["utilization_pct"],
                    surcharged=c_st["surcharged"],
                    backflow_risk=c_st["backflow"],
                    blockage_pct=conduit.blockage_fraction * 100.0,
                    water_level_m=46.5,
                    max_capacity_m3s=c_st["capacity_m3s"],
                    current_flow_m3s=c_st["flow_m3s"],
                ))

            # 2. Zone Inundation predictions
            inundation_list: List[InundationPrediction] = []
            for cat_id, cat in self.hydro_engine.subcatchments.items():
                node = self.hydro_engine.nodes[cat.outlet_node_id]
                node_st = sim_out["node_states"][node.node_id]
                
                # ML Feature Vector
                c_out = [self.hydro_engine.conduits[c] for c in node.outflow_conduits if c in self.hydro_engine.conduits]
                cap_m3s = sum(c.full_flow_capacity_m3s() for c in c_out) if c_out else 2.5
                blk_pct = float(sum(c.blockage_fraction * 100 for c in c_out) / len(c_out)) if c_out else 20.0
                util_pct = float(sum(sim_out["conduit_states"][c.conduit_id]["utilization_pct"] for c in c_out) / len(c_out)) if c_out else 50.0
                dist_m = 2500.0

                f_vector = [
                    rain_rate,
                    rain_rate * 0.25,
                    rain_rate * 0.5,
                    rain_rate,
                    cum_rain,
                    node.rim_elevation_m,
                    cat.avg_slope_pct,
                    cat.imperviousness_pct,
                    cat.area_hectares,
                    cap_m3s,
                    blk_pct,
                    util_pct,
                    49.85,
                    dist_m,
                ]

                ml_pred = ml_service.predict_depth_and_risk(f_vector)
                
                # Combined physics + ML depth
                hydraulic_depth = float(node_st["ponding_depth_cm"])
                combined_depth = round(0.55 * hydraulic_depth + 0.45 * ml_pred["predicted_depth_cm"], 1)

                # Query terrain intelligence for outlet node coordinates
                terrain_info = urban_terrain_engine.inspect_point(node.lat, node.lng)

                contributors = []
                if rain_rate >= 60.0:
                    contributors.append("Heavy Rainfall Burst")
                if util_pct >= 90.0:
                    contributors.append("Drainage Surcharge & Backpressure")
                if node.rim_elevation_m < 48.5:
                    contributors.append("Low Topographic Basin")
                if terrain_info.is_depression:
                    contributors.append(f"Local Depression Sink ({terrain_info.depression_depth_cm:.1f} cm)")
                if terrain_info.flow_accumulation_level.value in ["HIGH", "SEVERE"]:
                    contributors.append("High Overland Flow Accumulation")
                if blk_pct >= 30.0:
                    contributors.append("Debris / Silt Restriction")

                inundation_list.append(InundationPrediction(
                    zone_id=cat_id,
                    zone_name=cat.name,
                    catchment_id=cat_id,
                    current_depth_cm=hydraulic_depth,
                    predicted_depth_cm=combined_depth,
                    depth_band_min_cm=round(combined_depth * 0.75, 1),
                    depth_band_max_cm=round(combined_depth * 1.3 + 2.0, 1),
                    flood_probability=ml_pred["flood_probability"],
                    risk_level=ml_pred["risk_level"],
                    uncertainty=ml_pred["uncertainty"],
                    confidence=ml_pred["confidence"],
                    time_to_peak_min=max(15, 60 - offset_m) if offset_m <= 60 else 0,
                    drainage_surcharge_prob=min(1.0, util_pct / 100.0),
                    primary_contributors=contributors or ["General Urban Runoff"],
                    terrain_elevation_m=terrain_info.ground_elevation_m,
                    terrain_slope_deg=terrain_info.slope_degrees,
                    flow_accumulation_level=terrain_info.flow_accumulation_level.value,
                    is_depression=terrain_info.is_depression,
                    depression_depth_cm=terrain_info.depression_depth_cm,
                    flood_accumulation_potential=terrain_info.flood_accumulation_potential.value,
                    drainage_proximity_m=terrain_info.drainage_distance_m,
                ))

            # 3. Road impact states
            road_impacts: List[RoadImpact] = []
            for r in PILOT_ROADS:
                cat = self.hydro_engine.subcatchments.get(r["catchment_id"])
                outlet_node = self.hydro_engine.nodes.get(cat.outlet_node_id) if cat else None
                node_ponding = sim_out["node_states"][outlet_node.node_id]["ponding_depth_cm"] if outlet_node else 0.0

                # Road elevation adjustment relative to catchment
                elevation_diff = max(0.0, (outlet_node.rim_elevation_m if outlet_node else 48.5) - r["elevation_m"])
                road_depth = max(0.0, round(node_ponding * 0.7 + elevation_diff * 20.0, 1))

                # Passability evaluation
                p_thresh = settings.PASSABILITY_THRESHOLDS
                pass_ped = road_depth < p_thresh[VehicleType.PEDESTRIAN.value]["restricted"] * 100.0
                pass_light = road_depth < p_thresh[VehicleType.LIGHT_VEHICLE.value]["restricted"] * 100.0
                pass_heavy = road_depth < p_thresh[VehicleType.HEAVY_VEHICLE.value]["restricted"] * 100.0
                pass_emerg = road_depth < p_thresh[VehicleType.EMERGENCY_RESCUE.value]["blocked"] * 100.0

                # Road status
                if road_depth < 10.0:
                    status = RoadStatus.OPEN
                    speed_factor = 1.0
                    risk = RiskLevel.SAFE
                elif road_depth < 22.0:
                    status = RoadStatus.CAUTION
                    speed_factor = 0.65
                    risk = RiskLevel.WARNING
                elif road_depth < 45.0:
                    status = RoadStatus.RESTRICTED
                    speed_factor = 0.25
                    risk = RiskLevel.HIGH
                else:
                    status = RoadStatus.BLOCKED
                    speed_factor = 0.0
                    risk = RiskLevel.CRITICAL

                # Midpoint terrain inspection
                mid_idx = len(r["coords"]) // 2
                road_lon, road_lat = r["coords"][mid_idx][0], r["coords"][mid_idx][1]
                road_terrain = urban_terrain_engine.inspect_point(road_lat, road_lon)

                road_impacts.append(RoadImpact(
                    road_id=r["road_id"],
                    name=r["name"],
                    status=status,
                    predicted_depth_cm=road_depth,
                    passable_pedestrian=pass_ped,
                    passable_light=pass_light,
                    passable_heavy=pass_heavy,
                    passable_emergency=pass_emerg,
                    risk_level=risk,
                    speed_factor=speed_factor,
                    terrain_elevation_m=road_terrain.ground_elevation_m,
                    is_depression=road_terrain.is_depression,
                    local_relief_m=road_terrain.local_relief_m,
                    flood_accumulation_potential=road_terrain.flood_accumulation_potential.value,
                ))

            # Summary metrics for time step
            depths = [z.predicted_depth_cm for z in inundation_list]
            avg_depth = round(float(sum(depths) / max(1, len(depths))), 1)
            max_depth = round(float(max(depths)) if depths else 0.0, 1)
            high_risk_roads = sum(1 for rd in road_impacts if rd.status in [RoadStatus.RESTRICTED, RoadStatus.BLOCKED])
            surcharged_drains = sum(1 for ds in drainage_stress_list if ds.surcharged)
            critical_zones = sum(1 for z in inundation_list if z.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL])
            inundation_area = round(sum(0.35 for z in inundation_list if z.predicted_depth_cm > 10.0), 2)

            # Generate GeoJSON for road segments with their dynamic depth/risk
            geojson_features = []
            for r, imp in zip(PILOT_ROADS, road_impacts):
                geojson_features.append(GeoJSONFeature(
                    id=r["road_id"],
                    geometry=GeoJSONGeometry(type="LineString", coordinates=r["coords"]),
                    properties={
                        "road_id": r["road_id"],
                        "name": r["name"],
                        "status": imp.status.value,
                        "depth_cm": imp.predicted_depth_cm,
                        "risk_level": imp.risk_level.value,
                        "speed_factor": imp.speed_factor,
                        "passable_light": imp.passable_light,
                        "passable_heavy": imp.passable_heavy,
                        "passable_emergency": imp.passable_emergency,
                        "elevation_m": imp.terrain_elevation_m or r.get("elevation_m", 48.0),
                        "is_depression": imp.is_depression or False,
                    }
                ))

            geojson_roads = GeoJSONFeatureCollection(features=geojson_features)

            steps_result.append(NowcastTimeStep(
                step_index=idx,
                offset_minutes=offset_m,
                label=label,
                rainfall_rate_mmh=rain_rate,
                accumulated_rainfall_mm=cum_rain,
                average_flood_depth_cm=avg_depth,
                max_flood_depth_cm=max_depth,
                active_inundation_area_sqkm=inundation_area,
                high_risk_roads_count=high_risk_roads,
                surcharged_drain_count=surcharged_drains,
                critical_zones_count=critical_zones,
                inundations=inundation_list,
                affected_roads=road_impacts,
                drainage_stress=drainage_stress_list,
                geojson_inundation=geojson_roads,
            ))

        terrain_meta = urban_terrain_engine.get_metadata()
        response = NowcastSeriesResponse(
            provenance=ProvenanceMeta(
                data_mode=DataProvenance.SIMULATED,
                source="VARUNETRA Coupled 1D-2D Hydrodynamic & ML Surrogate Engine",
                freshness_seconds=30,
                timestamp=now.isoformat(),
                is_real_world_verified=False,
                notes="0-3 hour high-resolution coupled nowcast for Patna Urban Catchment"
            ),
            city=settings.PILOT_CITY,
            generated_at=now.isoformat(),
            lead_time_minutes=180,
            time_steps=steps_result,
            model_version="1.2.0-rf-histgbm",
            hydrodynamic_engine="Coupled 1D-2D DEM Drainage Hydraulic Layer v1.0",
            terrain_source=terrain_meta.source_name,
            terrain_resolution=f"{terrain_meta.horizontal_resolution_m:.0f}m ({terrain_meta.provenance.value})",
            terrain_validation_disclaimer=getattr(terrain_meta, "limitations_and_disclaimer", None) or terrain_meta.coverage_disclaimer,
        )

        self._cached_series = response
        return response

    def get_current_roads(self) -> List[Dict[str, Any]]:
        nowcast = self.compute_nowcast_series()
        current_step = nowcast.time_steps[0]
        result = []
        for r, imp in zip(PILOT_ROADS, current_step.affected_roads):
            res = dict(r)
            res["status"] = imp.status.value
            res["depth_cm"] = imp.predicted_depth_cm
            res["risk_level"] = imp.risk_level.value
            res["passable_pedestrian"] = imp.passable_pedestrian
            res["passable_light"] = imp.passable_light
            res["passable_heavy"] = imp.passable_heavy
            res["passable_emergency"] = imp.passable_emergency
            result.append(res)
        return result


nowcast_engine = NowcastEngine()
