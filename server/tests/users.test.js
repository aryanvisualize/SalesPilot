import { describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import app from "../src/app.js";
import User from "../src/models/User.js";

async function createAuthUser(email, role = "employee") {
  const user = await User.create({
    name: `Test ${role}`,
    email,
    password: await bcrypt.hash("SalesPilot123!", 4),
    role,
  });

  const token = jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET || "test-secret",
    { expiresIn: "1h" }
  );

  return { user, token };
}

describe("SalesPilot User Management API", () => {
  it("allows Admin to create an employee", async () => {
    const admin = await createAuthUser("admin1@example.com", "admin");

    const response = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        name: "Alice Employee",
        email: "alice@example.com",
        password: "Password123!",
        role: "employee",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.user.role).toBe("employee");
    expect(response.body.user.email).toBe("alice@example.com");
    expect(response.body.user.password).toBeUndefined();
  });

  it("allows Admin to create a manager", async () => {
    const admin = await createAuthUser("admin2@example.com", "admin");

    const response = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        name: "Bob Manager",
        email: "bob.mgr@example.com",
        password: "Password123!",
        role: "manager",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.user.role).toBe("manager");
    expect(response.body.user.email).toBe("bob.mgr@example.com");
  });

  it("allows Admin to create an employee assigned to an existing manager", async () => {
    const admin = await createAuthUser("admin3@example.com", "admin");
    const manager = await createAuthUser("teamlead@example.com", "manager");

    const response = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        name: "Charlie Sales",
        email: "charlie@example.com",
        password: "Password123!",
        role: "employee",
        manager: manager.user._id.toString(),
      });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe("employee");
    expect(response.body.user.manager.toString()).toBe(manager.user._id.toString());
  });

  it("does not allow an Employee to create users", async () => {
    const employee = await createAuthUser("emp.regular@example.com", "employee");

    const response = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${employee.token}`)
      .send({
        name: "Unauthorized User",
        email: "unauth@example.com",
        password: "Password123!",
        role: "employee",
      });

    expect(response.status).toBe(403);
  });

  it("does not allow a Manager to create users", async () => {
    const manager = await createAuthUser("mgr.regular@example.com", "manager");

    const response = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${manager.token}`)
      .send({
        name: "Unauthorized User",
        email: "unauth2@example.com",
        password: "Password123!",
        role: "employee",
      });

    expect(response.status).toBe(403);
  });

  it("rejects duplicate email registration", async () => {
    const admin = await createAuthUser("admin4@example.com", "admin");
    await createAuthUser("existing@example.com", "employee");

    const response = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        name: "Duplicate User",
        email: "existing@example.com",
        password: "Password123!",
        role: "employee",
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/already registered/i);
  });

  it("hashes passwords before storing in the database", async () => {
    const admin = await createAuthUser("admin5@example.com", "admin");
    const rawPassword = "SuperSecurePassword999!";

    const response = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        name: "Security Test User",
        email: "security@example.com",
        password: rawPassword,
        role: "employee",
      });

    expect(response.status).toBe(201);

    const savedUser = await User.findById(response.body.user.id).select("+password");
    expect(savedUser.password).not.toBe(rawPassword);
    expect(await bcrypt.compare(rawPassword, savedUser.password)).toBe(true);
  });

  it("ensures public registration requests cannot create an Admin account", async () => {
    // Attempt public registration requesting admin role
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Malicious Actor",
        email: "badactor@example.com",
        password: "Password123!",
        role: "admin",
      });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe("employee");

    const saved = await User.findOne({ email: "badactor@example.com" });
    expect(saved.role).toBe("employee");

    // Public request to /api/users without token is rejected
    const unauthCreate = await request(app)
      .post("/api/users")
      .send({
        name: "Public Attacker",
        email: "attacker@example.com",
        password: "Password123!",
        role: "admin",
      });

    expect(unauthCreate.status).toBe(401);
  });

  it("rejects invalid manager assignments", async () => {
    const admin = await createAuthUser("admin6@example.com", "admin");
    const employee = await createAuthUser("non.manager@example.com", "employee");

    // Invalid ObjectId format
    const resInvalidId = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        name: "Test User",
        email: "test.invalid@example.com",
        password: "Password123!",
        role: "employee",
        manager: "not-a-valid-id",
      });

    expect(resInvalidId.status).toBe(400);

    // Assigning a user with role 'employee' as manager
    const resEmployeeAsMgr = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        name: "Test User 2",
        email: "test.emp.as.mgr@example.com",
        password: "Password123!",
        role: "employee",
        manager: employee.user._id.toString(),
      });

    expect(resEmployeeAsMgr.status).toBe(400);
    expect(resEmployeeAsMgr.body.message).toMatch(/must be an existing user with the manager role/i);
  });
});
