import { Router } from "express";

import {
  registerUserController,
  updateUserDataController,
} from "../../controllers/users.js";
import { verifyUser } from "../../db_api/verify.js";

const router = Router();

router.post("/update_data", verifyUser, updateUserDataController);

router.post(
  "/new_user",
  registerUserController
);

export default router;
