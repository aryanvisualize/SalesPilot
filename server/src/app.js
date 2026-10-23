import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import { protect } from "./middleware/auth.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import meetingLifecycleRoutes from "./routes/meetingLifecycleRoutes.js";
import followUpRoutes from "./routes/followUpRoutes.js";
import meetingAdminRoutes from "./routes/meetingAdminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

const app = express();

// Parse configured frontend client URLs from environment
const configuredClients = (process.env.CLIENT_URL || "")
  .split(",")
  .map((url) => url.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const allowedOrigins = [
  "http://localhost:5173",
  ...configuredClients.filter((url) => url !== "*"),
  process.env.FRONTEND_URL?.trim().replace(/\/+$/, ""),
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., server-to-server, curl, mobile apps, uptime monitors)
      if (!origin) return callback(null, true);

      if (
        process.env.NODE_ENV !== "production" ||
        configuredClients.includes("*") ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error(`CORS policy: Origin '${origin}' is not allowed.`));
    },
    credentials: true,
  })
);

app.use(express.json());

// Public health verification endpoints
app.get(["/health", "/api/health"], (req, res) => {
  res.status(200).json({
    success: true,
    message: "SalesPilot API is running",
    timestamp: new Date().toISOString(),
  });
});

// Application API routes
app.use("/api/meetings", meetingRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/meetings", meetingLifecycleRoutes);
app.use("/api/follow-ups", followUpRoutes);
app.use("/api/meetings", meetingAdminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/api/auth/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// Centralized 404 handler for unrecognized routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Endpoint not found`,
  });
});

// Centralized error-handling middleware (prevents stack trace leaks in production)
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);

  const status = err.status || (err.message?.includes("CORS") ? 403 : 500);
  const message =
    process.env.NODE_ENV === "production" && status === 500
      ? "Internal Server Error"
      : err.message || "An unexpected error occurred.";

  res.status(status).json({
    success: false,
    message,
  });
});

export default app;