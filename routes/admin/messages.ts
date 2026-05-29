import { Router } from "express";

import {
  getUnansweredMessagesController,
  postReplyToMessageController,
} from "../../controllers/admin.js";
import { verifyAdmin } from "../../db_api/verify.js";

const router = Router();

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

export default router;
