import { useState } from "react";
import { apiRequest } from "../services/api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CreateUser({ existingManagers = [], onUserCreated, onCancel }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [manager, setManager] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      setError("A valid email address is required.");
      return;
    }

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!["employee", "manager"].includes(role)) {
      setError("Please select a valid role (Employee or Manager).");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        ...(role === "employee" && manager ? { manager } : {}),
      };

      const data = await apiRequest("/api/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const newUser = data.user || data.data?.user || data;

      setSuccess(`User account for ${newUser.name || newUser.email} created successfully!`);
      setName("");
      setEmail("");
      setPassword("");
      setRole("employee");
      setManager("");

      if (onUserCreated) {
        onUserCreated(newUser);
      }
    } catch (err) {
      setError(err.message || "Failed to create user account.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid var(--border, #ccc)",
    background: "var(--bg, #fff)",
    color: "var(--text-h, #111)",
    fontSize: "14px",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontWeight: "600",
    marginBottom: "6px",
    fontSize: "14px",
    color: "var(--text-h, #111)",
  };

  return (
    <section
      style={{
        border: "1px solid var(--border, #ddd)",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "24px",
        textAlign: "left",
        background: "var(--code-bg, #fcfcfc)",
        maxWidth: "600px",
        marginInline: "auto",
        boxSizing: "border-box",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: "16px" }}>Create New User Account</h2>

      {error && (
        <p
          role="alert"
          style={{
            color: "#dc2626",
            background: "rgba(220, 38, 38, 0.1)",
            padding: "10px 12px",
            borderRadius: "6px",
            marginBottom: "14px",
            fontSize: "14px",
          }}
        >
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          style={{
            color: "#16a34a",
            background: "rgba(22, 163, 74, 0.1)",
            padding: "10px 12px",
            borderRadius: "6px",
            marginBottom: "14px",
            fontSize: "14px",
          }}
        >
          {success}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "14px" }}>
          <label htmlFor="user-name" style={labelStyle}>
            Full Name *
          </label>
          <input
            id="user-name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Morgan"
            required
            disabled={submitting}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label htmlFor="user-email" style={labelStyle}>
            Email Address *
          </label>
          <input
            id="user-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. alex@salespilot.com"
            required
            disabled={submitting}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label htmlFor="user-password" style={labelStyle}>
            Initial Password (min 8 chars) *
          </label>
          <input
            id="user-password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={8}
            disabled={submitting}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label htmlFor="user-role" style={labelStyle}>
            Account Role *
          </label>
          <select
            id="user-role"
            name="role"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              if (e.target.value !== "employee") {
                setManager("");
              }
            }}
            required
            disabled={submitting}
            style={inputStyle}
          >
            <option value="employee">Sales Employee</option>
            <option value="manager">Sales Manager</option>
          </select>
        </div>

        {role === "employee" && (
          <div style={{ marginBottom: "14px" }}>
            <label htmlFor="user-manager" style={labelStyle}>
              Assigned Manager (Optional)
            </label>
            <select
              id="user-manager"
              name="manager"
              value={manager}
              onChange={(e) => setManager(e.target.value)}
              disabled={submitting}
              style={inputStyle}
            >
              <option value="">-- No Assigned Manager --</option>
              {existingManagers.map((m) => (
                <option key={m.id || m._id} value={m.id || m._id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
            <span style={{ fontSize: "12px", color: "var(--text, #777)", marginTop: "4px", display: "block" }}>
              Employees can be assigned to a manager to enable team oversight.
            </span>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "9px 18px",
              borderRadius: "6px",
              border: "none",
              background: "var(--accent, #7c3aed)",
              color: "#fff",
              fontWeight: "600",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Creating user..." : "Create User"}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              style={{
                padding: "9px 18px",
                borderRadius: "6px",
                border: "1px solid var(--border, #ccc)",
                background: "transparent",
                color: "var(--text, #555)",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
