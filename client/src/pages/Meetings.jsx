import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import CreateMeeting from "../components/CreateMeeting";
import MeetingActions from "../components/MeetingActions";

export default function Meetings({ user }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadMeetings() {
      try {
        const data = await apiRequest("/api/meetings");

        const records = Array.isArray(data)
          ? data
          : data.meetings || data.data?.meetings || data.data || [];

        if (!Array.isArray(records)) {
          throw new Error("Unexpected meetings API response.");
        }

        if (isMounted) {
          setMeetings(records);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load meetings.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadMeetings();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="crm-empty-state">
        <div className="crm-empty-icon">⏳</div>
        <div className="crm-empty-title">Loading meetings...</div>
        <div className="crm-empty-desc">Fetching customer meetings and visit logs from SalesPilot server.</div>
      </div>
    );
  }

  if (error) {
    return (
      <section>
        <div className="crm-page-header">
          <div>
            <h1 className="crm-page-title">Meetings</h1>
            <p className="crm-page-subtitle">Schedule, track, and complete sales meetings</p>
          </div>
        </div>
        <div className="crm-alert crm-alert-error" role="alert">
          <span>{error}</span>
        </div>
        <button className="crm-btn crm-btn-secondary" onClick={() => window.location.reload()}>
          Try again
        </button>
      </section>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Meetings & Visits</h1>
          <p className="crm-page-subtitle">
            Manage your schedule, perform customer check-ins, and record visit outcomes.
          </p>
        </div>

        <button
          id="toggle-create-meeting-btn"
          type="button"
          onClick={() => setShowCreateForm((prev) => !prev)}
          className={`crm-btn ${showCreateForm ? "crm-btn-secondary" : "crm-btn-primary"}`}
        >
          {showCreateForm ? "Cancel" : "+ Schedule Meeting"}
        </button>
      </div>

      {showCreateForm && (
        <CreateMeeting
          user={user}
          onMeetingCreated={() => {
            setShowCreateForm(false);
            setRefreshKey((k) => k + 1);
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {meetings.length === 0 ? (
        <div className="crm-empty-state">
          <div className="crm-empty-icon">📅</div>
          <div className="crm-empty-title">No meetings scheduled yet</div>
          <div className="crm-empty-desc">
            You don't have any scheduled sales visits in your pipeline. Click &quot;+ Schedule Meeting&quot; above to create one.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {meetings.map((meeting) => {
            const statusClass = `crm-status-${meeting.status || "scheduled"}`;
            const displayStatus = (meeting.status || "scheduled").replaceAll("_", " ");

            return (
              <article key={meeting._id} className="crm-record-card">
                <div className="crm-record-top">
                  <div>
                    <h3 className="crm-record-title">{meeting.purpose || "Customer Meeting"}</h3>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
                      Meeting ID: <code style={{ fontSize: "12px" }}>{meeting._id}</code>
                    </p>
                  </div>
                  <span className={`crm-status-pill ${statusClass}`}>
                    ● {displayStatus}
                  </span>
                </div>

                <div className="crm-meta-grid">
                  <div className="crm-meta-item">
                    <span className="crm-meta-icon">🏢</span>
                    <div>
                      <strong>Customer:</strong>{" "}
                      <span>{meeting.customer?.accountName || "Unknown customer"}</span>
                    </div>
                  </div>

                  <div className="crm-meta-item">
                    <span className="crm-meta-icon">👤</span>
                    <div>
                      <strong>Assigned to:</strong>{" "}
                      <span>{meeting.assignedTo?.name || meeting.assignedTo?.email || "Unassigned"}</span>
                    </div>
                  </div>

                  <div className="crm-meta-item">
                    <span className="crm-meta-icon">🕒</span>
                    <div>
                      <strong>Start:</strong>{" "}
                      <span>
                        {meeting.scheduledStart
                          ? new Date(meeting.scheduledStart).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Not set"}
                      </span>
                    </div>
                  </div>

                  <div className="crm-meta-item">
                    <span className="crm-meta-icon">🏁</span>
                    <div>
                      <strong>End:</strong>{" "}
                      <span>
                        {meeting.scheduledEnd
                          ? new Date(meeting.scheduledEnd).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Not set"}
                      </span>
                    </div>
                  </div>

                  {meeting.location && (
                    <div className="crm-meta-item">
                      <span className="crm-meta-icon">📍</span>
                      <div>
                        <strong>Location:</strong> <span>{meeting.location}</span>
                      </div>
                    </div>
                  )}

                  {meeting.outcome && (
                    <div className="crm-meta-item">
                      <span className="crm-meta-icon">🎯</span>
                      <div>
                        <strong>Outcome:</strong>{" "}
                        <span style={{ textTransform: "capitalize", fontWeight: "600", color: "var(--primary)" }}>
                          {meeting.outcome.replaceAll("_", " ")}
                        </span>
                      </div>
                    </div>
                  )}

                  {meeting.visits?.length > 0 && (
                    <div className="crm-meta-item">
                      <span className="crm-meta-icon">⏱️</span>
                      <div>
                        <strong>Visits:</strong> <span>{meeting.visits.length} recorded</span>
                      </div>
                    </div>
                  )}

                  {meeting.reopenHistory?.length > 0 && (
                    <div className="crm-meta-item">
                      <span className="crm-meta-icon">🔄</span>
                      <div>
                        <strong>Reopened:</strong> <span>{meeting.reopenHistory.length} time(s)</span>
                      </div>
                    </div>
                  )}
                </div>

                {meeting.notes && (
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                      background: "var(--bg-subtle)",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-sm)",
                      marginBottom: "12px",
                    }}
                  >
                    <strong>Notes:</strong> {meeting.notes}
                  </div>
                )}

                <MeetingActions
                  meeting={meeting}
                  user={user}
                  onMeetingUpdated={() => {
                    setRefreshKey((k) => k + 1);
                  }}
                />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
