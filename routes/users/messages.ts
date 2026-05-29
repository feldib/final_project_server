import { Router } from "express";

import { messageToAdministratorController } from "../../controllers/users.js";

const router = Router();

router.post(
  "/message_to_administrator",
  messageToAdministratorController
);

export default router;
