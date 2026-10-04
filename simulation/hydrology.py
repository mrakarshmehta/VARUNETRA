"""
Coupled 1D-2D Urban Hydrology & Drainage Hydraulic Simulation Engine
Problem Statement SIH26085

Implements:
1. Subcatchment precipitation runoff (Rational / Infiltration-excess)
2. Directed Stormwater Drainage Network (Manning's Pipe Flow)
3. Hydraulic Junction Surcharge and Backpressure
4. River Outfall Stage Boundary Conditions (Tidal / Ganga River backflow)
5. Pipe Sedimentation / Choking / Blockage factors
6. Surface 2D Ponding & Street Inundation Accumulation
7. Active Dewatering Pump discharge mechanics
"""

import math
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass, field


@dataclass
class Subcatchment:
    catchment_id: str
    name: str
    area_hectares: float
    imperviousness_pct: float  # e.g., 75% for dense urban
    runoff_coefficient: float  # C factor (0.75 - 0.90)
    avg_slope_pct: float
    outlet_node_id: str
    elevation_m: float

    def compute_runoff_m3s(self, rainfall_intensity_mmh: float) -> float:
        """
        Rational formula: Q = (C * I * A) / 360
        Q in m^3/s, I in mm/hr, A in hectares
        """
        effective_c = self.runoff_coefficient * (self.imperviousness_pct / 100.0) + 0.15 * (1.0 - self.imperviousness_pct / 100.0)
        return (effective_c * rainfall_intensity_mmh * self.area_hectares) / 360.0


@dataclass
class DrainageNode:
    node_id: str
    name: str
    node_type: str  # "manhole", "inlet", "junction", "pump_sump", "outfall"
    invert_elevation_m: float  # Bottom of chamber
    rim_elevation_m: float     # Street ground surface
    lat: float
    lng: float
    inflow_conduits: List[str] = field(default_factory=list)
    outflow_conduits: List[str] = field(default_factory=list)
    ponding_area_m2: float = 2500.0  # Associated low-lying depression surface area
    
    # State variables
    current_water_level_m: float = 0.0
    surcharge_depth_m: float = 0.0
    surface_ponding_depth_cm: float = 0.0
    is_surcharged: bool = False
    is_flooded: bool = False


@dataclass
class DrainageConduit:
    conduit_id: str
    name: str
    conduit_type: str  # "circular_pipe", "box_culvert", "open_channel"
    from_node: str
    to_node: str
    length_m: float
    diameter_or_width_m: float
    height_m: float  # Equal to diameter for circular
    manning_n: float = 0.015  # Concrete / brick sewer
    slope: float = 0.002
    blockage_fraction: float = 0.0  # 0.0 to 1.0 (silt/solid waste blockage)
    coordinates: List[List[float]] = field(default_factory=list)
    
    # State variables
    current_flow_m3s: float = 0.0
    capacity_utilization_pct: float = 0.0
    is_surcharged: bool = False
    is_backflow: bool = False

    def full_flow_capacity_m3s(self) -> float:
        """
        Manning's Equation for full flow:
        Q = (1/n) * A * R^(2/3) * S^(1/2)
        Adjusted by blockage reduction factor.
        """
        effective_diameter = self.diameter_or_width_m * math.sqrt(max(0.05, 1.0 - self.blockage_fraction))
        if self.conduit_type == "box_culvert":
            w = effective_diameter
            h = self.height_m * (1.0 - self.blockage_fraction)
            area = w * h
            perimeter = 2 * (w + h)
        else:  # circular
            radius = effective_diameter / 2.0
            area = math.pi * (radius ** 2)
            perimeter = 2 * math.pi * radius
            
        hydraulic_radius = area / max(perimeter, 0.001)
        slope_eff = max(0.0005, self.slope)
        q_full = (1.0 / self.manning_n) * area * (hydraulic_radius ** (2.0 / 3.0)) * math.sqrt(slope_eff)
        return max(0.05, q_full)


