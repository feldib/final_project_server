import { Router } from "express";

import authRouter from "./auth.js";
import artworkRouter from "./artwork.js";
import featuredRouter from "./featured.js";
import imagesRouter from "./images.js";
import messagesRouter from "./messages.js";
import ordersRouter from "./orders.js";
import reviewsRouter from "./reviews.js";
import usersRouter from "./users.js";

const router = Router();

// Mount all admin sub-routers
router.use(authRouter);
router.use(artworkRouter);
router.use(featuredRouter);
router.use(imagesRouter);
router.use(messagesRouter);
router.use(ordersRouter);
router.use(reviewsRouter);
router.use(usersRouter);

export default router;
