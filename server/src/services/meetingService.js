
import mongoose from "mongoose";
import Meeting from "../models/Meeting.js";
import Customer from "../models/Customer.js";
import User from "../models/User.js";


export async function createMeeting(data, currentUser) {
  const {
    customer,
    assignedTo,
    purpose,
    scheduledStart,
    scheduledEnd,
    location,
    notes = "",
  } = data;

  if (
    !mongoose.isValidObjectId(customer) ||
    !mongoose.isValidObjectId(assignedTo)
  ) {
    throw new Error("INVALID_REFERENCE");
  }

  if (
    typeof purpose !== "string" ||
    !purpose.trim() ||
    typeof location !== "string" ||
    !location.trim()
  ) {
    throw new Error("INVALID_FIELDS");
  }

  const start = new Date(scheduledStart);
  const end = new Date(scheduledEnd);

  if (
    !scheduledStart ||
    !scheduledEnd ||
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  ) {
    throw new Error("INVALID_SCHEDULE");
  }

  const customerExists = await Customer.exists({ _id: customer });

  if (!customerExists) {
    throw new Error("CUSTOMER_NOT_FOUND");
  }

  const employee = await User.findById(assignedTo);

  if (!employee) {
    throw new Error("EMPLOYEE_NOT_FOUND");
  }

  if (
    employee.role !== "employee" &&
    employee.role !== "manager"
  ) {
    throw new Error("INVALID_ASSIGNEE");
  }

  if (
    currentUser.role === "employee" &&
    assignedTo !== currentUser._id.toString()
  ) {
    throw new Error("FORBIDDEN");
  }

  return Meeting.create({
    customer,
    assignedTo,
    createdBy: currentUser._id,
    purpose: purpose.trim(),
    scheduledStart: start,
    scheduledEnd: end,
    location: location.trim(),
    notes: typeof notes === "string" ? notes.trim() : "",
    status: "scheduled",
  });
}


export async function getMeetings(currentUser) {
  let filter = {};

  if (currentUser.role === "employee") {
    filter = { assignedTo: currentUser._id };
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
      assignedTo: { $in: allowedIds },
    };
  } else if (currentUser.role !== "admin") {
    throw new Error("FORBIDDEN");
  }

  return Meeting.find(filter)
    .populate("customer", "accountName contactPerson")
    .populate("assignedTo", "name email role")
    .sort({ scheduledStart: 1 });
}


async function canAccessMeeting(currentUser, meeting) {
  if (currentUser.role === "admin") {
    return true;
  }

  const assignedToId = meeting.assignedTo._id
    ? meeting.assignedTo._id.toString()
    : meeting.assignedTo.toString();

  if (assignedToId === currentUser._id.toString()) {
    return true;
  }

  if (currentUser.role !== "manager") {
    return false;
  }

  const assignedEmployee = await User.findById(assignedToId)
    .select("manager role");

  return Boolean(
    assignedEmployee &&
    assignedEmployee.role === "employee" &&
    assignedEmployee.manager?.toString() === currentUser._id.toString()
  );
}


export async function getMeetingById(id, currentUser) {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("INVALID_ID");
  }

  const meeting = await Meeting.findById(id)
    .populate("customer", "accountName contactPerson email phone address")
    .populate("assignedTo", "name email role")
    .populate("createdBy", "name email");

  if (!meeting) {
    throw new Error("MEETING_NOT_FOUND");
  }

  if (
    currentUser.role === "employee" &&
    meeting.assignedTo._id.toString() !== currentUser._id.toString()
  ) {
    throw new Error("FORBIDDEN");
  }

  if (!(await canAccessMeeting(currentUser, meeting))) {
    throw new Error("FORBIDDEN");
  }

  return meeting;
}

export async function updateMeeting(id, data, currentUser) {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("INVALID_ID");
  }

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

  if (meeting.status !== "scheduled") {
    throw new Error("MEETING_NOT_EDITABLE");
  }

  const allowedFields = [
    "customer",
    "assignedTo",
    "purpose",
    "scheduledStart",
    "scheduledEnd",
    "location",
    "notes",
  ];

  for (const field of Object.keys(data)) {
    if (!allowedFields.includes(field)) {
      throw new Error("INVALID_FIELDS");
    }
  }

  const nextCustomer = data.customer ?? meeting.customer;
  const nextAssignee = data.assignedTo ?? meeting.assignedTo;

  if (
    !mongoose.isValidObjectId(nextCustomer) ||
    !mongoose.isValidObjectId(nextAssignee)
  ) {
    throw new Error("INVALID_REFERENCE");
  }

  if (data.customer !== undefined) {
    if (!(await Customer.exists({ _id: nextCustomer }))) {
      throw new Error("CUSTOMER_NOT_FOUND");
    }
  }

  if (data.assignedTo !== undefined) {
    const employee = await User.findById(nextAssignee);

    if (
      !employee ||
      !["employee", "manager"].includes(employee.role)
    ) {
      throw new Error("INVALID_ASSIGNEE");
    }
  }

  if (
    currentUser.role === "employee" &&
    nextAssignee.toString() !== currentUser._id.toString()
  ) {
    throw new Error("FORBIDDEN");
  }

  const start = new Date(
    data.scheduledStart ?? meeting.scheduledStart
  );

  const end = new Date(
    data.scheduledEnd ?? meeting.scheduledEnd
  );

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  ) {
    throw new Error("INVALID_SCHEDULE");
  }

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      meeting.set(field, data[field]);
    }
  }

  meeting.scheduledStart = start;
  meeting.scheduledEnd = end;

  await meeting.save();

  return meeting;
}
