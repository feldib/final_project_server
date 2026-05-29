import { Router } from "express";

import { getRegisteredUsersController } from "../../controllers/admin.js";
import { verifyAdmin } from "../../db_api/verify.js";

const router = Router();

router.get("/users", verifyAdmin, getRegisteredUsersController);

export default router;
