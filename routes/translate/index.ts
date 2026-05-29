import { Router } from "express";

import { translateController } from "../../controllers/translate.js";

const router = Router();

/**
 * Translate text using DeepL API
 * Body: { text: string, targetLanguage: string }
 */
router.post(
  "/translate",
  translateController
);

export default router;
