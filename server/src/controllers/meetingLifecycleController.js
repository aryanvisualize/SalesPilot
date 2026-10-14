
import {
  confirmMeeting,
  checkInMeeting,
  startMeeting,
  checkOutMeeting,
} from "../services/meetingLifecycleService.js";

const errorMap = {
  INVALID_ID: [400, "Invalid meeting ID"],
  MEETING_NOT_FOUND: [404, "Meeting not found"],
  FORBIDDEN: [403, "You cannot perform this action"],
  INVALID_TRANSITION: [409, "This action is not allowed in the current meeting state"],
  VISIT_ALREADY_OPEN: [409, "A visit is already open"],
  NO_OPEN_VISIT: [409, "There is no open visit"],
  INVALID_LOCATION: [400, "Invalid location coordinates"],
  PAUSE_REQUIRED: [400, "Specify whether the meeting should be paused"],
  OUTCOME_REQUIRED: [400, "A valid meeting outcome is required"],
  REASON_REQUIRED: [400, "A reason is required when pausing a meeting"],
  INVALID_FIELDS: [400, "Invalid request fields"],
};

function handleError(error, res) {
  const mapped = errorMap[error.message];

  if (mapped) {
    return res.status(mapped[0]).json({
      success: false,
      message: mapped[1],
    });
  }

  console.error("Meeting lifecycle error:", error);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}

function makeHandler(operation) {
  return async (req, res) => {
    try {
      const meeting = await operation(
        req.params.id,
        req.body,
        req.user
      );

      return res.status(200).json({
        success: true,
        meeting,
      });
    } catch (error) {
      return handleError(error, res);
    }
  };
}

export const confirmMeetingController = makeHandler(
  (id, _body, user) => confirmMeeting(id, user)
);

export const checkInMeetingController = makeHandler(
  checkInMeeting
);

export const startMeetingController = makeHandler(
  (id, _body, user) => startMeeting(id, user)
);

export const checkOutMeetingController = makeHandler(
  checkOutMeeting
);
