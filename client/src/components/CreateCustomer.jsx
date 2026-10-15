import { useState } from "react";
import { apiRequest } from "../services/api";

export default function CreateCustomer({ onCustomerCreated, onCancel }) {
  const [accountName, setAccountName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!accountName.trim()) {
      setError("Account name is required.");
      return;
    }

    if (!contactPerson.trim()) {
      setError("Contact person is required.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        accountName: accountName.trim(),
        contactPerson: contactPerson.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
      };

      const data = await apiRequest("/api/customers", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const newCustomer = data.customer || data.data?.customer || data;

      setSuccess("Customer created successfully!");
      setAccountName("");
      setContactPerson("");
      setEmail("");
      setPhone("");
      setAddress("");

      if (onCustomerCreated) {
        onCustomerCreated(newCustomer);
      }
    } catch (err) {
      setError(err.message || "Failed to create customer.");
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
      <h2 style={{ marginTop: 0, marginBottom: "16px" }}>Add New Customer</h2>

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
          <label htmlFor="accountName" style={labelStyle}>
            Account / Company Name *
          </label>
          <input
            id="accountName"
            name="accountName"
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="e.g. Acme Corporation"
            required
            disabled={submitting}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label htmlFor="contactPerson" style={labelStyle}>
            Contact Person *
          </label>
          <input
            id="contactPerson"
            name="contactPerson"
            type="text"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            placeholder="e.g. Jane Doe"
            required
            disabled={submitting}
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
          <div style={{ flex: "1 1 220px" }}>
            <label htmlFor="email" style={labelStyle}>
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. contact@acme.com"
              disabled={submitting}
              style={inputStyle}
            />
          </div>

          <div style={{ flex: "1 1 220px" }}>
            <label htmlFor="phone" style={labelStyle}>
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +1 555-0199"
              disabled={submitting}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label htmlFor="address" style={labelStyle}>
            Address
          </label>
          <textarea
            id="address"
            name="address"
            rows="2"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 100 Main Street, Suite 200, City, State"
            disabled={submitting}
            style={inputStyle}
          />
        </div>

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
            {submitting ? "Creating customer..." : "Create Customer"}
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
