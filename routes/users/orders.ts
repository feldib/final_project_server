import { Router } from "express";

import {
  getOrdersOfUserController,
  makeOrderController,
} from "../../controllers/users.js";
import { verifyUser } from "../../db_api/verify.js";

const router = Router();

router.post("/make_order", verifyUser, makeOrderController);

router.get(
  "/get_orders_of_user",
  verifyUser,
  getOrdersOfUserController
);

export default router;
