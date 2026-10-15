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
  const [activeTab, setActiveTab] = useState("meetings");

  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem("salespilot_token");

      if (!token) {
        setCheckingSession(false);
        return;
      }

      try {
        const data = await apiRequest("/api/auth/me");
        setUser(data.user || data.data?.user || data);
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
    setUser(data.user || data.data?.user || null);
  }

  function handleLogout() {
    localStorage.removeItem("salespilot_token");
    setUser(null);
  }

  if (checkingSession) {
    return <p>Checking session...</p>;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div>
      <Dashboard user={user} onLogout={handleLogout} />

      <nav
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "12px",
          margin: "20px 0",
        }}
      >
        <button
          id="nav-meetings-btn"
          type="button"
          onClick={() => setActiveTab("meetings")}
          style={{
            padding: "8px 20px",
            fontSize: "15px",
            fontWeight: "600",
            borderRadius: "6px",
            border: "1px solid var(--border, #ccc)",
            background: activeTab === "meetings" ? "var(--accent, #7c3aed)" : "var(--code-bg, #eee)",
            color: activeTab === "meetings" ? "#fff" : "var(--text-h, #111)",
            cursor: "pointer",
          }}
        >
          Meetings
        </button>
        <button
          id="nav-customers-btn"
          type="button"
          onClick={() => setActiveTab("customers")}
          style={{
            padding: "8px 20px",
            fontSize: "15px",
            fontWeight: "600",
            borderRadius: "6px",
            border: "1px solid var(--border, #ccc)",
            background: activeTab === "customers" ? "var(--accent, #7c3aed)" : "var(--code-bg, #eee)",
            color: activeTab === "customers" ? "#fff" : "var(--text-h, #111)",
            cursor: "pointer",
          }}
        >
          Customers
        </button>
        <button
          id="nav-followups-btn"
          type="button"
          onClick={() => setActiveTab("followups")}
          style={{
            padding: "8px 20px",
            fontSize: "15px",
            fontWeight: "600",
            borderRadius: "6px",
            border: "1px solid var(--border, #ccc)",
            background: activeTab === "followups" ? "var(--accent, #7c3aed)" : "var(--code-bg, #eee)",
            color: activeTab === "followups" ? "#fff" : "var(--text-h, #111)",
            cursor: "pointer",
          }}
        >
          Follow-ups
        </button>
        {user.role === "admin" && (
          <button
            id="nav-users-btn"
            type="button"
            onClick={() => setActiveTab("users")}
            style={{
              padding: "8px 20px",
              fontSize: "15px",
              fontWeight: "600",
              borderRadius: "6px",
              border: "1px solid var(--border, #ccc)",
              background: activeTab === "users" ? "var(--accent, #7c3aed)" : "var(--code-bg, #eee)",
              color: activeTab === "users" ? "#fff" : "var(--text-h, #111)",
              cursor: "pointer",
            }}
          >
            User Management
          </button>
        )}
      </nav>

      {activeTab === "meetings" && <Meetings user={user} />}
      {activeTab === "customers" && <Customers user={user} />}
      {activeTab === "followups" && <FollowUps user={user} />}
      {activeTab === "users" && user.role === "admin" && <Users user={user} />}
    </div>
  );
}