
import mongoose from "mongoose";
import Meeting from "../models/Meeting.js";
import User from "../models/User.js";

export async function reopenMeeting(id, data, currentUser) {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("INVALID_ID");
  }

  if (!["manager", "admin"].includes(currentUser.role)) {
    throw new Error("FORBIDDEN");
  }

  if (
    typeof data.reason !== "string" ||
    !data.reason.trim()
  ) {
    throw new Error("REASON_REQUIRED");
  }

  const meeting = await Meeting.findById(id);

  if (!meeting) {
    throw new Error("MEETING_NOT_FOUND");
  }

  if (meeting.status !== "completed") {
    throw new Error("MEETING_NOT_COMPLETED");
  }

  if (currentUser.role === "manager") {
    const assignedEmployee = await User.findById(
      meeting.assignedTo
    ).select("manager role");

    const belongsToTeam =
      meeting.assignedTo.toString() === currentUser._id.toString() ||
      (
        assignedEmployee &&
        assignedEmployee.role === "employee" &&
        assignedEmployee.manager?.toString() === currentUser._id.toString()
      );

    if (!belongsToTeam) {
      throw new Error("FORBIDDEN");
    }
  }

  const previousOutcome = meeting.outcome;

  meeting.reopenHistory.push({
    reopenedBy: currentUser._id,
    reopenedAt: new Date(),
    reason: data.reason.trim(),
    previousOutcome,
  });

  meeting.status = "scheduled";
  meeting.outcome = null;

  await meeting.save();

  return meeting;
}
