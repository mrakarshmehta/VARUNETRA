import React from "react";
import {
  LifeBuoy,
  Navigation,
  ShieldCheck,
  Building2,
  HeartPulse,
  ArrowRight,
} from "lucide-react";
import { ModuleKey } from "../Sidebar";
import { CivicButton } from "../primitives/CivicButton";
import { StatusPill } from "../primitives/StatusPill";

interface CitizenPortalModuleProps {
  onNavigate: (key: ModuleKey) => void;
}

export const CitizenPortalModule: React.FC<CitizenPortalModuleProps> = ({ onNavigate }) => {
  return (
    <div
      style={{
        padding: "24px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        maxWidth: "960px",
        margin: "0 auto",
        height: "100%",
        overflowY: "auto",
      }}
    >
      {/* Welcome Citizen Banner */}
      <div
        className="civic-glass-card"
        style={{
          padding: "24px 28px",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--glass-border-light)",
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(224, 242, 254, 0.5) 100%)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <StatusPill type="ACTIVE" label="MoES Urban Public Safety Portal" />
        <h2
          style={{
            fontSize: "1.6rem",
            fontWeight: 800,
            color: "var(--text-primary)",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          How can VARUNETRA help you right now?
        </h2>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            margin: 0,
            maxWidth: "600px",
            lineHeight: 1.5,
          }}
        >
          Instant street-level flood intelligence and emergency evacuation support for Patna urban residents.
        </p>
      </div>

      {/* 2 Large Action Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        {/* Card 1: Check Flood Risk & Map */}
        <div
          className="civic-glass-card"
          onClick={() => onNavigate("map")}
          style={{
            padding: "20px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--glass-border-light)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            transition: "all var(--duration-normal) var(--ease-standard)",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "var(--radius-md)",
              background: "var(--brand-primary-light)",
              color: "var(--brand-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 6px 0", color: "var(--text-primary)" }}>
              Check Street Flood Depth
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.45, margin: 0 }}>
              Inspect predicted 0–3 hour standing water depths, road closures, and surcharging drains on your route.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--brand-primary)",
              fontWeight: 600,
              fontSize: "0.82rem",
              marginTop: "auto",
            }}
          >
            <span>Open Interactive Map</span>
            <ArrowRight size={15} />
          </div>
        </div>

        {/* Card 2: Find Safe Route */}
        <div
          className="civic-glass-card"
          onClick={() => onNavigate("routing")}
          style={{
            padding: "20px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--glass-border-light)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            transition: "all var(--duration-normal) var(--ease-standard)",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "var(--radius-md)",
              background: "var(--safe-primary-light)",
              color: "var(--safe-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Navigation size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 6px 0", color: "var(--text-primary)" }}>
              Find Safe Evacuation Route
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.45, margin: 0 }}>
              Get directions dynamically steered away from submerged underpasses and surcharging canal roads.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--safe-primary)",
              fontWeight: 600,
              fontSize: "0.82rem",
              marginTop: "auto",
            }}
          >
            <span>Plan Flood-Safe Route</span>
            <ArrowRight size={15} />
          </div>
        </div>
      </div>

      {/* Emergency SOS Banner Card */}
      <div
        onClick={() => onNavigate("sos")}
        style={{
          padding: "20px 24px",
          borderRadius: "var(--radius-lg)",
          background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
          color: "#ffffff",
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(220, 38, 38, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          transition: "transform var(--duration-normal) var(--ease-standard)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <LifeBuoy size={26} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff", margin: "0 0 4px 0" }}>
              Are you or someone trapped in water?
            </h3>
            <p style={{ fontSize: "0.82rem", opacity: 0.9, margin: 0 }}>
              Click here to trigger an immediate Citizen SOS beacon directly to SDRF boat rescue units.
            </p>
          </div>
        </div>

        <CivicButton
          variant="secondary"
          size="md"
          icon={<ArrowRight size={16} />}
          onClick={(e) => {
            e.stopPropagation();
            onNavigate("sos");
          }}
          style={{
            background: "#ffffff",
            color: "#dc2626",
            fontWeight: 700,
          }}
        >
          TRIGGER SOS
        </CivicButton>
      </div>

      {/* Quick Access to Shelters & Hospitals */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
        <div
          className="civic-glass-card"
          onClick={() => onNavigate("shelters")}
          style={{
            padding: "16px 18px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--glass-border-light)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--radius-md)",
              background: "var(--brand-primary-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Building2 size={20} color="var(--brand-primary)" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>
              Find Nearest Relief Shelter
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Verified bed capacity and backup power
            </div>
          </div>
        </div>

        <div
          className="civic-glass-card"
          onClick={() => onNavigate("shelters")}
          style={{
            padding: "16px 18px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--glass-border-light)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--radius-md)",
              background: "var(--critical-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <HeartPulse size={20} color="var(--critical-primary)" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>
              Emergency Hospital Status
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              PMCH & NMCH corridor accessibility
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
