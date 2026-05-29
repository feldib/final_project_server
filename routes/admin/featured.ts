import { Router } from "express";

import {
  deleteFeaturedController,
  getFeaturedController,
  postFeaturedController,
} from "../../controllers/admin.js";
import { verifyAdmin } from "../../db_api/verify.js";

const router = Router();

router.get(
  "/featured/:id",
  verifyAdmin,
  getFeaturedController
);

router.post(
  "/featured",
  verifyAdmin,
  postFeaturedController
);

router.delete(
  "/featured/:id",
  verifyAdmin,
  deleteFeaturedController
);

export default router;
