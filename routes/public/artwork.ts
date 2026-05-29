import { Router } from "express";

import {
  findArtworkByIdController,
  getArtworkController,
  getReviewsController,
} from "../../controllers/index.js";

const router = Router();

router.get("/find_artwork_by_id", findArtworkByIdController);

router.get("/artwork", getArtworkController);

router.get("/reviews", getReviewsController);

export default router;
