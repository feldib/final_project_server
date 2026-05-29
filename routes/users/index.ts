import { Router } from "express";

import messagesRouter from "./messages.js";
import ordersRouter from "./orders.js";
import profileRouter from "./profile.js";
import reviewsRouter from "./reviews.js";
import shoppingCartRouter from "./shopping-cart.js";
import wishlistRouter from "./wishlist.js";

const router = Router();

// Mount all user sub-routers
router.use(messagesRouter);
router.use(ordersRouter);
router.use(profileRouter);
router.use(reviewsRouter);
router.use(shoppingCartRouter);
router.use(wishlistRouter);

export default router;
