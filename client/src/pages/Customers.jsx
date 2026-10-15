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

  if (loading) return <p>Loading customers...</p>;

  if (error) {
    return (
      <section>
        <h2>Customers</h2>
        <p role="alert">{error}</p>
        <button onClick={() => setRefreshKey((k) => k + 1)}>Try again</button>
      </section>
    );
  }

  return (
    <main>
      <h1>Customers</h1>

      <div style={{ marginBottom: "20px" }}>
        <button
          id="toggle-create-customer-btn"
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
          {showCreateForm ? "Cancel" : "+ Add Customer"}
        </button>
      </div>

      {showCreateForm && (
        <CreateCustomer
          onCustomerCreated={() => {
            setRefreshKey((k) => k + 1);
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {customers.length === 0 ? (
        <p>No customers found. Click &quot;+ Add Customer&quot; to create your first customer.</p>
      ) : (
        <div>
          {customers.map((c) => (
            <article
              key={c._id}
              style={{
                border: "1px solid var(--border, #ddd)",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "12px",
                textAlign: "left",
                background: "var(--bg, #fff)",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "8px", color: "var(--text-h, #111)" }}>
                {c.accountName}
              </h3>

              <p style={{ margin: "4px 0" }}>
                <strong>Contact Person:</strong> {c.contactPerson}
              </p>

              {c.email && (
                <p style={{ margin: "4px 0" }}>
                  <strong>Email:</strong> {c.email}
                </p>
              )}

              {c.phone && (
                <p style={{ margin: "4px 0" }}>
                  <strong>Phone:</strong> {c.phone}
                </p>
              )}

              {c.address && (
                <p style={{ margin: "4px 0" }}>
                  <strong>Address:</strong> {c.address}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
