
import express from "express";
import { protect } from "../middleware/auth.js";

import {
  createFollowUpController,
  listFollowUpsController,
  completeFollowUpController,
} from "../controllers/followUpController.js";

const router = express.Router();

router.use(protect);

router.post("/", createFollowUpController);
router.get("/", listFollowUpsController);
router.patch("/:id/complete", completeFollowUpController);

export default router;
