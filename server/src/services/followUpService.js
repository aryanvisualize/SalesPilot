import mongoose from "mongoose";
import FollowUp from "../models/FollowUp.js";
import Meeting from "../models/Meeting.js";
import User from "../models/User.js";

function ensureValidId(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("INVALID_ID");
  }
}

async function getAccessibleMeeting(id, currentUser) {
  ensureValidId(id);

  const meeting = await Meeting.findById(id);

  if (!meeting) {
    throw new Error("MEETING_NOT_FOUND");
  }

  if (
    currentUser.role === "employee" &&
    meeting.assignedTo.toString() !== currentUser._id.toString()
  ) {
    throw new Error("FORBIDDEN");
  }

  if (currentUser.role === "manager") {
    const assignedEmployee = await User.findById(meeting.assignedTo).select("manager role");
    const belongsToTeam =
      meeting.assignedTo.toString() === currentUser._id.toString() ||
      (assignedEmployee &&
        assignedEmployee.role === "employee" &&
        assignedEmployee.manager?.toString() === currentUser._id.toString());

    if (!belongsToTeam) {
      throw new Error("FORBIDDEN");
    }
  }

  return meeting;
}

export async function createFollowUp(data, currentUser) {
  const { meetingId, description, owner, dueDate } = data;

  if (
    typeof description !== "string" ||
    !description.trim() ||
    !mongoose.isValidObjectId(owner)
  ) {
    throw new Error("INVALID_FIELDS");
  }

  const due = new Date(dueDate);

  if (!dueDate || Number.isNaN(due.getTime()) || due <= new Date()) {
    throw new Error("INVALID_DUE_DATE");
  }

  const meeting = await getAccessibleMeeting(meetingId, currentUser);

  if (meeting.status !== "completed") {
    throw new Error("MEETING_NOT_COMPLETED");
  }

  if (meeting.outcome !== "follow_up_required") {
    throw new Error("FOLLOW_UP_NOT_REQUIRED");
  }

  const assignedUser = await User.findById(owner);

  if (
    !assignedUser ||
    !["employee", "manager"].includes(assignedUser.role)
  ) {
    throw new Error("INVALID_OWNER");
  }

  if (
    currentUser.role === "employee" &&
    owner !== currentUser._id.toString()
  ) {
    throw new Error("FORBIDDEN");
  }

  return FollowUp.create({
    meeting: meeting._id,
    description: description.trim(),
    owner: assignedUser._id,
    createdBy: currentUser._id,
    dueDate: due,
  });
}


export async function listFollowUps(currentUser) {
  let filter = {};

  if (currentUser.role === "employee") {
    filter = { owner: currentUser._id };
  } else if (currentUser.role === "manager") {
    const teamMembers = await User.find({
      manager: currentUser._id,
      role: "employee",
    }).select("_id");

    const allowedIds = [
      currentUser._id,
      ...teamMembers.map((member) => member._id),
    ];

    filter = {
      owner: { $in: allowedIds },
    };
  } else if (currentUser.role !== "admin") {
    throw new Error("FORBIDDEN");
  }

  return FollowUp.find(filter)
    .populate("meeting", "purpose scheduledStart status outcome")
    .populate("owner", "name email role")
    .sort({ dueDate: 1 });
}


export async function completeFollowUp(id, currentUser) {
  ensureValidId(id);

  const followUp = await FollowUp.findById(id);

  if (!followUp) {
    throw new Error("FOLLOW_UP_NOT_FOUND");
  }

  if (
    currentUser.role === "employee" &&
    followUp.owner.toString() !== currentUser._id.toString()
  ) {
    throw new Error("FORBIDDEN");
  }

  if (currentUser.role === "manager") {
    const ownerUser = await User.findById(followUp.owner).select("manager role");
    const belongsToTeam =
      followUp.owner.toString() === currentUser._id.toString() ||
      (ownerUser &&
        ownerUser.role === "employee" &&
        ownerUser.manager?.toString() === currentUser._id.toString());

    if (!belongsToTeam) {
      throw new Error("FORBIDDEN");
    }
  }

  if (followUp.status === "completed") {
    throw new Error("FOLLOW_UP_ALREADY_COMPLETED");
  }

  followUp.status = "completed";
  followUp.completedAt = new Date();

  await followUp.save();

  return followUp;
}
