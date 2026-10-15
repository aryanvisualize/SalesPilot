import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

export default function CreateMeeting({ user, onMeetingCreated, onCancel }) {
  const [fetchedUser, setFetchedUser] = useState(null);
  const currentUser = user || fetchedUser;

  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customerError, setCustomerError] = useState("");

  const [customer, setCustomer] = useState("");
  const [purpose, setPurpose] = useState("");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [assignedTo, setAssignedTo] = useState(() => {
    return user?.role === "manager" ? user.id || user._id || "" : "";
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Restore current user if not provided via props
  useEffect(() => {
    if (!user) {
      let isMounted = true;
      apiRequest("/api/auth/me")
        .then((data) => {
          if (isMounted) {
            const u = data.user || data.data?.user || data;
            setFetchedUser(u);
            if (u.role === "manager") {
              setAssignedTo((prev) => prev || u.id || u._id || "");
            }
          }
        })
        .catch(() => {
          // Handled during submission if unauthenticated
        });

      return () => {
        isMounted = false;
      };
    }
  }, [user]);

  // Fetch customers from existing backend API
  useEffect(() => {
    let isMounted = true;

    async function fetchCustomers() {
      setLoadingCustomers(true);
      setCustomerError("");

      try {
        const data = await apiRequest("/api/customers");
        const list = Array.isArray(data)
          ? data
          : data.customers || data.data?.customers || data.data || [];

        if (isMounted) {
          if (!Array.isArray(list)) {
            throw new Error("Unexpected customers API response.");
          }
          setCustomers(list);
        }
      } catch (err) {
        if (isMounted) {
          setCustomerError(err.message || "Failed to load customers.");
        }
      } finally {
        if (isMounted) {
          setLoadingCustomers(false);
        }
      }
    }

    fetchCustomers();

    return () => {
      isMounted = false;
    };
  }, []);

  const isEmployee = currentUser?.role === "employee";
  const isAdmin = currentUser?.role === "admin";
  const currentUserId = currentUser?.id || currentUser?._id || "";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!customer) {
      setError("Please select a customer.");
      return;
    }

    if (!purpose.trim()) {
      setError("Meeting purpose is required.");
      return;
    }

    if (!scheduledStart) {
      setError("Scheduled start date and time are required.");
      return;
    }

    if (!scheduledEnd) {
      setError("Scheduled end date and time are required.");
      return;
    }

    const start = new Date(scheduledStart);
    const end = new Date(scheduledEnd);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError("Please provide valid start and end dates/times.");
      return;
    }

    if (end <= start) {
      setError("End time must be after start time.");
      return;
    }

    if (!location.trim()) {
      setError("Meeting location is required.");
      return;
    }

    const finalAssignedTo = isEmployee
      ? currentUserId
      : assignedTo.trim() || (currentUser?.role === "manager" ? currentUserId : "");

    if (!finalAssignedTo) {
      setError(
        isAdmin
          ? "Please provide an employee or manager User ID to assign this meeting."
          : "Assigned employee ID is required."
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        customer,
        assignedTo: finalAssignedTo,
        purpose: purpose.trim(),
        scheduledStart: start.toISOString(),
        scheduledEnd: end.toISOString(),
        location: location.trim(),
        notes: notes ? notes.trim() : "",
      };

      const data = await apiRequest("/api/meetings", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const newMeeting = data.meeting || data.data?.meeting || data;

      setSuccess("Meeting scheduled successfully!");
      setCustomer("");
      setPurpose("");
      setScheduledStart("");
      setScheduledEnd("");
      setLocation("");
      setNotes("");
      if (!isEmployee) {
        setAssignedTo(currentUser?.role === "manager" ? currentUserId : "");
      }

      if (onMeetingCreated) {
        onMeetingCreated(newMeeting);
      }
    } catch (err) {
      setError(err.message || "Failed to create meeting.");
    } finally {
      setSubmitting(false);
    }
  }

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
      <h2 style={{ marginTop: 0, marginBottom: "16px" }}>Schedule Meeting</h2>

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
          <label
            htmlFor="customer"
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
              color: "var(--text-h, #111)",
            }}
          >
            Customer *
          </label>
          <select
            id="customer"
            name="customer"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            disabled={loadingCustomers || submitting}
            required
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "6px",
              border: "1px solid var(--border, #ccc)",
              background: "var(--bg, #fff)",
              color: "var(--text-h, #111)",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          >
            <option value="">
              {loadingCustomers ? "Loading customers..." : "-- Select Customer --"}
            </option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.accountName} {c.contactPerson ? `(${c.contactPerson})` : ""}
              </option>
            ))}
          </select>
          {customerError && (
            <p
              role="alert"
              style={{
                color: "#dc2626",
                fontSize: "13px",
                marginTop: "4px",
              }}
            >
              {customerError}
            </p>
          )}
          {!loadingCustomers && customers.length === 0 && !customerError && (
            <p style={{ fontSize: "13px", color: "var(--text, #666)", marginTop: "4px" }}>
              No customers found. Please add a customer first.
            </p>
          )}
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label
            htmlFor="purpose"
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
              color: "var(--text-h, #111)",
            }}
          >
            Meeting Purpose *
          </label>
          <input
            id="purpose"
            name="purpose"
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g. Product demonstration"
            disabled={submitting}
            required
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "6px",
              border: "1px solid var(--border, #ccc)",
              background: "var(--bg, #fff)",
              color: "var(--text-h, #111)",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "14px",
          }}
        >
          <div style={{ flex: "1 1 220px" }}>
            <label
              htmlFor="scheduledStart"
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "6px",
                fontSize: "14px",
                color: "var(--text-h, #111)",
              }}
            >
              Start Date & Time *
            </label>
            <input
              id="scheduledStart"
              name="scheduledStart"
              type="datetime-local"
              value={scheduledStart}
              onChange={(e) => setScheduledStart(e.target.value)}
              disabled={submitting}
              required
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid var(--border, #ccc)",
                background: "var(--bg, #fff)",
                color: "var(--text-h, #111)",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ flex: "1 1 220px" }}>
            <label
              htmlFor="scheduledEnd"
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "6px",
                fontSize: "14px",
                color: "var(--text-h, #111)",
              }}
            >
              End Date & Time *
            </label>
            <input
              id="scheduledEnd"
              name="scheduledEnd"
              type="datetime-local"
              value={scheduledEnd}
              onChange={(e) => setScheduledEnd(e.target.value)}
              disabled={submitting}
              required
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid var(--border, #ccc)",
                background: "var(--bg, #fff)",
                color: "var(--text-h, #111)",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label
            htmlFor="location"
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
              color: "var(--text-h, #111)",
            }}
          >
            Location *
          </label>
          <input
            id="location"
            name="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Client Office / Online"
            disabled={submitting}
            required
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "6px",
              border: "1px solid var(--border, #ccc)",
              background: "var(--bg, #fff)",
              color: "var(--text-h, #111)",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label
            htmlFor="assignedTo"
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
              color: "var(--text-h, #111)",
            }}
          >
            Assigned Employee
          </label>
          {isEmployee ? (
            <div>
              <input
                id="assignedTo"
                type="text"
                value={
                  currentUser?.name
                    ? `${currentUser.name} (${currentUser.email || "You"})`
                    : currentUser?.email || "Current User"
                }
                disabled
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid var(--border, #ccc)",
                  background: "var(--code-bg, #eee)",
                  color: "var(--text, #555)",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
              <span style={{ fontSize: "12px", color: "var(--text, #777)" }}>
                Employees can only schedule meetings for themselves.
              </span>
            </div>
          ) : (
            <div>
              <input
                id="assignedTo"
                name="assignedTo"
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="User ID of assigned employee or manager"
                disabled={submitting}
                required
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid var(--border, #ccc)",
                  background: "var(--bg, #fff)",
                  color: "var(--text-h, #111)",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
              <span style={{ fontSize: "12px", color: "var(--text, #777)" }}>
                {isAdmin
                  ? "Admins must assign meetings to an employee or manager User ID."
                  : "Defaults to your user ID. Can be assigned to yourself or a team member."}
              </span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label
            htmlFor="notes"
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
              color: "var(--text-h, #111)",
            }}
          >
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows="3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any agenda notes or meeting preparation details..."
            disabled={submitting}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "6px",
              border: "1px solid var(--border, #ccc)",
              background: "var(--bg, #fff)",
              color: "var(--text-h, #111)",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
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
            {submitting ? "Creating meeting..." : "Create Meeting"}
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
