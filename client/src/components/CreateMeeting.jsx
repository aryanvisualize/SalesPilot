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
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [assignedToSearch, setAssignedToSearch] = useState(() =>
    user?.role === "manager"
      ? `${user.name || "Current User"} (${user.email || "You"})`
      : ""
  );
  const [loadingAssignableUsers, setLoadingAssignableUsers] = useState(
    user?.role !== "employee"
  );
  const [assignableUsersError, setAssignableUsersError] = useState("");

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
              setAssignedToSearch(
                (prev) =>
                  prev || `${u.name || "Current User"} (${u.email || "You"})`
              );
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

  // Fetch customers from backend API
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
  const matchingAssignableUsers = assignableUsers.filter((candidate) => {
    const search = assignedToSearch.trim().toLowerCase();
    return (
      !search ||
      candidate.name.toLowerCase().includes(search) ||
      candidate.email.toLowerCase().includes(search)
    );
  });

  useEffect(() => {
    if (isEmployee || !currentUser) {
      return;
    }

    let isMounted = true;

    async function fetchAssignableUsers() {
      setLoadingAssignableUsers(true);
      setAssignableUsersError("");

      try {
        const data = await apiRequest("/api/users/assignees");
        const list = Array.isArray(data)
          ? data
          : data.users || data.data?.users || data.data || [];

        if (!Array.isArray(list)) {
          throw new Error("Unexpected assignable users API response.");
        }

        if (isMounted) {
          setAssignableUsers(list);
        }
      } catch (err) {
        if (isMounted) {
          setAssignableUsersError(err.message || "Failed to load sales representatives.");
        }
      } finally {
        if (isMounted) {
          setLoadingAssignableUsers(false);
        }
      }
    }

    fetchAssignableUsers();

    return () => {
      isMounted = false;
    };
  }, [currentUser, isEmployee]);

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
        setAssignedToSearch(
          currentUser?.role === "manager"
            ? `${currentUser.name || "Current User"} (${currentUser.email || "You"})`
            : ""
        );
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
    <section className="crm-form-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-primary)" }}>
            Schedule New Meeting
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
            Create a scheduled sales visit with customer, timeline, and assignment details.
          </p>
        </div>
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
          <label htmlFor="customer" className="crm-label">
            Customer Account *
          </label>
          <select
            id="customer"
            name="customer"
            className="crm-select"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            disabled={loadingCustomers || submitting}
            required
          >
            <option value="">
              {loadingCustomers ? "Loading customers..." : "-- Select Customer Account --"}
            </option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.accountName} {c.contactPerson ? `(${c.contactPerson})` : ""}
              </option>
            ))}
          </select>
          {customerError && (
            <p style={{ color: "var(--danger-text)", fontSize: "12.5px", marginTop: "4px" }} role="alert">
              {customerError}
            </p>
          )}
          {!loadingCustomers && customers.length === 0 && !customerError && (
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "4px" }}>
              No customers found. Please create a customer account first.
            </p>
          )}
        </div>

        <div className="crm-form-group">
          <label htmlFor="purpose" className="crm-label">
            Meeting Purpose *
          </label>
          <input
            id="purpose"
            name="purpose"
            type="text"
            className="crm-input"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g. Q4 Executive Contract Review"
            disabled={submitting}
            required
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          <div className="crm-form-group">
            <label htmlFor="scheduledStart" className="crm-label">
              Start Date & Time *
            </label>
            <input
              id="scheduledStart"
              name="scheduledStart"
              type="datetime-local"
              className="crm-input"
              value={scheduledStart}
              onChange={(e) => setScheduledStart(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="crm-form-group">
            <label htmlFor="scheduledEnd" className="crm-label">
              End Date & Time *
            </label>
            <input
              id="scheduledEnd"
              name="scheduledEnd"
              type="datetime-local"
              className="crm-input"
              value={scheduledEnd}
              onChange={(e) => setScheduledEnd(e.target.value)}
              disabled={submitting}
              required
            />
          </div>
        </div>

        <div className="crm-form-group">
          <label htmlFor="location" className="crm-label">
            Location *
          </label>
          <input
            id="location"
            name="location"
            type="text"
            className="crm-input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Client HQ (Building 3, 4th Floor) / Virtual Zoom"
            disabled={submitting}
            required
          />
        </div>

        <div className="crm-form-group">
          <label htmlFor="assignedTo" className="crm-label">
            Assigned Sales Representative
          </label>
          {isEmployee ? (
            <div>
              <input
                id="assignedTo"
                type="text"
                className="crm-input"
                value={
                  currentUser?.name
                    ? `${currentUser.name} (${currentUser.email || "You"})`
                    : currentUser?.email || "Current User"
                }
                disabled
              />
              <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                Employees are automatically assigned to their own scheduled visits.
              </span>
            </div>
          ) : (
            <div>
              <input
                id="assignedTo"
                name="assignedTo"
                type="text"
                className="crm-input"
                value={assignedToSearch}
                onChange={(e) => {
                  setAssignedToSearch(e.target.value);
                  setAssignedTo("");
                }}
                placeholder={
                  loadingAssignableUsers
                    ? "Loading sales representatives..."
                    : "Search by name or email"
                }
                disabled={submitting || loadingAssignableUsers}
                required
                autoComplete="off"
              />
              {assignedToSearch && matchingAssignableUsers.length > 0 && !assignedTo && (
                <div
                  style={{
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    marginTop: "4px",
                    overflow: "hidden",
                    background: "var(--bg-card)",
                  }}
                >
                  {matchingAssignableUsers.map((candidate) => (
                    <button
                      key={candidate.id || candidate._id}
                      type="button"
                      onClick={() => {
                        setAssignedTo(candidate.id || candidate._id);
                        setAssignedToSearch(`${candidate.name} (${candidate.email})`);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "9px 12px",
                        border: "0",
                        borderBottom: "1px solid var(--border-subtle)",
                        background: "transparent",
                        color: "var(--text-primary)",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <strong>{candidate.name}</strong>
                      <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)" }}>
                        {candidate.email} · {candidate.role}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {assignedToSearch && !assignedTo && !loadingAssignableUsers && matchingAssignableUsers.length === 0 && (
                <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                  No employee or manager matches that name or email.
                </span>
              )}
              {assignableUsersError && (
                <p style={{ color: "var(--danger-text)", fontSize: "12.5px", marginTop: "4px" }} role="alert">
                  {assignableUsersError}
                </p>
              )}
              <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                {isAdmin
                  ? "Search and select an employee or manager by name or email."
                  : "Search and select yourself or a team member by name or email."}
              </span>
            </div>
          )}
        </div>

        <div className="crm-form-group">
          <label htmlFor="notes" className="crm-label">
            Preparation Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows="3"
            className="crm-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Key discussion topics, decision makers attending, or collateral required..."
            disabled={submitting}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            type="submit"
            disabled={submitting}
            className="crm-btn crm-btn-primary"
          >
            {submitting ? "Scheduling..." : "Confirm & Schedule Meeting"}
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
