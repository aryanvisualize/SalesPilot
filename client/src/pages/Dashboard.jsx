import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

export default function Dashboard({ user, onNavigate }) {
  const [stats, setStats] = useState({
    meetingsCount: 0,
    customersCount: 0,
    followUpsCount: 0,
    completedMeetings: 0,
    inProgressMeetings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const summary = await apiRequest("/api/dashboard/summary");

        if (isMounted) {
          setStats({
            meetingsCount: summary.meetingsCount,
            customersCount: summary.customersCount,
            followUpsCount: summary.followUpsCount,
            completedMeetings: summary.completedMeetings,
            inProgressMeetings: summary.inProgressMeetings,
          });
        }
      } catch (err) {
        console.error("Failed to load dashboard metrics:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const roleMeta = {
    employee: {
      badge: "Sales Representative",
      badgeClass: "employee",
      description: "Manage your client visits, conduct live meeting check-ins, record visit outcomes, and complete follow-ups.",
      scope: "Personal Scope",
    },
    manager: {
      badge: "Sales Manager",
      badgeClass: "manager",
      description: "Oversee sales visits across your team, track active client engagements, and re-open completed visits for reviews.",
      scope: "Team Scope",
    },
    admin: {
      badge: "System Administrator",
      badgeClass: "admin",
      description: "Full administrative governance: manage user accounts, assign roles, configure managers, and inspect all system activity.",
      scope: "Enterprise Global",
    },
  };

  const currentRole = roleMeta[user?.role] || roleMeta.employee;

  return (
    <div>
      {/* Executive Welcome Hero Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
          color: "#ffffff",
          borderRadius: "var(--radius-lg)",
          padding: "32px 28px",
          marginBottom: "28px",
          boxShadow: "var(--shadow-md)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                background: "rgba(255, 255, 255, 0.2)",
                padding: "3px 10px",
                borderRadius: "var(--radius-full)",
              }}
            >
              {currentRole.scope}
            </span>
            <span style={{ fontSize: "13px", opacity: 0.85 }}>• {currentRole.badge}</span>
          </div>

          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#ffffff",
              margin: "0 0 8px",
              letterSpacing: "-0.02em",
            }}
          >
            Welcome back, {user?.name || user?.email}! 👋
          </h1>

          <p style={{ fontSize: "15px", color: "rgba(255, 255, 255, 0.85)", maxWidth: "680px", margin: 0 }}>
            {currentRole.description}
          </p>

          {/* Quick Action Shortcuts */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "20px" }}>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate("meetings")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "600",
                background: "#ffffff",
                color: "#312e81",
                border: "none",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              📅 View Meetings
            </button>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate("customers")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "600",
                background: "rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
              }}
            >
              🏢 Customer Accounts
            </button>
            {user?.role === "admin" && (
              <button
                type="button"
                onClick={() => onNavigate && onNavigate("users")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "600",
                  background: "rgba(255, 255, 255, 0.15)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                }}
              >
                👥 User Management
              </button>
            )}
          </div>
        </div>

        {/* Decorative background grid subtle effect */}
        <div
          style={{
            position: "absolute",
            top: "-40px",
            right: "-40px",
            width: "220px",
            height: "220px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* KPI Stats Row */}
      <div className="crm-stats-grid">
        <div
          className="crm-stat-card"
          onClick={() => onNavigate && onNavigate("meetings")}
          style={{ cursor: "pointer" }}
        >
          <div className="crm-stat-header">
            <span className="crm-stat-title">Total Meetings</span>
            <div className="crm-stat-icon-wrapper" style={{ background: "var(--primary-subtle)", color: "var(--primary)" }}>
              📅
            </div>
          </div>
          <div className="crm-stat-value">{loading ? "..." : stats.meetingsCount}</div>
          <div className="crm-stat-meta">
            <span style={{ color: "var(--success-text)", fontWeight: "600" }}>
              {stats.completedMeetings} completed
            </span>
            <span>• {stats.inProgressMeetings} in progress</span>
          </div>
        </div>

        <div
          className="crm-stat-card"
          onClick={() => onNavigate && onNavigate("customers")}
          style={{ cursor: "pointer" }}
        >
          <div className="crm-stat-header">
            <span className="crm-stat-title">Customer Accounts</span>
            <div className="crm-stat-icon-wrapper" style={{ background: "var(--info-subtle)", color: "var(--info-text)" }}>
              🏢
            </div>
          </div>
          <div className="crm-stat-value">{loading ? "..." : stats.customersCount}</div>
          <div className="crm-stat-meta">
            <span>Verified accounts ready for visits</span>
          </div>
        </div>

        <div
          className="crm-stat-card"
          onClick={() => onNavigate && onNavigate("followups")}
          style={{ cursor: "pointer" }}
        >
          <div className="crm-stat-header">
            <span className="crm-stat-title">Open Follow-ups</span>
            <div className="crm-stat-icon-wrapper" style={{ background: "var(--warning-subtle)", color: "var(--warning-text)" }}>
              ⏱️
            </div>
          </div>
          <div className="crm-stat-value">{loading ? "..." : stats.followUpsCount}</div>
          <div className="crm-stat-meta">
            <span>Tasks requiring rep action</span>
          </div>
        </div>

        <div className="crm-stat-card">
          <div className="crm-stat-header">
            <span className="crm-stat-title">Account Role</span>
            <div className="crm-stat-icon-wrapper" style={{ background: "var(--success-subtle)", color: "var(--success-text)" }}>
              🛡️
            </div>
          </div>
          <div className="crm-stat-value" style={{ fontSize: "20px", textTransform: "capitalize" }}>
            {user?.role}
          </div>
          <div className="crm-stat-meta">
            <span>Status: Active & Authorized</span>
          </div>
        </div>
      </div>

      {/* CRM Quick Guide / Feature Overview */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
          marginTop: "16px",
        }}
      >
        <div className="crm-record-card" style={{ marginBottom: 0 }}>
          <div className="crm-record-top">
            <div className="crm-record-title">🚀 Sales Meeting Lifecycle</div>
            <span className="crm-status-pill crm-status-confirmed">Workflow</span>
          </div>
          <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginBottom: "12px" }}>
            SalesPilot enforces strict lifecycle transitions to guarantee data integrity:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontWeight: "700", color: "var(--primary)" }}>1. Scheduled:</span>
              <span>Initial meeting draft created with customer and rep.</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontWeight: "700", color: "var(--info-text)" }}>2. Confirmed:</span>
              <span>Client confirmed date/time slot.</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontWeight: "700", color: "var(--warning-text)" }}>3. Check-In & Start:</span>
              <span>Rep checks in at customer location and begins meeting.</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontWeight: "700", color: "var(--danger-text)" }}>4. Pause / Resume:</span>
              <span>Temporary step-out tracking with audit reasoning.</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontWeight: "700", color: "var(--success-text)" }}>5. Complete:</span>
              <span>Final outcome recorded with automated follow-up generation.</span>
            </div>
          </div>
        </div>

        <div className="crm-record-card" style={{ marginBottom: 0 }}>
          <div className="crm-record-top">
            <div className="crm-record-title">🔒 Role Access Matrix</div>
            <span className="crm-status-pill crm-status-scheduled">RBAC Active</span>
          </div>
          <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginBottom: "12px" }}>
            SalesPilot secures permissions at API and UI layers:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="crm-role-badge employee">Employee</span>
              <span>Create meetings, execute own visits, view linked customers.</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="crm-role-badge manager">Manager</span>
              <span>Oversight of reporting reps, re-opening meetings, team analytics.</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="crm-role-badge admin">Admin</span>
              <span>Create users, assign managers, configure roles, full system view.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
