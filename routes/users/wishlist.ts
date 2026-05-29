import { Router } from "express";

import {
  addToWishlistedController,
  checkIfWishlistedController,
  getWishlistController,
  removeFromWishlistedController,
} from "../../controllers/users.js";
import { verifyUser } from "../../db_api/verify.js";

const router = Router();

router.get(
  "/wishlist",
  verifyUser,
  getWishlistController
);

router.get(
  "/wishlist/:artwork_id",
  verifyUser,
  checkIfWishlistedController
);

router.post(
  "/wishlist",
  verifyUser,
  addToWishlistedController
);

router.delete(
  "/wishlist/:artwork_id",
  verifyUser,
  removeFromWishlistedController
);

export default router;
