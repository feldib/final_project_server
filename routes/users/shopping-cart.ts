import { Router } from "express";

import {
  addToShoppingCartController,
  deleteFromShoppingCartController,
  getShoppingCartController,
  updateShoppingCartController,
} from "../../controllers/users.js";
import { verifyUser } from "../../db_api/verify.js";

const router = Router();

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

export default router;
