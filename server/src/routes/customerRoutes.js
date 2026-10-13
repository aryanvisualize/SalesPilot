
import express from "express";
import { protect } from "../middleware/auth.js";
import {
  createCustomer,
  listCustomers,
} from "../controllers/customerController.js";

const router = express.Router();

router.use(protect);

router.post("/", createCustomer);
router.get("/", listCustomers);

export default router;
