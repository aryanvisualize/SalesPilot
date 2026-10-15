import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

dotenv.config();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function bootstrapAdmin() {
  const args = process.argv.slice(2);
  const email = (args[0] || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = args[1] || process.env.ADMIN_PASSWORD || "";
  const name = (args[2] || process.env.ADMIN_NAME || "System Admin").trim();

  if (!email || !password) {
    console.error("Error: Admin email and password are required.");
    console.log("Usage: node src/scripts/createAdmin.js <email> <password> [name]");
    console.log("Or set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env");
    process.exit(1);
  }

  if (!EMAIL_REGEX.test(email)) {
    console.error("Error: Invalid email format.");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Error: Password must be at least 8 characters long.");
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error("Error: MONGODB_URI is not defined in environment.");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.role === "admin") {
        console.log(`Admin account for '${email}' already exists.`);
      } else {
        console.error(`User with email '${email}' exists with role '${existingUser.role}'.`);
      }
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });

    console.log(`Admin account successfully created for ${admin.email} (ID: ${admin._id}).`);
  } catch (error) {
    console.error("Failed to create admin:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

bootstrapAdmin();
