import { Router } from "express";

import {
  forgotPasswordController,
  resetPasswordController,
} from "../../controllers/index.js";
import { verifyPaswordToken } from "../../db_api/verify.js";

const router = Router();

router.post("/forgot_password", forgotPasswordController);

router.post(
  "/reset_password",
  verifyPaswordToken,
  resetPasswordController
);

export default router;
