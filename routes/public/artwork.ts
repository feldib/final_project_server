import { Router } from "express";

import {
  findArtworkByIdController,
  getArtworkController,
  getReviewsController,
} from "../../controllers/index.js";
import { cacheMiddleware } from "../../utils/cacheMiddleware.js";
import { CACHE } from "../../utils/constants.js";

const router = Router();

router.get("/find_artwork_by_id", cacheMiddleware({ ttlSeconds: CACHE.ARTWORKS_TTL }), findArtworkByIdController);

router.get("/artwork", cacheMiddleware({ ttlSeconds: CACHE.ARTWORKS_TTL }), getArtworkController);

router.get("/reviews", cacheMiddleware({ ttlSeconds: CACHE.REVIEWS_TTL }), getReviewsController);

export default router;
