import express from "express";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import {
  createUserController,
  listAssignableUsersController,
  listUsersController,
} from "../controllers/userController.js";

const router = express.Router();

router.use(protect);

router.get("/assignees", authorize("admin", "manager"), listAssignableUsersController);

router.use(authorize("admin"));

router.post("/", createUserController);
router.get("/", listUsersController);

export default router;
