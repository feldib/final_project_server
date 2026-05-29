import { Router } from "express";

import { addNewArtworkUpload, authenticateAdminController, deleteArtworkController, deleteFeaturedController, deleteImagesController, deleteReviewsController, getFeaturedController, getOrdersController, getOrdersOfUserController, getRegisteredUsersController, getReviewsController, getUnansweredMessagesController, postArtworkController, postFeaturedController, postImagesController, postReplyToMessageController, putArtworkController, putImagesController, putReviewsController } from "../controllers/admin.js";
import { verifyAdmin } from "../db_api/verify.js";

const router = Router();

// Admin authentication check endpoint
router.get("/is_admin", verifyAdmin, authenticateAdminController);

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

router.get(
  "/unapproved_reviews",
  verifyAdmin,
  getReviewsController
);

router.put(
  "/reviews/:id",
  verifyAdmin,
  putReviewsController
);

router.delete(
  "/reviews/:id",
  verifyAdmin,
  deleteReviewsController
);

router.get("/orders", verifyAdmin, getOrdersController);

router.get(
  "/unanswered_messages",
  verifyAdmin,
  getUnansweredMessagesController
);

router.post(
  "/reply_to_message",
  verifyAdmin,
  postReplyToMessageController
);

router.get("/users", verifyAdmin, getRegisteredUsersController);

router.get(
  "/orders_of_user",
  verifyAdmin,
  getOrdersOfUserController
);

router.get(
  "/featured/:id",
  verifyAdmin,
  getFeaturedController
);

router.post(
  "/featured",
  verifyAdmin,
  postFeaturedController
);

router.delete(
  "/featured/:id",
  verifyAdmin,
  deleteFeaturedController
);

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
