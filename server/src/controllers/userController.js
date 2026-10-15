import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createUserController(req, res) {
  try {
    const { name, email, password, role, manager } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !EMAIL_REGEX.test(email.trim()) ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, valid email, and password of at least 8 characters are required",
      });
    }

    if (!role || !["employee", "manager", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Valid role is required (employee or manager)",
      });
    }

    let managerId = null;

    if (manager) {
      if (!mongoose.isValidObjectId(manager)) {
        return res.status(400).json({
          success: false,
          message: "Invalid manager ID",
        });
      }

      const assignedManager = await User.findById(manager);

      if (!assignedManager || assignedManager.role !== "manager") {
        return res.status(400).json({
          success: false,
          message: "Assigned manager must be an existing user with the manager role",
        });
      }

      managerId = assignedManager._id;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      manager: managerId,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        manager: user.manager,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    console.error("Create user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create user",
    });
  }
}

export async function listUsersController(req, res) {
  try {
    const users = await User.find()
      .select("-password")
      .populate("manager", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((u) => ({
        id: u._id,
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        manager: u.manager,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    console.error("List users error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to list users",
    });
  }
}
