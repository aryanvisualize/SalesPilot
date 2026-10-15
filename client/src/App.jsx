import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Meetings from "./pages/Meetings";
import Customers from "./pages/Customers";
import FollowUps from "./pages/FollowUps";
import Users from "./pages/Users";
import { apiRequest } from "./services/api";

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem("salespilot_token");

      if (!token) {
        setCheckingSession(false);
        return;
      }

      try {
        const data = await apiRequest("/api/auth/me");
        const currentUser = data.user || data.data?.user || data;
        setUser(currentUser);

        // If user is authenticated but the address bar says /register or /login,
        // reset cleanly to root "/" so the dashboard doesn't display "/register" in the browser URL.
        const path = window.location.pathname.toLowerCase();
        if (path === "/register" || path === "/login") {
          window.history.replaceState(null, "", "/");
        }
      } catch {
        localStorage.removeItem("salespilot_token");
        setUser(null);
      } finally {
        setCheckingSession(false);
      }
    }

    restoreSession();
  }, []);

  function handleLogin(data) {
    const loggedUser = data.user || data.data?.user || null;
    setUser(loggedUser);
    setActiveTab("dashboard");

    // Clean address bar back to "/" upon login/register
    if (window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }
  }

  function handleLogout() {
    localStorage.removeItem("salespilot_token");
    setUser(null);
    window.history.replaceState(null, "", "/login");
  }

  if (checkingSession) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          background: "var(--bg-app)",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid var(--border-strong)",
            borderTopColor: "var(--primary)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Loading SalesPilot workspace...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const userInitials = (user?.name || user?.email || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--bg-app)" }}>
      {/* Top CRM Navigation Header */}
      <header className="crm-navbar">
        <div className="crm-navbar-container">
          {/* Logo & Brand */}
          <div className="crm-brand" onClick={() => setActiveTab("dashboard")}>
            <div className="crm-brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
              </svg>
            </div>
            <div>
              <span className="crm-brand-text">SalesPilot</span>
              <span className="crm-brand-tag" style={{ marginLeft: "8px" }}>CRM</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="crm-nav-tabs">
            <button
              id="nav-dashboard-btn"
              type="button"
              className={`crm-nav-tab ${activeTab === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveTab("dashboard")}
            >
              <span>📊</span> Dashboard
            </button>
            <button
              id="nav-meetings-btn"
              type="button"
              className={`crm-nav-tab ${activeTab === "meetings" ? "active" : ""}`}
              onClick={() => setActiveTab("meetings")}
            >
              <span>📅</span> Meetings
            </button>
            <button
              id="nav-customers-btn"
              type="button"
              className={`crm-nav-tab ${activeTab === "customers" ? "active" : ""}`}
              onClick={() => setActiveTab("customers")}
            >
              <span>🏢</span> Customers
            </button>
            <button
              id="nav-followups-btn"
              type="button"
              className={`crm-nav-tab ${activeTab === "followups" ? "active" : ""}`}
              onClick={() => setActiveTab("followups")}
            >
              <span>⏳</span> Follow-ups
            </button>
            {user.role === "admin" && (
              <button
                id="nav-users-btn"
                type="button"
                className={`crm-nav-tab ${activeTab === "users" ? "active" : ""}`}
                onClick={() => setActiveTab("users")}
              >
                <span>👥</span> User Management
              </button>
            )}
          </nav>

          {/* User Profile Chip & Actions */}
          <div className="crm-user-profile">
            <div className="crm-user-chip">
              <div className="crm-avatar">{userInitials}</div>
              <div className="crm-user-details">
                <span className="crm-user-name">{user.name || user.email}</span>
                <span className={`crm-role-badge ${user.role}`}>{user.role}</span>
              </div>
            </div>

            <button
              id="logout-btn"
              type="button"
              onClick={handleLogout}
              className="crm-logout-btn"
              title="Sign out of SalesPilot"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="crm-main-container">
        {activeTab === "dashboard" && (
          <Dashboard user={user} onNavigate={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === "meetings" && <Meetings user={user} />}
        {activeTab === "customers" && <Customers user={user} />}
        {activeTab === "followups" && <FollowUps user={user} />}
        {activeTab === "users" && user.role === "admin" && <Users user={user} />}
      </main>
    </div>
  );
}