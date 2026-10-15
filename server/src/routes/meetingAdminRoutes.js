
import express from "express";
import { protect } from "../middleware/auth.js";
import { reopenMeetingController } from "../controllers/meetingAdminController.js";

const router = express.Router();

router.patch("/:id/reopen", protect, reopenMeetingController);

export default router;
