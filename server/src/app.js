import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import { protect } from "./middleware/auth.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());
app.use("/api/meetings", meetingRoutes);
app.use("/api/customers", customerRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SalesPilot API is running",
  });
});

app.use("/api/auth", authRoutes);

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

export default app;