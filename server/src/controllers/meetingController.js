
import {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
} from "../services/meetingService.js";

function handleError(error, res) {
  const errors = {
    INVALID_ID: [400, "Invalid meeting ID"],
    INVALID_REFERENCE: [400, "Invalid customer or employee ID"],
    INVALID_FIELDS: [400, "Invalid or unsupported fields"],
    INVALID_SCHEDULE: [400, "End time must be after start time"],
    CUSTOMER_NOT_FOUND: [404, "Customer not found"],
    EMPLOYEE_NOT_FOUND: [404, "Employee not found"],
    INVALID_ASSIGNEE: [400, "Invalid meeting assignee"],
    MEETING_NOT_FOUND: [404, "Meeting not found"],
    MEETING_NOT_EDITABLE: [409, "Only scheduled meetings can be edited"],
    FORBIDDEN: [403, "You cannot perform this action"],
  };

  const result = errors[error.message];

  if (result) {
    return res.status(result[0]).json({
      success: false,
      message: result[1],
    });
  }

  console.error("Meeting API error:", error);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}

export async function createMeetingController(req, res) {
  try {
    const meeting = await createMeeting(req.body, req.user);

    return res.status(201).json({
      success: true,
      meeting,
    });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function listMeetingsController(req, res) {
  try {
    const meetings = await getMeetings(req.user);

    return res.status(200).json({
      success: true,
      count: meetings.length,
      meetings,
    });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getMeetingController(req, res) {
  try {
    const meeting = await getMeetingById(req.params.id, req.user);

    return res.status(200).json({
      success: true,
      meeting,
    });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function updateMeetingController(req, res) {
  try {
    const meeting = await updateMeeting(
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
}
