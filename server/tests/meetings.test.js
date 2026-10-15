import { describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import app from "../src/app.js";
import User from "../src/models/User.js";
import Customer from "../src/models/Customer.js";
import Meeting from "../src/models/Meeting.js";
import FollowUp from "../src/models/FollowUp.js";

async function createUser(email = "user@example.com", role = "employee", managerId = null) {
  const user = await User.create({
    name: `Test ${role}`,
    email,
    password: await bcrypt.hash("SalesPilot123!", 4),
    role,
    manager: managerId,
  });

  const token = jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET || "test-secret",
    { expiresIn: "1h" }
  );

  return { user, token };
}

async function createCustomer(userId) {
  return Customer.create({
    accountName: "ABC Technologies",
    contactPerson: "Test Contact",
    createdBy: userId,
  });
}

describe("SalesPilot meeting API", () => {
  it("rejects meeting creation without authentication", async () => {
    const response = await request(app)
      .post("/api/meetings")
      .send({});

    expect(response.status).toBe(401);
  });

  it("creates a meeting with a valid schedule", async () => {
    const { user, token } = await createUser("emp1@example.com", "employee");
    const customer = await createCustomer(user._id);

    const response = await request(app)
      .post("/api/meetings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customer: customer._id.toString(),
        assignedTo: user._id.toString(),
        purpose: "Product demonstration",
        scheduledStart: "2026-11-20T10:00:00.000Z",
        scheduledEnd: "2026-11-20T11:00:00.000Z",
        location: "Noida office",
      });

    expect(response.status).toBe(201);
    expect(response.body.meeting.status).toBe("scheduled");
  });

  it("rejects an invalid meeting schedule", async () => {
    const { user, token } = await createUser("emp2@example.com", "employee");
    const customer = await createCustomer(user._id);

    const response = await request(app)
      .post("/api/meetings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customer: customer._id.toString(),
        assignedTo: user._id.toString(),
        purpose: "Product demonstration",
        scheduledStart: "2026-11-20T11:00:00.000Z",
        scheduledEnd: "2026-11-20T10:00:00.000Z",
        location: "Noida office",
      });

    expect(response.status).toBe(400);
  });

  it("does not allow an employee to create a meeting for another employee", async () => {
    const { user, token } = await createUser("emp3@example.com", "employee");
    const other = await createUser("other@example.com", "employee");
    const customer = await createCustomer(user._id);

    const response = await request(app)
      .post("/api/meetings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customer: customer._id.toString(),
        assignedTo: other.user._id.toString(),
        purpose: "Product demonstration",
        scheduledStart: "2026-11-20T10:00:00.000Z",
        scheduledEnd: "2026-11-20T11:00:00.000Z",
        location: "Noida office",
      });

    expect(response.status).toBe(403);
  });

  it("rejects an invalid lifecycle transition", async () => {
    const { user, token } = await createUser("emp4@example.com", "employee");
    const customer = await createCustomer(user._id);

    const meeting = await Meeting.create({
      customer: customer._id,
      assignedTo: user._id,
      createdBy: user._id,
      purpose: "Product demonstration",
      scheduledStart: new Date("2026-11-20T10:00:00.000Z"),
      scheduledEnd: new Date("2026-11-20T11:00:00.000Z"),
      location: "Noida office",
      status: "scheduled",
    });

    const response = await request(app)
      .post(`/api/meetings/${meeting._id}/check-in`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(409);
  });

  it("confirms a scheduled meeting", async () => {
    const { user, token } = await createUser("emp5@example.com", "employee");
    const customer = await createCustomer(user._id);

    const meeting = await Meeting.create({
      customer: customer._id,
      assignedTo: user._id,
      createdBy: user._id,
      purpose: "Contract Review",
      scheduledStart: new Date("2026-11-20T10:00:00.000Z"),
      scheduledEnd: new Date("2026-11-20T11:00:00.000Z"),
      location: "Office",
      status: "scheduled",
    });

    const response = await request(app)
      .patch(`/api/meetings/${meeting._id}/confirm`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.meeting.status).toBe("confirmed");
  });

  it("handles assignment edge case: temporary checkout and subsequent return with preserved visits", async () => {
    const { user, token } = await createUser("emp6@example.com", "employee");
    const customer = await createCustomer(user._id);

    // Initial scheduled meeting
    const meeting = await Meeting.create({
      customer: customer._id,
      assignedTo: user._id,
      createdBy: user._id,
      purpose: "Client Pitch & Demo",
      scheduledStart: new Date("2026-11-20T10:00:00.000Z"),
      scheduledEnd: new Date("2026-11-20T11:00:00.000Z"),
      location: "Client Office",
      status: "confirmed",
    });

    // 1. Check in at 10:02 AM
    const checkIn1 = await request(app)
      .post(`/api/meetings/${meeting._id}/check-in`)
      .set("Authorization", `Bearer ${token}`)
      .send({ location: { latitude: 28.5355, longitude: 77.391 } });
    expect(checkIn1.status).toBe(200);
    expect(checkIn1.body.meeting.status).toBe("checked_in");

    // 2. Start meeting
    const start1 = await request(app)
      .patch(`/api/meetings/${meeting._id}/start`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(start1.status).toBe(200);
    expect(start1.body.meeting.status).toBe("in_progress");

    // 3. Leave at 10:40 AM (temporary checkout / pause)
    const pause = await request(app)
      .post(`/api/meetings/${meeting._id}/check-out`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        pause: true,
        reasonForLeaving: "Customer requested return at 3:00 PM for executive review",
      });
    expect(pause.status).toBe(200);
    expect(pause.body.meeting.status).toBe("paused");

    // 4. Return at 3:10 PM (check-in again)
    const checkIn2 = await request(app)
      .post(`/api/meetings/${meeting._id}/check-in`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(checkIn2.status).toBe(200);
    expect(checkIn2.body.meeting.status).toBe("checked_in");

    // 5. Resume meeting
    const start2 = await request(app)
      .patch(`/api/meetings/${meeting._id}/start`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(start2.status).toBe(200);
    expect(start2.body.meeting.status).toBe("in_progress");

    // 6. Complete meeting at 4:00 PM
    const complete = await request(app)
      .post(`/api/meetings/${meeting._id}/check-out`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        pause: false,
        outcome: "interested",
        reasonForLeaving: "Presentation finished successfully",
      });
    expect(complete.status).toBe(200);
    expect(complete.body.meeting.status).toBe("completed");
    expect(complete.body.meeting.outcome).toBe("interested");

    // Verify both visit records are preserved
    const updated = await Meeting.findById(meeting._id);
    expect(updated.visits).toHaveLength(2);
    expect(updated.visits[0].reasonForLeaving).toBe(
      "Customer requested return at 3:00 PM for executive review"
    );
    expect(updated.visits[0].checkOutAt).toBeTruthy();
    expect(updated.visits[1].reasonForLeaving).toBe("Presentation finished successfully");
    expect(updated.visits[1].checkOutAt).toBeTruthy();
  });

  it("creates follow-up record upon completing meeting with follow_up_required", async () => {
    const { user, token } = await createUser("emp7@example.com", "employee");
    const customer = await createCustomer(user._id);

    const meeting = await Meeting.create({
      customer: customer._id,
      assignedTo: user._id,
      createdBy: user._id,
      purpose: "Proposal Discussion",
      scheduledStart: new Date("2026-11-20T10:00:00.000Z"),
      scheduledEnd: new Date("2026-11-20T11:00:00.000Z"),
      location: "Office",
      status: "in_progress",
      visits: [{ checkInAt: new Date() }],
    });

    const dueDate = new Date(Date.now() + 86400000).toISOString();

    const response = await request(app)
      .post(`/api/meetings/${meeting._id}/check-out`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        pause: false,
        outcome: "follow_up_required",
        followUp: {
          description: "Send revised proposal and pricing sheet",
          owner: user._id.toString(),
          dueDate,
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.meeting.status).toBe("completed");

    // Verify follow-up created in database
    const followUp = await FollowUp.findOne({ meeting: meeting._id });
    expect(followUp).toBeTruthy();
    expect(followUp.description).toBe("Send revised proposal and pricing sheet");
    expect(followUp.owner.toString()).toBe(user._id.toString());
    expect(followUp.status).toBe("pending");

    // Complete the follow-up
    const completeFollowUpRes = await request(app)
      .patch(`/api/follow-ups/${followUp._id}/complete`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(completeFollowUpRes.status).toBe(200);
    expect(completeFollowUpRes.body.followUp.status).toBe("completed");
  });

  it("enforces manager team scope on meetings", async () => {
    const managerA = await createUser("mgrA@example.com", "manager");
    const managerB = await createUser("mgrB@example.com", "manager");
    const teamMemberB = await createUser("empB@example.com", "employee", managerB.user._id);
    const customer = await createCustomer(managerB.user._id);

    const meeting = await Meeting.create({
      customer: customer._id,
      assignedTo: teamMemberB.user._id,
      createdBy: managerB.user._id,
      purpose: "Team B Meeting",
      scheduledStart: new Date("2026-11-20T10:00:00.000Z"),
      scheduledEnd: new Date("2026-11-20T11:00:00.000Z"),
      location: "Office",
      status: "scheduled",
    });

    // Manager A tries to confirm Team B's meeting -> 403 Forbidden
    const response = await request(app)
      .patch(`/api/meetings/${meeting._id}/confirm`)
      .set("Authorization", `Bearer ${managerA.token}`)
      .send({});

    expect(response.status).toBe(403);

    // Manager B (team manager) confirms -> 200 OK
    const responseB = await request(app)
      .patch(`/api/meetings/${meeting._id}/confirm`)
      .set("Authorization", `Bearer ${managerB.token}`)
      .send({});

    expect(responseB.status).toBe(200);
    expect(responseB.body.meeting.status).toBe("confirmed");
  });

  it("allows authorized manager to reopen a completed meeting with history", async () => {
    const manager = await createUser("mgr@example.com", "manager");
    const employee = await createUser("emp@example.com", "employee", manager.user._id);
    const customer = await createCustomer(employee.user._id);

    const meeting = await Meeting.create({
      customer: customer._id,
      assignedTo: employee.user._id,
      createdBy: employee.user._id,
      purpose: "Sales Pitch",
      scheduledStart: new Date("2026-11-20T10:00:00.000Z"),
      scheduledEnd: new Date("2026-11-20T11:00:00.000Z"),
      location: "Office",
      status: "completed",
      outcome: "not_interested",
    });

    // Employee cannot reopen -> 403 Forbidden
    const empReopen = await request(app)
      .patch(`/api/meetings/${meeting._id}/reopen`)
      .set("Authorization", `Bearer ${employee.token}`)
      .send({ reason: "Customer contacted again" });
    expect(empReopen.status).toBe(403);

    // Manager reopens -> 200 OK
    const mgrReopen = await request(app)
      .patch(`/api/meetings/${meeting._id}/reopen`)
      .set("Authorization", `Bearer ${manager.token}`)
      .send({ reason: "Customer contacted again wishing to reconsider" });
    expect(mgrReopen.status).toBe(200);
    expect(mgrReopen.body.meeting.status).toBe("scheduled");
    expect(mgrReopen.body.meeting.outcome).toBeNull();

    // Verify reopenHistory preserved
    const updated = await Meeting.findById(meeting._id);
    expect(updated.reopenHistory).toHaveLength(1);
    expect(updated.reopenHistory[0].reason).toBe("Customer contacted again wishing to reconsider");
    expect(updated.reopenHistory[0].previousOutcome).toBe("not_interested");
  });
});
