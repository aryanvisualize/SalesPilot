import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

export default function Login({ onLogin }) {
  // Sync with browser pathname (/register vs /login or /)
  const [mode, setMode] = useState(() => {
    return window.location.pathname.toLowerCase().includes("register") ? "register" : "login";
  });

  // Listen to popstate (browser back/forward button)
  useEffect(() => {
    function handlePopState() {
      const isRegister = window.location.pathname.toLowerCase().includes("register");
      setMode(isRegister ? "register" : "login");
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function switchMode(newMode) {
    setMode(newMode);
    setError("");
    const targetPath = newMode === "register" ? "/register" : "/login";
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, "", targetPath);
    }
  }

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Registration form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("employee"); // "employee" | "manager"

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLoginSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const token = data.token || data.data?.token;

      if (!token) {
        throw new Error("Login succeeded, but no token was returned.");
      }

      localStorage.setItem("salespilot_token", token);
      
      // Clean up URL so dashboard displays on root "/"
      if (window.location.pathname !== "/") {
        window.history.replaceState(null, "", "/");
      }
      
      onLogin(data);
    } catch (err) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault();
    setError("");

    if (!regName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!regEmail.trim()) {
      setError("Email address is required.");
      return;
    }

    if (regPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim().toLowerCase(),
          password: regPassword,
          role: regRole,
        }),
      });

      const token = data.token || data.data?.token;

      if (!token) {
        throw new Error("Registration succeeded, but no token was returned.");
      }

      localStorage.setItem("salespilot_token", token);

      // Clean up URL so dashboard displays on root "/"
      if (window.location.pathname !== "/") {
        window.history.replaceState(null, "", "/");
      }

      onLogin(data);
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleQuickFillAdmin() {
    switchMode("login");
    setEmail("admin@salespilot.com");
    setPassword("Admin123!");
    setError("");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        background: "radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.12) 0%, transparent 70%), var(--bg-app)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-xl)",
          padding: "36px 32px",
          textAlign: "left",
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              margin: "0 auto 14px",
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.35)",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
            </svg>
          </div>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: "700",
              letterSpacing: "-0.02em",
              margin: "0 0 6px",
              color: "var(--text-primary)",
            }}
          >
            SalesPilot CRM
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
            Sales Meeting & Visit Management System
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: "flex",
            background: "var(--bg-subtle)",
            padding: "4px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            marginBottom: "24px",
          }}
        >
          <button
            id="tab-sign-in"
            type="button"
            onClick={() => switchMode("login")}
            style={{
              flex: 1,
              padding: "8px 0",
              fontSize: "13.5px",
              fontWeight: mode === "login" ? "600" : "500",
              color: mode === "login" ? "var(--primary)" : "var(--text-secondary)",
              background: mode === "login" ? "var(--bg-card)" : "transparent",
              border: "none",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              boxShadow: mode === "login" ? "var(--shadow-xs)" : "none",
              transition: "all var(--transition-fast)",
            }}
          >
            Sign In
          </button>
          <button
            id="tab-register"
            type="button"
            onClick={() => switchMode("register")}
            style={{
              flex: 1,
              padding: "8px 0",
              fontSize: "13.5px",
              fontWeight: mode === "register" ? "600" : "500",
              color: mode === "register" ? "var(--primary)" : "var(--text-secondary)",
              background: mode === "register" ? "var(--bg-card)" : "transparent",
              border: "none",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              boxShadow: mode === "register" ? "var(--shadow-xs)" : "none",
              transition: "all var(--transition-fast)",
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="crm-alert crm-alert-error" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {mode === "login" ? (
          /* Sign In Form */
          <form onSubmit={handleLoginSubmit}>
            <div className="crm-form-group">
              <label className="crm-label" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="crm-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@salespilot.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="crm-form-group">
              <label className="crm-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="crm-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              id="submit-login-btn"
              type="submit"
              disabled={loading}
              className="crm-btn crm-btn-primary"
              style={{ width: "100%", padding: "10px", marginTop: "8px" }}
            >
              {loading ? "Authenticating..." : "Sign In to Workspace"}
            </button>
          </form>
        ) : (
          /* Registration Form */
          <form onSubmit={handleRegisterSubmit}>
            <div className="crm-form-group">
              <label className="crm-label" htmlFor="reg-name">
                Full Name *
              </label>
              <input
                id="reg-name"
                type="text"
                className="crm-input"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Alex Morgan"
                required
              />
            </div>

            <div className="crm-form-group">
              <label className="crm-label" htmlFor="reg-email">
                Work Email *
              </label>
              <input
                id="reg-email"
                type="email"
                className="crm-input"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="alex@salespilot.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="crm-form-group">
              <label className="crm-label" htmlFor="reg-password">
                Password (min 8 characters) *
              </label>
              <input
                id="reg-password"
                type="password"
                className="crm-input"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <div className="crm-form-group">
              <label className="crm-label" htmlFor="reg-role">
                Select Your Role *
              </label>
              <select
                id="reg-role"
                className="crm-select"
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
              >
                <option value="employee">Sales Representative (Employee)</option>
                <option value="manager">Sales Manager (Team Lead)</option>
              </select>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                {regRole === "employee"
                  ? "Access your assigned meetings, customer visits, and follow-ups."
                  : "Supervise team meetings, monitor lifecycle progress, and re-open completed visits."}
              </span>
            </div>

            <button
              id="submit-register-btn"
              type="submit"
              disabled={loading}
              className="crm-btn crm-btn-primary"
              style={{ width: "100%", padding: "10px", marginTop: "8px" }}
            >
              {loading ? "Creating Account..." : "Create Account & Sign In"}
            </button>
          </form>
        )}

        {/* Quick Demo Credentials for Evaluation */}
        <div
          style={{
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px dashed var(--border-strong)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>
            Admin bootstrap demo: <strong style={{ color: "var(--text-primary)" }}>admin@salespilot.com</strong>
          </div>
          <button
            type="button"
            onClick={handleQuickFillAdmin}
            className="crm-btn crm-btn-secondary"
            style={{ fontSize: "12px", padding: "5px 12px" }}
          >
            ⚡ Auto-fill Admin Credentials
          </button>
        </div>
      </div>
    </div>
  );
}