class CoupledUrbanHydroEngine:
    """
    Coupled 1D Drainage Network + 2D Surface Ponding Physics Engine.
    Simulates dynamic storm response, backwater pressure, surcharge overflow, and street waterlogging.
    """
    def __init__(self, outfall_river_stage_m: float = 49.5):
        self.subcatchments: Dict[str, Subcatchment] = {}
        self.nodes: Dict[str, DrainageNode] = {}
        self.conduits: Dict[str, DrainageConduit] = {}
        self.outfall_river_stage_m = outfall_river_stage_m
        self.active_pumps_m3s: float = 0.0
        self._initialize_pilot_catchments()

    def _initialize_pilot_catchments(self):
        """Constructs a realistic urban drainage topology (Patna Urban Pilot Catchment)"""
        # Nodes: Elevations reflect typical Patna elevation (47.5m - 52.0m)
        nodes_data = [
            ("N-01", "Kankarbagh North Inflow", "inlet", 46.5, 49.2, 25.6020, 85.1450, 4000.0),
            ("N-02", "Rajendra Nagar Central Junction", "junction", 45.8, 48.4, 25.6005, 85.1550, 6500.0),
            ("N-03", "Saidpur Drainage Trunk Inlet", "junction", 45.2, 47.9, 25.6080, 85.1620, 5000.0),
            ("N-04", "Bargawan Low Depression Sump", "pump_sump", 44.5, 47.3, 25.5920, 85.1380, 7500.0),
            ("N-05", "Gandhi Maidan Storm Drain", "inlet", 47.0, 50.8, 25.6180, 85.1420, 3000.0),
            ("N-06", "Fraser Road Trunk Junction", "junction", 46.2, 49.8, 25.6120, 85.1380, 2500.0),
            ("N-07", "Patliputra Drainage Collector", "junction", 47.5, 51.2, 25.6250, 85.1180, 3200.0),
            ("N-08", "Saidpur Major Canal Sluice", "junction", 44.0, 47.0, 25.6150, 85.1720, 8000.0),
            ("N-OUT-01", "Anta Ghat River Outfall", "outfall", 43.5, 49.0, 25.6260, 85.1550, 1000.0),
            ("N-OUT-02", "Pahari Outfall Channel", "outfall", 43.0, 48.5, 25.5880, 85.1850, 1000.0),
        ]
        for nid, name, ntype, invert, rim, lat, lng, ponding_area in nodes_data:
            self.nodes[nid] = DrainageNode(
                node_id=nid,
                name=name,
                node_type=ntype,
                invert_elevation_m=invert,
                rim_elevation_m=rim,
                lat=lat,
                lng=lng,
                ponding_area_m2=ponding_area,
            )

        # Conduits (Pipes / Box culverts)
        conduits_data = [
            ("P-01", "Kankarbagh-Rajendra Trunk", "box_culvert", "N-01", "N-02", 950.0, 2.2, 1.8, 0.016, 0.0018, 0.25,
             [[85.1450, 25.6020], [85.1500, 25.6010], [85.1550, 25.6005]]),
            ("P-02", "Rajendra-Saidpur Connector", "circular_pipe", "N-02", "N-03", 1100.0, 1.8, 1.8, 0.015, 0.0012, 0.35,
             [[85.1550, 25.6005], [85.1590, 25.6045], [85.1620, 25.6080]]),
            ("P-03", "Bargawan Relief Conduit", "circular_pipe", "N-04", "N-02", 1400.0, 1.6, 1.6, 0.017, 0.0008, 0.45,
             [[85.1380, 25.5920], [85.1470, 25.5960], [85.1550, 25.6005]]),
            ("P-04", "Gandhi Maidan Outflow", "box_culvert", "N-05", "N-06", 800.0, 2.0, 1.5, 0.014, 0.0022, 0.10,
             [[85.1420, 25.6180], [85.1400, 25.6150], [85.1380, 25.6120]]),
            ("P-05", "Fraser-Anta Ghat Trunk", "box_culvert", "N-06", "N-OUT-01", 1600.0, 2.5, 2.2, 0.015, 0.0015, 0.15,
             [[85.1380, 25.6120], [85.1480, 25.6200], [85.1550, 25.6260]]),
            ("P-06", "Patliputra Outflow Line", "circular_pipe", "N-07", "N-06", 1250.0, 1.8, 1.8, 0.015, 0.0020, 0.20,
             [[85.1180, 25.6250], [85.1280, 25.6180], [85.1380, 25.6120]]),
            ("P-07", "Saidpur to Sluice Channel", "open_channel", "N-03", "N-08", 1200.0, 3.5, 2.5, 0.022, 0.0010, 0.30,
             [[85.1620, 25.6080], [85.1670, 25.6110], [85.1720, 25.6150]]),
            ("P-08", "Saidpur Sluice to Pahari Outfall", "open_channel", "N-08", "N-OUT-02", 2100.0, 4.0, 3.0, 0.024, 0.0009, 0.20,
             [[85.1720, 25.6150], [85.1790, 25.6020], [85.1850, 25.5880]]),
        ]
        for cid, name, ctype, fn, tn, length, diam, h, n, slope, blk, coords in conduits_data:
            conduit = DrainageConduit(
                conduit_id=cid,
                name=name,
                conduit_type=ctype,
                from_node=fn,
                to_node=tn,
                length_m=length,
                diameter_or_width_m=diam,
                height_m=h,
                manning_n=n,
                slope=slope,
                blockage_fraction=blk,
                coordinates=coords
            )
            self.conduits[cid] = conduit
            self.nodes[fn].outflow_conduits.append(cid)
            self.nodes[tn].inflow_conduits.append(cid)

        # Subcatchments
        subcatchments_data = [
            ("CAT-01", "Kankarbagh South Basin", 85.0, 82.0, 0.82, 0.6, "N-01", 49.2),
            ("CAT-02", "Rajendra Nagar Low Basin", 110.0, 88.0, 0.88, 0.4, "N-02", 48.4),
            ("CAT-03", "Saidpur Industrial & Canal Basin", 130.0, 78.0, 0.79, 0.5, "N-03", 47.9),
            ("CAT-04", "Bargawan Railway Colony Basin", 70.0, 85.0, 0.85, 0.3, "N-04", 47.3),
            ("CAT-05", "Gandhi Maidan Commercial Basin", 60.0, 92.0, 0.90, 1.2, "N-05", 50.8),
            ("CAT-06", "Fraser Road Urban Corridor", 55.0, 90.0, 0.89, 0.9, "N-06", 49.8),
            ("CAT-07", "Patliputra Residential Basin", 95.0, 75.0, 0.76, 1.1, "N-07", 51.2),
        ]
        for cid, name, area, imp, coeff, slope, outlet, elev in subcatchments_data:
            self.subcatchments[cid] = Subcatchment(
                catchment_id=cid,
                name=name,
                area_hectares=area,
                imperviousness_pct=imp,
                runoff_coefficient=coeff,
                avg_slope_pct=slope,
                outlet_node_id=outlet,
                elevation_m=elev
            )

    def set_pumps_active(self, pump_m3s: float):
        self.active_pumps_m3s = pump_m3s

    def simulate_step(
        self,
        rainfall_intensity_mmh: float,
        accumulated_rain_mm: float,
        dt_seconds: float = 900.0,  # 15 minutes step
        override_river_stage: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Executes a coupled hydraulic time-step:
        1. Subcatchment runoff generation
        2. Pipe flow routing with Manning capacity limits
        3. Junction hydraulic grade line (HGL) and surcharge calculation
        4. Outfall backwater boundary condition
        5. Street ponding depth calculation
        """
        river_stage = override_river_stage if override_river_stage is not None else self.outfall_river_stage_m

        # Step 1: Runoff to nodes
        node_inflows: Dict[str, float] = {nid: 0.0 for nid in self.nodes}
        for cat in self.subcatchments.values():
            q_runoff = cat.compute_runoff_m3s(rainfall_intensity_mmh)
            if cat.outlet_node_id in node_inflows:
                node_inflows[cat.outlet_node_id] += q_runoff

        # Step 2: Conduit routing
        # Check outfall nodes against river stage
        for out_id in ["N-OUT-01", "N-OUT-02"]:
            out_node = self.nodes.get(out_id)
            if out_node:
                out_node.current_water_level_m = max(out_node.invert_elevation_m, river_stage)

        # Route flows from upstream to downstream
        conduit_results = {}
        for cid, conduit in self.conduits.items():
            from_node = self.nodes[conduit.from_node]
            to_node = self.nodes[conduit.to_node]

            # Inflow available at from_node
            available_inflow = node_inflows.get(from_node.node_id, 0.0)
            q_cap = conduit.full_flow_capacity_m3s()

            # Backflow check: If downstream water level is significantly higher than upstream rim/invert
            to_head = to_node.current_water_level_m
            from_head = from_node.invert_elevation_m + from_node.surcharge_depth_m
            head_diff = from_head - to_head

            if to_head > from_head and to_node.node_type == "outfall":
                # Severe river backflow into drainage system!
                conduit.is_backflow = True
                conduit.current_flow_m3s = -min(q_cap * 0.4, (to_head - from_head) * 1.8)
                conduit.capacity_utilization_pct = 120.0
                conduit.is_surcharged = True
                # Adds backwater inflow to upstream node
                node_inflows[from_node.node_id] += abs(conduit.current_flow_m3s)
            else:
                conduit.is_backflow = False
                actual_flow = min(available_inflow, q_cap)
                conduit.current_flow_m3s = actual_flow
                utilization = (actual_flow / q_cap) * 100.0
                conduit.capacity_utilization_pct = round(utilization, 1)
                conduit.is_surcharged = utilization >= 95.0

                # Deliver flow to to_node
                if to_node.node_id in node_inflows:
                    node_inflows[to_node.node_id] += actual_flow

            conduit_results[cid] = {
                "flow_m3s": round(conduit.current_flow_m3s, 2),
                "capacity_m3s": round(q_cap, 2),
                "utilization_pct": round(conduit.capacity_utilization_pct, 1),
                "surcharged": conduit.is_surcharged,
                "backflow": conduit.is_backflow,
            }

        # Step 3: Node Surcharge & Surface Waterlogging Depth
        node_results = {}
        for nid, node in self.nodes.items():
            if node.node_type == "outfall":
                continue

            total_inflow = node_inflows.get(nid, 0.0)
            total_outflow_cap = sum(self.conduits[c].full_flow_capacity_m3s() for c in node.outflow_conduits)

            # Deduct pump rate if at sump
            if node.node_type == "pump_sump":
                total_outflow_cap += self.active_pumps_m3s

            excess_rate = max(0.0, total_inflow - total_outflow_cap)
            
            # Chamber filling and surface ponding
            chamber_height = node.rim_elevation_m - node.invert_elevation_m
            chamber_volume = 3.14 * (1.2 ** 2) * chamber_height  # roughly 10-15 m^3
            
            # Surcharge volume accumulated in this step
            excess_vol_step = excess_rate * dt_seconds

            # Surcharge state
            if excess_rate > 0.05 or total_inflow > (total_outflow_cap * 0.9):
                node.is_surcharged = True
                # Water fills chamber and surfaces
                node.surcharge_depth_m = min(chamber_height + 1.2, chamber_height + (excess_rate / 2.0))
                node.is_flooded = True
                
                # Ponding depth on surface (cm)
                # Depth = (Excess Volume / Ponding Area) * 100
                depth_cm = (excess_vol_step / max(node.ponding_area_m2, 1000.0)) * 100.0
                # Scale with cumulative storm effect
                cumulative_factor = min(3.5, 0.2 + (accumulated_rain_mm / 40.0))
                calculated_depth = min(120.0, round(depth_cm * cumulative_factor, 1))
                node.surface_ponding_depth_cm = calculated_depth
            else:
                # Receding water
                node.is_surcharged = False
                node.surcharge_depth_m = 0.0
                node.surface_ponding_depth_cm = max(0.0, round(node.surface_ponding_depth_cm * 0.65, 1))
                node.is_flooded = node.surface_ponding_depth_cm > 5.0

            node_results[nid] = {
                "water_elevation_m": round(node.invert_elevation_m + node.surcharge_depth_m, 2),
                "surcharge_depth_m": round(node.surcharge_depth_m, 2),
                "ponding_depth_cm": round(node.surface_ponding_depth_cm, 1),
                "is_surcharged": node.is_surcharged,
                "is_flooded": node.is_flooded,
            }

        return {
            "rainfall_intensity_mmh": rainfall_intensity_mmh,
            "accumulated_rain_mm": accumulated_rain_mm,
            "river_stage_m": river_stage,
            "node_states": node_results,
            "conduit_states": conduit_results,
        }
