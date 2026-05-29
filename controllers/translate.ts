import { Request, Response } from "express";

import { TranslateRequest, TranslateResponse } from "../types/api.js";
import deepLService from "../utils/deepl.js";

export async function translateController (
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
