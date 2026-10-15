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

  if (loading) return <p>Loading follow-ups...</p>;

  if (error) {
    return (
      <section>
        <h2>Follow-ups</h2>
        <p role="alert">{error}</p>
        <button onClick={() => setRefreshKey((k) => k + 1)}>Try again</button>
      </section>
    );
  }

  return (
    <main>
      <h1>Follow-ups</h1>

      {actionError && (
        <p
          role="alert"
          style={{
            color: "#dc2626",
            background: "rgba(220, 38, 38, 0.1)",
            padding: "10px 12px",
            borderRadius: "6px",
            marginBottom: "16px",
            fontSize: "14px",
            maxWidth: "600px",
            marginInline: "auto",
          }}
        >
          {actionError}
        </p>
      )}

      {actionSuccess && (
        <p
          role="status"
          style={{
            color: "#16a34a",
            background: "rgba(22, 163, 74, 0.1)",
            padding: "10px 12px",
            borderRadius: "6px",
            marginBottom: "16px",
            fontSize: "14px",
            maxWidth: "600px",
            marginInline: "auto",
          }}
        >
          {actionSuccess}
        </p>
      )}

      {followUps.length === 0 ? (
        <p>No follow-ups found.</p>
      ) : (
        <div>
          {followUps.map((fu) => {
            const ownerId = fu.owner?._id || fu.owner;
            const isOwner =
              Boolean(currentUserId && ownerId && currentUserId.toString() === ownerId.toString());
            const canComplete = userRole === "admin" || userRole === "manager" || isOwner;
            const isCompleted = fu.status === "completed";
            const isBusy = completingId === fu._id;

            return (
              <article
                key={fu._id}
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
                  {fu.description}
                </h3>

                {fu.meeting && (
                  <p style={{ margin: "4px 0" }}>
                    <strong>Linked Meeting:</strong> {fu.meeting.purpose || "Meeting"}
                    {fu.meeting.scheduledStart
                      ? ` (${new Date(fu.meeting.scheduledStart).toLocaleDateString()})`
                      : ""}
                  </p>
                )}

                <p style={{ margin: "4px 0" }}>
                  <strong>Assigned Owner:</strong>{" "}
                  {fu.owner?.name
                    ? `${fu.owner.name}${isOwner ? " (You)" : ""}`
                    : fu.owner?.email || "Unknown"}
                </p>

                <p style={{ margin: "4px 0" }}>
                  <strong>Due Date:</strong>{" "}
                  {fu.dueDate ? new Date(fu.dueDate).toLocaleString() : "Not specified"}
                </p>

                <p style={{ margin: "4px 0" }}>
                  <strong>Status:</strong>{" "}
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "600",
                      background: isCompleted ? "rgba(22, 163, 74, 0.15)" : "rgba(234, 179, 8, 0.15)",
                      color: isCompleted ? "#16a34a" : "#ca8a04",
                    }}
                  >
                    {isCompleted ? "Completed" : "Pending"}
                  </span>
                </p>

                {isCompleted && fu.completedAt && (
                  <p style={{ margin: "4px 0", fontSize: "13px", color: "var(--text, #666)" }}>
                    <strong>Completed At:</strong> {new Date(fu.completedAt).toLocaleString()}
                  </p>
                )}

                {!isCompleted && canComplete && (
                  <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--border, #eee)" }}>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleCompleteFollowUp(fu._id)}
                      style={{
                        padding: "6px 14px",
                        fontSize: "13px",
                        fontWeight: "600",
                        borderRadius: "6px",
                        border: "none",
                        background: "var(--accent, #7c3aed)",
                        color: "#fff",
                        cursor: isBusy ? "not-allowed" : "pointer",
                        opacity: isBusy ? 0.7 : 1,
                      }}
                    >
                      {isBusy ? "Marking complete..." : "Mark as Completed"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
