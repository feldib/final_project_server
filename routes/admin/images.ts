import { Router } from "express";

import {
  deleteImagesController,
  postImagesController,
  putImagesController,
} from "../../controllers/admin.js";
import { verifyAdmin } from "../../db_api/verify.js";

const router = Router();

router.post(
  "/artworks/:id/images",
  verifyAdmin,
  postImagesController
);

router.put(
  "/artworks/:id/images",
  verifyAdmin,
  putImagesController
);

router.delete(
  "/artworks/:id/images/:filename",
  verifyAdmin,
  deleteImagesController
);

export default router;
