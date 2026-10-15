
import {
  createFollowUp,
  listFollowUps,
  completeFollowUp,
} from "../services/followUpService.js";

const errorMap = {
  INVALID_ID: [400, "Invalid ID"],
  INVALID_FIELDS: [400, "Description and a valid owner are required"],
  INVALID_DUE_DATE: [400, "A valid due date is required"],
  MEETING_NOT_FOUND: [404, "Meeting not found"],
  FOLLOW_UP_NOT_FOUND: [404, "Follow-up not found"],
  FORBIDDEN: [403, "You cannot perform this action"],
  MEETING_NOT_COMPLETED: [409, "Complete the meeting before creating its follow-up"],
  FOLLOW_UP_NOT_REQUIRED: [409, "This meeting does not require a follow-up"],
  INVALID_OWNER: [400, "Invalid follow-up owner"],
  FOLLOW_UP_ALREADY_COMPLETED: [409, "Follow-up is already completed"],
};

function handleError(error, res) {
  const mapped = errorMap[error.message];

  if (mapped) {
    return res.status(mapped[0]).json({
      success: false,
      message: mapped[1],
    });
  }

  console.error("Follow-up API error:", error);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}

export async function createFollowUpController(req, res) {
  try {
    const followUp = await createFollowUp(req.body, req.user);

    return res.status(201).json({
      success: true,
      followUp,
    });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function listFollowUpsController(req, res) {
  try {
    const followUps = await listFollowUps(req.user);

    return res.status(200).json({
      success: true,
      count: followUps.length,
      followUps,
    });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function completeFollowUpController(req, res) {
  try {
    const followUp = await completeFollowUp(req.params.id, req.user);

    return res.status(200).json({
      success: true,
      followUp,
    });
  } catch (error) {
    return handleError(error, res);
  }
}
