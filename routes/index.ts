import { Router } from "express";

import { findArtworkByIdController, forgotPasswordController, getArtworkController, getCategoriesController, getFeaturedController, getLoggedInUserController, getNewestArtworksController, getReviewsController, getWishlistedTheMostController, loginController, logoutController, resetPasswordController } from "../controllers/index.js";
import { verifyPaswordToken, verifyUser } from "../db_api/verify.js";
import { cacheMiddleware } from "../utils/cacheMiddleware.js";
import { CACHE } from "../utils/constants.js";

const router = Router();

router.post(
  "/login",
  loginController
);

router.get(
  "/logged_in",
  verifyUser,
  getLoggedInUserController
);

router.get("/log_out", logoutController);

router.post(
  "/forgot_password",
  forgotPasswordController
);

router.post(
  "/reset_password",
  verifyPaswordToken,
  resetPasswordController
);

router.get(
  "/categories",
  cacheMiddleware({ ttlSeconds: CACHE.CATEGORIES_TTL }),
  getCategoriesController
);

router.get("/find_artwork_by_id", findArtworkByIdController);

//artwork page
router.get("/artwork", getArtworkController);

router.get("/reviews", getReviewsController);

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
