import { Router } from "express";

import {
  addNewArtworkUpload,
  deleteArtworkController,
  postArtworkController,
  putArtworkController,
} from "../../controllers/admin.js";
import { verifyAdmin } from "../../db_api/verify.js";

const router = Router();

router.delete(
  "/artworks/:id",
  verifyAdmin,
  deleteArtworkController
);

router.post(
  "/artwork",
  verifyAdmin,
  addNewArtworkUpload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "other_pictures", maxCount: 10 },
  ]),
  postArtworkController
);

router.put(
  "/artwork",
  verifyAdmin,
  putArtworkController
);

export default router;
