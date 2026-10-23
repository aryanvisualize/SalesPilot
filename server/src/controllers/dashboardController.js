import Customer from "../models/Customer.js";
import FollowUp from "../models/FollowUp.js";
import Meeting from "../models/Meeting.js";
import User from "../models/User.js";

async function getMeetingFilter(currentUser) {
  if (currentUser.role === "employee") {
    return { assignedTo: currentUser._id };
  }

  if (currentUser.role === "manager") {
    const teamMembers = await User.find({
      manager: currentUser._id,
      role: "employee",
    }).select("_id");

    return {
      assignedTo: {
        $in: [currentUser._id, ...teamMembers.map((member) => member._id)],
      },
    };
  }

  if (currentUser.role === "admin") {
    return {};
  }

  throw new Error("FORBIDDEN");
}

export async function getDashboardSummary(req, res) {
  try {
    const meetingFilter = await getMeetingFilter(req.user);

    const [meetingSummary, customersCount, followUpsCount] = await Promise.all([
      Meeting.aggregate([
        { $match: meetingFilter },
        {
          $facet: {
            meetingsCount: [{ $count: "count" }],
            completedMeetings: [
              { $match: { status: "completed" } },
              { $count: "count" },
            ],
            inProgressMeetings: [
              { $match: { status: { $in: ["in_progress", "checked_in"] } } },
              { $count: "count" },
            ],
          },
        },
      ]),
      Customer.countDocuments({}),
      FollowUp.countDocuments({
        ...(meetingFilter.assignedTo
          ? { owner: meetingFilter.assignedTo }
          : {}),
        status: { $ne: "completed" },
      }),
    ]);

    const counts = meetingSummary[0] || {};
    const getCount = (result) => result?.[0]?.count || 0;

    return res.status(200).json({
      success: true,
      meetingsCount: getCount(counts.meetingsCount),
      customersCount,
      followUpsCount,
      completedMeetings: getCount(counts.completedMeetings),
      inProgressMeetings: getCount(counts.inProgressMeetings),
    });
  } catch (error) {
    if (error.message === "FORBIDDEN") {
      return res.status(403).json({
        success: false,
        message: "You cannot view dashboard metrics",
      });
    }

    console.error("Dashboard summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard metrics",
    });
  }
}
