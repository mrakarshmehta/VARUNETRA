"""
Emergency Operations Service: SOS, Rescue Dispatch, Shelters, Pumps, Relief, Damage Assessment, and Alerts
Backed by ACID restart-safe SQLite storage.
"""

import uuid
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from app.core.config import (
    DataProvenance,
    RiskLevel,
    SOSStatus,
    PumpStatus,
    IncidentCategory,
    UserRole,
)
from app.schemas.operations import (
    SOSCreateRequest,
    SOSIncidentSchema,
    IncidentCreateRequest,
    IncidentReportSchema,
    RescueTeamSchema,
    ShelterHospitalSchema,
    MunicipalPumpSchema,
    PumpActionRequest,
    ReliefCampSchema,
    DamageReportSchema,
    AlertSchema,
)
from app.db.storage import db_manager


class OperationsManager:
    def __init__(self, db=None):
        self.db = db or db_manager

    # --- SOS Operations ---
    def create_sos(self, req: SOSCreateRequest) -> SOSIncidentSchema:
        now = datetime.now(timezone.utc).isoformat()
        with self.db.get_connection() as conn:
            # Collision-free sequential ID generation
            cur = conn.execute("SELECT id FROM sos_incidents WHERE id LIKE 'SOS-PAT-%'")
            existing_ids = {row["id"] for row in cur.fetchall()}
            idx = 101
            while f"SOS-PAT-{idx}" in existing_ids:
                idx += 1
            sos_id = f"SOS-PAT-{idx}"

            # Auto-match nearest available rescue team
            cur_team = conn.execute("SELECT * FROM rescue_teams WHERE status = 'AVAILABLE' LIMIT 1")
            team_row = cur_team.fetchone()

            assigned_team_id = None
            assigned_team_name = None
            sos_status = SOSStatus.NEW

            if team_row:
                assigned_team_id = team_row["id"]
                assigned_team_name = team_row["name"]
                sos_status = SOSStatus.ASSIGNED
                conn.execute(
                    "UPDATE rescue_teams SET status = 'DISPATCHED', assigned_incident_id = ? WHERE id = ?",
                    (sos_id, assigned_team_id)
                )

            address_hint = req.address_hint or "Reported via Citizen Emergency Portal"
            conn.execute("""
                INSERT INTO sos_incidents VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                sos_id, req.lat, req.lng, req.number_of_people, req.emergency_type,
                req.severity.value, req.contact_phone, address_hint, req.notes,
                sos_status.value, assigned_team_id, assigned_team_name, now, now
            ))
            conn.commit()

        return SOSIncidentSchema(
            id=sos_id,
            lat=req.lat,
            lng=req.lng,
            number_of_people=req.number_of_people,
            emergency_type=req.emergency_type,
            severity=req.severity,
            contact_phone=req.contact_phone,
            address_hint=address_hint,
            notes=req.notes,
            status=sos_status,
            assigned_team_id=assigned_team_id,
            assigned_team_name=assigned_team_name,
            created_at=now,
            updated_at=now,
        )

    def get_all_sos(self) -> List[SOSIncidentSchema]:
        with self.db.get_connection() as conn:
            cur = conn.execute("SELECT * FROM sos_incidents ORDER BY created_at DESC")
            rows = cur.fetchall()

        results = []
        for r in rows:
            results.append(SOSIncidentSchema(
                id=r["id"],
                lat=r["lat"],
                lng=r["lng"],
                number_of_people=r["number_of_people"],
                emergency_type=r["emergency_type"],
                severity=RiskLevel(r["severity"]),
                contact_phone=r["contact_phone"],
                address_hint=r["address_hint"] or "",
                notes=r["notes"],
                status=SOSStatus(r["status"]),
                assigned_team_id=r["assigned_team_id"],
                assigned_team_name=r["assigned_team_name"],
                created_at=r["created_at"],
                updated_at=r["updated_at"],
            ))
        return results

    def get_sos_by_id(self, sos_id: str) -> Optional[SOSIncidentSchema]:
        with self.db.get_connection() as conn:
            cur = conn.execute("SELECT * FROM sos_incidents WHERE id = ?", (sos_id,))
            r = cur.fetchone()
        if not r:
            return None
        return SOSIncidentSchema(
            id=r["id"],
            lat=r["lat"],
            lng=r["lng"],
            number_of_people=r["number_of_people"],
            emergency_type=r["emergency_type"],
            severity=RiskLevel(r["severity"]),
            contact_phone=r["contact_phone"],
            address_hint=r["address_hint"] or "",
            notes=r["notes"],
            status=SOSStatus(r["status"]),
            assigned_team_id=r["assigned_team_id"],
            assigned_team_name=r["assigned_team_name"],
            created_at=r["created_at"],
            updated_at=r["updated_at"],
        )

    def update_sos_status(
        self,
        sos_id: str,
        new_status: SOSStatus,
        team_id: Optional[str] = None
    ) -> Optional[SOSIncidentSchema]:
        now = datetime.now(timezone.utc).isoformat()
        with self.db.get_connection() as conn:
            cur = conn.execute("SELECT * FROM sos_incidents WHERE id = ?", (sos_id,))
            current = cur.fetchone()
            if not current:
                return None

            assigned_team_id = current["assigned_team_id"]
            assigned_team_name = current["assigned_team_name"]

            if team_id:
                cur_team = conn.execute("SELECT * FROM rescue_teams WHERE id = ?", (team_id,))
                team_row = cur_team.fetchone()
                if team_row:
                    assigned_team_id = team_row["id"]
                    assigned_team_name = team_row["name"]
                    conn.execute(
                        "UPDATE rescue_teams SET status = 'DISPATCHED', assigned_incident_id = ? WHERE id = ?",
                        (sos_id, team_id)
                    )

            if new_status in [SOSStatus.RESCUED, SOSStatus.CLOSED]:
                if assigned_team_id:
                    conn.execute(
                        "UPDATE rescue_teams SET status = 'AVAILABLE', assigned_incident_id = NULL WHERE id = ?",
                        (assigned_team_id,)
                    )

            conn.execute("""
                UPDATE sos_incidents
                SET status = ?, assigned_team_id = ?, assigned_team_name = ?, updated_at = ?
                WHERE id = ?
            """, (new_status.value, assigned_team_id, assigned_team_name, now, sos_id))
            conn.commit()

        return self.get_sos_by_id(sos_id)

    # --- Field Incidents ---
    def create_incident(self, req: IncidentCreateRequest) -> IncidentReportSchema:
        now = datetime.now(timezone.utc).isoformat()
        loc = req.location_name or f"Location ({req.lat:.4f}, {req.lng:.4f})"
        is_verified = (req.reported_by_role == UserRole.FIELD_OFFICER)
        with self.db.get_connection() as conn:
            cur = conn.execute("SELECT COUNT(*) as c FROM incident_reports")
            count = cur.fetchone()["c"]
            iid = f"INC-{count + 201}"

            conn.execute("""
                INSERT INTO incident_reports VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                iid, req.category.value, req.lat, req.lng, req.severity.value,
                req.notes, req.reported_by_role.value, None, loc, "OPEN", now
            ))
            conn.commit()

        return IncidentReportSchema(
            id=iid,
            category=req.category,
            severity=req.severity,
            lat=req.lat,
            lng=req.lng,
            location_name=loc,
            notes=req.notes,
            media_url=req.media_url,
            reported_by_role=req.reported_by_role,
            verified_by_field_officer=is_verified,
            status="OPEN",
            created_at=now,
        )

    def get_all_incidents(self) -> List[IncidentReportSchema]:
        with self.db.get_connection() as conn:
            cur = conn.execute("SELECT * FROM incident_reports ORDER BY created_at DESC")
            rows = cur.fetchall()

        results = []
        for r in rows:
            results.append(IncidentReportSchema(
                id=r["id"],
                category=IncidentCategory(r["category"]),
                severity=RiskLevel(r["severity"]),
                lat=r["lat"],
                lng=r["lng"],
                location_name=r["address"] or f"Location ({r['lat']:.4f}, {r['lng']:.4f})",
                notes=r["description"],
                media_url=None,
                reported_by_role=UserRole(r["reporter_role"]),
                verified_by_field_officer=(r["reporter_role"] == UserRole.FIELD_OFFICER.value),
                status=r["status"],
                created_at=r["created_at"],
            ))
        return results

    # --- Rescue Teams ---
    def get_all_rescue_teams(self) -> List[RescueTeamSchema]:
        with self.db.get_connection() as conn:
            cur = conn.execute("SELECT * FROM rescue_teams")
            rows = cur.fetchall()

        results = []
        for r in rows:
            eq = json.loads(r["equipment_json"]) if r["equipment_json"] else []
            results.append(RescueTeamSchema(
                id=r["id"],
                name=r["name"],
                team_type=r["team_type"],
                capacity_people=r["capacity_people"],
                lat=r["lat"],
                lng=r["lng"],
                status=r["status"],
                assigned_incident_id=r["assigned_incident_id"],
                equipment=eq,
                eta_minutes=r["eta_minutes"],
            ))
        return results

    # --- Facilities ---
    def get_all_facilities(self) -> List[ShelterHospitalSchema]:
        with self.db.get_connection() as conn:
            cur = conn.execute("SELECT * FROM facilities")
            rows = cur.fetchall()

        results = []
        for r in rows:
            results.append(ShelterHospitalSchema(
                id=r["id"],
                name=r["name"],
                facility_type=r["facility_type"],
                lat=r["lat"],
                lng=r["lng"],
                capacity=r["capacity"],
                current_occupancy=r["current_occupancy"],
                flood_risk=RiskLevel(r["flood_risk"]),
                road_passability=r["road_passability"],
                phone=r["phone"],
                address=r["address"],
                has_emergency_power=bool(r["has_emergency_power"]),
                available_beds_or_space=r["available_beds_or_space"],
            ))
        return results

    # --- Pumps ---
    def get_all_pumps(self) -> List[MunicipalPumpSchema]:
        with self.db.get_connection() as conn:
            cur = conn.execute("SELECT * FROM municipal_pumps")
            rows = cur.fetchall()

        results = []
        for r in rows:
            results.append(MunicipalPumpSchema(
                id=r["id"],
                name=r["name"],
                pump_type=r["pump_type"],
                discharge_capacity_m3h=r["discharge_capacity_m3h"],
                lat=r["lat"],
                lng=r["lng"],
                status=PumpStatus(r["status"]),
                assigned_zone_id=r["assigned_zone_id"],
                assigned_zone_name=r["assigned_zone_name"],
                fuel_level_pct=r["fuel_level_pct"],
                operating_hours_today=r["operating_hours_today"],
                recommended_for_severity=r["recommended_for_severity"],
            ))
        return results

    def get_pump_by_id(self, pump_id: str) -> Optional[MunicipalPumpSchema]:
        with self.db.get_connection() as conn:
            cur = conn.execute("SELECT * FROM municipal_pumps WHERE id = ?", (pump_id,))
            r = cur.fetchone()
        if not r:
            return None
        return MunicipalPumpSchema(
            id=r["id"],
            name=r["name"],
            pump_type=r["pump_type"],
            discharge_capacity_m3h=r["discharge_capacity_m3h"],
            lat=r["lat"],
            lng=r["lng"],
            status=PumpStatus(r["status"]),
            assigned_zone_id=r["assigned_zone_id"],
            assigned_zone_name=r["assigned_zone_name"],
            fuel_level_pct=r["fuel_level_pct"],
            operating_hours_today=r["operating_hours_today"],
            recommended_for_severity=r["recommended_for_severity"],
        )

    def update_pump(self, pump_id: str, req: PumpActionRequest) -> Optional[MunicipalPumpSchema]:
        with self.db.get_connection() as conn:
            cur = conn.execute("SELECT * FROM municipal_pumps WHERE id = ?", (pump_id,))
            pump = cur.fetchone()
            if not pump:
                return None

            new_status = pump["status"]
            assigned_zone_id = pump["assigned_zone_id"]
            assigned_zone_name = pump["assigned_zone_name"]
            operating_hours = pump["operating_hours_today"]

            if req.action == "DISPATCH":
                new_status = PumpStatus.DISPATCHED.value
                assigned_zone_id = req.zone_id or "CAT-02"
                assigned_zone_name = "Rajendra Nagar Low Basin"
            elif req.action == "ACTIVATE":
                new_status = PumpStatus.ACTIVE.value
                operating_hours += 1.0
            elif req.action in ["CLEAR_AREA", "RECALL"]:
                new_status = PumpStatus.AVAILABLE.value
                assigned_zone_id = None
                assigned_zone_name = None

            conn.execute("""
                UPDATE municipal_pumps
                SET status = ?, assigned_zone_id = ?, assigned_zone_name = ?, operating_hours_today = ?
                WHERE id = ?
            """, (new_status, assigned_zone_id, assigned_zone_name, operating_hours, pump_id))
            conn.commit()

        return self.get_pump_by_id(pump_id)

    # --- Relief Camps ---
    def get_all_relief_camps(self) -> List[ReliefCampSchema]:
        with self.db.get_connection() as conn:
            cur = conn.execute("SELECT * FROM relief_camps")
            rows = cur.fetchall()

        results = []
        for r in rows:
            items = json.loads(r["shortage_items_json"]) if r["shortage_items_json"] else []
            results.append(ReliefCampSchema(
                id=r["id"],
                name=r["name"],
                lat=r["lat"],
                lng=r["lng"],
                occupancy=r["occupancy"],
                capacity=r["capacity"],
                food_supply_days=r["food_supply_days"],
                potable_water_liters=r["potable_water_liters"],
                medicine_kits=r["medicine_kits"],
                has_critical_shortage=bool(r["has_critical_shortage"]),
                shortage_items=items,
            ))
        return results

    # --- Damage Reports ---
    def get_all_damage_reports(self) -> List[DamageReportSchema]:
        with self.db.get_connection() as conn:
            cur = conn.execute("SELECT * FROM damage_reports ORDER BY created_at DESC")
            rows = cur.fetchall()

        results = []
        for r in rows:
            results.append(DamageReportSchema(
                id=r["id"],
                zone_id=r["zone_id"],
                zone_name=r["zone_name"],
                asset_type=r["asset_type"],
                damage_severity=RiskLevel(r["damage_severity"]),
                estimated_repair_cost_inr=r["estimated_repair_cost_inr"],
                field_verified=bool(r["field_verified"]),
                reported_by=r["reported_by"],
                before_flood_status=r["before_flood_status"],
                observed_damage_notes=r["observed_damage_notes"],
                created_at=r["created_at"],
            ))
        return results

    # --- Alerts ---
    def get_all_alerts(self) -> List[AlertSchema]:
        with self.db.get_connection() as conn:
            cur = conn.execute("SELECT * FROM alerts ORDER BY created_at DESC")
            rows = cur.fetchall()

        results = []
        for r in rows:
            results.append(AlertSchema(
                id=r["id"],
                level=RiskLevel(r["level"]),
                title=r["title"],
                message=r["message"],
                zone_name=r["zone_name"],
                lead_time_min=r["lead_time_min"],
                action_advised=r["action_advised"],
                issued_by=r["issued_by"],
                is_draft=bool(r["is_draft"]),
                created_at=r["created_at"],
            ))
        return results

    def create_alert(
        self,
        level: RiskLevel,
        title: str,
        message: str,
        zone_name: str,
        lead_time_min: int,
        action_advised: str,
        issued_by: str = "Municipal Disaster Management Authority (MDMA) [Simulation Advisory]",
        is_draft: bool = False,
        alert_id: Optional[str] = None
    ) -> AlertSchema:
        now = datetime.now(timezone.utc).isoformat()
        with self.db.get_connection() as conn:
            cur = conn.execute("SELECT COUNT(*) as c FROM alerts")
            count = cur.fetchone()["c"]
            aid = alert_id or f"ALT-SIM-{count + 101}"
            conn.execute("""
                INSERT OR REPLACE INTO alerts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                aid, level.value, title, message, zone_name,
                lead_time_min, action_advised, issued_by, int(is_draft), now
            ))
            conn.commit()

        return AlertSchema(
            id=aid,
            level=level,
            title=title,
            message=message,
            zone_name=zone_name,
            lead_time_min=lead_time_min,
            action_advised=action_advised,
            issued_by=issued_by,
            is_draft=is_draft,
            created_at=now,
        )

    # --- Backwards compatibility property accessors ---
    @property
    def _sos_incidents(self) -> Dict[str, SOSIncidentSchema]:
        return {s.id: s for s in self.get_all_sos()}

    @property
    def _pumps(self) -> Dict[str, MunicipalPumpSchema]:
        return {p.id: p for p in self.get_all_pumps()}

    @property
    def _rescue_teams(self) -> Dict[str, RescueTeamSchema]:
        return {t.id: t for t in self.get_all_rescue_teams()}

    @property
    def _facilities(self) -> Dict[str, ShelterHospitalSchema]:
        return {f.id: f for f in self.get_all_facilities()}

    @property
    def _relief_camps(self) -> Dict[str, ReliefCampSchema]:
        return {c.id: c for c in self.get_all_relief_camps()}

    @property
    def _damage_reports(self) -> Dict[str, DamageReportSchema]:
        return {d.id: d for d in self.get_all_damage_reports()}

    @property
    def _alerts(self) -> Dict[str, AlertSchema]:
        return {a.id: a for a in self.get_all_alerts()}

    def check_db_health(self) -> Dict[str, Any]:
        return self.db.check_health()


# Singleton operations manager
ops_manager = OperationsManager()
