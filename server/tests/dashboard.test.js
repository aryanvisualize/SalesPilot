import { describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import app from "../src/app.js";
import Customer from "../src/models/Customer.js";
import FollowUp from "../src/models/FollowUp.js";
import Meeting from "../src/models/Meeting.js";
import User from "../src/models/User.js";

async function createUser(email, role = "employee") {
  const user = await User.create({
    name: `Test ${role}`,
    email,
    password: await bcrypt.hash("SalesPilot123!", 4),
    role,
  });

  return {
    user,
    token: jwt.sign(
      { id: user._id.toString(), role: user.role },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "1h" }
    ),
  };
}

describe("Dashboard summary API", () => {
  it("returns scoped aggregate counts without collection payloads", async () => {
    const { user, token } = await createUser("dashboard@example.com");
    const otherUser = await createUser("other@example.com");
    const customer = await Customer.create({
      accountName: "Dashboard Customer",
      contactPerson: "Test Contact",
      createdBy: user._id,
    });

    await Meeting.create([
      {
        customer: customer._id,
        assignedTo: user._id,
        createdBy: user._id,
        purpose: "Completed meeting",
        scheduledStart: new Date("2026-11-20T10:00:00.000Z"),
        scheduledEnd: new Date("2026-11-20T11:00:00.000Z"),
        location: "Office",
        status: "completed",
      },
      {
        customer: customer._id,
        assignedTo: user._id,
        createdBy: user._id,
        purpose: "Active meeting",
        scheduledStart: new Date("2026-11-21T10:00:00.000Z"),
        scheduledEnd: new Date("2026-11-21T11:00:00.000Z"),
        location: "Office",
        status: "checked_in",
      },
      {
        customer: customer._id,
        assignedTo: otherUser.user._id,
        createdBy: otherUser.user._id,
        purpose: "Other meeting",
        scheduledStart: new Date("2026-11-22T10:00:00.000Z"),
        scheduledEnd: new Date("2026-11-22T11:00:00.000Z"),
        location: "Office",
        status: "completed",
      },
    ]);

    const ownedMeeting = await Meeting.findOne({ assignedTo: user._id });
    await FollowUp.create([
      {
        meeting: ownedMeeting._id,
        description: "Pending follow-up",
        owner: user._id,
        createdBy: user._id,
        dueDate: new Date("2026-12-01T10:00:00.000Z"),
        status: "pending",
      },
      {
        meeting: ownedMeeting._id,
        description: "Completed follow-up",
        owner: user._id,
        createdBy: user._id,
        dueDate: new Date("2026-12-02T10:00:00.000Z"),
        status: "completed",
      },
    ]);

    const response = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      meetingsCount: 2,
      customersCount: 1,
      followUpsCount: 1,
      completedMeetings: 1,
      inProgressMeetings: 1,
    });
    expect(response.body.meetings).toBeUndefined();
    expect(response.body.customers).toBeUndefined();
    expect(response.body.followUps).toBeUndefined();
  });
});
