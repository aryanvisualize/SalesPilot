
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

        // Support common API response formats.
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

  if (loading) return <p>Loading meetings...</p>;

  if (error) {
    return (
      <section>
        <h2>Meetings</h2>
        <p role="alert">{error}</p>
        <button onClick={() => window.location.reload()}>
          Try again
        </button>
      </section>
    );
  }

  return (
    <main>
      <h1>Meetings</h1>

      <div style={{ marginBottom: "20px" }}>
        <button
          id="toggle-create-meeting-btn"
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
          {showCreateForm ? "Cancel" : "+ Create Meeting"}
        </button>
      </div>

      {showCreateForm && (
        <CreateMeeting
          user={user}
          onMeetingCreated={() => {
            setRefreshKey((k) => k + 1);
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {meetings.length === 0 ? (
        <p>No meetings found. Create your first meeting to get started.</p>
      ) : (
        <div>
          {meetings.map((meeting) => (
            <article
              key={meeting._id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "12px",
              }}
            >
              <h3>{meeting.purpose || "Meeting"}</h3>

              <p>
                <strong>Customer:</strong>{" "}
                {meeting.customer?.accountName || "Unknown customer"}
              </p>

              <p>
                <strong>Start:</strong>{" "}
                {meeting.scheduledStart
                  ? new Date(meeting.scheduledStart).toLocaleString()
                  : "Not specified"}
              </p>

              <p>
                <strong>End:</strong>{" "}
                {meeting.scheduledEnd
                  ? new Date(meeting.scheduledEnd).toLocaleString()
                  : "Not specified"}
              </p>

              <p>
                <strong>Assigned to:</strong>{" "}
                {meeting.assignedTo?.name ||
                  meeting.assignedTo?.email ||
                  "Not available"}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {(meeting.status || "unknown").replaceAll("_", " ")}
              </p>

              {meeting.location && (
                <p>
                  <strong>Location:</strong> {meeting.location}
                </p>
              )}

              {meeting.outcome && (
                <p>
                  <strong>Outcome:</strong> {meeting.outcome.replaceAll("_", " ")}
                </p>
              )}

              {meeting.visits?.length > 0 && (
                <p>
                  <strong>Visits:</strong> {meeting.visits.length} recorded
                </p>
              )}

              {meeting.reopenHistory?.length > 0 && (
                <p>
                  <strong>Reopened:</strong> {meeting.reopenHistory.length} time(s)
                </p>
              )}

              <MeetingActions
                meeting={meeting}
                user={user}
                onMeetingUpdated={() => {
                  setRefreshKey((k) => k + 1);
                }}
              />
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
