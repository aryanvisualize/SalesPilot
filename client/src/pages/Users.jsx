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
        <h1>User Management</h1>
        <p
          role="alert"
          style={{
            color: "#dc2626",
            background: "rgba(220, 38, 38, 0.1)",
            padding: "12px",
            borderRadius: "6px",
            maxWidth: "500px",
            marginInline: "auto",
          }}
        >
          Access Denied: User account management is restricted to system administrators.
        </p>
      </main>
    );
  }

  if (loading) return <p>Loading users...</p>;

  if (error) {
    return (
      <section>
        <h2>User Management</h2>
        <p role="alert">{error}</p>
        <button onClick={() => setRefreshKey((k) => k + 1)}>Try again</button>
      </section>
    );
  }

  const existingManagers = users.filter((u) => u.role === "manager");

  const roleBadgeStyle = (role) => {
    let bg = "rgba(107, 99, 117, 0.15)";
    let color = "#6b6375";

    if (role === "admin") {
      bg = "rgba(220, 38, 38, 0.15)";
      color = "#dc2626";
    } else if (role === "manager") {
      bg = "rgba(170, 59, 255, 0.15)";
      color = "#aa3bff";
    } else if (role === "employee") {
      bg = "rgba(14, 165, 233, 0.15)";
      color = "#0284c7";
    }

    return {
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "600",
      textTransform: "capitalize",
      background: bg,
      color,
    };
  };

  return (
    <main>
      <h1>User Management</h1>

      <div style={{ marginBottom: "20px" }}>
        <button
          id="toggle-create-user-btn"
          type="button"
          onClick={() => setShowCreateForm((prev) => !prev)}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            cursor: "pointer",
            borderRadius: "6px",
            border: "1px solid var(--border, #ccc)",
            background: showCreateForm ? "var(--code-bg, #eee)" : "var(--accent-bg, #f3e8ff)",
            color: "var(--text-h, #111)",
            fontWeight: "600",
          }}
        >
          {showCreateForm ? "Cancel" : "+ Create User"}
        </button>
      </div>

      {showCreateForm && (
        <CreateUser
          existingManagers={existingManagers}
          onUserCreated={() => {
            setRefreshKey((k) => k + 1);
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {users.length === 0 ? (
        <p>No user accounts found.</p>
      ) : (
        <div>
          {users.map((u) => (
            <article
              key={u.id || u._id}
              style={{
                border: "1px solid var(--border, #ddd)",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "12px",
                textAlign: "left",
                background: "var(--bg, #fff)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <h3 style={{ margin: 0, color: "var(--text-h, #111)" }}>{u.name}</h3>
                <span style={roleBadgeStyle(u.role)}>{u.role}</span>
              </div>

              <p style={{ margin: "4px 0" }}>
                <strong>Email:</strong> {u.email}
              </p>

              {u.role === "employee" && (
                <p style={{ margin: "4px 0" }}>
                  <strong>Assigned Manager:</strong>{" "}
                  {u.manager?.name ? `${u.manager.name} (${u.manager.email})` : "None"}
                </p>
              )}

              {u.createdAt && (
                <p style={{ margin: "4px 0", fontSize: "12px", color: "var(--text, #777)" }}>
                  Created on {new Date(u.createdAt).toLocaleDateString()}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
