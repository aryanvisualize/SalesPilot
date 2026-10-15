import express from "express";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import {
  createUserController,
  listUsersController,
} from "../controllers/userController.js";

const router = express.Router();

router.use(protect);
router.use(authorize("admin"));

router.post("/", createUserController);
router.get("/", listUsersController);

export default router;
