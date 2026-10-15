
import mongoose from "mongoose";
import Meeting from "../models/Meeting.js";
import User from "../models/User.js";
import FollowUp from "../models/FollowUp.js";

function ensureValidId(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("INVALID_ID");
  }
}

async function getAssignedMeeting(id, currentUser) {
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

function validateLocation(location) {
  if (location === undefined) {
    return undefined;
  }

  if (
    !location ||
    typeof location !== "object" ||
    Array.isArray(location)
  ) {
    throw new Error("INVALID_LOCATION");
  }

  const { latitude, longitude } = location;

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error("INVALID_LOCATION");
  }

  return { latitude, longitude };
}

export async function confirmMeeting(id, currentUser) {
  const meeting = await getAssignedMeeting(id, currentUser);

  if (meeting.status !== "scheduled") {
    throw new Error("INVALID_TRANSITION");
  }

  meeting.status = "confirmed";

  await meeting.save();

  return meeting;

}

export async function checkInMeeting(id, data, currentUser) {
  const meeting = await getAssignedMeeting(id, currentUser);

  if (!["confirmed", "paused"].includes(meeting.status)) {
    throw new Error("INVALID_TRANSITION");
  }

  const lastVisit = meeting.visits.at(-1);

  if (lastVisit && !lastVisit.checkOutAt) {
    throw new Error("VISIT_ALREADY_OPEN");
  }

  const location = validateLocation(data?.location);

  meeting.visits.push({
    checkInAt: new Date(),
    ...(location ? { checkInLocation: location } : {}),
  });

  meeting.status = "checked_in";

  await meeting.save();

  return meeting;
}

export async function startMeeting(id, currentUser) {
  const meeting = await getAssignedMeeting(id, currentUser);

  if (meeting.status !== "checked_in") {
    throw new Error("INVALID_TRANSITION");
  }

  const lastVisit = meeting.visits.at(-1);

  if (!lastVisit || lastVisit.checkOutAt) {
    throw new Error("NO_OPEN_VISIT");
  }

  meeting.status = "in_progress";

  await meeting.save();

  return meeting;
}

export async function checkOutMeeting(id, data, currentUser) {
  const meeting = await getAssignedMeeting(id, currentUser);

  console.log("CHECKOUT DEBUG - Incoming request:", {
    meetingId: id,
    pause: data?.pause,
    outcome: data?.outcome,
    statusBefore: meeting.status,
  });

  if (meeting.status !== "in_progress") {
    throw new Error("INVALID_TRANSITION");
  }

  const lastVisit = meeting.visits.at(-1);

  if (!lastVisit || lastVisit.checkOutAt) {
    throw new Error("NO_OPEN_VISIT");
  }

  if (typeof data?.pause !== "boolean") {
    throw new Error("PAUSE_REQUIRED");
  }

  let outcome;
  let followUpData;

  if (!data.pause) {
    const allowedOutcomes = [
      "interested",
      "follow_up_required",
      "proposal_requested",
      "not_interested",
      "unable_to_meet",
    ];

    if (!allowedOutcomes.includes(data.outcome)) {
      throw new Error("OUTCOME_REQUIRED");
    }

    outcome = data.outcome;

    if (outcome === "follow_up_required") {
      const followUp = data.followUp;

      if (
        !followUp ||
        typeof followUp.description !== "string" ||
        !followUp.description.trim() ||
        !mongoose.isValidObjectId(followUp.owner)
      ) {
        throw new Error("FOLLOW_UP_REQUIRED");
      }

      const dueDate = new Date(followUp.dueDate);

      if (
        !followUp.dueDate ||
        Number.isNaN(dueDate.getTime())
      ) {
        throw new Error("INVALID_DUE_DATE");
      }

      if (dueDate <= new Date()) {
        throw new Error("INVALID_DUE_DATE");
      }

      const owner = await User.findById(followUp.owner);

      if (
        !owner ||
        !["employee", "manager"].includes(owner.role)
      ) {
        throw new Error("INVALID_OWNER");
      }

      if (
        currentUser.role === "employee" &&
        owner._id.toString() !== currentUser._id.toString()
      ) {
        throw new Error("FORBIDDEN");
      }

      followUpData = {
        meeting: meeting._id,
        description: followUp.description.trim(),
        owner: owner._id,
        createdBy: currentUser._id,
        dueDate,
      };
    }
  }

  const location = validateLocation(data.location);
  const reason = data.reasonForLeaving ?? "";

  if (typeof reason !== "string") {
    throw new Error("INVALID_FIELDS");
  }

  if (data.pause && !reason.trim()) {
    throw new Error("REASON_REQUIRED");
  }

  lastVisit.checkOutAt = new Date();
  lastVisit.reasonForLeaving = reason.trim();

  if (location) {
    lastVisit.checkOutLocation = location;
  }

  if (data.pause) {
    meeting.status = "paused";
  } else {
    meeting.status = "completed";
    meeting.outcome = outcome;
  }

  if (followUpData) {
    await FollowUp.create(followUpData);
  }

  await meeting.save();

  return meeting;
}
