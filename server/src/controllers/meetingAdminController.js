
import { reopenMeeting } from "../services/meetingAdminService.js";

export async function reopenMeetingController(req, res) {
  try {
    const meeting = await reopenMeeting(
      req.params.id,
      req.body,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Meeting reopened successfully",
      meeting,
    });
  } catch (error) {
    const errorMap = {
      INVALID_ID: [400, "Invalid meeting ID"],
      MEETING_NOT_FOUND: [404, "Meeting not found"],
      FORBIDDEN: [403, "You cannot perform this action"],
      MEETING_NOT_COMPLETED: [409, "Only completed meetings can be reopened"],
      REASON_REQUIRED: [400, "A reason is required to reopen a meeting"],
    };

    const mapped = errorMap[error.message];

    if (mapped) {
      return res.status(mapped[0]).json({
        success: false,
        message: mapped[1],
      });
    }

    console.error("Reopen meeting error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
