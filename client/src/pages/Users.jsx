import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import CreateUser from "../components/CreateUser";

export default function Users({ user }) {
  const isAdmin = user?.role === "admin";
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(isAdmin);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let isMounted = true;

    async function loadUsers() {
      try {
        setError("");
        const data = await apiRequest("/api/users");
        const list = Array.isArray(data)
          ? data
          : data.users || data.data?.users || data.data || [];

        if (!Array.isArray(list)) {
          throw new Error("Unexpected users API response.");
        }

        if (isMounted) {
          setUsers(list);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load users.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, [isAdmin, refreshKey]);

  if (!isAdmin) {
    return (
      <main>
        <div className="crm-page-header">
          <div>
            <h1 className="crm-page-title">User Management</h1>
            <p className="crm-page-subtitle">Access restricted</p>
          </div>
        </div>
        <div className="crm-alert crm-alert-error" role="alert">
          <span>Access Denied: User account management is restricted to system administrators.</span>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <div className="crm-empty-state">
        <div className="crm-empty-icon">⏳</div>
        <div className="crm-empty-title">Loading user accounts...</div>
        <div className="crm-empty-desc">Fetching user directory and role permissions from server.</div>
      </div>
    );
  }

  if (error) {
    return (
      <section>
        <div className="crm-page-header">
          <div>
            <h1 className="crm-page-title">User Management</h1>
            <p className="crm-page-subtitle">Manage accounts and role scopes</p>
          </div>
        </div>
        <div className="crm-alert crm-alert-error" role="alert">
          <span>{error}</span>
        </div>
        <button className="crm-btn crm-btn-secondary" onClick={() => setRefreshKey((k) => k + 1)}>
          Try again
        </button>
      </section>
    );
  }

  const existingManagers = users.filter((u) => u.role === "manager");

  return (
    <div>
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">User Management & Roles</h1>
          <p className="crm-page-subtitle">
            Admin console: Provision user accounts, assign team managers, and configure role scopes.
          </p>
        </div>

        <button
          id="toggle-create-user-btn"
          type="button"
          onClick={() => setShowCreateForm((prev) => !prev)}
          className={`crm-btn ${showCreateForm ? "crm-btn-secondary" : "crm-btn-primary"}`}
        >
          {showCreateForm ? "Cancel" : "+ Provision New User"}
        </button>
      </div>

      {showCreateForm && (
        <CreateUser
          existingManagers={existingManagers}
          onUserCreated={() => {
            setShowCreateForm(false);
            setRefreshKey((k) => k + 1);
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {users.length === 0 ? (
        <div className="crm-empty-state">
          <div className="crm-empty-icon">👥</div>
          <div className="crm-empty-title">No user accounts found</div>
          <div className="crm-empty-desc">
            No system accounts exist yet. Click &quot;+ Provision New User&quot; to create team accounts.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "16px",
          }}
        >
          {users.map((u) => {
            const initials = (u.name || u.email || "U")
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <article key={u.id || u._id} className="crm-record-card" style={{ marginBottom: 0 }}>
                <div className="crm-record-top">
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "var(--radius-full)",
                        background:
                          u.role === "admin"
                            ? "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)"
                            : u.role === "manager"
                            ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                            : "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "700",
                        fontSize: "14px",
                      }}
                    >
                      {initials}
                    </div>
                    <div>
                      <h3 className="crm-record-title">{u.name}</h3>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        ID: <code style={{ fontSize: "11px" }}>{u.id || u._id}</code>
                      </p>
                    </div>
                  </div>

                  <span className={`crm-role-badge ${u.role}`}>{u.role}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "14px", fontSize: "13.5px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "var(--text-muted)" }}>✉️ Email:</span>
                    <a href={`mailto:${u.email}`} style={{ color: "var(--primary)" }}>{u.email}</a>
                  </div>

                  {u.role === "employee" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>🛡️ Manager:</span>
                      <span style={{ color: "var(--text-primary)", fontWeight: "500" }}>
                        {u.manager?.name ? `${u.manager.name} (${u.manager.email})` : "Unassigned"}
                      </span>
                    </div>
                  )}

                  {u.createdAt && (
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                      Member since {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
