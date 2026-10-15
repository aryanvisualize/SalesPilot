import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

export default function FollowUps({ user }) {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [completingId, setCompletingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const currentUserId = user?.id || user?._id;
  const userRole = user?.role;

  useEffect(() => {
    let isMounted = true;

    async function loadFollowUps() {
      try {
        setError("");
        const data = await apiRequest("/api/follow-ups");
        const list = Array.isArray(data)
          ? data
          : data.followUps || data.data?.followUps || data.data || [];

        if (!Array.isArray(list)) {
          throw new Error("Unexpected follow-ups API response.");
        }

        if (isMounted) {
          setFollowUps(list);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load follow-ups.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadFollowUps();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  async function handleCompleteFollowUp(id) {
    setActionError("");
    setActionSuccess("");
    setCompletingId(id);

    try {
      await apiRequest(`/api/follow-ups/${id}/complete`, {
        method: "PATCH",
      });

      setActionSuccess("Follow-up marked as completed.");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setActionError(err.message || "Failed to complete follow-up.");
    } finally {
      setCompletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="crm-empty-state">
        <div className="crm-empty-icon">⏳</div>
        <div className="crm-empty-title">Loading follow-up tasks...</div>
        <div className="crm-empty-desc">Fetching action items linked to your customer meetings.</div>
      </div>
    );
  }

  if (error) {
    return (
      <section>
        <div className="crm-page-header">
          <div>
            <h1 className="crm-page-title">Follow-up Tasks</h1>
            <p className="crm-page-subtitle">Track deliverables and action items</p>
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
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Follow-up Management</h1>
          <p className="crm-page-subtitle">
            Track commitments made during customer visits and mark deliverables completed.
          </p>
        </div>
      </div>

      {actionError && (
        <div className="crm-alert crm-alert-error" role="alert">
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="crm-alert crm-alert-success" role="status">
          <span>{actionSuccess}</span>
        </div>
      )}

      {followUps.length === 0 ? (
        <div className="crm-empty-state">
          <div className="crm-empty-icon">⏱️</div>
          <div className="crm-empty-title">No pending follow-ups</div>
          <div className="crm-empty-desc">
            All action items and commitments are up to date! Follow-ups are automatically scheduled when meetings conclude with a &quot;Follow-up Required&quot; outcome.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {followUps.map((fu) => {
            const ownerId = fu.owner?._id || fu.owner;
            const isOwner =
              Boolean(currentUserId && ownerId && currentUserId.toString() === ownerId.toString());
            const canComplete = userRole === "admin" || userRole === "manager" || isOwner;
            const isCompleted = fu.status === "completed";
            const isBusy = completingId === fu._id;

            return (
              <article key={fu._id} className="crm-record-card">
                <div className="crm-record-top">
                  <div>
                    <h3 className="crm-record-title">{fu.description}</h3>
                    <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                      Task ID: <code style={{ fontSize: "11px" }}>{fu._id}</code>
                    </p>
                  </div>

                  <span
                    className={`crm-status-pill ${
                      isCompleted ? "crm-status-completed" : "crm-status-in_progress"
                    }`}
                  >
                    ● {isCompleted ? "Completed" : "Pending Action"}
                  </span>
                </div>

                <div className="crm-meta-grid">
                  {fu.meeting && (
                    <div className="crm-meta-item">
                      <span className="crm-meta-icon">📅</span>
                      <div>
                        <strong>Meeting:</strong>{" "}
                        <span>
                          {fu.meeting.purpose || "Customer Meeting"}
                          {fu.meeting.scheduledStart
                            ? ` (${new Date(fu.meeting.scheduledStart).toLocaleDateString()})`
                            : ""}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="crm-meta-item">
                    <span className="crm-meta-icon">👤</span>
                    <div>
                      <strong>Assigned Rep:</strong>{" "}
                      <span>
                        {fu.owner?.name
                          ? `${fu.owner.name}${isOwner ? " (You)" : ""}`
                          : fu.owner?.email || "Unknown"}
                      </span>
                    </div>
                  </div>

                  <div className="crm-meta-item">
                    <span className="crm-meta-icon">⏰</span>
                    <div>
                      <strong>Due Date:</strong>{" "}
                      <span>
                        {fu.dueDate ? new Date(fu.dueDate).toLocaleString() : "Not specified"}
                      </span>
                    </div>
                  </div>

                  {isCompleted && fu.completedAt && (
                    <div className="crm-meta-item">
                      <span className="crm-meta-icon">✅</span>
                      <div>
                        <strong>Completed On:</strong>{" "}
                        <span>{new Date(fu.completedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>

                {!isCompleted && canComplete && (
                  <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)" }}>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleCompleteFollowUp(fu._id)}
                      className="crm-btn crm-btn-primary"
                      style={{ fontSize: "12.5px", padding: "6px 14px" }}
                    >
                      {isBusy ? "Marking complete..." : "✓ Mark as Completed"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
