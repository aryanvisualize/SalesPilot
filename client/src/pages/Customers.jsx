import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import CreateCustomer from "../components/CreateCustomer";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadCustomers() {
      try {
        setError("");
        const data = await apiRequest("/api/customers");
        const list = Array.isArray(data)
          ? data
          : data.customers || data.data?.customers || data.data || [];

        if (!Array.isArray(list)) {
          throw new Error("Unexpected customers API response.");
        }

        if (isMounted) {
          setCustomers(list);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load customers.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCustomers();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="crm-empty-state">
        <div className="crm-empty-icon">⏳</div>
        <div className="crm-empty-title">Loading customer accounts...</div>
        <div className="crm-empty-desc">Fetching client directories and contact points from SalesPilot.</div>
      </div>
    );
  }

  if (error) {
    return (
      <section>
        <div className="crm-page-header">
          <div>
            <h1 className="crm-page-title">Customer Accounts</h1>
            <p className="crm-page-subtitle">Directory of registered client accounts</p>
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

  return (
    <div>
      {/* Header */}
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Customer Accounts</h1>
          <p className="crm-page-subtitle">
            Manage your client directory, primary points of contact, and business locations.
          </p>
        </div>

        <button
          id="toggle-create-customer-btn"
          type="button"
          onClick={() => setShowCreateForm((prev) => !prev)}
          className={`crm-btn ${showCreateForm ? "crm-btn-secondary" : "crm-btn-primary"}`}
        >
          {showCreateForm ? "Cancel" : "+ Add Customer Account"}
        </button>
      </div>

      {showCreateForm && (
        <CreateCustomer
          onCustomerCreated={() => {
            setShowCreateForm(false);
            setRefreshKey((k) => k + 1);
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {customers.length === 0 ? (
        <div className="crm-empty-state">
          <div className="crm-empty-icon">🏢</div>
          <div className="crm-empty-title">No customer accounts registered</div>
          <div className="crm-empty-desc">
            Your customer directory is empty. Click &quot;+ Add Customer Account&quot; to add your first company record.
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
          {customers.map((c) => {
            const initials = c.accountName
              ? c.accountName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
              : "AC";

            return (
              <article key={c._id} className="crm-record-card" style={{ marginBottom: 0 }}>
                <div className="crm-record-top">
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "var(--radius-md)",
                        background: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "700",
                        fontSize: "14px",
                        boxShadow: "0 2px 6px rgba(2, 132, 199, 0.25)",
                      }}
                    >
                      {initials}
                    </div>
                    <div>
                      <h3 className="crm-record-title">{c.accountName}</h3>
                      <p style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                        ID: <code style={{ fontSize: "11px" }}>{c._id}</code>
                      </p>
                    </div>
                  </div>
                  <span className="crm-status-pill crm-status-confirmed">Verified</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "14px", fontSize: "13.5px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "var(--text-muted)" }}>👤 Contact:</span>
                    <strong style={{ color: "var(--text-primary)" }}>{c.contactPerson}</strong>
                  </div>

                  {c.email && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>✉️ Email:</span>
                      <a href={`mailto:${c.email}`} style={{ color: "var(--primary)" }}>{c.email}</a>
                    </div>
                  )}

                  {c.phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>📞 Phone:</span>
                      <span style={{ color: "var(--text-secondary)" }}>{c.phone}</span>
                    </div>
                  )}

                  {c.address && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginTop: "2px" }}>
                      <span style={{ color: "var(--text-muted)" }}>📍 Address:</span>
                      <span style={{ color: "var(--text-secondary)" }}>{c.address}</span>
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
