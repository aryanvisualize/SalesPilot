
import express from "express";
import { protect } from "../middleware/auth.js";

import {
  confirmMeetingController,
  checkInMeetingController,
  startMeetingController,
  checkOutMeetingController,
} from "../controllers/meetingLifecycleController.js";

const router = express.Router();

router.use(protect);

router.patch("/:id/confirm", confirmMeetingController);
router.post("/:id/check-in", checkInMeetingController);
router.patch("/:id/start", startMeetingController);
router.post("/:id/check-out", checkOutMeetingController);

export default router;
