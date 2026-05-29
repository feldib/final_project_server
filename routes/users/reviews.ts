import { Router } from "express";

import {
  getReviewsOfUserController,
  postReviewController,
} from "../../controllers/users.js";
import { verifyUser } from "../../db_api/verify.js";

const router = Router();

router.post("/review", verifyUser, postReviewController);

router.get(
  "/get_reviews_of_user",
  verifyUser,
  getReviewsOfUserController
);

export default router;
