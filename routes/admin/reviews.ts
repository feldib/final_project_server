import { Router } from "express";

import {
  deleteReviewsController,
  getReviewsController,
  putReviewsController,
} from "../../controllers/admin.js";
import { verifyAdmin } from "../../db_api/verify.js";

const router = Router();

router.get(
  "/unapproved_reviews",
  verifyAdmin,
  getReviewsController
);

router.put(
  "/reviews/:id",
  verifyAdmin,
  putReviewsController
);

router.delete(
  "/reviews/:id",
  verifyAdmin,
  deleteReviewsController
);

export default router;
