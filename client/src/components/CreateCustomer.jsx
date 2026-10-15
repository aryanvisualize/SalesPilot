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

      setSuccess("Customer account created successfully!");
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

  return (
    <section className="crm-form-card">
      <div style={{ marginBottom: "18px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-primary)" }}>
          Register New Customer Account
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
          Add account details and point of contact to schedule visits.
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
          <label htmlFor="accountName" className="crm-label">
            Account / Company Name *
          </label>
          <input
            id="accountName"
            name="accountName"
            type="text"
            className="crm-input"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="e.g. Acme Corporation"
            required
            disabled={submitting}
          />
        </div>

        <div className="crm-form-group">
          <label htmlFor="contactPerson" className="crm-label">
            Primary Contact Person *
          </label>
          <input
            id="contactPerson"
            name="contactPerson"
            type="text"
            className="crm-input"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            placeholder="e.g. Jane Doe (Procurement Director)"
            required
            disabled={submitting}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          <div className="crm-form-group">
            <label htmlFor="email" className="crm-label">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="crm-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@acme.com"
              disabled={submitting}
            />
          </div>

          <div className="crm-form-group">
            <label htmlFor="phone" className="crm-label">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="crm-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 234-5678"
              disabled={submitting}
            />
          </div>
        </div>

        <div className="crm-form-group">
          <label htmlFor="address" className="crm-label">
            Office / Site Address
          </label>
          <textarea
            id="address"
            name="address"
            rows="2"
            className="crm-textarea"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 100 Main Street, Suite 400, Chicago, IL"
            disabled={submitting}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            type="submit"
            disabled={submitting}
            className="crm-btn crm-btn-primary"
          >
            {submitting ? "Creating..." : "Save Customer Account"}
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
