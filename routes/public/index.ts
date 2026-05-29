import { Router } from "express";

import artworkRouter from "./artwork.js";
import authRouter from "./auth.js";
import passwordRouter from "./password.js";
import searchRouter from "./search.js";

const router = Router();

// Mount all public sub-routers
router.use(authRouter);
router.use(passwordRouter);
router.use(artworkRouter);
router.use(searchRouter);

export default router;
