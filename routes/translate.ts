import { Request, Response, Router } from "express";

import { TranslateRequest, TranslateResponse } from "../types/api.js";
import deepLService from "../utils/deepl.js";

const router = Router();

/**
 * Translate text using DeepL API
 * Body: { text: string, targetLanguage: string }
 */
router.post(
  "/translate",
  async function (
    req: Request<object, TranslateResponse, TranslateRequest>,
    res: Response<TranslateResponse>
  ) {
    try {
      const { text, targetLanguage } = req.body;

      if (!text || !targetLanguage) {
        return res.status(400).json({
          translatedText: "",
          // @ts-expect-error - Error response format
          error: "Text and target language are required",
        });
      }

      const translatedText = await deepLService.translateText(
        text,
        targetLanguage
      );

      res.json({
        translatedText,
      });
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({
        translatedText: "",
        // @ts-expect-error - Error response format
        error: "Translation failed",
      });
    }
  }
);

export default router;
