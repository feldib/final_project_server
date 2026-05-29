import { Router } from "express";

import {
  getCategoriesController,
  getFeaturedController,
  getNewestArtworksController,
  getWishlistedTheMostController,
} from "../../controllers/index.js";
import { cacheMiddleware } from "../../utils/cacheMiddleware.js";
import { CACHE } from "../../utils/constants.js";

const router = Router();

router.get(
  "/categories",
  cacheMiddleware({ ttlSeconds: CACHE.CATEGORIES_TTL }),
  getCategoriesController
);

router.get(
  "/featured",
  cacheMiddleware({ ttlSeconds: CACHE.ARTWORKS_TTL }),
  getFeaturedController
);

router.get(
  "/newest",
  cacheMiddleware({ ttlSeconds: CACHE.ARTWORKS_TTL }),
  getNewestArtworksController
);

router.get(
  "/most_wishlisted",
  cacheMiddleware({ ttlSeconds: CACHE.ARTWORKS_TTL }),
  getWishlistedTheMostController
);

export default router;
