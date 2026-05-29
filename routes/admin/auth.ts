import { Router } from "express";

import { authenticateAdminController } from "../../controllers/admin.js";
import { verifyAdmin } from "../../db_api/verify.js";

const router = Router();

// Admin authentication check endpoint
router.get("/is_admin", verifyAdmin, authenticateAdminController);

export default router;
