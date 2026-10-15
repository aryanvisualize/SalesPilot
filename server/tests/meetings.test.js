
import { describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import app from "../src/app.js";
import User from "../src/models/User.js";
import Customer from "../src/models/Customer.js";
import Meeting from "../src/models/Meeting.js";

async function createEmployee(email = "employee@example.com") {
  const user = await User.create({
    name: "Test Employee",
    email,
    password: await bcrypt.hash("SalesPilot123!", 4),
    role: "employee",
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
    const { user, token } = await createEmployee();
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
    const { user, token } = await createEmployee();
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
    const { user, token } = await createEmployee();
    const other = await createEmployee("other@example.com");
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
    const { user, token } = await createEmployee();
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
});
