import { Router } from "express";

import { addToShoppingCartController, addToWishlistedController, checkIfWishlistedController, deleteFromShoppingCartController, getOrdersOfUserController, getReviewsOfUserController, getShoppingCartController, getWishlistController, makeOrderController, messageToAdministratorController, postReviewController, registerUserController, removeFromWishlistedController, updateShoppingCartController, updateUserDataController } from "../controllers/users.js";
import { verifyUser } from "../db_api/verify.js";

const router = Router();

router.post(
  "/message_to_administrator",
  messageToAdministratorController
);

router.get(
  "/shopping_cart",
  verifyUser,
  getShoppingCartController
);

router.post(
  "/shopping_cart",
  verifyUser,
  addToShoppingCartController
);

router.put(
  "/shopping_cart",
  verifyUser,
  updateShoppingCartController
);

router.delete(
  "/shopping_cart/:artwork_id",
  verifyUser,
  deleteFromShoppingCartController
);

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

router.post("/update_data", verifyUser, updateUserDataController);

router.post(
  "/new_user",
  registerUserController
);

router.post("/make_order", verifyUser, makeOrderController);

router.post("/review", verifyUser, postReviewController);

router.get(
  "/get_orders_of_user",
  verifyUser,
  getOrdersOfUserController
);

router.get(
  "/get_reviews_of_user",
  verifyUser,
  getReviewsOfUserController
);

export default router;
