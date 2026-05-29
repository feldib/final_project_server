import { Router } from "express";

import {
  getLoggedInUserController,
  loginController,
  logoutController,
} from "../../controllers/index.js";
import { verifyUser } from "../../db_api/verify.js";

const router = Router();

router.post("/login", loginController);

router.get("/logged_in", verifyUser, getLoggedInUserController);

router.get("/log_out", logoutController);

export default router;
