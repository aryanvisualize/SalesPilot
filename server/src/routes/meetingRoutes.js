
import express from "express";
import { protect } from "../middleware/auth.js";

import {
  createMeetingController,
  listMeetingsController,
  getMeetingController,
  updateMeetingController,
} from "../controllers/meetingController.js";

const router = express.Router();

router.use(protect);

router.post("/", createMeetingController);
router.get("/", listMeetingsController);
router.get("/:id", getMeetingController);
router.patch("/:id", updateMeetingController);

export default router;
