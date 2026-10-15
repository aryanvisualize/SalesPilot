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

  return (
    <section className="crm-form-card">
      <div style={{ marginBottom: "18px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-primary)" }}>
          Provision User Account
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
          Create credentials and assign organizational roles for your sales team.
        </p>
      </div>

      {error && (
        <div className="crm-alert crm-alert-error" role="alert">
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="crm-alert crm-alert-success" role="status">
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="crm-form-group">
          <label htmlFor="user-name" className="crm-label">
            Full Name *
          </label>
          <input
            id="user-name"
            name="name"
            type="text"
            className="crm-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Morgan"
            required
            disabled={submitting}
          />
        </div>

        <div className="crm-form-group">
          <label htmlFor="user-email" className="crm-label">
            Work Email Address *
          </label>
          <input
            id="user-email"
            name="email"
            type="email"
            className="crm-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex@salespilot.com"
            required
            disabled={submitting}
          />
        </div>

        <div className="crm-form-group">
          <label htmlFor="user-password" className="crm-label">
            Initial Temporary Password (min 8 chars) *
          </label>
          <input
            id="user-password"
            name="password"
            type="password"
            className="crm-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={8}
            disabled={submitting}
          />
        </div>

        <div className="crm-form-group">
          <label htmlFor="user-role" className="crm-label">
            Role & Access Level *
          </label>
          <select
            id="user-role"
            name="role"
            className="crm-select"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              if (e.target.value !== "employee") {
                setManager("");
              }
            }}
            required
            disabled={submitting}
          >
            <option value="employee">Sales Representative (Employee)</option>
            <option value="manager">Sales Manager (Lead)</option>
          </select>
        </div>

        {role === "employee" && (
          <div className="crm-form-group">
            <label htmlFor="user-manager" className="crm-label">
              Assigned Sales Manager (Optional)
            </label>
            <select
              id="user-manager"
              name="manager"
              className="crm-select"
              value={manager}
              onChange={(e) => setManager(e.target.value)}
              disabled={submitting}
            >
              <option value="">-- No Assigned Manager (Self-directed) --</option>
              {existingManagers.map((m) => (
                <option key={m.id || m._id} value={m.id || m._id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
              Assigning a manager grants that manager visibility into this employee&apos;s meetings and follow-ups.
            </span>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            type="submit"
            disabled={submitting}
            className="crm-btn crm-btn-primary"
          >
            {submitting ? "Provisioning..." : "Provision Account"}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="crm-btn crm-btn-secondary"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
