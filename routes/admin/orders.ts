import { Router } from "express";

import {
  getOrdersController,
  getOrdersOfUserController,
} from "../../controllers/admin.js";
import { verifyAdmin } from "../../db_api/verify.js";

const router = Router();

router.get("/orders", verifyAdmin, getOrdersController);

router.get(
  "/orders_of_user",
  verifyAdmin,
  getOrdersOfUserController
);

export default router;
