import { useState } from "react";
import { apiRequest } from "../services/api";

export default function MeetingActions({ meeting, user, onMeetingUpdated }) {
  const [loadingAction, setLoadingAction] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Sub-forms for actions requiring user input
  const [activeModal, setActiveModal] = useState(null); // 'pause' | 'complete' | 'reopen' | null

  // Pause form state
  const [pauseReason, setPauseReason] = useState("");

  // Complete form state
  const [outcome, setOutcome] = useState("");
  const [checkoutReason, setCheckoutReason] = useState("");
  const [followUpDescription, setFollowUpDescription] = useState("");
  const [followUpOwner, setFollowUpOwner] = useState(() => {
    const defaultOwner = meeting.assignedTo?._id || meeting.assignedTo || user?.id || user?._id || "";
    return defaultOwner;
  });
  const [followUpDueDate, setFollowUpDueDate] = useState("");

  // Reopen form state
  const [reopenReason, setReopenReason] = useState("");

  const currentUserId = user?.id || user?._id;
  const userRole = user?.role;
  const assignedId = meeting.assignedTo?._id || meeting.assignedTo;
  const isAssignee =
    Boolean(currentUserId && assignedId && currentUserId.toString() === assignedId.toString());

  // Employees can only act on meetings assigned to them. Managers and Admins can act.
  const canAct = userRole === "admin" || userRole === "manager" || isAssignee;

  // Reopen permission: Only managers and admins
  const canReopen =
    (userRole === "admin" || userRole === "manager") && meeting.status === "completed";

  // Simple direct action (Confirm, Check-In, Start)
  async function handleDirectAction(endpoint, method, actionName) {
    setError("");
    setSuccess("");
    setLoadingAction(actionName);

    try {
      const data = await apiRequest(endpoint, {
        method,
      });

      setSuccess(`Meeting successfully ${actionName}ed!`);
      if (onMeetingUpdated) {
        onMeetingUpdated(data.meeting || data);
      }
    } catch (err) {
      setError(err.message || `Failed to ${actionName} meeting.`);
    } finally {
      setLoadingAction(null);
    }
  }

  // Handle temporary checkout (Pause)
  async function handlePauseSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!pauseReason.trim()) {
      setError("Reason for leaving is required when pausing a meeting.");
      return;
    }

    setLoadingAction("pause");

    try {
      const data = await apiRequest(`/api/meetings/${meeting._id}/check-out`, {
        method: "POST",
        body: JSON.stringify({
          pause: true,
          reasonForLeaving: pauseReason.trim(),
        }),
      });

      setSuccess("Meeting paused successfully.");
      setActiveModal(null);
      setPauseReason("");
      if (onMeetingUpdated) {
        onMeetingUpdated(data.meeting || data);
      }
    } catch (err) {
      setError(err.message || "Failed to pause meeting.");
    } finally {
      setLoadingAction(null);
    }
  }

  // Handle Complete checkout
  async function handleCompleteSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!outcome) {
      setError("Please select a valid meeting outcome.");
      return;
    }

    const payload = {
      pause: false,
      outcome,
      reasonForLeaving: checkoutReason ? checkoutReason.trim() : "",
    };

    if (outcome === "follow_up_required") {
      if (!followUpDescription.trim()) {
        setError("Follow-up description is required.");
        return;
      }

      const finalOwner =
        userRole === "employee" ? currentUserId : followUpOwner.trim() || currentUserId;

      if (!finalOwner) {
        setError("Follow-up owner is required.");
        return;
      }

      if (!followUpDueDate) {
        setError("Follow-up due date is required.");
        return;
      }

      const due = new Date(followUpDueDate);
      if (Number.isNaN(due.getTime()) || due <= new Date()) {
        setError("Follow-up due date must be a valid future date.");
        return;
      }

      payload.followUp = {
        description: followUpDescription.trim(),
        owner: finalOwner,
        dueDate: due.toISOString(),
      };
    }

    setLoadingAction("complete");

    try {
      const data = await apiRequest(`/api/meetings/${meeting._id}/check-out`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSuccess("Meeting completed successfully.");
      setActiveModal(null);
      setOutcome("");
      setCheckoutReason("");
      setFollowUpDescription("");
      setFollowUpDueDate("");
      if (onMeetingUpdated) {
        onMeetingUpdated(data.meeting || data);
      }
    } catch (err) {
      setError(err.message || "Failed to complete meeting.");
    } finally {
      setLoadingAction(null);
    }
  }

  // Handle Reopen meeting
  async function handleReopenSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!reopenReason.trim()) {
      setError("Reason is required to reopen a meeting.");
      return;
    }

    setLoadingAction("reopen");

    try {
      const data = await apiRequest(`/api/meetings/${meeting._id}/reopen`, {
        method: "PATCH",
        body: JSON.stringify({
          reason: reopenReason.trim(),
        }),
      });

      setSuccess("Meeting reopened successfully.");
      setActiveModal(null);
      setReopenReason("");
      if (onMeetingUpdated) {
        onMeetingUpdated(data.meeting || data);
      }
    } catch (err) {
      setError(err.message || "Failed to reopen meeting.");
    } finally {
      setLoadingAction(null);
    }
  }

  const isBusy = Boolean(loadingAction);

  const buttonStyle = {
    padding: "6px 12px",
    fontSize: "13px",
    fontWeight: "600",
    borderRadius: "6px",
    border: "1px solid var(--border, #ccc)",
    background: "var(--code-bg, #f4f3ec)",
    color: "var(--text-h, #111)",
    cursor: isBusy ? "not-allowed" : "pointer",
    opacity: isBusy ? 0.7 : 1,
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    background: "var(--accent, #aa3bff)",
    color: "#fff",
    border: "none",
  };

  return (
    <div style={{ marginTop: "12px", borderTop: "1px solid var(--border, #eee)", paddingTop: "12px" }}>
      {error && (
        <p
          role="alert"
          style={{
            color: "#dc2626",
            background: "rgba(220, 38, 38, 0.1)",
            padding: "8px 10px",
            borderRadius: "6px",
            fontSize: "13px",
            marginBottom: "10px",
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
            padding: "8px 10px",
            borderRadius: "6px",
            fontSize: "13px",
            marginBottom: "10px",
          }}
        >
          {success}
        </p>
      )}

      {/* Action Buttons Row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
        {/* Status: scheduled -> Confirm */}
        {meeting.status === "scheduled" && canAct && (
          <button
            type="button"
            disabled={isBusy}
            style={primaryButtonStyle}
            onClick={() => handleDirectAction(`/api/meetings/${meeting._id}/confirm`, "PATCH", "confirm")}
          >
            {loadingAction === "confirm" ? "Confirming..." : "Confirm Meeting"}
          </button>
        )}

        {/* Status: confirmed -> Check In */}
        {meeting.status === "confirmed" && canAct && (
          <button
            type="button"
            disabled={isBusy}
            style={primaryButtonStyle}
            onClick={() => handleDirectAction(`/api/meetings/${meeting._id}/check-in`, "POST", "check-in")}
          >
            {loadingAction === "check-in" ? "Checking in..." : "Check In"}
          </button>
        )}

        {/* Status: checked_in -> Start */}
        {meeting.status === "checked_in" && canAct && (
          <button
            type="button"
            disabled={isBusy}
            style={primaryButtonStyle}
            onClick={() => handleDirectAction(`/api/meetings/${meeting._id}/start`, "PATCH", "start")}
          >
            {loadingAction === "start" ? "Starting..." : "Start Meeting"}
          </button>
        )}

        {/* Status: in_progress -> Temporary Checkout (Pause) or Complete */}
        {meeting.status === "in_progress" && canAct && (
          <>
            <button
              type="button"
              disabled={isBusy}
              style={buttonStyle}
              onClick={() => {
                setError("");
                setSuccess("");
                setActiveModal(activeModal === "pause" ? null : "pause");
              }}
            >
              {activeModal === "pause" ? "Cancel Pause" : "Temporary Checkout (Pause)"}
            </button>

            <button
              type="button"
              disabled={isBusy}
              style={primaryButtonStyle}
              onClick={() => {
                setError("");
                setSuccess("");
                setActiveModal(activeModal === "complete" ? null : "complete");
              }}
            >
              {activeModal === "complete" ? "Cancel Complete" : "Complete Meeting"}
            </button>
          </>
        )}

        {/* Status: paused -> Check In (Resume) */}
        {meeting.status === "paused" && canAct && (
          <button
            type="button"
            disabled={isBusy}
            style={primaryButtonStyle}
            onClick={() => handleDirectAction(`/api/meetings/${meeting._id}/check-in`, "POST", "check-in")}
          >
            {loadingAction === "check-in" ? "Checking in..." : "Check In (Resume Visit)"}
          </button>
        )}

        {/* Status: completed -> Reopen (Only for manager and admin) */}
        {canReopen && (
          <button
            type="button"
            disabled={isBusy}
            style={buttonStyle}
            onClick={() => {
              setError("");
              setSuccess("");
              setActiveModal(activeModal === "reopen" ? null : "reopen");
            }}
          >
            {activeModal === "reopen" ? "Cancel Reopen" : "Reopen Meeting"}
          </button>
        )}
      </div>

      {/* Modal / Form: Temporary Checkout (Pause) */}
      {activeModal === "pause" && (
        <form
          onSubmit={handlePauseSubmit}
          style={{
            marginTop: "12px",
            padding: "12px",
            background: "var(--code-bg, #f9f9f9)",
            borderRadius: "6px",
            border: "1px solid var(--border, #ddd)",
          }}
        >
          <h4 style={{ margin: "0 0 8px", fontSize: "14px" }}>Temporary Checkout</h4>
          <p style={{ margin: "0 0 10px", fontSize: "12px", color: "var(--text, #666)" }}>
            Provide a reason for temporarily stepping out. You can check back in when you return.
          </p>

          <label
            htmlFor={`pause-reason-${meeting._id}`}
            style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}
          >
            Reason for leaving *
          </label>
          <input
            id={`pause-reason-${meeting._id}`}
            type="text"
            value={pauseReason}
            onChange={(e) => setPauseReason(e.target.value)}
            placeholder="e.g. Taking client call, lunch break"
            required
            disabled={isBusy}
            style={{
              width: "100%",
              padding: "7px 10px",
              fontSize: "13px",
              borderRadius: "4px",
              border: "1px solid var(--border, #ccc)",
              boxSizing: "border-box",
              marginBottom: "10px",
            }}
          />

          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" disabled={isBusy} style={primaryButtonStyle}>
              {loadingAction === "pause" ? "Pausing..." : "Confirm Pause"}
            </button>
            <button
              type="button"
              disabled={isBusy}
              style={buttonStyle}
              onClick={() => setActiveModal(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Modal / Form: Complete Meeting */}
      {activeModal === "complete" && (
        <form
          onSubmit={handleCompleteSubmit}
          style={{
            marginTop: "12px",
            padding: "12px",
            background: "var(--code-bg, #f9f9f9)",
            borderRadius: "6px",
            border: "1px solid var(--border, #ddd)",
          }}
        >
          <h4 style={{ margin: "0 0 8px", fontSize: "14px" }}>Complete Meeting</h4>

          <div style={{ marginBottom: "10px" }}>
            <label
              htmlFor={`outcome-${meeting._id}`}
              style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}
            >
              Meeting Outcome *
            </label>
            <select
              id={`outcome-${meeting._id}`}
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              required
              disabled={isBusy}
              style={{
                width: "100%",
                padding: "7px 10px",
                fontSize: "13px",
                borderRadius: "4px",
                border: "1px solid var(--border, #ccc)",
                boxSizing: "border-box",
              }}
            >
              <option value="">-- Select Outcome --</option>
              <option value="interested">Interested</option>
              <option value="follow_up_required">Follow-up Required</option>
              <option value="proposal_requested">Proposal Requested</option>
              <option value="not_interested">Not Interested</option>
              <option value="unable_to_meet">Unable to Meet</option>
            </select>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label
              htmlFor={`checkout-reason-${meeting._id}`}
              style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}
            >
              Notes / Reason (Optional)
            </label>
            <input
              id={`checkout-reason-${meeting._id}`}
              type="text"
              value={checkoutReason}
              onChange={(e) => setCheckoutReason(e.target.value)}
              placeholder="e.g. Meeting finished successfully"
              disabled={isBusy}
              style={{
                width: "100%",
                padding: "7px 10px",
                fontSize: "13px",
                borderRadius: "4px",
                border: "1px solid var(--border, #ccc)",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Follow-up Required section */}
          {outcome === "follow_up_required" && (
            <div
              style={{
                marginTop: "10px",
                padding: "10px",
                border: "1px dashed var(--accent-border, #aa3bff)",
                borderRadius: "6px",
                background: "var(--bg, #fff)",
                marginBottom: "10px",
              }}
            >
              <h5 style={{ margin: "0 0 8px", fontSize: "13px", color: "var(--accent, #aa3bff)" }}>
                Required Follow-up Details
              </h5>

              <div style={{ marginBottom: "8px" }}>
                <label
                  htmlFor={`fu-desc-${meeting._id}`}
                  style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "3px" }}
                >
                  Follow-up Description *
                </label>
                <input
                  id={`fu-desc-${meeting._id}`}
                  type="text"
                  value={followUpDescription}
                  onChange={(e) => setFollowUpDescription(e.target.value)}
                  placeholder="e.g. Call client with revised proposal"
                  required
                  disabled={isBusy}
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    fontSize: "13px",
                    borderRadius: "4px",
                    border: "1px solid var(--border, #ccc)",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "8px" }}>
                <label
                  htmlFor={`fu-owner-${meeting._id}`}
                  style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "3px" }}
                >
                  Follow-up Owner ID
                </label>
                {userRole === "employee" ? (
                  <input
                    id={`fu-owner-${meeting._id}`}
                    type="text"
                    value={user?.name ? `${user.name} (You)` : currentUserId}
                    disabled
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      fontSize: "13px",
                      borderRadius: "4px",
                      border: "1px solid var(--border, #ccc)",
                      background: "var(--code-bg, #eee)",
                      boxSizing: "border-box",
                    }}
                  />
                ) : (
                  <input
                    id={`fu-owner-${meeting._id}`}
                    type="text"
                    value={followUpOwner}
                    onChange={(e) => setFollowUpOwner(e.target.value)}
                    placeholder="User ID of follow-up owner"
                    required
                    disabled={isBusy}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      fontSize: "13px",
                      borderRadius: "4px",
                      border: "1px solid var(--border, #ccc)",
                      boxSizing: "border-box",
                    }}
                  />
                )}
              </div>

              <div>
                <label
                  htmlFor={`fu-due-${meeting._id}`}
                  style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "3px" }}
                >
                  Due Date & Time (Future date) *
                </label>
                <input
                  id={`fu-due-${meeting._id}`}
                  type="datetime-local"
                  value={followUpDueDate}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setFollowUpDueDate(e.target.value)}
                  required
                  disabled={isBusy}
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    fontSize: "13px",
                    borderRadius: "4px",
                    border: "1px solid var(--border, #ccc)",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button type="submit" disabled={isBusy} style={primaryButtonStyle}>
              {loadingAction === "complete" ? "Completing..." : "Complete Meeting"}
            </button>
            <button
              type="button"
              disabled={isBusy}
              style={buttonStyle}
              onClick={() => setActiveModal(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Modal / Form: Reopen Meeting */}
      {activeModal === "reopen" && (
        <form
          onSubmit={handleReopenSubmit}
          style={{
            marginTop: "12px",
            padding: "12px",
            background: "var(--code-bg, #f9f9f9)",
            borderRadius: "6px",
            border: "1px solid var(--border, #ddd)",
          }}
        >
          <h4 style={{ margin: "0 0 8px", fontSize: "14px" }}>Reopen Meeting</h4>
          <p style={{ margin: "0 0 10px", fontSize: "12px", color: "var(--text, #666)" }}>
            Reopening will transition this meeting back to Scheduled and log your reason to reopen history.
          </p>

          <label
            htmlFor={`reopen-reason-${meeting._id}`}
            style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}
          >
            Reopening Reason *
          </label>
          <input
            id={`reopen-reason-${meeting._id}`}
            type="text"
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            placeholder="e.g. Client requested another discussion"
            required
            disabled={isBusy}
            style={{
              width: "100%",
              padding: "7px 10px",
              fontSize: "13px",
              borderRadius: "4px",
              border: "1px solid var(--border, #ccc)",
              boxSizing: "border-box",
              marginBottom: "10px",
            }}
          />

          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" disabled={isBusy} style={primaryButtonStyle}>
              {loadingAction === "reopen" ? "Reopening..." : "Confirm Reopen"}
            </button>
            <button
              type="button"
              disabled={isBusy}
              style={buttonStyle}
              onClick={() => setActiveModal(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
